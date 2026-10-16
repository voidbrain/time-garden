#!/bin/bash

# Deploy script for GitHub Pages
# This script builds and deploys the Vite project to GitHub Pages

set -e

echo "🚀 Starting deployment to GitHub Pages..."

# Get repository name for base path
REPO_NAME=$(git config --get remote.origin.url | sed -E 's/.*\/([^\/]+)(\.git)?$/\1/')
echo "📦 Repository: $REPO_NAME"

# Install gh-pages if not already installed
if ! npm list gh-pages > /dev/null 2>&1; then
  echo "📥 Installing gh-pages..."
  npm install --save-dev gh-pages
fi

# Build with correct base path
echo "🔨 Building project with base path: /$REPO_NAME/"
npm run build -- --base /$REPO_NAME/

# Deploy to gh-pages branch
echo "📤 Deploying to GitHub Pages..."
npx gh-pages -d dist -b gh-pages

echo "✅ Deployment complete!"
echo "🌐 Your site will be available at: https://$(git config --get remote.origin.url | sed -E 's/.*github\.com[:\/]([^\/]+)\/.*/\1/').github.io/$REPO_NAME/"
echo ""
echo "⏳ Note: It may take a few minutes for GitHub Pages to publish your site."
