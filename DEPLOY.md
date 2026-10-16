# 🚀 Quick Deploy Guide

## Fast Deploy to GitHub Pages

### Step 1: Enable GitHub Pages
1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under "Build and deployment", select **Source: GitHub Actions**

### Step 2: Push Your Code
```bash
git add .
git commit -m "Add GitHub Pages deployment"
git push origin main
```

### Step 3: Wait for Deployment
- GitHub Actions will automatically build and deploy
- Check progress in the **Actions** tab
- Your site will be live at: `https://<username>.github.io/<repo-name>/`

---

## Alternative: Manual Deploy

### macOS/Linux
```bash
chmod +x deploy.sh
./deploy.sh
```

### Windows
```bash
deploy.bat
```

---

## Need Help?

See the full [README.md](./README.md) for detailed instructions.
