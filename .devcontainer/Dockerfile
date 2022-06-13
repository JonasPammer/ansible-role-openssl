FROM mcr.microsoft.com/vscode/devcontainers/base:0-focal


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
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends python3 python3-pip python3-setuptools \
    && python3 -m pip install --upgrade pip && python3 -m pip install tox

# Install shellcheck script to system as needed by pre-commit hook
ADD https://github.com/koalaman/shellcheck/releases/download/v0.8.0/shellcheck-v0.8.0.linux.x86_64.tar.xz /tmp/shellcheck
RUN apt-get -y install --no-install-recommends xz-utils \
    && mkdir -p /tmp/shellcheckd \
    && tar -xJf /tmp/shellcheck --directory /tmp/shellcheckd \
    && cp /tmp/shellcheckd/shellcheck-v0.8.0/shellcheck /usr/local/bin/