import { ArrowLeft } from "@phosphor-icons/react/ArrowLeft";
import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { ArrowUpRight } from "@phosphor-icons/react/ArrowUpRight";
import { GithubLogo } from "@phosphor-icons/react/GithubLogo";
import { GlobeHemisphereWest } from "@phosphor-icons/react/GlobeHemisphereWest";
import { LockKey } from "@phosphor-icons/react/LockKey";
import { animate, AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { Link, useParams } from "wouter";
import { ProjectHelix, type ProjectPreview, type Project, projects, ExternalLink, usePhoneLayout, NotFoundPage } from "../App";

type GalleryShot = {
  id: string;
  label: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  width: number;
  height: number;
  srcSet?: string;
  sizes?: string;
  fit?: "cover" | "contain";
  position?: string;
};

type FlagshipCaseStudy = {
  projectId: "408-web" | "law-site";
  statement: string;
  overview: string;
  heroShot: GalleryShot;
  tourShots: GalleryShot[];
  facts: Array<{ label: string; value: string }>;
  flowTitle: string;
  flow: Array<{ title: string; description: string }>;
  decisionsTitle: string;
  decisionsIntro: string;
  decisions: Array<{ title: string; description: string; note: string }>;
  resultTitle: string;
  resultBody: string;
  results: Array<{ value: string; label: string; detail: string }>;
  resultNote?: string;
  nextProjectId: "408-web" | "law-site";
};

const reviewFlowShot: GalleryShot = {
  id: "review-flow",
  label: "刷题复盘闭环",
  title: "从作答到复习与知识沉淀",
  description: "用一张流程图说明选题、作答、判分、错题回炉、AI 讲题与本地保存如何连续发生。",
  image: "/assets/408-review-flow.webp",
  alt: "408 刷题库从选题、作答到错题复盘与 AI 讲题的完整流程图",
  width: 1400,
  height: 788,
  fit: "contain",
  position: "center",
};

const galleryShots: GalleryShot[] = [
  {
    id: "dashboard",
    label: "学习仪表盘",
    title: "先知道今天该复习什么",
    description: "把 14 天学习节奏、待复习章节和四科掌握度放在同一张仪表盘上。",
    image: "/assets/408-dashboard.webp",
    alt: "408 刷题库学习仪表盘真实界面",
    width: 3200,
    height: 2000,
    srcSet: "/assets/408-dashboard-800.webp 800w, /assets/408-dashboard-1600.webp 1600w, /assets/408-dashboard.webp 3200w",
    sizes: "(max-width: 680px) calc(100vw - 32px), (max-width: 980px) calc(100vw - 72px), 60vw",
    position: "center top",
  },
  {
    id: "quiz",
    label: "真实答题",
    title: "题库、导航与学习记录共处一屏",
    description: "顺序、随机、今日复习、错题与收藏都从同一套题库导航进入。",
    image: "/assets/408-quiz.webp",
    alt: "408 刷题库桌面答题真实界面",
    width: 3200,
    height: 2000,
    srcSet: "/assets/408-quiz-800.webp 800w, /assets/408-quiz-1600.webp 1600w, /assets/408-quiz.webp 3200w",
    sizes: "(max-width: 680px) calc(100vw - 32px), (max-width: 980px) calc(100vw - 72px), 60vw",
  },
  {
    id: "feedback",
    label: "错题反馈",
    title: "答错后立刻进入复盘路径",
    description: "答案、题库解析与 AI 分析入口在提交后同时出现，错题自动进入复习计划。",
    image: "/assets/408-feedback.webp",
    alt: "408 刷题库错题反馈真实界面",
    width: 3200,
    height: 2000,
    srcSet: "/assets/408-feedback-800.webp 800w, /assets/408-feedback-1600.webp 1600w, /assets/408-feedback.webp 3200w",
    sizes: "(max-width: 680px) calc(100vw - 32px), (max-width: 980px) calc(100vw - 72px), 60vw",
  },
  {
    id: "ai",
    label: "AI 讲题",
    title: "让解释落在具体题目上下文里",
    description: "AI 面板保留题号、章节和作答上下文，回答可以继续追问或保存进知识库。",
    image: "/assets/408-ai.webp",
    alt: "408 刷题库 AI 讲题真实界面",
    width: 1440,
    height: 1000,
    srcSet: "/assets/408-ai-800.webp 800w, /assets/408-ai.webp 1440w",
    sizes: "(max-width: 680px) calc(100vw - 32px), (max-width: 980px) calc(100vw - 72px), 60vw",
    fit: "contain",
    position: "center top",
  },
  {
    id: "search",
    label: "全库搜索",
    title: "从 2378 道题里直接定位知识点",
    description: "题干、选项和解析都可检索，并按真题、模拟题、课后题与年份继续筛选。",
    image: "/assets/408-search.webp",
    alt: "408 刷题库全库搜索真实界面",
    width: 3200,
    height: 2000,
    srcSet: "/assets/408-search-800.webp 800w, /assets/408-search-1600.webp 1600w, /assets/408-search.webp 3200w",
    sizes: "(max-width: 680px) calc(100vw - 32px), (max-width: 980px) calc(100vw - 72px), 60vw",
  },
  {
    id: "wiki",
    label: "个人知识库",
    title: "把一次解释沉淀成可继续编辑的笔记",
    description: "题目与概念笔记写入 Markdown 知识库，可搜索、按科目浏览，也能继续向 AI 追问。",
    image: "/assets/408-wiki.webp",
    alt: "408 刷题库个人知识库真实界面",
    width: 1440,
    height: 1000,
    srcSet: "/assets/408-wiki-800.webp 800w, /assets/408-wiki.webp 1440w",
    sizes: "(max-width: 680px) calc(100vw - 32px), (max-width: 980px) calc(100vw - 72px), 60vw",
    fit: "contain",
    position: "center top",
  },
];

const lawGalleryShots: GalleryShot[] = [
  {
    id: "home",
    label: "机构门户",
    title: "让团队、内容与咨询从同一入口开始",
    description: "首页集中呈现团队、公告、专业内容、案例与咨询入口，先建立机构可信度。",
    image: "/assets/law-home.webp",
    alt: "根旺律所数字站首页真实界面",
    width: 3200,
    height: 2000,
    srcSet: "/assets/law-home-800.webp 800w, /assets/law-home-1600.webp 1600w, /assets/law-home.webp 3200w",
    sizes: "(max-width: 680px) calc(100vw - 32px), (max-width: 980px) 54vw, 44vw",
    position: "left top",
  },
  {
    id: "services",
    label: "业务领域",
    title: "把服务范围组织成可检索的判断入口",
    description: "13 项法律服务按刑事、民事与综合事务分组，并说明适用情形与沟通重点。",
    image: "/assets/law-services.webp",
    alt: "根旺律所业务领域与服务检索真实界面",
    width: 3200,
    height: 2000,
    srcSet: "/assets/law-services-800.webp 800w, /assets/law-services-1600.webp 1600w, /assets/law-services.webp 3200w",
    sizes: "(max-width: 680px) calc(100vw - 32px), (max-width: 980px) 54vw, 44vw",
    position: "left top",
  },
  {
    id: "cases",
    label: "脱敏案例",
    title: "用真实工作记录解释专业能力",
    description: "案例按争议专题组织，保留审查重点与工作方法，同时隐藏当事人敏感信息。",
    image: "/assets/law-cases.webp",
    alt: "根旺律所脱敏案例与工作记录真实界面",
    width: 3200,
    height: 2000,
    srcSet: "/assets/law-cases-800.webp 800w, /assets/law-cases-1600.webp 1600w, /assets/law-cases.webp 3200w",
    sizes: "(max-width: 680px) calc(100vw - 32px), (max-width: 980px) 54vw, 44vw",
    position: "left top",
  },
  {
    id: "insights",
    label: "文章资料库",
    title: "让长期内容可以搜索、分类和继续阅读",
    description: "案例分享、专业文章、法律问答和律所动态统一进入内容资料库。",
    image: "/assets/law-insights.webp",
    alt: "根旺律所专业文章资料库真实界面",
    width: 3200,
    height: 2000,
    srcSet: "/assets/law-insights-800.webp 800w, /assets/law-insights-1600.webp 1600w, /assets/law-insights.webp 3200w",
    sizes: "(max-width: 680px) calc(100vw - 32px), (max-width: 980px) 54vw, 44vw",
    position: "left top",
  },
  {
    id: "article",
    label: "文章阅读",
    title: "长文、目录与脱敏证据在一屏内协同",
    description: "阅读器提供正文目录、同栏文章和前后篇导航，并展示经过脱敏的案件材料。",
    image: "/assets/law-article.webp",
    alt: "根旺律所专业文章阅读器真实界面",
    width: 3200,
    height: 2000,
    srcSet: "/assets/law-article-800.webp 800w, /assets/law-article-1600.webp 1600w, /assets/law-article.webp 3200w",
    sizes: "(max-width: 680px) calc(100vw - 32px), (max-width: 980px) 54vw, 44vw",
    position: "left top",
  },
  {
    id: "consultation",
    label: "在线咨询",
    title: "先澄清问题，再进入人工服务",
    description: "智能助手收集阶段、措施与诉求，持续提醒隐私边界，并保留转人工入口。",
    image: "/assets/law-consultation.webp",
    alt: "根旺律所访客在线咨询真实界面",
    width: 3200,
    height: 2000,
    srcSet: "/assets/law-consultation-800.webp 800w, /assets/law-consultation-1600.webp 1600w, /assets/law-consultation.webp 3200w",
    sizes: "(max-width: 680px) calc(100vw - 32px), (max-width: 980px) 54vw, 44vw",
    position: "left top",
  },
];

const flagshipCaseStudies: Record<FlagshipCaseStudy["projectId"], FlagshipCaseStudy> = {
  "408-web": {
    projectId: "408-web",
    statement: "题库不是终点。答错以后，产品能不能把人带回正确的复习节奏，才决定一次刷题有没有价值。",
    overview: "我把自己备考时最容易断开的几个动作重新接在一起：先判断薄弱章节，再完成作答和即时反馈，随后由复习计划安排下一次出现，最后把真正没想明白的内容交给 AI 和个人知识库继续处理。",
    heroShot: reviewFlowShot,
    tourShots: galleryShots.slice(1),
    facts: [
      { label: "题库规模", value: "2,378 题" },
      { label: "科目覆盖", value: "408 四科" },
      { label: "核心策略", value: "本地优先" },
      { label: "运行形态", value: "静态 / 完整后端" },
    ],
    flowTitle: "一次作答，怎样变成下一次有效复习",
    flow: [
      { title: "建立样本", description: "从 20 题随机诊断或任意章节开始，先获得真实作答记录。" },
      { title: "完成作答", description: "顺序、随机、错题、收藏与今日复习共享同一套答题界面。" },
      { title: "看见错因", description: "正确答案、个人选择、题库解析与 AI 分析入口同时出现。" },
      { title: "安排重现", description: "错题进入计划，答对后按 1、3、7、14、30、60 天延长间隔。" },
      { title: "留下知识", description: "需要长期保留的题目或概念被写入可搜索的 Markdown 知识库。" },
    ],
    decisionsTitle: "先保证学习闭环，再决定是否连接服务器",
    decisionsIntro: "基础刷题不应该被账号、网络或 AI 可用性绑住。完整后端带来同步和流式讲题，但核心学习路径在纯静态部署下仍然成立。",
    decisions: [
      {
        title: "本地模式先跑通核心价值",
        description: "题库、搜索、错题、收藏、仪表盘和复习计划全部可以留在当前浏览器，打开静态站就能开始。",
        note: "没有后端时自动进入 LOCAL 模式",
      },
      {
        title: "把错题做成调度状态",
        description: "系统记录连续正确次数和下一次到期时间。连续答对后离开普通错题列表，但长期复习计划仍然保留。",
        note: "复习间隔由真实作答结果推进",
      },
      {
        title: "AI 是可选层，不是前置条件",
        description: "本地模式可复制完整题目上下文到外部 AI；完整后端才启用同源 SSE、错因分析和知识库保存。",
        note: "不配置 AI 也不影响刷题和解析",
      },
      {
        title: "学习记录始终可以带走",
        description: "本地记录支持 JSON 导入导出。登录后的完整模式再增加跨设备同步，同时保留浏览器缓存作为恢复路径。",
        note: "数据迁移能力属于基础功能",
      },
    ],
    resultTitle: "最终交付的不是一张题库页面，而是一套能持续运行的学习流程。",
    resultBody: "项目目前可以直接静态部署，也为认证、进度同步、AI 与知识库提供了完整接口契约。测试覆盖刷题、复习、搜索、数据迁移与完整后端的关键路径。",
    results: [
      { value: "6 级", label: "间隔复习", detail: "从 1 天逐步延长到 60 天" },
      { value: "20 题", label: "首次诊断", detail: "先建立一组可用学习样本" },
      { value: "2 种", label: "运行模式", detail: "静态本地模式与完整后端模式" },
      { value: "开源", label: "交付状态", detail: "源码、部署说明与接口契约公开" },
    ],
    nextProjectId: "law-site",
  },
  "law-site": {
    projectId: "law-site",
    statement: "律所网站不只是机构简介。公开内容、初步咨询、隐私边界和后台维护必须在同一套规则下运转。",
    overview: "这个项目从真实资料整理开始，最终形成公开官网、Payload CMS、咨询流程和原生微信小程序。页面负责建立信任与解释服务，后台负责来源、审核和发布，咨询链路只收集初步判断真正需要的信息。",
    heroShot: lawGalleryShots[0],
    tourShots: lawGalleryShots.slice(1),
    facts: [
      { label: "交付形态", value: "官网 + CMS" },
      { label: "公开路由", value: "14 条" },
      { label: "生产状态", value: "在线运行" },
      { label: "扩展终端", value: "原生小程序" },
    ],
    flowTitle: "访客看到的是网站，背后运行的是一套内容与咨询秩序",
    flow: [
      { title: "建立信任", description: "机构资料、律师团队和公开信息先回答访客最基本的真实性问题。" },
      { title: "找到方向", description: "业务领域按服务阶段组织，让访客先判断自己的问题应该从哪里开始。" },
      { title: "理解方法", description: "脱敏案例与专业文章解释工作重点，不承诺结果，也不暴露当事人信息。" },
      { title: "初步咨询", description: "助手只收集阶段、措施与诉求，持续提醒隐私边界并保留转人工入口。" },
      { title: "后台维护", description: "结构化内容、来源、授权和发布状态进入同一套 CMS 工作流。" },
    ],
    decisionsTitle: "可信度来自内容治理，不来自更响亮的宣传语",
    decisionsIntro: "这是一个受监管行业的真实交付。设计、内容模型、访问权限和部署方式都围绕同一件事展开：哪些内容可以公开，哪些数据只能被授权人员看见。",
    decisions: [
      {
        title: "公开事实必须能回到来源",
        description: "律师履历、荣誉、案例陈述与数字都关联结构化来源。脱敏、发布授权和当前修订版本共同决定内容能否上线。",
        note: "CMS 把来源与审批变成内容字段",
      },
      {
        title: "咨询只收集初步判断所需信息",
        description: "公开入口不收身份证号、完整姓名、案号、证据原件或精确羁押地点，咨询记录按权限保存并进入定期清理。",
        note: "隐私边界直接写进产品流程",
      },
      {
        title: "公开站与管理面保持明确边界",
        description: "后台入口不在前台展示，公开 GraphQL 保持关闭，咨询记录通过 Payload 权限与手机号二次显示机制保护。",
        note: "可发现性和可访问性被分别设计",
      },
      {
        title: "一套内容继续服务原生小程序",
        description: "五个底部入口、业务与律师详情、文章案例、律所介绍和咨询对话均使用原生页面，并接入官网专用接口。",
        note: "随包内容与离线分流提供兜底",
      },
    ],
    resultTitle: "网站已经上线，但可持续交付才是这个项目真正完成的部分。",
    resultBody: "公开内容、在线咨询、CMS 维护、生产部署和原生小程序拥有清晰边界。上线验收覆盖公开路由、核心流程、性能与内容发布规则。",
    results: [
      { value: "14 条", label: "公开路由", detail: "2026-07-16 验收均返回 HTTP 200" },
      { value: "1.34 s", label: "首页 LCP", detail: "同次公网抽样结果" },
      { value: "91 项", label: "Playwright", detail: "交付记录中的通过数量" },
      { value: "3 端", label: "内容交付", detail: "公开站、CMS 与原生小程序" },
    ],
    resultNote: "验收数字来自 2026-07-16 的项目交接记录，后续部署会继续重新验证。",
    nextProjectId: "408-web",
  },
};

function trackPointerGlow(event: ReactPointerEvent<HTMLElement>) {
  if (event.pointerType === "touch") return;
  const bounds = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--spotlight-x", `${event.clientX - bounds.left}px`);
  event.currentTarget.style.setProperty("--spotlight-y", `${event.clientY - bounds.top}px`);
}

function resetPointerGlow(event: ReactPointerEvent<HTMLElement>) {
  event.currentTarget.style.removeProperty("--spotlight-x");
  event.currentTarget.style.removeProperty("--spotlight-y");
}

function ProjectLinks({ project, includeDetail = true }: { project: Project; includeDetail?: boolean }) {
  return (
    <div className="row-links">
      {includeDetail && project.detail ? (
        <Link to={project.detail} className="icon-link">
          <ArrowRight size={18} weight="bold" />
          <span className="sr-only">阅读 {project.title} 案例</span>
        </Link>
      ) : null}
      {project.site ? (
        <ExternalLink href={project.site} className="icon-link">
          <GlobeHemisphereWest size={18} weight="bold" />
          <span className="sr-only">打开 {project.title}</span>
        </ExternalLink>
      ) : null}
      {project.repo ? (
        <ExternalLink href={project.repo} className="icon-link">
          <GithubLogo size={18} weight="fill" />
          <span className="sr-only">查看 {project.title} 源码</span>
        </ExternalLink>
      ) : null}
      {(!includeDetail || !project.detail) && !project.site && !project.repo ? (
        <span className="private-icon" role="img" title="非公开项目" aria-label={`${project.title} 为非公开项目`}>
          <LockKey size={18} weight="bold" />
        </span>
      ) : null}
    </div>
  );
}

export function ProjectsPage() {
  const isPhone = usePhoneLayout();
  const helixProjects = projects.map((project) => ({
    ...project,
    preview: project.cardPreview,
    href: project.detail ?? `/projects/${project.id}`,
  }));

  return (
    <section id="projects" className="project-index has-stage-title project-dna-page" aria-labelledby="project-dna-title">
      <div className="project-dna-shell section-shell">
        <header className="project-dna-heading">
          <h1 id="project-dna-title">项目索引</h1>
          <p>{projects.length} 个持续生长的项目</p>
        </header>
        {isPhone ? (
          <MobileProjectGrid projects={helixProjects} />
        ) : (
          <Suspense fallback={null}>
            <ProjectHelix projects={helixProjects} />
          </Suspense>
        )}
      </div>
    </section>
  );
}

function MobileProjectGrid({ projects: mobileProjects }: { projects: Array<Project & { href: string; preview: ProjectPreview }> }) {
  return (
    <div className={`index-items project-cloud project-helix project-cloud-count-${mobileProjects.length}`} data-reduced-motion="true">
      <div className="project-helix-nodes" role="list">
        {mobileProjects.map((project) => (
          <article className="index-item helix-node" data-project-id={project.id} role="listitem" key={project.id}>
            <Link className="project-card-link" to={project.href}>
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
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}

type ProjectDossierTab = "overview" | "build" | "result" | "live";

const projectDossierTabs: Array<{ id: ProjectDossierTab; label: string }> = [
  { id: "overview", label: "概览" },
  { id: "build", label: "实现" },
  { id: "result", label: "成果" },
  { id: "live", label: "在线体验" },
];

function projectHref(project: Project) {
  return project.detail ?? `/projects/${project.id}`;
}

const flagshipScenes = [
  { id: "overview", label: "概览" },
  { id: "flow", label: "闭环" },
  { id: "interface", label: "界面" },
  { id: "delivery", label: "交付" },
] as const;

type FlagshipSceneId = (typeof flagshipScenes)[number]["id"];

function FlagshipSceneRail({
  activeScene,
  onSelect,
}: {
  activeScene: FlagshipSceneId;
  onSelect: (scene: FlagshipSceneId) => void;
}) {
  return (
    <nav className="flagship-scene-rail" aria-label="项目案例章节">
      {flagshipScenes.map((scene) => (
        <button
          key={scene.id}
          type="button"
          className={activeScene === scene.id ? "is-active" : ""}
          aria-current={activeScene === scene.id ? "page" : undefined}
          onClick={() => onSelect(scene.id)}
        >
          <span aria-hidden="true" />
          <strong>{scene.label}</strong>
        </button>
      ))}
    </nav>
  );
}

function FlagshipProductTour({
  study,
  activeShotIndex,
  onSelectShot,
}: {
  study: FlagshipCaseStudy;
  activeShotIndex: number;
  onSelectShot: (shotIndex: number) => void;
}) {
  const [previewShotIndex, setPreviewShotIndex] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();
  const displayedShotIndex = previewShotIndex ?? activeShotIndex;
  const activeShot = study.tourShots[displayedShotIndex] ?? study.tourShots[0];

  useEffect(() => {
    setPreviewShotIndex(null);
  }, [activeShotIndex]);

  useEffect(() => {
    study.tourShots.forEach((shot) => {
      const image = new Image();
      if (shot.srcSet) image.srcset = shot.srcSet;
      image.sizes = "(max-width: 1080px) calc(100vw - 40px), min(66vw, 1040px)";
      image.src = shot.image;
    });
  }, [study.tourShots]);

  return (
    <div
      className="flagship-tour-layout"
      style={{ "--flagship-tour-count": study.tourShots.length } as CSSProperties}
    >
      <figure className="flagship-tour-visual">
        <div className="flagship-tour-screen">
          <AnimatePresence initial={false}>
            <motion.img
              key={activeShot.id}
              className={activeShot.fit === "contain" ? "is-contain" : ""}
              src={activeShot.image}
              srcSet={activeShot.srcSet}
              sizes="(max-width: 1080px) calc(100vw - 40px), min(66vw, 1040px)"
              alt={activeShot.alt}
              width={activeShot.width}
              height={activeShot.height}
              style={{ objectPosition: activeShot.position }}
              initial={reduceMotion ? false : { opacity: 0, scale: 1.018, filter: "blur(7px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.988, filter: "blur(5px)" }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
              loading="lazy"
              decoding="async"
            />
          </AnimatePresence>
        </div>
        <figcaption aria-live="polite">
          <span>{activeShot.label}</span>
          <strong>{activeShot.title}</strong>
        </figcaption>
      </figure>

      <div className="flagship-tour-steps" role="list" aria-label="真实界面列表">
        {study.tourShots.map((shot, shotIndex) => (
          <motion.button
            key={shot.id}
            type="button"
            role="listitem"
            className={displayedShotIndex === shotIndex ? "is-active" : ""}
            aria-pressed={activeShotIndex === shotIndex}
            data-tour-shot-index={shotIndex}
            onClick={() => {
              setPreviewShotIndex(null);
              onSelectShot(shotIndex);
            }}
            onFocus={() => setPreviewShotIndex(shotIndex)}
            onBlur={() => setPreviewShotIndex(null)}
            onPointerEnter={() => setPreviewShotIndex(shotIndex)}
            onPointerLeave={() => setPreviewShotIndex(null)}
          >
            <span>{shot.label}</span>
            <strong>{shot.title}</strong>
            <p>{shot.description}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export function FlagshipCaseStudyPage({ projectId }: { projectId: FlagshipCaseStudy["projectId"] }) {
  const storyRef = useRef<HTMLDivElement>(null);
  const [activeScene, setActiveScene] = useState<FlagshipSceneId>("overview");
  const [activeShotIndex, setActiveShotIndex] = useState(0);
  const project = projects.find((item) => item.id === projectId);
  const study = flagshipCaseStudies[projectId];
  const nextProject = projects.find((item) => item.id === study.nextProjectId);
  const nextStudy = flagshipCaseStudies[study.nextProjectId];
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ container: storyRef });

  useMotionValueEvent(scrollYProgress, "change", () => {
    const story = storyRef.current;
    if (!story) return;
    const viewportHeight = story.clientHeight;
    if (viewportHeight <= 0) return;

    const interfaceStart = 2;
    const deliveryStart = interfaceStart + study.tourShots.length;
    const storyPosition = story.scrollTop / viewportHeight;
    const nextScene: FlagshipSceneId = storyPosition < 0.5
      ? "overview"
      : storyPosition < 1.5
        ? "flow"
        : storyPosition < deliveryStart - 0.5
          ? "interface"
          : "delivery";
    const nextShotIndex = Math.min(
      study.tourShots.length - 1,
      Math.max(0, Math.round(storyPosition - interfaceStart)),
    );

    setActiveScene((current) => current === nextScene ? current : nextScene);
    setActiveShotIndex((current) => current === nextShotIndex ? current : nextShotIndex);
  });

  if (!project || !nextProject) return <NotFoundPage />;

  function selectScene(scene: FlagshipSceneId) {
    const story = storyRef.current;
    if (!story) return;
    const scenePosition: Record<FlagshipSceneId, number> = {
      overview: 0,
      flow: 1,
      interface: 2,
      delivery: 2 + study.tourShots.length,
    };
    setActiveScene(scene);
    if (scene === "interface") setActiveShotIndex(0);
    story.scrollTo({
      top: story.clientHeight * scenePosition[scene],
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  function selectTourShot(shotIndex: number) {
    const story = storyRef.current;
    if (!story) return;
    const nextShotIndex = Math.min(study.tourShots.length - 1, Math.max(0, shotIndex));
    setActiveScene("interface");
    setActiveShotIndex(nextShotIndex);
    story.scrollTo({
      top: story.clientHeight * (2 + nextShotIndex),
      behavior: "auto",
    });
  }

  return (
    <article
      className="flagship-case-page"
      data-flagship-project={project.id}
      aria-labelledby="flagship-case-title"
    >
      <motion.div
        className="flagship-reading-progress"
        style={{ scaleX: scrollYProgress }}
        aria-hidden="true"
      />

      <div ref={storyRef} className="flagship-story">
        <section className="flagship-scene flagship-overview flagship-hero" data-flagship-scene="overview">
          <div className="flagship-case-shell flagship-overview-shell">
            <header className="flagship-topline">
              <Link className="flagship-back" to="/projects">
                <ArrowLeft size={16} weight="bold" aria-hidden="true" /> 项目索引
              </Link>
              <p>{project.kind} / {project.status} / {project.year}</p>
            </header>

            <div className="flagship-hero-layout">
              <motion.div
                className="flagship-hero-copy"
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.52, ease: [0.16, 1, 0.3, 1] }}
              >
                <h1 id="flagship-case-title">{project.title}</h1>
                <p className="flagship-hero-summary">{project.description}</p>
                <div className="flagship-hero-actions">
                  {project.site ? (
                    <ExternalLink className="flagship-action is-primary" href={project.site}>
                      在线版本 <ArrowUpRight size={16} weight="bold" aria-hidden="true" />
                    </ExternalLink>
                  ) : null}
                  {project.repo ? (
                    <ExternalLink className="flagship-action is-secondary" href={project.repo}>
                      公开源码 <GithubLogo size={16} weight="fill" aria-hidden="true" />
                    </ExternalLink>
                  ) : null}
                </div>
              </motion.div>

              <motion.figure
                className="flagship-hero-figure"
                initial={reduceMotion ? false : { opacity: 0, clipPath: "inset(0 100% 0 0)" }}
                animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
                transition={{ duration: 0.72, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              >
                <img
                  className={study.heroShot.fit === "contain" ? "is-contain" : ""}
                  src={study.heroShot.image}
                  srcSet={study.heroShot.srcSet}
                  sizes="(max-width: 1080px) calc(100vw - 40px), min(62vw, 960px)"
                  alt={study.heroShot.alt}
                  width={study.heroShot.width}
                  height={study.heroShot.height}
                  style={{ objectPosition: study.heroShot.position }}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
                <figcaption>
                  <span>{study.heroShot.label}</span>
                  <strong>{study.heroShot.title}</strong>
                </figcaption>
              </motion.figure>
            </div>

            <dl className="flagship-facts">
              {study.facts.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="flagship-scene flagship-flow-scene" data-flagship-scene="flow" aria-labelledby="flagship-flow-title">
          <div className="flagship-case-shell flagship-flow-shell">
            <header className="flagship-section-heading">
              <h2 id="flagship-flow-title">{study.flowTitle}</h2>
            </header>

            <div className="flagship-problem-grid">
              <div className="flagship-statement">
                <strong>{study.statement}</strong>
                <p>{study.overview}</p>
              </div>
              <div className="flagship-flow-track">
                {study.flow.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.45 }}
                    transition={{ duration: 0.35, delay: reduceMotion ? 0 : index * 0.045, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                    {index < study.flow.length - 1 ? <ArrowRight size={16} weight="bold" aria-hidden="true" /> : null}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          className="flagship-scene flagship-interface-scene"
          data-flagship-scene="interface"
          aria-labelledby="flagship-tour-title"
          style={{
            "--flagship-tour-height": `${study.tourShots.length * 100}%`,
            "--flagship-tour-pin-height": `${100 / study.tourShots.length}%`,
          } as CSSProperties}
        >
          <div className="flagship-interface-pin">
            <div className="flagship-case-shell flagship-interface-shell">
              <header className="flagship-section-heading">
                <h2 id="flagship-tour-title">真实界面与完整使用路径</h2>
              </header>
              <FlagshipProductTour
                study={study}
                activeShotIndex={activeShotIndex}
                onSelectShot={selectTourShot}
              />
            </div>
          </div>
        </section>

        <section className="flagship-scene flagship-delivery-scene" data-flagship-scene="delivery" aria-labelledby="flagship-decisions-title">
          <div className="flagship-case-shell flagship-delivery-shell">
            <header className="flagship-section-heading flagship-delivery-heading">
              <h2 id="flagship-decisions-title">{study.decisionsTitle}</h2>
              <p>{study.decisionsIntro}</p>
            </header>

            <div className="flagship-delivery-layout">
              <div className="flagship-decision-grid">
                {study.decisions.map((decision, index) => (
                  <motion.article
                    key={decision.title}
                    initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ duration: 0.38, delay: reduceMotion ? 0 : index * 0.045, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <h3>{decision.title}</h3>
                    <p>{decision.description}</p>
                    <span>{decision.note}</span>
                  </motion.article>
                ))}
              </div>

              <aside className="flagship-result" aria-labelledby="flagship-result-title">
                <div className="flagship-result-intro">
                  <h2 id="flagship-result-title">{study.resultTitle}</h2>
                  <p>{study.resultBody}</p>
                </div>
                <div className="flagship-result-grid">
                  {study.results.map((result) => (
                    <div key={`${result.value}-${result.label}`}>
                      <strong>{result.value}</strong>
                      <span>{result.label}</span>
                      <p>{result.detail}</p>
                    </div>
                  ))}
                </div>
                {study.resultNote ? <p className="flagship-result-note">{study.resultNote}</p> : null}
                <div className="flagship-result-actions">
                  {project.site ? (
                    <ExternalLink className="flagship-action is-primary" href={project.site}>
                      在线版本 <GlobeHemisphereWest size={16} weight="bold" aria-hidden="true" />
                    </ExternalLink>
                  ) : null}
                  {project.repo ? (
                    <ExternalLink className="flagship-action is-secondary" href={project.repo}>
                      公开源码 <GithubLogo size={16} weight="fill" aria-hidden="true" />
                    </ExternalLink>
                  ) : null}
                </div>
                <Link className="flagship-next" to={projectHref(nextProject)}>
                  <span>下一个主推项目</span>
                  <strong>{nextProject.title}</strong>
                  <figure>
                    <img
                      src={nextStudy.heroShot.image}
                      srcSet={nextStudy.heroShot.srcSet}
                      sizes="300px"
                      alt=""
                      width={nextStudy.heroShot.width}
                      height={nextStudy.heroShot.height}
                      loading="lazy"
                      decoding="async"
                    />
                    <ArrowRight size={22} weight="bold" aria-hidden="true" />
                  </figure>
                </Link>
              </aside>
            </div>
          </div>
        </section>
      </div>

      <FlagshipSceneRail activeScene={activeScene} onSelect={selectScene} />
    </article>
  );
}

export function ProjectDossierPage({ projectId: fixedProjectId }: { projectId?: string }) {
  const params = useParams();
  const project = projects.find((item) => item.id === (fixedProjectId ?? params.projectId));
  const [activeTab, setActiveTab] = useState<ProjectDossierTab>("overview");
  const reduceMotion = useReducedMotion();

  if (!project) return <NotFoundPage />;

  const projectIndex = projects.indexOf(project);
  const previousProject = projects[(projectIndex - 1 + projects.length) % projects.length];
  const nextProject = projects[(projectIndex + 1) % projects.length];
  const visual = project.preview ?? project.cardPreview;
  const hasSystemsView =
    project.category === "system" || project.id === "mineradio";
  const dossierTabs = project.liveDemo
    ? projectDossierTabs
    : projectDossierTabs.filter((tab) => tab.id !== "live");

  function moveTab(direction: -1 | 1) {
    const currentIndex = dossierTabs.findIndex((tab) => tab.id === activeTab);
    const nextIndex = (currentIndex + direction + dossierTabs.length) % dossierTabs.length;
    const nextTab = dossierTabs[nextIndex];
    setActiveTab(nextTab.id);
    window.requestAnimationFrame(() => document.getElementById(`project-tab-${nextTab.id}`)?.focus());
  }

  return (
    <section
      className="project-dossier-page"
      data-project-dossier={project.id}
      data-project-category={project.category}
      aria-labelledby="project-dossier-title"
    >
      <div className="project-dossier section-shell">
        <aside className="project-dossier-info">
          <Link className="project-dossier-back" to="/projects">
            <ArrowLeft size={17} weight="bold" /> 项目索引
          </Link>

          <motion.header
            className="project-dossier-heading"
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.58, ease: [0.16, 1, 0.3, 1] }}
          >
            <p>{project.kind}</p>
            <h1 id="project-dossier-title">{project.title}</h1>
            <p className="project-dossier-summary">{project.description}</p>
          </motion.header>

          <div className="project-dossier-meta">
            <dl>
              <div><dt>状态</dt><dd>{project.status}</dd></div>
              <div><dt>年份</dt><dd>{project.year}</dd></div>
            </dl>
            <div className="project-dossier-tags" aria-label={`${project.title} 技术栈`}>
              {project.tags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
            <ProjectLinks project={project} includeDetail={false} />
          </div>
        </aside>

        <motion.figure
          className="project-dossier-figure"
          initial={reduceMotion ? false : { opacity: 0, clipPath: "inset(0 100% 0 0)" }}
          animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
          transition={{ duration: 0.72, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className="project-dossier-media"
            data-visual-source={project.preview ? "interface" : "cover"}
            onPointerMove={trackPointerGlow}
            onPointerLeave={resetPointerGlow}
          >
            <img
              className={visual.fit === "contain" ? "is-contain" : ""}
              src={visual.image}
              srcSet={visual.srcSet}
              sizes={visual.sizes ?? "(max-width: 1080px) calc(100vw - 72px), min(46vw, 690px)"}
              alt={visual.alt}
              width={visual.width}
              height={visual.height}
              style={{ objectPosition: visual.position }}
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </div>
          <figcaption>
            <span>{project.preview ? "真实界面" : "项目概念封面"}</span>
            <nav aria-label="相邻项目">
              <Link to={projectHref(previousProject)} title={`上一个项目：${previousProject.title}`}>
                <ArrowLeft size={17} weight="bold" />
                <span className="sr-only">上一个项目：{previousProject.title}</span>
              </Link>
              <Link to={projectHref(nextProject)} title={`下一个项目：${nextProject.title}`}>
                <ArrowRight size={17} weight="bold" />
                <span className="sr-only">下一个项目：{nextProject.title}</span>
              </Link>
            </nav>
          </figcaption>
        </motion.figure>

        <section className="project-dossier-story" aria-label={`${project.title} 项目说明`}>
          <div
            className="project-dossier-tabs"
            role="tablist"
            aria-label="项目说明视图"
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                moveTab(-1);
              }
              if (event.key === "ArrowRight") {
                event.preventDefault();
                moveTab(1);
              }
            }}
          >
            {dossierTabs.map((tab) => (
              <button
                key={tab.id}
                id={`project-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`project-panel-${tab.id}`}
                tabIndex={activeTab === tab.id ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="project-dossier-panel-frame">
            <AnimatePresence mode="wait" initial={false}>
              <motion.article
                key={activeTab}
                id={`project-panel-${activeTab}`}
                className={`project-dossier-panel is-${activeTab}`}
                role="tabpanel"
                aria-labelledby={`project-tab-${activeTab}`}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              >
                {activeTab === "overview" ? (
                  <div className="project-dossier-overview">
                    <section>
                      <span>要解决的问题</span>
                      <p>{project.story.problem}</p>
                    </section>
                    <section>
                      <span>采取的方法</span>
                      <p>{project.story.approach}</p>
                    </section>
                    <section>
                      <span>形成的结果</span>
                      <p>{project.story.outcome}</p>
                    </section>
                  </div>
                ) : null}

                {activeTab === "build" ? (
                  <div className="project-dossier-build">
                    <p>{project.story.approach}</p>
                    <ol>
                      {project.story.highlights.map((highlight) => (
                        <li key={highlight.title}>
                          <strong>{highlight.title}</strong>
                          <p>{highlight.description}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}

                {activeTab === "result" ? (
                  <div className="project-dossier-result">
                    <p>{project.story.outcome}</p>
                    <dl>
                      <div><dt>交付形态</dt><dd>{project.kind}</dd></div>
                      <div><dt>当前状态</dt><dd>{project.status}</dd></div>
                      <div><dt>技术构成</dt><dd>{project.tags.join(" / ")}</dd></div>
                    </dl>
                    <div className="project-dossier-result-links">
                      {project.site ? (
                        <ExternalLink href={project.site}>打开在线版本 <ArrowUpRight size={16} weight="bold" /></ExternalLink>
                      ) : null}
                      {project.repo ? (
                        <ExternalLink href={project.repo}>查看公开源码 <ArrowUpRight size={16} weight="bold" /></ExternalLink>
                      ) : null}
                      {hasSystemsView ? (
                        <Link to="/systems">查看服务器结构 <ArrowRight size={16} weight="bold" /></Link>
                      ) : null}
                      {!project.site && !project.repo && !hasSystemsView ? (
                        <span><LockKey size={16} weight="bold" /> 仅展示已公开的实现信息</span>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {activeTab === "live" && project.liveDemo ? (
                  <div className="project-dossier-live">
                    <div className="project-dossier-live-frame">
                      <iframe
                        src={project.liveDemo.url}
                        title={`${project.title} 在线体验`}
                        loading="lazy"
                      />
                    </div>
                    <p className="project-dossier-live-note">
                      {project.liveDemo.label}。
                    </p>
                  </div>
                ) : null}
              </motion.article>
            </AnimatePresence>
          </div>
        </section>
      </div>
    </section>
  );
}
