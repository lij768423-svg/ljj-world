import { Books } from "@phosphor-icons/react/Books";
import { CloudArrowUp } from "@phosphor-icons/react/CloudArrowUp";
import { Code } from "@phosphor-icons/react/Code";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import type { ThemeMode } from "../App";
import { AboutBlurText } from "../components/AboutBlurText";
import { AboutCapabilities } from "../components/AboutCapabilities";
import { AboutInterests } from "../components/AboutInterests";
import { AboutLeadUnderline } from "../components/AboutLeadUnderline";
import { AboutPortrait } from "../components/AboutPortrait";
import { AboutStatus } from "../components/AboutStatus";
import { DynamicText } from "../components/effects/DynamicText";
import { usePortfolioLanguage } from "../i18n/PortfolioLanguage";

// The kicker cycles through what I do. DynamicText sits outside the DOM translator, so it gets words in the page's language.
// Each word stays on one line, so the English ones are kept short enough for a 320 px phone (see .about-console-kicker).
const kickerRoles = {
  zh: ["考研中的个人开发者", "产品设计", "全栈开发", "自托管运维"],
  en: ["Indie developer", "Product design", "Full-stack development", "Self-hosted operations"],
};

export function AboutPage({ theme }: { theme: ThemeMode }) {
  const reduceMotion = useReducedMotion();
  const { language } = usePortfolioLanguage();
  const [portraitReady, setPortraitReady] = useState(false);
  const methodRef = useRef<HTMLOListElement>(null);
  const methodSeen = useInView(methodRef, { once: true, amount: 0.6 });
  const reveal = reduceMotion ? false : { opacity: 0 };

  return (
    <div className="about-page">
      <section className="about-console section-shell" aria-labelledby="page-title">
        <div className="about-console-field" aria-hidden="true">
          <span className="about-field-track about-field-track-top" />
          <span className="about-field-track about-field-track-bottom" />
          <span className="about-field-pulse about-field-pulse-top" />
          <span className="about-field-pulse about-field-pulse-bottom" />
        </div>

        <div className="about-console-topline">
          <span className="about-topline-index" aria-hidden="true">01 / ABOUT</span>
          <span className="about-topline-rule" aria-hidden="true" />
          <span className="about-topline-copy" aria-hidden="true">PERSONAL OPERATING SYSTEM</span>
          <AboutStatus />
        </div>

        <motion.div
          className="about-console-intro"
          initial={reveal}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="about-console-kicker"><AboutBlurText delay={0.08}><DynamicText words={kickerRoles[language]} /></AboutBlurText></p>
          <h1 id="page-title"><AboutBlurText text="关于我" delay={0.16} /></h1>
          <p className="about-console-lead"><AboutBlurText text="一边准备研究生考试，一边把真实需求做成能长期运行的产品。" delay={0.32} /><AboutLeadUnderline /></p>
          <p className="about-console-summary"><AboutBlurText text="我从具体问题开始，自己完成界面、开发、部署和维护。比起短暂演示，我更在意产品能否真正被使用，并在几个月后依然稳定。" delay={0.64} /></p>

          <div className="about-console-story">
            <strong><AboutBlurText text="备考是现在的主线，做产品是长期习惯。" delay={1.02} /></strong>
            <p><AboutBlurText text="把学习中遇到的低效流程做成工具，也借这些项目持续训练产品判断、工程实现和维护能力。" delay={1.2} /></p>
          </div>

          <AboutInterests />

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
          <AboutPortrait theme={theme} onReady={() => setPortraitReady(true)} />
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
            <ol ref={methodRef} data-drawn={reduceMotion || methodSeen}>
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
            <AboutCapabilities />
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
