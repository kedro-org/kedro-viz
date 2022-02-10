FROM gitpod/workspace-full:latest

RUN bash -c ". .nvm/nvm.sh && nvm install lts/fermium && nvm use lts/fermium && nvm alias default lts/fermium"

RUN echo "nvm use default &>/dev/null" >> ~/.bashrc.d/51-nvm-fix
