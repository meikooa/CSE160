import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';

// WOW POINT NOTE:
// Valorant-inspired FPS loop with gate, weapon shooting, target cooldown skill,
// enemy retaliation, hit-based restart, collectible rotating coins, and block editing.

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
scene.add(camera);

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

const skyBox = new THREE.Mesh(
  new THREE.BoxGeometry(260, 260, 260),
  new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide })
);
scene.add(skyBox);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.75);
directionalLight.position.set(15, 22, 10);
scene.add(directionalLight);

const hemisphereLight = new THREE.HemisphereLight(0x89b4ff, 0x334422, 0.45);
scene.add(hemisphereLight);

const pointLight = new THREE.PointLight(0xffb347, 0.8, 80);
pointLight.position.set(0, 9, 5);
scene.add(pointLight);

const spotLight = new THREE.SpotLight(0xffffff, 0.7, 70, Math.PI / 5, 0.3);
spotLight.position.set(-8, 16, 12);
spotLight.target.position.set(0, 0, 0);
scene.add(spotLight);
scene.add(spotLight.target);

const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
const blockGroup = new THREE.Group();
scene.add(blockGroup);

const blocks = new Map();
const worldHalfSize = 10;
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
}

buildWorld();

const gateGroup = new THREE.Group();
scene.add(gateGroup);

const animatedGateSpheres = [];

function buildStartGate() {
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x787878, roughness: 0.35 });
  const beamMat = new THREE.MeshStandardMaterial({ color: 0x303030, metalness: 0.6, roughness: 0.2 });
  const glowMat = new THREE.MeshStandardMaterial({ color: 0x44ccff, emissive: 0x225599, emissiveIntensity: 1.4 });

  const leftPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 3.4, 18), pillarMat);
  leftPillar.position.set(-1.9, 1.7, 7.2);
  gateGroup.add(leftPillar);

  const rightPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 3.4, 18), pillarMat);
  rightPillar.position.set(1.9, 1.7, 7.2);
  gateGroup.add(rightPillar);

  const topBeam = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.8, 0.9), beamMat);
  topBeam.position.set(0, 3.4, 7.2);
  gateGroup.add(topBeam);

  const sideBoxLeft = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), beamMat);
  sideBoxLeft.position.set(-2.4, 2.6, 7.2);
  gateGroup.add(sideBoxLeft);

  const sideBoxRight = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), beamMat);
  sideBoxRight.position.set(2.4, 2.6, 7.2);
  gateGroup.add(sideBoxRight);

  const orbLeft = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 18), glowMat);
  orbLeft.position.set(-1.9, 3.5, 7.2);
  gateGroup.add(orbLeft);
  animatedGateSpheres.push(orbLeft);

  const orbRight = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 18), glowMat);
  orbRight.position.set(1.9, 3.5, 7.2);
  gateGroup.add(orbRight);
  animatedGateSpheres.push(orbRight);
}

buildStartGate();

// Extra geometry to make the map feel denser
const decorGroup = new THREE.Group();
scene.add(decorGroup);
const decorModelGroup = new THREE.Group();
scene.add(decorModelGroup);
const destructibleSkyOrbs = [];

