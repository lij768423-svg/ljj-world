import { chromium } from "@playwright/test";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUTPUT_DIR = path.resolve(process.env.CAPTURE_DIR || path.join(ROOT, "public/assets"));
const CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM_PATH;
const VIEWPORT = { width: 1600, height: 1000 };
const requestedGroups = process.argv.slice(2);
if (requestedGroups.length === 0) {
  throw new Error("Choose at least one capture group, for example: npm run capture:projects -- law");
}
const groups = new Set(requestedGroups);

await mkdir(OUTPUT_DIR, { recursive: true });

const browser = await chromium.launch({
  ...(CHROMIUM ? { executablePath: CHROMIUM } : {}),
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--enable-webgl",
    "--use-gl=swiftshader",
  ],
});

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Set ${name} before running this capture group.`);
  return value.replace(/\/$/, "");
}

const converterContext = await browser.newContext({ viewport: { width: 16, height: 16 } });
const converter = await converterContext.newPage();

async function imageToWebp(source, quality = 0.86, targetWidth, mimeType = "image/png") {
  const encoded = source.toString("base64");
  const webp = await converter.evaluate(async ({ encoded, quality, targetWidth, mimeType }) => {
    const image = new Image();
    image.src = `data:${mimeType};base64,${encoded}`;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth || image.naturalWidth;
    canvas.height = targetWidth
      ? Math.round(image.naturalHeight * targetWidth / image.naturalWidth)
      : image.naturalHeight;
    const context = canvas.getContext("2d", { alpha: false });
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/webp", quality).split(",")[1];
  }, { encoded, quality, targetWidth, mimeType });

  return Buffer.from(webp, "base64");
}

async function newContext() {
  return browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    colorScheme: "light",
    reducedMotion: "reduce",
    ignoreHTTPSErrors: true,
  });
}

async function stabilize(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    document.documentElement.style.scrollBehavior = "auto";
  });
  await page.addStyleTag({
    content: "html{scrollbar-width:none}html::-webkit-scrollbar{display:none}*{caret-color:transparent!important}",
  });
}

async function capture({
  name,
  url,
  context,
  configureContext,
  waitFor,
  prepare,
  clipFrom,
  settle = 1200,
  widthVariants = [],
}) {
  const ownContext = !context;
  const activeContext = context || await newContext();
  if (configureContext) await configureContext(activeContext);
  const page = await activeContext.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    if (waitFor) await page.locator(waitFor).first().waitFor({ state: "visible", timeout: 30_000 });
    if (prepare) await prepare(page);
    await stabilize(page);
    await page.waitForTimeout(settle);

    const clip = clipFrom ? await clipFrom(page) : undefined;
    const pixelRatio = await page.evaluate(() => window.devicePixelRatio);
    const captureWidth = Math.round((clip?.width || VIEWPORT.width) * pixelRatio);
    const captureHeight = Math.round((clip?.height || VIEWPORT.height) * pixelRatio);
    const png = await page.screenshot({ type: "png", animations: "disabled", clip });
    const webp = await imageToWebp(png);
    const output = path.join(OUTPUT_DIR, `${name}.webp`);
    await writeFile(output, webp);
    console.log(`${name}.webp ${captureWidth}x${captureHeight} ${Math.round(webp.length / 1024)} KiB`);

    for (const width of widthVariants) {
      const variant = await imageToWebp(png, 0.84, width);
      const variantOutput = path.join(OUTPUT_DIR, `${name}-${width}.webp`);
      await writeFile(variantOutput, variant);
      console.log(`${name}-${width}.webp ${width}x${Math.round(width * captureHeight / captureWidth)} ${Math.round(variant.length / 1024)} KiB`);
    }
  } finally {
    await page.close();
    if (ownContext) await activeContext.close();
  }
}

async function convertLocalPng({ name, source, width, height, widthVariants = [] }) {
  const png = await readFile(source);
  const webp = await imageToWebp(png, 0.9);
  await writeFile(path.join(OUTPUT_DIR, `${name}.webp`), webp);
  console.log(`${name}.webp ${width}x${height} ${Math.round(webp.length / 1024)} KiB`);

  for (const targetWidth of widthVariants) {
    const variant = await imageToWebp(png, 0.86, targetWidth);
    const targetHeight = Math.round(height * targetWidth / width);
    await writeFile(path.join(OUTPUT_DIR, `${name}-${targetWidth}.webp`), variant);
    console.log(`${name}-${targetWidth}.webp ${targetWidth}x${targetHeight} ${Math.round(variant.length / 1024)} KiB`);
  }
}

async function createWebpVariants({ name, widthVariants }) {
  const source = await readFile(path.join(OUTPUT_DIR, `${name}.webp`));
  for (const width of widthVariants) {
    const variant = await imageToWebp(source, 0.84, width, "image/webp");
    await writeFile(path.join(OUTPUT_DIR, `${name}-${width}.webp`), variant);
    console.log(`${name}-${width}.webp ${Math.round(variant.length / 1024)} KiB`);
  }
}

async function captureIosAssets() {
  const sourceRoot = requiredEnv("IOS_CAPTURE_ROOT");
  await convertLocalPng({
    name: "ioschat",
    source: process.env.IOS_CAPTURE_SOURCE || path.join(sourceRoot, "04-chat-redesign-device.png"),
    width: 1320,
    height: 2868,
    widthVariants: [520, 660],
  });
  await convertLocalPng({
    name: "ioschat-drawer",
    source: process.env.IOS_DRAWER_CAPTURE_SOURCE || path.join(sourceRoot, "02-drawer-empty.png"),
    width: 1206,
    height: 2622,
    widthVariants: [603],
  });
}

async function capture408() {
  const origin = process.env.QUIZ_CAPTURE_ORIGIN || "https://quiz.hermesjj.com";
  const configureContext = async (context) => {
    await context.route("**/api/**", (route) => route.abort("failed"));
  };
  const waitForLocalMode = async (page) => {
    await page.waitForFunction(() => typeof DATA_READY !== "undefined" && DATA_READY === true);
    await page.locator("#auth-card").waitFor({ state: "hidden", timeout: 15_000 });
    await page.waitForFunction(() => document.querySelector("#sync-status")?.textContent?.trim() === "LOCAL");
  };
  await capture({
    name: "408-quiz",
    url: `${origin}/#/quiz`,
    configureContext,
    waitFor: "#quiz-area",
    prepare: async (page) => {
      await waitForLocalMode(page);
      await page.waitForFunction(() => !document.querySelector("#quiz-loading"));
    },
    settle: 700,
    widthVariants: [800, 1600],
  });
  await capture({
    name: "408-dashboard",
    url: `${origin}/#/dashboard`,
    configureContext,
    waitFor: "#view-dashboard",
    prepare: async (page) => {
      await waitForLocalMode(page);
      await page.waitForFunction(() => !document.querySelector("#dashboard-content .loading"));
    },
    settle: 700,
    widthVariants: [800, 1600],
  });
  await capture({
    name: "408-feedback",
    url: `${origin}/#/quiz`,
    configureContext,
    waitFor: "#quiz-area",
    prepare: async (page) => {
      await waitForLocalMode(page);
      await page.waitForFunction(() => !document.querySelector("#quiz-loading"));
      await page.locator('[data-book="操作系统"]').click();
      await page.locator("#chapter-trigger").click();
      await page.locator('#chapter-menu [data-chapter="1"]').click();
      const wrongAnswer = await page.evaluate(() => {
        const answer = CURRENT.questions[CURRENT.idx].answer[0];
        return ["A", "B", "C", "D"].find((letter) => letter !== answer);
      });
      if (!wrongAnswer) throw new Error("Could not determine a wrong answer for the feedback capture.");
      await page.locator(`.option[data-letter="${wrongAnswer}"]`).click();
      const submit = page.locator("#btn-submit");
      if (await submit.isVisible()) await submit.click();
      await page.locator("#fb.feedback.show.wrong").waitFor({ state: "visible" });
      await page.locator("#fb .fb-expl").waitFor({ state: "visible" });
      await page.locator("#fb").scrollIntoViewIfNeeded();
    },
    settle: 700,
    widthVariants: [800, 1600],
  });
  await capture({
    name: "408-search",
    url: `${origin}/#/quiz`,
    configureContext,
    waitFor: "#search-open",
    prepare: async (page) => {
      await waitForLocalMode(page);
      await page.locator("#search-open").click();
      await page.locator("#search-input").fill("进程");
      await page.waitForFunction(() => {
        const count = Number.parseInt(document.querySelector("#search-count")?.textContent || "0", 10);
        return count > 0 && !!document.querySelector("#search-results .search-result");
      });
    },
    settle: 500,
    widthVariants: [800, 1600],
  });
}

