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
    scene.fog = new THREE.FogExp2(0x0b0813, 0.0016);

    let width = mount.clientWidth || window.innerWidth;
    let height = mount.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, -28, 195);
    camera.lookAt(0, 4, 0);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    mount.appendChild(renderer.domElement);

    // 3. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0x19102c, 1.8);
    scene.add(ambientLight);

    // Dynamic Mouse Light (follows pointer on the grid)
    const mouseLight = new THREE.PointLight(0xa855f7, 4.5, 90, 1.5);
    mouseLight.position.set(0, 0, 30);
    scene.add(mouseLight);

    // Left VM Light (Substrate WASM / Polkadot Magenta)
    const wasmLight = new THREE.PointLight(0xe6007a, 3.2, 180, 1.2);
    wasmLight.position.set(-80, 40, 45);
    scene.add(wasmLight);

    // Right VM Light (EVM JSON-RPC / Cyan-Indigo)
    const evmLight = new THREE.PointLight(0x38bdf8, 3.2, 180, 1.2);
    evmLight.position.set(80, -30, 45);
    scene.add(evmLight);

    // Center Core Light (Electric Violet)
    const centerLight = new THREE.PointLight(0x8b5cf6, 2.5, 140, 1.2);
    centerLight.position.set(0, 15, 50);
    scene.add(centerLight);

    // 4. Matrix of Cyber Cubes (Grid Geometry)
    const COLS = 11;
    const ROWS = 7;
    const SPACING_X = 18;
    const SPACING_Y = 16;
    const BOX_WIDTH = 13.5;
    const BOX_HEIGHT = 12;
    const BOX_DEPTH = 11;

    const gridGroup = new THREE.Group();
    // Tilt the entire grid slightly back for a command deck perspective
    gridGroup.rotation.x = 0.28;
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

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = startX + c * SPACING_X;
        const y = startY + r * SPACING_Y;
        const z = 0;

        // Classify VM domain
        let vmType: 'wasm' | 'core' | 'evm' = 'core';
        let baseColor = new THREE.Color(0x130e26);
        let activeColor = new THREE.Color(0xc084fc);
        let edgeColor = new THREE.Color(0x4c2889);
        let capColor = new THREE.Color(0x8b5cf6);

        if (c < 4) {
          // Substrate WASM Domain (Left)
          vmType = 'wasm';
          activeColor = new THREE.Color(0xff2d95);
          edgeColor = new THREE.Color(0x6e1248);
          capColor = new THREE.Color(0xe6007a);
        } else if (c > 6) {
          // EVM Domain (Right)
          vmType = 'evm';
          activeColor = new THREE.Color(0x38bdf8);
          edgeColor = new THREE.Color(0x1e3a8a);
          capColor = new THREE.Color(0x6366f1);
        } else {
          // Dual-VM Synthesis Core (Center)
          vmType = 'core';
          activeColor = new THREE.Color(0xd8b4fe);
          edgeColor = new THREE.Color(0x582c9e);
          capColor = new THREE.Color(0xa855f7);
        }

        // Body Material (Dark obsidian chassis with high metalness)
        const mat = new THREE.MeshStandardMaterial({
          color: baseColor,
          roughness: 0.22,
          metalness: 0.88,
          emissive: baseColor,
          emissiveIntensity: 0.1,
          transparent: true,
          opacity: 0.94,
        });

        const mesh = new THREE.Mesh(boxGeometry, mat);
        mesh.position.set(x, y, z);
        gridGroup.add(mesh);

        // Edge Wireframe (Crisp cyber borders)
        const edgeMat = new THREE.LineBasicMaterial({
          color: edgeColor,
          transparent: true,
          opacity: 0.55,
          blending: THREE.AdditiveBlending,
        });
        const edgeMesh = new THREE.LineSegments(edgesGeometry, edgeMat);
        mesh.add(edgeMesh);

        // Top Microchip Cap
        const capMat = new THREE.MeshBasicMaterial({
          color: capColor,
          transparent: true,
          opacity: 0.45,
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

    // 5. Floating Background Cyber Dust (Embers)
    const dustCount = 280;
    const dustPositions = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);

    const c1 = new THREE.Color(0x8b5cf6);
    const c2 = new THREE.Color(0x38bdf8);
    const c3 = new THREE.Color(0xe6007a);

    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 600;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 450;
      dustPositions[i * 3 + 2] = -50 + (Math.random() - 0.5) * 350;

      const pick = Math.random();
      const col = pick < 0.33 ? c1 : pick < 0.66 ? c2 : c3;
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

      mouseNorm.x = (px / rect.width) * 2 - 1;
      mouseNorm.y = -(py / rect.height) * 2 + 1;

      clientMouseX = mouseNorm.x;
      clientMouseY = mouseNorm.y;
      isMouseOver = true;
    };

    const handlePointerLeave = () => {
      mouseNorm.set(-999, -999);
      isMouseOver = false;
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseleave', handlePointerLeave);

    const handleResize = () => {
      if (!mount) return;
      width = mount.clientWidth;
      height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // 7. Animation Loop with Spring Physics & Dynamic Ripple Waves
    let animId: number;
    const clock = new THREE.Clock();

    let gridDampedRotX = 0.28;
    let gridDampedRotY = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Intersect ray with ground plane to get exact mouse position in 3D world space
      raycaster.setFromCamera(mouseNorm, camera);
      raycaster.ray.intersectPlane(planeZ, planeIntersect);

      // Smooth camera & grid parallax tilt from mouse
      const targetGridRotY = isMouseOver ? clientMouseX * 0.16 : 0;
      const targetGridRotX = 0.28 - (isMouseOver ? clientMouseY * 0.12 : 0);

      gridDampedRotY += (targetGridRotY - gridDampedRotY) * 0.05;
      gridDampedRotX += (targetGridRotX - gridDampedRotX) * 0.05;

      gridGroup.rotation.y = gridDampedRotY;
      gridGroup.rotation.x = gridDampedRotX;

      // Position mouse point light smoothly above cursor
      if (isMouseOver && mouseNorm.x > -2) {
        mouseLight.position.x += (planeIntersect.x - mouseLight.position.x) * 0.18;
        mouseLight.position.y += (planeIntersect.y - mouseLight.position.y) * 0.18;
        mouseLight.position.z = 24 + Math.sin(elapsed * 4) * 3;
        mouseLight.intensity = 4.2;
      } else {
        mouseLight.intensity += (0 - mouseLight.intensity) * 0.08;
      }

      // Orbital sway for Dual-VM lights
      wasmLight.position.x = -85 + Math.sin(elapsed * 0.8) * 15;
      wasmLight.position.y = 40 + Math.cos(elapsed * 0.7) * 12;

      evmLight.position.x = 85 + Math.cos(elapsed * 0.8) * 15;
      evmLight.position.y = -30 + Math.sin(elapsed * 0.7) * 12;

      // Influence radius for mouse ripple wave
      const WAVE_RADIUS = 55;
      const MAX_ELEVATION = 26;

      // Update each cube with Spring Physics & Wave Dynamics
      for (let i = 0; i < cubes.length; i++) {
        const c = cubes[i];

        // 1. Ambient breathing wave (diagonally sweeping across matrix)
        const colIndex = i % COLS;
        const rowIndex = Math.floor(i / COLS);
        const ambientWave = Math.sin(elapsed * 1.8 + colIndex * 0.42 + rowIndex * 0.32) * 2.8;

        // 2. Mouse distance calculation
        let mouseLift = 0;
        let tiltFactorX = 0;
        let tiltFactorY = 0;

        if (isMouseOver && mouseNorm.x > -2) {
          const dx = planeIntersect.x - c.baseX;
          const dy = planeIntersect.y - c.baseY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < WAVE_RADIUS) {
            // Cosine smooth wave falloff
            const normDist = dist / WAVE_RADIUS;
            const factor = Math.cos(normDist * (Math.PI / 2));
            mouseLift = factor * MAX_ELEVATION;

            // Tilt toward/away from cursor for tactile 3D responsiveness
            tiltFactorX = -(dy / WAVE_RADIUS) * factor * 0.45;
            tiltFactorY = (dx / WAVE_RADIUS) * factor * 0.45;

            // Glow intensity flare
            c.glowIntensity += (factor - c.glowIntensity) * 0.22;
          } else {
            c.glowIntensity += (0 - c.glowIntensity) * 0.08;
          }
        } else {
          c.glowIntensity += (0 - c.glowIntensity) * 0.08;
        }

        // 3. Spring physics: update position & rotation
        c.targetZ = c.baseZ + ambientWave + mouseLift;
        c.currentZ += (c.targetZ - c.currentZ) * 0.12;
        c.mesh.position.z = c.currentZ;

        c.targetRotX = tiltFactorX;
        c.targetRotY = tiltFactorY;
        c.rotX += (c.targetRotX - c.rotX) * 0.12;
        c.rotY += (c.targetRotY - c.rotY) * 0.12;

        c.mesh.rotation.x = c.rotX;
        c.mesh.rotation.y = c.rotY;

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
      window.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('resize', handleResize);
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

