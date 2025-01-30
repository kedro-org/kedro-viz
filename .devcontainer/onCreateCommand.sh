#! /usr/bin/env bash

# http://redsymbol.net/articles/unofficial-bash-strict-mode/
set -euo pipefail
IFS=$'\n\t'

# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

uv venv $VIRTUAL_ENV

uv pip install -r package/test_requirements.txt -r demo-project/src/docker_requirements.txt
uv pip install -e package/

# Now the NPM dependencies too
npm install
