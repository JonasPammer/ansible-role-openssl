# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Ansible role (`jonaspammer.openssl`) for generating OpenSSL/x509 certificate files (privatekey, CSR, certificate, PKCS12). It wraps the `community.crypto` Ansible collection modules to provide a simplified, DRY interface with OS-specific defaults and system CA store integration.

## Development Commands

### Testing

```bash
# Run all tests (linting + molecule tests across all Ansible versions)
tox

# Run tests on a specific distribution
MOLECULE_DISTRO=ubuntu2204 tox
MOLECULE_DISTRO=debian12 tox
MOLECULE_DISTRO=rockylinux9 tox

# Available distributions (see .github/workflows/ci.yml matrix):
# ubuntu2004, ubuntu2204, debian11, debian12, rockylinux8, rockylinux9, fedora39

# Run tests and keep container running for debugging
MOLECULE_DESTROY=never MOLECULE_DISTRO=ubuntu2204 tox

# Run specific tox environment (specific Ansible version)
tox -e py3-ansible-9  # Ansible 9 (core 2.16)
tox -e py3-ansible-8  # Ansible 8 (core 2.15)
tox -e py3-ansible-7  # Ansible 7 (core 2.14)
tox -e py3-ansible-6  # Ansible 6 (core 2.13)

# Run only pre-commit checks
tox -e pre-commit

# Show installed package versions (useful for debugging)
CI=true tox
```

### Debugging Molecule Containers

```bash
# 1. Run with MOLECULE_DESTROY=never
MOLECULE_DESTROY=never MOLECULE_DISTRO=debian12 tox -e py3-ansible-9

# 2. Find the container name
docker ps

# 3. Enter the container
docker exec -it <container-id> /bin/bash

# 4. Check debug outputs inside container
cat /var/tmp/vars.yml
cat /var/tmp/environment.yml

# 5. Clean up when done
docker stop <container-id>
docker container rm <container-id>
```

### Linting

```bash# Run all pre-commit hooks
pre-commit run --all-files

# Install pre-commit to run on every commit
pre-commit install

# YAML linting specifically
yamllint .

# Ansible linting specifically
ansible-lint
```

### Development Environment Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install development dependencies
pip install -r requirements-dev.txt
```

### Template Synchronization

This project uses [cruft](https://github.com/cruft/cruft) to stay in sync with the [cookiecutter-ansible-role](https://github.com/JonasPammer/cookiecutter-ansible-role) template:

```bash
# Check for template updates
cruft check