function addDecorProps() {
  const crateMat = new THREE.MeshStandardMaterial({ map: woodTexture });
  const stoneMat = new THREE.MeshStandardMaterial({ map: wallTexture });
  const orbMat = new THREE.MeshStandardMaterial({ color: 0x6ad6ff, emissive: 0x113355, emissiveIntensity: 0.9 });

  const cratePositions = [
    [-6, 0.55, -5], [-4, 0.55, -1], [-7, 0.55, 2], [-2, 0.55, 5],
    [2, 0.55, -4], [4, 0.55, -1], [7, 0.55, 2], [6, 0.55, 6],
    [-1, 0.55, -7], [1, 0.55, 7], [5, 0.55, -7], [-5, 0.55, 7]
  ];
  for (const [x, y, z] of cratePositions) {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), crateMat);
    crate.position.set(x, y, z);
    decorGroup.add(crate);
  }

  const columnPositions = [
    [-8, 1.5, -3], [-8, 1.5, 3], [8, 1.5, -3], [8, 1.5, 3],
    [-3, 1.5, -8], [3, 1.5, -8], [-3, 1.5, 8], [3, 1.5, 8]
  ];
  for (const [x, y, z] of columnPositions) {
    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 3.0, 16), stoneMat);
    column.position.set(x, y, z);
    decorGroup.add(column);
  }

  const orbPositions = [
    [-6, 4.8, 6], [-2, 5.4, -2], [2, 4.6, 3], [6, 5.2, -6], [0, 6.1, -5], [5, 5.0, 5]
  ];
  for (let i = 0; i < orbPositions.length; i += 1) {
    const [x, y, z] = orbPositions[i];
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 14), orbMat);
    orb.position.set(x, y, z);
    orb.userData = {
      isSkyOrb: true,
      baseY: y,
      phase: i * 0.9
    };
    decorGroup.add(orb);
    destructibleSkyOrbs.push(orb);
  }
}

addDecorProps();

const controlsInfo = document.createElement('div');
controlsInfo.style.position = 'fixed';
controlsInfo.style.left = '12px';
controlsInfo.style.top = '10px';
controlsInfo.style.padding = '10px 12px';
controlsInfo.style.background = 'rgba(0, 0, 0, 0.6)';
controlsInfo.style.color = '#fff';
controlsInfo.style.fontFamily = 'monospace';
controlsInfo.style.fontSize = '13px';
controlsInfo.style.lineHeight = '1.4';
controlsInfo.style.borderRadius = '6px';
controlsInfo.style.zIndex = '10';
controlsInfo.style.whiteSpace = 'pre-line';
controlsInfo.style.userSelect = 'none';
document.body.appendChild(controlsInfo);

const statusPrompt = document.createElement('div');
statusPrompt.style.position = 'fixed';
statusPrompt.style.left = '50%';
statusPrompt.style.top = '76px';
statusPrompt.style.transform = 'translateX(-50%)';
statusPrompt.style.padding = '8px 12px';
statusPrompt.style.background = 'rgba(10, 10, 10, 0.8)';
statusPrompt.style.color = '#ffed8b';
statusPrompt.style.fontFamily = 'monospace';
statusPrompt.style.fontSize = '15px';
statusPrompt.style.borderRadius = '6px';
statusPrompt.style.border = '1px solid rgba(255, 230, 130, 0.45)';
statusPrompt.style.zIndex = '11';
statusPrompt.style.opacity = '0';
statusPrompt.style.transition = 'opacity 0.15s linear';
statusPrompt.style.pointerEvents = 'none';
document.body.appendChild(statusPrompt);

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

let score = 0;
let playerHits = 0;
let enemyKills = 0;
let mode = 1;
let pendingRestart = false;
let multiShotEndsAt = -1;

const targetSkillCooldown = 10;
let lastTargetSkillUse = -1000;
let promptTimer = 0;

function showPrompt(text, duration = 1.2) {
  statusPrompt.textContent = text;
  statusPrompt.style.opacity = '1';
  promptTimer = duration;
}

function modeLabel() {
  if (mode === 1) return 'Mode 1 (Rifle)';
  if (mode === 2) return 'Mode 2 (Target Skill)';
  return 'Unknown';
}

