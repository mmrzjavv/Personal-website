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
import StackExplorer from "@/components/StackExplorer";
import { useLanguage } from "@/components/LanguageProvider";
import { useIsMobile } from "@/lib/useIsMobile";
import { projects, type ProjectRecord } from "@/lib/projects";
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

export default function Home() {
  const { t, lang } = useLanguage();
  const isMobile = useIsMobile();
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const [projectRecords, setProjectRecords] = useState<ProjectRecord[]>(projects);
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/projects", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((remoteProjects: ProjectRecord[] | null) => {
        if (!mounted || !Array.isArray(remoteProjects) || remoteProjects.length === 0) return;
        setProjectRecords(remoteProjects);
      })
      .catch(() => {
        // Bundled JSON remains the fallback if the content API is offline.
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
              width={48}
              height={48}
              sizes="48px"
              className="site-header__photo rounded-full object-cover border border-ice-400/50"
            />
            <span data-cursor="hover" className="site-header__name text-sm font-semibold tracking-tight text-ice-100 whitespace-nowrap">
              {t("header.name")}
            </span>
            <span className="hidden md:inline-flex">
              <span className="status-pill">{t("header.availability")}</span>
            </span>
          </div>
          <div className="site-header__controls flex items-center gap-2 pointer-events-auto">
            <SeasonPicker className="site-header__season" />
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
            <LanguagePicker className="site-header__language" />
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
                <div className="hero-contact-links" aria-label={t("contact.title")}>
                  <a href={`mailto:${EMAIL}`} data-cursor="hover" data-magnetic className="frost-icon" aria-label="Email">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
                  </a>
                  <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" data-cursor="hover" data-magnetic className="frost-icon text-[11px] font-bold" aria-label="LinkedIn">in</a>
                  <a href="/Mohammadreza-Javaheri-cv.pdf" target="_blank" rel="noopener noreferrer" data-cursor="hover" data-magnetic className="frost-icon text-[10px] font-bold" aria-label="CV">CV</a>
                </div>
              </div>
            </div>

            <div className="mt-10 md:mt-auto flex items-center gap-3 fade-in-up" style={{ ["--d" as string]: "900ms" }}>
              <span className="scroll-indicator"><span>{t("hero.scroll")}</span><span className="scroll-indicator__rail" /></span>
              <span className="text-[11px] uppercase tracking-[0.25em] text-ice-400 hidden sm:inline">{t("hero.keysHint")}</span>
            </div>
          </section>

          <section data-kb-section="stack" className="stack-section relative py-16 md:py-20 px-6 sm:px-10 md:px-14">
            <Reveal>
              <StackExplorer />
            </Reveal>
          </section>

          <section className="projects-section relative py-16 md:py-20 px-6 sm:px-10 md:px-14">
            <div className="projects-wrap pointer-events-auto" id="projects-showcase">
              <header className="projects-head">
                <Reveal>
                  <h2 className="projects-head__title">{t("projects.title")}</h2>
                </Reveal>
                <Reveal delay={80}>
                  <p className="projects-head__sub">{t("projects.subtitle")}</p>
                </Reveal>
              </header>

              <ul className="project-grid">
                {projectRecords.map((project, index) => {
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
                          onClick={() => setSelectedProject(project)}
                          data-cursor="hover"
                          aria-label={`${t("projects.viewMore")}: ${pick(project.name, lang)}`}
                        >
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={thumb} alt="" loading="lazy" />
                          ) : (
                            <span className="project-card-mini__placeholder">{project.num}</span>
                          )}
                          <span className="project-card-mini__num">{String(index + 1).padStart(2, "0")}</span>
                        </button>

                        <div className="project-card-mini__body">
                          <h3 className="project-card-mini__title">{pick(project.name, lang)}</h3>
                          <p className="project-card-mini__desc">{pick(project.desc, lang)}</p>
                          <div className="project-card-mini__tags">
                            {project.stack.slice(0, 4).map((tech) => (
                              <span key={tech}>{tech}</span>
                            ))}
                          </div>
                          <div className="project-card-mini__actions">
                            <button
                              type="button"
                              className="project-card-mini__link"
                              onClick={() => setSelectedProject(project)}
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
            </div>
          </section>

          <section data-kb-section="contact" className="relative py-24 md:min-h-screen flex flex-col justify-center p-6 sm:p-10 md:p-14 overflow-hidden">
            <div className="contact-panel relative">
              <Reveal><p className="font-mono text-sm text-ice-400 mb-3">{t("contact.kicker")}</p></Reveal>
              <Reveal delay={80}><h2 className="text-4xl sm:text-6xl font-semibold tracking-tight text-ice-50 mb-6">{t("contact.title")}</h2></Reveal>
              <Reveal delay={160}><p className="text-ice-200 mb-10">{t("contact.body")}</p></Reveal>
              <Reveal delay={240}>
                <div className="contact-actions pointer-events-auto">
                  <CopyEmail email={EMAIL} className="frost-btn frost-btn--primary contact-action"><span className="contact-action__icon"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg></span><span>{t("contact.copyEmail")}</span></CopyEmail>
                  <a href={`mailto:${EMAIL}`} data-cursor="hover" className="frost-btn contact-action"><span className="contact-action__icon"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /><path d="m22 6-10 7L2 6" /></svg></span><span>{t("contact.openMail")}</span></a>
                  {PHONE_NUMBERS.map((phone) => (
                    <a key={phone} href={`tel:${phone}`} dir="ltr" data-cursor="hover" className="frost-btn contact-action contact-action--phone" aria-label={`${t("contact.call")} ${phone}`}>
                      <span className="contact-action__icon"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92z" /></svg></span>
                      <span className="contact-action__copy"><span className="contact-action__label">{t("contact.call")}</span><span className="contact-action__value">{phone}</span></span>
                    </a>
                  ))}
                  <a href="/Mohammadreza-Javaheri-cv.pdf" target="_blank" rel="noopener noreferrer" data-cursor="hover" className="frost-btn contact-action"><span className="contact-action__icon"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></svg></span><span>CV</span></a>
                  <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" data-cursor="hover" className="frost-btn contact-action"><span className="contact-action__icon contact-action__icon--linkedin">in</span><span>{t("contact.linkedin")}</span></a>
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
