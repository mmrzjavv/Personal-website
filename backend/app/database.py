from __future__ import annotations

import json
import logging
import re
import unicodedata
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import quote

import psycopg
from psycopg.rows import dict_row

from .settings import Settings
from .storage import ObjectStorage

logger = logging.getLogger(__name__)

# The source tree runs this module from ``<project>/backend/app`` while the
# image runs it from ``/app/app``. Pick the first parent that contains the
# bundled seed data so startup behaves the same in both environments.
_ROOT_CANDIDATES = (Path(__file__).resolve().parents[2], Path(__file__).resolve().parents[1])
ROOT = next(
    (candidate for candidate in _ROOT_CANDIDATES if (candidate / "data" / "projects.json").exists()),
    _ROOT_CANDIDATES[0],
)


def connect(settings: Settings) -> psycopg.Connection:
    return psycopg.connect(settings.database_dsn, row_factory=dict_row)


def init_schema(settings: Settings) -> None:
    with connect(settings) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS portfolio_projects (
                id BIGSERIAL PRIMARY KEY,
                slug TEXT NOT NULL UNIQUE,
                num INTEGER NOT NULL DEFAULT 1,
                title_fa TEXT NOT NULL,
                title_en TEXT NOT NULL DEFAULT '',
                description_fa TEXT NOT NULL DEFAULT '',
                description_en TEXT NOT NULL DEFAULT '',
                details_fa TEXT NOT NULL DEFAULT '',
                details_en TEXT NOT NULL DEFAULT '',
                project_url TEXT,
                stack TEXT[] NOT NULL DEFAULT '{}',
                highlights TEXT[] NOT NULL DEFAULT '{}',
                align TEXT NOT NULL DEFAULT 'left' CHECK (align IN ('left', 'right')),
                section TEXT NOT NULL DEFAULT 'project1',
                preview_mode TEXT NOT NULL DEFAULT 'iframe',
                published BOOLEAN NOT NULL DEFAULT TRUE,
                sort_order INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
            """
        )
        connection.execute("ALTER TABLE portfolio_projects ADD COLUMN IF NOT EXISTS details_fa TEXT NOT NULL DEFAULT ''")
        connection.execute("ALTER TABLE portfolio_projects ADD COLUMN IF NOT EXISTS details_en TEXT NOT NULL DEFAULT ''")
        connection.execute("ALTER TABLE portfolio_projects ALTER COLUMN project_url DROP NOT NULL")
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS portfolio_project_images (
                id BIGSERIAL PRIMARY KEY,
                project_id BIGINT NOT NULL REFERENCES portfolio_projects(id) ON DELETE CASCADE,
                object_key TEXT,
                local_url TEXT,
                alt_text TEXT NOT NULL DEFAULT '',
                sort_order INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                CONSTRAINT portfolio_project_images_source_check
                    CHECK (object_key IS NOT NULL OR local_url IS NOT NULL)
            )
            """
        )
        connection.execute(
            "CREATE INDEX IF NOT EXISTS portfolio_projects_sort_idx ON portfolio_projects (sort_order, id)"
        )
        connection.execute(
            "CREATE INDEX IF NOT EXISTS portfolio_project_images_project_idx ON portfolio_project_images (project_id, sort_order)"
        )
    seed_from_json(settings)