function refreshHud(elapsed = 0) {
  const lockHint = document.pointerLockElement === renderer.domElement
    ? 'Mouse lock: ON'
    : 'Click canvas to lock mouse';
  const ready = Math.max(0, elapsed - lastTargetSkillUse);
  const skillState = ready >= targetSkillCooldown
    ? 'Ready'
    : `${ready.toFixed(1)}/10s`;
  const multiShotLeft = Math.max(0, multiShotEndsAt - elapsed);
  const multiShotState = multiShotLeft > 0 ? `${multiShotLeft.toFixed(1)}s` : 'OFF';

  controlsInfo.textContent =
` ${lockHint}
 WASD move | Q/E turn | Mouse look
 Left click: fire | Right click: place block
 Key 1: rifle mode | Key 2: spawn 4 targets (10s CD)
 F: remove looked-at block
 Hits: ${playerHits}/5  Kills: ${enemyKills}  Coins: ${score}
 Skill-2: ${skillState}
 Multishot: ${multiShotState}
 ${modeLabel()}
 Wow point: Valorant-style gate + FPS combat loop`;
}

const clock = new THREE.Clock();
refreshHud(0);

camera.position.set(0.5, 1.7, 8.7);
let yaw = 0;
let pitch = -0.05;

function applyCameraRotation() {
  camera.rotation.order = 'YXZ';
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
}

applyCameraRotation();

const keyState = new Set();
const worldUp = new THREE.Vector3(0, 1, 0);
const moveForward = new THREE.Vector3();
const moveRight = new THREE.Vector3();
const moveDirection = new THREE.Vector3();
const lookDirection = new THREE.Vector3();
const tempVec = new THREE.Vector3();
const raycaster = new THREE.Raycaster();

const moveSpeed = 5.4;
const turnSpeed = 2.1;
const mouseSensitivity = 0.0021;
const maxReachDistance = 6;
const playerRadius = 0.28;

const bulletGeometry = new THREE.CylinderGeometry(0.045, 0.045, 0.46, 8);
const playerBulletMaterial = new THREE.MeshStandardMaterial({
  color: 0xffd27a,
  emissive: 0xff8f33,
  emissiveIntensity: 1.4
});
const enemyBulletMaterial = new THREE.MeshStandardMaterial({
  color: 0xff5577,
  emissive: 0xaa1133,
  emissiveIntensity: 1.5
});
const bulletGroup = new THREE.Group();
scene.add(bulletGroup);

const playerBullets = [];
const enemyBullets = [];
let shootCooldown = 0;
let damageCooldown = 0;
const spreadRight = new THREE.Vector3();
const spreadUp = new THREE.Vector3();

function activateMultiShot(elapsed) {
  multiShotEndsAt = Math.max(multiShotEndsAt, elapsed) + 3.0;
  showPrompt('Sky orb destroyed: Multishot 3.0s');
}

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
    if (hasBlock(cellX, 1, cellZ) || hasBlock(cellX, 2, cellZ)) return false;
  }
  return true;
}

function updateMovement(deltaSeconds) {
  if (keyState.has('KeyQ')) yaw += turnSpeed * deltaSeconds;
  if (keyState.has('KeyE')) yaw -= turnSpeed * deltaSeconds;
  applyCameraRotation();

  camera.getWorldDirection(moveForward);
  moveForward.y = 0;
  if (moveForward.lengthSq() > 0) moveForward.normalize();
  moveRight.crossVectors(moveForward, worldUp).normalize();

  moveDirection.set(0, 0, 0);
  if (keyState.has('KeyW')) moveDirection.add(moveForward);
  if (keyState.has('KeyS')) moveDirection.sub(moveForward);
  if (keyState.has('KeyD')) moveDirection.add(moveRight);
  if (keyState.has('KeyA')) moveDirection.sub(moveRight);

  if (moveDirection.lengthSq() === 0) return;
  moveDirection.normalize().multiplyScalar(moveSpeed * deltaSeconds);

  const nextX = camera.position.x + moveDirection.x;
  const nextZ = camera.position.z + moveDirection.z;
  if (canOccupy(nextX, camera.position.z)) camera.position.x = nextX;
  if (canOccupy(camera.position.x, nextZ)) camera.position.z = nextZ;
}

const targetGroup = new THREE.Group();
scene.add(targetGroup);
const targetBlocks = [];
const targetGeometry = new THREE.BoxGeometry(1.6, 0.5, 0.5);
const targetMaterial = new THREE.MeshStandardMaterial({ color: 0x88bbff, emissive: 0x223355, roughness: 0.45 });