async function capture408DashboardDemo() {
  const origin = (process.env.QUIZ_CAPTURE_ORIGIN || "https://quiz.hermesjj.com").replace(/\/$/, "");
  const context = await newContext();
  const username = `portfolio_demo_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`;
  const password = randomBytes(24).toString("base64url");

  try {
    const registration = await context.request.post(`${origin}/api/auth/register`, {
      data: { username, password },
      timeout: 30_000,
    });
    if (!registration.ok()) {
      throw new Error(`Could not create the isolated 408 capture account (HTTP ${registration.status()}).`);
    }

    await capture({
      name: "408-dashboard",
      url: `${origin}/#/dashboard`,
      context,
      waitFor: "#view-dashboard",
      prepare: async (page) => {
        await page.waitForFunction(() => (
          typeof DATA_READY !== "undefined"
          && DATA_READY === true
          && typeof AUTH_USER !== "undefined"
          && !!AUTH_USER
          && document.querySelector("#auth-card")?.style.display === "none"
        ));
        await page.waitForFunction(() => !document.querySelector("#dashboard-content .loading"));

        await page.evaluate(async () => {
          const DAY = 24 * 60 * 60 * 1000;
          const activityCounts = [6, 0, 8, 0, 9, 10, 0, 7, 11, 9, 12, 8, 14, 13];
          const correctCounts = [5, 0, 6, 0, 7, 8, 0, 6, 9, 8, 10, 7, 12, 11];
          const quotas = {
            "操作系统": 118,
            "数据结构": 112,
            "计算机组成原理": 100,
            "计算机网络": 86,
          };
          const reviewProfiles = {
            "操作系统": [false, false, true, true, true, true, true],
            "数据结构": [false, true, true, true, true, true],
            "计算机组成原理": [false, false, true, true, true, true, true, true],
            "计算机网络": [false, true, true, true, true, true, true],
          };
          let randomState = 4_082_027;
          const random = () => {
            randomState = (randomState * 1_664_525 + 1_013_904_223) >>> 0;
            return randomState / 4_294_967_296;
          };
          const shuffled = (items) => {
            const result = items.slice();
            for (let index = result.length - 1; index > 0; index -= 1) {
              const swapIndex = Math.floor(random() * (index + 1));
              [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
            }
            return result;
          };
          const timestampForDay = (dayOffset, minuteOffset = 0) => {
            const value = new Date();
            value.setDate(value.getDate() + dayOffset);
            value.setHours(12, minuteOffset, 0, 0);
            return value.getTime();
          };
          const buildReview = (question, lastAt, latestCorrect) => {
            const events = [...reviewProfiles[question.book], latestCorrect];
            return events.reduce((review, correct, index) => {
              const at = index === events.length - 1
                ? lastAt
                : lastAt - (events.length - index - 1) * 21 * DAY;
              return updateReviewRecord(review, correct, at);
            }, null);
          };

          const bookOrder = Object.keys(quotas);
          const selectedByBook = Object.fromEntries(bookOrder.map((book) => {
            const pool = shuffled(ALL_QUESTIONS.filter((question) => question.book === book));
            return [book, pool.slice(0, quotas[book])];
          }));
          const recentTotal = activityCounts.reduce((sum, count) => sum + count, 0);
          const recentQuestions = [];
          let bookCursor = 0;
          while (recentQuestions.length < recentTotal) {
            const book = bookOrder[bookCursor % bookOrder.length];
            const question = selectedByBook[book].shift();
            if (question) recentQuestions.push(question);
            bookCursor += 1;
          }
          const olderQuestions = bookOrder.flatMap((book) => selectedByBook[book]);
          const state = emptyLearningState();
          let recentCursor = 0;

          activityCounts.forEach((answered, dayIndex) => {
            const correct = correctCounts[dayIndex];
            const dayOffset = dayIndex - activityCounts.length + 1;
            const questions = recentQuestions.slice(recentCursor, recentCursor + answered);
            recentCursor += answered;
            const results = shuffled([
              ...Array(correct).fill(true),
              ...Array(answered - correct).fill(false),
            ]);
            const questionIds = [];

            questions.forEach((question, index) => {
              const questionId = String(question.id);
              const answeredAt = timestampForDay(dayOffset, index * 3);
              const wasCorrect = results[index];
              state.attempted[questionId] = answeredAt;
              state.reviews[questionId] = buildReview(question, answeredAt, wasCorrect);
              if (!wasCorrect) state.wrong[questionId] = answeredAt;
              questionIds.push(questionId);
            });

            if (answered) {
              state.dailyActivity[localDateKey(timestampForDay(dayOffset))] = {
                answered,
                correct,
                wrong: answered - correct,
                questionIds,
              };
            }
          });

          olderQuestions.forEach((question, index) => {
            const questionId = String(question.id);
            const isDue = index < 9;
            const dayOffset = isDue ? -61 : -(15 + (index % 30));
            const answeredAt = timestampForDay(dayOffset, index % 40);
            state.attempted[questionId] = answeredAt;
            state.reviews[questionId] = buildReview(question, answeredAt, true);
          });

          olderQuestions.slice(12, 24).forEach((question, index) => {
            state.favorite[String(question.id)] = timestampForDay(-(10 + index));
          });
          state.stats = {
            answered: Object.keys(state.attempted).length,
            correct: Object.keys(state.attempted).length - Object.keys(state.wrong).length,
          };

          STATE = normalizeLearningState(state);
          saveState(STATE);
          await apiJson("/api/progress", {
            method: "PUT",
            body: JSON.stringify({
              progress: {
                state: STATE,
                session: null,
                preferences: {
                  imageVisible: true,
                  panelOpen: true,
                  instantGrade: false,
                  limit: 50,
                  lastBook: "操作系统",
                  aiRailCollapsed: true,
                },
                savedAt: new Date().toISOString(),
              },
            }),
          });
        });

        await page.reload({ waitUntil: "domcontentloaded", timeout: 45_000 });
        await page.waitForFunction(() => (
          typeof DATA_READY !== "undefined"
          && DATA_READY === true
          && typeof AUTH_USER !== "undefined"
          && !!AUTH_USER
          && document.querySelector("#dashboard-content")?.textContent?.includes("今日已答")
        ));
        await page.waitForFunction(() => !document.querySelector("#dashboard-content .loading"));
        const metrics = await page.evaluate(() => {
          const now = Date.now();
          const today = STATE.dailyActivity[localDateKey(now)] || {};
          return {
            answered: Object.keys(STATE.attempted || {}).length,
            wrong: Object.keys(STATE.wrong || {}).length,
            todayAnswered: Number(today.answered) || 0,
            todayCorrect: Number(today.correct) || 0,
            due: dueReviewQuestions(ALL_QUESTIONS, now).length,
            streak: consecutiveStudyDays(STATE.dailyActivity, now),
          };
        });
        if (
          metrics.answered !== 416
          || metrics.todayAnswered !== 13
          || metrics.todayCorrect !== 11
          || metrics.due !== 27
          || metrics.streak !== 7
        ) {
          throw new Error(`Unexpected 408 demo metrics: ${JSON.stringify(metrics)}`);
        }
        await page.addStyleTag({
          content: "#auth-user{display:none!important}",
        });
        console.log(`408 demo verified: ${metrics.answered} attempted, ${metrics.due} due, ${metrics.streak}-day streak`);
      },
      settle: 900,
      widthVariants: [800, 1600],
    });
  } finally {
    await context.close();
  }
}

async function captureHarmony() {
  const sourceRoot = requiredEnv("HARMONY_CAPTURE_ROOT");
  await convertLocalPng({
    name: "408-harmony",
    source: path.join(sourceRoot, "agc-screenshot-01.png"),
    width: 1920,
    height: 1080,
    widthVariants: [800, 1600],
  });
}

async function captureWikiApi() {
  const origin = requiredEnv("WIKI_CAPTURE_ORIGIN");
  await capture({
    name: "wiki-api-docs",
    url: `${origin}/docs`,
    waitFor: "#swagger-ui .opblock",
    settle: 900,
    widthVariants: [800, 1600],
  });
}

async function captureAgentConsole() {
  const origin = requiredEnv("AGENT_CONSOLE_CAPTURE_ORIGIN");
  await capture({
    name: "agent-console-branches",
    url: `${origin}/`,
    waitFor: "main.workspace",
    prepare: async (page) => {
      await page.getByRole("button", { name: /设置中心/ }).last().click();
      await page.getByRole("button", { name: "配置分支", exact: true }).click();
      await page.locator(".branch-layout").waitFor({ state: "visible" });
    },
    clipFrom: async (page) => page.evaluate(() => {
      const shell = document.querySelector(".switch-shell")?.getBoundingClientRect();
      const metrics = document.querySelector(".switch-metrics")?.getBoundingClientRect();
      const warning = document.querySelector(".branch-warning")?.getBoundingClientRect();
      const branch = document.querySelector(".branch-layout")?.getBoundingClientRect();
      if (!shell || !metrics || !branch) throw new Error("Agent Console safe capture region is unavailable.");

      const top = metrics.top - 12;
      const bottom = warning?.top ?? branch.bottom;
      return {
        x: Math.round(shell.left),
        y: Math.round(top),
        width: Math.round(shell.width),
        height: Math.round(bottom - metrics.top),
      };
    }),
    settle: 700,
    widthVariants: [800, 1600],
  });
}

async function captureWritingStudio() {
  const url = process.env.WRITING_STUDIO_CAPTURE_URL
    || "https://github.com/lij768423-svg/writing-studio";
  await capture({
    name: "writing-studio-github",
    url,
    waitFor: "article.markdown-body",
    prepare: async (page) => page.evaluate(() => window.scrollTo(0, 0)),
    settle: 1400,
    widthVariants: [800, 1600],
  });
}

async function captureLaw() {
  const origin = process.env.LAW_CAPTURE_ORIGIN || "https://lawweb.hermesjj.com";
  const pages = [
    ["law-home", "/"],
    ["law-services", "/services"],
    ["law-cases", "/cases"],
    ["law-insights", "/insights"],
    ["law-consultation", "/consultation"],
  ];

  for (const [name, pathname] of pages) {
    await capture({
      name,
      url: `${origin}${pathname}`,
      waitFor: "main",
      settle: 1800,
      widthVariants: [800, 1600],
    });
  }

  const context = await newContext();
  const finder = await context.newPage();
  await finder.goto(`${origin}/insights`, { waitUntil: "domcontentloaded", timeout: 45_000 });
  const articleHref = await finder.locator('a[href^="/insights/"]').first().getAttribute("href");
  await finder.close();
  if (!articleHref) throw new Error("No public law insight article link was found.");
  await capture({
    name: "law-article",
    url: `${origin}${articleHref}`,
    context,
    waitFor: "main",
    settle: 1800,
    widthVariants: [800, 1600],
  });
  await context.close();
}

async function loginToMineradio(context) {
  const password = process.env.MINERADIO_CAPTURE_PASSWORD;
  if (!password) throw new Error("Set MINERADIO_CAPTURE_PASSWORD before capturing Mineradio.");
  const origin = requiredEnv("MINERADIO_CAPTURE_ORIGIN");

  const page = await context.newPage();
  await page.goto(`${origin}/access-login?next=/legacy/`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await page.locator("#access-password").fill(password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith("/access-login"), { timeout: 30_000 }),
    page.locator("#submit-btn").click(),
  ]);
  await page.close();
}

