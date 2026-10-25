"""Activate a release package on the static host (see deploy/RELEASE.md).

Usage, run as root on the host, from anywhere:

    python3 deploy-release.py <release_id> <expected_previous> <manifest_sha256> [--root /srv/ljj-world] [--origin https://ljj.world]

The package directory <root>/deployments/<release_id> must already hold SHA256SUMS,
release-manifest.json, site.tar.gz, source.tar.gz and retain-assets.py. The script verifies the
package, extracts it into <root>/releases/<release_id>, retains hashed assets from the outgoing and
incoming release, swaps the `current` symlink atomically, and then checks the public origin:
every prerendered route must serve its own HTML entry, sitemap.xml and rss.xml must match, an
unknown path must answer 404 with 404.html, and the previous release's JS chunk must still be
served. Any failure swaps the symlink back.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys
import tarfile
import uuid

parser = argparse.ArgumentParser()
parser.add_argument("release_id")
parser.add_argument("expected_previous")
parser.add_argument("expected_manifest")
parser.add_argument("--root", default="/srv/ljj-world")
parser.add_argument("--origin", default="https://ljj.world")
arguments = parser.parse_args()

release_id = arguments.release_id
expected_previous = arguments.expected_previous
root = Path(arguments.root)
package = root / "deployments" / release_id
release = root / "releases" / release_id
current = root / "current"
origin = arguments.origin.rstrip("/")
host = origin.split("://", 1)[1]


def digest(file):
    return hashlib.sha256(file.read_bytes()).hexdigest()


def swap(target):
    temporary = root / (".current-" + release_id)
    temporary.symlink_to(target)
    os.replace(temporary, current)


def fetch(relative, expect_status=200):
    command = ["curl", "--silent", "--show-error", "--max-time", "25", "--noproxy", "*", "--resolve", f"{host}:443:127.0.0.1",
               "--output", "-", "--write-out", "\n%{http_code}", origin + relative]
    output = subprocess.check_output(command)
    body, _, status = output.rpartition(b"\n")
    if int(status) != expect_status:
        raise RuntimeError(f"{relative}: expected {expect_status}, got {status.decode()}")
    return body


if os.readlink(current) != expected_previous:
    raise RuntimeError("Public release changed; refusing activation")
if digest(package / "release-manifest.json") != arguments.expected_manifest:
    raise RuntimeError("Manifest hash mismatch")
subprocess.run(["sha256sum", "-c", "SHA256SUMS"], cwd=package, check=True)
manifest = json.loads((package / "release-manifest.json").read_text())
assert manifest["releaseId"] == release_id
release.mkdir(mode=0o755)
with tarfile.open(package / "site.tar.gz") as archive:
    for member in archive.getmembers():
        relative = PurePosixPath(member.name)
        if relative.is_absolute() or ".." in relative.parts or not (member.isfile() or member.isdir()):
            raise RuntimeError("Unsafe archive entry")
    archive.extractall(release, filter="data")
expected_files = {entry["path"] for entry in manifest["files"]}
assert {str(file.relative_to(release)) for file in release.rglob("*") if file.is_file()} == expected_files
for entry in manifest["files"]:
    file = release / entry["path"]
    assert file.stat().st_size == entry["bytes"] and digest(file) == entry["sha256"]
for required in ["index.html", "404.html", "sitemap.xml", "rss.xml", "blog/index.html", "systems/index.html"]:
    assert (release / required).is_file(), f"release is missing {required}"
for file in [release, *release.rglob("*")]:
    file.chmod(0o755 if file.is_dir() else 0o644)
subprocess.run(["chown", "-R", "root:caddy", str(release)], check=True)
subprocess.run(["python3", str(package / "retain-assets.py"), "--release", str(current), "--release", str(release), "--shared", str(root / "shared")], check=True)
previous_html = (current / "index.html").read_text()
previous_js = re.search(r'src="(/assets/[^"]+\.js)"', previous_html).group(1)
(package / "previous-target.txt").write_text(expected_previous + "\n")
if os.readlink(current) != expected_previous:
    raise RuntimeError("Public release changed before activation")
swap("releases/" + release_id)
try:
    routes = ["/", "/projects", "/projects/travel-agent", "/systems", "/about", "/desk", "/blog"]
    routes += sorted("/" + str(path.parent.relative_to(release)) for path in (release / "blog").glob("*/index.html"))
    for route in routes:
        expected = release / "index.html" if route == "/" else release / route.lstrip("/") / "index.html"
        assert hashlib.sha256(fetch(route)).hexdigest() == digest(expected), route
    for static in ["/sitemap.xml", "/rss.xml", "/robots.txt"]:
        assert hashlib.sha256(fetch(static)).hexdigest() == digest(release / static.lstrip("/")), static
    missing = fetch(f"/__missing-{uuid.uuid4().hex}", expect_status=404)
    assert hashlib.sha256(missing).hexdigest() == digest(release / "404.html"), "404.html"
    new_js = re.search(r'src="(/assets/[^"]+\.js)"', (release / "index.html").read_text()).group(1)
    fetch(new_js)
    fetch(previous_js)
    artwork = next(entry["path"] for entry in manifest["files"] if entry["path"].startswith("assets/service-art/immich-") and entry["path"].endswith(".webp"))
    assert hashlib.sha256(fetch("/" + artwork)).hexdigest() == digest(release / artwork)
    assert subprocess.check_output(["systemctl", "is-active", "caddy"], text=True).strip() == "active"
except BaseException:
    swap(expected_previous)
    raise
result = {"release": release_id, "previous": expected_previous, "files": len(manifest["files"]), "routesVerified": len(routes), "newJs": new_js, "retainedJs": previous_js, "image": "/" + artwork, "originVerified": True}
(package / "deployment-result.json").write_text(json.dumps(result, indent=2))
print(json.dumps(result))
