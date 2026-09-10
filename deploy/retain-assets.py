import argparse
import hashlib
import os
from pathlib import Path
import re
import shutil
import tempfile


HASHED_ASSET = re.compile(r"(?:.+-[A-Za-z0-9_-]{8}\.(?:js|css|woff2?)|.+-[a-f0-9]{12}\.(?:webp|png|svg|avif))$")


def retain_assets(release, shared):
    source = Path(release).resolve() / "assets"
    target = Path(shared).resolve() / "assets"
    copied = 0
    if not source.is_dir():
        raise ValueError(f"Missing asset directory: {source}")
    for asset in sorted(source.rglob("*")):
        if not asset.is_file() or asset.is_symlink() or not HASHED_ASSET.fullmatch(asset.name):
            continue
        relative = asset.relative_to(source)
        destination = target / relative
        if destination.exists():
            if hashlib.sha256(asset.read_bytes()).digest() != hashlib.sha256(destination.read_bytes()).digest():
                raise ValueError(f"Immutable asset collision: {relative}")
            continue
        destination.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(dir=destination.parent, delete=False) as temporary:
            temporary_path = Path(temporary.name)
        try:
            shutil.copyfile(asset, temporary_path)
            temporary_path.chmod(0o644)
            os.replace(temporary_path, destination)
        finally:
            temporary_path.unlink(missing_ok=True)
        copied += 1
    return copied


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Retain immutable asset URLs before activating or rolling back a release.")
    parser.add_argument("--release", action="append", required=True)
    parser.add_argument("--shared", required=True)
    arguments = parser.parse_args()
    for release in arguments.release:
        print(f"{release}: retained {retain_assets(release, arguments.shared)} assets")
