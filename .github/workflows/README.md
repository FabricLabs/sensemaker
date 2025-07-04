# GitHub Actions Workflows

This directory contains CI/CD workflows for the Sensemaker project.

## Workflows

### `docker-build.yml` - Complete Build and Test
**Triggers:**
- Push to `main`, `master`, `develop`, or `feature/*` branches
- Pull requests to `main`, `master`, `develop`

**What it does:**
1. **Build Test**: Tests Docker build process
2. **Service Test**: Starts all services (app, MySQL, Redis, Ollama)
3. **Health Check**: Verifies services are responding
4. **Multi-platform Build**: Builds for AMD64 and ARM64 (main branch only)
5. **Container Registry**: Pushes images to GitHub Container Registry (main branch only)

### `test.yml` - Lightweight Testing
**Triggers:**
- Pull requests to `main`, `master`, `develop`
- Push to `feature/*` branches

**What it does:**
1. **Node.js Tests**: Runs npm lint and test (if available)
2. **Docker Build Test**: Verifies Docker build works
3. **Quick Service Test**: Basic startup verification

## Configuration

### Environment Variables
The workflows automatically generate test environment variables:
- `FABRIC_MNEMONIC`: Standard test mnemonic
- `MYSQL_PASSWORD`: Test database password
- `ADMIN_USERNAME/PASSWORD`: Test admin credentials
- `OLLAMA_MODELS_PATH`: Uses empty directory for testing

### Secrets Required
- `GITHUB_TOKEN`: Automatically provided by GitHub (for container registry)

## Usage

### For Contributors
- **Pull Requests**: Both workflows run automatically
- **Feature Branches**: Lightweight testing runs on push
- **Main Branch**: Full build and deploy pipeline runs

### For Maintainers
- **Container Images**: Available at `ghcr.io/[owner]/[repo]`
- **Build Status**: Check the Actions tab for build results
- **Debugging**: Workflow logs show detailed output for troubleshooting

## Customization

### Adding More Tests
Edit `test.yml` to add additional test steps:
```yaml
- name: Run custom tests
  run: |
    # Your test commands here
```

### Changing Triggers
Modify the `on:` section to change when workflows run:
```yaml
on:
  push:
    branches: [ your-branch ]
```

### Adding Secrets
Add repository secrets in GitHub Settings → Secrets and variables → Actions 