function spawnTargetsInFront() {
  while (targetBlocks.length > 0) {
    const existing = targetBlocks.pop();
    targetGroup.remove(existing);
  }

  camera.getWorldDirection(tempVec);
  tempVec.y = 0;
  if (tempVec.lengthSq() < 0.001) tempVec.set(0, 0, -1);
  tempVec.normalize();

  const right = new THREE.Vector3().crossVectors(tempVec, worldUp).normalize();
  const base = camera.position.clone().addScaledVector(tempVec, 7);
  base.y = 1.5;
  const facing = Math.atan2(tempVec.x, tempVec.z);

  for (let i = 0; i < 4; i += 1) {
    const target = new THREE.Mesh(targetGeometry, targetMaterial);
    target.position.copy(base).addScaledVector(right, (i - 1.5) * 2.1);
    target.rotation.y = facing;
    target.userData.destructible = true;
    targetGroup.add(target);
    targetBlocks.push(target);
  }
}

function raycastBlocksFromCamera() {
  camera.getWorldDirection(lookDirection);
  raycaster.set(camera.position, lookDirection);
  const hits = raycaster.intersectObjects(blockGroup.children, false);
  for (const hit of hits) {
    if (hit.distance <= maxReachDistance) return hit;
  }
  return null;
}

function placeBlock() {
  const hit = raycastBlocksFromCamera();
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
  const tooClose = Math.abs(blockCenterX - camera.position.x) < 0.7
    && Math.abs(blockCenterZ - camera.position.z) < 0.7
    && y <= 2;
  if (tooClose) return;

  addBlock(x, y, z, 1, false);
}

function removeLookedAtBlock() {
  const hit = raycastBlocksFromCamera();
  if (!hit) return;
  const { x, y, z } = hit.object.userData;
  removeBlock(x, y, z);
}

function createBullet(origin, dir, speed, isEnemy) {
  const mesh = new THREE.Mesh(
    bulletGeometry,
    isEnemy ? enemyBulletMaterial : playerBulletMaterial
  );
  mesh.position.copy(origin);
  mesh.quaternion.setFromUnitVectors(worldUp, dir.clone().normalize());
  bulletGroup.add(mesh);

  const bullet = {
    mesh,
    velocity: dir.clone().normalize().multiplyScalar(speed),
    life: 2.6
  };

  if (isEnemy) enemyBullets.push(bullet);
  else playerBullets.push(bullet);
}

function firePlayerBullet() {
  if (shootCooldown > 0) return;
  if (mode !== 1 && mode !== 2) return;

  const elapsed = clock.elapsedTime;
  camera.getWorldDirection(lookDirection);
  const origin = camera.position.clone()
    .addScaledVector(lookDirection, 0.9)
    .addScaledVector(worldUp, -0.08);

  if (elapsed < multiShotEndsAt) {
    spreadRight.crossVectors(lookDirection, worldUp).normalize();
    if (spreadRight.lengthSq() < 0.000001) spreadRight.set(1, 0, 0);
    spreadUp.crossVectors(spreadRight, lookDirection).normalize();
    if (spreadUp.lengthSq() < 0.000001) spreadUp.set(0, 1, 0);
    const spreadPattern = [
      [0, 0],
      [0.05, 0], [-0.05, 0],
      [0, 0.04], [0, -0.04],
      [0.04, 0.03], [-0.04, -0.03],
      [0.04, -0.03], [-0.04, 0.03]
    ];

    for (const [rx, uy] of spreadPattern) {
      const dir = lookDirection.clone()
        .addScaledVector(spreadRight, rx)
        .addScaledVector(spreadUp, uy)
        .normalize();
      createBullet(origin.clone(), dir, 22, false);
    }
  } else {
    createBullet(origin, lookDirection, 22, false);
  }

  shootCooldown = 0.13;
}

