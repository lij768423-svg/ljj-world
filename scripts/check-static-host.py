import argparse
import json
import subprocess
import uuid


parser = argparse.ArgumentParser(description="Read-only checks for a static SPA host and retained chunks.")
parser.add_argument("origin")
parser.add_argument("--resolve")
parser.add_argument("--current-asset", required=True)
parser.add_argument("--retained-asset", required=True)
parser.add_argument("--image", required=True)
arguments = parser.parse_args()


def inspect(relative):
    command = ["curl", "--silent", "--show-error", "--max-time", "20", "--head"]
    if arguments.resolve:
        command.extend(["--noproxy", "*", "--resolve", arguments.resolve])
    command.append(arguments.origin.rstrip("/") + relative)
    response = subprocess.check_output(command, text=True)
    blocks = [block for block in response.replace("\r\n", "\n").split("\n\n") if block.startswith("HTTP/")]
    lines = blocks[-1].splitlines()
    headers = {name.lower(): value.strip() for name, value in (line.split(":", 1) for line in lines[1:] if ":" in line)}
    return {"path": relative, "status": int(lines[0].split()[1]), "headers": headers}


results = []
for relative in [arguments.current_asset, arguments.retained_asset]:
    result = inspect(relative)
    assert result["status"] == 200, result
    assert "javascript" in result["headers"].get("content-type", ""), result
    assert "immutable" in result["headers"].get("cache-control", ""), result
    results.append(result)

result = inspect(arguments.image)
assert result["status"] == 200 and result["headers"].get("content-type", "").startswith("image/"), result
assert "immutable" not in result["headers"].get("cache-control", ""), result
assert "must-revalidate" in result["headers"].get("cache-control", ""), result
results.append(result)

for extension in ["js", "webp", "css"]:
    result = inspect(f"/assets/release-check-{uuid.uuid4().hex}.{extension}")
    assert result["status"] == 404, result
    assert result["headers"].get("cache-control") == "no-store", result
    assert "text/html" not in result["headers"].get("content-type", ""), result
    results.append(result)

for relative in ["/", "/blog/home-server-as-a-product"]:
    result = inspect(relative)
    assert result["status"] == 200 and "text/html" in result["headers"].get("content-type", ""), result
    assert result["headers"].get("cache-control") == "no-cache", result
    results.append(result)

print(json.dumps(results, indent=2))
