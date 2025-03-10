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

# Ensure the virtual environment path is set
export VIRTUAL_ENV="/home/vscode/venv"  # Adjust this if needed
uv venv $VIRTUAL_ENV

# Activate virtual environment explicitly
source $VIRTUAL_ENV/bin/activate

# Install Python dependencies
uv pip install kedro
uv pip install -r package/test_requirements.txt -r demo-project/src/docker_requirements.txt

# Install Node.js dependencies
sudo chown vscode:vscode node_modules
npm install

# Build the frontend and pip install editable kedro-viz
make build
uv pip install -e package/

# Ensure Kedro is installed and available
if ! command -v kedro &> /dev/null
then
    echo "Error: Kedro command not found. Exiting."
    exit 1
fi

# Generate the Kedro-Viz static build inside demo-project
cd demo-project
source $VIRTUAL_ENV/bin/activate  # Ensure virtual environment is active
kedro viz build

# Serve the generated files
cd build
python3 -m http.server 8000 &

echo "Setup complete! The website is available at http://localhost:8000"
