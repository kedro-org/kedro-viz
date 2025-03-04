#! /usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

# Install system dependencies
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

# Install Python dependencies
uv pip install kedro
uv pip install -r package/test_requirements.txt -r demo-project/src/docker_requirements.txt
make build
uv pip install -e package/

# Install Node.js dependencies
sudo chown vscode:vscode node_modules
npm install

# Build the frontend


# Generate the Kedro-Viz static build inside demo-project
cd demo-project
kedro viz build

echo "Setup complete! The website will be available at http://localhost:8000 once the container starts."
