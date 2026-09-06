"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import FrozenKeyboard from "@/components/FrozenKeyboard";
import SmoothScroll from "@/components/smooth-scroll";
import Reveal from "@/components/Reveal";
import SectionNav from "@/components/SectionNav";
import CopyEmail from "@/components/CopyEmail";
import SeasonPicker from "@/components/SeasonPicker";
import LanguagePicker from "@/components/LanguagePicker";
import ProjectModal from "@/components/ProjectModal";
import ProjectCardMedia from "@/components/ProjectCardMedia";
import { useLanguage } from "@/components/LanguageProvider";
import { useIsMobile } from "@/lib/useIsMobile";
import { projects, type ProjectRecord } from "@/lib/projects";
import { SKILLS_FLAT } from "@/lib/skills";
import type { Lang } from "@/lib/i18n";

const EMAIL = "mohammad.r.javaheri@gmail.com";
const LINKEDIN = "https://www.linkedin.com/in/mmrzjavv";
const PHONE_NUMBERS = ["+989358357344", "+989105748578"];

function pick<T>(loc: { fa: T; en: T }, lang: Lang): T {
  return loc[lang];
}

function HeroWord({
  text,
  delay,
  className = "",
}: {
  text: string;
  delay: number;
  className?: string;
}) {
  return (
    <span className={`hero-word ${className}`}>
      <span style={{ animationDelay: `${delay}ms` }}>{text}</span>
    </span>
  );
}

function ProjectNavigation({
  activeIndex,
  total,
  onMove,
  ariaLabel,
  previousLabel,
  nextLabel,
}: {
  activeIndex: number;
  total: number;
  onMove: (offset: number) => void;
  ariaLabel: string;
  previousLabel: string;
  nextLabel: string;
}) {
  return (
    <div className="projects-controls projects-controls--showcase pointer-events-auto" aria-label={ariaLabel}>
      <div className="projects-controls__buttons">
        <button
          type="button"
          className="projects-control"
          onClick={() => onMove(-1)}
          aria-label={previousLabel}
          data-cursor="hover"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
          <span>{previousLabel}</span>
        </button>
        <button
          type="button"
          className="projects-control projects-control--next"
          onClick={() => onMove(1)}
          aria-label={nextLabel}
          data-cursor="hover"
        >
          <span>{nextLabel}</span>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
      <span className="projects-progress" aria-live="polite">
        <span>{String(activeIndex + 1).padStart(2, "0")}</span>
        <span aria-hidden>/</span>
        <span>{String(total).padStart(2, "0")}</span>
      </span>
    </div>
  );
}

