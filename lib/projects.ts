import projectConfig from "@/data/projects.json";

export type Localised = { fa: string; en: string };

export interface ProjectRecord {
  slug: string;
  num: string;
  name: Localised;
  stack: string[];
  desc: Localised;
  details: Localised;
  url: string;
  previewPath: string;
  previewMode: "iframe" | "gallery";
  media: string[];
  highlights: string[];
  align: "left" | "right";
  section: `project${number}`;
  badge?: Localised;
  github?: string;
}

export const projects = projectConfig.projects as ProjectRecord[];

export function getProject(slug: string): ProjectRecord | undefined {
  return projects.find((project) => project.slug === slug);
}
