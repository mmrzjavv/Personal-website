"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Props = {
  media: string[];
  alt: string;
  onOpen: () => void;
  previewLabel: string;
};

export default function ProjectCardMedia({ media, alt, onOpen, previewLabel }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (media.length <= 1) return;
    const interval = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % media.length);
    }, 4300);
    return () => window.clearInterval(interval);
  }, [media.length]);

  const goTo = (index: number) => {
    setActiveIndex((index + media.length) % media.length);
  };

  return (
    <div className="project-card__media-gallery">
      <button
        type="button"
        className="project-card__image-button"
        onClick={onOpen}
        aria-label={`${previewLabel}: ${alt}`}
        data-cursor="hover"
      >
        <span className="project-card__image-stack" aria-hidden={media.length < 2}>
          {media.map((src, index) => (
            src.startsWith("http") ? (
              // Uploaded MinIO objects are remote and intentionally bypass
              // Next image optimisation so the storage host stays configurable.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt={index === activeIndex ? alt : ""}
                className={`project-card__image ${index === activeIndex ? "project-card__image--active" : ""}`}
                loading={index === 0 ? "eager" : "lazy"}
              />
            ) : (
              <Image
                key={src}
                src={src}
                alt={index === activeIndex ? alt : ""}
                fill
                priority={index === 0}
                sizes="(max-width: 767px) 94vw, 65vw"
                className={`project-card__image ${index === activeIndex ? "project-card__image--active" : ""}`}
              />
            )
          ))}
        </span>
        <span className="project-card__image-shade" aria-hidden />
        <span className="project-card__image-action">
          <span>{previewLabel}</span>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M5 12h14M13 5l7 7-7 7" /></svg>
        </span>
      </button>

      {media.length > 1 && (
        <div className="project-card__media-controls" aria-label="Project images">
          <div className="project-card__media-dots">
            {media.map((src, index) => (
              <button
                key={src}
                type="button"
                onClick={() => goTo(index)}
                className={`project-card__media-dot ${index === activeIndex ? "project-card__media-dot--active" : ""}`}
                aria-label={`${previewLabel} ${index + 1}`}
                aria-current={index === activeIndex ? "true" : undefined}
                data-cursor="hover"
              />
            ))}
          </div>
          <span>{activeIndex + 1} / {media.length}</span>
        </div>
      )}
    </div>
  );
}
