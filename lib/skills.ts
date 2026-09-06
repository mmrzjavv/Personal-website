import {
  siAnthropic,
  siApachekafka,
  siDocker,
  siGit,
  siHuggingface,
  siLangchain,
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

// The keyboard is the portfolio's signature: the first two rows cover the
// full-stack/backend foundation, while the last row makes the AI/LLM/RAG
// direction explicit without adding a separate generic skills wall.
export const SKILLS_GRID: readonly (readonly SkillIcon[])[] = [
  [siReact, siNextdotjs, siTypescript, siDotnet, siPython],
  [siPostgresql, siRedis, siApachekafka, siOpenrouter, siAnthropic],
  [siLangchain, siHuggingface, siDocker, siGit, siTailwindcss],
] as const;

export const SKILLS_FLAT: readonly SkillIcon[] = SKILLS_GRID.flat();
