"use client";

import { useEffect, useRef, useState } from "react";
import Reveal from "@/components/Reveal";
import { useLanguage } from "@/components/LanguageProvider";
import { useClientReady, useIsMobile } from "@/lib/useIsMobile";
import type { Lang } from "@/lib/i18n";
import type { ProjectRecord } from "@/lib/projects";

function pick<T>(loc: { fa: T; en: T }, lang: Lang): T {
  return loc[lang];
}

export default function ProjectsShowcase({
  projects,
  onSelect,
}: {
  projects: ProjectRecord[];
  onSelect: (project: ProjectRecord) => void;
}) {
  const { t, lang } = useLanguage();
  const isMobile = useIsMobile();
  const clientReady = useClientReady();
  const mobileCarousel = clientReady && isMobile;
  const trackRef = useRef<HTMLUListElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !mobileCarousel) return;

    const slides = Array.from(
      track.querySelectorAll<HTMLElement>("[data-project-slide]")
    );
    if (slides.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let best: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (!best || entry.intersectionRatio > best.intersectionRatio) {
            best = entry;
          }
        }
        if (!best?.isIntersecting) return;
        const idx = Number(
          (best.target as HTMLElement).dataset.projectSlide ?? "-1"
        );
        if (idx >= 0) setActiveIdx(idx);
      },
      { root: track, threshold: [0.45, 0.65, 0.85] }
    );

    slides.forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, [mobileCarousel, projects.length]);

  const goTo = (index: number) => {
    const track = trackRef.current;
    const slide = track?.querySelector<HTMLElement>(
      `[data-project-slide="${index}"]`
    );
    slide?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    setActiveIdx(index);
  };

  return (
    <div className="projects-wrap pointer-events-auto" id="projects-showcase">
      <header className="projects-head">
        <Reveal>
          <h2 className="projects-head__title">{t("projects.title")}</h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="projects-head__sub">
            {mobileCarousel ? t("projects.scrollHint") : t("projects.subtitle")}
          </p>
        </Reveal>
      </header>

      <ul
        ref={trackRef}
        className={`project-grid${mobileCarousel ? " project-grid--carousel" : ""}`}
        aria-label={t("projects.title")}
      >
        {projects.map((project, index) => {
          const url = project.url?.trim() || null;
          const thumb = project.media[0];
          return (
            <li key={project.slug} data-project-slide={index}>
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
                    {project.stack.slice(0, mobileCarousel ? 3 : 4).map((tech) => (
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

      {mobileCarousel && projects.length > 1 && (
        <div className="projects-carousel-nav" aria-label={t("projects.navigation")}>
          <button
            type="button"
            className="projects-carousel-nav__btn"
            data-cursor="hover"
            disabled={activeIdx <= 0}
            onClick={() => goTo(activeIdx - 1)}
            aria-label={t("projects.previous")}
          >
            ‹
          </button>
          <div className="projects-dots" role="tablist">
            {projects.map((project, index) => (
              <button
                key={project.slug}
                type="button"
                role="tab"
                aria-selected={index === activeIdx}
                aria-label={`${t("projects.jumpTo")} ${index + 1}`}
                className={`projects-dot${index === activeIdx ? " projects-dot--active" : ""}`}
                onClick={() => goTo(index)}
              />
            ))}
          </div>
          <button
            type="button"
            className="projects-carousel-nav__btn"
            data-cursor="hover"
            disabled={activeIdx >= projects.length - 1}
            onClick={() => goTo(activeIdx + 1)}
            aria-label={t("projects.next")}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
