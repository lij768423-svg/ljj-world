import { ArrowUpRight } from "@phosphor-icons/react/ArrowUpRight";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ServerServiceArt } from "./ServerServiceArt";
import { serverPartImages } from "../assets/serverParts";
import { prefetchServiceImage, prefetchServiceImages } from "../lib/serviceImageLoader";

type MobileServerService = {
  id: string;
  name: string;
  kind: string;
  description: string;
  connection: string;
  deployment: string;
  entryLabel: string;
  entryUrl?: string;
};

type MobileServerCategory = {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: ReactNode;
  services: MobileServerService[];
};

type MobileServerFact = {
  label: string;
  value: string;
};

const categoryVisuals: Record<string, { src: string; alt: string }> = {
  network: { src: serverPartImages["nic-line"], alt: "服务器双口网卡线稿" },
  hardware: { src: serverPartImages["cpu-line"], alt: "服务器处理器线稿" },
  agent: { src: serverPartImages["gpu-line"], alt: "服务器显卡线稿" },
  data: { src: serverPartImages["nvme-line"], alt: "服务器 NVMe 存储线稿" },
  containers: { src: serverPartImages["container-line"], alt: "服务器容器运行核心线稿" },
};

export function MobileServerStory({
  categories,
  facts,
}: {
  categories: MobileServerCategory[];
  facts: readonly MobileServerFact[];
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const firstCategory = categories[0];
  const [activeCategoryId, setActiveCategoryId] = useState(firstCategory?.id ?? "");
  const activeCategory = useMemo(
    () => categories.find((category) => category.id === activeCategoryId) ?? firstCategory,
    [activeCategoryId, categories, firstCategory],
  );
  const [activeServiceId, setActiveServiceId] = useState(activeCategory?.services[0]?.id ?? "");
  const activeService = activeCategory?.services.find((service) => service.id === activeServiceId)
    ?? activeCategory?.services[0];

  useEffect(() => {
    setActiveServiceId(activeCategory?.services[0]?.id ?? "");
    if (activeCategory) prefetchServiceImages(activeCategory.services.map((service) => service.id));
  }, [activeCategory]);

  if (!activeCategory || !activeService) return null;
  const visual = categoryVisuals[activeCategory.id];

  return (
    <section className="server-mobile-story" aria-labelledby="server-mobile-title">
      <div className="server-mobile-shell section-shell">
        <header className="server-mobile-header">
          <div>
            <p className="server-mobile-kicker">HOME-SERVE / PERSONAL INFRASTRUCTURE</p>
            <h1 id="server-mobile-title">我的服务器</h1>
            <p className="server-mobile-intro">
              一台自己组装、自己维护，也真正承载项目与生活的 Linux 主机。
            </p>
          </div>
          <dl className="server-mobile-facts" aria-label="服务器当前快照">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </header>

        <nav className="server-mobile-categories" aria-label="服务器结构章节">
          {categories.map((category) => {
            const isActive = category.id === activeCategory.id;
            return (
              <button
                key={category.id}
                type="button"
                className={isActive ? "is-active" : ""}
                aria-pressed={isActive}
                onClick={() => setActiveCategoryId(category.id)}
              >
                <span aria-hidden="true">{category.icon}</span>
                <span>{category.shortLabel}</span>
              </button>
            );
          })}
        </nav>

        <div className="server-mobile-category">
          <motion.figure
            className="server-mobile-visual"
            key={visual?.src ?? activeCategory.id}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          >
            {visual ? <img src={visual.src} alt={visual.alt} loading="eager" decoding="async" /> : <span aria-hidden="true">//</span>}
          </motion.figure>
          <div className="server-mobile-category-copy">
            <span>{activeCategory.shortLabel}</span>
            <h2>{activeCategory.label}</h2>
            <p>{activeCategory.description}</p>
          </div>
        </div>

        <section className="server-mobile-services" aria-labelledby="server-mobile-services-title">
          <div className="server-mobile-section-heading">
            <div>
              <span>CONNECTED SERVICES</span>
              <h2 id="server-mobile-services-title">这部分正在运行什么</h2>
            </div>
            <small>{activeCategory.services.length} 个节点</small>
          </div>
          <ul>
            {activeCategory.services.map((service, index) => {
              const isActive = service.id === activeService.id;
              return (
                <li key={service.id} className={isActive ? "is-active" : ""}>
                  <button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveServiceId(service.id)}
                    onPointerEnter={() => prefetchServiceImage(service.id)}
                    onFocus={() => prefetchServiceImage(service.id)}
                    onTouchStart={() => prefetchServiceImage(service.id)}
                  >
                    <span className="server-mobile-service-index">{String(index + 1).padStart(2, "0")}</span>
                    <span className="server-mobile-service-name">
                      <strong>{service.name}</strong>
                      <small>{service.kind}</small>
                    </span>
                    <span className="server-mobile-service-mark" aria-hidden="true">↗</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <AnimatePresence mode="wait" initial={false}>
            <motion.article
              key={`${activeCategory.id}-${activeService.id}`}
              className="server-mobile-service-detail"
              aria-live="polite"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            >
              <span>{activeService.kind}</span>
              <h3>{activeService.name}</h3>
              <ServerServiceArt className="server-mobile-service-art" serviceId={activeService.id} name={activeService.name} />
              <p>{activeService.description}</p>
              <dl>
                <div>
                  <dt>连接关系</dt>
                  <dd>{activeService.connection}</dd>
                </div>
                <div>
                  <dt>部署记录</dt>
                  <dd>{activeService.deployment}</dd>
                </div>
              </dl>
              <div className="server-mobile-entry">
                {activeService.entryUrl ? (
                  <a href={activeService.entryUrl} target="_blank" rel="noreferrer">
                    {activeService.entryLabel} <ArrowUpRight size={16} weight="bold" aria-hidden="true" />
                  </a>
                ) : (
                  <span>{activeService.entryLabel}</span>
                )}
              </div>
            </motion.article>
          </AnimatePresence>
        </section>
      </div>
    </section>
  );
}