export default function Home() {
  const { t, lang } = useLanguage();
  const isMobile = useIsMobile();
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const [projectRecords, setProjectRecords] = useState<ProjectRecord[]>(projects);
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(null);
  const activeProject = projectRecords[activeProjectIndex] ?? projectRecords[0];

  useEffect(() => {
    let mounted = true;
    fetch("/api/projects", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((remoteProjects: ProjectRecord[] | null) => {
        if (!mounted || !Array.isArray(remoteProjects) || remoteProjects.length === 0) return;
        setProjectRecords(remoteProjects);
        setActiveProjectIndex((index) => Math.min(index, remoteProjects.length - 1));
      })
      .catch(() => {
        // The bundled JSON remains a resilient fallback if the content API is
        // temporarily offline or has not been started yet.
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const updateHeaderState = () => {
      const next = window.scrollY > 28;
      setIsHeaderScrolled((current) => (current === next ? current : next));
    };
    updateHeaderState();
    window.addEventListener("scroll", updateHeaderState, { passive: true });
    return () => window.removeEventListener("scroll", updateHeaderState);
  }, []);

  const goToProject = (offset: number) => {
    setActiveProjectIndex((index) => (index + offset + projectRecords.length) % projectRecords.length);
  };

  return (
    <SmoothScroll>
      <div className="relative">
        {!isMobile && (
          <div className="fixed inset-0 z-0">
            <FrozenKeyboard />
          </div>
        )}

        <header className={`site-header fixed top-0 inset-x-0 z-50 px-6 sm:px-10 md:px-14 py-5 flex items-center justify-between pointer-events-none ${isHeaderScrolled ? "site-header--scrolled" : ""}`}>
          <div className="site-header__identity flex items-center gap-3 pointer-events-auto">
            <Image
              src="/profile-photo.jpg"
              alt={t("header.name")}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover border border-ice-400/50"
            />
            <span data-cursor="hover" className="site-header__name text-sm font-semibold tracking-tight text-ice-100 whitespace-nowrap">
              {t("header.name")}
            </span>
            <span className="hidden md:inline-flex">
              <span className="status-pill">{t("header.availability")}</span>
            </span>
          </div>
          <div className="site-header__controls flex items-center gap-2 pointer-events-auto">
            <SeasonPicker />
            <span className="hidden md:inline-flex">
              <a
                href={LINKEDIN}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="hover"
                className="frost-btn !py-1.5 !px-3 !text-xs"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
                  <path d="M5.2 3.4A2.2 2.2 0 1 1 .8 3.4a2.2 2.2 0 0 1 4.4 0ZM1.1 8.2h4.2V23H1.1V8.2ZM7.9 8.2h4v2c.6-1.1 2.1-2.4 4.5-2.4 4.8 0 5.7 3.1 5.7 7.2V23h-4.2v-7.1c0-1.7 0-3.8-2.3-3.8s-2.7 1.8-2.7 3.7V23H7.9V8.2Z" />
                </svg>
                <span>{t("contact.linkedin")}</span>
              </a>
            </span>
            <LanguagePicker />
          </div>
        </header>

        <SectionNav />

        <main className="relative z-10 pointer-events-none">
          <section data-kb-section="hero" className="min-h-screen flex flex-col justify-center p-6 sm:p-10 md:p-14">
            {isMobile && (
              <div className="hero-keyboard pointer-events-auto">
                <FrozenKeyboard mobile />
              </div>
            )}
            <div className="mt-2 md:mt-20">
              <p className="text-[11px] uppercase tracking-[0.3em] text-ice-300 mb-5 fade-in-up" style={{ ["--d" as string]: "0ms" }}>
                {t("hero.greeting")}
              </p>
              <h1 className="hero-title font-bold tracking-[-0.04em] text-ice-50 leading-[0.92] whitespace-nowrap">
                <HeroWord text={lang === "fa" ? "محمدرضا" : "Mohammadreza"} delay={120} />
                <br />
                <HeroWord text={lang === "fa" ? "جواهری" : "Javaheri"} delay={260} className="text-ice-400" />
              </h1>
              <p className="mt-8 text-base sm:text-lg md:text-xl text-ice-200 max-w-xl leading-relaxed fade-in-up" style={{ ["--d" as string]: "520ms" }}>
                {t("hero.roleLine")}
                <br />
                {t("hero.tagline")}
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-3 pointer-events-auto fade-in-up" style={{ ["--d" as string]: "700ms" }}>
                <a href="/Mohammadreza-Javaheri-cv.pdf" target="_blank" rel="noopener noreferrer" data-cursor="hover" data-magnetic className="frost-btn frost-btn--primary">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" />
                    <path d="M14 3v5h5" />
                  </svg>
                  {t("hero.cv")}
                </a>
                <button type="button" data-cursor="hover" data-magnetic className="frost-btn" onClick={() => document.querySelector<HTMLElement>('[data-kb-section="contact"]')?.scrollIntoView({ behavior: "smooth", block: "start" })}>
                  {t("hero.hire")}
                </button>
                <div className="basis-full h-0 md:hidden" aria-hidden />
                <a href={`mailto:${EMAIL}`} data-cursor="hover" data-magnetic className="frost-icon" aria-label="Email">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
                </a>
                <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" data-cursor="hover" data-magnetic className="frost-icon text-[11px] font-bold" aria-label="LinkedIn">in</a>
                <a href="/Mohammadreza-Javaheri-cv.pdf" target="_blank" rel="noopener noreferrer" data-cursor="hover" data-magnetic className="frost-icon text-[10px] font-bold" aria-label="CV">CV</a>
              </div>
            </div>

            <div className="mt-10 md:mt-auto flex items-center gap-3 fade-in-up" style={{ ["--d" as string]: "900ms" }}>
              <span className="scroll-indicator"><span>{t("hero.scroll")}</span><span className="scroll-indicator__rail" /></span>
              <span className="text-[11px] uppercase tracking-[0.25em] text-ice-400 hidden sm:inline">{t("hero.keysHint")}</span>
            </div>
          </section>

          <section data-kb-section="stack" className="relative md:min-h-[160vh] p-6 sm:p-10 md:p-14">
            <div className="relative md:h-[125vh]">
              <div className="md:sticky md:top-28 text-center">
                <Reveal><h2 className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-[-0.03em] text-ice-50 leading-[0.95]">{t("stack.title")}</h2></Reveal>
                <Reveal delay={120}><p className="mt-3 text-sm sm:text-base text-ice-400"><span className="hidden md:inline">{t("stack.hint")}</span><span className="md:hidden">{t("stack.hintMobile")}</span></p></Reveal>
              </div>
              {isMobile && (
                <div className="md:hidden mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3 pointer-events-auto">
                  {SKILLS_FLAT.map((s) => (
                    <div key={s.slug} className="flex items-start gap-3 rounded-xl bg-ink-1/70 backdrop-blur-sm border border-ink-3 p-4">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill={`#${s.hex}`} className="flex-none mt-0.5" aria-hidden><path d={s.path} /></svg>
                      <div><p className="text-ice-50 font-medium text-sm">{s.title}</p><p className="text-ice-400 text-xs mt-0.5 leading-snug">{t(`keyboard.taglines.${s.slug}`)}</p></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="projects-section relative py-24 md:min-h-[125vh] p-6 sm:p-10 md:p-14 overflow-hidden">
            <span aria-hidden className="watermark hidden md:block top-1/2 -translate-y-1/2 right-[-2vw]">03</span>
            <div className="relative z-10 w-full max-w-[120rem] mx-auto">
              <div className="projects-heading">
                <Reveal><p className="font-mono text-sm text-ice-400 mb-3">{t("projects.kicker")}</p></Reveal>
                <Reveal delay={80}><h2 className="projects-title font-bold tracking-[-0.04em] text-ice-50 leading-[0.92]">{t("projects.title")}</h2></Reveal>
                <Reveal delay={140}><p className="projects-subtitle mt-4 max-w-xl text-ice-300">{t("projects.subtitle")}</p></Reveal>
              </div>

              <div className="projects-rail pointer-events-auto" id="projects-showcase">
                <article key={activeProject.num} data-kb-section={activeProject.section} data-kb-highlights={activeProject.highlights.join(",")} className="projects-rail__item projects-rail__item--active">
                    <div className="project-card project-card--left">
                      <Reveal delay={200} className="project-card__navigation">
                        <ProjectNavigation
                          activeIndex={activeProjectIndex}
                          total={projects.length}
                          onMove={goToProject}
                          ariaLabel={t("projects.navigation")}
                          previousLabel={t("projects.previous")}
                          nextLabel={t("projects.next")}
                        />
                      </Reveal>
                      <div className="project-card__visual">
                        <div className="project-card__browser">
                          <div className="project-card__browser-bar">
                            <span className="project-card__dots" aria-hidden><i /><i /><i /></span>
                            <span className="project-card__url">{activeProject.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
                            <span className="project-card__live-dot" aria-label="Live preview" />
                          </div>
                          <ProjectCardMedia
                            media={activeProject.media}
                            alt={`${pick(activeProject.name, lang)} preview`}
                            onOpen={() => setSelectedProject(activeProject)}
                            previewLabel={t("projects.viewImages")}
                          />
                        </div>
                      </div>

                      <div className="project-card__content">
                        <div className="project-card__meta">
                          <span>{activeProject.num} · {t("projects.kicker")}</span>
                          <span>{t("projects.liveLabel")}</span>
                        </div>
                        <Reveal><h2 className="project-card__title font-semibold tracking-tight text-ice-50 leading-[1.05] mb-4">{pick(activeProject.name, lang)}</h2></Reveal>
                        <Reveal delay={100}><p className="text-base sm:text-lg text-ice-200 leading-relaxed mb-6">{pick(activeProject.desc, lang)}</p></Reveal>
                        <Reveal delay={160}>
                          <div className="flex flex-wrap gap-1.5 mb-7">
                            {activeProject.stack.map((s) => <span key={s} data-cursor="hover" className="frost-chip">{s}</span>)}
                          </div>
                        </Reveal>
                        <Reveal delay={220}>
                          <div className="flex flex-wrap gap-3">
                            <a href={activeProject.previewPath} target="_blank" rel="noopener noreferrer" data-cursor="hover" data-magnetic className="frost-btn frost-btn--primary">
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M8 21h8M12 18v3" /></svg>
                              {t("projects.preview")}
                            </a>
                            <button type="button" onClick={() => setSelectedProject(activeProject)} data-cursor="hover" data-magnetic className="frost-btn">
                              {t("projects.viewMore")}
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M5 12h14M13 5l7 7-7 7" /></svg>
                            </button>
                          </div>
                        </Reveal>
                        <div className="project-card__footnote">
                          <span>{t("projects.previewHint")}</span>
                          <a href={activeProject.previewPath} target="_blank" rel="noopener noreferrer" data-cursor="hover">{t("projects.preview")}</a>
                        </div>
                      </div>
                    </div>
                </article>
              </div>
            </div>
          </section>

          <section data-kb-section="contact" className="relative py-24 md:min-h-screen flex flex-col justify-center p-6 sm:p-10 md:p-14 overflow-hidden">
            <div className="max-w-xl relative">
              <Reveal><p className="font-mono text-sm text-ice-400 mb-3">{t("contact.kicker")}</p></Reveal>
              <Reveal delay={80}><h2 className="text-4xl sm:text-6xl font-semibold tracking-tight text-ice-50 mb-6">{t("contact.title")}</h2></Reveal>
              <Reveal delay={160}><p className="text-ice-200 mb-10">{t("contact.body")}</p></Reveal>
              <Reveal delay={240}>
                <div className="flex flex-wrap gap-3 pointer-events-auto">
                  <CopyEmail email={EMAIL} className="frost-btn frost-btn--primary"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>{t("contact.copyEmail")}</CopyEmail>
                  <a href={`mailto:${EMAIL}`} data-cursor="hover" className="frost-btn">{t("contact.openMail")}</a>
                  {PHONE_NUMBERS.map((phone) => (
                    <a key={phone} href={`tel:${phone}`} dir="ltr" data-cursor="hover" className="frost-btn" aria-label={`${t("contact.call")} ${phone}`}>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92z" /></svg>
                      {phone}
                    </a>
                  ))}
                  <a href="/Mohammadreza-Javaheri-cv.pdf" target="_blank" rel="noopener noreferrer" data-cursor="hover" className="frost-btn">CV</a>
                  <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" data-cursor="hover" className="frost-btn">{t("contact.linkedin")}</a>
                </div>
              </Reveal>
            </div>
            <Reveal delay={320}><p className="mt-14 text-[11px] uppercase tracking-[0.25em] text-ice-400">{t("contact.footer")}</p></Reveal>
          </section>
        </main>

        <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
      </div>
    </SmoothScroll>
  );
}
