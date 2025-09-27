'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default function RaspberryPiScene() {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(
      38,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(5, 3.9, 4.8);
    camera.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = false;
    renderer.setClearColor(0x000000, 0);
    if (renderer.outputColorSpace !== undefined) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else {
      renderer.outputEncoding = THREE.sRGBEncoding;
    }
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.physicallyCorrectLights = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 3.2;
    controls.maxDistance = 6.4;
    controls.maxPolarAngle = Math.PI / 1.9;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.45;

    const boardGroup = new THREE.Group();
    scene.add(boardGroup);

    const loader = new GLTFLoader();
    loader.load(
      '/raspberry-3d.glb',
      (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
          if (child.isMesh) {
            if (child.material) {
              child.material.needsUpdate = true;
            }
          }
        });

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = 3.5/ maxDim;
        model.scale.setScalar(scale);

        box.setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        model.position.y += (size.y * scale) / 2 + 0.08;

        boardGroup.add(model);
      },
      undefined,
      (error) => {
        console.error('Failed to load raspberry-3d.glb', error);
      }
    );

    const ambientLight = new THREE.HemisphereLight('#b5d2ff', '#050912', 1.05);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight('#f8fbff', 1.55);
    keyLight.position.set(2.8, 6.8, 4.6);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight('#6ae7d2', 1.45, 28);
    rimLight.position.set(-4.6, 3.3, -5.4);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight('#ffbfa1', 0.98);
    fillLight.position.set(-2.1, 4.2, 4.2);
    scene.add(fillLight);

    const accentLight = new THREE.SpotLight('#9fb6ff', 1.15, 22, Math.PI / 7, 0.5, 1.45);
    accentLight.position.set(0.6, 8.2, 0.4);
    accentLight.target.position.set(0, 0.6, 0);
    scene.add(accentLight);
    scene.add(accentLight.target);

    boardGroup.rotation.x = -0.18;
    boardGroup.rotation.y = 0.6;

    controls.target.set(0, 0.35, 0);
    controls.update();

    const handleControlStart = () => {
      controls.autoRotate = false;
    };
    const handleControlEnd = () => {
      controls.autoRotate = true;
    };
    controls.addEventListener('start', handleControlStart);
    controls.addEventListener('end', handleControlEnd);

    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const { clientWidth, clientHeight } = container;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    handleResize();

    return () => {
      cancelAnimationFrame(animationRef.current ?? 0);
      resizeObserver.disconnect();
      container.removeChild(renderer.domElement);
      renderer.dispose();
      controls.dispose();
      controls.removeEventListener('start', handleControlStart);
      controls.removeEventListener('end', handleControlEnd);
      scene.traverse((object) => {
        if (object.isMesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose?.());
          } else {
            object.material.dispose?.();
          }
        }
      });
    };
  }, []);

  return <div ref={containerRef} className="relative z-10 h-full w-full" />;
}
