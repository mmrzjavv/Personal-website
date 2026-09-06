import { notFound } from "next/navigation";
import ProjectPreview from "@/components/ProjectPreview";
import { getProject, projects } from "@/lib/projects";
import { getBackendUrl } from "@/lib/backend";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

async function getProjectForPreview(slug: string) {
  try {
    const response = await fetch(`${getBackendUrl()}/api/projects/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (response.ok) return response.json();
  } catch {
    // Fall back to bundled seed data while the Python API is unavailable.
  }
  return getProject(slug);
}

export default async function ProjectPreviewRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectForPreview(slug);

  if (!project) notFound();

  return <ProjectPreview project={project} />;
}
