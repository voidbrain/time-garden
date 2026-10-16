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

  const createGround = useCallback((scene: THREE.Scene) => {
    // 4x4 base - floating island style
    const gridSize = 4;
    const tileSize = 2;
    const totalSize = gridSize * tileSize;
    
    // Vibrant green palette
    const colors = [
      0x4CAF50,
      0x66BB6A,
      0x43A047,
      0x81C784,
    ];

    // Floating island base - layered for depth
    // Top dirt layer
    const dirtTop = new THREE.Mesh(
      new THREE.BoxGeometry(totalSize + 0.3, 0.4, totalSize + 0.3),
      new THREE.MeshStandardMaterial({ 
        color: 0x8B6914,
        roughness: 0.9
      })
    );
    dirtTop.position.y = -0.2;
    dirtTop.receiveShadow = true;
    dirtTop.castShadow = true;
    scene.add(dirtTop);

    // Bottom rock layer (tapered)
    const rockBottom = new THREE.Mesh(
      new THREE.BoxGeometry(totalSize - 0.5, 0.6, totalSize - 0.5),
      new THREE.MeshStandardMaterial({ 
        color: 0x6B4423,
        roughness: 0.95
      })
    );
    rockBottom.position.y = -0.7;
    rockBottom.castShadow = true;
    scene.add(rockBottom);
    
    // Bottom tip
    const rockTip = new THREE.Mesh(
      new THREE.ConeGeometry(2, 1.5, 6),
      new THREE.MeshStandardMaterial({ 
        color: 0x5C3317,
        roughness: 1.0
      })
    );
    rockTip.position.y = -1.75;
    rockTip.rotation.y = Math.PI / 6;
    scene.add(rockTip);

    // Grass tiles with slight height variation
    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const color = colors[(x + z) % colors.length];
        const heightVar = Math.random() * 0.05;
        const geometry = new THREE.BoxGeometry(tileSize * 0.97, 0.2 + heightVar, tileSize * 0.97);
        const material = new THREE.MeshStandardMaterial({ 
          color,
          roughness: 0.7,
          metalness: 0.0
        });
        const tile = new THREE.Mesh(geometry, material);
        tile.position.set(
          x * tileSize - (gridSize * tileSize) / 2 + tileSize / 2,
          0.1 + heightVar / 2,
          z * tileSize - (gridSize * tileSize) / 2 + tileSize / 2
        );
        tile.receiveShadow = true;
        scene.add(tile);
      }
    }

    // Cute decorative elements - flowers
    const flowerPositions = [
      { x: -3, z: 3 },
      { x: 3, z: -0.5 },
      { x: -3, z: -3 },
      { x: 3, z: 3 },
      { x: -1, z: 3 },
    ];

    flowerPositions.forEach((pos, idx) => {
      const flowerGroup = new THREE.Group();
      
      // Stem
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.04, 0.35),
        new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.7 })
      );
      stem.position.y = 0.25;
      flowerGroup.add(stem);
      
      // Leaf on stem
      const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 6, 6),
        new THREE.MeshStandardMaterial({ color: 0x32CD32, roughness: 0.5 })
      );
      leaf.position.set(0.06, 0.2, 0);
      leaf.scale.set(1.5, 0.5, 1);
      flowerGroup.add(leaf);
      
      // Flower head
      const petalColors = [0xFF69B4, 0xFFD700, 0xFF6347, 0xDA70D6, 0x87CEEB];
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        new THREE.MeshStandardMaterial({ 
          color: petalColors[idx % petalColors.length],
          roughness: 0.4,
          emissive: petalColors[idx % petalColors.length],
          emissiveIntensity: 0.2
        })
      );
      flower.position.y = 0.45;
      flower.scale.y = 0.7;
      flowerGroup.add(flower);
      
      // Center
      const center = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 6, 6),
        new THREE.MeshStandardMaterial({ 
          color: 0xFFFF00, 
          roughness: 0.3,
          emissive: 0xFFFF00,
          emissiveIntensity: 0.3
        })
      );
      center.position.y = 0.48;
      flowerGroup.add(center);
      
      flowerGroup.position.set(pos.x, 0.2, pos.z);
      scene.add(flowerGroup);
    });

    // Small grass tufts
    for (let i = 0; i < 12; i++) {
      const tuft = new THREE.Mesh(
        new THREE.ConeGeometry(0.05, 0.15, 4),
        new THREE.MeshStandardMaterial({ 
          color: 0x4CAF50,
          roughness: 0.7
        })
      );
      tuft.position.set(
        (Math.random() - 0.5) * 7,
        0.27,
        (Math.random() - 0.5) * 7
      );
      scene.add(tuft);
    }

    // Cute stone path
    const pathStones = [
      { x: -3, z: 0 },
      { x: -2, z: 0 },
      { x: -1, z: -0.5 },
      { x: 0, z: -1 },
      { x: 1, z: -1.5 },
    ];
    
    pathStones.forEach(pos => {
      const stone = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.3, 0.08, 8),
        new THREE.MeshStandardMaterial({ 
          color: 0xD2B48C,
          roughness: 0.8
        })
      );
      stone.position.set(pos.x, 0.24, pos.z);
      stone.receiveShadow = true;
      scene.add(stone);
    });
  }, []);

  const createWall = useCallback((scene: THREE.Scene) => {
    const wallGroup = new THREE.Group();
    
    // Cute colorful wall
    const wallWidth = 6;
    const wallHeight = 2.5;
    
    // Main wall body - warm terracotta
    const wallGeometry = new THREE.BoxGeometry(wallWidth, wallHeight, 0.8);
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xE8967A,
      roughness: 0.6,
      metalness: 0.05
    });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(0, wallHeight / 2 + 0.2, -2.5);
    wall.castShadow = true;
    wall.receiveShadow = true;
    wallGroup.add(wall);

    // Wall top decoration - golden
    const topGeometry = new THREE.BoxGeometry(wallWidth + 0.3, 0.35, 1.1);
    const topMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFD700,
      roughness: 0.4,
      metalness: 0.2,
      emissive: 0xFFD700,
      emissiveIntensity: 0.1
    });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.set(0, wallHeight + 0.38, -2.5);
    top.castShadow = true;
    wallGroup.add(top);

    // Cute brick pattern
    const brickColors = [0xE57373, 0xEF5350, 0xF44336, 0xE8967A];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 8; col++) {
        const brick = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 0.45, 0.1),
          new THREE.MeshStandardMaterial({ 
            color: brickColors[(row + col) % brickColors.length],
            roughness: 0.7
          })
        );
        const offsetX = row % 2 === 0 ? 0 : 0.35;
        brick.position.set(
          col * 0.75 - wallWidth / 2 + 0.4 + offsetX,
          row * 0.5 + 0.45,
          -2.05
        );
        wallGroup.add(brick);
      }
    }

    // Decorative gems on wall
    const gemColors = [0xFF69B4, 0x00BFFF, 0xFFD700, 0x32CD32];
    for (let i = 0; i < 4; i++) {
      const gem = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.12, 0),
        new THREE.MeshStandardMaterial({ 
          color: gemColors[i],
          roughness: 0.2,
          metalness: 0.3,
          emissive: gemColors[i],
          emissiveIntensity: 0.4
        })
      );
      gem.position.set(
        (i - 1.5) * 1.5,
        wallHeight + 0.6,
        -2.5
      );
      gem.rotation.y = Math.PI / 4;
      wallGroup.add(gem);
    }

    scene.add(wallGroup);
  }, []);

  const createTree = useCallback((scene: THREE.Scene) => {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(1.5, 0.2, -1.5);
    scene.add(treeGroup);
    treeGroupRef.current = treeGroup;
    return treeGroup;
  }, []);

  const updateTree = useCallback((treeGroup: THREE.Group, stage: string) => {
    // Clear previous tree
    while (treeGroup.children.length > 0) {
      const child = treeGroup.children[0];
      treeGroup.remove(child);
      if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
      if ((child as THREE.Mesh).material) {
        const material = (child as THREE.Mesh).material;
        if (Array.isArray(material)) {
          material.forEach(m => m.dispose());
        } else {
          material.dispose();
        }
      }
    }

    switch (stage) {
      case 'seed': {
        // Cute seed
        const seed = new THREE.Mesh(
          new THREE.SphereGeometry(0.2, 8, 8),
          new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 0.6,
            metalness: 0.1
          })
        );
        seed.position.y = 0.1;
        seed.scale.y = 0.7;
        seed.castShadow = true;
        treeGroup.add(seed);
        
        // Small dirt mound
        const mound = new THREE.Mesh(
          new THREE.SphereGeometry(0.35, 8, 6),
          new THREE.MeshStandardMaterial({ 
            color: 0x654321,
            roughness: 0.9
          })
        );
        mound.position.y = -0.05;
        mound.scale.y = 0.3;
        treeGroup.add(mound);
        break;
      }
      case 'sprout': {
        // Cute sprout
        const stem = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.08, 0.8),
          new THREE.MeshStandardMaterial({ 
            color: 0x32CD32,
            roughness: 0.5,
            emissive: 0x32CD32,
            emissiveIntensity: 0.1
          })
        );
        stem.position.y = 0.5;
        stem.castShadow = true;
        treeGroup.add(stem);
        
        // Two cute leaves
        const leaf1 = new THREE.Mesh(
          new THREE.SphereGeometry(0.2, 8, 8),
          new THREE.MeshStandardMaterial({ 
            color: 0x7CFC00,
            roughness: 0.4,
            emissive: 0x7CFC00,
            emissiveIntensity: 0.15
          })
        );
        leaf1.position.set(0.2, 0.7, 0);
        leaf1.scale.set(1, 0.6, 0.8);
        leaf1.castShadow = true;
        treeGroup.add(leaf1);
        
        const leaf2 = new THREE.Mesh(
          new THREE.SphereGeometry(0.2, 8, 8),
          new THREE.MeshStandardMaterial({ 
            color: 0x7CFC00,
            roughness: 0.4,
            emissive: 0x7CFC00,
            emissiveIntensity: 0.15
          })
        );
        leaf2.position.set(-0.2, 0.6, 0);
        leaf2.scale.set(1, 0.6, 0.8);
        leaf2.castShadow = true;
        treeGroup.add(leaf2);
        break;
      }
      case 'flowering': {
        // Young tree with flowers
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.18, 1.5),
          new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 0.7
          })
        );
        trunk.position.y = 0.85;
        trunk.castShadow = true;
        treeGroup.add(trunk);
        
        // Canopy
        const canopy = new THREE.Mesh(
          new THREE.SphereGeometry(0.8, 12, 12),
          new THREE.MeshStandardMaterial({ 
            color: 0x228B22,
            roughness: 0.5,
            emissive: 0x228B22,
            emissiveIntensity: 0.1
          })
        );
        canopy.position.y = 1.8;
        canopy.castShadow = true;
        treeGroup.add(canopy);
        
        // Flowers
        const flowerColors = [0xFF69B4, 0xFFD700, 0xFF1493, 0xFF6347];
        for (let i = 0; i < 6; i++) {
          const flower = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 8, 8),
            new THREE.MeshStandardMaterial({ 
              color: flowerColors[i % flowerColors.length],
              roughness: 0.4,
              emissive: flowerColors[i % flowerColors.length],
              emissiveIntensity: 0.3
            })
          );
          const angle = (i / 6) * Math.PI * 2;
          flower.position.set(
            Math.cos(angle) * 0.6,
            1.8 + Math.sin(angle * 2) * 0.15,
            Math.sin(angle) * 0.6
          );
          flower.castShadow = true;
          treeGroup.add(flower);
        }
        break;
      }
      case 'adult': {
        // Full grown tree
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.25, 2.5),
          new THREE.MeshStandardMaterial({ 
            color: 0x654321,
            roughness: 0.8
          })
        );
        trunk.position.y = 1.35;
        trunk.castShadow = true;
        treeGroup.add(trunk);
        
        // Large canopy layers
        const canopy1 = new THREE.Mesh(
          new THREE.SphereGeometry(1.2, 16, 16),
          new THREE.MeshStandardMaterial({ 
            color: 0x006400,
            roughness: 0.5,
            emissive: 0x006400,
            emissiveIntensity: 0.1
          })
        );
        canopy1.position.y = 2.8;
        canopy1.castShadow = true;
        treeGroup.add(canopy1);
        
        const canopy2 = new THREE.Mesh(
          new THREE.SphereGeometry(0.9, 12, 12),
          new THREE.MeshStandardMaterial({ 
            color: 0x228B22,
            roughness: 0.5,
            emissive: 0x228B22,
            emissiveIntensity: 0.15
          })
        );
        canopy2.position.set(0.5, 3.2, 0.3);
        canopy2.castShadow = true;
        treeGroup.add(canopy2);
        
        const canopy3 = new THREE.Mesh(
          new THREE.SphereGeometry(0.8, 12, 12),
          new THREE.MeshStandardMaterial({ 
            color: 0x32CD32,
            roughness: 0.5,
            emissive: 0x32CD32,
            emissiveIntensity: 0.1
          })
        );
        canopy3.position.set(-0.4, 3.0, -0.2);
        canopy3.castShadow = true;
        treeGroup.add(canopy3);
        break;
      }
      case 'old': {
        // Old dead tree - more detailed
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.28, 2.8),
          new THREE.MeshStandardMaterial({ 
            color: 0x4A3728,
            roughness: 0.9
          })
        );
        trunk.position.y = 1.5;
        trunk.castShadow = true;
        treeGroup.add(trunk);
        
        // Bare branches
        const branches = [
          { x: 0.4, y: 2.2, z: 0, rz: -0.7, rx: 0, len: 1.0 },
          { x: -0.3, y: 2.5, z: 0.2, rz: 0.6, rx: -0.3, len: 0.9 },
          { x: 0.1, y: 2.0, z: -0.3, rz: -0.4, rx: 0.5, len: 0.8 },
          { x: -0.4, y: 1.8, z: -0.1, rz: 0.8, rx: 0.2, len: 0.7 },
          { x: 0.3, y: 2.7, z: 0.1, rz: -0.5, rx: -0.2, len: 0.6 },
        ];
        
        branches.forEach(bp => {
          const branch = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.08, bp.len),
            new THREE.MeshStandardMaterial({ 
              color: 0x3E2723,
              roughness: 0.9
            })
          );
          branch.position.set(bp.x, bp.y, bp.z);
          branch.rotation.set(bp.rx, 0, bp.rz);
          branch.castShadow = true;
          treeGroup.add(branch);
        });
        
        // Dead leaves on ground
        for (let i = 0; i < 8; i++) {
          const leaf = new THREE.Mesh(
            new THREE.CircleGeometry(0.08, 6),
            new THREE.MeshStandardMaterial({ 
              color: 0x8B6914,
              roughness: 0.8,
              side: THREE.DoubleSide
            })
          );
          leaf.position.set(
            (Math.random() - 0.5) * 2,
            0.01,
            (Math.random() - 0.5) * 2
          );
          leaf.rotation.x = -Math.PI / 2 + Math.random() * 0.3;
          treeGroup.add(leaf);
        }
        
        // Cute mushrooms
        for (let i = 0; i < 4; i++) {
          const mushroomGroup = new THREE.Group();
          const mStem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.15),
            new THREE.MeshStandardMaterial({ 
              color: 0xFFF8DC,
              roughness: 0.6
            })
          );
          mStem.position.y = 0.075;
          mushroomGroup.add(mStem);
          
          const mCap = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
            new THREE.MeshStandardMaterial({ 
              color: 0xFF4500,
              roughness: 0.5,
              emissive: 0xFF4500,
              emissiveIntensity: 0.2
            })
          );
          mCap.position.y = 0.15;
          mushroomGroup.add(mCap);
          
          // White spots
          for (let j = 0; j < 3; j++) {
            const spot = new THREE.Mesh(
              new THREE.CircleGeometry(0.02, 6),
              new THREE.MeshStandardMaterial({ 
                color: 0xFFFFFF,
                side: THREE.DoubleSide
              })
            );
            const angle = (j / 3) * Math.PI * 2;
            spot.position.set(
              Math.cos(angle) * 0.05,
              0.17,
              Math.sin(angle) * 0.05
            );
            spot.rotation.x = -Math.PI / 3;
            mushroomGroup.add(spot);
          }
          
          const angle = (i / 4) * Math.PI * 2 + 0.5;
          mushroomGroup.position.set(Math.cos(angle) * 0.35, 0, Math.sin(angle) * 0.35);
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
    
    // Body - cute rounded
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 12, 12),
      new THREE.MeshStandardMaterial({ 
        color: 0x42A5F5,
        roughness: 0.4,
        metalness: 0.1,
        emissive: 0x42A5F5,
        emissiveIntensity: 0.05
      })
    );
    body.position.y = 0.6;
    body.scale.y = 1.2;
    body.castShadow = true;
    charGroup.add(body);
    
    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 12, 12),
      new THREE.MeshStandardMaterial({ 
        color: 0xFFE0BD,
        roughness: 0.3
      })
    );
    head.position.y = 1.15;
    head.castShadow = true;
    charGroup.add(head);
    
    // Eyes - cute big eyes
    const eyeL = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 8, 8),
      new THREE.MeshStandardMaterial({ 
        color: 0x1A1A2E,
        roughness: 0.2
      })
    );
    eyeL.position.set(-0.1, 1.18, 0.24);
    charGroup.add(eyeL);
    
    const eyeR = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 8, 8),
      new THREE.MeshStandardMaterial({ 
        color: 0x1A1A2E,
        roughness: 0.2
      })
    );
    eyeR.position.set(0.1, 1.18, 0.24);
    charGroup.add(eyeR);
    
    // Eye highlights
    const highlightL = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 6, 6),
      new THREE.MeshStandardMaterial({ 
        color: 0xFFFFFF,
        emissive: 0xFFFFFF,
        emissiveIntensity: 0.8
      })
    );
    highlightL.position.set(-0.08, 1.2, 0.29);
    charGroup.add(highlightL);
    
    const highlightR = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 6, 6),
      new THREE.MeshStandardMaterial({ 
        color: 0xFFFFFF,
        emissive: 0xFFFFFF,
        emissiveIntensity: 0.8
      })
    );
    highlightR.position.set(0.12, 1.2, 0.29);
    charGroup.add(highlightR);
    
    // Cute blush
    const blushL = new THREE.Mesh(
      new THREE.CircleGeometry(0.07, 8),
      new THREE.MeshStandardMaterial({ 
        color: 0xFF8A80,
        side: THREE.DoubleSide,
        emissive: 0xFF8A80,
        emissiveIntensity: 0.4
      })
    );
    blushL.position.set(-0.2, 1.1, 0.22);
    blushL.rotation.y = -0.3;
    charGroup.add(blushL);
    
    const blushR = new THREE.Mesh(
      new THREE.CircleGeometry(0.07, 8),
      new THREE.MeshStandardMaterial({ 
        color: 0xFF8A80,
        side: THREE.DoubleSide,
        emissive: 0xFF8A80,
        emissiveIntensity: 0.4
      })
    );
    blushR.position.set(0.2, 1.1, 0.22);
    blushR.rotation.y = 0.3;
    charGroup.add(blushR);
    
    // Cute smile
    const smile = new THREE.Mesh(
      new THREE.TorusGeometry(0.05, 0.015, 8, 12, Math.PI),
      new THREE.MeshStandardMaterial({ 
        color: 0xE91E63,
        roughness: 0.3
      })
    );
    smile.position.set(0, 1.08, 0.26);
    smile.rotation.x = Math.PI;
    charGroup.add(smile);
    
    // Cute hat - vibrant purple
    const hat = new THREE.Mesh(
      new THREE.ConeGeometry(0.25, 0.4, 8),
      new THREE.MeshStandardMaterial({ 
        color: 0xAB47BC,
        roughness: 0.4,
        emissive: 0xAB47BC,
        emissiveIntensity: 0.15
      })
    );
    hat.position.y = 1.5;
    hat.castShadow = true;
    charGroup.add(hat);
    
    // Hat band
    const hatBand = new THREE.Mesh(
      new THREE.TorusGeometry(0.23, 0.03, 8, 16),
      new THREE.MeshStandardMaterial({ 
        color: 0xFFD700,
        roughness: 0.3,
        metalness: 0.3,
        emissive: 0xFFD700,
        emissiveIntensity: 0.2
      })
    );
    hatBand.position.y = 1.32;
    hatBand.rotation.x = Math.PI / 2;
    charGroup.add(hatBand);
    
    // Hat pom-pom
    const pomPom = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 8, 8),
      new THREE.MeshStandardMaterial({ 
        color: 0xFFFFFF,
        roughness: 0.3,
        emissive: 0xFFFFFF,
        emissiveIntensity: 0.3
      })
    );
    pomPom.position.y = 1.72;
    charGroup.add(pomPom);
    
    charGroup.position.set(-3, 0.2, 1);
    scene.add(charGroup);
    characterRef.current = charGroup;
    return charGroup;
  }, []);

  const createStairs = useCallback((scene: THREE.Scene) => {
    const stairsGroup = new THREE.Group();
    stairsGroup.position.set(1.5, 0.2, -1.5);
    
    // Wooden stairs
    const woodColor = 0xDEB887;
    
    // Steps
    for (let i = 0; i < 4; i++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(1, 0.15, 0.5),
        new THREE.MeshStandardMaterial({ 
          color: woodColor,
          roughness: 0.7
        })
      );
      step.position.set(0, 0.5 + i * 0.5, 0.8 - i * 0.2);
      step.castShadow = true;
      step.receiveShadow = true;
      stairsGroup.add(step);
    }
    
    // Side rails
    const rail1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 2.5, 0.1),
      new THREE.MeshStandardMaterial({ 
        color: 0xA0522D,
        roughness: 0.8
      })
    );
    rail1.position.set(-0.5, 1.25, 0.3);
    rail1.castShadow = true;
    stairsGroup.add(rail1);
    
    const rail2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 2.5, 0.1),
      new THREE.MeshStandardMaterial({ 
        color: 0xA0522D,
        roughness: 0.8
      })
    );
    rail2.position.set(0.5, 1.25, 0.3);
    rail2.castShadow = true;
    stairsGroup.add(rail2);
    
    stairsGroup.visible = false;
    scene.add(stairsGroup);
    stairsGroupRef.current = stairsGroup;
  }, []);

  const createWaterDrops = useCallback((scene: THREE.Scene) => {
    const waterGroup = new THREE.Group();
    waterGroup.position.set(1.5, 1.5, -1.5);
    waterGroup.visible = false;
    
    for (let i = 0; i < 10; i++) {
      const drop = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 8),
        new THREE.MeshStandardMaterial({ 
          color: 0x00BFFF,
          roughness: 0.2,
          metalness: 0.3,
          transparent: true,
          opacity: 0.8,
          emissive: 0x00BFFF,
          emissiveIntensity: 0.3
        })
      );
      drop.position.set(
        (Math.random() - 0.5) * 0.6,
        Math.random() * 0.8,
        (Math.random() - 0.5) * 0.6
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
    
    // Gradient sky using a large sphere
    const skyGeo = new THREE.SphereGeometry(40, 32, 32);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x4FC3F7) },
        bottomColor: { value: new THREE.Color(0xFFF9C4) },
        offset: { value: 10 },
        exponent: { value: 0.5 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);
    
    scene.fog = new THREE.Fog(0xFFF9C4, 18, 35);
    sceneRef.current = scene;

    // Isometric-style camera - classic isometric angle
    const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(10, 8, 10);
    camera.lookAt(0, 0.5, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting - soft and colorful
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xFFEB3B, 1.3);
    sunLight.position.set(6, 12, 6);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -10;
    sunLight.shadow.camera.right = 10;
    sunLight.shadow.camera.top = 10;
    sunLight.shadow.camera.bottom = -10;
    sunLight.shadow.bias = -0.0001;
    scene.add(sunLight);

    // Brilliant colored lights
    const pinkLight = new THREE.PointLight(0xFF69B4, 0.8, 15);
    pinkLight.position.set(-5, 4, 5);
    scene.add(pinkLight);

    const blueLight = new THREE.PointLight(0x00BFFF, 0.7, 15);
    blueLight.position.set(5, 4, 5);
    scene.add(blueLight);

    const yellowLight = new THREE.PointLight(0xFFD700, 0.6, 12);
    yellowLight.position.set(0, 6, -4);
    scene.add(yellowLight);

    const purpleLight = new THREE.PointLight(0xBA55D3, 0.5, 10);
    purpleLight.position.set(-3, 3, -3);
    scene.add(purpleLight);

    const greenLight = new THREE.PointLight(0x32CD32, 0.4, 10);
    greenLight.position.set(3, 2, 3);
    scene.add(greenLight);

    // Hemisphere light
    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x90EE90, 0.5);
    scene.add(hemiLight);

    // Cute clouds
    const createCloud = (x: number, y: number, z: number, scale: number) => {
      const cloudGroup = new THREE.Group();
      const cloudMat = new THREE.MeshStandardMaterial({ 
        color: 0xFFFFFF, 
        roughness: 1.0,
        emissive: 0xFFFFFF,
        emissiveIntensity: 0.15
      });
      
      const positions = [
        { x: 0, y: 0, z: 0, s: 1 },
        { x: 0.5, y: 0.1, z: 0, s: 0.7 },
        { x: -0.4, y: 0.05, z: 0.1, s: 0.8 },
        { x: 0.2, y: 0.2, z: -0.1, s: 0.6 },
      ];
      
      positions.forEach(p => {
        const puff = new THREE.Mesh(
          new THREE.SphereGeometry(0.4 * p.s, 8, 8),
          cloudMat
        );
        puff.position.set(p.x, p.y, p.z);
        cloudGroup.add(puff);
      });
      
      cloudGroup.position.set(x, y, z);
      cloudGroup.scale.setScalar(scale);
      scene.add(cloudGroup);
      return cloudGroup;
    };
    
    createCloud(-6, 8, -8, 1.5);
    createCloud(5, 9, -10, 1.2);
    createCloud(8, 7, -5, 1.0);
    createCloud(-3, 10, -12, 0.8);

    // Create scene elements
    createGround(scene);
    createWall(scene);
    const treeGroup = createTree(scene);
    createCharacter(scene);
    createStairs(scene);
    createWaterDrops(scene);

    // Initial tree state
    updateTree(treeGroup, 'empty');

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      const time = Date.now() * 0.001;
      
      // Animate water drops
      if (waterDropsRef.current && waterDropsRef.current.visible) {
        waterDropsRef.current.children.forEach((drop: THREE.Object3D, i: number) => {
          drop.position.y -= 0.03;
          if (drop.position.y < -1.5) {
            drop.position.y = 0.8;
            drop.position.x = (Math.random() - 0.5) * 0.6;
            drop.position.z = (Math.random() - 0.5) * 0.6;
          }
          drop.scale.setScalar(1 + Math.sin(time * 4 + i) * 0.2);
        });
      }

      // Character idle animation
      if (characterRef.current) {
        characterRef.current.position.y = 0.2 + Math.sin(time * 2) * 0.08;
        characterRef.current.rotation.y = Math.sin(time * 0.5) * 0.15;
      }

      // Gentle camera sway
      camera.position.x = 10 + Math.sin(time * 0.3) * 0.3;
      camera.position.y = 8 + Math.sin(time * 0.2) * 0.2;
      camera.lookAt(0, 0.5, 0);

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
      updateTree(treeGroupRef.current, treeStage);
    }
  }, [treeStage, updateTree]);

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
