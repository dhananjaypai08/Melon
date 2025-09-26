'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default function RaspberryPiScene() {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#101a2e');

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
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const boardGroup = new THREE.Group();
    scene.add(boardGroup);

    const loader = new GLTFLoader();
    loader.load(
      '/raspberry-3d.glb',
      (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.needsUpdate = true;
            }
          }
        });

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = 2.8 / maxDim;
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

    const ambientLight = new THREE.AmbientLight('#9cb7ff', 0.55);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight('#c3d4ff', 1.15);
    keyLight.position.set(3.2, 6.5, 5.5);
    keyLight.castShadow = true;
    keyLight.shadow.bias = -0.0004;
    scene.add(keyLight);

    const rimLight = new THREE.PointLight('#7ad7c9', 1, 24);
    rimLight.position.set(-5, 3, -6);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight('#ffd2a8', 0.65);
    fillLight.position.set(-2.5, 4.5, 3.5);
    scene.add(fillLight);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.ShadowMaterial({ opacity: 0.25 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.12;
    ground.receiveShadow = true;
    scene.add(ground);

    boardGroup.rotation.x = -0.18;
    boardGroup.rotation.y = 0.6;

    const animate = () => {
      boardGroup.rotation.y += 0.0028;
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

  return <div ref={containerRef} className="h-full w-full" />;
}
