import { ArrowLeft } from "@phosphor-icons/react/ArrowLeft";
import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { ArrowUpRight } from "@phosphor-icons/react/ArrowUpRight";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
} from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "wouter";
import { blogPosts, getBlogPost, type BlogPost } from "../blog";

const easeOut = [0.16, 1, 0.3, 1] as const;
const previewSizes = "(max-width: 760px) calc(100vw - 32px), (max-width: 980px) max(44vw, 640px), max(32vw, calc(160vh - 420px))";

function sectionId(slug: string, title: string) {
  return `${slug}-${title}`;
}

function shortDate(date: string) {
  const parts = date.split(".");
  return parts.length >= 3 ? `${parts[1]}.${parts[2]}` : date;
}

function ReadingProgress({ targetRef }: { targetRef: React.RefObject<HTMLElement | null> }) {
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"],
  });
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });

  return (
    <div className="blog-progress" aria-hidden="true">
      <motion.div className="blog-progress-bar" style={{ scaleX }} />
    </div>
  );
}

function ArticleCover({ post, reduceMotion }: { post: BlogPost; reduceMotion: boolean | null }) {
  return (
    <motion.figure
      className="blog-article-cover"
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.78, delay: 0.12, ease: easeOut }}
    >
      <div className="blog-article-cover-frame">
        <img
          src={post.image}
          srcSet={post.srcSet}
          sizes="(max-width: 760px) calc(100vw - 32px), (max-width: 980px) 360px, min(40vw, 460px)"
          alt={post.imageAlt}
          width={1600}
          height={1000}
          decoding="async"
          fetchPriority="high"
          style={{
            objectPosition: post.imagePosition ?? "center center",
          }}
        />
      </div>
      <figcaption className="blog-article-cover-caption">
        <span>{post.imageAlt}</span>
      </figcaption>
    </motion.figure>
  );
}

