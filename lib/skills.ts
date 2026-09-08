import {
  siApachekafka,
  siDocker,
  siGit,
  siJavascript,
  siLangchain,
  siNodedotjs,
  siNextdotjs,
  siOpenrouter,
  siPostgresql,
  siPython,
  siReact,
  siRedis,
  siTailwindcss,
  siTypescript,
  siDotnet,
} from "simple-icons";

export type SkillIcon = {
  title: string;
  slug: string;
  path: string;
  hex: string;
};

// The keyboard is the portfolio's signature: the first row reflects the
// backend/distributed-systems work in the CV, the second keeps the full-stack
// foundation visible, and the last row represents the AI/LLM direction.
export const SKILLS_GRID: readonly (readonly SkillIcon[])[] = [
  [siDotnet, siPostgresql, siApachekafka, siRedis, siPython],
  [siReact, siNextdotjs, siTypescript, siDocker, siGit],
  [siLangchain, siOpenrouter, siNodedotjs, siJavascript, siTailwindcss],
] as const;

export const SKILLS_FLAT: readonly SkillIcon[] = SKILLS_GRID.flat();
