import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

interface ThreeSceneProps {
  timeValue: number;
  treeStage: 'empty' | 'seed' | 'sprout' | 'flowering' | 'adult' | 'old';
  hasWater: boolean;
  showStairs: boolean;
  characterPos: { x: number; z: number };
}

export default function ThreeScene({ timeValue, treeStage, hasWater, showStairs, characterPos }: ThreeSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const treeGroupRef = useRef<THREE.Group | null>(null);
  const stairsGroupRef = useRef<THREE.Group | null>(null);
  const characterRef = useRef<THREE.Group | null>(null);
  const waterDropsRef = useRef<THREE.Group | null>(null);
  const frameRef = useRef<number>(0);
  const timeRef = useRef(timeValue);
  const stageRef = useRef(treeStage);
  const stairsRef = useRef(showStairs);
  const charPosRef = useRef(characterPos);
  const hasWaterRef = useRef(hasWater);

  timeRef.current = timeValue;
  stageRef.current = treeStage;
  stairsRef.current = showStairs;
  charPosRef.current = characterPos;
  hasWaterRef.current = hasWater;

  const createGround = useCallback((scene: THREE.Scene) => {
    // 16x16 grid base with colorful tiles
    const gridSize = 16;
    const tileSize = 1;
    
    const colors = [
      0x7ec850, 0x8bd45a, 0x6db844, 0x95de64,
      0x52c41a, 0xa9d96c, 0x73d13d, 0x4caf50
    ];

    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const geometry = new THREE.BoxGeometry(tileSize * 0.95, 0.3, tileSize * 0.95);
        const material = new THREE.MeshLambertMaterial({ color });
        const tile = new THREE.Mesh(geometry, material);
        tile.position.set(
          x * tileSize - (gridSize * tileSize) / 2 + tileSize / 2,
          -0.15,
          z * tileSize - (gridSize * tileSize) / 2 + tileSize / 2
        );
        tile.receiveShadow = true;
        scene.add(tile);
      }
    }

    // Add some small decorative elements (flowers, rocks)
    for (let i = 0; i < 20; i++) {
      const x = (Math.random() - 0.5) * 14;
      const z = (Math.random() - 0.5) * 14;
      
      if (Math.abs(x - 3) < 2 && Math.abs(z + 2) < 2) continue; // Keep area near tree clear
      
      if (Math.random() > 0.5) {
        // Small flower
        const flowerGroup = new THREE.Group();
        const stem = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 0.2),
          new THREE.MeshLambertMaterial({ color: 0x2d8a4e })
        );
        stem.position.y = 0.1;
        flowerGroup.add(stem);
        
        const petalColor = [0xff6b9d, 0xffd93d, 0xff8a5c, 0xc56cf0, 0x7efff5][Math.floor(Math.random() * 5)];
        const petal = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 6, 6),
          new THREE.MeshLambertMaterial({ color: petalColor })
        );
        petal.position.y = 0.22;
        flowerGroup.add(petal);
        
        flowerGroup.position.set(x, 0, z);
        scene.add(flowerGroup);
      } else {
        // Small rock
        const rock = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.1 + Math.random() * 0.1),
          new THREE.MeshLambertMaterial({ color: 0x95a5a6 })
        );
        rock.position.set(x, 0.05, z);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        rock.castShadow = true;
        scene.add(rock);
      }
    }
  }, []);

  const createWall = useCallback((scene: THREE.Scene) => {
    const wallGroup = new THREE.Group();
    
    // Main wall
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 4; y++) {
        const brickColor = y % 2 === 0 ? 0xe17055 : 0xd63031;
        const brick = new THREE.Mesh(
          new THREE.BoxGeometry(0.9, 0.5, 0.6),
          new THREE.MeshLambertMaterial({ color: brickColor })
        );
        brick.position.set(
          x * 0.95 - 4.5,
          y * 0.5 + 0.25,
          -3
        );
        brick.castShadow = true;
        brick.receiveShadow = true;
        wallGroup.add(brick);
      }
    }

    // Wall top decoration
    for (let x = 0; x < 10; x++) {
      const topPiece = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.15, 0.7),
        new THREE.MeshLambertMaterial({ color: 0xfdcb6e })
      );
      topPiece.position.set(x * 0.95 - 4.5, 2.1, -3);
      topPiece.castShadow = true;
      wallGroup.add(topPiece);
    }

    scene.add(wallGroup);
  }, []);

  const createTree = useCallback((scene: THREE.Scene) => {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(3, 0, -2);
    scene.add(treeGroup);
    treeGroupRef.current = treeGroup;
    return treeGroup;
  }, []);

  const updateTree = useCallback((treeGroup: THREE.Group, stage: string, time: number) => {
    // Clear previous tree
    while (treeGroup.children.length > 0) {
      const child = treeGroup.children[0];
      treeGroup.remove(child);
      if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
    }

    const growthFactor = (time % 25) / 25; // 0-1 within each stage

    switch (stage) {
      case 'seed': {
        // Small seed in the ground
        const seed = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 6, 6),
          new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        seed.position.y = 0.05;
        seed.scale.y = 0.6;
        treeGroup.add(seed);
        
        // Small dirt mound
        const mound = new THREE.Mesh(
          new THREE.SphereGeometry(0.25, 6, 4),
          new THREE.MeshLambertMaterial({ color: 0x5D4037 })
        );
        mound.position.y = -0.05;
        mound.scale.y = 0.3;
        treeGroup.add(mound);
        break;
      }
      case 'sprout': {
        // Tiny sprout
        const stem = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.05, 0.4 + growthFactor * 0.3),
          new THREE.MeshLambertMaterial({ color: 0x27ae60 })
        );
        stem.position.y = 0.2 + growthFactor * 0.15;
        treeGroup.add(stem);
        
        // Two small leaves
        const leaf1 = new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 5, 5),
          new THREE.MeshLambertMaterial({ color: 0x2ecc71 })
        );
        leaf1.position.set(0.1, 0.4 + growthFactor * 0.2, 0);
        leaf1.scale.set(1, 0.5, 0.7);
        treeGroup.add(leaf1);
        
        const leaf2 = new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 5, 5),
          new THREE.MeshLambertMaterial({ color: 0x2ecc71 })
        );
        leaf2.position.set(-0.1, 0.35 + growthFactor * 0.2, 0);
        leaf2.scale.set(1, 0.5, 0.7);
        treeGroup.add(leaf2);
        break;
      }
      case 'flowering': {
        // Young tree with flowers
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.12, 1.2),
          new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        trunk.position.y = 0.6;
        trunk.castShadow = true;
        treeGroup.add(trunk);
        
        // Canopy with flowers
        const canopy = new THREE.Mesh(
          new THREE.SphereGeometry(0.6, 8, 8),
          new THREE.MeshLambertMaterial({ color: 0x27ae60 })
        );
        canopy.position.y = 1.4;
        canopy.castShadow = true;
        treeGroup.add(canopy);
        
        // Flowers on tree
        const flowerColors = [0xff6b9d, 0xffd93d, 0xff8a5c, 0xc56cf0];
        for (let i = 0; i < 8; i++) {
          const flower = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 5, 5),
            new THREE.MeshLambertMaterial({ color: flowerColors[i % flowerColors.length] })
          );
          const angle = (i / 8) * Math.PI * 2;
          flower.position.set(
            Math.cos(angle) * 0.45,
            1.4 + Math.sin(angle * 2) * 0.2,
            Math.sin(angle) * 0.45
          );
          treeGroup.add(flower);
        }
        break;
      }
      case 'adult': {
        // Full grown tree
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.18, 2.0),
          new THREE.MeshLambertMaterial({ color: 0x6D4C41 })
        );
        trunk.position.y = 1.0;
        trunk.castShadow = true;
        treeGroup.add(trunk);
        
        // Branches
        for (let i = 0; i < 3; i++) {
          const branch = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.06, 0.6),
            new THREE.MeshLambertMaterial({ color: 0x5D4037 })
          );
          const angle = (i / 3) * Math.PI * 2;
          branch.position.set(Math.cos(angle) * 0.2, 1.5, Math.sin(angle) * 0.2);
          branch.rotation.z = Math.cos(angle) * 0.5;
          branch.rotation.x = Math.sin(angle) * 0.5;
          treeGroup.add(branch);
        }
        
        // Large canopy
        const canopy1 = new THREE.Mesh(
          new THREE.SphereGeometry(1.0, 8, 8),
          new THREE.MeshLambertMaterial({ color: 0x1e8449 })
        );
        canopy1.position.y = 2.2;
        canopy1.castShadow = true;
        treeGroup.add(canopy1);
        
        const canopy2 = new THREE.Mesh(
          new THREE.SphereGeometry(0.7, 8, 8),
          new THREE.MeshLambertMaterial({ color: 0x27ae60 })
        );
        canopy2.position.set(0.4, 2.5, 0.3);
        canopy2.castShadow = true;
        treeGroup.add(canopy2);
        
        const canopy3 = new THREE.Mesh(
          new THREE.SphereGeometry(0.6, 8, 8),
          new THREE.MeshLambertMaterial({ color: 0x229954 })
        );
        canopy3.position.set(-0.3, 2.4, -0.2);
        canopy3.castShadow = true;
        treeGroup.add(canopy3);
        break;
      }
      case 'old': {
        // Old dead tree
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.15, 0.22, 2.2),
          new THREE.MeshLambertMaterial({ color: 0x4a3728 })
        );
        trunk.position.y = 1.1;
        trunk.castShadow = true;
        treeGroup.add(trunk);
        
        // Bare branches
        const branchPositions = [
          { x: 0.3, y: 1.8, z: 0, rz: -0.6, rx: 0 },
          { x: -0.2, y: 2.0, z: 0.2, rz: 0.5, rx: -0.3 },
          { x: 0.1, y: 1.6, z: -0.3, rz: -0.3, rx: 0.5 },
          { x: -0.3, y: 1.5, z: -0.1, rz: 0.7, rx: 0.2 },
          { x: 0.2, y: 2.2, z: 0.1, rz: -0.4, rx: -0.2 },
        ];
        
        branchPositions.forEach(bp => {
          const branch = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.05, 0.8),
            new THREE.MeshLambertMaterial({ color: 0x3e2723 })
          );
          branch.position.set(bp.x, bp.y, bp.z);
          branch.rotation.set(bp.rx, 0, bp.rz);
          branch.castShadow = true;
          treeGroup.add(branch);
        });
        
        // Some dead leaves on ground
        for (let i = 0; i < 5; i++) {
          const leaf = new THREE.Mesh(
            new THREE.CircleGeometry(0.06, 5),
            new THREE.MeshLambertMaterial({ color: 0x8B6914, side: THREE.DoubleSide })
          );
          leaf.position.set(
            (Math.random() - 0.5) * 1.5,
            0.01,
            (Math.random() - 0.5) * 1.5
          );
          leaf.rotation.x = -Math.PI / 2 + Math.random() * 0.3;
          treeGroup.add(leaf);
        }
        
        // Mushrooms at base
        for (let i = 0; i < 3; i++) {
          const mushroomGroup = new THREE.Group();
          const mStem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.03, 0.1),
            new THREE.MeshLambertMaterial({ color: 0xf5f5dc })
          );
          mStem.position.y = 0.05;
          mushroomGroup.add(mStem);
          
          const mCap = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2),
            new THREE.MeshLambertMaterial({ color: 0xe74c3c })
          );
          mCap.position.y = 0.1;
          mushroomGroup.add(mCap);
          
          const angle = (i / 3) * Math.PI * 2 + 0.5;
          mushroomGroup.position.set(Math.cos(angle) * 0.25, 0, Math.sin(angle) * 0.25);
          treeGroup.add(mushroomGroup);
        }
        break;
      }
      default:
        break;
    }
  }, []);

  const createCharacter = useCallback((scene: THREE.Scene) => {
    const charGroup = new THREE.Group();
    
    // Body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.5, 0.3),
      new THREE.MeshLambertMaterial({ color: 0x74b9ff })
    );
    body.position.y = 0.55;
    body.castShadow = true;
    charGroup.add(body);
    
    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0xffeaa7 })
    );
    head.position.y = 1.0;
    head.castShadow = true;
    charGroup.add(head);
    
    // Eyes
    const eyeL = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 6, 6),
      new THREE.MeshLambertMaterial({ color: 0x2d3436 })
    );
    eyeL.position.set(-0.07, 1.02, 0.17);
    charGroup.add(eyeL);
    
    const eyeR = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 6, 6),
      new THREE.MeshLambertMaterial({ color: 0x2d3436 })
    );
    eyeR.position.set(0.07, 1.02, 0.17);
    charGroup.add(eyeR);
    
    // Cute blush
    const blushL = new THREE.Mesh(
      new THREE.CircleGeometry(0.04, 6),
      new THREE.MeshLambertMaterial({ color: 0xff7675, side: THREE.DoubleSide })
    );
    blushL.position.set(-0.13, 0.95, 0.18);
    blushL.rotation.y = -0.3;
    charGroup.add(blushL);
    
    const blushR = new THREE.Mesh(
      new THREE.CircleGeometry(0.04, 6),
      new THREE.MeshLambertMaterial({ color: 0xff7675, side: THREE.DoubleSide })
    );
    blushR.position.set(0.13, 0.95, 0.18);
    blushR.rotation.y = 0.3;
    charGroup.add(blushR);
    
    // Legs
    const legL = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.3, 0.12),
      new THREE.MeshLambertMaterial({ color: 0x0984e3 })
    );
    legL.position.set(-0.1, 0.15, 0);
    charGroup.add(legL);
    
    const legR = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.3, 0.12),
      new THREE.MeshLambertMaterial({ color: 0x0984e3 })
    );
    legR.position.set(0.1, 0.15, 0);
    charGroup.add(legR);
    
    // Arms
    const armL = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.35, 0.1),
      new THREE.MeshLambertMaterial({ color: 0x74b9ff })
    );
    armL.position.set(-0.28, 0.55, 0);
    charGroup.add(armL);
    
    const armR = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.35, 0.1),
      new THREE.MeshLambertMaterial({ color: 0x74b9ff })
    );
    armR.position.set(0.28, 0.55, 0);
    charGroup.add(armR);
    
    // Hat (cute pointy hat)
    const hat = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.25, 6),
      new THREE.MeshLambertMaterial({ color: 0xa29bfe })
    );
    hat.position.y = 1.25;
    hat.castShadow = true;
    charGroup.add(hat);
    
    charGroup.position.set(-5, 0, 2);
    scene.add(charGroup);
    characterRef.current = charGroup;
    return charGroup;
  }, []);

  const createStairs = useCallback((scene: THREE.Scene) => {
    const stairsGroup = new THREE.Group();
    stairsGroup.position.set(3, 0, -2);
    
    // Wooden stairs using the dead tree as support
    const woodColor = 0x8B6914;
    const darkWood = 0x6D4C41;
    
    // Vertical support posts
    const post1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 2.5, 0.15),
      new THREE.MeshLambertMaterial({ color: darkWood })
    );
    post1.position.set(-0.4, 1.25, 0.5);
    post1.castShadow = true;
    stairsGroup.add(post1);
    
    const post2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 2.5, 0.15),
      new THREE.MeshLambertMaterial({ color: darkWood })
    );
    post2.position.set(0.4, 1.25, 0.5);
    post2.castShadow = true;
    stairsGroup.add(post2);
    
    // Steps
    for (let i = 0; i < 5; i++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.1, 0.35),
        new THREE.MeshLambertMaterial({ color: woodColor })
      );
      step.position.set(0, 0.4 + i * 0.4, 0.5 - i * 0.15);
      step.castShadow = true;
      step.receiveShadow = true;
      stairsGroup.add(step);
    }
    
    // Railing
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.06, 1.5),
      new THREE.MeshLambertMaterial({ color: darkWood })
    );
    rail.position.set(-0.4, 2.2, 0.0);
    rail.rotation.x = 0.3;
    stairsGroup.add(rail);
    
    const rail2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.06, 1.5),
      new THREE.MeshLambertMaterial({ color: darkWood })
    );
    rail2.position.set(0.4, 2.2, 0.0);
    rail2.rotation.x = 0.3;
    stairsGroup.add(rail2);
    
    stairsGroup.visible = false;
    scene.add(stairsGroup);
    stairsGroupRef.current = stairsGroup;
  }, []);

  const createWaterDrops = useCallback((scene: THREE.Scene) => {
    const waterGroup = new THREE.Group();
    waterGroup.position.set(3, 1.5, -2);
    waterGroup.visible = false;
    
    for (let i = 0; i < 8; i++) {
      const drop = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 6, 6),
        new THREE.MeshLambertMaterial({ color: 0x74b9ff, transparent: true, opacity: 0.8 })
      );
      drop.position.set(
        (Math.random() - 0.5) * 0.5,
        Math.random() * 0.5,
        (Math.random() - 0.5) * 0.5
      );
      waterGroup.add(drop);
    }
    
    scene.add(waterGroup);
    waterDropsRef.current = waterGroup;
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 20, 40);
    sceneRef.current = scene;

    // Isometric-style camera
    const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(12, 10, 12);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting - brilliant and colorful
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff3e0, 1.2);
    sunLight.position.set(8, 12, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -15;
    sunLight.shadow.camera.right = 15;
    sunLight.shadow.camera.top = 15;
    sunLight.shadow.camera.bottom = -15;
    scene.add(sunLight);

    // Colored fill lights for kawaii feel
    const pinkLight = new THREE.PointLight(0xff6b9d, 0.5, 15);
    pinkLight.position.set(-5, 3, 5);
    scene.add(pinkLight);

    const blueLight = new THREE.PointLight(0x74b9ff, 0.4, 15);
    blueLight.position.set(5, 3, 5);
    scene.add(blueLight);

    const yellowLight = new THREE.PointLight(0xffd93d, 0.3, 12);
    yellowLight.position.set(0, 5, -5);
    scene.add(yellowLight);

    const purpleLight = new THREE.PointLight(0xa29bfe, 0.3, 10);
    purpleLight.position.set(-3, 2, -3);
    scene.add(purpleLight);

    // Hemisphere light for nice ambient
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x7ec850, 0.3);
    scene.add(hemiLight);

    // Create scene elements
    createGround(scene);
    createWall(scene);
    const treeGroup = createTree(scene);
    createCharacter(scene);
    createStairs(scene);
    createWaterDrops(scene);

    // Initial tree state
    updateTree(treeGroup, 'empty', 0);

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      const time = Date.now() * 0.001;
      
      // Animate water drops
      if (waterDropsRef.current && waterDropsRef.current.visible) {
        waterDropsRef.current.children.forEach((drop: THREE.Object3D, i: number) => {
          drop.position.y -= 0.02;
          if (drop.position.y < -1.5) {
            drop.position.y = 0.5;
            drop.position.x = (Math.random() - 0.5) * 0.5;
            drop.position.z = (Math.random() - 0.5) * 0.5;
          }
          drop.scale.setScalar(1 + Math.sin(time * 3 + i) * 0.2);
        });
      }

      // Character idle animation
      if (characterRef.current) {
        characterRef.current.position.y = Math.sin(time * 2) * 0.05;
        // Slight rotation to face tree
        characterRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
      }

      // Gentle camera sway
      camera.position.x = 12 + Math.sin(time * 0.2) * 0.3;
      camera.position.y = 10 + Math.sin(time * 0.15) * 0.2;
      camera.lookAt(0, 1, 0);

      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameRef.current);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [createGround, createWall, createTree, createCharacter, createStairs, createWaterDrops, updateTree]);

  // Update tree when stage changes
  useEffect(() => {
    if (treeGroupRef.current) {
      updateTree(treeGroupRef.current, treeStage, timeValue);
    }
  }, [treeStage, timeValue, updateTree]);

  // Update stairs visibility
  useEffect(() => {
    if (stairsGroupRef.current) {
      stairsGroupRef.current.visible = showStairs;
    }
  }, [showStairs]);

  // Update water drops
  useEffect(() => {
    if (waterDropsRef.current) {
      waterDropsRef.current.visible = hasWater;
      if (hasWater) {
        // Reset drop positions
        waterDropsRef.current.children.forEach((drop: THREE.Object3D) => {
          drop.position.y = Math.random() * 1.5;
        });
      }
    }
  }, [hasWater]);

  // Update character position
  useEffect(() => {
    if (characterRef.current) {
      characterRef.current.position.x = characterPos.x;
      characterRef.current.position.z = characterPos.z;
    }
  }, [characterPos]);

  return <div ref={mountRef} className="absolute inset-0" />;
}
