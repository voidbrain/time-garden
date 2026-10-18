// ============================================================================
// ISOGARDEN — 8-bit isometric renderer (Three.js, pixel-art textures)
// 12x12 board painted into one big nearest-filtered canvas texture +
// billboarded sprites for hero / spinger / seedbag / goal / wall / tree.
// ============================================================================
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { TILE, paintScaled, spriteTexture, GRASS_A, GRASS_B, PATH_TILE, TUFT, FLOWER_R, FLOWER_Y, SPINGER, SEEDBAG, GOAL, DEADTREE, STAIRS, WALLSEG, HERO_IDLE, HERO_WALK, DROP, SPARK, T_SEED, T_SPROUT, T_YOUNG, T_BIG, T_STAIRS } from './pixel';
import { N, buildBoard, START, SPINGER_POS, SEEDBAG_POS, PLANT_POS, GOAL_POS, WALL_X, WALL_ROW_Y, type GameState, type TreeStatus } from './logic';

const HALF = (N - 1) / 2;
const wx = (x: number) => x - HALF;
const wy = (y: number) => y - HALF;

export interface IsoProps {
  state: GameState;
  onTick?: () => void;
}

interface SceneRefs {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;
  hero: THREE.Mesh;
  heroIdleMat: THREE.MeshBasicMaterial;
  heroWalkMat: THREE.MeshBasicMaterial;
  spinner: THREE.Mesh;
  spinnerShadow: THREE.Mesh;
  seedbag: THREE.Mesh;
  goal: THREE.Mesh;
  wallGroup: THREE.Group;
  stairs: THREE.Mesh;
  treeGroup: THREE.Group;
  treeBillboards: Record<string, THREE.Mesh>;
  waterFx: THREE.Points;
  sparks: THREE.Points;
  dropTex: THREE.Texture;
  sparkTex: THREE.Texture;
  raf: number;
}

function makeGroundTexture(): THREE.CanvasTexture {
  const size = N * TILE;
  const cv = document.createElement('canvas');
  cv.width = size; cv.height = size;
  const ctx = cv.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  // base grass checker
  const board = buildBoard();
  for (let gy = 0; gy < N; gy++) {
    for (let gx = 0; gx < N; gx++) {
      const px = gx * TILE, py = gy * TILE;
      if (board[gy][gx] === 'path') {
        paintScaled(ctx, PATH_TILE, px, py, 1, 1);
      } else {
        paintScaled(ctx, (gx + gy) % 2 === 0 ? GRASS_A : GRASS_B, px, py, 1, 1);
      }
    }
  }
  // deterministic decorations on grass
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let gy = 0; gy < N; gy++) {
    for (let gx = 0; gx < N; gx++) {
      if (board[gy][gx] !== 'grass' || rnd() > 0.32) continue;
      const r = rnd();
      const def = r < 0.55 ? TUFT : r < 0.78 ? FLOWER_R : FLOWER_Y;
      const off = Math.floor(rnd() * 5);
      paintScaled(ctx, def, gx * TILE + off, gy * TILE + off, 0.5, 0.5);
    }
  }
  // soil patch at planting spot
  const sx = PLANT_POS.x * TILE, sy = PLANT_POS.y * TILE;
  ctx.fillStyle = '#4d2f16';
  ctx.fillRect(sx + 3, sy + 3, TILE - 6, TILE - 6);
  ctx.fillStyle = '#331e0e';
  for (let i = 0; i < 5; i++) ctx.fillRect(sx + 5 + i * 4, sy + 8 + (i % 2) * 6, 3, 3);
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(sx + 3, sy + 3, TILE - 6, 2);
  ctx.fillRect(sx + 3, sy + TILE - 5, TILE - 6, 2);

  const tex = new THREE.CanvasTexture(cv);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function billboard(tex: THREE.Texture, wUnits: number, hUnits: number): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(wUnits, hUnits), mat);
  return mesh;
}

