"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { useLanguage } from "@/components/LanguageProvider";
import type { Lang } from "@/lib/i18n";
import type { ProjectRecord } from "@/lib/projects";

function pick<T>(loc: { fa: T; en: T }, lang: Lang): T {
  return loc[lang];
}

/** How many cards fit in one row at the current breakpoint. */
function useRowSize(): number {
  const [rowSize, setRowSize] = useState(3);

  useEffect(() => {
    const mqLg = window.matchMedia("(min-width: 1024px)");
    const mqSm = window.matchMedia("(min-width: 640px)");

    const update = () => {
      if (mqLg.matches) setRowSize(3);
      else if (mqSm.matches) setRowSize(2);
      else setRowSize(2);
    };

    update();
    mqLg.addEventListener("change", update);
    mqSm.addEventListener("change", update);
    return () => {
      mqLg.removeEventListener("change", update);
      mqSm.removeEventListener("change", update);
    };
  }, []);

  return rowSize;
}

export default function ProjectsShowcase({
  projects,
  onSelect,
}: {
  projects: ProjectRecord[];
  onSelect: (project: ProjectRecord) => void;
}) {
  const { t, lang } = useLanguage();
  const rowSize = useRowSize();
  const [expanded, setExpanded] = useState(false);

  const hasMore = projects.length > rowSize;
  const visibleProjects = expanded || !hasMore ? projects : projects.slice(0, rowSize);
  const countLabel = t("projects.showingCount")
    .replace("{shown}", String(visibleProjects.length))
    .replace("{total}", String(projects.length));

  return (
    <div className="projects-wrap pointer-events-auto" id="projects-showcase">
      <header className="projects-head">
        <Reveal>
          <h2 className="projects-head__title">{t("projects.title")}</h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="projects-head__sub">{t("projects.subtitle")}</p>
        </Reveal>
      </header>

      <ul className="project-grid" aria-label={t("projects.title")}>
        {visibleProjects.map((project, index) => {
          const url = project.url?.trim() || null;
          const thumb = project.media[0];
          return (
            <li key={project.slug}>
              <article
                data-kb-section={project.section}
                data-kb-highlights={project.highlights.join(",")}
                className="project-card-mini"
              >
                <button
                  type="button"
                  className="project-card-mini__media"
                  onClick={() => onSelect(project)}
                  data-cursor="hover"
                  aria-label={`${t("projects.viewMore")}: ${pick(project.name, lang)}`}
                >
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt=""
                      loading={index < 2 ? "eager" : "lazy"}
                      decoding="async"
                    />
                  ) : (
                    <span className="project-card-mini__placeholder">{project.num}</span>
                  )}
                  <span className="project-card-mini__num">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </button>

                <div className="project-card-mini__body">
                  <h3 className="project-card-mini__title">
                    {pick(project.name, lang)}
                  </h3>
                  <p className="project-card-mini__desc">
                    {pick(project.desc, lang)}
                  </p>
                  <div className="project-card-mini__tags">
                    {project.stack.slice(0, 4).map((tech) => (
                      <span key={tech}>{tech}</span>
                    ))}
                  </div>
                  <div className="project-card-mini__actions">
                    <button
                      type="button"
                      className="project-card-mini__link"
                      onClick={() => onSelect(project)}
                      data-cursor="hover"
                    >
                      {t("projects.viewMore")}
                    </button>
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="project-card-mini__link project-card-mini__link--primary"
                        data-cursor="hover"
                      >
                        {t("projects.openProject")}
                      </a>
                    )}
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ul>

      {hasMore && (
        <div className="projects-more">
          <p className="projects-more__count">{countLabel}</p>
          <button
            type="button"
            className="projects-more__btn"
            data-cursor="hover"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? t("projects.showLess") : t("projects.showMore")}
          </button>
        </div>
      )}
    </div>
  );
}
