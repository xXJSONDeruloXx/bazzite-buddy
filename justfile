# Justfile for managing build tasks

# Install dependencies
install:
    pnpm install

# Clean build artifacts and temporary files
clean:
    sudo rm -rf dist/
    sudo rm -rf out/
    sudo rm -rf node_modules/.cache/
    sudo rm -rf .rollup.cache/
    echo "Cleaned build artifacts"

# Build the plugin
build:
    .vscode/build.sh

# Build in development mode with watch
dev:
    pnpm run watch

# Clean and rebuild everything
rebuild: clean install build
