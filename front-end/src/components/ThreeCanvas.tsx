import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const ThreeCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0813, 0.0012);

    const width = mount.clientWidth;
    const height = mount.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 260;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Group for entire interactive network
    const networkGroup = new THREE.Group();
    scene.add(networkGroup);

    // Dynamic Cyber Lights
    const pointLightWasm = new THREE.PointLight(0xe6007a, 3, 300);
    pointLightWasm.position.set(-120, 50, 80);
    scene.add(pointLightWasm);

    const pointLightEvm = new THREE.PointLight(0x6366f1, 3, 300);
    pointLightEvm.position.set(120, -50, 80);
    scene.add(pointLightEvm);

    const ambientLight = new THREE.AmbientLight(0x2a164d, 1.5);
    scene.add(ambientLight);

    // 1. Central Core: DotNexus Neural Icosahedron
    const coreGeo = new THREE.IcosahedronGeometry(48, 2);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    networkGroup.add(coreMesh);

    // Inner Glowing Core
    const innerGeo = new THREE.SphereGeometry(28, 16, 16);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    networkGroup.add(innerMesh);

    // 2. Dual-VM Constellation Nodes (WASM Magenta vs EVM Indigo)
    const nodeCount = 220;
    const positions = new Float32Array(nodeCount * 3);
    const colors = new Float32Array(nodeCount * 3);

    const wasmColor = new THREE.Color(0xe6007a);
    const evmColor = new THREE.Color(0x6366f1);

    const nodeVectors: THREE.Vector3[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const isWasm = i % 2 === 0;
      const angle = (i / nodeCount) * Math.PI * 2 * 3;
      const radius = 65 + Math.random() * 95;
      const yOffset = (Math.random() - 0.5) * 110;

      // Position WASM biased towards left (-x), EVM towards right (+x)
      const xSpread = isWasm ? -Math.abs(Math.cos(angle) * radius) : Math.abs(Math.cos(angle) * radius);
      const zSpread = Math.sin(angle) * radius;

      const vec = new THREE.Vector3(xSpread, yOffset, zSpread);
      nodeVectors.push(vec);

      positions[i * 3] = vec.x;
      positions[i * 3 + 1] = vec.y;
      positions[i * 3 + 2] = vec.z;

      const c = isWasm ? wasmColor : evmColor;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const nodeGeometry = new THREE.BufferGeometry();
    nodeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    nodeGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const nodeMaterial = new THREE.PointsMaterial({
      size: 4.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const nodePoints = new THREE.Points(nodeGeometry, nodeMaterial);
    networkGroup.add(nodePoints);

    // 3. Dynamic Neural Synapse Lines
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x582c9e,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
    });

    const linePositions: number[] = [];
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dist = nodeVectors[i].distanceTo(nodeVectors[j]);
        if (dist < 48) {
          linePositions.push(nodeVectors[i].x, nodeVectors[i].y, nodeVectors[i].z);
          linePositions.push(nodeVectors[j].x, nodeVectors[j].y, nodeVectors[j].z);
        }
      }
    }

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    networkGroup.add(lineMesh);

    // 4. Floating Holographic Data Rings
    const ringGeo1 = new THREE.RingGeometry(115, 117, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0xe6007a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const ringMesh1 = new THREE.Mesh(ringGeo1, ringMat1);
    ringMesh1.rotation.x = Math.PI / 3;
    networkGroup.add(ringMesh1);

    const ringGeo2 = new THREE.RingGeometry(140, 142, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
    ringMesh2.rotation.x = -Math.PI / 4;
    networkGroup.add(ringMesh2);

    // 5. Background Cybernetic Star Dust (Floating Embers)
    const dustCount = 400;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 800;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 600;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 600;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0x8b5cf6,
      size: 2.5,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    scene.add(dustPoints);

    // Mouse Interaction Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      mouseX = x / 350;
      mouseY = y / 350;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth damped rotation with mouse tilt
      targetRotationY += (mouseX - targetRotationY) * 0.05;
      targetRotationX += (mouseY - targetRotationX) * 0.05;

      networkGroup.rotation.y = elapsed * 0.18 + targetRotationY;
      networkGroup.rotation.x = Math.sin(elapsed * 0.12) * 0.1 + targetRotationX * 0.4;

      // Pulse core
      const scale = 1 + Math.sin(elapsed * 2.2) * 0.06;
      coreMesh.scale.set(scale, scale, scale);
      innerMesh.rotation.y = -elapsed * 0.4;
      innerMesh.rotation.z = elapsed * 0.25;

      // Rotate data rings
      ringMesh1.rotation.z = elapsed * 0.22;
      ringMesh2.rotation.z = -elapsed * 0.28;

      // Slowly rotate star dust
      dustPoints.rotation.y = elapsed * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);

      renderer.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      nodeGeometry.dispose();
      nodeMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      dustGeo.dispose();
      dustMat.dispose();

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
