@echo off
REM Deploy script for GitHub Pages (Windows)
REM This script builds and deploys the Vite project to GitHub Pages

echo 🚀 Starting deployment to GitHub Pages...

REM Get repository name for base path
for /f "tokens=*" %%i in ('git config --get remote.origin.url') do set REPO_URL=%%i
for /f "tokens=2 delims=/" %%a in ("%REPO_URL%") do set REPO_NAME=%%a
set REPO_NAME=%REPO_NAME:.git=%
echo 📦 Repository: %REPO_NAME%

REM Install gh-pages if not already installed
npm list gh-pages >nul 2>&1
if errorlevel 1 (
  echo 📥 Installing gh-pages...
  call npm install --save-dev gh-pages
)

REM Build with correct base path
echo 🔨 Building project with base path: /%REPO_NAME%/
call npm run build -- --base /%REPO_NAME%/

REM Deploy to gh-pages branch
echo 📤 Deploying to GitHub Pages...
call npx gh-pages -d dist -b gh-pages

echo ✅ Deployment complete!
echo.
echo ⏳ Note: It may take a few minutes for GitHub Pages to publish your site.
pause
