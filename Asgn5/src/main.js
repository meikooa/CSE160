import * as THREE from 'three';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const textureLoader = new THREE.TextureLoader();
const skyTexture = textureLoader.load('../texture/sky.jpg');
const rockTexture = textureLoader.load('../texture/rock.jpg');
const wallTexture = textureLoader.load('../texture/wall.jpg');
const woodTexture = textureLoader.load('../texture/wood.png');
const breakWallTexture = textureLoader.load('../texture/CanBreak_wall.jpg');

skyTexture.colorSpace = THREE.SRGBColorSpace;
scene.background = skyTexture;

function createBlockMaterial(texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestMipmapNearestFilter;
  return new THREE.MeshStandardMaterial({ map: texture });
}

const blockMaterials = {
  1: createBlockMaterial(breakWallTexture),
  2: createBlockMaterial(rockTexture),
  3: createBlockMaterial(woodTexture),
  4: createBlockMaterial(wallTexture)
};

const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.95);
directionalLight.position.set(12, 20, 8);
scene.add(directionalLight);

const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
const blockGroup = new THREE.Group();
scene.add(blockGroup);

const blocks = new Map();
const worldHalfSize = 14;
const maxBuildHeight = 10;

function blockKey(x, y, z) {
  return `${x},${y},${z}`;
}

function addBlock(x, y, z, blockType, locked = false) {
  const key = blockKey(x, y, z);
  if (blocks.has(key)) return false;

  const material = blockMaterials[blockType] ?? blockMaterials[1];
  const mesh = new THREE.Mesh(blockGeometry, material);
  mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
  mesh.userData = { x, y, z, blockType, locked };
  blockGroup.add(mesh);
  blocks.set(key, mesh);
  return true;
}

function removeBlock(x, y, z) {
  const key = blockKey(x, y, z);
  const mesh = blocks.get(key);
  if (!mesh || mesh.userData.locked) return false;
  blockGroup.remove(mesh);
  blocks.delete(key);
  return true;
}

function hasBlock(x, y, z) {
  return blocks.has(blockKey(x, y, z));
}

function buildWorld() {
  for (let x = -worldHalfSize; x <= worldHalfSize; x += 1) {
    for (let z = -worldHalfSize; z <= worldHalfSize; z += 1) {
      addBlock(x, 0, z, 2, true);
    }
  }

  for (let y = 1; y <= 3; y += 1) {
    for (let i = -worldHalfSize; i <= worldHalfSize; i += 1) {
      addBlock(-worldHalfSize, y, i, 4, true);
      addBlock(worldHalfSize, y, i, 4, true);
      addBlock(i, y, -worldHalfSize, 4, true);
      addBlock(i, y, worldHalfSize, 4, true);
    }
  }

  for (let x = -5; x <= 5; x += 5) {
    for (let z = -5; z <= 5; z += 5) {
      for (let y = 1; y <= 2; y += 1) {
        addBlock(x, y, z, 1, false);
      }
    }
  }
}

buildWorld();

const controlsInfo = document.createElement('div');
controlsInfo.style.position = 'fixed';
controlsInfo.style.left = '12px';
controlsInfo.style.top = '10px';
controlsInfo.style.padding = '10px 12px';
controlsInfo.style.background = 'rgba(0, 0, 0, 0.55)';
controlsInfo.style.color = '#fff';
controlsInfo.style.fontFamily = 'monospace';
controlsInfo.style.fontSize = '13px';
controlsInfo.style.lineHeight = '1.35';
controlsInfo.style.borderRadius = '6px';
controlsInfo.style.zIndex = '10';
controlsInfo.style.userSelect = 'none';
document.body.appendChild(controlsInfo);

function selectedBlockLabel(type) {
  if (type === 1) return 'CanBreak wall';
  if (type === 2) return 'Rock';
  if (type === 3) return 'Wood';
  return 'Wall';
}

let selectedBlockType = 1;

function refreshHud() {
  const lockHint = document.pointerLockElement === renderer.domElement
    ? 'Mouse lock: ON'
    : 'Click canvas to lock mouse';

  controlsInfo.textContent =
    `${lockHint} | WASD move | Q/E turn | Mouse look | Left click place | Right click remove | 1/2/3 select | Block: ${selectedBlockLabel(selectedBlockType)}`;
}

refreshHud();

const crosshair = document.createElement('div');
crosshair.style.position = 'fixed';
crosshair.style.left = '50%';
crosshair.style.top = '50%';
crosshair.style.width = '10px';
crosshair.style.height = '10px';
crosshair.style.marginLeft = '-5px';
crosshair.style.marginTop = '-5px';
crosshair.style.border = '2px solid rgba(255,255,255,0.85)';
crosshair.style.borderRadius = '50%';
crosshair.style.pointerEvents = 'none';
crosshair.style.zIndex = '9';
document.body.appendChild(crosshair);

