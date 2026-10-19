import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * ThreeCanvas: Custom 3D Interconnected Dual-VM Topology Matrix
 * Embodying DotNexus as the Central Visual Control Plane & Security Operations Engine:
 * - Left Domain (c = 0..7): Substrate ink! WASM Validator Nodes (Polkadot Magenta / Amethyst)
 * - Center Cluster (c = 8..12): DotNexus Control Plane, Slashing Guard & Synthesis Core (Radiant Violet)
 * - Right Domain (c = 13..20): EVM Solidity RPC Nodes (Ethereum Indigo / Electric Violet)
 * - Interconnecting Cyber Conduits (Optical Network Bus) linking all nodes
 * - Live Telemetry Packet Streams (photons travelling across conduits into DotNexus Core)
 * - Spring physics elevation with subtle, craft-floor compliant hover brightness
 */
export const ThreeCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080512, 0.001);

    let width = mount.clientWidth || window.innerWidth;
    let height = mount.clientHeight || window.innerHeight;

    // Camera at Z=195 for an expansive, full-width perspective across the entire network topology
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1000);
    camera.position.set(0, 0, 195);
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
    renderer.toneMappingExposure = 1.25;
    mount.appendChild(renderer.domElement);

    // 3. Lighting System (Balanced for technical precision & deep obsidian contrast)
    const ambientLight = new THREE.AmbientLight(0x1e1236, 2.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xc4b5fd, 3.2);
    dirLight.position.set(0, 110, 130);
    scene.add(dirLight);

    // Subtle pointer illumination (softened to avoid glare)
    const mouseLight = new THREE.PointLight(0xd8b4fe, 1.8, 140, 1.6);
    mouseLight.position.set(0, 0, 30);
    scene.add(mouseLight);

    // Domain Lights
    const wasmLight = new THREE.PointLight(0xe6007a, 5.2, 380, 1.3);
    wasmLight.position.set(-150, 45, 60);
    scene.add(wasmLight);

    const evmLight = new THREE.PointLight(0x6366f1, 5.2, 380, 1.3);
    evmLight.position.set(150, -35, 60);
    scene.add(evmLight);

    // Central DotNexus Core Light
    const centerLight = new THREE.PointLight(0xc084fc, 4.5, 260, 1.2);
    centerLight.position.set(0, 10, 65);
    scene.add(centerLight);

    // 4. Grid Geometry & Node Matrix Configuration
    const COLS = 21;
    const ROWS = 11;
    const SPACING_X = 26;
    const SPACING_Y = 22;
    const BOX_WIDTH = 15;
    const BOX_HEIGHT = 12;
    const BOX_DEPTH = 10;

    const CENTER_COL = 10;
    const CENTER_ROW = 5;

    const gridGroup = new THREE.Group();
    gridGroup.rotation.set(0, 0, 0);
    scene.add(gridGroup);

    // Shared Geometries
    const standardBoxGeo = new THREE.BoxGeometry(BOX_WIDTH, BOX_HEIGHT, BOX_DEPTH);
    const standardEdgesGeo = new THREE.EdgesGeometry(standardBoxGeo);
    const standardCapGeo = new THREE.PlaneGeometry(BOX_WIDTH * 0.72, BOX_HEIGHT * 0.72);

    // DotNexus Central Core Node Geometry (prominent, slightly larger)
    const coreBoxGeo = new THREE.BoxGeometry(BOX_WIDTH * 1.2, BOX_HEIGHT * 1.2, BOX_DEPTH * 1.25);
    const coreEdgesGeo = new THREE.EdgesGeometry(coreBoxGeo);
    const coreCapGeo = new THREE.PlaneGeometry(BOX_WIDTH * 0.88, BOX_HEIGHT * 0.88);

    // Socket Terminal Geometry (small metallic connection pins where conduits enter)
    const socketGeo = new THREE.BoxGeometry(2.2, 1.8, 2.2);

    interface NodeInstance {
      mesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
      edgeMesh: THREE.LineSegments<THREE.EdgesGeometry, THREE.LineBasicMaterial>;
      capMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
      socketMeshes: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>[];
      col: number;
      row: number;
      baseX: number;
      baseY: number;
      baseZ: number;
      currentZ: number;
      targetZ: number;
      glowIntensity: number;
      role: 'wasm' | 'nexus-core' | 'nexus-plane' | 'evm';
      baseColor: THREE.Color;
      activeColor: THREE.Color;
      isMasterNode: boolean;
    }

    const nodes: NodeInstance[] = [];

    const startX = -((COLS - 1) * SPACING_X) / 2;
    const startY = -((ROWS - 1) * SPACING_Y) / 2;

    const wasmCutoff = 8;
    const evmCutoff = 13;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = startX + c * SPACING_X;
        const y = startY + r * SPACING_Y;
        const z = 0;

        const isMasterNode = (r === CENTER_ROW && c === CENTER_COL);
        const isNexusCluster = (c >= 8 && c <= 12 && r >= 3 && r <= 7);

        let role: 'wasm' | 'nexus-core' | 'nexus-plane' | 'evm' = 'nexus-plane';
        let baseColor = new THREE.Color(0x130a28);
        let activeColor = new THREE.Color(0xc084fc);
        let edgeColor = new THREE.Color(0x8b5cf6);
        let capColor = new THREE.Color(0xa855f7);
        let socketColor = new THREE.Color(0x7c3aed);

        if (isMasterNode) {
          // Central DotNexus Master Control Plane Node
          role = 'nexus-core';
          baseColor = new THREE.Color(0x1d0f3d);
          activeColor = new THREE.Color(0xf0abfc);
          edgeColor = new THREE.Color(0xc084fc);
          capColor = new THREE.Color(0xf5d0fe);
          socketColor = new THREE.Color(0xc084fc);
        } else if (c < wasmCutoff) {
          // Substrate ink! WASM Validator Nodes
          role = 'wasm';
          baseColor = new THREE.Color(0x170724);
          activeColor = new THREE.Color(0xf472b6);
          edgeColor = new THREE.Color(0xe6007a);
          capColor = new THREE.Color(0xa855f7);
          socketColor = new THREE.Color(0xe6007a);
        } else if (c >= evmCutoff) {
          // EVM Solidity JSON-RPC Nodes
          role = 'evm';
          baseColor = new THREE.Color(0x0c0722);
          activeColor = new THREE.Color(0x818cf8);
          edgeColor = new THREE.Color(0x6366f1);
          capColor = new THREE.Color(0x7c3aed);
          socketColor = new THREE.Color(0x6366f1);
        } else {
          // DotNexus Synthesis & Security Matrix
          role = isNexusCluster ? 'nexus-core' : 'nexus-plane';
          baseColor = new THREE.Color(0x140a2d);
          activeColor = new THREE.Color(0xd8b4fe);
          edgeColor = new THREE.Color(0x8b5cf6);
          capColor = new THREE.Color(0xc084fc);
          socketColor = new THREE.Color(0xa855f7);
        }

        // Body Material
        const mat = new THREE.MeshStandardMaterial({
          color: baseColor,
          roughness: 0.22,
          metalness: 0.82,
          emissive: baseColor,
          emissiveIntensity: isMasterNode ? 0.22 : 0.1,
          transparent: true,
          opacity: 0.96,
        });

        const nodeBoxGeo = isMasterNode ? coreBoxGeo : standardBoxGeo;
        const nodeEdgesGeo = isMasterNode ? coreEdgesGeo : standardEdgesGeo;
        const nodeCapGeo = isMasterNode ? coreCapGeo : standardCapGeo;

        const mesh = new THREE.Mesh(nodeBoxGeo, mat);
        mesh.position.set(x, y, z);
        gridGroup.add(mesh);

        // Edge Wireframe
        const edgeMat = new THREE.LineBasicMaterial({
          color: edgeColor,
          transparent: true,
          opacity: isMasterNode ? 0.75 : 0.45,
          blending: THREE.AdditiveBlending,
        });
        const edgeMesh = new THREE.LineSegments(nodeEdgesGeo, edgeMat);
        mesh.add(edgeMesh);

        // Top Microchip Cap
        const capMat = new THREE.MeshBasicMaterial({
          color: capColor,
          transparent: true,
          opacity: isMasterNode ? 0.65 : 0.35,
          blending: THREE.AdditiveBlending,
        });
        const capMesh = new THREE.Mesh(nodeCapGeo, capMat);
        const depth = isMasterNode ? (BOX_DEPTH * 1.25) : BOX_DEPTH;
        capMesh.position.set(0, 0, depth / 2 + 0.05);
        mesh.add(capMesh);

        // Socket Terminal Ports (East, West, North, South connection pins)
        const currentW = isMasterNode ? (BOX_WIDTH * 1.2) : BOX_WIDTH;
        const currentH = isMasterNode ? (BOX_HEIGHT * 1.2) : BOX_HEIGHT;

        const socketMat = new THREE.MeshBasicMaterial({
          color: socketColor,
          transparent: true,
          opacity: 0.55,
          blending: THREE.AdditiveBlending,
        });

        const socketMeshes: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>[] = [];
        const portPositions = [
          [currentW / 2 + 0.4, 0, 0], // East
          [-currentW / 2 - 0.4, 0, 0], // West
          [0, currentH / 2 + 0.4, 0], // North
          [0, -currentH / 2 - 0.4, 0] // South
        ];

        portPositions.forEach(([px, py, pz]) => {
          const sMesh = new THREE.Mesh(socketGeo, socketMat);
          sMesh.position.set(px, py, pz);
          mesh.add(sMesh);
          socketMeshes.push(sMesh);
        });

        nodes.push({
          mesh,
          edgeMesh,
          capMesh,
          socketMeshes,
          col: c,
          row: r,
          baseX: x,
          baseY: y,
          baseZ: z,
          currentZ: z,
          targetZ: z,
          glowIntensity: 0,
          role,
          baseColor,
          activeColor,
          isMasterNode,
        });
      }
    }

    // 5. Interconnecting Cyber Conduits (Optical Network Bus)
    // Generates horizontal & vertical connection lines between adjacent nodes,
    // plus a central dual express telemetry highway flowing through the DotNexus Core.
    const conduitVertices: number[] = [];
    const conduitColors: number[] = [];

    interface ConduitSegment {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      type: 'wasm' | 'core' | 'evm';
    }

    const segments: ConduitSegment[] = [];

    const wasmCol = new THREE.Color(0xa855f7);
    const wasmPink = new THREE.Color(0xe6007a);
    const coreViolet = new THREE.Color(0xc084fc);
    const evmIndigo = new THREE.Color(0x6366f1);
    const evmBlue = new THREE.Color(0x818cf8);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = startX + c * SPACING_X;
        const y = startY + r * SPACING_Y;

        let segType: 'wasm' | 'core' | 'evm' = 'core';
        let cColor = coreViolet;

        if (c < wasmCutoff - 1) {
          segType = 'wasm';
          cColor = (r % 2 === 0) ? wasmPink : wasmCol;
        } else if (c >= evmCutoff) {
          segType = 'evm';
          cColor = (r % 2 === 0) ? evmIndigo : evmBlue;
        } else {
          segType = 'core';
          cColor = coreViolet;
        }

        // Horizontal Connection (to right neighbor)
        if (c < COLS - 1) {
          const nextX = startX + (c + 1) * SPACING_X;
          const xStart = x + BOX_WIDTH / 2;
          const xEnd = nextX - BOX_WIDTH / 2;

          conduitVertices.push(xStart, y, 0, xEnd, y, 0);
          conduitColors.push(cColor.r, cColor.g, cColor.b, cColor.r, cColor.g, cColor.b);

          segments.push({ x1: xStart, y1: y, x2: xEnd, y2: y, type: segType });
        }

        // Vertical Connection (to top neighbor)
        if (r < ROWS - 1) {
          const nextY = startY + (r + 1) * SPACING_Y;
          const yStart = y + BOX_HEIGHT / 2;
          const yEnd = nextY - BOX_HEIGHT / 2;

          conduitVertices.push(x, yStart, 0, x, yEnd, 0);
          conduitColors.push(cColor.r, cColor.g, cColor.b, cColor.r, cColor.g, cColor.b);

          segments.push({ x1: x, y1: yStart, x2: x, y2: yEnd, type: segType });
        }
      }
    }

    // Express Dual-Rail Telemetry Highway into DotNexus Center (Row 5 & Rows 4, 6)
    [-3.5, 3.5].forEach((offsetY) => {
      const highwayY = startY + CENTER_ROW * SPACING_Y + offsetY;
      const xLeft = startX;
      const xRight = startX + (COLS - 1) * SPACING_X;

      conduitVertices.push(xLeft, highwayY, -1, xRight, highwayY, -1);
      conduitColors.push(
        coreViolet.r * 0.7, coreViolet.g * 0.7, coreViolet.b * 0.7,
        coreViolet.r * 0.7, coreViolet.g * 0.7, coreViolet.b * 0.7
      );

      segments.push({ x1: xLeft, y1: highwayY, x2: xRight, y2: highwayY, type: 'core' });
    });

    const conduitGeo = new THREE.BufferGeometry();
    conduitGeo.setAttribute('position', new THREE.Float32BufferAttribute(conduitVertices, 3));
    conduitGeo.setAttribute('color', new THREE.Float32BufferAttribute(conduitColors, 3));

    const conduitMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
    });
    const conduitLines = new THREE.LineSegments(conduitGeo, conduitMat);
    scene.add(conduitLines);

    // 6. Live Telemetry Packet Stream (Photons moving along conduits into DotNexus Core)
    const PACKET_COUNT = 140;
    const packetPositions = new Float32Array(PACKET_COUNT * 3);
    const packetColors = new Float32Array(PACKET_COUNT * 3);

    interface PacketState {
      segIndex: number;
      progress: number;
      speed: number;
      color: THREE.Color;
      reverse: boolean;
    }

    const packets: PacketState[] = [];

    for (let i = 0; i < PACKET_COUNT; i++) {
      const segIndex = Math.floor(Math.random() * segments.length);
      const seg = segments[segIndex];
      const speed = 0.007 + Math.random() * 0.016;

      let pColor = coreViolet;
      let reverse = false;

      if (seg.type === 'wasm') {
        pColor = Math.random() < 0.5 ? wasmPink : wasmCol;
        reverse = false; // WASM stream flows east towards center
      } else if (seg.type === 'evm') {
        pColor = Math.random() < 0.5 ? evmIndigo : evmBlue;
        reverse = true; // EVM stream flows west towards center
      } else {
        pColor = coreViolet;
        reverse = Math.random() < 0.5;
      }

      packets.push({
        segIndex,
        progress: Math.random(),
        speed,
        color: pColor,
        reverse,
      });

      packetColors[i * 3] = pColor.r;
      packetColors[i * 3 + 1] = pColor.g;
      packetColors[i * 3 + 2] = pColor.b;
    }

    const packetGeo = new THREE.BufferGeometry();
    packetGeo.setAttribute('position', new THREE.BufferAttribute(packetPositions, 3));
    packetGeo.setAttribute('color', new THREE.BufferAttribute(packetColors, 3));

    const packetMat = new THREE.PointsMaterial({
      size: 3.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const packetPoints = new THREE.Points(packetGeo, packetMat);
    scene.add(packetPoints);

    // 7. Ambient Cyber Dust (Embers in deep space)
    const dustCount = 180;
    const dustPositions = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 850;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 550;
      dustPositions[i * 3 + 2] = -40 + (Math.random() - 0.5) * 250;

      const pick = Math.random();
      const col = pick < 0.35 ? wasmCol : pick < 0.7 ? coreViolet : evmIndigo;
      dustColors[i * 3] = col.r;
      dustColors[i * 3 + 1] = col.g;
      dustColors[i * 3 + 2] = col.b;
    }

    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeometry.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));

    const dustMaterial = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    const dustPoints = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dustPoints);

    // 8. Mouse Raycaster & World Projection
    const raycaster = new THREE.Raycaster();
    const mouseNorm = new THREE.Vector2(-999, -999);
    const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const planeIntersect = new THREE.Vector3(0, 0, 0);

    let isMouseOver = false;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

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
        isMouseOver = true;
      } else {
        isMouseOver = false;
      }
    };

    const handleScroll = () => {
      const rect = mount.getBoundingClientRect();
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

    // 9. Animation Loop (Strict Fixed Plane with Spring Elevation & Realtime Telemetry Pulse)
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Mouse intersection on ground plane
      raycaster.setFromCamera(mouseNorm, camera);
      raycaster.ray.intersectPlane(planeZ, planeIntersect);

      // Mouse point light follows pointer smoothly (softened glow)
      if (isMouseOver && mouseNorm.x > -2) {
        mouseLight.position.x += (planeIntersect.x - mouseLight.position.x) * 0.18;
        mouseLight.position.y += (planeIntersect.y - mouseLight.position.y) * 0.18;
        mouseLight.position.z = 24 + Math.sin(elapsed * 4) * 2.5;
        mouseLight.intensity = 1.8;
      } else {
        mouseLight.intensity += (0 - mouseLight.intensity) * 0.08;
      }

      // Orbital sway for dual-domain lights
      wasmLight.position.x = -145 + Math.sin(elapsed * 0.75) * 18;
      wasmLight.position.y = 45 + Math.cos(elapsed * 0.65) * 14;

      evmLight.position.x = 145 + Math.cos(elapsed * 0.75) * 18;
      evmLight.position.y = -35 + Math.sin(elapsed * 0.65) * 14;

      // Center DotNexus Core heartbeat pulse
      const coreHeartbeat = 0.85 + Math.sin(elapsed * 3.2) * 0.15;
      centerLight.intensity = 4.0 * coreHeartbeat;

      // Influence radius for mouse wave
      const WAVE_RADIUS = 68;
      const MAX_ELEVATION = 20;

      // Update Node States
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        // 1. Ambient undulating network breathing wave
        const ambientWave = Math.sin(elapsed * 1.6 + n.col * 0.38 + n.row * 0.28) * 2.2;

        // 2. Mouse distance calculation (pure perpendicular elevation, zero tilt)
        let mouseLift = 0;

        if (isMouseOver && mouseNorm.x > -2) {
          const dx = planeIntersect.x - n.baseX;
          const dy = planeIntersect.y - n.baseY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < WAVE_RADIUS) {
            const normDist = dist / WAVE_RADIUS;
            const factor = Math.cos(normDist * (Math.PI / 2));
            mouseLift = factor * MAX_ELEVATION;

            // Subtle glow flare
            n.glowIntensity += (factor - n.glowIntensity) * 0.2;
          } else {
            n.glowIntensity += (0 - n.glowIntensity) * 0.08;
          }
        } else {
          n.glowIntensity += (0 - n.glowIntensity) * 0.08;
        }

        // 3. Spring physics: update perpendicular Z displacement
        // Master node has a slight natural baseline prominence (+3.0 Z)
        const baselineOffset = n.isMasterNode ? 3.0 : 0;
        n.targetZ = n.baseZ + baselineOffset + ambientWave + mouseLift;
        n.currentZ += (n.targetZ - n.currentZ) * 0.12;
        n.mesh.position.z = n.currentZ;

        // Fixed plane: zero rotational tilt
        n.mesh.rotation.set(0, 0, 0);

        // 4. Subtle, Craft-Floor Compliant Emissive & Edge Shading
        const mat = n.mesh.material;
        const edgeMat = n.edgeMesh.material;
        const capMat = n.capMesh.material;

        if (n.glowIntensity > 0.01) {
          // Softened emissive lerp (non-glaring)
          mat.emissive.lerpColors(n.baseColor, n.activeColor, n.glowIntensity * 0.35);
          mat.emissiveIntensity = (n.isMasterNode ? 0.22 : 0.1) + n.glowIntensity * 0.32;

          edgeMat.opacity = (n.isMasterNode ? 0.75 : 0.45) + n.glowIntensity * 0.22;
          capMat.opacity = (n.isMasterNode ? 0.65 : 0.35) + n.glowIntensity * 0.22;

          // Socket terminals highlight
          n.socketMeshes.forEach((sm) => {
            sm.material.opacity = 0.55 + n.glowIntensity * 0.35;
          });

          // Micro scale pop
          const s = 1 + n.glowIntensity * 0.04;
          n.mesh.scale.set(s, s, s);
        } else {
          mat.emissive.copy(n.baseColor);
          mat.emissiveIntensity = n.isMasterNode ? (0.22 * coreHeartbeat) : 0.1;
          edgeMat.opacity = n.isMasterNode ? 0.75 : 0.45;
          capMat.opacity = n.isMasterNode ? (0.65 * coreHeartbeat) : 0.35;

          n.socketMeshes.forEach((sm) => {
            sm.material.opacity = 0.55;
          });

          n.mesh.scale.set(1, 1, 1);
        }
      }

      // 5. Update Telemetry Packets along Network Conduits
      const posAttr = packetGeo.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < PACKET_COUNT; i++) {
        const p = packets[i];
        p.progress += p.speed;

        if (p.progress >= 1) {
          p.progress = 0;
          p.segIndex = Math.floor(Math.random() * segments.length);
        }

        const seg = segments[p.segIndex];
        const t = p.reverse ? (1 - p.progress) : p.progress;

        const px = seg.x1 + (seg.x2 - seg.x1) * t;
        const py = seg.y1 + (seg.y2 - seg.y1) * t;
        const pz = 1.2 + Math.sin(t * Math.PI) * 1.5;

        posArray[i * 3] = px;
        posArray[i * 3 + 1] = py;
        posArray[i * 3 + 2] = pz;
      }
      posAttr.needsUpdate = true;

      // Subtle conduit line glow breathing
      conduitMat.opacity = 0.30 + Math.sin(elapsed * 2.0) * 0.06;

      // Slow cyber dust drift
      dustPoints.rotation.y = elapsed * 0.02;
      dustPoints.rotation.x = Math.sin(elapsed * 0.015) * 0.03;

      renderer.render(scene, camera);
    };

    animate();

    // 10. Cleanup & Resource Disposal
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      cancelAnimationFrame(animId);

      renderer.dispose();
      standardBoxGeo.dispose();
      standardEdgesGeo.dispose();
      standardCapGeo.dispose();
      coreBoxGeo.dispose();
      coreEdgesGeo.dispose();
      coreCapGeo.dispose();
      socketGeo.dispose();
      conduitGeo.dispose();
      conduitMat.dispose();
      packetGeo.dispose();
      packetMat.dispose();
      dustGeometry.dispose();
      dustMaterial.dispose();

      nodes.forEach((n) => {
        n.mesh.material.dispose();
        n.edgeMesh.material.dispose();
        n.capMesh.material.dispose();
        n.socketMeshes.forEach((sm) => sm.material.dispose());
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