export function BlogPage() {
  const reduceMotion = useReducedMotion();
  const [requestedSlug, setRequestedSlug] = useState(blogPosts[0].slug);
  const [activeSlug, setActiveSlug] = useState(blogPosts[0].slug);
  const [previousSlug, setPreviousSlug] = useState<string | null>(null);
  const [readySlugs, setReadySlugs] = useState<Set<string>>(() => new Set());
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activePost = useMemo(
    () => getBlogPost(activeSlug) ?? blogPosts[0],
    [activeSlug],
  );
  const previousPost = previousSlug ? getBlogPost(previousSlug) : null;
  const previewPosts = previousPost ? [previousPost, activePost] : [activePost];

  useEffect(() => {
    let mounted = true;
    const post = getBlogPost(requestedSlug) ?? blogPosts[0];
    const image = new Image();
    image.fetchPriority = "high";
    if (post.srcSet) image.srcset = post.srcSet;
    image.sizes = previewSizes;
    image.src = post.image;
    void image.decode().then(() => {
      if (mounted) setReadySlugs((ready) => new Set(ready).add(post.slug));
    }).catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [requestedSlug]);

  useEffect(() => () => {
    if (hoverTimeout.current !== null) clearTimeout(hoverTimeout.current);
  }, []);

  useEffect(() => {
    if (previousSlug || requestedSlug === activeSlug || !readySlugs.has(requestedSlug)) return;
    setPreviousSlug(reduceMotion ? null : activeSlug);
    setActiveSlug(requestedSlug);
  }, [activeSlug, previousSlug, readySlugs, reduceMotion, requestedSlug]);

  function cancelHoverPreview() {
    if (hoverTimeout.current !== null) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = null;
  }

  function requestHoverPreview(slug: string) {
    cancelHoverPreview();
    hoverTimeout.current = setTimeout(() => {
      hoverTimeout.current = null;
      setRequestedSlug(slug);
    }, 100);
  }

  const reveal = reduceMotion ? false : { opacity: 0, y: 14 };
  const noteCount = blogPosts.length;
  const latestYear = blogPosts[0]?.date.slice(0, 4) ?? "2026";

  return (
    <section className="blog-index" aria-labelledby="blog-title">
      <div className="blog-console section-shell">
        <div className="blog-console-field" aria-hidden="true">
          <span className="blog-field-track blog-field-track-top" />
          <span className="blog-field-track blog-field-track-bottom" />
          <span className="blog-field-pulse blog-field-pulse-top" />
          <span className="blog-field-pulse blog-field-pulse-bottom" />
          <div className="blog-console-topline">
            <span className="blog-topline-index">02 / BLOG</span>
            <span className="blog-topline-rule" />
            <span className="blog-topline-copy">WORKING NOTES</span>
            <span className="blog-topline-status">
              <i />
              {noteCount} / {latestYear}
            </span>
          </div>
        </div>

        <motion.div
          className="blog-console-intro"
          initial={reveal}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.52, ease: easeOut }}
        >
          <p className="blog-console-kicker">写给还要继续维护的自己</p>
          <h1 id="blog-title">文章与笔记</h1>
          <p className="blog-console-lead">产品、学习和自建里真正卡住的地方。</p>
          <p className="blog-console-summary">
            记录我把东西做出来、跑起来、再维护下去时实际碰到的问题，而不是功能清单。
          </p>

          <div className="blog-console-story">
            <span>{activePost.category}</span>
            <strong>{activePost.title}</strong>
            <p>{activePost.excerpt}</p>
            <Link className="blog-console-read" to={`/blog/${activePost.slug}`}>
              <span>阅读这篇文章</span>
              <ArrowRight size={16} weight="bold" aria-hidden="true" />
            </Link>
          </div>
        </motion.div>

        <motion.div
          className="blog-console-visual"
          initial={reduceMotion ? false : { opacity: 0, scale: 1.018 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.64, delay: 0.06, ease: easeOut }}
        >
          <div className="blog-console-portrait">
            {previewPosts.map((post) => (
              <motion.figure
                className={post.slug === activePost.slug ? "is-active" : undefined}
                key={post.slug}
                aria-hidden={post.slug !== activePost.slug}
                initial={!reduceMotion && previousPost && post.slug === activePost.slug ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.36, ease: [0.4, 0, 0.2, 1] }}
                onAnimationComplete={post.slug === activePost.slug ? () => setPreviousSlug(null) : undefined}
              >
                <img
                  src={post.image}
                  srcSet={post.srcSet}
                  sizes={previewSizes}
                  alt={post.slug === activePost.slug ? post.imageAlt : ""}
                  width={1600}
                  height={1000}
                  loading="eager"
                  decoding="async"
                  fetchPriority={post.slug === blogPosts[0].slug ? "high" : "low"}
                  style={{ objectPosition: post.imagePosition ?? "center center" }}
                />
              </motion.figure>
            ))}
            <p className="blog-console-caption">
              <span>{activePost.category}</span>
              <span aria-hidden="true">/</span>
              <time dateTime={activePost.date.replaceAll(".", "-")}>{activePost.date}</time>
              <span aria-hidden="true">/</span>
              <span>{activePost.readingTime}</span>
            </p>
          </div>
          <div className="blog-console-signal" aria-hidden="true">
            <span className="blog-signal-rail blog-signal-rail-top" />
            <span className="blog-signal-rail blog-signal-rail-middle" />
            <span className="blog-signal-rail blog-signal-rail-bottom" />
            <span className="blog-signal-pulse blog-signal-pulse-a" />
            <span className="blog-signal-pulse blog-signal-pulse-b" />
            <span className="blog-signal-node blog-signal-node-left" />
            <span className="blog-signal-node blog-signal-node-center" />
            <span className="blog-signal-node blog-signal-node-right" />
          </div>
        </motion.div>

        <motion.div
          className="blog-console-detail"
          initial={reveal}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.56, delay: reduceMotion ? 0 : 0.08, ease: easeOut }}
        >
          <div className="blog-console-heading">
            <h2 id="blog-index-heading">最近写下的</h2>
            <span className="blog-count"><b>{noteCount}</b>篇笔记</span>
          </div>

          <ol className="blog-index-list" aria-labelledby="blog-index-heading">
            {blogPosts.map((post) => (
              <li key={post.slug}>
                <Link
                  className={post.slug === activePost.slug ? "is-active" : undefined}
                  to={`/blog/${post.slug}`}
                  data-blog-slug={post.slug}
                  onPointerEnter={(event) => {
                    if (event.pointerType !== "touch") requestHoverPreview(post.slug);
                  }}
                  onPointerLeave={cancelHoverPreview}
                  onPointerCancel={cancelHoverPreview}
                  onFocus={() => {
                    cancelHoverPreview();
                    setRequestedSlug(post.slug);
                  }}
                >
                  <time dateTime={post.date.replaceAll(".", "-")}>{shortDate(post.date)}</time>
                  <strong>{post.title}</strong>
                  <span>{post.category}</span>
                </Link>
              </li>
            ))}
          </ol>
        </motion.div>
      </div>
    </section>
  );
}

