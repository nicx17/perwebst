#!/bin/bash
set -e

# Define color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function step() {
    echo -e "\n${BLUE}==> $1${NC}"
}

function success() {
    echo -e "${GREEN}✓ $1${NC}"
}

function warn() {
    echo -e "${YELLOW}! $1${NC}"
}

# --- NVM Support ---
step "Checking Node Version (nvm)..."
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    source "$NVM_DIR/nvm.sh"
    if [ -f .nvmrc ]; then
        nvm use || nvm install
    else
        warn "No .nvmrc found. Skipping nvm use."
    fi
else
    warn "NVM not found in $HOME/.nvm. Using system Node."
fi
success "Using Node $(node -v)"
# -------------------

# --- NPX Upgrades (Aggressive) ---
step "Applying Major Version Updates (npm-check-updates)..."
npx npm-check-updates -u -x typescript
npm install
success "Dependencies aggressively updated."

step "Running Astro Upgrades..."
npx @astrojs/upgrade -y
success "Astro upgraded."
# -------------------

step "Running npm audit fix to resolve vulnerabilities..."
npm audit fix || true
success "Audit complete."

step "Formatting code (Prettier)..."
npm run format
success "Code formatted."

step "Linting code (ESLint)..."
npm run lint
success "Linting passed."

step "Type checking (TypeScript & Astro)..."
npm run check
success "Type check passed."

step "Running unit tests (Vitest)..."
npm run test
success "Tests passed."

step "Verifying production build (Astro)..."
npm run build
success "Build completed successfully."

echo -e "\n${GREEN}🎉 All major updates, formatting, linting, tests, and build checks passed successfully!${NC}"
