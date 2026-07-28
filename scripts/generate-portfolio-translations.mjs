import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const HAN = /[\u3400-\u9fff]/u;
const sourceFiles = [];

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.tsx?$/.test(entry.name) && !file.endsWith("portfolioTranslations.ts")) sourceFiles.push(file);
  }
}

function normalize(value) {
  return value.replace(/\\n/g, " ").replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\s+/g, " ").trim();
}

function readQuotedStrings(source) {
  const results = [];
  let index = 0;
  while (index < source.length) {
    if (source[index] === "/" && source[index + 1] === "/") {
      index = source.indexOf("\n", index + 2);
      if (index < 0) break;
      continue;
    }
    if (source[index] === "/" && source[index + 1] === "*") {
      index = source.indexOf("*/", index + 2);
      if (index < 0) break;
      index += 2;
      continue;
    }
    const quote = source[index];
    if (quote !== '"' && quote !== "'" && quote !== "`") {
      index += 1;
      continue;
    }
    let cursor = index + 1;
    let value = "";
    let hasInterpolation = false;
    while (cursor < source.length) {
      if (source[cursor] === "\\") {
        value += source.slice(cursor, cursor + 2);
        cursor += 2;
        continue;
      }
      if (quote === "`" && source[cursor] === "$" && source[cursor + 1] === "{") hasInterpolation = true;
      if (source[cursor] === quote) break;
      value += source[cursor];
      cursor += 1;
    }
    if (!hasInterpolation) results.push(normalize(value));
    index = Math.min(source.length, cursor + 1);
  }
  return results;
}

function extractStrings(source) {
  const values = readQuotedStrings(source);
  for (const match of source.matchAll(/>([^<>{}]*)</g)) values.push(normalize(match[1]));
  return values.filter((value) => value && HAN.test(value) && value.length <= 900);
}

function translateBatch(batch) {
  const source = batch.join("\n");
  const raw = execFileSync("curl", [
    "-sS", "--max-time", "40", "--retry", "5", "--retry-all-errors", "--retry-delay", "1",
    "https://translate.googleapis.com/translate_a/single",
    "--data-urlencode", "client=gtx",
    "--data-urlencode", "sl=zh-CN",
    "--data-urlencode", "tl=en",
    "--data-urlencode", "dt=t",
    "--data-urlencode", `q=${source}`,
  ], { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  const payload = JSON.parse(raw);
  return payload[0].map((segment) => segment[0]).join("").split("\n").map((value) => value.trim());
}

walk("src");
const strings = [...new Set(sourceFiles.flatMap((file) => extractStrings(readFileSync(file, "utf8"))))].sort((a, b) => a.localeCompare(b, "zh-CN"));
const translations = {};

for (let cursor = 0; cursor < strings.length;) {
  const batch = [];
  let length = 0;
  while (cursor < strings.length && batch.length < 24 && length + strings[cursor].length < 2600) {
    batch.push(strings[cursor]);
    length += strings[cursor].length + 1;
    cursor += 1;
  }
  let translated = translateBatch(batch);
  if (translated.length !== batch.length) translated = batch.map((value) => translateBatch([value])[0]);
  batch.forEach((value, index) => {
    translations[value] = translated[index] || value;
  });
  process.stdout.write(`\rTranslated ${cursor}/${strings.length}`);
}

const manual = {
  "lij768423-svg / 独立开发者": "lij768423-svg / Independent developer",
  "408 刷题库": "408 Question Bank",
  "根旺律所数字站": "Genwang Law Website",
  "Tailscale 延迟测试": "Tailscale Latency Test",
  "Home Lab 基础设施": "Home Lab Infrastructure",
  "个持续生长的项目": "evolving projects",
  "介绍": "Intro",
  "原生应用": "Native app",
  "AI 基础服务": "AI infrastructure",
  "首页": "Home",
  "项目": "Projects",
  "服务器": "Server",
  "桌搭": "Desk",
  "关于": "About",
  "你好，我是 ljj。": "Hi, I'm ljj.",
  "把想法做成长​​期运行的产品。": "I turn ideas into lasting products.",
  "把想法做成长期运行的产品。": "I turn ideas into lasting products.",
  "查看项目": "View projects",
  "了解我": "About me",
  "项目索引": "Project index",
  "我的服务器": "My server",
  "关于我": "About me",
  "我的桌搭": "My desk setup",
  "我的收藏项目": "Selected projects",
  "考研中的个人开发者": "Independent developer preparing for graduate school",
  "独立开发者": "Independent developer",
  "备考中": "IN PREP",
  "学习产品": "Learning product",
  "协作项目": "Collaborative project",
  "客户项目": "Client project",
  "开发者工具": "Developer tool",
  "内部工作流": "Internal workflow",
  "硬件工具": "Hardware tool",
  "网络诊断工具": "Network diagnostic tool",
  "NETWORK / 网络": "NETWORK / ENTRY",
  "自托管系统": "Self-hosted system",
  "开源": "Open source",
  "开源 / 在线": "Open source / Live",
  "开源 / 真机运行": "Open source / Device build",
  "在线 / 私有源码": "Live / Private source",
  "公开仓库 / 受限演示": "Public repo / Restricted demo",
  "当前项目": "Current project",
  "查看全部": "View all",
  "查看档案": "View archive",
  "查看服务器结构": "View server architecture",
  "打开在线版本": "Open live version",
  "查看公开源码": "View source",
  "返回": "Back to",
  "这个页面不存在。": "This page does not exist.",
  "主要导航": "Primary navigation",
};

Object.assign(translations, manual);
const output = `// Generated by scripts/generate-portfolio-translations.mjs.\nexport const portfolioTranslations: Record<string, string> = ${JSON.stringify(translations, null, 2)};\n`;
mkdirSync("src/i18n", { recursive: true });
writeFileSync("src/i18n/portfolioTranslations.ts", output);
process.stdout.write(`\nWrote ${Object.keys(translations).length} translations.\n`);
