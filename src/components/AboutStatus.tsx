import type { CSSProperties } from "react";
import { Link } from "wouter";
import { serverSnapshot } from "../data/server";
import { usePortfolioLanguage } from "../i18n/PortfolioLanguage";

// Each digit is a short column that rolls up to its number once, when the page opens (CSS, see .about-roll).
function RollingDigits({ value, start = 0 }: { value: string | number; start?: number }) {
  return (
    <span className="about-roll">
      {Array.from(String(value), (character, index) => {
        const digit = Number.parseInt(character, 10);
        if (Number.isNaN(digit)) return <span key={index}>{character}</span>;
        const rows = Array.from({ length: (digit === 0 ? 10 : digit) + 1 }, (_, row) => row % 10);
        return (
          <span className="about-roll-digit" key={index}>
            <span
              style={{ "--roll-rows": rows.length, "--roll-delay": `${200 + (start + index) * 30}ms` } as CSSProperties}
            >
              {rows.map((row, position) => <i key={position}>{row}</i>)}
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function AboutStatus() {
  const { language } = usePortfolioLanguage();
  const { capturedAt, composeProjects, runningContainers } = serverSnapshot;
  // The words are in the page's language already, so the DOM translator leaves the link alone.
  const label = language === "en"
    ? `ONLINE: ${runningContainers} containers, ${composeProjects} Compose projects, captured ${capturedAt}. Open the server page`
    : `ONLINE：${runningContainers} 个容器，${composeProjects} 个 Compose 项目，采集于 ${capturedAt}。查看服务器`;

  return (
    <Link className="about-topline-status" to="/systems" aria-label={label} data-no-translate>
      <span className="about-topline-status-line" aria-hidden="true">
        <i className="about-topline-dot" />
        <span>ONLINE</span>
        <span>/ <RollingDigits value={runningContainers} /> CONTAINERS</span>
        <span className="about-topline-more">/ <RollingDigits value={composeProjects} start={3} /> COMPOSE</span>
        <span className="about-topline-more">/ <RollingDigits value={capturedAt} start={5} /></span>
      </span>
    </Link>
  );
}
