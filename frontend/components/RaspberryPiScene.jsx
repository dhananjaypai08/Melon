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
    camera.position.set(5.5, 4.2, 5.5);
    camera.lookAt(0, 0.3, 0);

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
    controls.minDistance = 3.8;
    controls.maxDistance = 7.5;
    controls.maxPolarAngle = Math.PI / 2.05;
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
        const scale = 3.6 / maxDim;
        model.scale.setScalar(scale);

        box.setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        model.position.y += (size.y * scale) / 2;

        boardGroup.add(model);
      },
      undefined,
      (error) => {
        console.error('Failed to load raspberry-3d.glb', error);
      }
    );

    const ambientLight = new THREE.HemisphereLight('#a9c9ff', '#0c1324', 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight('#f2f5ff', 1.35);
    keyLight.position.set(3.2, 6.5, 5.1);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight('#6ae7d2', 1.35, 28);
    rimLight.position.set(-5.2, 3.5, -5.8);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight('#ffbfa1', 0.92);
    fillLight.position.set(-2.2, 4.2, 3.9);
    scene.add(fillLight);

    const accentLight = new THREE.SpotLight('#7f8cff', 0.75, 18, Math.PI / 6, 0.45, 1.2);
    accentLight.position.set(1.8, 5.8, -3.2);
    accentLight.target.position.set(0, 0.2, 0);
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
