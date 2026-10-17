"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import {
  SKILL_CATEGORIES,
  SKILL_FOCUS_EVENT,
  SKILL_HOVER_EVENT,
  SKILLS_FLAT,
  findSkill,
  type SkillCategoryId,
  type SkillIcon,
} from "@/lib/skills";

function dispatchFocus(slug: string | null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SKILL_FOCUS_EVENT, { detail: { slug } }));
}

export default function StackExplorer() {
  const { t } = useLanguage();
  const [activeSlug, setActiveSlug] = useState(SKILLS_FLAT[0]?.slug ?? "dotnet");
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  useEffect(() => {
    const onHover = (event: Event) => {
      const detail = (event as CustomEvent<{ slug: string | null }>).detail;
      setHoveredSlug(detail?.slug ?? null);
    };
    window.addEventListener(SKILL_HOVER_EVENT, onHover as EventListener);
    return () => window.removeEventListener(SKILL_HOVER_EVENT, onHover as EventListener);
  }, []);

  useEffect(() => {
    dispatchFocus(activeSlug);
  }, [activeSlug]);

  const activeSkill = useMemo(
    () => findSkill(hoveredSlug ?? activeSlug) ?? SKILLS_FLAT[0],
    [hoveredSlug, activeSlug]
  );

  const selectSkill = (skill: SkillIcon) => {
    setActiveSlug(skill.slug);
    dispatchFocus(skill.slug);
  };

  return (
    <div className="stack-panel pointer-events-auto">
      <header className="stack-panel__head">
        <h2 className="stack-panel__title">{t("stack.title")}</h2>
        <p className="stack-panel__hint">
          <span className="hidden md:inline">{t("stack.hint")}</span>
          <span className="md:hidden">{t("stack.hintMobile")}</span>
        </p>
      </header>

      <p className="stack-panel__active" aria-live="polite">
        <span className="stack-panel__active-name">{activeSkill.title}</span>
        <span className="stack-panel__active-sep" aria-hidden>
          —
        </span>
        <span className="stack-panel__active-desc">{t(`keyboard.taglines.${activeSkill.slug}`)}</span>
      </p>

      <div className="stack-panel__groups">
        {SKILL_CATEGORIES.map((category) => (
          <section key={category.id} className="stack-group">
            <h3 className="stack-group__label">{t(`stack.categories.${category.id as SkillCategoryId}`)}</h3>
            <ul className="stack-group__list">
              {category.skills.map((skill) => {
                const isActive = (hoveredSlug ?? activeSlug) === skill.slug;
                return (
                  <li key={skill.slug}>
                    <button
                      type="button"
                      className={`stack-chip ${isActive ? "stack-chip--on" : ""}`}
                      onClick={() => selectSkill(skill)}
                      onMouseEnter={() => dispatchFocus(skill.slug)}
                      onMouseLeave={() => dispatchFocus(activeSlug)}
                      data-cursor="hover"
                      aria-pressed={activeSlug === skill.slug}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill={`#${skill.hex}`} aria-hidden>
                        <path d={skill.path} />
                      </svg>
                      <span>{skill.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
