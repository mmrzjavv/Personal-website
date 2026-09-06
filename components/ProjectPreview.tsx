"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import Carousel from "@/components/Carousel";
import type { ProjectRecord } from "@/lib/projects";

type Props = {
  project: ProjectRecord;
};

export default function ProjectPreview({ project }: Props) {
  const { lang, t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const name = project.name[lang];
  const isGallery = project.previewMode === "gallery";

  useEffect(() => {
    if (isGallery) return;

    // Some cross-origin apps keep the iframe load event pending while their
    // client-side shell finishes booting. Never leave the live app covered by
    // our loading veil once the frame has had a reasonable startup window.
    const fallback = window.setTimeout(() => setIsLoading(false), 2200);
    return () => window.clearTimeout(fallback);
  }, [isGallery, project.url]);

  return (
    <main className="project-preview-page">
      <header className="project-preview__bar">
        <div className="project-preview__identity">
          <Link href="/" className="project-preview__back" aria-label="Back to portfolio">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="project-preview__number">{project.num}</span>
          <div>
            <p className="project-preview__eyebrow">{t("projects.preview")}</p>
            <h1>{name}</h1>
          </div>
        </div>
        {!isGallery && (
          <div className="project-preview__actions">
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="strict-origin-when-cross-origin"
              className="project-preview__open"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M14 3h7v7" />
                <path d="M10 14 21 3" />
                <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
              </svg>
              {t("projects.openApp")}
            </a>
          </div>
        )}
      </header>

      <section className="project-preview__stage" aria-label={`${name} live preview`}>
        <div className="project-preview__glass">
          <div className="project-preview__chrome" aria-hidden>
            <span className="project-card__dots"><i /><i /><i /></span>
            <span className="project-card__live-dot" />
          </div>
          {isGallery ? (
            <div className="project-preview__gallery">
              <Carousel media={project.media} projectNum={project.num} altPrefix={`${name} screenshot`} />
            </div>
          ) : (
            <>
              {isLoading && <div className="project-preview__loading"><span className="preview-spinner" />{t("projects.loading")}</div>}
              <iframe
                src={project.url}
                title={`${name} live preview`}
                className="project-preview__frame"
                onLoad={() => setIsLoading(false)}
                allow="fullscreen; autoplay; clipboard-read; clipboard-write; web-share"
                allowFullScreen
                loading="eager"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </>
          )}
        </div>
      </section>

    </main>
  );
}
