import {
  siApachekafka,
  siDiagramsdotnet,
  siDocker,
  siHuggingface,
  siLangchain,
  siNextdotjs,
  siOpencv,
  siPostgresql,
  siPytorch,
  siPython,
  siReact,
  siRedis,
  siRsocket,
  siScikitlearn,
  siSqlalchemy,
  siTensorflow,
  siTypescript,
  siUltralytics,
  siDotnet,
} from "simple-icons";

export type SkillIcon = {
  title: string;
  slug: string;
  path: string;
  hex: string;
};

export type SkillCategoryId = "backend" | "architecture" | "frontend" | "ai";

export type SkillCategory = {
  id: SkillCategoryId;
  skills: readonly SkillIcon[];
};

function skillVariant(base: SkillIcon, title: string, slug: string): SkillIcon {
  return { ...base, title, slug };
}

const backend: readonly SkillIcon[] = [
  skillVariant(siDotnet, "C# / .NET", "dotnet"),
  siPostgresql,
  siApachekafka,
  siRedis,
  siDocker,
];

const architecture: readonly SkillIcon[] = [
  skillVariant(siRsocket, "SignalR / WebSockets", "signalr-websockets"),
  skillVariant(siDiagramsdotnet, "CQRS", "cqrs"),
  skillVariant(siDiagramsdotnet, "Clean Architecture", "clean-architecture"),
  skillVariant(siDiagramsdotnet, "Domain-Driven Design", "ddd"),
  skillVariant(siSqlalchemy, "SQL / EF Core / Dapper", "data-access"),
];

const frontend: readonly SkillIcon[] = [
  siReact,
  siNextdotjs,
  siTypescript,
  siPython,
];

const ai: readonly SkillIcon[] = [
  skillVariant(siHuggingface, "AI", "ai"),
  skillVariant(siScikitlearn, "Machine Learning", "ml"),
  skillVariant(siPytorch, "Deep Learning", "dl"),
  skillVariant(siHuggingface, "NLP", "nlp"),
  skillVariant(siOpencv, "Computer Vision", "computer-vision"),
  skillVariant(siUltralytics, "YOLO", "yolo"),
  skillVariant(siTensorflow, "TensorFlow", "tensorflow"),
  skillVariant(siLangchain, "LLM / RAG", "llm-rag"),
];

// Keyboard stays a tight 5×3 signature grid. Extra AI skills live in the
// stack panel categories without crowding the 3D scene.
export const SKILLS_GRID: readonly (readonly SkillIcon[])[] = [
  backend,
  architecture,
  [
    siReact,
    siNextdotjs,
    siTypescript,
    siPython,
    skillVariant(siPytorch, "Deep Learning", "dl"),
  ],
] as const;

export const SKILL_CATEGORIES: readonly SkillCategory[] = [
  { id: "backend", skills: backend },
  { id: "architecture", skills: architecture },
  { id: "frontend", skills: frontend },
  { id: "ai", skills: ai },
] as const;

export const SKILLS_FLAT: readonly SkillIcon[] = Array.from(
  new Map(
    [...SKILLS_GRID.flat(), ...SKILL_CATEGORIES.flatMap((c) => c.skills)].map(
      (skill) => [skill.slug, skill]
    )
  ).values()
);

export const SKILL_HOVER_EVENT = "portfolio:skill-hover";
export const SKILL_FOCUS_EVENT = "portfolio:skill-focus";

export function findSkill(slug: string | null | undefined): SkillIcon | null {
  if (!slug) return null;
  return SKILLS_FLAT.find((skill) => skill.slug === slug) ?? null;
}
