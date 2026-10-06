import { Books } from "@phosphor-icons/react/Books";
import { Browser } from "@phosphor-icons/react/Browser";
import { CloudArrowUp } from "@phosphor-icons/react/CloudArrowUp";
import { Code } from "@phosphor-icons/react/Code";
import { Database } from "@phosphor-icons/react/Database";
import { HardDrives } from "@phosphor-icons/react/HardDrives";
import { Robot } from "@phosphor-icons/react/Robot";
import { animate, motion, useReducedMotion } from "motion/react";
import { useState, type CSSProperties } from "react";
import { Link } from "wouter";

function AboutBlurText({ text, delay = 0 }: { text: string; delay?: number }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <span>{text}</span>;

  const revealDelay = Math.min(0.66, 0.05 + delay * 0.22);
  return (
    <span
      className="about-blur-text"
      style={{ "--about-reveal-delay": `${revealDelay}s` } as CSSProperties}
    >
      {text}
    </span>
  );
}

export function AboutPage() {
  const reduceMotion = useReducedMotion();
  const [portraitReady, setPortraitReady] = useState(false);
  const reveal = reduceMotion ? false : { opacity: 0 };

  return (
    <div className="about-page">
      <section className="about-console section-shell" aria-labelledby="page-title">
        <div className="about-console-field" aria-hidden="true">
          <span className="about-field-track about-field-track-top" />
          <span className="about-field-track about-field-track-bottom" />
          <span className="about-field-pulse about-field-pulse-top" />
          <span className="about-field-pulse about-field-pulse-bottom" />
          <div className="about-console-topline">
            <span className="about-topline-index">01 / ABOUT</span>
            <span className="about-topline-rule" />
            <span className="about-topline-copy">PERSONAL OPERATING SYSTEM</span>
            <span className="about-topline-status"><i /> ONLINE / 2026</span>
          </div>
        </div>

        <motion.div
          className="about-console-intro"
          initial={reveal}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="about-console-kicker"><AboutBlurText text="考研中的个人开发者" delay={0.08} /></p>
          <h1 id="page-title"><AboutBlurText text="关于我" delay={0.16} /></h1>
          <p className="about-console-lead"><AboutBlurText text="一边准备研究生考试，一边把真实需求做成能长期运行的产品。" delay={0.32} /></p>
          <p className="about-console-summary"><AboutBlurText text="我从具体问题开始，自己完成界面、开发、部署和维护。比起短暂演示，我更在意产品能否真正被使用，并在几个月后依然稳定。" delay={0.64} /></p>

          <div className="about-console-story">
            <strong><AboutBlurText text="备考是现在的主线，做产品是长期习惯。" delay={1.02} /></strong>
            <p><AboutBlurText text="把学习中遇到的低效流程做成工具，也借这些项目持续训练产品判断、工程实现和维护能力。" delay={1.2} /></p>
          </div>

          <ul className="about-console-interests" aria-label="个人兴趣">
            <li>
              <Link className="about-desk-link" to="/desk">
                <AboutBlurText text="数码桌搭" delay={1.54} />
              </Link>
            </li>
            <li><AboutBlurText text="健身" delay={1.65} /></li>
            <li><AboutBlurText text="穿搭" delay={1.74} /></li>
            <li><AboutBlurText text="硬件 DIY" delay={1.83} /></li>
          </ul>

          <div className="about-column-trace about-column-trace-intro" aria-hidden="true">
            <span className="about-trace-line about-trace-line-a" />
            <span className="about-trace-line about-trace-line-b" />
            <span className="about-trace-line about-trace-line-c" />
            <span className="about-trace-pulse" />
            <span className="about-trace-node about-trace-node-a" />
            <span className="about-trace-node about-trace-node-b" />
          </div>
        </motion.div>

        <motion.div
          className="about-console-visual"
          initial={reduceMotion ? false : { opacity: 0, scale: 1.018 }}
          animate={portraitReady || reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.018 }}
          transition={{ duration: reduceMotion ? 0 : 0.68, ease: [0.22, 1, 0.36, 1] }}
        >
          <figure className="about-console-portrait">
            <img
              src="/assets/about-avatar-three-quarter.webp"
              srcSet="/assets/about-avatar-three-quarter-768.webp 768w, /assets/about-avatar-three-quarter.webp 1024w"
              sizes="(max-width: 1360px) 34vw, 500px"
              alt="ljj 三分之四侧面的虚拟开发者形象"
              width={1024}
              height={1024}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              onLoad={() => setPortraitReady(true)}
            />
          </figure>
          <div className="about-console-signal" aria-hidden="true">
            <span className="about-signal-rail about-signal-rail-top" />
            <span className="about-signal-rail about-signal-rail-middle" />
            <span className="about-signal-rail about-signal-rail-bottom" />
            <span className="about-signal-pulse about-signal-pulse-a" />
            <span className="about-signal-pulse about-signal-pulse-b" />
            <span className="about-signal-kink about-signal-kink-left" />
            <span className="about-signal-kink about-signal-kink-right" />
            <span className="about-signal-node about-signal-node-left" />
            <span className="about-signal-node about-signal-node-center" />
            <span className="about-signal-node about-signal-node-right" />
          </div>
        </motion.div>

        <motion.div
          className="about-console-detail"
          initial={reveal}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.56, delay: reduceMotion ? 0 : 0.04, ease: [0.22, 1, 0.36, 1] }}
        >
          <section className="about-console-method" aria-labelledby="about-method-title">
            <div className="about-console-heading">
              <h2 id="about-method-title"><AboutBlurText text="我怎样把事情做完" delay={0.18} /></h2>
              <span><AboutBlurText text="从问题到运行状态" delay={0.42} /></span>
            </div>
            <ol>
              <li><Books size={22} weight="duotone" aria-hidden="true" /><div><strong><AboutBlurText text="先看完整流程" delay={0.58} /></strong><p><AboutBlurText text="找到第一步之后真正会卡住的环节。" delay={0.72} /></p></div></li>
              <li><Code size={22} weight="duotone" aria-hidden="true" /><div><strong><AboutBlurText text="用真实界面验证" delay={0.9} /></strong><p><AboutBlurText text="跨 Web 与原生端实现，再用测试校正。" delay={1.04} /></p></div></li>
              <li><CloudArrowUp size={22} weight="duotone" aria-hidden="true" /><div><strong><AboutBlurText text="把上线算进设计" delay={1.22} /></strong><p><AboutBlurText text="域名、权限、监控和备份都属于产品。" delay={1.36} /></p></div></li>
            </ol>
          </section>

          <section className="about-console-capabilities" aria-labelledby="about-capabilities-title">
            <div className="about-console-heading">
              <h2 id="about-capabilities-title"><AboutBlurText text="我能做的部分" delay={1.62} /></h2>
              <span><AboutBlurText text="清楚、可靠、可维护" delay={1.84} /></span>
            </div>
            <div className="about-console-capability-grid">
              <div><Browser size={20} weight="duotone" aria-hidden="true" /><span><AboutBlurText text="产品界面" delay={2.02} /></span><strong><AboutBlurText text="Web / SwiftUI / ArkTS" delay={2.14} /></strong></div>
              <div><Robot size={20} weight="duotone" aria-hidden="true" /><span><AboutBlurText text="AI 接入" delay={2.24} /></span><strong><AboutBlurText text="SSE / API / 工作流" delay={2.34} /></strong></div>
              <div><Database size={20} weight="duotone" aria-hidden="true" /><span><AboutBlurText text="服务系统" delay={2.44} /></span><strong><AboutBlurText text="Python / FastAPI" delay={2.54} /></strong></div>
              <div><HardDrives size={20} weight="duotone" aria-hidden="true" /><span><AboutBlurText text="运行维护" delay={2.64} /></span><strong><AboutBlurText text="Docker / Tailscale" delay={2.74} /></strong></div>
            </div>
          </section>

          <div className="about-column-trace about-column-trace-detail" aria-hidden="true">
            <span className="about-trace-line about-trace-line-a" />
            <span className="about-trace-line about-trace-line-b" />
            <span className="about-trace-line about-trace-line-c" />
            <span className="about-trace-pulse" />
            <span className="about-trace-node about-trace-node-a" />
            <span className="about-trace-node about-trace-node-b" />
          </div>
        </motion.div>
      </section>
    </div>
  );
}
