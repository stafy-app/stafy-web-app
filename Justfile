set windows-shell := ["powershell.exe", "-NoLogo", "-Command"]

# List available recipes
default:
    @just --list

# Start Vite dev server
dev:
    pnpm dev

# Type-check + production build
build:
    pnpm build

# Lint with eslint
lint:
    pnpm lint

# Preview production build
preview:
    pnpm preview

# Regenerate src/api/generated/ from ./openapi.json (run `just gen-api` from workspace root to also refresh openapi.json)
gen:
    pnpm run gen

# Install dependencies from lockfile
install:
    pnpm install

# Add a package: just add axios
add pkg:
    pnpm add {{ pkg }}

# Add a dev-only package: just add-dev @types/foo
add-dev pkg:
    pnpm add -D {{ pkg }}

# Remove a package: just remove axios
remove pkg:
    pnpm remove {{ pkg }}
