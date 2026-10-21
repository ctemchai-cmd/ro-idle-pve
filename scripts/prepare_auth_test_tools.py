#!/usr/bin/env python3
"""Pinned official macOS arm64 test binaries; no global installation."""
import hashlib
import json
import os
from pathlib import Path
import platform
import tarfile
import urllib.request
ROOT = Path(__file__).resolve().parents[1]
if platform.system() != "Darwin" or platform.machine() != "arm64":
    raise SystemExit("This pinned tool manifest is for macOS arm64 only")
target = Path(os.environ.get("RO_AUTH_TOOLS", "/private/tmp/ro-idle-auth-tools"))
target.mkdir(parents=True, exist_ok=True)
for tool in json.loads((ROOT / "supabase/tests/local-tools.json").read_text()):
    archive = target / tool["archive"]
    if not archive.exists():
        request = urllib.request.Request(tool["url"], headers={"User-Agent": "RO-Idle-local-test-setup"})
        with urllib.request.urlopen(request, timeout=60) as response:
            archive.write_bytes(response.read())
    if hashlib.sha256(archive.read_bytes()).hexdigest() != tool["sha256"]:
        raise SystemExit("Test tool checksum mismatch: " + tool["tool"])
    directory = target / tool["tool"]; directory.mkdir(exist_ok=True)
    with tarfile.open(archive) as contents:
        contents.extractall(directory, filter="data")
    print(tool["tool"] + " " + tool["version"] + " checksum verified")
