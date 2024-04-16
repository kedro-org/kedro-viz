FROM gitpod/workspace-full:latest

RUN pyenv install 3.9 \
    && pyenv global 3.9

RUN bash -c 'VERSION="18.20.0" \
    && source $HOME/.nvm/nvm.sh && nvm install $VERSION \
    && nvm use $VERSION && nvm alias default $VERSION'

RUN echo "nvm use default &>/dev/null" >> ~/.bashrc.d/51-nvm-fix