const enemyGroup = new THREE.Group();
scene.add(enemyGroup);
const enemies = [];
let enemySpawnTimer = 0;
let nextEnemySpawn = 1.2;
let seededFirstEnemy = false;

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function randomSpawnXZ(minDistanceFromPlayer) {
  for (let i = 0; i < 20; i += 1) {
    const x = randomRange(-worldHalfSize + 2, worldHalfSize - 2);
    const z = randomRange(-worldHalfSize + 2, worldHalfSize - 2);
    const d2 = (x - camera.position.x) ** 2 + (z - camera.position.z) ** 2;
    if (d2 >= minDistanceFromPlayer * minDistanceFromPlayer) return { x, z };
  }
  return { x: 0, z: 0 };
}

function fireEnemyBullet(enemy) {
  const origin = enemy.mesh.position.clone().add(new THREE.Vector3(0, 1.4, 0));
  const dir = camera.position.clone().add(new THREE.Vector3(0, 0.35, 0)).sub(origin).normalize();
  createBullet(origin, dir, 9.5, true);
}

function spawnSoldierEnemy(preferredPosition = null) {
  const template = modelTemplates.soldier;
  if (!template) return;
  if (enemies.length >= 4) return;

  const { x, z } = preferredPosition ?? randomSpawnXZ(5);
  const mesh = cloneSkeleton(template);
  const baseY = template.userData.spawnLift ?? 0.65;
  mesh.position.set(x, baseY, z);
  mesh.userData.baseY = baseY;
  enemyGroup.add(mesh);

  enemies.push({
    mesh,
    fireCooldown: randomRange(0.7, 1.8),
    wobblePhase: randomRange(0, Math.PI * 2)
  });
}

function removeEnemyAt(index) {
  const enemy = enemies[index];
  if (!enemy) return;
  enemyGroup.remove(enemy.mesh);
  enemies.splice(index, 1);
}

function updateEnemies(delta, elapsed) {
  if (!seededFirstEnemy && modelTemplates.soldier) {
    seededFirstEnemy = true;
    spawnSoldierEnemy({ x: 0, z: 4.8 });
  }

  enemySpawnTimer += delta;
  if (enemySpawnTimer >= nextEnemySpawn) {
    enemySpawnTimer = 0;
    nextEnemySpawn = randomRange(2.8, 5.0);
    spawnSoldierEnemy();
  }

  for (let i = 0; i < enemies.length; i += 1) {
    const enemy = enemies[i];
    const baseY = enemy.mesh.userData.baseY ?? 0.65;
    enemy.mesh.lookAt(camera.position.x, baseY + 1.1, camera.position.z);
    enemy.mesh.position.y = baseY + Math.sin(elapsed * 1.7 + enemy.wobblePhase) * 0.04;

    enemy.fireCooldown -= delta;
    if (enemy.fireCooldown <= 0) {
      fireEnemyBullet(enemy);
      enemy.fireCooldown = randomRange(1.0, 2.2);
    }
  }
}

