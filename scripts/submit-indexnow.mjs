// Tell IndexNow-backed search engines (Bing, Yandex, Naver, Seznam) which pages changed.
// Run after a deploy: `npm run indexnow`. It reads the live sitemap, checks that the key file is
// served, and submits every URL in one request. Google does not take IndexNow; its sitemap is
// read from Search Console instead.
import { readdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const origin = (process.env.SITE_ORIGIN ?? "https://ljj.world").replace(/\/$/, "");
const host = new URL(origin).host;

const keyFile = (await readdir(path.join(root, "public"))).find((name) => /^[a-f0-9]{32}\.txt$/.test(name));
if (!keyFile) throw new Error("No IndexNow key file (public/<32 hex>.txt) found");
const key = keyFile.slice(0, -4);
const keyLocation = `${origin}/${keyFile}`;

const served = await fetch(keyLocation);
if (!served.ok || (await served.text()).trim() !== key) throw new Error(`${keyLocation} does not serve the key; deploy first`);

const sitemap = await (await fetch(`${origin}/sitemap.xml`)).text();
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]).filter((url) => url.startsWith(`${origin}/`));
if (urlList.length === 0) throw new Error("The live sitemap lists no URLs");

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key, keyLocation, urlList }),
});
const body = (await response.text()).trim();
console.log(`IndexNow: ${response.status} ${response.statusText}${body ? ` ${body}` : ""} for ${urlList.length} URLs`);
if (![200, 202].includes(response.status)) process.exit(1);
