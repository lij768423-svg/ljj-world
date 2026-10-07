# Release and rollback

Use the complete source/site archives and `release-manifest.json` produced by
`npm run release:package`, not a checkout of an unrelated Git HEAD. Verify the
archive hashes before extracting. The source package includes untracked
application files without staging or committing the working tree.

1. Extract `site.tar.gz` into a new, uniquely named directory under `releases/`.
2. Verify its files against `release-manifest.json`. Smoke-test the production
   bundle before activation. Keep the old `current` target recorded.
3. Retain the hashed assets from both the outgoing and incoming releases:

```sh
python3 deploy/retain-assets.py --release /srv/portfolio/current --release /srv/portfolio/releases/NEW_RELEASE --shared /srv/portfolio/shared
```

4. The Caddy template serves current assets first and retained immutable assets
   second. Missing assets return 404 with `no-store`; they never return HTML.
   Non-hashed current assets revalidate after one hour. Fingerprint all changed
   images because older browsers may still have the previous cache policy.
5. Atomically replace the `current` symlink only after the new directory is
   complete and readable by Caddy. Validate the live homepage, article deep link,
   JS Content-Type, a retained old JS URL, and a missing asset with a unique URL.
6. Roll back by atomically restoring the previous symlink. Retain assets from the
   outgoing release first, including during rollback, so open browser tabs keep
   their lazy-loaded chunk URLs. Do not garbage-collect shared assets as part of
   a deploy or rollback.

7. Prune old releases once the new one is verified. Preview first, then apply:

```sh
python3 deploy/prune-releases.py --root /srv/portfolio --keep 3
python3 deploy/prune-releases.py --root /srv/portfolio --keep 3 --apply
```

   It keeps the newest releases and packages, the `current` target and every
   rollback target recorded in a kept package, and never touches `shared/`.
   Releases only accumulate on deploy, so pruning at the end of each deploy keeps
   the release root bounded without a separate timer.

Updating the Caddy configuration does not require deploying new frontend files.
Back up the site configuration, validate the full configuration with `caddy
validate`, reload gracefully, and restore the backup on verification failure.
Retained assets must be readable by Caddy; never copy environment files, source
maps, or private release metadata into the shared public directory.

The template paths and hostname are examples. Preserve any existing logging,
security headers, and redirects when integrating it into a live site.
