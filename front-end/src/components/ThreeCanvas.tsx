import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * ThreeCanvas: High-Performance Custom 3D Interactive Cyber Grid
 * Complies with UI_UX_DESIGN_SPEC.md (Giai đoạn 1 - 5)
 * - 3D Matrix of Cyber Cubes (Substrate WASM / EVM Dual-VM nodes)
 * - Mouse Raycaster & Spring Physics Ripple Waves
 * - Chamfered edges with glowing neon cyber lines
 * - Dynamic Dual-VM colored lights & cursor follower
 */
export const ThreeCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080512, 0.0011);

    let width = mount.clientWidth || window.innerWidth;
    let height = mount.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    // Position camera closer at Z=160 for high visual presence on flat plane
    camera.position.set(0, 0, 160);
    camera.lookAt(0, 0, 0);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    mount.appendChild(renderer.domElement);

    // 3. Lighting Setup (Wider span for full-width coverage)
    const ambientLight = new THREE.AmbientLight(0x22153d, 2.3);
    scene.add(ambientLight);

    // High Directional Rim Light for glossy cube bevels
    const dirLight = new THREE.DirectionalLight(0xc4b5fd, 3.8);
    dirLight.position.set(0, 100, 120);
    scene.add(dirLight);

    // Dynamic Mouse Light (follows pointer on the grid)
    const mouseLight = new THREE.PointLight(0xd8b4fe, 6.8, 160, 1.4);
    mouseLight.position.set(0, 0, 30);
    scene.add(mouseLight);

    // Left Domain Light (Deep Electric Amethyst - wide wingspan)
    const wasmLight = new THREE.PointLight(0xa855f7, 5.6, 360, 1.2);
    wasmLight.position.set(-140, 40, 55);
    scene.add(wasmLight);

    // Right Domain Light (Royal Neon Violet - wide wingspan)
    const evmLight = new THREE.PointLight(0x7c3aed, 5.6, 360, 1.2);
    evmLight.position.set(140, -30, 55);
    scene.add(evmLight);

    // Center Core Light (High Radiant Violet)
    const centerLight = new THREE.PointLight(0xc084fc, 4.8, 260, 1.2);
    centerLight.position.set(0, 15, 60);
    scene.add(centerLight);

    // 4. Matrix of Cyber Cubes (Expanded Grid Geometry for 100% full-width coverage)
    const COLS = 25;
    const ROWS = 12;
    const SPACING_X = 22;
    const SPACING_Y = 19;
    const BOX_WIDTH = 17;
    const BOX_HEIGHT = 14.5;
    const BOX_DEPTH = 13.5;

    const gridGroup = new THREE.Group();
    // Fixed flat plane: completely parallel to the screen without rotational tilt
    gridGroup.rotation.set(0, 0, 0);
    scene.add(gridGroup);

    // Shared geometry for performance
    const boxGeometry = new THREE.BoxGeometry(BOX_WIDTH, BOX_HEIGHT, BOX_DEPTH);
    const edgesGeometry = new THREE.EdgesGeometry(boxGeometry);

    // Top cap indicator geometry
    const capGeometry = new THREE.PlaneGeometry(BOX_WIDTH * 0.72, BOX_HEIGHT * 0.72);

    interface CubeInstance {
      mesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
      edgeMesh: THREE.LineSegments<THREE.EdgesGeometry, THREE.LineBasicMaterial>;
      capMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
      baseX: number;
      baseY: number;
      baseZ: number;
      currentZ: number;
      targetZ: number;
      rotX: number;
      rotY: number;
      targetRotX: number;
      targetRotY: number;
      glowIntensity: number;
      vmType: 'wasm' | 'core' | 'evm';
      baseColor: THREE.Color;
      activeColor: THREE.Color;
    }

    const cubes: CubeInstance[] = [];

    const startX = -((COLS - 1) * SPACING_X) / 2;
    const startY = -((ROWS - 1) * SPACING_Y) / 2;

    const wasmCutoff = Math.floor(COLS * 0.42);
    const evmCutoff = Math.ceil(COLS * 0.58);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = startX + c * SPACING_X;
        const y = startY + r * SPACING_Y;
        const z = 0;

        // Classify domain within the Obsidian Violet Spectrum
        let vmType: 'wasm' | 'core' | 'evm' = 'core';
        let baseColor = new THREE.Color(0x130a28);
        let activeColor = new THREE.Color(0xd8b4fe);
        let edgeColor = new THREE.Color(0x8b5cf6);
        let capColor = new THREE.Color(0xa855f7);

        if (c < wasmCutoff) {
          // Substrate WASM Domain (Deep Amethyst Violet)
          vmType = 'wasm';
          baseColor = new THREE.Color(0x16082e);
          activeColor = new THREE.Color(0xe879f9);
          edgeColor = new THREE.Color(0xa855f7);
          capColor = new THREE.Color(0xc084fc);
        } else if (c >= evmCutoff) {
          // EVM Domain (Royal Electric Violet)
          vmType = 'evm';
          baseColor = new THREE.Color(0x0f0724);
          activeColor = new THREE.Color(0xa78bfa);
          edgeColor = new THREE.Color(0x7c3aed);
          capColor = new THREE.Color(0x8b5cf6);
        } else {
          // Dual-VM Synthesis Core (High Radiant Neon Violet)
          vmType = 'core';
          baseColor = new THREE.Color(0x150b2e);
          activeColor = new THREE.Color(0xf0abfc);
          edgeColor = new THREE.Color(0x8b5cf6);
          capColor = new THREE.Color(0xd8b4fe);
        }

        // Body Material (Dark obsidian violet chassis with high metalness)
        const mat = new THREE.MeshStandardMaterial({
          color: baseColor,
          roughness: 0.16,
          metalness: 0.82,
          emissive: baseColor,
          emissiveIntensity: 0.28,
          transparent: true,
          opacity: 0.95,
        });

        const mesh = new THREE.Mesh(boxGeometry, mat);
        mesh.position.set(x, y, z);
        gridGroup.add(mesh);

        // Edge Wireframe (Crisp cyber borders)
        const edgeMat = new THREE.LineBasicMaterial({
          color: edgeColor,
          transparent: true,
          opacity: 0.82,
          blending: THREE.AdditiveBlending,
        });
        const edgeMesh = new THREE.LineSegments(edgesGeometry, edgeMat);
        mesh.add(edgeMesh);

        // Top Microchip Cap
        const capMat = new THREE.MeshBasicMaterial({
          color: capColor,
          transparent: true,
          opacity: 0.65,
          blending: THREE.AdditiveBlending,
        });
        const capMesh = new THREE.Mesh(capGeometry, capMat);
        capMesh.position.set(0, 0, BOX_DEPTH / 2 + 0.05);
        mesh.add(capMesh);

        cubes.push({
          mesh,
          edgeMesh,
          capMesh,
          baseX: x,
          baseY: y,
          baseZ: z,
          currentZ: z,
          targetZ: z,
          rotX: 0,
          rotY: 0,
          targetRotX: 0,
          targetRotY: 0,
          glowIntensity: 0,
          vmType,
          baseColor,
          activeColor,
        });
      }
    }

    // 5. Floating Background Cyber Dust (Embers in Obsidian Violet)
    const dustCount = 280;
    const dustPositions = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);

    const c1 = new THREE.Color(0x8b5cf6); // Electric Violet
    const c2 = new THREE.Color(0xc084fc); // Radiant Lavender
    const c3 = new THREE.Color(0xa855f7); // Amethyst
    const c4 = new THREE.Color(0xd8b4fe); // Neon Lilac

    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 900;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 600;
      dustPositions[i * 3 + 2] = -50 + (Math.random() - 0.5) * 350;

      const pick = Math.random();
      const col = pick < 0.25 ? c1 : pick < 0.5 ? c2 : pick < 0.75 ? c3 : c4;
      dustColors[i * 3] = col.r;
      dustColors[i * 3 + 1] = col.g;
      dustColors[i * 3 + 2] = col.b;
    }

    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeometry.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));

    const dustMaterial = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    const dustPoints = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dustPoints);

    // 6. Mouse Raycasting & Target World Coordinates
    const raycaster = new THREE.Raycaster();
    const mouseNorm = new THREE.Vector2(-999, -999);
    const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const planeIntersect = new THREE.Vector3(0, 0, 0);

    let clientMouseX = 0;
    let clientMouseY = 0;
    let isMouseOver = false;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      // Only activate 3D interaction if the cursor is strictly inside the hero canvas bounds
      if (
        px >= 0 &&
        px <= rect.width &&
        py >= 0 &&
        py <= rect.height &&
        rect.top < window.innerHeight &&
        rect.bottom > 0
      ) {
        mouseNorm.x = (px / rect.width) * 2 - 1;
        mouseNorm.y = -(py / rect.height) * 2 + 1;
        clientMouseX = mouseNorm.x;
        clientMouseY = mouseNorm.y;
        isMouseOver = true;
      } else {
        isMouseOver = false;
      }
    };

    const handleScroll = () => {
      const rect = mount.getBoundingClientRect();
      // If hero container is scrolled out of view, cleanly deactivate hover raycasting
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) {
        isMouseOver = false;
        mouseNorm.set(-999, -999);
      }
    };

    const handlePointerLeave = () => {
      mouseNorm.set(-999, -999);
      isMouseOver = false;
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mouseleave', handlePointerLeave);

    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;
      if (w > 0 && h > 0) {
        width = w;
        height = h;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    };

    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(mount);

    // 7. Animation Loop with Fixed Flat Plane & Spring Elevation
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Intersect ray with ground plane to get exact mouse position in 3D world space
      raycaster.setFromCamera(mouseNorm, camera);
      raycaster.ray.intersectPlane(planeZ, planeIntersect);

      // Fixed Flat Plane: grid orientation is strictly locked with zero tilt or roll
      gridGroup.rotation.set(0, 0, 0);

      // Position mouse point light smoothly above cursor
      if (isMouseOver && mouseNorm.x > -2) {
        mouseLight.position.x += (planeIntersect.x - mouseLight.position.x) * 0.18;
        mouseLight.position.y += (planeIntersect.y - mouseLight.position.y) * 0.18;
        mouseLight.position.z = 24 + Math.sin(elapsed * 4) * 3;
        mouseLight.intensity = 6.5;
      } else {
        mouseLight.intensity += (0 - mouseLight.intensity) * 0.08;
      }

      // Orbital sway for Dual-VM lights (wider reach for 25 columns)
      wasmLight.position.x = -135 + Math.sin(elapsed * 0.8) * 20;
      wasmLight.position.y = 40 + Math.cos(elapsed * 0.7) * 15;

      evmLight.position.x = 135 + Math.cos(elapsed * 0.8) * 20;
      evmLight.position.y = -30 + Math.sin(elapsed * 0.7) * 15;

      // Influence radius for mouse ripple wave
      const WAVE_RADIUS = 65;
      const MAX_ELEVATION = 26;

      // Update each cube with Spring Physics (perpendicular elevation strictly on flat plane)
      for (let i = 0; i < cubes.length; i++) {
        const c = cubes[i];

        // 1. Ambient breathing wave (diagonally sweeping across matrix)
        const colIndex = i % COLS;
        const rowIndex = Math.floor(i / COLS);
        const ambientWave = Math.sin(elapsed * 1.8 + colIndex * 0.42 + rowIndex * 0.32) * 2.8;

        // 2. Mouse distance calculation (pure perpendicular elevation, zero tilt)
        let mouseLift = 0;

        if (isMouseOver && mouseNorm.x > -2) {
          const dx = planeIntersect.x - c.baseX;
          const dy = planeIntersect.y - c.baseY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < WAVE_RADIUS) {
            // Cosine smooth wave falloff
            const normDist = dist / WAVE_RADIUS;
            const factor = Math.cos(normDist * (Math.PI / 2));
            mouseLift = factor * MAX_ELEVATION;

            // Glow intensity flare
            c.glowIntensity += (factor - c.glowIntensity) * 0.22;
          } else {
            c.glowIntensity += (0 - c.glowIntensity) * 0.08;
          }
        } else {
          c.glowIntensity += (0 - c.glowIntensity) * 0.08;
        }

        // 3. Spring physics: update perpendicular Z displacement
        c.targetZ = c.baseZ + ambientWave + mouseLift;
        c.currentZ += (c.targetZ - c.currentZ) * 0.12;
        c.mesh.position.z = c.currentZ;

        // Fixed flat plane: strictly lock cube rotations to 0 (no tilt on scroll or hover)
        c.mesh.rotation.set(0, 0, 0);

        // 4. Dynamic Emissive Glow & Edge Brightness
        const mat = c.mesh.material;
        const edgeMat = c.edgeMesh.material;
        const capMat = c.capMesh.material;

        if (c.glowIntensity > 0.01) {
          // Interpolate emissive color toward active neon
          mat.emissive.lerpColors(c.baseColor, c.activeColor, c.glowIntensity * 0.7);
          mat.emissiveIntensity = 0.1 + c.glowIntensity * 1.6;

          // Brighten edges
          edgeMat.opacity = 0.55 + c.glowIntensity * 0.45;
          capMat.opacity = 0.45 + c.glowIntensity * 0.55;

          // Micro scale pop
          const s = 1 + c.glowIntensity * 0.06;
          c.mesh.scale.set(s, s, s);
        } else {
          mat.emissive.copy(c.baseColor);
          mat.emissiveIntensity = 0.1;
          edgeMat.opacity = 0.45;
          capMat.opacity = 0.35;
          c.mesh.scale.set(1, 1, 1);
        }
      }

      // Slowly drift cyber dust
      dustPoints.rotation.y = elapsed * 0.025;
      dustPoints.rotation.x = Math.sin(elapsed * 0.015) * 0.04;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Cleanup & Resource Disposal
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      cancelAnimationFrame(animId);

      renderer.dispose();
      boxGeometry.dispose();
      edgesGeometry.dispose();
      capGeometry.dispose();
      dustGeometry.dispose();
      dustMaterial.dispose();

      cubes.forEach((c) => {
        c.mesh.material.dispose();
        c.edgeMesh.material.dispose();
        c.capMesh.material.dispose();
      });

      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-0"
    />
  );
};

