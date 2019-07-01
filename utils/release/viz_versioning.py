#!/usr/bin/env python3
"""
Get version of Kedro
"""

import re
import sys
import subprocess
from pathlib import Path


VIZ_INIT_FILE = "package/kedro_viz/__init__.py"
VERSION_FMT = r"\d+.\d+.\d+"
VERSION_MATCHSTR = r'__version__\s*=\s*"{version_fmt}"'.format(version_fmt=VERSION_FMT)
VERSION_REPLACEMENT = r'__version__ = "{version}"'


def update_viz_version(version):
    if not re.match(VERSION_FMT, version):
        raise ValueError("Version number does not match format: '%s'" % VERSION_FMT)
    init_file_obj = Path(VIZ_INIT_FILE)
    init_file_str = init_file_obj.read_text()
    init_file_str_updated = re.sub(
        VERSION_MATCHSTR, VERSION_REPLACEMENT.format(version=version), init_file_str
    )
    init_file_obj.write_text(init_file_str_updated)


def git_stage_init_file():
    subprocess.check_call(["git", "add", VIZ_INIT_FILE])


def main(argv):
    version = argv[1]
    update_viz_version(version)
    git_stage_init_file()


if __name__ == "__main__":
    main(sys.argv)