camera.position.set(0.5, 1.7, 8.5);

let yaw = 0;
let pitch = -0.08;

function applyCameraRotation() {
  camera.rotation.order = 'YXZ';
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
}

applyCameraRotation();

const keyState = new Set();
const up = new THREE.Vector3(0, 1, 0);
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const moveDirection = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const rayDirection = new THREE.Vector3();

const moveSpeed = 5.5;
const turnSpeed = 1.9;
const mouseSensitivity = 0.0022;
const maxReachDistance = 6;
const playerRadius = 0.28;

function canOccupy(testX, testZ) {
  const offsets = [
    [-playerRadius, -playerRadius],
    [playerRadius, -playerRadius],
    [-playerRadius, playerRadius],
    [playerRadius, playerRadius]
  ];

  for (const [ox, oz] of offsets) {
    const cellX = Math.floor(testX + ox);
    const cellZ = Math.floor(testZ + oz);

    if (hasBlock(cellX, 1, cellZ) || hasBlock(cellX, 2, cellZ)) {
      return false;
    }
  }
  return true;
}

function updateMovement(deltaSeconds) {
  if (keyState.has('KeyQ')) yaw += turnSpeed * deltaSeconds;
  if (keyState.has('KeyE')) yaw -= turnSpeed * deltaSeconds;
  applyCameraRotation();

  camera.getWorldDirection(forward);
  forward.y = 0;
  if (forward.lengthSq() > 0) forward.normalize();
  right.crossVectors(forward, up).normalize();

  moveDirection.set(0, 0, 0);
  if (keyState.has('KeyW')) moveDirection.add(forward);
  if (keyState.has('KeyS')) moveDirection.sub(forward);
  if (keyState.has('KeyD')) moveDirection.add(right);
  if (keyState.has('KeyA')) moveDirection.sub(right);

  if (moveDirection.lengthSq() === 0) return;
  moveDirection.normalize().multiplyScalar(moveSpeed * deltaSeconds);

  const nextX = camera.position.x + moveDirection.x;
  const nextZ = camera.position.z + moveDirection.z;

  if (canOccupy(nextX, camera.position.z)) camera.position.x = nextX;
  if (canOccupy(camera.position.x, nextZ)) camera.position.z = nextZ;
}

function raycastFromCamera() {
  camera.getWorldDirection(rayDirection);
  raycaster.set(camera.position, rayDirection);
  const hits = raycaster.intersectObjects(blockGroup.children, false);
  for (const hit of hits) {
    if (hit.distance <= maxReachDistance) return hit;
  }
  return null;
}

function placeBlock() {
  const hit = raycastFromCamera();
  if (!hit || !hit.face) return;

  const hitNormal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
  const placePoint = hit.point.clone().addScaledVector(hitNormal, 0.5);

  const x = Math.floor(placePoint.x);
  const y = Math.floor(placePoint.y);
  const z = Math.floor(placePoint.z);

  if (Math.abs(x) > worldHalfSize || Math.abs(z) > worldHalfSize) return;
  if (y < 1 || y > maxBuildHeight) return;

  const blockCenterX = x + 0.5;
  const blockCenterZ = z + 0.5;
  const tooClose = Math.abs(blockCenterX - camera.position.x) < 0.6
    && Math.abs(blockCenterZ - camera.position.z) < 0.6
    && y <= 2;
  if (tooClose) return;

  addBlock(x, y, z, selectedBlockType, false);
}

function removeLookedAtBlock() {
  const hit = raycastFromCamera();
  if (!hit) return;
  const { x, y, z } = hit.object.userData;
  removeBlock(x, y, z);
}

renderer.domElement.addEventListener('contextmenu', (ev) => {
  ev.preventDefault();
});

renderer.domElement.addEventListener('mousedown', (ev) => {
  if (document.pointerLockElement !== renderer.domElement) {
    renderer.domElement.requestPointerLock();
    return;
  }

  if (ev.button === 0) placeBlock();
  if (ev.button === 2) removeLookedAtBlock();
});

document.addEventListener('pointerlockchange', refreshHud);

document.addEventListener('mousemove', (ev) => {
  if (document.pointerLockElement !== renderer.domElement) return;

  yaw -= ev.movementX * mouseSensitivity;
  pitch -= ev.movementY * mouseSensitivity;

  const pitchLimit = Math.PI / 2 - 0.03;
  pitch = Math.max(-pitchLimit, Math.min(pitchLimit, pitch));
  applyCameraRotation();
});

document.addEventListener('keydown', (ev) => {
  keyState.add(ev.code);

  if (ev.code === 'Digit1') selectedBlockType = 1;
  if (ev.code === 'Digit2') selectedBlockType = 2;
  if (ev.code === 'Digit3') selectedBlockType = 3;

  refreshHud();
});

document.addEventListener('keyup', (ev) => {
  keyState.delete(ev.code);
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  updateMovement(delta);
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
