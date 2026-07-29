# ljj.world

> A desktop-first interactive portfolio for products, experiments, and a self-hosted home lab.

[Visit the live site](https://ljj.world) · [Report an issue](https://github.com/lij768423-svg/personal-portfolio/issues) · [MIT license](./LICENSE)

[English](./README.md) · [简体中文](./README.zh-CN.md)

`ljj.world` is not a landing-page template. It is a portfolio built as a set of kinetic scenes: a product index grows into a DNA helix, a server opens into the services it runs, and a desk archive becomes a pair of draggable photo arcs. The site is designed, implemented, deployed, and maintained as one personal system.

中文：这是一个以产品、个人经历与自建服务器为内容的交互式作品集。它更像一组可以进入的场景，而不是一张静态简历。

<img src="./docs/screenshots/home.jpg" alt="ljj.world home page with an illustrated developer portrait" width="100%" />

## What Is Inside

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="./docs/screenshots/projects.jpg" alt="Project index arranged along a DNA helix" />
      <strong>Project index</strong><br />
      Twelve projects orbit a continuously moving DNA sequence. Selecting a card unfolds a focused dossier instead of sending the visitor through a generic card grid.
    </td>
    <td width="50%" valign="top">
      <img src="./docs/screenshots/server.jpg" alt="GPU and AI module from the server story" />
      <strong>Server story</strong><br />
      A line-art machine opens into network, hardware, AI, data, and container modules. Each module exposes the services behind the visual.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="./docs/screenshots/desk.jpg" alt="HOME and DORM desk photo archives on curved galleries" />
      <strong>Desk archive</strong><br />
      HOME and DORM collections use opposing curved galleries. Photos can be dragged, tilted on hover, opened full-screen, and browsed within their original group.
    </td>
    <td width="50%" valign="top">
      <img src="./docs/screenshots/about.jpg" alt="About page showing the developer profile and working method" />
      <strong>About as a system</strong><br />
      The profile page keeps biography, working method, capabilities, and personal interests in the same visual language as the product scenes.
    </td>
  </tr>
</table>

## Experience Principles

- **A route should have a point of view.** Home, Projects, Server, Desk, and About are distinct scenes rather than repeated page shells.
- **Motion carries structure.** The project helix, server expansion, gallery entry, theme wipe, and language transition all reveal hierarchy or state instead of acting as decoration.
- **Interaction stays local.** Project cards unfold in place; server modules focus by click and reset on blank space; desk photos retain their group and position in a full-screen viewer.
- **The design remains inspectable.** A restrained grid, red connector system, stable dock, and reduced-motion fallback prevent the visual system from becoming a collection of effects.

## Technical Shape

| Concern | Implementation |
| --- | --- |
| Application | React 19, TypeScript, Vite 8, Wouter |
| Motion | Motion for React, GSAP, custom CSS choreography |
| 3D and canvas | Three.js DNA helix, OGL circular galleries, Canvas pointer effects |
| Interface | CSS grid system, light/dark themes, English/Chinese language transition |
| Quality | Playwright visual and interaction regression coverage, `prefers-reduced-motion` fallback |

The portfolio is intentionally static: it has no runtime database, API, analytics dependency, or required environment variable. Content lives in the repository and the production output is a regular static build.

## Run Locally

Requires Node.js 20 or newer.

```bash
git clone https://github.com/lij768423-svg/personal-portfolio.git
cd personal-portfolio
npm ci
npm run dev
```

Vite starts on `http://localhost:5173`. The desktop composition is the primary target; mobile keeps all routes usable but intentionally simplifies the heaviest kinetic behavior.

## Verify Changes

Install Playwright Chromium once, then run the same checks used by CI:

```bash
npx playwright install chromium
npm run typecheck
npm run build
npm run test:e2e
```

If Chromium is already installed elsewhere, set `PLAYWRIGHT_CHROMIUM_PATH` before running the browser tests.

## Make It Yours

This repository is easiest to adapt by replacing content first, then assets, then visual details.

| Change | Where |
| --- | --- |
| Projects, outbound links, server services, metadata | [`src/App.tsx`](./src/App.tsx) |
| English/Chinese text mapping and global transition | [`src/i18n`](./src/i18n) |
| Project DNA and paper-style project detail | [`src/components/ProjectHelix.tsx`](./src/components/ProjectHelix.tsx) |
| Server machine and service expansion | [`src/components/ServerExplodedStory.tsx`](./src/components/ServerExplodedStory.tsx) |
| Desk arcs and full-screen image viewer | [`src/components/CircularGallery.tsx`](./src/components/CircularGallery.tsx) |
| Visual system and page layout | [`src/styles.css`](./src/styles.css) |
| Reusable interaction layers | [`src/effects.css`](./src/effects.css) and [`src/components/effects`](./src/components/effects) |

New Chinese copy can be added to the translation mapping with:

```bash
node scripts/generate-portfolio-translations.mjs
```

Replace identity-specific copy and the contents of `public/assets` before publishing a derivative. The screenshot capture utility is optional and only needed when refreshing project previews:

```bash
cp .env.example .env.local
npm run capture:projects -- law
```

The supported capture groups are `408`, `408-demo`, `harmony`, `ios`, `law`, `wiki`, `agent`, `writing`, `hardware`, `tailscale`, `mineradio`, `mineradio-cover`, `tools`, and `variants`. See [`.env.example`](./.env.example) for optional source locations. Review any captured image before committing it: do not publish private addresses, device names, credentials, or user data.

## Deploy

```bash
npm run build
```

Deploy `dist/` to any static host. Because the app uses History API routing, unknown paths must fall back to `index.html`. A generic [Caddy example](./deploy/caddy/portfolio.caddy.example) is included. For Nginx:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

## Repository Map

```text
personal-portfolio/
├── docs/screenshots/    # README visuals captured from the running site
├── deploy/              # static-hosting examples
├── public/assets/       # portfolio-specific images and generated artwork
├── scripts/             # asset preparation, capture, and translation helpers
├── src/components/      # visual scenes and interaction primitives
├── src/i18n/            # language transition and text mapping
├── src/App.tsx          # content model, routes, and page composition
└── tests/               # Playwright regression coverage
```

## License and Asset Use

The source code and documentation are released under the [MIT License](./LICENSE).

The visuals in `public/assets` and `docs/screenshots` are not automatically covered by MIT. They include personal images, identity-specific copy, product screenshots, marks, and generated artwork. Their use is described in [ASSET_LICENSE.md](./ASSET_LICENSE.md); replace them before redistributing a derivative as your own portfolio.

Some animation components adapt ideas or source from React Bits. Dependency and attribution details are in [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