export default function IsoGarden({ state }: IsoProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const refs = useRef<SceneRefs | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // ------------------------------------------------------------------ setup
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || refs.current) return;

    const scene = new THREE.Scene();

    // ---- 8-bit sky : vertical gradient canvas, screen-space backdrop quad
    {
      const cv = document.createElement('canvas');
      cv.width = 4; cv.height = 128;
      const ctx = cv.getContext('2d')!;
      const grad = ctx.createLinearGradient(0, 0, 0, 128);
      grad.addColorStop(0.0, '#4fa8f0');
      grad.addColorStop(0.55, '#9adcff');
      grad.addColorStop(0.78, '#cdefff');
      grad.addColorStop(1.0, '#ffe9a8');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 4, 128);
      // chunky pixel sun top-left
      ctx.fillStyle = '#ffd94a'; ctx.fillRect(0, 14, 2, 8);
      ctx.fillStyle = '#fff3ae'; ctx.fillRect(0, 16, 1, 6);
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      const quad = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.MeshBasicMaterial({ map: tex, depthWrite: false, depthTest: false })
      );
      quad.frustumCulled = false;
      quad.renderOrder = -100;
      quad.onBeforeRender = () => {};
      scene.add(quad);
      (scene as any).__skyQuad = quad;
    }

    // orthographic isometric camera
    const aspect = mount.clientWidth / mount.clientHeight;
    const view = 9;
    const camera = new THREE.OrthographicCamera(-view * aspect, view * aspect, view, -view, -50, 100);
    camera.position.set(14, 16, 14);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.max(1, Math.floor(window.devicePixelRatio)));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.imageRendering = 'pixelated';

    // ---- ground. rotate Z first so canvas column x -> world +X and canvas
    // row y -> world +Z (which is screen down-left); then lay it flat.
    const groundTex = makeGroundTexture();
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(N, N),
      new THREE.MeshBasicMaterial({ map: groundTex })
    );
    ground.rotation.order = 'ZYX';
    ground.rotation.z = Math.PI / 2;
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // dark rim around the board (floating-world feel)
    const rim = new THREE.Mesh(
      new THREE.PlaneGeometry(N + 0.6, N + 0.6),
      new THREE.MeshBasicMaterial({ color: 0x123c1e })
    );
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = -0.05;
    scene.add(rim);

    // WATER SPINGER ---------------------------------------------------------
    const spinner = billboard(spriteTexture(SPINGER, 6), 1.4, 1.4);
    spinner.position.set(wx(SPINGER_POS.x), 0.7, wy(SPINGER_POS.y));
    scene.add(spinner);
    const spinnerShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.55, 8),
      new THREE.MeshBasicMaterial({ color: 0x0d2f16, transparent: true, opacity: 0.45 })
    );
    spinnerShadow.rotation.x = -Math.PI / 2;
    spinnerShadow.position.set(wx(SPINGER_POS.x), 0.012, wy(SPINGER_POS.y));
    scene.add(spinnerShadow);

    // BAG OF SEEDS ----------------------------------------------------------
    const seedbag = billboard(spriteTexture(SEEDBAG, 6), 1.1, 1.1);
    seedbag.position.set(wx(SEEDBAG_POS.x), 0.55, wy(SEEDBAG_POS.y));
    scene.add(seedbag);

    // GOAL PORTAL -----------------------------------------------------------
    const goal = billboard(spriteTexture(GOAL, 6), 1.3, 1.3);
    goal.position.set(wx(GOAL_POS.x), 0.65, wy(GOAL_POS.y));
    scene.add(goal);

    // WALL : two tall brick towers flanking the path at (9..10, row 10) -----
    const wallGroup = new THREE.Group();
    const wallTex = spriteTexture(WALLSEG, 6);
    for (const [gx, gz, s] of [
      [wx(WALL_X) - 0.62, wy(WALL_ROW_Y), 1],
      [wx(WALL_X) + 0.62, wy(WALL_ROW_Y) + 0.0, 1],
    ] as [number, number, number][]) {
      const m = billboard(wallTex, 1.15 * s, 1.75 * s);
      m.position.set(gx, 0.87, gz);
      wallGroup.add(m);
    }
    scene.add(wallGroup);

    // STAIRS leaning on the wall (only when stairsReady) ---------------------
    const stairs = billboard(spriteTexture(STAIRS, 6), 1.2, 1.8);
    stairs.position.set(wx(WALL_X) - 0.1, 0.9, wy(WALL_ROW_Y) - 0.42);
    stairs.visible = false;
    scene.add(stairs);

    // TREE group ------------------------------------------------------------
    const treeGroup = new THREE.Group();
    treeGroup.position.set(wx(PLANT_POS.x), 0, wy(PLANT_POS.y));
    scene.add(treeGroup);
    const treeBillboards: Record<string, THREE.Mesh> = {};
    const addTreeBB = (key: string, def: { w: number; h: number; rows: string[] }, hUnits: number) => {
      const bb = billboard(spriteTexture(def, 5), 1.1, hUnits);
      bb.position.y = hUnits / 2;
      bb.visible = false;
      treeGroup.add(bb);
      treeBillboards[key] = bb;
    };
    addTreeBB('seed', T_SEED, 0.55);
    addTreeBB('sprout', T_SPROUT, 0.7);
    addTreeBB('young', T_YOUNG, 1.1);
    addTreeBB('big', T_BIG, 1.7);
    addTreeBB('stairs', T_STAIRS, 1.7);
    addTreeBB('dead', DEADTREE, 1.7);
    addTreeBB('stunted', T_YOUNG, 0.62);

    // HERO ------------------------------------------------------------------
    const heroIdleMat = new THREE.MeshBasicMaterial({ map: spriteTexture(HERO_IDLE, 6), transparent: true, alphaTest: 0.35, side: THREE.DoubleSide });
    const heroWalkMat = new THREE.MeshBasicMaterial({ map: spriteTexture(HERO_WALK, 6), transparent: true, alphaTest: 0.35, side: THREE.DoubleSide });
    const hero = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), heroIdleMat);
    hero.position.set(wx(START.x), 0.46, wy(START.y));
    scene.add(hero);
    const heroShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.3, 8),
      new THREE.MeshBasicMaterial({ color: 0x0d2f16, transparent: true, opacity: 0.5 })
    );
    heroShadow.rotation.x = -Math.PI / 2;
    heroShadow.position.set(wx(START.x), 0.013, wy(START.y));
    scene.add(heroShadow);

    // PARTICLES : water drops + sparks ---------------------------------------
    const mkPts = (tex: THREE.Texture, n: number, color: number) => {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 1.2;
        pos[i * 3 + 1] = Math.random() * 1.6;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({ map: tex, color, size: 0.22, transparent: true, depthWrite: false, sizeAttenuation: true });
      const pts = new THREE.Points(geo, mat);
      pts.visible = false;
      scene.add(pts);
      return pts;
    };
    const dropTex = spriteTexture(DROP, 4);
    const sparkTex = spriteTexture(SPARK, 4);
    const waterFx = mkPts(dropTex, 26, 0xffffff);
    const sparks = mkPts(sparkTex, 18, 0xffffb0);

    // animated clouds: chunky white planes drifting way above
    const cloudTex = spriteTexture({ w: 12, h: 6, rows: ['....wwww....', '..wWWWWWWw..', '.WWUUUUUUWW.', 'WWUUUUUUUUWW', '.WWUUUUUUWW.', '..wwwwww....'] }, 8);
    const clouds: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const c = billboard(cloudTex, 3.4, 1.7);
      (c.material as THREE.MeshBasicMaterial).opacity = 0.95;
      (c.material as THREE.MeshBasicMaterial).transparent = true;
      (c.material as THREE.MeshBasicMaterial).color.set(i % 2 ? 0xdfffe8 : 0xffffff);
      c.position.set(-8 + i * 5, 7 + (i % 2), -6 + i * 4);
      scene.add(c);
      clouds.push(c);
    }

    // attach sky quad to camera so it always fills the screen
    const skyQuad = (scene as any).__skyQuad as THREE.Mesh;
    if (skyQuad) {
      scene.remove(skyQuad);
      (skyQuad.material as THREE.Material).depthTest = false;
      skyQuad.position.set(0, 0, -20);
      skyQuad.scale.set(80, 45, 1);
      camera.add(skyQuad);
      scene.add(camera);
    }

    let raf = 0;
    let lastMoveKey = '';
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = performance.now() * 0.001;
      const s = stateRef.current;

      // hero follows logical tile with smooth glide
      const tx = wx(s.pos.x), ty = wy(s.pos.y);
      hero.position.x += (tx - hero.position.x) * 0.28;
      hero.position.z += (ty - hero.position.z) * 0.28;
      const moving = Math.abs(tx - hero.position.x) + Math.abs(ty - hero.position.z) > 0.04;
      const key = `${s.pos.x},${s.pos.y}`;
      const justMoved = key !== lastMoveKey;
      if (justMoved) lastMoveKey = key;
      hero.material = moving || justMoved ? heroWalkMat : heroIdleMat;
      hero.position.y = 0.46 + Math.sin(t * 3) * 0.02;
      heroShadow.position.x = hero.position.x;
      heroShadow.position.z = hero.position.z;
      // keep sprites facing camera (billboard)
      hero.quaternion.copy(camera.quaternion);
      spinner.quaternion.copy(camera.quaternion);
      seedbag.quaternion.copy(camera.quaternion);
      goal.quaternion.copy(camera.quaternion);
      stairs.quaternion.copy(camera.quaternion);
      for (const k in treeBillboards) treeBillboards[k].quaternion.copy(camera.quaternion);

      // bobbing pickups
      seedbag.position.y = 0.55 + Math.sin(t * 2.4) * 0.06;
      seedbag.visible = !s.hasSeeds;
      goal.position.y = 0.65 + Math.sin(t * 1.8) * 0.05;

      // wall fades once crossed
      wallGroup.children.forEach((ch) => {
        const m = ch as THREE.Mesh;
        const mat = m.material as THREE.MeshBasicMaterial;
        mat.opacity = s.crossedWall ? 0.25 : 1;
        mat.transparent = true;
      });

      // stairs visibility
      stairs.visible = s.stairsReady;

      // tree stage selection
      const age = s.plantedAt !== null ? s.time - s.plantedAt : 0;
      const show = (k: string, v: boolean) => { treeBillboards[k].visible = v; };
      Object.keys(treeBillboards).forEach(k => show(k, false));
      switch (s.tree as TreeStatus) {
        case 'none': break;
        case 'seedling': show('seed', true); break;
        case 'growing': show(age >= 30 ? 'big' : age >= 15 ? 'young' : 'sprout', true); break;
        case 'grown': show(s.stairsReady ? 'stairs' : 'big', true); break;
        case 'stunted': show('stunted', true); break;
        case 'dead': show('dead', true); break;
      }

      // water fx
      const now = Date.now();
      const watering = now < s.waterFxUntil;
      waterFx.visible = watering;
      if (watering) {
        waterFx.position.set(wx(PLANT_POS.x), 0.2, wy(PLANT_POS.y));
        const attr = waterFx.geometry.getAttribute('position') as THREE.BufferAttribute;
        for (let i = 0; i < attr.count; i++) {
          let y = attr.getY(i) - 0.035;
          if (y < 0) y = 1.6;
          attr.setY(i, y);
        }
        attr.needsUpdate = true;
      }
      // sparkle fx near tree when grown/stairs
      const magic = s.stairsReady || s.crossedWall;
      sparks.visible = magic;
      if (magic) {
        sparks.position.set(wx(PLANT_POS.x), 0.4, wy(PLANT_POS.y));
        const attr = sparks.geometry.getAttribute('position') as THREE.BufferAttribute;
        for (let i = 0; i < attr.count; i++) {
          let y = attr.getY(i) + 0.012;
          if (y > 2.2) y = 0.1;
          attr.setY(i, y);
          attr.setX(i, Math.sin(t * 2 + i) * 0.7);
        }
        attr.needsUpdate = true;
      }

      // clouds drift
      clouds.forEach((c, i) => {
        c.position.x += 0.004 * (1 + i * 0.2);
        if (c.position.x > 12) c.position.x = -12;
        c.quaternion.copy(camera.quaternion);
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mount) return;
      const a = mount.clientWidth / mount.clientHeight;
      camera.left = -view * a; camera.right = view * a;
      camera.top = view; camera.bottom = -view;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    refs.current = {
      scene, camera, renderer, hero, heroIdleMat, heroWalkMat, spinner, spinnerShadow,
      seedbag, goal, wallGroup, stairs, treeGroup, treeBillboards, waterFx, sparks,
      dropTex, sparkTex, raf,
    };
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(raf);
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
      refs.current = null;
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0" />;
}
