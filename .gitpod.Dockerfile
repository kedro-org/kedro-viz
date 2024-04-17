FROM gitpod/workspace-base

# Install Python 3.9 and pip
RUN sudo apt-get update && \
    sudo apt-get install -y software-properties-common && \
    sudo add-apt-repository ppa:deadsnakes/ppa && \
    sudo apt-get update && \
    sudo apt-get install -y python3.9 python3.9-distutils python3.9-venv python3.9-dev && \
    sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.9 1 && \
    sudo apt-get install -y python3-pip

# Install Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && \
    sudo apt-get install -y nodejs

# Clean up
RUN sudo apt-get autoremove -y && \
    sudo apt-get clean -y && \
    sudo rm -rf /var/lib/apt/lists/*
