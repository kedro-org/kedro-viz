#! /usr/bin/env bash

# http://redsymbol.net/articles/unofficial-bash-strict-mode/
set -euo pipefail
IFS=$'\n\t'

# Install build tools for node-gyp and pixman
sudo apt-get update && \
sudo apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    make \
    g++ \
    libpixman-1-dev \
    libcairo2-dev \
    libjpeg-dev \
    libgif-dev \
    pkg-config \
    libcairo2-dev \
    libpango1.0-dev \
    libpangocairo-1.0-0 && \
sudo apt-get clean && sudo rm -rf /var/lib/apt/lists/*

# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

uv venv $VIRTUAL_ENV

uv pip install -r package/test_requirements.txt -r demo-project/src/docker_requirements.txt
uv pip install -e package/

# Now the NPM dependencies too
sudo chown vscode:vscode node_modules
npm install
