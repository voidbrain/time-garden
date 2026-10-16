# 🌿 Chrono Garden - 4D Time Navigation Game

A beautiful isometric 3D game built with Three.js, React, and Vite. Navigate through time to grow a tree and overcome obstacles!

## 🎮 Game Concept

Navigate through the 4th dimension (time) in addition to 3D space:
- Plant a seed near a wall
- Water it to start growth
- Use the time slider to age the tree through its lifecycle
- When the tree dies, wooden stairs appear
- Climb the stairs to pass the wall!

## 🎨 Features

- **Floating Island Diorama** - Beautiful isometric 3D scene with organic floating island
- **Tree Lifecycle** - Watch the tree grow from seed → sprout → flowering → adult → old & dead
- **Kawaii Character** - Cute animated character with idle animations
- **Brilliant Lighting** - Colorful point lights and soft shadows
- **Time Slider** - Interactive time control to flow through the tree's lifecycle
- **Responsive UI** - Modern glass-morphism interface with smooth animations

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Three.js** - 3D graphics engine
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📤 Deployment to GitHub Pages

### Option 1: Automatic Deployment (GitHub Actions)

This project includes a GitHub Actions workflow that automatically deploys to GitHub Pages when you push to the `main` or `master` branch.

**Setup:**
1. Go to your repository settings on GitHub
2. Navigate to **Settings > Pages**
3. Under "Build and deployment", select **Source: GitHub Actions**
4. Push your code to `main` or `master` branch
5. The workflow will automatically build and deploy your site

The site will be available at: `https://<your-username>.github.io/<repository-name>/`

### Option 2: Manual Deployment with gh-pages

**For macOS/Linux:**
```bash
# Make the script executable
chmod +x deploy.sh

# Run the deployment
./deploy.sh
```

**For Windows:**
```bash
# Run the deployment
deploy.bat
```

**Manual Steps:**
```bash
# Install gh-pages
npm install --save-dev gh-pages

# Get your repository name
REPO_NAME=$(git config --get remote.origin.url | sed -E 's/.*\/([^\/]+)(\.git)?$/\1/')

# Build with correct base path
npm run build -- --base /$REPO_NAME/

# Deploy to gh-pages branch
npx gh-pages -d dist -b gh-pages
```

### Option 3: Deploy to Custom Domain

If you want to use a custom domain:

1. Create a `CNAME` file in the `public/` folder with your domain:
   ```
   yourdomain.com
   ```

2. Update your DNS settings to point to GitHub Pages

3. Build without the repository name prefix:
   ```bash
   npm run build
   npx gh-pages -d dist -b gh-pages
   ```

## 🎯 How to Play

1. **Plant a Seed** - Click the "🌰 Plant" button to plant a seed near the wall
2. **Water It** - Click "💧 Water" to start the growth process
3. **Flow Through Time** - Drag the time slider to age the tree:
   - 🌰 Seed (0-20)
   - 🌱 Sprout (21-40)
   - 🌸 Flowering (41-60)
   - 🌳 Adult (61-80)
   - 🪵 Old & Dead (81-100)
4. **Climb the Wall** - When the tree dies, stairs appear! Click "🧗 Climb!" to win
5. **Reset** - Click "🔄" to start over

## 🎨 Visual Style

The game features a **floating island diorama** aesthetic with:
- Circular organic island with vibrant green grass
- Rocky underside that tapers dramatically
- Small pond with cascading waterfall
- Decorative trees, bushes, and colorful flowers
- Soft pastel blue gradient sky
- Fluffy clouds floating around
- Brilliant colorful lighting (pink, blue, yellow, purple, green)

## 📁 Project Structure

```
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions workflow
├── src/
│   ├── components/
│   │   └── ThreeScene.tsx      # Three.js 3D scene
│   ├── App.tsx                 # Main app component
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles
├── public/                     # Static assets
├── deploy.sh                   # Deployment script (Unix)
├── deploy.bat                  # Deployment script (Windows)
├── index.html                  # HTML template
├── package.json                # Dependencies
├── vite.config.ts              # Vite configuration
└── README.md                   # This file
```

## 🔧 Configuration

### Vite Configuration

The project uses Vite with the following setup:
- React plugin for JSX support
- Tailwind CSS integration
- TypeScript support

### GitHub Pages Base Path

When deploying to GitHub Pages, the base path must be set to your repository name:
```bash
vite build --base /your-repo-name/
```

The deployment scripts handle this automatically.

## 🐛 Troubleshooting

### Build fails with TypeScript errors
Make sure all dependencies are installed:
```bash
npm install
```

### GitHub Pages shows 404
- Verify the base path is set correctly in the build
- Check that GitHub Pages is enabled in repository settings
- Wait a few minutes for GitHub to publish the site

### 3D scene not rendering
- Check browser console for WebGL errors
- Ensure your browser supports WebGL
- Try a different browser or update graphics drivers

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Credits

Built with:
- [Three.js](https://threejs.org/) - 3D graphics library
- [React](https://reactjs.org/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

---

**Enjoy navigating through time in Chrono Garden!** 🌿⏰✨
