# Contributing

Thanks for taking the time to improve this portfolio.

## Development

```bash
npm ci
npm run dev
```

Before opening a pull request, run:

```bash
npm run typecheck
npm run build
npm run test:e2e
```

End-to-end tests start their own development server on `127.0.0.1:4186`.
Keep that port free; tests intentionally do not reuse an existing preview server,
so they always exercise the current source rather than an older `dist/` build.

## Release snapshots

Run `npm run test:e2e` before `npm run release:package`. Packaging copies the current
working tree (including untracked application files) into `tmp/release-packages/`,
then runs `npm ci` and a production build inside that isolated source snapshot.
It does not commit, stage, or deploy changes. Only approved source directories and
root configuration files are included; local tooling state such as `.hallmark` and
environment files are excluded. Generated cover variants are part of the snapshot.

Keep `source.tar.gz`, `site.tar.gz`, `release-manifest.json`, and `SHA256SUMS`
together. Check `sha256sum -c SHA256SUMS` before distributing them. To rebuild,
extract `source.tar.gz` into an empty directory, use the Node/npm versions recorded
in `SOURCE-MANIFEST.json`, run `npm ci && npm run build`, and compare the output
file hashes against `release-manifest.json`. Never use Git HEAD alone as the release
identity while uncommitted work exists. Repackage after any further source change.

## Contribution scope

- Keep the interface accessible with keyboard navigation and `prefers-reduced-motion`.
- Avoid adding runtime services when a static implementation is sufficient.
- Do not commit secrets, private network addresses, device identifiers, or private screenshots.
- Do not replace the author's identity-specific content with third-party material unless its license is documented.
- Keep pull requests focused and describe any visual behavior change.

By contributing code, you agree that your contribution may be distributed under this repository's MIT License. Assets remain subject to `ASSET_LICENSE.md` and documented third-party terms.