function updateBulletArray(bulletArray, deltaSeconds, isEnemy) {
  for (let i = bulletArray.length - 1; i >= 0; i -= 1) {
    const bullet = bulletArray[i];
    bullet.mesh.position.addScaledVector(bullet.velocity, deltaSeconds);
    bullet.life -= deltaSeconds;

    if (bullet.life <= 0 || bullet.mesh.position.lengthSq() > 5000) {
      bulletGroup.remove(bullet.mesh);
      bulletArray.splice(i, 1);
      continue;
    }

    if (isEnemy) {
      if (damageCooldown <= 0 && bullet.mesh.position.distanceTo(camera.position) < 0.55) {
        bulletGroup.remove(bullet.mesh);
        bulletArray.splice(i, 1);
        registerPlayerHit();
      }
      continue;
    }

    let hitSkyOrb = false;
    for (let s = destructibleSkyOrbs.length - 1; s >= 0; s -= 1) {
      const orb = destructibleSkyOrbs[s];
      if (!orb.parent) {
        destructibleSkyOrbs.splice(s, 1);
        continue;
      }
      if (bullet.mesh.position.distanceTo(orb.position) < 0.65) {
        decorGroup.remove(orb);
        destructibleSkyOrbs.splice(s, 1);
        activateMultiShot(clock.elapsedTime);
        hitSkyOrb = true;
        break;
      }
    }
    if (hitSkyOrb) {
      refreshHud(clock.elapsedTime);
      bulletGroup.remove(bullet.mesh);
      bulletArray.splice(i, 1);
      continue;
    }

    let hitTarget = false;
    for (let t = targetBlocks.length - 1; t >= 0; t -= 1) {
      const target = targetBlocks[t];
      if (bullet.mesh.position.distanceTo(target.position) < 0.85) {
        targetGroup.remove(target);
        targetBlocks.splice(t, 1);
        hitTarget = true;
        break;
      }
    }
    if (hitTarget) {
      bulletGroup.remove(bullet.mesh);
      bulletArray.splice(i, 1);
      continue;
    }

    let enemyHit = false;
    for (let e = enemies.length - 1; e >= 0; e -= 1) {
      const enemy = enemies[e];
      const enemyCenter = enemy.mesh.position.clone().add(new THREE.Vector3(0, 1, 0));
      if (bullet.mesh.position.distanceTo(enemyCenter) < 0.9) {
        removeEnemyAt(e);
        enemyKills += 1;
        enemyHit = true;
        break;
      }
    }
    if (enemyHit) {
      refreshHud(clock.elapsedTime);
      bulletGroup.remove(bullet.mesh);
      bulletArray.splice(i, 1);
      continue;
    }
  }
}

function registerPlayerHit() {
  if (pendingRestart) return;
  playerHits += 1;
  damageCooldown = 0.45;
  refreshHud(clock.elapsedTime);

  if (playerHits >= 5) {
    pendingRestart = true;
    controlsInfo.textContent = 'You were hit 5 times. Restarting...';
    setTimeout(() => {
      window.location.reload();
    }, 900);
  }
}

const modelLoader = new GLTFLoader();
const modelTemplates = {
  rifle: null,
  soldier: null,
  coin: null,
  tree: null,
  treeLong: null
};

let weaponModel = null;
const bbox = new THREE.Box3();
const bboxSize = new THREE.Vector3();
const bboxCenter = new THREE.Vector3();

function fallbackRifle() {
  const fallback = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.16, 0.7),
    new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.6, roughness: 0.35 })
  );
  body.position.set(0, -0.02, 0);
  fallback.add(body);

  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.028, 0.42, 10),
    new THREE.MeshStandardMaterial({ color: 0x0f0f0f, metalness: 0.8, roughness: 0.2 })
  );
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, -0.03, -0.5);
  fallback.add(barrel);

  return fallback;
}

function setupWeaponModel() {
  if (weaponModel) camera.remove(weaponModel);
  const source = modelTemplates.rifle ? modelTemplates.rifle.clone(true) : fallbackRifle();
  weaponModel = source;
  weaponModel.position.set(0.35, -0.28, -0.8);
  weaponModel.rotation.set(0.03, 0, 0.02);
  weaponModel.scale.setScalar(0.55);
  camera.add(weaponModel);
}

function normalizeModelToGround(model, targetHeight = null, extraLift = 0) {
  model.updateMatrixWorld(true);
  bbox.setFromObject(model);
  if (bbox.isEmpty()) return;

  if (targetHeight !== null) {
    bbox.getSize(bboxSize);
    if (bboxSize.y > 0.0001) {
      model.scale.multiplyScalar(targetHeight / bboxSize.y);
      model.updateMatrixWorld(true);
      bbox.setFromObject(model);
    }
  }

  bbox.getCenter(bboxCenter);
  model.position.x -= bboxCenter.x;
  model.position.z -= bboxCenter.z;
  model.updateMatrixWorld(true);
  bbox.setFromObject(model);

  model.position.y -= bbox.min.y;
  model.position.y += extraLift;
  model.updateMatrixWorld(true);
}

