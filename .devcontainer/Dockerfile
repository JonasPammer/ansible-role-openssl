FROM mcr.microsoft.com/vscode/devcontainers/base:0-focal@sha256:85df1a70ecf475cef76714b04c4f70ca065c33f63e18ddf78032811f1b0deb0e


############################################################
### INSTRUCTIONS FROM VSCODE TEMPLATE 'Docker-in-Docker' ###
ARG INSTALL_ZSH="true"
ARG UPGRADE_PACKAGES="true"
ARG ENABLE_NONROOT_DOCKER="true"
# Use the OSS Moby Engine instead of the licensed Docker Engine
ARG USE_MOBY="true"
ARG DOCKER_VERSION="latest"

# Enable new "BUILDKIT" mode for Docker CLI
ENV DOCKER_BUILDKIT=1

# Install needed packages and setup non-root user.
# Use a separate RUN statement to add your own dependencies.
# A user of "automatic" attempts to reuse an user ID if one already exists.
ARG USERNAME=automatic
ARG USER_UID=1000
ARG USER_GID=$USER_UID
COPY library-scripts/*.sh /tmp/library-scripts/
RUN apt-get update \
    && /bin/bash /tmp/library-scripts/common-debian.sh "${INSTALL_ZSH}" "${USERNAME}" "${USER_UID}" "${USER_GID}" "${UPGRADE_PACKAGES}" "true" "true" \
    # Use Docker script from script library to set things up
    && /bin/bash /tmp/library-scripts/docker-in-docker-debian.sh "${ENABLE_NONROOT_DOCKER}" "${USERNAME}" "${USE_MOBY}" "${DOCKER_VERSION}" \
    # Clean up
    && apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/* /tmp/library-scripts/

VOLUME [ "/var/lib/docker" ]

# Setting the ENTRYPOINT to docker-init.sh will start up the Docker Engine
# inside the container "overrideCommand": false is set in devcontainer.json.
# The script will also execute CMD if you need to alter startup behaviors.
ENTRYPOINT [ "/usr/local/share/docker-init.sh" ]
CMD [ "sleep", "infinity" ]


########################
### OWN INSTRUCTIONS ###
ENV LANG C.UTF-8
ENV LC_ALL C.UTF-8
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get -qy update \
    && apt-get -qy upgrade \
    && apt-get -qy install --no-install-recommends apt-utils tini \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN apt-get -qy update \
    && apt-get -qqy install --no-install-recommends python3-pip python3-wheel \
    && python3 -m pip install --no-cache-dir --upgrade pip \
    && python3 -m pip install --no-cache-dir wheel \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

USER vscode
RUN git clone --depth=1 https://github.com/Bash-it/bash-it.git /home/vscode/.bash_it && \
    /home/vscode/.bash_it/install.sh --overwrite-backup --silent
# `bash-it` is a function. need to go into interactive mode of before-defined USER!
SHELL ["/bin/bash", "-ic"]
RUN bash-it enable alias apt bash-it curl docker fuck general git systemd && \
    bash-it enable completion bash-it defaults dirs docker git github-cli pip3 pipx ssh system && \
    bash-it enable plugin alias-completion base colors dirs docker explain extract git gitstatus history history-search man python thefuck z_autoenv
SHELL ["/bin/bash", "-c"]

COPY postCreateCommand.sh /home/vscode/postCreateCommand.sh
USER root
RUN chmod u+x /home/vscode/postCreateCommand.sh

USER vscode