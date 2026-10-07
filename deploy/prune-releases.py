"""Remove old releases and deployment packages from the release root.

Keeps the newest --keep releases/packages, the release `current` points at, and the
rollback target recorded for the current release (its package's previous-target.txt).
Never touches shared/
(retained immutable assets must outlive the releases that introduced them).

Dry run by default; pass --apply to delete.
"""
import argparse
import json
import os
from pathlib import Path
import re
import shutil


RELEASE_ID = re.compile(r"^\d{8}T\d{6}Z$")


def release_ids(directory):
    if not directory.is_dir():
        return []
    return sorted(entry.name for entry in directory.iterdir() if entry.is_dir() and not entry.is_symlink() and RELEASE_ID.fullmatch(entry.name))


def plan(root, keep):
    if keep < 2:
        raise ValueError("Keep at least two releases so a rollback target always exists")
    current = root / "current"
    if not current.is_symlink():
        raise ValueError(f"{current} is not a symlink; refusing to prune")
    current_id = Path(os.readlink(current)).name
    releases = release_ids(root / "releases")
    deployments = release_ids(root / "deployments")
    if current_id not in releases:
        raise ValueError(f"current points at {current_id}, which is not under releases/")

    kept_deployments = set(deployments[-keep:])
    protected = set(releases[-keep:]) | {current_id}
    # Only the live release's rollback target matters; older packages' targets would keep
    # one extra release forever.
    previous = root / "deployments" / current_id / "previous-target.txt"
    if previous.is_file():
        protected.add(Path(previous.read_text().strip()).name)

    return {
        "current": current_id,
        "keptReleases": sorted(set(releases) & protected),
        "deleteReleases": [release for release in releases if release not in protected],
        "keptDeployments": sorted(kept_deployments | (set(deployments) & protected)),
        "deleteDeployments": [deployment for deployment in deployments if deployment not in kept_deployments and deployment not in protected],
    }


def apply(root, result):
    for folder, key in (("releases", "deleteReleases"), ("deployments", "deleteDeployments")):
        base = (root / folder).resolve()
        for name in result[key]:
            target = (base / name).resolve()
            if target.parent != base or not RELEASE_ID.fullmatch(target.name):
                raise ValueError(f"Refusing to delete unexpected path: {target}")
            shutil.rmtree(target)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--root", default="/srv/ljj-world", type=Path)
    parser.add_argument("--keep", default=3, type=int)
    parser.add_argument("--apply", action="store_true", help="delete; without it this is a dry run")
    arguments = parser.parse_args()
    result = plan(arguments.root, arguments.keep)
    if arguments.apply:
        apply(arguments.root, result)
    print(json.dumps({**result, "applied": arguments.apply}, indent=2))
