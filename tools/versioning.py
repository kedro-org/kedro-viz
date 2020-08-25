#!/usr/bin/env python3
"""
Get version of Kedro
"""

import re
import sys
import subprocess
import json
from pathlib import Path


VIZ_INIT_FILE = "package/kedro_viz/__init__.py"
PACKAGE_JSON_FILE = "package.json"
PACKAGE_JSON_LOCK_FILE = "package-lock.json"
VERSION_FMT = r"\d+.\d+.\d+"
VERSION_MATCHSTR = r'__version__\s*=\s*"{version_fmt}"'.format(version_fmt=VERSION_FMT)
VERSION_REPLACEMENT = r'__version__ = "{version}"'
TAG_FMT = "v{tag}"


def update_viz_version(version):
    if not re.match(VERSION_FMT, version):
        raise ValueError("Version number does not match format: '%s'" % VERSION_FMT)
    init_file_obj = Path(VIZ_INIT_FILE)
    init_file_str = init_file_obj.read_text()
    init_file_str_updated = re.sub(
        VERSION_MATCHSTR, VERSION_REPLACEMENT.format(version=version), init_file_str
    )
    init_file_obj.write_text(init_file_str_updated)


def git_commit(version):
    commit_msg = TAG_FMT.format(tag=version)
    subprocess.check_call(["git", "commit", "-m", commit_msg])


def update_npm_package(version):
    files = (PACKAGE_JSON_FILE, PACKAGE_JSON_LOCK_FILE)
    for filepath in files:
        package_file = Path(filepath)
        package_data = json.loads(package_file.read_text())
        package_data["version"] = version
        package_file.write_text(json.dumps(package_data, indent=2))


def git_stage_files():
    files_to_stage = [VIZ_INIT_FILE, PACKAGE_JSON_FILE, PACKAGE_JSON_LOCK_FILE]
    subprocess.check_call(["git", "add"] + files_to_stage)


def main(argv):
    if len(argv) != 2:
        print("Error... please specify an appropriate version number!")
        return 1
    version = argv[1]
    update_viz_version(version)
    update_npm_package(version)
    git_stage_files()
    git_commit(version)


if __name__ == "__main__":
    sys.exit(main(sys.argv))