# Update from template
cruft update
```

## Architecture & Code Structure

### Role Execution Flow

1. **tasks/main.yml** - Main entry point:
   - Imports `tasks/assert.yml` to validate variables
   - Installs OS packages from `openssl__requirements`
   - Installs pip packages (`cryptography>3,<3.5`) with special handling for binary/rust builds
   - Creates directories (`openssl_key_directory`, `openssl_csr_directory`, `openssl_crt_directory`)
   - Loops over `openssl_items` and includes `tasks/create.yml` for each

2. **tasks/assert.yml** - Variable validation:
   - Checks that `openssl_items` is iterable
   - Validates each item has `filename` and `csr_common_name`
   - Validates directory variables are defined and are strings

3. **tasks/create.yml** - Certificate generation (per item):
   - Generates private key (`.key`) using `community.crypto.openssl_privatekey`
   - Generates CSR (`.csr`) using `community.crypto.openssl_csr`
   - Generates x509 certificate (`.crt`) using `community.crypto.x509_certificate`
   - Generates PKCS12 file (`.p12`) using `community.crypto.openssl_pkcs12`
   - Creates combined key+cert file (`.keycrt`)
   - Optionally installs certificate to system CA trust store (OS-specific)

### Variable Architecture

**OS-Specific Directory Defaults** (vars/main.yml):
- Uses hierarchical lookup: `Distribution_Version` → `Distribution` → `OS_Family` → `default`
- Directories:
  - `openssl_key_directory`: Sensitive files (Debian: `/etc/ssl/private`, RHEL: `/etc/pki/tls/private`)
  - `openssl_csr_directory`: Non-persistent public files (Debian: `/etc/ssl/misc`, RHEL: `/etc/pki/tls/misc`)
  - `openssl_crt_directory`: Persistent public files (Debian: `/etc/ssl/certs`, RHEL: `/etc/pki/tls/certs`)

**Variable Cascading Pattern**:
Each `openssl_items` entry supports:
- Direct parameters (e.g., `privatekey_size`, `csr_country_name`)
- Default fallbacks (e.g., `default_backup`, `default_owner`, `default_force`)
- Automatic path resolution (privatekey_path, csr_path constructed from directories + filename)

**Critical Variables**:
- `openssl_items` - List of certificates to generate (each must have `filename` and `csr_common_name`)
- `openssl_cryptography_prefer_binary` (default: true) - Use binary cryptography packages
- `openssl_cryptography_build_rust` (default: false) - Whether to build Rust components
- `install_ca_to_system` (per-item) - Install certificate to OS CA trust store

### System CA Store Integration

**Debian/Ubuntu**:
- Symlinks `.crt` to `/usr/local/share/ca-certificates/`
- Runs `update-ca-certificates [--fresh]`
- Uses `install_ca_to_system_fresh` to force rebuild

**RedHat/Rocky/Fedora**:
- Installs `ca-certificates` package
- Symlinks to `/etc/pki/ca-trust/source/anchors/`
- Runs `update-ca-trust` and `update-ca-trust extract`
- Creates hash-based symlink (e.g., `<hash>.0`) for openssl recognition

### Testing Structure

**Molecule Scenario** (`molecule/default/`):
- `molecule.yml` - Driver config (Docker, geerlingguy images)
- `converge.yml` - Applies role with test data
- `verify.yml` - Validates:
  - MD5 hashes of key/csr/crt match
  - Certificate validity dates
  - System CA store integration for `install_ca_to_system` items
- `prepare.yml` - Shared prep playbook (installs dependencies via requirements.yml)

**Test Matrix** (see .github/workflows/ci.yml):
- Ansible versions: 6, 7, 8, 9 (cores 2.13-2.16)
- Distributions: ubuntu2004, ubuntu2204, debian11, debian12, rockylinux8, rockylinux9, fedora39

## Common Patterns & Conventions

### Commits

- Uses [Conventional Commits](https://www.conventionalcommits.org/)
- Enforced via commitlint pre-commit hook
- PR commits are squash-merged (casual contributors don't need to follow strictly)

### Pre-commit Hooks

Pre-commit.ci automatically runs and fixes issues on PRs. Key hooks:
- `yamllint` - YAML formatting (.yamllint config)
- `ansible-lint` - Ansible best practices (.ansible-lint config, skips `name` rule)
- `prettier` - Formats Markdown, JSON
- `black` - Python formatting
- `commitlint` - Conventional commit validation

### Task Naming

Per `.ansible-lint`, the `name` rule is skipped. See [ROLE_DEVELOPMENT_GUIDELINES.adoc](https://github.com/JonasPammer/cookiecutter-ansible-role/blob/master/ROLE_DEVELOPMENT_GUIDELINES.adoc#naming-tasks) for rationale.

## Key Files & Locations

### Role Files
- `tasks/main.yml` - Role entry point
- `tasks/assert.yml` - Variable validation
- `tasks/create.yml` - Certificate generation logic (looped per item)
- `defaults/main.yml` - User-configurable defaults
- `vars/main.yml` - OS-specific internal variables
- `handlers/main.yml` - Apache restart handler (fails gracefully if not found)
- `meta/main.yml` - Galaxy metadata (min Ansible 2.11, supported platforms)

### Testing Files
- `tox.ini` - Test orchestration across Ansible versions
- `.pre-commit-config.yaml` - Pre-commit hook definitions
- `.ansible-lint` - Ansible linting configuration
- `.yamllint` - YAML linting rules
- `molecule/default/` - Molecule test scenario
- `requirements.yml` - Role dependencies (jonaspammer.bootstrap, jonaspammer.pip)
- `requirements-dev.txt` - Python dev dependencies (cruft, pre-commit, tox)

### CI/CD
- `.github/workflows/ci.yml` - Main CI (lint + molecule across distros)
- `.github/workflows/release-to-galaxy.yml` - Auto-import to Galaxy on tag push
- `.github/workflows/gh-pages.yml` - Documentation generation
- `.github/workflows/issue-label-manager.yml` - Auto-label issues

## Important Constraints & Requirements

### System Requirements (for test host)
- Python 3.10+
- Docker (for Molecule tests)

### Runtime Requirements (for target hosts)
- Ansible controller must have `community.crypto` collection installed
- Target host needs pip >21 for cryptography installation
- Target host needs Rust compiler if `openssl_cryptography_build_rust: true`
- Target must support `become` (privilege escalation)

### Versioning
- Tags must NOT start with `v` (Galaxy requirement)
- Adheres to Semantic Versioning
- GitHub Release created manually by maintainer on tag push

## Dependencies

### Role Dependencies (requirements.yml)
This role has no hard dependencies (`dependencies: []` in meta/main.yml), but Molecule tests prepare hosts using:
- `jonaspammer.bootstrap` - Basic system setup
- `jonaspammer.pip` - Pip installation/upgrade

### Collection Dependencies
- `community.crypto` - Must be installed on Ansible controller
  - Used modules: `openssl_privatekey`, `openssl_csr`, `x509_certificate`, `openssl_pkcs12`, `x509_certificate_info`

## Troubleshooting Common Issues

### Cryptography Installation Failures
The role has fallback logic for cryptography installation:
1. First tries with `--prefer-binary` if `openssl_cryptography_prefer_binary: true`
2. Falls back to source build if binary installation fails
3. Respects `CRYPTOGRAPHY_DONT_BUILD_RUST` environment variable based on `openssl_cryptography_build_rust`

If tests fail with cryptography errors, check the target distro has build dependencies.

### CA Store Integration Not Working (RHEL)
On RHEL/Rocky, even after `update-ca-trust`, openssl may not recognize the cert. The role implements a workaround:
1. Gets the openssl hash of the certificate
2. Creates a symlink named `<hash>.0` in the certs directory
3. This makes openssl properly recognize the certificate

See tasks/create.yml:231-242 for implementation.

### Molecule Container Debugging
If tests fail:
1. Re-run with `MOLECULE_DESTROY=never`
2. Check `/var/tmp/vars.yml` and `/var/tmp/environment.yml` in the container
3. These files are also uploaded as GitHub CI artifacts
4. Use `docker exec -it <container> /bin/bash` to explore

## Documentation Standards

When modifying role variables in `defaults/main.yml`, also update `README.adoc` to keep documentation in sync (see comment at top of defaults/main.yml).
