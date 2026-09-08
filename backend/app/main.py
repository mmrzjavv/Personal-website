from __future__ import annotations

import hmac
import logging
import uuid
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, HttpUrl

from .database import (
    create_project,
    delete_image,
    delete_project,
    get_project,
    init_schema,
    list_projects,
    reorder_images,
    reorder_projects,
    update_project,
)
from .settings import Settings, get_settings
from .storage import ObjectStorage

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
settings = get_settings()
storage = ObjectStorage(settings) if settings.minio_access_key and settings.minio_secret_key else None


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_schema(settings)
    if storage:
        storage.ensure_bucket()
    yield


app = FastAPI(title="Mohammadreza Portfolio Content API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ProjectOrderPayload(BaseModel):
    project_ids: list[int]


class ImageOrderPayload(BaseModel):
    image_ids: list[int]


def require_admin(x_admin_token: str | None = Header(default=None)) -> None:
    if not settings.admin_token:
        raise HTTPException(status_code=503, detail="ADMIN_TOKEN is not configured")
    if not x_admin_token or not hmac.compare_digest(x_admin_token, settings.admin_token):
        raise HTTPException(status_code=401, detail="Invalid admin token")


@app.get("/health")
def health() -> dict[str, str | bool]:
    return {"status": "ok", "storageConfigured": storage is not None}


@app.get("/api/projects")
def public_projects() -> list[dict]:
    return list_projects(settings, storage)


@app.get("/api/projects/{slug}")
def public_project(slug: str) -> dict:
    project = get_project(settings, storage, slug)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@app.get("/api/media/{object_key:path}")
def project_media(object_key: str) -> Response:
    if not storage:
        raise HTTPException(status_code=503, detail="MinIO is not configured")
    try:
        payload, content_type = storage.read(object_key)
    except Exception as error:
        logger.warning("Could not read media object %s: %s", object_key, error)
        raise HTTPException(status_code=404, detail="Media not found") from error
    return Response(
        content=payload,
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=86400, immutable"},
    )


@app.get("/api/admin/projects", dependencies=[Depends(require_admin)])
def admin_projects() -> list[dict]:
    return list_projects(settings, storage, published_only=False)


@app.patch("/api/admin/projects/reorder", dependencies=[Depends(require_admin)])
def reorder_admin_projects(payload: ProjectOrderPayload) -> list[dict]:
    try:
        reorder_projects(settings, payload.project_ids)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return list_projects(settings, storage, published_only=False)


@app.post("/api/admin/projects", dependencies=[Depends(require_admin)])
async def add_project(
    title_fa: str = Form(..., min_length=1, max_length=180),
    title_en: str = Form("", max_length=180),
    description_fa: str = Form("", max_length=2000),
    description_en: str = Form("", max_length=2000),
    project_url: HttpUrl = Form(...),
    stack: str = Form(""),
    images: list[UploadFile] = File(default=[]),
) -> dict:
    if not storage:
        raise HTTPException(status_code=503, detail="MinIO credentials are not configured")

    image_sources: list[dict[str, str | None]] = []
    for image in images:
        if not image.content_type or not image.content_type.startswith("image/"):
            raise HTTPException(status_code=415, detail="Only image files are allowed")
        payload = await image.read()
        if len(payload) > 8 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Each image must be 8 MB or smaller")
        suffix = (image.filename or "image").rsplit(".", 1)[-1].lower()
        object_key = f"projects/{uuid.uuid4().hex}.{suffix}"
        try:
            storage.put(object_key, payload, image.content_type)
        except Exception as error:
            logger.exception("MinIO upload failed")
            raise HTTPException(status_code=502, detail=f"Image upload failed: {error}") from error
        image_sources.append({"object_key": object_key, "local_url": None})

    return create_project(
        settings,
        title_fa=title_fa.strip(),
        title_en=title_en.strip(),
        description_fa=description_fa.strip(),
        description_en=description_en.strip(),
        project_url=str(project_url),
        stack=[item.strip() for item in stack.split(",") if item.strip()],
        image_sources=image_sources,
        storage=storage,
    )


@app.delete("/api/admin/projects/{project_id}", dependencies=[Depends(require_admin)])
def remove_project(project_id: int) -> dict[str, bool]:
    object_keys = delete_project(settings, project_id)
    if storage:
        for object_key in object_keys or []:
            try:
                storage.delete(object_key)
            except Exception:
                logger.warning("Could not delete MinIO object %s", object_key)
    return {"deleted": object_keys is not None}


@app.put("/api/admin/projects/{project_id}", dependencies=[Depends(require_admin)])
async def edit_project(
    project_id: int,
    title_fa: str = Form(..., min_length=1, max_length=180),
    title_en: str = Form("", max_length=180),
    description_fa: str = Form("", max_length=2000),
    description_en: str = Form("", max_length=2000),
    project_url: HttpUrl = Form(...),
    stack: str = Form(""),
    replace_images: bool = Form(False),
    images: list[UploadFile] = File(default=[]),
) -> dict:
    if replace_images and not images:
        raise HTTPException(status_code=400, detail="برای جایگزینی تصاویر، حداقل یک تصویر انتخاب کنید")
    if images and not storage:
        raise HTTPException(status_code=503, detail="MinIO credentials are not configured")

    image_sources: list[dict[str, str | None]] = []
    uploaded_keys: list[str] = []
    try:
        for image in images:
            if not image.content_type or not image.content_type.startswith("image/"):
                raise HTTPException(status_code=415, detail="Only image files are allowed")
            payload = await image.read()
            if len(payload) > 8 * 1024 * 1024:
                raise HTTPException(status_code=413, detail="Each image must be 8 MB or smaller")
            suffix = (image.filename or "image").rsplit(".", 1)[-1].lower()
            object_key = f"projects/{uuid.uuid4().hex}.{suffix}"
            storage.put(object_key, payload, image.content_type)  # type: ignore[union-attr]
            uploaded_keys.append(object_key)
            image_sources.append({"object_key": object_key, "local_url": None})

        project, old_object_keys = update_project(
            settings,
            project_id,
            title_fa=title_fa.strip(),
            title_en=title_en.strip(),
            description_fa=description_fa.strip(),
            description_en=description_en.strip(),
            project_url=str(project_url),
            stack=[item.strip() for item in stack.split(",") if item.strip()],
            image_sources=image_sources,
            replace_images=replace_images,
            storage=storage,
        )
    except HTTPException:
        for object_key in uploaded_keys:
            try:
                storage.delete(object_key)  # type: ignore[union-attr]
            except Exception:
                logger.warning("Could not clean up uploaded object %s", object_key)
        raise
    except Exception as error:
        for object_key in uploaded_keys:
            try:
                storage.delete(object_key)  # type: ignore[union-attr]
            except Exception:
                logger.warning("Could not clean up uploaded object %s", object_key)
        logger.exception("Project update failed")
        raise HTTPException(status_code=500, detail=f"Project update failed: {error}") from error

    if not project:
        for object_key in uploaded_keys:
            try:
                storage.delete(object_key)  # type: ignore[union-attr]
            except Exception:
                logger.warning("Could not clean up uploaded object %s", object_key)
        raise HTTPException(status_code=404, detail="Project not found")

    if storage and replace_images:
        for object_key in old_object_keys:
            try:
                storage.delete(object_key)
            except Exception:
                logger.warning("Could not delete replaced MinIO object %s", object_key)
    return project


@app.patch("/api/admin/projects/{project_id}/images", dependencies=[Depends(require_admin)])
def reorder_admin_images(project_id: int, payload: ImageOrderPayload) -> dict[str, bool]:
    try:
        reorder_images(settings, project_id, payload.image_ids)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return {"updated": True}


@app.delete("/api/admin/projects/{project_id}/images/{image_id}", dependencies=[Depends(require_admin)])
def remove_admin_image(project_id: int, image_id: int) -> dict[str, bool]:
    object_key = delete_image(settings, project_id, image_id)
    if object_key is None:
        raise HTTPException(status_code=404, detail="تصویر پیدا نشد")
    if storage and object_key:
        try:
            storage.delete(object_key)
        except Exception:
            logger.warning("Could not delete MinIO object %s", object_key)
    return {"deleted": True}