function fallbackSoldier() {
  const group = new THREE.Group();
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 1.2, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x8899aa })
  );
  torso.position.y = 1.0;
  group.add(torso);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xe0c29f })
  );
  head.position.y = 1.9;
  group.add(head);
  return group;
}

function fallbackCoin() {
  return new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.34, 0.08, 24),
    new THREE.MeshStandardMaterial({ color: 0xffd83a, emissive: 0x7f5b00, emissiveIntensity: 0.9 })
  );
}

function fallbackTree(scale = 1) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16 * scale, 0.22 * scale, 2.2 * scale, 12),
    new THREE.MeshStandardMaterial({ color: 0x6e4a2e })
  );
  trunk.position.y = 1.1 * scale;
  group.add(trunk);
  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(0.8 * scale, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0x2d7d39 })
  );
  crown.position.y = 2.4 * scale;
  group.add(crown);
  return group;
}

function loadModel(path, onSuccess, onFallback) {
  modelLoader.load(
    path,
    (gltf) => onSuccess(gltf.scene),
    undefined,
    () => onSuccess(onFallback())
  );
}

function placeEnvironmentModels() {
  decorModelGroup.clear();

  const spots = [
    [-7.5, -7.2, 0.85], [-6.8, 7.2, 0.8], [7.1, -6.6, 0.92], [7.3, 7.1, 0.9],
    [-2.8, -6.0, 0.75], [2.9, 6.2, 0.72], [-5.3, 0.4, 0.8], [5.4, -0.8, 0.78]
  ];

  if (modelTemplates.tree) {
    for (let i = 0; i < spots.length; i += 2) {
      const [x, z, s] = spots[i];
      const tree = modelTemplates.tree.clone(true);
      tree.scale.setScalar(s);
      tree.position.set(x, 0, z);
      decorModelGroup.add(tree);
    }
  }

  if (modelTemplates.treeLong) {
    for (let i = 1; i < spots.length; i += 2) {
      const [x, z, s] = spots[i];
      const treeLong = modelTemplates.treeLong.clone(true);
      treeLong.scale.setScalar(s);
      treeLong.position.set(x, 0, z);
      decorModelGroup.add(treeLong);
    }
  }
}

loadModel(
  '../model/Assault Rifle.glb',
  (sceneModel) => {
    modelTemplates.rifle = sceneModel;
    setupWeaponModel();
  },
  fallbackRifle
);

loadModel(
  '../model/Soldier.glb',
  (sceneModel) => {
    normalizeModelToGround(sceneModel, 2.1, 0.55);
    sceneModel.userData.spawnLift = 0.55;
    modelTemplates.soldier = sceneModel;
  },
  fallbackSoldier
);

loadModel(
  '../model/Coin.glb',
  (sceneModel) => {
    modelTemplates.coin = sceneModel;
  },
  fallbackCoin
);

loadModel(
  '../model/Tree.glb',
  (sceneModel) => {
    normalizeModelToGround(sceneModel, 3.0, 0.0);
    modelTemplates.tree = sceneModel;
    placeEnvironmentModels();
  },
  () => fallbackTree(1.0)
);

loadModel(
  '../model/Tree Long.glb',
  (sceneModel) => {
    normalizeModelToGround(sceneModel, 3.8, 0.0);
    modelTemplates.treeLong = sceneModel;
    placeEnvironmentModels();
  },
  () => fallbackTree(1.2)
);

setupWeaponModel();

let activeCoin = null;
let coinRespawnTimer = 1.5;
let coinLifetimeTimer = 0;
let coinBaseY = 1.15;

function removeCoin() {
  if (!activeCoin) return;
  scene.remove(activeCoin);
  activeCoin = null;
}