export function BlogArticlePage() {
  const reduceMotion = useReducedMotion();
  const params = useParams<{ slug: string }>();
  const post = getBlogPost(params.slug);
  const articleRef = useRef<HTMLElement>(null);
  const [activeSection, setActiveSection] = useState(0);
  const [contentsOpen, setContentsOpen] = useState(() => window.matchMedia("(min-width: 981px)").matches);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 981px)");
    const updateContents = () => setContentsOpen(desktop.matches);
    updateContents();
    desktop.addEventListener("change", updateContents);
    return () => desktop.removeEventListener("change", updateContents);
  }, [post]);

  const postIndex = useMemo(
    () => (post ? blogPosts.findIndex((item) => item.slug === post.slug) : -1),
    [post],
  );
  const prevPost = postIndex > 0 ? blogPosts[postIndex - 1] : null;
  const nextPost =
    postIndex >= 0 && postIndex < blogPosts.length - 1 ? blogPosts[postIndex + 1] : null;

  useEffect(() => {
    if (!post) return;
    const nodes = post.sections
      .map((section) => document.getElementById(sectionId(post.slug, section.title)))
      .filter((node): node is HTMLElement => Boolean(node));
    if (!nodes.length) return;

    let frame = 0;
    const updateSection = () => {
      frame = 0;
      const scrollPadding = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      const scrollMargin = Number.parseFloat(getComputedStyle(nodes[0]).scrollMarginTop) || 0;
      const readingLine = Math.max(120, scrollPadding + scrollMargin + 2);
      let currentIndex = 0;
      nodes.forEach((node, index) => {
        if (node.getBoundingClientRect().top <= readingLine) currentIndex = index;
      });
      if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
        currentIndex = nodes.length - 1;
      }
      setActiveSection(currentIndex);
    };
    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateSection);
    };
    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    if (articleRef.current) resizeObserver.observe(articleRef.current);
    return () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [post]);

  if (!post) {
    return (
      <section className="blog-missing section-shell" aria-labelledby="blog-missing-title">
        <h1 id="blog-missing-title">这篇文章还不存在。</h1>
        <p>它可能仍在整理，也可能已经更换地址。</p>
        <Link className="button button-primary" to="/blog">
          <span>返回博客</span>
          <span className="button-arrow">
            <ArrowLeft size={18} weight="bold" />
          </span>
        </Link>
      </section>
    );
  }

  const githubMatch = post.sections
    .flatMap((section) => section.paragraphs)
    .join("\n")
    .match(/https:\/\/github\.com\/[^\s。]+/);

  return (
    <article className="blog-article" ref={articleRef}>
      <ReadingProgress targetRef={articleRef} />

      <div className="blog-article-shell section-shell">
        <motion.div
          className="blog-article-top"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.45, ease: easeOut }}
        >
          <Link className="blog-back-link" to="/blog">
            <ArrowLeft size={17} weight="bold" aria-hidden="true" />
            <span>全部文章</span>
          </Link>

          <nav className="blog-breadcrumb" aria-label="文章路径">
            <Link to="/">首页</Link>
            <span aria-hidden="true">›</span>
            <Link to="/blog">博客</Link>
            <span aria-hidden="true">›</span>
            <span className="blog-breadcrumb-current" aria-current="page">{post.title}</span>
          </nav>
        </motion.div>

        <div className="blog-article-hero">
          <motion.header
          className="blog-article-header"
          initial={reduceMotion ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.62, ease: easeOut }}
        >
          <div className="blog-article-kicker">
            <span className="blog-article-badge">{post.category}</span>
            <span className="blog-article-index">
              Essay {String(Math.max(postIndex + 1, 1)).padStart(2, "0")}
            </span>
          </div>

          <h1>{post.title}</h1>
          <p className="blog-article-lede">{post.excerpt}</p>

          <div className="blog-article-meta">
            <span>
              <em>作者</em>
              ljj.world
            </span>
            <span>
              <em>发布</em>
              <time dateTime={post.date.replaceAll(".", "-")}>{post.date}</time>
            </span>
            <span>
              <em>阅读</em>
              {post.readingTime.replace("阅读", "").trim()}
            </span>
            <span>
              <em>章节</em>
              {post.sections.length} 节
            </span>
          </div>
          </motion.header>
          <ArticleCover post={post} reduceMotion={reduceMotion} />
        </div>

        <div className="blog-article-feature-grid">
          <div className="blog-article-body">
            <div className="blog-article-copy">
              <motion.p
              className="blog-article-intro"
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.58, delay: 0.18, ease: easeOut }}
            >
              {post.intro}
              </motion.p>
              {post.sections.map((section, index) => (
                <motion.section
                  id={sectionId(post.slug, section.title)}
                  key={section.title}
                  initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.12 }}
                  transition={{ duration: reduceMotion ? 0 : 0.48, ease: easeOut }}
                >
                  <div className="blog-section-heading">
                    <span className="blog-section-index" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h2>{section.title}</h2>
                  </div>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </motion.section>
              ))}
            </div>
          </div>

          <motion.aside
            className="blog-article-aside"
            aria-label="文章目录"
            initial={reduceMotion ? false : { opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.55, delay: 0.22, ease: easeOut }}
          >
            <details
              className="blog-article-aside-card"
              open={contentsOpen}
              onToggle={(event) => setContentsOpen(event.currentTarget.open)}
            >
              <summary>
                <span>本文内容</span>
                <span className="blog-toc-toggle" aria-hidden="true">+</span>
              </summary>
              <nav aria-label="文章目录">
                {post.sections.map((section, index) => (
                  <a
                    key={section.title}
                    href={`#${sectionId(post.slug, section.title)}`}
                    className={index === activeSection ? "is-active" : undefined}
                    aria-current={index === activeSection ? "true" : undefined}
                  >
                    <span className="blog-toc-index">{String(index + 1).padStart(2, "0")}</span>
                    <span className="blog-toc-label">{section.title}</span>
                  </a>
                ))}
              </nav>
              {githubMatch ? (
                <a
                  className="blog-article-repo"
                  href={githubMatch[0]}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>GitHub</span>
                  <ArrowUpRight size={13} weight="bold" aria-hidden="true" />
                </a>
              ) : null}
            </details>
          </motion.aside>
        </div>

        <motion.footer
          className="blog-article-footer"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: reduceMotion ? 0 : 0.55, ease: easeOut }}
        >
          <div className="blog-article-footer-note">
            <span>继续阅读</span>
            <p>同一条工作流里，产品、运维和写作都是交付的一部分。</p>
          </div>
          <div className={`blog-article-pager${!prevPost || !nextPost ? " has-only-link" : ""}`}>
            {prevPost ? (
              <Link className="blog-pager-link is-prev" to={`/blog/${prevPost.slug}`}>
                <span className="blog-pager-label">
                  <ArrowLeft size={14} weight="bold" aria-hidden="true" />
                  上一篇
                </span>
                <strong>{prevPost.title}</strong>
              </Link>
            ) : (
              <div className="blog-pager-link is-empty" aria-hidden="true" />
            )}
            {nextPost ? (
              <Link className="blog-pager-link is-next" to={`/blog/${nextPost.slug}`}>
                <span className="blog-pager-label">
                  下一篇
                  <ArrowRight size={14} weight="bold" aria-hidden="true" />
                </span>
                <strong>{nextPost.title}</strong>
              </Link>
            ) : (
              <Link className="blog-pager-link is-next" to="/blog">
                <span className="blog-pager-label">
                  返回列表
                  <ArrowRight size={14} weight="bold" aria-hidden="true" />
                </span>
                <strong>文章与笔记</strong>
              </Link>
            )}
          </div>
        </motion.footer>
      </div>
    </article>
  );
}
