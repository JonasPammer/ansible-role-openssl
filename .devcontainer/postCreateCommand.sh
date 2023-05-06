#!/bin/bash
# avoid "detected dubious ownership in repository":
git config --global --add safe.directory /workspaces/*

python3 -m pip install -r requirements-dev.txt

pre-commit install --install-hooks
#pre-commit install --hook-type commit-msg
