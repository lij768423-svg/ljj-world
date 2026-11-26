import { ArrowUpRight } from "@phosphor-icons/react/ArrowUpRight";
import { AnimatePresence } from "motion/react";
import { Suspense, useEffect, useState } from "react";
import { ProjectHelix, type ProjectPreview, type Project, projects, usePhoneLayout } from "../App";
import { ProjectCardLink, ProjectPaper } from "../components/ProjectPaper";

type IndexProject = Project & { preview: ProjectPreview };

// Built once: the helix rebuilds its WebGL scene whenever this array changes identity, and the
// language switch re-renders the route.
const indexProjects: IndexProject[] = projects.map((project) => ({ ...project, preview: project.cardPreview }));

export function ProjectsPage() {
  const isPhone = usePhoneLayout();

  return (
    <section id="projects" className="project-index has-stage-title project-dna-page" aria-labelledby="project-dna-title">
      <div className="project-dna-shell section-shell">
        <header className="project-dna-heading">
          <h1 id="project-dna-title">项目索引</h1>
          <p>{projects.length} 个持续生长的项目</p>
        </header>
        {isPhone ? (
          <MobileProjectGrid projects={indexProjects} />
        ) : (
          <Suspense fallback={null}>
            <ProjectHelix projects={indexProjects} />
          </Suspense>
        )}
      </div>
    </section>
  );
}

function MobileProjectGrid({ projects: mobileProjects }: { projects: IndexProject[] }) {
  const [selection, setSelection] = useState<{ project: IndexProject; trigger: HTMLAnchorElement } | null>(null);

  useEffect(() => {
    if (!selection) return;
    document.body.classList.add("project-transition-active");
    return () => document.body.classList.remove("project-transition-active");
  }, [selection]);

  const closePaper = () => {
    const trigger = selection?.trigger;
    setSelection(null);
    window.requestAnimationFrame(() => trigger?.focus({ preventScroll: true }));
  };

  return (
    <div className={`index-items project-cloud project-helix project-cloud-count-${mobileProjects.length}`} data-reduced-motion="true">
      <div className="project-helix-nodes" role="list">
        {mobileProjects.map((project) => (
          <article className="index-item helix-node" data-project-id={project.id} role="listitem" key={project.id}>
            <ProjectCardLink project={project} onOpen={(trigger) => setSelection({ project, trigger })}>
              <div className="project-card-kinetic">
                <div className="project-card-float">
                  <div className={`project-card-surface helix-poster-card project-card-${project.category}`}>
                    <div className="project-card-media">
                      <img
                        className={project.preview.fit === "contain" ? "is-contain" : ""}
                        src={project.preview.image}
                        srcSet={project.preview.srcSet}
                        sizes={project.preview.sizes ?? "(max-width: 680px) calc(100vw - 32px), 320px"}
                        alt=""
                        width={project.preview.width}
                        height={project.preview.height}
                        loading="eager"
                        decoding="async"
                        style={{ objectPosition: project.preview.position }}
                      />
                    </div>
                    <div className="helix-poster-caption">
                      <span>{project.kind}</span>
                      <div>
                        <h2>{project.title}</h2>
                        <ArrowUpRight size={16} weight="bold" aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ProjectCardLink>
          </article>
        ))}
      </div>
      <AnimatePresence>
        {selection ? (
          <ProjectPaper key={selection.project.id} project={selection.project} entry={{ from: "bottom" }} onClose={closePaper} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