async function prepareMineradioLegacy(page) {
  await page.waitForFunction(() => (
    Array.isArray(window.userPlaylists)
    && window.userPlaylists.some((playlist) => (
      playlist
      && playlist.id
      && (playlist.cover || playlist.coverImgUrl || playlist.picUrl)
    ))
  ), null, { timeout: 20_000 });
  await page.waitForFunction(() => (
    window.homeDiscoverState
    && window.homeDiscoverState.loaded
    && !window.homeDiscoverState.loading
  ), null, { timeout: 20_000 });

  const result = await page.evaluate(async () => {
    const playlist = window.userPlaylists.find((item) => (
      item
      && item.id
      && (item.cover || item.coverImgUrl || item.picUrl)
    ));
    if (!playlist) throw new Error("No Mineradio playlist with cover art is available.");

    const provider = playlist.provider || playlist.source || "netease";
    const endpoint = provider === "qq"
      ? `/api/qq/playlist/tracks?id=${encodeURIComponent(playlist.id)}`
      : `/api/playlist/tracks?id=${encodeURIComponent(playlist.id)}`;
    const response = await fetch(endpoint, { cache: "no-store" });
    if (!response.ok) throw new Error(`Mineradio playlist request failed (HTTP ${response.status}).`);
    const payload = await response.json();
    const tracks = (payload.tracks || payload.songs || [])
      .filter((track) => track && (track.cover || track.picUrl || track.albumCover));
    if (tracks.length < 4) throw new Error("Mineradio did not return enough real cover images for capture.");
    if (!window.homeDiscoverState || typeof window.renderHomeDiscover !== "function") {
      throw new Error("Mineradio home state is unavailable.");
    }

    const proxyUrls = Array.from(new Set(tracks.map((track) => (
      window.coverProxySrc(track.cover || track.picUrl || track.albumCover)
    )))).slice(0, 8);
    const prefetched = await Promise.all(proxyUrls.map(async (url) => {
      try {
        const coverResponse = await fetch(url, { cache: "force-cache" });
        if (!coverResponse.ok || !String(coverResponse.headers.get("content-type") || "").startsWith("image/")) return false;
        const blob = await coverResponse.blob();
        return blob.size > 1_000;
      } catch {
        return false;
      }
    }));
    const prefetchedCount = prefetched.filter(Boolean).length;
    if (prefetchedCount < 4) throw new Error(`Only ${prefetchedCount} Mineradio covers were prefetched.`);

    window.homeDiscoverState.songs = tracks.slice(0, 8);
    window.homeDiscoverState.playlists = window.userPlaylists.slice();
    window.homeDiscoverState.loggedIn = true;
    window.homeDiscoverState.loading = false;
    window.homeDiscoverState.loaded = true;
    window.homeDiscoverState.error = "";
    window.homeDiscoverState.updatedAt = Date.now();
    window.renderHomeDiscover();

    const proxyBackground = (value) => {
      const match = String(value || "").match(/^url\(["']?(.*?)["']?\)$/);
      const url = match?.[1] || "";
      if (!/^https?:\/\//i.test(url) || typeof window.coverProxySrc !== "function") return value;
      return `url("${window.coverProxySrc(url)}")`;
    };
    const artSelector = [
      "#home-feature-art",
      "#home-today-art",
      ".home-card-art",
      ".home-tile-cover",
      ".home-side-now-art",
      ".home-recent-cover",
    ].join(",");
    document.querySelectorAll(artSelector).forEach((element) => {
      element.style.backgroundImage = proxyBackground(element.style.backgroundImage || "");
    });
    document.querySelectorAll(".home-card,.home-feature-card,.home-today-panel,.home-side-now,.home-tile").forEach((element) => {
      const current = element.style.getPropertyValue("--home-card-image");
      if (current) element.style.setProperty("--home-card-image", proxyBackground(current));
    });
    const ambient = document.documentElement.style.getPropertyValue("--home-ambient-image");
    if (ambient) document.documentElement.style.setProperty("--home-ambient-image", proxyBackground(ambient));
    return { tracks: tracks.length, prefetched: prefetchedCount };
  });

  await page.waitForFunction(() => (
    document.querySelectorAll(".has-card-image").length >= 4
    && document.querySelectorAll(".has-cover").length >= 6
  ));
  const loadedCoverCount = await page.evaluate(async () => {
    const selector = [
      "#home-feature-art",
      "#home-today-art",
      ".home-card-art",
      ".home-tile-cover",
      ".home-side-now-art",
      ".home-recent-cover",
    ].join(",");
    const urls = Array.from(document.querySelectorAll(selector))
      .map((element) => element.style.backgroundImage || "")
      .map((value) => value.match(/^url\(["']?(.*?)["']?\)$/)?.[1] || "")
      .filter(Boolean);
    const uniqueUrls = Array.from(new Set(urls));
    const loaded = await Promise.all(uniqueUrls.map((url) => new Promise((resolve) => {
      const image = new Image();
      const timeout = setTimeout(() => resolve(false), 20_000);
      image.onload = () => {
        clearTimeout(timeout);
        resolve(image.naturalWidth > 0 && image.naturalHeight > 0);
      };
      image.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
      image.src = url;
    })));
    return loaded.filter(Boolean).length;
  });
  if (loadedCoverCount < 4) {
    throw new Error(`Mineradio cover verification found ${loadedCoverCount} decoded images after ${result.prefetched} successful prefetches.`);
  }
  console.log(`Mineradio covers verified: ${loadedCoverCount} images from ${result.tracks} playlist tracks`);
}

async function captureHardware() {
  const hardwareOrigin = requiredEnv("HARDWARE_CAPTURE_ORIGIN");
  await capture({
    name: "hardware-control",
    url: `${hardwareOrigin}/`,
    waitFor: "#fanControls",
    prepare: async (page) => {
      await page.waitForFunction(() => !document.querySelector("#updatedAt")?.textContent?.includes("正在读取"));
    },
    settle: 900,
    widthVariants: [800, 1600],
  });
}

async function captureTailscaleLatency() {
  const origin = requiredEnv("TAILSCALE_LATENCY_CAPTURE_ORIGIN");
  await capture({
    name: "tailscale-latency",
    url: `${origin}/`,
    configureContext: async (context) => {
      await context.route("**/api/run", async (route) => {
        const response = await route.fetch();
        const data = await response.json();
        if (response.ok()) {
          const anonymizeName = (value) => {
            const name = String(value || "").replace(/^lijunjie的/, "");
            return /^iz[\w-]{8,}$/i.test(name) ? "remote-node" : name;
          };
          data.nodes?.forEach((node) => {
            node.name = anonymizeName(node.name);
          });
          data.measurements?.forEach((measurement) => {
            measurement.targetName = anonymizeName(measurement.targetName);
          });
        }
        await route.fulfill({ response, json: data });
      });
    },
    waitFor: "#topologyWrap.has-data",
    prepare: async (page) => {
      await page.locator("#run:not([disabled])").waitFor({ state: "visible", timeout: 60_000 });
      await page.waitForFunction(() => document.querySelectorAll("#rows tr[data-ip]").length > 0);
      await page.evaluate(() => {
        document.querySelector("#topology")?.dispatchEvent(new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
        }));
      });
      await page.waitForFunction(() => document.querySelector("#summaryTitle")?.textContent === "网络概览");
      await page.evaluate(() => {
        document.querySelectorAll(".node-ip").forEach((element) => {
          element.textContent = "Tailnet IP 已隐藏";
        });
        document.querySelectorAll(".route-detail").forEach((element) => {
          element.textContent = "端点已隐藏";
        });
        document.querySelectorAll(".node-name").forEach((element) => {
          element.textContent = element.textContent?.replace(/^lijunjie的/, "") || "";
        });
      });
    },
    settle: 900,
    widthVariants: [800, 1600],
  });
}

async function captureMineradio({ includeApp = true } = {}) {
  const mineradioOrigin = requiredEnv("MINERADIO_CAPTURE_ORIGIN");
  const mineradio = await newContext();
  await mineradio.addInitScript(() => {
    localStorage.setItem("mineradio-user-capsule-auto-hide-v1", "1");
    localStorage.setItem("mineradio-visual-guide-seen-v2", "1");
  });
  await loginToMineradio(mineradio);
  await capture({
    name: "mineradio",
    url: `${mineradioOrigin}/legacy/`,
    context: mineradio,
    waitFor: "body",
    prepare: async (page) => {
      await page.waitForTimeout(900);
      await page.keyboard.press("Space");
      await page.waitForFunction(() => !document.body.classList.contains("splash-active"));
      await prepareMineradioLegacy(page);
    },
    settle: 1200,
    widthVariants: [800, 1600],
  });
  if (includeApp) {
    await capture({
      name: "mineradio-app",
      url: `${mineradioOrigin}/app/`,
      context: mineradio,
      waitFor: "body",
      settle: 3200,
      widthVariants: [800, 1600],
    });
  }
  await mineradio.close();
}

async function captureTools() {
  await captureHardware();
  await captureTailscaleLatency();
  await captureMineradio();
}

async function createExistingAssetVariants() {
  const assets = [
    { name: "408-ai", widthVariants: [800] },
    { name: "408-harmony", widthVariants: [800, 1600] },
    { name: "408-wiki", widthVariants: [800] },
    { name: "agent-console-branches", widthVariants: [800, 1600] },
    { name: "hardware-control", widthVariants: [800, 1600] },
    { name: "law-article", widthVariants: [800, 1600] },
    { name: "law-cases", widthVariants: [800, 1600] },
    { name: "law-consultation", widthVariants: [800, 1600] },
    { name: "law-home", widthVariants: [800, 1600] },
    { name: "law-insights", widthVariants: [800, 1600] },
    { name: "law-services", widthVariants: [800, 1600] },
    { name: "mineradio", widthVariants: [800, 1600] },
    { name: "mineradio-app", widthVariants: [800, 1600] },
    { name: "tailscale-latency", widthVariants: [800, 1600] },
    { name: "wiki-api-docs", widthVariants: [800, 1600] },
    { name: "writing-studio-github", widthVariants: [800, 1600] },
  ];
  for (const asset of assets) await createWebpVariants(asset);
}

try {
  if (groups.has("ios")) await captureIosAssets();
  if (groups.has("408")) await capture408();
  if (groups.has("408-demo")) await capture408DashboardDemo();
  if (groups.has("harmony")) await captureHarmony();
  if (groups.has("wiki")) await captureWikiApi();
  if (groups.has("agent")) await captureAgentConsole();
  if (groups.has("writing")) await captureWritingStudio();
  if (groups.has("law")) await captureLaw();
  if (groups.has("hardware")) await captureHardware();
  if (groups.has("tailscale")) await captureTailscaleLatency();
  if (groups.has("mineradio")) await captureMineradio();
  if (groups.has("mineradio-cover")) await captureMineradio({ includeApp: false });
  if (groups.has("tools")) await captureTools();
  if (groups.has("variants")) await createExistingAssetVariants();
} finally {
  await converter.close();
  await converterContext.close();
  await browser.close();
}