def seed_from_json(settings: Settings) -> None:
    source = ROOT / "data" / "projects.json"
    if not source.exists():
        return
    try:
        payload = json.loads(source.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        logger.warning("Could not read project seed data: %s", error)
        return

    with connect(settings) as connection:
        for order, project in enumerate(payload.get("projects", [])):
            existing = connection.execute(
                "SELECT id, details_fa FROM portfolio_projects WHERE slug = %s",
                (project.get("slug"),),
            ).fetchone()
            if existing:
                if not existing["details_fa"]:
                    connection.execute(
                        """
                        UPDATE portfolio_projects
                        SET description_fa = %s, description_en = %s,
                            details_fa = %s, details_en = %s
                        WHERE id = %s
                        """,
                        (
                            project.get("desc", {}).get("fa", ""),
                            project.get("desc", {}).get("en", ""),
                            project.get("details", {}).get("fa", ""),
                            project.get("details", {}).get("en", ""),
                            existing["id"],
                        ),
                    )
                continue
            cursor = connection.execute(
                """
                INSERT INTO portfolio_projects
                    (slug, num, title_fa, title_en, description_fa, description_en,
                     details_fa, details_en,
                     project_url, stack, highlights, align, section, sort_order)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    project["slug"],
                    int(project.get("num", str(order + 1))),
                    project.get("name", {}).get("fa", project["slug"]),
                    project.get("name", {}).get("en", project["slug"]),
                    project.get("desc", {}).get("fa", ""),
                    project.get("desc", {}).get("en", ""),
                    project.get("details", {}).get("fa", ""),
                    project.get("details", {}).get("en", ""),
                    project.get("url") or None,
                    project.get("stack", []),
                    project.get("highlights", []),
                    project.get("align", "left"),
                    project.get("section", f"project{order + 1}"),
                    order,
                ),
            )
            project_id = cursor.fetchone()["id"]
            for image_order, local_url in enumerate(project.get("media", [])):
                connection.execute(
                    """
                    INSERT INTO portfolio_project_images (project_id, local_url, sort_order)
                    VALUES (%s, %s, %s)
                    """,
                    (project_id, local_url, image_order),
                )


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", normalized).strip("-").lower()
    return slug or "project"


def next_slug(connection: psycopg.Connection, value: str) -> str:
    base = slugify(value)
    candidate = base
    index = 2
    while connection.execute("SELECT 1 FROM portfolio_projects WHERE slug = %s", (candidate,)).fetchone():
        candidate = f"{base}-{index}"
        index += 1
    return candidate


def _image_url(row: dict[str, Any], storage: ObjectStorage | None) -> str:
    if row.get("local_url"):
        return row["local_url"]
    if row.get("object_key") and storage:
        # Keep object storage private. The Next.js same-origin proxy forwards
        # this path to the API, so browsers never need direct MinIO access.
        return f"/api/media/{quote(row['object_key'], safe='/')}"
    return ""


def _to_project(row: dict[str, Any], images: Iterable[dict[str, Any]], storage: ObjectStorage | None) -> dict[str, Any]:
    media_items = []
    for image in images:
        url = _image_url(image, storage)
        if url:
            media_items.append({
                "id": image["id"],
                "url": url,
                "alt": image.get("alt_text", ""),
            })
    media = [item["url"] for item in media_items]
    return {
        "id": row["id"],
        "slug": row["slug"],
        "num": f"{row['num']:02d}",
        "name": {"fa": row["title_fa"], "en": row["title_en"] or row["title_fa"]},
        "stack": row["stack"] or [],
        "desc": {
            "fa": row["description_fa"],
            "en": row["description_en"] or row["description_fa"],
        },
        "details": {
            "fa": row.get("details_fa") or row["description_fa"],
            "en": row.get("details_en") or row["description_en"] or row["description_fa"],
        },
        "url": row["project_url"],
        "media": media,
        "mediaItems": media_items,
        "highlights": row["highlights"] or [],
        "align": row["align"],
        "section": row["section"],
        "published": row["published"],
    }


def list_projects(settings: Settings, storage: ObjectStorage | None, *, published_only: bool = True) -> list[dict[str, Any]]:
    where = "WHERE published = TRUE" if published_only else ""
    with connect(settings) as connection:
        rows = connection.execute(
            f"SELECT * FROM portfolio_projects {where} ORDER BY sort_order ASC, id ASC"
        ).fetchall()
        result = []
        for row in rows:
            images = connection.execute(
                "SELECT * FROM portfolio_project_images WHERE project_id = %s ORDER BY sort_order ASC, id ASC",
                (row["id"],),
            ).fetchall()
            result.append(_to_project(row, images, storage))
        return result


def get_project(settings: Settings, storage: ObjectStorage | None, slug: str) -> dict[str, Any] | None:
    with connect(settings) as connection:
        row = connection.execute(
            "SELECT * FROM portfolio_projects WHERE slug = %s AND published = TRUE",
            (slug,),
        ).fetchone()
        if not row:
            return None
        images = connection.execute(
            "SELECT * FROM portfolio_project_images WHERE project_id = %s ORDER BY sort_order ASC, id ASC",
            (row["id"],),
        ).fetchall()
        return _to_project(row, images, storage)


def create_project(
    settings: Settings,
    *,
    title_fa: str,
    title_en: str,
    description_fa: str,
    description_en: str,
    project_url: str | None,
    stack: list[str],
    image_sources: list[dict[str, str | None]],
    storage: ObjectStorage | None,
) -> dict[str, Any]:
    with connect(settings) as connection:
        next_num = connection.execute("SELECT COALESCE(MAX(num), 0) + 1 AS next_num FROM portfolio_projects").fetchone()["next_num"]
        count = connection.execute("SELECT COUNT(*) AS count FROM portfolio_projects").fetchone()["count"]
        slug = next_slug(connection, title_en or title_fa)
        cursor = connection.execute(
            """
            INSERT INTO portfolio_projects
                (slug, num, title_fa, title_en, description_fa, description_en,
                 details_fa, details_en, project_url, stack, align, section, sort_order)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
            """,
            (
                slug,
                next_num,
                title_fa,
                title_en,
                description_fa,
                description_en,
                description_fa,
                description_en,
                project_url,
                stack,
                "left",
                f"project{next_num}",
                count,
            ),
        )
        row = cursor.fetchone()
        for index, source in enumerate(image_sources):
            connection.execute(
                """
                INSERT INTO portfolio_project_images (project_id, object_key, local_url, alt_text, sort_order)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (row["id"], source.get("object_key"), source.get("local_url"), title_fa, index),
            )
        images = connection.execute(
            "SELECT * FROM portfolio_project_images WHERE project_id = %s ORDER BY sort_order ASC, id ASC",
            (row["id"],),
        ).fetchall()
        return _to_project(row, images, storage)


def update_project(
    settings: Settings,
    project_id: int,
    *,
    title_fa: str,
    title_en: str,
    description_fa: str,
    description_en: str,
    project_url: str | None,
    stack: list[str],
    image_sources: list[dict[str, str | None]],
    replace_images: bool,
    storage: ObjectStorage | None,
) -> tuple[dict[str, Any] | None, list[str]]:
    """Update project metadata and optionally replace its uploaded gallery."""
    with connect(settings) as connection:
        row = connection.execute(
            "SELECT * FROM portfolio_projects WHERE id = %s",
            (project_id,),
        ).fetchone()
        if not row:
            return None, []

        old_object_keys: list[str] = []
        if replace_images:
            old_object_keys = [
                image["object_key"]
                for image in connection.execute(
                    "SELECT object_key FROM portfolio_project_images WHERE project_id = %s AND object_key IS NOT NULL",
                    (project_id,),
                ).fetchall()
            ]
            connection.execute("DELETE FROM portfolio_project_images WHERE project_id = %s", (project_id,))

        row = connection.execute(
            """
            UPDATE portfolio_projects
            SET title_fa = %s, title_en = %s,
                description_fa = %s, description_en = %s,
                details_fa = %s, details_en = %s,
                project_url = %s, stack = %s, updated_at = now()
            WHERE id = %s
            RETURNING *
            """,
            (
                title_fa,
                title_en,
                description_fa,
                description_en,
                description_fa,
                description_en,
                project_url,
                stack,
                project_id,
            ),
        ).fetchone()

        if image_sources:
            start_order = 0
            if not replace_images:
                start_order = connection.execute(
                    "SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM portfolio_project_images WHERE project_id = %s",
                    (project_id,),
                ).fetchone()["next_order"]
            for index, source in enumerate(image_sources):
                connection.execute(
                    """
                    INSERT INTO portfolio_project_images (project_id, object_key, local_url, alt_text, sort_order)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (project_id, source.get("object_key"), source.get("local_url"), title_fa, start_order + index),
                )

        images = connection.execute(
            "SELECT * FROM portfolio_project_images WHERE project_id = %s ORDER BY sort_order ASC, id ASC",
            (project_id,),
        ).fetchall()
        return _to_project(row, images, storage), old_object_keys


def delete_project(settings: Settings, project_id: int) -> list[str] | None:
    with connect(settings) as connection:
        images = connection.execute(
            "SELECT object_key FROM portfolio_project_images WHERE project_id = %s AND object_key IS NOT NULL",
            (project_id,),
        ).fetchall()
        deleted = connection.execute(
            "DELETE FROM portfolio_projects WHERE id = %s RETURNING id",
            (project_id,),
        ).fetchone()
        if not deleted:
            return None
        remaining = connection.execute(
            "SELECT id FROM portfolio_projects ORDER BY sort_order ASC, id ASC"
        ).fetchall()
        for order, project in enumerate(remaining):
            connection.execute(
                "UPDATE portfolio_projects SET sort_order = %s, num = %s WHERE id = %s",
                (order, order + 1, project["id"]),
            )
        return [image["object_key"] for image in images]


def reorder_projects(settings: Settings, project_ids: list[int]) -> None:
    with connect(settings) as connection:
        current = connection.execute(
            "SELECT id FROM portfolio_projects ORDER BY sort_order ASC, id ASC"
        ).fetchall()
        current_ids = [project["id"] for project in current]
        if len(project_ids) != len(set(project_ids)) or set(project_ids) != set(current_ids):
            raise ValueError("ترتیب پروژه‌ها کامل یا معتبر نیست")
        for order, project_id in enumerate(project_ids):
            connection.execute(
                "UPDATE portfolio_projects SET sort_order = %s, num = %s, updated_at = now() WHERE id = %s",
                (order, order + 1, project_id),
            )


def reorder_images(settings: Settings, project_id: int, image_ids: list[int]) -> None:
    with connect(settings) as connection:
        current = connection.execute(
            "SELECT id FROM portfolio_project_images WHERE project_id = %s ORDER BY sort_order ASC, id ASC",
            (project_id,),
        ).fetchall()
        current_ids = [image["id"] for image in current]
        if len(image_ids) != len(set(image_ids)) or set(image_ids) != set(current_ids):
            raise ValueError("ترتیب تصاویر کامل یا معتبر نیست")
        for order, image_id in enumerate(image_ids):
            connection.execute(
                "UPDATE portfolio_project_images SET sort_order = %s WHERE id = %s AND project_id = %s",
                (order, image_id, project_id),
            )


def delete_image(settings: Settings, project_id: int, image_id: int) -> str | None:
    with connect(settings) as connection:
        image = connection.execute(
            "SELECT object_key FROM portfolio_project_images WHERE id = %s AND project_id = %s",
            (image_id, project_id),
        ).fetchone()
        if not image:
            return None
        connection.execute(
            "DELETE FROM portfolio_project_images WHERE id = %s AND project_id = %s",
            (image_id, project_id),
        )
        return image["object_key"] or ""
