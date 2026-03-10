import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ----------------------
// Scene
// ----------------------

const scene = new THREE.Scene();


// ----------------------
// Camera
// ----------------------

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(0, 6, 12);


// ----------------------
// Renderer
// ----------------------

const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);


// ----------------------
// Controls
// ----------------------

const controls = new OrbitControls(camera, renderer.domElement);

controls.enableDamping = true;


// ----------------------
// Texture Loader
// ----------------------

const textureLoader = new THREE.TextureLoader();

const skyTexture = textureLoader.load('../texture/sky.jpg');
const rockTexture = textureLoader.load('../texture/rock.jpg');
const wallTexture = textureLoader.load('../texture/wall.jpg');
const woodTexture = textureLoader.load('../texture/wood.png');
const breakWallTexture = textureLoader.load('../texture/CanBreak_wall.jpg');


// Background sky
scene.background = skyTexture;


// ----------------------
// Materials
// ----------------------

const rockMaterial = new THREE.MeshStandardMaterial({
  map: rockTexture
});

const wallMaterial = new THREE.MeshStandardMaterial({
  map: wallTexture
});

const woodMaterial = new THREE.MeshStandardMaterial({
  map: woodTexture
});

const breakWallMaterial = new THREE.MeshStandardMaterial({
  map: breakWallTexture
});


// ----------------------
// Lights (3 types)
// ----------------------

// Ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);


// Directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);

directionalLight.position.set(5, 10, 5);

scene.add(directionalLight);


// Point light
const pointLight = new THREE.PointLight(0xffaa00, 2, 50);

pointLight.position.set(0, 5, 0);

scene.add(pointLight);


// ----------------------
// Ground
// ----------------------

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50),
  new THREE.MeshStandardMaterial({ map: rockTexture })
);

ground.rotation.x = -Math.PI / 2;

scene.add(ground);


// ----------------------
// Walls (textured cubes)
// ----------------------

for (let i = 0; i < 8; i++) {

  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2),
    wallMaterial
  );

  wall.position.set(
    Math.random() * 20 - 10,
    1,
    Math.random() * 20 - 10
  );

  scene.add(wall);

}


// ----------------------
// Breakable Walls
// ----------------------

const breakableWalls = [];

for (let i = 0; i < 4; i++) {

  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2),
    breakWallMaterial
  );

  wall.position.set(
    Math.random() * 20 - 10,
    1,
    Math.random() * 20 - 10
  );

  breakableWalls.push(wall);

  scene.add(wall);

}


// ----------------------
// Rocks (spheres)
// ----------------------

for (let i = 0; i < 5; i++) {

  const rock = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 32),
    rockMaterial
  );

  rock.position.set(
    Math.random() * 20 - 10,
    1,
    Math.random() * 20 - 10
  );

  scene.add(rock);

}


// ----------------------
// Trees (cylinders)
// ----------------------

for (let i = 0; i < 5; i++) {

  const tree = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 3, 32),
    woodMaterial
  );

  tree.position.set(
    Math.random() * 20 - 10,
    1.5,
    Math.random() * 20 - 10
  );

  scene.add(tree);

}

const gltfLoader = new GLTFLoader();

gltfLoader.load('../model/3Dmodel.glb', function (gltf) {

    const model = gltf.scene;

    model.scale.set(2, 2, 2);   // resize if needed
    model.position.set(0, 0, -5);

    scene.add(model);

});


// ----------------------
// Animated Object
// ----------------------

const animatedCube = new THREE.Mesh(
  new THREE.BoxGeometry(2, 2, 2),
  woodMaterial
);

animatedCube.position.set(0, 1, 0);

scene.add(animatedCube);


// ----------------------
// Animation Loop
// ----------------------

function animate() {

  requestAnimationFrame(animate);

  // rotating cube
  animatedCube.rotation.x += 0.01;
  animatedCube.rotation.y += 0.01;

  // rotating breakable walls
  breakableWalls.forEach(wall => {
    wall.rotation.y += 0.01;
  });

  controls.update();

  renderer.render(scene, camera);

}

animate();


// ----------------------
// Resize Handling
// ----------------------

window.addEventListener('resize', () => {

  camera.aspect = window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

});