function spawnCoin() {
  removeCoin();
  const template = modelTemplates.coin;
  if (!template) return;

  const { x, z } = randomSpawnXZ(2.5);
  const coin = template.clone(true);
  coin.scale.setScalar(0.7);
  coinBaseY = 1.15;
  coin.position.set(x, coinBaseY, z);
  scene.add(coin);

  activeCoin = coin;
  coinLifetimeTimer = randomRange(7, 13);
}

function updateCoin(delta, elapsed) {
  if (!activeCoin) {
    coinRespawnTimer -= delta;
    if (coinRespawnTimer <= 0) {
      spawnCoin();
      coinRespawnTimer = randomRange(4, 8);
    }
    return;
  }

  activeCoin.rotation.y += delta * 3.2;
  activeCoin.position.y = coinBaseY + Math.sin(elapsed * 4) * 0.16;
  coinLifetimeTimer -= delta;

  if (camera.position.distanceTo(activeCoin.position) < 0.95) {
    score += 1;
    refreshHud(elapsed);
    removeCoin();
    coinRespawnTimer = randomRange(1.6, 4.5);
    return;
  }

  if (coinLifetimeTimer <= 0) {
    removeCoin();
    coinRespawnTimer = randomRange(1.2, 3.8);
  }
}

renderer.domElement.addEventListener('contextmenu', (ev) => {
  ev.preventDefault();
});

renderer.domElement.addEventListener('mousedown', (ev) => {
  if (document.pointerLockElement !== renderer.domElement) {
    renderer.domElement.requestPointerLock();
    return;
  }

  if (ev.button === 0) {
    firePlayerBullet();
  } else if (ev.button === 2) {
    placeBlock();
  }
});

document.addEventListener('pointerlockchange', () => {
  refreshHud(clock.elapsedTime);
});

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

  if (ev.code === 'Digit1') {
    mode = 1;
    showPrompt('Mode 1 ready: Rifle');
  } else if (ev.code === 'Digit2') {
    mode = 2;
    const elapsed = clock.elapsedTime;
    const ready = elapsed - lastTargetSkillUse;
    if (ready >= targetSkillCooldown) {
      spawnTargetsInFront();
      lastTargetSkillUse = elapsed;
      showPrompt('Targets deployed');
    } else {
      showPrompt(`${ready.toFixed(1)}/10s`);
    }
  } else if (ev.code === 'KeyF') {
    removeLookedAtBlock();
  }

  refreshHud(clock.elapsedTime);
});

document.addEventListener('keyup', (ev) => {
  keyState.delete(ev.code);
});

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;
  if (pendingRestart) return;

  if (shootCooldown > 0) shootCooldown -= delta;
  if (damageCooldown > 0) damageCooldown -= delta;

  if (promptTimer > 0) {
    promptTimer -= delta;
    if (promptTimer <= 0) statusPrompt.style.opacity = '0';
  }

  updateMovement(delta);
  updateEnemies(delta, elapsed);
  updateBulletArray(playerBullets, delta, false);
  updateBulletArray(enemyBullets, delta, true);
  updateCoin(delta, elapsed);

  if (animatedGateSpheres[0]) {
    animatedGateSpheres[0].position.y = 3.45 + Math.sin(elapsed * 2.7) * 0.14;
    animatedGateSpheres[1].position.y = 3.45 + Math.cos(elapsed * 2.7) * 0.14;
  }

  for (let i = 0; i < destructibleSkyOrbs.length; i += 1) {
    const orb = destructibleSkyOrbs[i];
    if (!orb.parent) continue;
    const baseY = orb.userData.baseY ?? orb.position.y;
    const phase = orb.userData.phase ?? 0;
    orb.position.y = baseY + Math.sin(elapsed * 1.4 + phase) * 0.18;
  }

  if (weaponModel) {
    weaponModel.position.y = -0.28 + Math.sin(elapsed * 8.0) * 0.01;
    weaponModel.rotation.z = 0.02 + Math.sin(elapsed * 5.5) * 0.01;
  }

  refreshHud(elapsed);
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
