import {
  siApachekafka,
  siDiagramsdotnet,
  siDocker,
  siLangchain,
  siNextdotjs,
  siPostgresql,
  siPython,
  siReact,
  siRedis,
  siRsocket,
  siSqlalchemy,
  siTypescript,
  siDotnet,
} from "simple-icons";

export type SkillIcon = {
  title: string;
  slug: string;
  path: string;
  hex: string;
};

function skillVariant(base: SkillIcon, title: string, slug: string): SkillIcon {
  return { ...base, title, slug };
}

// The keyboard is the portfolio's signature: the first row reflects the
// backend/distributed-systems work in the CV, the second captures the
// architecture and real-time patterns, and the last row keeps the full-stack
// plus AI/LLM direction visible.
export const SKILLS_GRID: readonly (readonly SkillIcon[])[] = [
  [
    skillVariant(siDotnet, "C# / .NET", "dotnet"),
    siPostgresql,
    siApachekafka,
    siRedis,
    siDocker,
  ],
  [
    skillVariant(siRsocket, "SignalR / WebSockets", "signalr-websockets"),
    skillVariant(siDiagramsdotnet, "CQRS", "cqrs"),
    skillVariant(siDiagramsdotnet, "Clean Architecture", "clean-architecture"),
    skillVariant(siDiagramsdotnet, "Domain-Driven Design", "ddd"),
    skillVariant(siSqlalchemy, "SQL / EF Core / Dapper", "data-access"),
  ],
  [siReact, siNextdotjs, siTypescript, siPython, skillVariant(siLangchain, "LLM / RAG", "llm-rag")],
] as const;

export const SKILLS_FLAT: readonly SkillIcon[] = SKILLS_GRID.flat();
