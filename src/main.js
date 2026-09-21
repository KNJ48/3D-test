import * as THREE from "three";

// ==================================================
// WORLD SCALE
// ==================================================
const METERS_PER_UNIT = 0.5;

// ==================================================
// PLAYER
// ==================================================
const PLAYER_HEIGHT = 1.7;
const PLAYER_RADIUS = 0.35;

const GRAVITY = 14;
const JUMP_SPEED = 3.5;

const MAX_WALK_SPEED = 6;
const GROUND_ACCEL = 18;
const GROUND_DECEL = 22;
const GROUND_TURN = 12;

// ==================================================
// SPEED
// ==================================================
const MAX_SPEED_KMH = 300;

const MAX_SPEED =
  MAX_SPEED_KMH /
  3.6 /
  METERS_PER_UNIT;

// 高速移動時の衝突抜け防止
const MAX_MOVE_STEP = 0.35;

// ==================================================
// AIR
// ==================================================
const AIR_DRAG = 0.4;

// ==================================================
// PLAYER DAMAGE
// ==================================================
const MAX_HEALTH = 500;

const SAFE_IMPACT_KMH = 100;
const LETHAL_IMPACT_KMH = 300;
const MIN_DAMAGE_THRESHOLD = 10;

// ==================================================
// WALL
// ==================================================
const WALL_JUMP_SAFE_KMH = 30;

const WALL_JUMP_BOOST = 1.04;
const WALL_JUMP_VERTICAL_SPEED = 2.5;

const WALL_STUN_MIN = 0.3;
const WALL_STUN_MAX = 2.5;
const WALL_STUN_MAX_KMH = 200;

// ==================================================
// GAS
// ==================================================
const MAX_GAS = 500;

const FLIGHT_GAS_USE_RATE = 2.4;

const WIRE_GAS_USE_RATE =
  FLIGHT_GAS_USE_RATE * 0.5;

const GAS_RECOVERY_ACCEL = 28;
const GAS_CLIMB_SPEED = 8;
const GAS_CLIMB_ACCEL = 18;

const AIR_CONTROL_ACCEL = 24;
const AIR_NORMAL_MAX_SPEED = 30;
const AIR_STABILIZE_ACCEL = 18;

// ==================================================
// GAS BURST
// ==================================================
const GAS_BURST_COST = 10;
const GAS_DOUBLE_TAP_WINDOW = 0.5;

const GAS_BURST_IMPULSE = 24;
const GAS_BURST_STEERING = 0.22;
const GAS_BURST_COOLDOWN = 0.25;

const NORMAL_FOV = 75;
const BURST_FOV = 88;
const FOV_RECOVERY_SPEED = 9;

// ==================================================
// WIRE
// ==================================================
const WIRE_INITIAL_IMPULSE = 11;
const WIRE_SUSTAIN_ACCEL = 20;

const ANCHOR_SHOT_SPEED = 150;
const WIRE_RADIUS = 0.07;
const DUAL_AIM_OFFSET = 0.035;

// ==================================================
// BLADE
// ==================================================
const ATTACK_RANGE = 3.5;
const ATTACK_COOLDOWN = 0.35;

// ==================================================
// TITAN COMBAT
// ==================================================
const TITAN_MAX_HEALTH = 1000;

// 内部速度。
// 5units/s = 9km/h
const TITAN_DAMAGE_REFERENCE_SPEED = 35;

// 最高速時の基礎ダメージ
const TITAN_MAX_BASE_DAMAGE = 520;

// ==================================================
// TRAINING AREA
// ==================================================
const TRAINING_SPACING = 30;
const TRAINING_WIDTH = 8;
const TRAINING_DEPTH = 8;
const TRAINING_HEIGHT = 51;
const TRAINING_RADIUS = 4;

// ==================================================
// CITY
// ==================================================
const CITY_CENTER_X = 750;
const CITY_CENTER_Z = 0;

const CITY_WIDTH = 500;
const CITY_DEPTH = 500;

const CITY_WALL_HEIGHT = 200;
const CITY_WALL_THICKNESS = 12;
const CITY_GATE_WIDTH = 35;

const CITY_BLOCK_SPACING = 42;
const CITY_ROAD_WIDTH = 12;

// ==================================================
// SCENE
// ==================================================
const scene =
  new THREE.Scene();

scene.background =
  new THREE.Color(0x87ceeb);

// ==================================================
// CAMERA
// ==================================================
const camera =
  new THREE.PerspectiveCamera(
    NORMAL_FOV,
    window.innerWidth /
      window.innerHeight,
    0.1,
    4000
  );

const SPAWN =
  new THREE.Vector3(
    0,
    PLAYER_HEIGHT,
    12
  );

camera.position.copy(SPAWN);
camera.rotation.order = "YXZ";

// ==================================================
// RENDERER
// ==================================================
const renderer =
  new THREE.WebGLRenderer({
    antialias: true
  });

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

renderer.setPixelRatio(
  Math.min(
    window.devicePixelRatio,
    2
  )
);

renderer.outputColorSpace =
  THREE.SRGBColorSpace;

renderer.toneMapping =
  THREE.ACESFilmicToneMapping;

renderer.toneMappingExposure = 1;

renderer.shadowMap.enabled = true;

renderer.shadowMap.type =
  THREE.PCFSoftShadowMap;

document.body.appendChild(
  renderer.domElement
);

// ==================================================
// TEXTURES
// ==================================================
const loader =
  new THREE.TextureLoader();

const groundTexture =
  loader.load(
    "/textures/ground.jpg"
  );

groundTexture.colorSpace =
  THREE.SRGBColorSpace;

groundTexture.wrapS =
  THREE.RepeatWrapping;

groundTexture.wrapT =
  THREE.RepeatWrapping;

groundTexture.repeat.set(
  400,
  400
);

const wallTexture =
  loader.load(
    "/textures/wall.jpg"
  );

wallTexture.colorSpace =
  THREE.SRGBColorSpace;

wallTexture.wrapS =
  THREE.RepeatWrapping;

wallTexture.wrapT =
  THREE.RepeatWrapping;

wallTexture.repeat.set(
  2,
  12
);

// ==================================================
// LIGHT
// ==================================================
scene.add(
  new THREE.HemisphereLight(
    0xddeeff,
    0x445533,
    0.9
  )
);

const sun =
  new THREE.DirectionalLight(
    0xfff3d6,
    3
  );

sun.position.set(
  -150,
  1200,
  120
);

sun.castShadow = true;

sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;

sun.shadow.camera.left = -350;
sun.shadow.camera.right = 350;
sun.shadow.camera.top = 1200;
sun.shadow.camera.bottom = -350;

sun.shadow.camera.near = 1;
sun.shadow.camera.far = 2000;

sun.shadow.normalBias = 0.02;

scene.add(sun);

// ==================================================
// GROUND
// ==================================================
const ground =
  new THREE.Mesh(
    new THREE.PlaneGeometry(
      4000,
      4000
    ),
    new THREE.MeshStandardMaterial({
      map: groundTexture,
      roughness: 0.95
    })
  );

ground.rotation.x =
  -Math.PI / 2;

ground.receiveShadow = true;

scene.add(ground);

// ==================================================
// WORLD LISTS
// ==================================================
const colliders = [];
const anchorTargets = [];
const titanAttackTargets = [];

// ==================================================
// MATERIALS
// ==================================================
const trainingMaterial =
  new THREE.MeshStandardMaterial({
    map: wallTexture,
    roughness: 0.8
  });

const outerWallMaterial =
  new THREE.MeshStandardMaterial({
    map: wallTexture,
    color: 0xb0a58f,
    roughness: 0.95
  });

const roadMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x625b51,
    roughness: 1
  });

const cityMaterials = [
  new THREE.MeshStandardMaterial({
    color: 0xb99c7d,
    roughness: 0.9
  }),

  new THREE.MeshStandardMaterial({
    color: 0xa58569,
    roughness: 0.9
  }),

  new THREE.MeshStandardMaterial({
    color: 0xc6ac8d,
    roughness: 0.9
  })
];

const roofMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x71372f,
    roughness: 0.9
  });

// ==================================================
// WORLD OBJECT
// ==================================================
function addWorldObject(
  mesh,
  collision = true,
  anchorable = true
) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  scene.add(mesh);

  if (collision) {
    colliders.push(
      new THREE.Box3()
        .setFromObject(mesh)
    );
  }

  if (anchorable) {
    anchorTargets.push(mesh);
  }
}

// ==================================================
// TRAINING AREA
// ==================================================
function createTrainingArea() {
  const geometry =
    new THREE.BoxGeometry(
      TRAINING_WIDTH,
      TRAINING_HEIGHT,
      TRAINING_DEPTH
    );

  for (
    let x = -TRAINING_RADIUS;
    x <= TRAINING_RADIUS;
    x++
  ) {
    for (
      let z = -TRAINING_RADIUS;
      z <= TRAINING_RADIUS;
      z++
    ) {
      if (
        x === 0 &&
        z === 0
      ) {
        continue;
      }

      if (
        x === 0 &&
        z === -2
      ) {
        continue;
      }

      const tower =
        new THREE.Mesh(
          geometry,
          trainingMaterial
        );

      tower.position.set(
        x * TRAINING_SPACING,
        TRAINING_HEIGHT / 2,
        z * TRAINING_SPACING
      );

      addWorldObject(tower);
    }
  }
}

// ==================================================
// CITY WALL
// ==================================================
function createWallSegment(
  x,
  z,
  width,
  depth
) {
  const wall =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        width,
        CITY_WALL_HEIGHT,
        depth
      ),
      outerWallMaterial
    );

  wall.position.set(
    x,
    CITY_WALL_HEIGHT / 2,
    z
  );

  addWorldObject(wall);
}

function createCityWall() {
  const halfW =
    CITY_WIDTH / 2;

  const halfD =
    CITY_DEPTH / 2;

  createWallSegment(
    CITY_CENTER_X,
    CITY_CENTER_Z - halfD,
    CITY_WIDTH +
      CITY_WALL_THICKNESS,
    CITY_WALL_THICKNESS
  );

  createWallSegment(
    CITY_CENTER_X,
    CITY_CENTER_Z + halfD,
    CITY_WIDTH +
      CITY_WALL_THICKNESS,
    CITY_WALL_THICKNESS
  );

  createWallSegment(
    CITY_CENTER_X + halfW,
    CITY_CENTER_Z,
    CITY_WALL_THICKNESS,
    CITY_DEPTH
  );

  const sideLength =
    (
      CITY_DEPTH -
      CITY_GATE_WIDTH
    ) / 2;

  createWallSegment(
    CITY_CENTER_X - halfW,
    CITY_CENTER_Z -
      (
        CITY_GATE_WIDTH / 2 +
        sideLength / 2
      ),
    CITY_WALL_THICKNESS,
    sideLength
  );

  createWallSegment(
    CITY_CENTER_X - halfW,
    CITY_CENTER_Z +
      (
        CITY_GATE_WIDTH / 2 +
        sideLength / 2
      ),
    CITY_WALL_THICKNESS,
    sideLength
  );
}

// ==================================================
// ROAD
// ==================================================
function createRoad(
  x,
  z,
  width,
  depth
) {
  const mesh =
    new THREE.Mesh(
      new THREE.PlaneGeometry(
        width,
        depth
      ),
      roadMaterial
    );

  mesh.rotation.x =
    -Math.PI / 2;

  mesh.position.set(
    x,
    0.025,
    z
  );

  mesh.receiveShadow = true;

  scene.add(mesh);
}

// ==================================================
// HOUSE
// ==================================================
function createHouse(
  x,
  z,
  width,
  depth,
  height,
  variant
) {
  const house =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        width,
        height,
        depth
      ),
      cityMaterials[
        variant %
        cityMaterials.length
      ]
    );

  house.position.set(
    x,
    height / 2,
    z
  );

  addWorldObject(house);

  const roof =
    new THREE.Mesh(
      new THREE.ConeGeometry(
        Math.max(
          width,
          depth
        ) * 0.72,
        5,
        4
      ),
      roofMaterial
    );

  roof.position.set(
    x,
    height + 2.5,
    z
  );

  roof.rotation.y =
    Math.PI / 4;

  roof.castShadow = true;

  scene.add(roof);

  anchorTargets.push(roof);
}

// ==================================================
// CITY
// ==================================================
function createCity() {
  createRoad(
    CITY_CENTER_X,
    CITY_CENTER_Z,
    CITY_WIDTH -
      CITY_WALL_THICKNESS,
    CITY_ROAD_WIDTH
  );

  createRoad(
    CITY_CENTER_X,
    CITY_CENTER_Z,
    CITY_ROAD_WIDTH,
    CITY_DEPTH -
      CITY_WALL_THICKNESS
  );

  const radius = 5;

  for (
    let x = -radius;
    x <= radius;
    x++
  ) {
    for (
      let z = -radius;
      z <= radius;
      z++
    ) {
      if (
        x === 0 ||
        z === 0
      ) {
        continue;
      }

      if (
        Math.abs(x) <= 1 &&
        Math.abs(z) <= 1
      ) {
        continue;
      }

      const px =
        CITY_CENTER_X +
        x * CITY_BLOCK_SPACING;

      const pz =
        CITY_CENTER_Z +
        z * CITY_BLOCK_SPACING;

      const seed =
        Math.abs(
          x * 37 +
          z * 71
        );

      createHouse(
        px - 8,
        pz - 8,
        14,
        14,
        11 + seed % 13,
        seed
      );

      createHouse(
        px + 8,
        pz + 8,
        14,
        14,
        13 +
          (seed * 7) % 15,
        seed + 1
      );
    }
  }
}

// ==================================================
// TITAN
// ==================================================
const titan =
  new THREE.Group();

titan.position.set(
  0,
  0,
  -60
);

scene.add(titan);

const titanSkinMaterial =
  new THREE.MeshStandardMaterial({
    color: 0xd18b70,
    roughness: 0.82
  });

const titanDarkMaterial =
  new THREE.MeshStandardMaterial({
    color: 0xb76c59,
    roughness: 0.86
  });

const titanHairMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x211713,
    roughness: 0.95
  });

const titanEyeMaterial =
  new THREE.MeshStandardMaterial({
    color: 0xf2eee4,
    roughness: 0.4
  });

const titanPupilMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x080604
  });

const titanMouthMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x6b2625,
    roughness: 1
  });

const titanWeakMaterial =
  new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false
  });

// ==================================================
// TITAN STATE
// ==================================================
let titanAlive = true;

let titanHealth =
  TITAN_MAX_HEALTH;

// ==================================================
// TITAN PART HELPER
// ==================================================
function addTitanPart(
  geometry,
  material,
  x,
  y,
  z,
  part,
  damageMultiplier
) {
  const mesh =
    new THREE.Mesh(
      geometry,
      material
    );

  mesh.position.set(
    x,
    y,
    z
  );

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  mesh.userData.titanPart =
    part;

  mesh.userData.damageMultiplier =
    damageMultiplier;

  titan.add(mesh);

  anchorTargets.push(mesh);

  titanAttackTargets.push(mesh);

  return mesh;
}

// ==================================================
// TITAN LEGS
// ==================================================
function createTitanLeg(side) {
  const thigh =
    addTitanPart(
      new THREE.CapsuleGeometry(
        0.83,
        2.6,
        8,
        14
      ),
      titanSkinMaterial,
      side * 0.92,
      4.55,
      0,
      "LEG",
      0.8
    );

  thigh.scale.set(
    1.08,
    1,
    0.92
  );

  const calf =
    addTitanPart(
      new THREE.CapsuleGeometry(
        0.6,
        1.8,
        8,
        14
      ),
      titanSkinMaterial,
      side * 0.92,
      1.65,
      0,
      "LEG",
      0.8
    );

  return {
    thigh,
    calf
  };
}

createTitanLeg(-1);
createTitanLeg(1);

// ==================================================
// TITAN BODY
// ==================================================
const titanPelvis =
  addTitanPart(
    new THREE.SphereGeometry(
      1.55,
      22,
      16
    ),
    titanDarkMaterial,
    0,
    6.2,
    0,
    "TORSO",
    0.6
  );

titanPelvis.scale.set(
  1,
  0.75,
  0.75
);

const titanTorso =
  addTitanPart(
    new THREE.SphereGeometry(
      2.15,
      24,
      20
    ),
    titanSkinMaterial,
    0,
    9.25,
    0,
    "TORSO",
    0.6
  );

titanTorso.scale.set(
  1.18,
  1.15,
  0.72
);

// ==================================================
// TITAN ARMS
// ==================================================
function createTitanArm(side) {
  const arm =
    addTitanPart(
      new THREE.CapsuleGeometry(
        0.58,
        4.6,
        8,
        12
      ),
      titanSkinMaterial,
      side * 2.65,
      7.9,
      0,
      "ARM",
      0.75
    );

  arm.rotation.z =
    side * -0.1;

  return arm;
}

createTitanArm(-1);
createTitanArm(1);

// ==================================================
// TITAN HEAD
// ==================================================
const titanHead =
  addTitanPart(
    new THREE.SphereGeometry(
      1.36,
      28,
      22
    ),
    titanSkinMaterial,
    0,
    13.15,
    0,
    "HEAD",
    1.3
  );

titanHead.scale.set(
  0.83,
  1.07,
  0.82
);

function createTitanEye(side) {
  const eye =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.22,
        16,
        12
      ),
      titanEyeMaterial
    );

  eye.position.set(
    side * 0.45,
    13.38,
    1.04
  );

  eye.scale.set(
    1.25,
    0.62,
    0.32
  );

  titan.add(eye);

  const pupil =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.07,
        12,
        8
      ),
      titanPupilMaterial
    );

  pupil.position.set(
    side * 0.45,
    13.38,
    1.22
  );

  titan.add(pupil);
}

createTitanEye(-1);
createTitanEye(1);

const titanMouth =
  new THREE.Mesh(
    new THREE.BoxGeometry(
      0.9,
      0.13,
      0.08
    ),
    titanMouthMaterial
  );

titanMouth.position.set(
  0,
  12.55,
  1.13
);

titan.add(titanMouth);

const titanHair =
  new THREE.Mesh(
    new THREE.SphereGeometry(
      1.43,
      26,
      18,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.5
    ),
    titanHairMaterial
  );

titanHair.position.set(
  0,
  13.55,
  -0.04
);

titan.add(titanHair);

anchorTargets.push(
  titanHair
);

// ==================================================
// NAPE
// ==================================================
const titanNape =
  new THREE.Mesh(
    new THREE.BoxGeometry(
      1.3,
      1,
      0.5
    ),
    titanWeakMaterial
  );

titanNape.position.set(
  0,
  12.05,
  -0.82
);

titanNape.userData.titanPart =
  "NAPE";

titanNape.userData.damageMultiplier =
  3;

titan.add(titanNape);

titanAttackTargets.push(
  titanNape
);

// ==================================================
// BUILD WORLD
// ==================================================
createTrainingArea();
createCityWall();
createCity();

// ==================================================
// PLAYER STATE
// ==================================================
const velocity =
  new THREE.Vector3();

let grounded = true;

let health = MAX_HEALTH;
let gas = MAX_GAS;

let dead = false;

let wallStunTimer = 0;

// ==================================================
// BURST STATE
// ==================================================
let lastSpaceTapTime =
  -Infinity;

let gasBurstCooldown = 0;
let fovKick = 0;

// ==================================================
// CAMERA EQUIPMENT
// ==================================================
scene.add(camera);

// ==================================================
// BLADE
// ==================================================
const bladeMaterial =
  new THREE.MeshStandardMaterial({
    color: 0xdfe7ec,
    metalness: 0.9,
    roughness: 0.18
  });

const bladeHandleMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x252525,
    metalness: 0.4,
    roughness: 0.7
  });

function createBlade(side) {
  const group =
    new THREE.Group();

  const handle =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.08,
        0.08,
        0.32
      ),
      bladeHandleMaterial
    );

  handle.position.z =
    -0.05;

  group.add(handle);

  const blade =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.045,
        0.055,
        1.25
      ),
      bladeMaterial
    );

  blade.position.z =
    -0.8;

  group.add(blade);

  group.position.set(
    side * 0.38,
    -0.35,
    -0.7
  );

  group.rotation.x =
    -0.12;

  group.rotation.y =
    side * -0.12;

  camera.add(group);

  return group;
}

const leftBlade =
  createBlade(-1);

const rightBlade =
  createBlade(1);

let attacking = false;
let attackTimer = 0;
let attackCooldownTimer = 0;

const attackRaycaster =
  new THREE.Raycaster();

// ==================================================
// TITAN DAMAGE
// ==================================================
function calculateTitanDamage(
  target
) {
  const speed =
    velocity.length();

  const speedRatio =
    THREE.MathUtils.clamp(
      speed /
      TITAN_DAMAGE_REFERENCE_SPEED,
      0,
      1.5
    );

  // 速度の二乗寄り。
  // 低速斬撃は弱く、高速で急激に強くなる。
  const baseDamage =
    TITAN_MAX_BASE_DAMAGE *
    speedRatio *
    speedRatio;

  const multiplier =
    target.userData
      .damageMultiplier ??
    1;

  return Math.max(
    1,
    Math.round(
      baseDamage *
      multiplier
    )
  );
}

function damageTitan(
  target
) {
  if (
    !titanAlive
  ) {
    return;
  }

  const damage =
    calculateTitanDamage(
      target
    );

  titanHealth -= damage;

  titanHealth =
    Math.max(
      0,
      titanHealth
    );

  if (
    titanHealth <= 0
  ) {
    killTitan();
  }
}

function killTitan() {
  if (
    !titanAlive
  ) {
    return;
  }

  titanAlive = false;

  showMessage(
    "TITAN DOWN"
  );

  titan.rotation.z =
    0.15;

  setTimeout(
    () => {
      titan.visible = false;
    },
    700
  );

  setTimeout(
    respawnTitan,
    4000
  );
}

function respawnTitan() {
  titan.rotation.set(
    0,
    0,
    0
  );

  titanHealth =
    TITAN_MAX_HEALTH;

  titan.visible = true;

  titanAlive = true;
}

// ==================================================
// BLADE ATTACK
// ==================================================
function bladeAttack() {
  if (
    dead ||
    attacking ||
    attackCooldownTimer > 0 ||
    wallStunTimer > 0
  ) {
    return;
  }

  attacking = true;

  attackTimer = 0;

  attackCooldownTimer =
    ATTACK_COOLDOWN;

  attackRaycaster.setFromCamera(
    new THREE.Vector2(
      0,
      0
    ),
    camera
  );

  attackRaycaster.far =
    ATTACK_RANGE;

  const hits =
    attackRaycaster.intersectObjects(
      titanAttackTargets,
      false
    );

  if (
    hits.length === 0 ||
    !titanAlive
  ) {
    return;
  }

  damageTitan(
    hits[0].object
  );
}

// ==================================================
// BLADE ANIMATION
// ==================================================
function updateBladeAnimation(
  delta
) {
  attackCooldownTimer =
    Math.max(
      0,
      attackCooldownTimer -
      delta
    );

  if (!attacking) {
    return;
  }

  attackTimer += delta;

  const t =
    Math.min(
      attackTimer / 0.28,
      1
    );

  const swing =
    Math.sin(
      t * Math.PI
    );

  leftBlade.rotation.z =
    -swing * 1.15;

  rightBlade.rotation.z =
    swing * 1.15;

  leftBlade.rotation.x =
    -0.12 +
    swing * 0.65;

  rightBlade.rotation.x =
    -0.12 +
    swing * 0.65;

  if (
    t >= 1
  ) {
    attacking = false;

    leftBlade.rotation.z = 0;
    rightBlade.rotation.z = 0;

    leftBlade.rotation.x =
      -0.12;

    rightBlade.rotation.x =
      -0.12;
  }
}

// ==================================================
// INPUT
// ==================================================
const keys = {};

let spacePressed = false;

let yaw = 0;
let pitch = 0;

const MOUSE_SENSITIVITY =
  0.002;

// ==================================================
// TEMP
// ==================================================
const forward =
  new THREE.Vector3();

const right =
  new THREE.Vector3();

const input =
  new THREE.Vector3();

const currentDirection =
  new THREE.Vector3();

const targetDirection =
  new THREE.Vector3();

const wireDirection =
  new THREE.Vector3();

const ropeOutward =
  new THREE.Vector3();

const wireMiddle =
  new THREE.Vector3();

const projectileDirection =
  new THREE.Vector3();

const burstDirection =
  new THREE.Vector3();

const desiredBurstVelocity =
  new THREE.Vector3();

const yAxis =
  new THREE.Vector3(
    0,
    1,
    0
  );

// ==================================================
// UTIL
// ==================================================
function moveTowards(
  current,
  target,
  maxDelta
) {
  if (
    Math.abs(
      target - current
    ) <= maxDelta
  ) {
    return target;
  }

  return (
    current +
    Math.sign(
      target - current
    ) *
    maxDelta
  );
}

function speedToKmh(speed) {
  return (
    Math.abs(speed) *
    METERS_PER_UNIT *
    3.6
  );
}

function limitSpeed() {
  const speed =
    velocity.length();

  if (
    speed >
    MAX_SPEED
  ) {
    velocity.multiplyScalar(
      MAX_SPEED /
      speed
    );
  }
}

// ==================================================
// GAS BURST
// ==================================================
function gasBurst() {
  if (
    dead ||
    grounded ||
    wallStunTimer > 0 ||
    gasBurstCooldown > 0 ||
    gas < GAS_BURST_COST
  ) {
    return false;
  }

  gas -=
    GAS_BURST_COST;

  gasBurstCooldown =
    GAS_BURST_COOLDOWN;

  camera.getWorldDirection(
    burstDirection
  );

  burstDirection.normalize();

  const currentSpeed =
    velocity.length();

  if (
    currentSpeed > 0.001
  ) {
    desiredBurstVelocity
      .copy(
        burstDirection
      )
      .multiplyScalar(
        currentSpeed
      );

    velocity.lerp(
      desiredBurstVelocity,
      GAS_BURST_STEERING
    );
  }

  velocity.addScaledVector(
    burstDirection,
    GAS_BURST_IMPULSE
  );

  limitSpeed();

  fovKick = 1;

  return true;
}

// ==================================================
// CAMERA EFFECT
// ==================================================
function updateCameraEffects(
  delta
) {
  fovKick =
    Math.max(
      0,
      fovKick -
      FOV_RECOVERY_SPEED *
      delta
    );

  const fov =
    THREE.MathUtils.lerp(
      NORMAL_FOV,
      BURST_FOV,
      fovKick
    );

  if (
    Math.abs(
      camera.fov -
      fov
    ) > 0.01
  ) {
    camera.fov = fov;

    camera
      .updateProjectionMatrix();
  }
}

// ==================================================
// ANCHOR
// ==================================================
const raycaster =
  new THREE.Raycaster();

function createAnchor() {
  const wire =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        WIRE_RADIUS,
        WIRE_RADIUS,
        1,
        8
      ),
      new THREE.MeshBasicMaterial({
        color: 0x050505
      })
    );

  wire.visible = false;

  scene.add(wire);

  return {
    state: "OFF",
    connected: false,

    targetPoint:
      new THREE.Vector3(),

    point:
      new THREE.Vector3(),

    projectilePosition:
      new THREE.Vector3(),

    target: null,

    length: 0,

    pulling: false,

    impulseApplied: false,

    wire
  };
}

const leftAnchor =
  createAnchor();

const rightAnchor =
  createAnchor();

function fireAnchor(
  anchor,
  offset = 0
) {
  if (
    dead ||
    wallStunTimer > 0
  ) {
    return;
  }

  raycaster.setFromCamera(
    new THREE.Vector2(
      offset,
      0
    ),
    camera
  );

  const hits =
    raycaster.intersectObjects(
      anchorTargets,
      false
    );

  if (
    hits.length === 0
  ) {
    return;
  }

  const hit =
    hits[0];

  anchor.state =
    "FIRING";

  anchor.connected =
    false;

  anchor.targetPoint.copy(
    hit.point
  );

  anchor.projectilePosition.copy(
    camera.position
  );

  anchor.target =
    hit.object;

  anchor.pulling = false;

  anchor.impulseApplied =
    false;

  anchor.wire.visible = true;
}

function connectAnchor(
  anchor
) {
  anchor.state =
    "CONNECTED";

  anchor.connected = true;

  anchor.point.copy(
    anchor.targetPoint
  );

  anchor.length =
    camera.position.distanceTo(
      anchor.point
    );

  anchor.pulling = false;

  anchor.impulseApplied =
    false;
}

function releaseAnchor(
  anchor
) {
  anchor.state = "OFF";

  anchor.connected = false;

  anchor.target = null;

  anchor.pulling = false;

  anchor.impulseApplied =
    false;

  anchor.wire.visible = false;
}

function toggleAnchor(
  anchor
) {
  if (
    anchor.state ===
    "OFF"
  ) {
    fireAnchor(anchor);
  } else {
    releaseAnchor(anchor);
  }
}

function toggleBothAnchors() {
  if (
    leftAnchor.state !==
      "OFF" ||
    rightAnchor.state !==
      "OFF"
  ) {
    releaseAnchor(
      leftAnchor
    );

    releaseAnchor(
      rightAnchor
    );

    return;
  }

  fireAnchor(
    leftAnchor,
    -DUAL_AIM_OFFSET
  );

  fireAnchor(
    rightAnchor,
    DUAL_AIM_OFFSET
  );
}

// ==================================================
// PROJECTILE
// ==================================================
function updateAnchorProjectile(
  anchor,
  delta
) {
  if (
    anchor.state !==
    "FIRING"
  ) {
    return;
  }

  projectileDirection.subVectors(
    anchor.targetPoint,
    anchor.projectilePosition
  );

  const remaining =
    projectileDirection.length();

  const travel =
    ANCHOR_SHOT_SPEED *
    delta;

  if (
    travel >= remaining
  ) {
    anchor.projectilePosition.copy(
      anchor.targetPoint
    );

    connectAnchor(anchor);

    return;
  }

  projectileDirection.normalize();

  anchor.projectilePosition
    .addScaledVector(
      projectileDirection,
      travel
    );
}

// ==================================================
// WIRE VISUAL
// ==================================================
function updateWireVisual(
  anchor
) {
  if (
    anchor.state === "OFF"
  ) {
    return;
  }

  const end =
    anchor.state === "FIRING"
      ? anchor.projectilePosition
      : anchor.point;

  wireDirection.subVectors(
    end,
    camera.position
  );

  const distance =
    wireDirection.length();

  if (
    distance < 0.001
  ) {
    anchor.wire.visible =
      false;

    return;
  }

  anchor.wire.visible = true;

  wireMiddle
    .copy(camera.position)
    .add(end)
    .multiplyScalar(0.5);

  anchor.wire.position.copy(
    wireMiddle
  );

  anchor.wire.scale.set(
    1,
    distance,
    1
  );

  wireDirection.normalize();

  anchor.wire.quaternion
    .setFromUnitVectors(
      yAxis,
      wireDirection
    );
}

// ==================================================
// WIRE GAS
// ==================================================
function updateWireGas(
  delta
) {
  const active =
    keys["KeyW"] &&
    (
      leftAnchor.connected ||
      rightAnchor.connected
    );

  if (
    !active ||
    gas <= 0
  ) {
    return false;
  }

  gas -=
    WIRE_GAS_USE_RATE *
    delta;

  gas =
    Math.max(
      gas,
      0
    );

  return gas > 0;
}

// ==================================================
// WIRE PHYSICS
// ==================================================
function updateWire(
  anchor,
  delta,
  gasAvailable
) {
  if (
    !anchor.connected ||
    !keys["KeyW"] ||
    !gasAvailable
  ) {
    anchor.pulling = false;

    anchor.impulseApplied =
      false;

    return;
  }

  wireDirection.subVectors(
    anchor.point,
    camera.position
  );

  if (
    wireDirection.lengthSq() <
    0.001
  ) {
    return;
  }

  wireDirection.normalize();

  if (
    !anchor.impulseApplied
  ) {
    velocity.addScaledVector(
      wireDirection,
      WIRE_INITIAL_IMPULSE
    );

    anchor.impulseApplied =
      true;

    anchor.length =
      camera.position.distanceTo(
        anchor.point
      );
  }

  anchor.pulling = true;

  velocity.addScaledVector(
    wireDirection,
    WIRE_SUSTAIN_ACCEL *
    delta
  );
}

// ==================================================
// ROPE
// ==================================================
function constrainRope(
  anchor
) {
  if (
    !anchor.connected ||
    !anchor.pulling
  ) {
    return;
  }

  ropeOutward.subVectors(
    camera.position,
    anchor.point
  );

  const distance =
    ropeOutward.length();

  if (
    distance < 0.001
  ) {
    return;
  }

  ropeOutward.normalize();

  if (
    distance >
    anchor.length
  ) {
    camera.position
      .copy(
        anchor.point
      )
      .addScaledVector(
        ropeOutward,
        anchor.length
      );
  }

  const outwardVelocity =
    velocity.dot(
      ropeOutward
    );

  if (
    outwardVelocity > 0
  ) {
    velocity.addScaledVector(
      ropeOutward,
      -outwardVelocity
    );
  }
}

// ==================================================
// GAS FLIGHT
// ==================================================
function updateGasFlight(
  delta
) {
  const usingGas =
    !grounded &&
    keys["Space"] &&
    gas > 0;

  if (!usingGas) {
    return;
  }

  gas -=
    FLIGHT_GAS_USE_RATE *
    delta;

  gas =
    Math.max(
      gas,
      0
    );

  if (
    velocity.y < 0
  ) {
    velocity.y +=
      GAS_RECOVERY_ACCEL *
      delta;
  } else {
    velocity.y =
      moveTowards(
        velocity.y,
        GAS_CLIMB_SPEED,
        GAS_CLIMB_ACCEL *
        delta
      );
  }

  let forwardSpeed =
    velocity.x *
      forward.x +
    velocity.z *
      forward.z;

  let sideSpeed =
    velocity.x *
      right.x +
    velocity.z *
      right.z;

  const forwardInput =
    (
      keys["KeyW"] ? 1 : 0
    ) -
    (
      keys["KeyS"] ? 1 : 0
    );

  const sideInput =
    (
      keys["KeyD"] ? 1 : 0
    ) -
    (
      keys["KeyA"] ? 1 : 0
    );

  if (
    forwardInput === 0
  ) {
    forwardSpeed =
      moveTowards(
        forwardSpeed,
        0,
        AIR_STABILIZE_ACCEL *
        delta
      );
  } else {
    const old =
      forwardSpeed;

    forwardSpeed +=
      forwardInput *
      AIR_CONTROL_ACCEL *
      delta;

    // 通常ガスでは30を超えて
    // 新規加速しない。
    // バースト等で既に超えている速度は保持。
    if (
      Math.abs(
        forwardSpeed
      ) >
        AIR_NORMAL_MAX_SPEED &&
      Math.abs(
        forwardSpeed
      ) >
        Math.abs(old)
    ) {
      forwardSpeed = old;
    }
  }

  if (
    sideInput === 0
  ) {
    sideSpeed =
      moveTowards(
        sideSpeed,
        0,
        AIR_STABILIZE_ACCEL *
        delta
      );
  } else {
    const old =
      sideSpeed;

    sideSpeed +=
      sideInput *
      AIR_CONTROL_ACCEL *
      delta;

    if (
      Math.abs(
        sideSpeed
      ) >
        AIR_NORMAL_MAX_SPEED &&
      Math.abs(
        sideSpeed
      ) >
        Math.abs(old)
    ) {
      sideSpeed = old;
    }
  }

  velocity.x =
    forward.x *
      forwardSpeed +
    right.x *
      sideSpeed;

  velocity.z =
    forward.z *
      forwardSpeed +
    right.z *
      sideSpeed;
}

// ==================================================
// AIR DRAG
// ==================================================
function updateAirDrag(
  delta
) {
  if (grounded) {
    return;
  }

  const movementInput =
    keys["KeyW"] ||
    keys["KeyA"] ||
    keys["KeyS"] ||
    keys["KeyD"];

  const usingGas =
    keys["Space"] &&
    gas > 0;

  const wirePulling =
    leftAnchor.pulling ||
    rightAnchor.pulling;

  if (
    movementInput ||
    usingGas ||
    wirePulling
  ) {
    return;
  }

  const drag =
    Math.exp(
      -AIR_DRAG *
      delta
    );

  velocity.x *= drag;
  velocity.z *= drag;
}

// ==================================================
// PLAYER IMPACT DAMAGE
// ==================================================
function impactDamage(
  speed
) {
  const kmh =
    speedToKmh(speed);

  if (
    kmh >=
    LETHAL_IMPACT_KMH
  ) {
    return MAX_HEALTH;
  }

  if (
    kmh <=
    SAFE_IMPACT_KMH
  ) {
    return 0;
  }

  const t =
    (
      kmh -
      SAFE_IMPACT_KMH
    ) /
    (
      LETHAL_IMPACT_KMH -
      SAFE_IMPACT_KMH
    );

  const damage =
    t *
    t *
    MAX_HEALTH;

  if (
    damage <
    MIN_DAMAGE_THRESHOLD
  ) {
    return 0;
  }

  return damage;
}

function damageFromImpact(
  speed
) {
  if (dead) {
    return;
  }

  health -=
    impactDamage(speed);

  health =
    Math.max(
      health,
      0
    );

  if (
    health <= 0
  ) {
    die();
  }
}

// ==================================================
// WALL JUMP
// ==================================================
function wallJump(
  normalX,
  normalZ
) {
  const dot =
    velocity.x *
      normalX +
    velocity.z *
      normalZ;

  const reflectedX =
    velocity.x -
    2 *
    dot *
    normalX;

  const reflectedZ =
    velocity.z -
    2 *
    dot *
    normalZ;

  velocity.x =
    reflectedX *
    WALL_JUMP_BOOST;

  velocity.z =
    reflectedZ *
    WALL_JUMP_BOOST;

  velocity.y =
    Math.max(
      velocity.y,
      WALL_JUMP_VERTICAL_SPEED
    );

  grounded = false;

  limitSpeed();
}

// ==================================================
// STUN
// ==================================================
function applyWallStun(
  impactKmh
) {
  if (
    wallStunTimer > 0
  ) {
    return;
  }

  const t =
    THREE.MathUtils.clamp(
      (
        impactKmh -
        WALL_JUMP_SAFE_KMH
      ) /
      (
        WALL_STUN_MAX_KMH -
        WALL_JUMP_SAFE_KMH
      ),
      0,
      1
    );

  wallStunTimer =
    THREE.MathUtils.lerp(
      WALL_STUN_MIN,
      WALL_STUN_MAX,
      t
    );

  const retention =
    THREE.MathUtils.lerp(
      0.65,
      0.15,
      t
    );

  velocity.multiplyScalar(
    retention
  );

  leftAnchor.pulling = false;

  rightAnchor.pulling = false;
}

// ==================================================
// COLLISION
// ==================================================
function intersects(
  position,
  box
) {
  return (
    position.x +
      PLAYER_RADIUS >
      box.min.x &&

    position.x -
      PLAYER_RADIUS <
      box.max.x &&

    position.y >
      box.min.y &&

    position.y -
      PLAYER_HEIGHT <
      box.max.y &&

    position.z +
      PLAYER_RADIUS >
      box.min.z &&

    position.z -
      PLAYER_RADIUS <
      box.max.z
  );
}

function collides(
  position
) {
  for (
    const box
    of colliders
  ) {
    if (
      intersects(
        position,
        box
      )
    ) {
      return true;
    }
  }

  return false;
}

// ==================================================
// HORIZONTAL STEP
// ==================================================
function moveHorizontalStep(
  delta
) {
  const nextX =
    camera.position.clone();

  nextX.x +=
    velocity.x *
    delta;

  if (
    !collides(nextX)
  ) {
    camera.position.x =
      nextX.x;
  } else {
    const impact =
      velocity.x;

    const kmh =
      speedToKmh(impact);

    const normalX =
      impact > 0
        ? -1
        : 1;

    if (
      wallStunTimer > 0
    ) {
      velocity.x = 0;
    } else if (
      !grounded &&
      kmh <
        WALL_JUMP_SAFE_KMH
    ) {
      wallJump(
        normalX,
        0
      );

      return true;
    } else {
      damageFromImpact(
        impact
      );

      if (!dead) {
        applyWallStun(
          kmh
        );
      }

      velocity.x = 0;

      return true;
    }
  }

  const nextZ =
    camera.position.clone();

  nextZ.z +=
    velocity.z *
    delta;

  if (
    !collides(nextZ)
  ) {
    camera.position.z =
      nextZ.z;
  } else {
    const impact =
      velocity.z;

    const kmh =
      speedToKmh(impact);

    const normalZ =
      impact > 0
        ? -1
        : 1;

    if (
      wallStunTimer > 0
    ) {
      velocity.z = 0;
    } else if (
      !grounded &&
      kmh <
        WALL_JUMP_SAFE_KMH
    ) {
      wallJump(
        0,
        normalZ
      );

      return true;
    } else {
      damageFromImpact(
        impact
      );

      if (!dead) {
        applyWallStun(
          kmh
        );
      }

      velocity.z = 0;

      return true;
    }
  }

  return false;
}

// ==================================================
// HIGH SPEED MOVEMENT
// ==================================================
function moveHorizontal(
  delta
) {
  const distance =
    Math.hypot(
      velocity.x,
      velocity.z
    ) *
    delta;

  const steps =
    Math.max(
      1,
      Math.ceil(
        distance /
        MAX_MOVE_STEP
      )
    );

  const stepDelta =
    delta /
    steps;

  for (
    let i = 0;
    i < steps;
    i++
  ) {
    const collision =
      moveHorizontalStep(
        stepDelta
      );

    if (
      collision ||
      dead
    ) {
      break;
    }
  }
}

// ==================================================
// VERTICAL MOVEMENT
// ==================================================
function moveVertical(
  delta
) {
  const oldY =
    camera.position.y;

  const next =
    camera.position.clone();

  next.y +=
    velocity.y *
    delta;

  if (
    next.y <=
    PLAYER_HEIGHT
  ) {
    if (
      velocity.y < 0
    ) {
      damageFromImpact(
        velocity.y
      );
    }

    camera.position.y =
      PLAYER_HEIGHT;

    velocity.y = 0;

    grounded = true;

    return;
  }

  if (
    !collides(next)
  ) {
    camera.position.y =
      next.y;

    grounded = false;

    return;
  }

  if (
    velocity.y <= 0
  ) {
    for (
      const box
      of colliders
    ) {
      const horizontal =
        camera.position.x +
          PLAYER_RADIUS >
          box.min.x &&

        camera.position.x -
          PLAYER_RADIUS <
          box.max.x &&

        camera.position.z +
          PLAYER_RADIUS >
          box.min.z &&

        camera.position.z -
          PLAYER_RADIUS <
          box.max.z;

      if (!horizontal) {
        continue;
      }

      const oldFeet =
        oldY -
        PLAYER_HEIGHT;

      const newFeet =
        next.y -
        PLAYER_HEIGHT;

      if (
        oldFeet >=
          box.max.y &&
        newFeet <=
          box.max.y
      ) {
        damageFromImpact(
          velocity.y
        );

        camera.position.y =
          box.max.y +
          PLAYER_HEIGHT;

        velocity.y = 0;

        grounded = true;

        return;
      }
    }
  }

  damageFromImpact(
    velocity.y
  );

  velocity.y = 0;
}

// ==================================================
// GROUND
// ==================================================
function updateGround(
  delta
) {
  input.set(
    0,
    0,
    0
  );

  if (
    keys["KeyW"]
  ) {
    input.add(forward);
  }

  if (
    keys["KeyS"]
  ) {
    input.sub(forward);
  }

  if (
    keys["KeyD"]
  ) {
    input.add(right);
  }

  if (
    keys["KeyA"]
  ) {
    input.sub(right);
  }

  let speed =
    Math.hypot(
      velocity.x,
      velocity.z
    );

  if (
    input.lengthSq() > 0
  ) {
    input.normalize();

    speed =
      moveTowards(
        speed,
        MAX_WALK_SPEED,
        GROUND_ACCEL *
        delta
      );

    targetDirection.copy(
      input
    );

    currentDirection.set(
      velocity.x,
      0,
      velocity.z
    );

    if (
      currentDirection.lengthSq() <
      0.001
    ) {
      currentDirection.copy(
        targetDirection
      );
    } else {
      currentDirection.normalize();
    }

    currentDirection
      .lerp(
        targetDirection,
        Math.min(
          GROUND_TURN *
          delta,
          1
        )
      )
      .normalize();

    velocity.x =
      currentDirection.x *
      speed;

    velocity.z =
      currentDirection.z *
      speed;
  } else if (
    speed > 0
  ) {
    const newSpeed =
      moveTowards(
        speed,
        0,
        GROUND_DECEL *
        delta
      );

    const scale =
      newSpeed /
      speed;

    velocity.x *= scale;
    velocity.z *= scale;
  }
}

// ==================================================
// DEATH
// ==================================================
function die() {
  if (dead) {
    return;
  }

  dead = true;

  velocity.set(
    0,
    0,
    0
  );

  releaseAnchor(
    leftAnchor
  );

  releaseAnchor(
    rightAnchor
  );

  deathScreen.style.display =
    "flex";

  setTimeout(
    respawn,
    2000
  );
}

function respawn() {
  camera.position.copy(
    SPAWN
  );

  velocity.set(
    0,
    0,
    0
  );

  health = MAX_HEALTH;
  gas = MAX_GAS;

  grounded = true;
  dead = false;

  wallStunTimer = 0;
  gasBurstCooldown = 0;

  lastSpaceTapTime =
    -Infinity;

  yaw = 0;
  pitch = 0;

  releaseAnchor(
    leftAnchor
  );

  releaseAnchor(
    rightAnchor
  );

  deathScreen.style.display =
    "none";
}

// ==================================================
// KEYBOARD
// ==================================================
window.addEventListener(
  "keydown",
  event => {
    if (
      event.code ===
      "Escape"
    ) {
      return;
    }

    if (
      event.code ===
      "Space"
    ) {
      event.preventDefault();

      if (
        !keys["Space"]
      ) {
        spacePressed = true;

        const now =
          performance.now() /
          1000;

        const doubleTap =
          now -
          lastSpaceTapTime <
          GAS_DOUBLE_TAP_WINDOW;

        if (
          doubleTap &&
          !grounded &&
          !dead &&
          wallStunTimer <= 0
        ) {
          const fired =
            gasBurst();

          if (fired) {
            lastSpaceTapTime =
              -Infinity;
          } else {
            lastSpaceTapTime =
              now;
          }
        } else {
          lastSpaceTapTime =
            now;
        }
      }
    }

    if (
      event.code ===
        "KeyQ" &&
      !keys["KeyQ"] &&
      wallStunTimer <= 0
    ) {
      toggleAnchor(
        leftAnchor
      );
    }

    if (
      event.code ===
        "KeyR" &&
      !keys["KeyR"] &&
      wallStunTimer <= 0
    ) {
      toggleAnchor(
        rightAnchor
      );
    }

    keys[event.code] =
      true;
  }
);

window.addEventListener(
  "keyup",
  event => {
    keys[event.code] =
      false;
  }
);

// ==================================================
// POINTER LOCK
// ==================================================
document.addEventListener(
  "pointerlockchange",
  () => {
    if (
      document.pointerLockElement !==
      renderer.domElement
    ) {
      for (
        const code
        of Object.keys(keys)
      ) {
        keys[code] = false;
      }

      spacePressed = false;
    }
  }
);

// ==================================================
// MOUSE
// ==================================================
renderer.domElement.addEventListener(
  "mousedown",
  event => {
    if (
      document.pointerLockElement !==
      renderer.domElement
    ) {
      if (
        event.button === 0
      ) {
        renderer.domElement
          .requestPointerLock();
      }

      return;
    }

    if (
      dead ||
      wallStunTimer > 0
    ) {
      return;
    }

    if (
      event.button === 0
    ) {
      bladeAttack();
    }

    if (
      event.button === 2
    ) {
      toggleBothAnchors();
    }
  }
);

renderer.domElement.addEventListener(
  "contextmenu",
  event => {
    event.preventDefault();
  }
);

document.addEventListener(
  "mousemove",
  event => {
    if (
      document.pointerLockElement !==
      renderer.domElement
    ) {
      return;
    }

    yaw -=
      event.movementX *
      MOUSE_SENSITIVITY;

    pitch -=
      event.movementY *
      MOUSE_SENSITIVITY;

    pitch =
      THREE.MathUtils.clamp(
        pitch,
        -Math.PI / 2 + 0.01,
        Math.PI / 2 - 0.01
      );
  }
);

// ==================================================
// DEBUG HUD
// ==================================================
const debugHUD =
  document.createElement(
    "div"
  );

Object.assign(
  debugHUD.style,
  {
    position: "fixed",
    left: "15px",
    top: "15px",
    color: "white",
    fontFamily: "monospace",
    fontSize: "18px",
    fontWeight: "bold",
    whiteSpace: "pre",
    textShadow:
      "0 1px 4px black",
    pointerEvents: "none",
    zIndex: "100"
  }
);

document.body.appendChild(
  debugHUD
);

// ==================================================
// MESSAGE HUD
// ==================================================
const messageHUD =
  document.createElement(
    "div"
  );

Object.assign(
  messageHUD.style,
  {
    position: "fixed",
    left: "50%",
    top: "35%",
    transform:
      "translate(-50%,-50%)",
    color: "white",
    fontFamily: "Arial",
    fontSize: "38px",
    fontWeight: "bold",
    textShadow:
      "0 3px 8px black",
    opacity: "0",
    transition:
      "opacity .15s",
    pointerEvents: "none",
    zIndex: "150"
  }
);

document.body.appendChild(
  messageHUD
);

let messageTimeout =
  null;

function showMessage(text) {
  messageHUD.textContent =
    text;

  messageHUD.style.opacity =
    "1";

  if (
    messageTimeout
  ) {
    clearTimeout(
      messageTimeout
    );
  }

  messageTimeout =
    setTimeout(
      () => {
        messageHUD.style.opacity =
          "0";
      },
      1000
    );
}

// ==================================================
// ANCHOR HUD
// ==================================================
const anchorHUD =
  document.createElement(
    "div"
  );

Object.assign(
  anchorHUD.style,
  {
    position: "fixed",
    left: "50%",
    top: "54%",
    transform:
      "translateX(-50%)",
    display: "flex",
    gap: "50px",
    color: "white",
    fontFamily: "monospace",
    fontSize: "18px",
    fontWeight: "bold",
    textShadow:
      "0 1px 4px black",
    pointerEvents: "none",
    zIndex: "100"
  }
);

const leftHUD =
  document.createElement(
    "span"
  );

const rightHUD =
  document.createElement(
    "span"
  );

anchorHUD.append(
  leftHUD,
  rightHUD
);

document.body.appendChild(
  anchorHUD
);

// ==================================================
// CROSSHAIR
// ==================================================
const crosshair =
  document.createElement(
    "div"
  );

Object.assign(
  crosshair.style,
  {
    position: "fixed",
    left: "50%",
    top: "50%",
    width: "6px",
    height: "6px",
    background: "white",
    borderRadius: "50%",
    transform:
      "translate(-50%,-50%)",
    boxShadow:
      "0 0 3px black",
    pointerEvents: "none",
    zIndex: "100"
  }
);

document.body.appendChild(
  crosshair
);

// ==================================================
// SMALL STATUS HUD
// ==================================================
const statusHUD =
  document.createElement(
    "div"
  );

Object.assign(
  statusHUD.style,
  {
    position: "fixed",
    left: "50%",
    top: "58%",
    transform:
      "translateX(-50%)",
    color: "#ffcc66",
    fontFamily: "monospace",
    fontSize: "15px",
    fontWeight: "bold",
    textShadow:
      "0 1px 3px black",
    pointerEvents: "none",
    opacity: "0",
    zIndex: "100"
  }
);

document.body.appendChild(
  statusHUD
);

// ==================================================
// RESOURCE HUD
// ==================================================
const resources =
  document.createElement(
    "div"
  );

Object.assign(
  resources.style,
  {
    position: "fixed",
    right: "25px",
    bottom: "25px",
    width: "300px",
    color: "white",
    fontFamily: "Arial",
    fontWeight: "bold",
    textShadow:
      "0 1px 3px black"
  }
);

document.body.appendChild(
  resources
);

function createBar(color) {
  const wrapper =
    document.createElement(
      "div"
    );

  wrapper.style.marginTop =
    "12px";

  const label =
    document.createElement(
      "div"
    );

  const background =
    document.createElement(
      "div"
    );

  Object.assign(
    background.style,
    {
      height: "18px",
      border:
        "2px solid white",
      background:
        "rgba(0,0,0,.6)",
      overflow: "hidden"
    }
  );

  const fill =
    document.createElement(
      "div"
    );

  fill.style.height =
    "100%";

  fill.style.background =
    color;

  background.appendChild(
    fill
  );

  wrapper.append(
    label,
    background
  );

  resources.appendChild(
    wrapper
  );

  return {
    label,
    fill
  };
}

const hpBar =
  createBar(
    "#e53935"
  );

const gasBar =
  createBar(
    "#29b6f6"
  );

// ==================================================
// DEATH SCREEN
// ==================================================
const deathScreen =
  document.createElement(
    "div"
  );

Object.assign(
  deathScreen.style,
  {
    position: "fixed",
    inset: "0",
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(100,0,0,.45)",
    color: "white",
    font:
      "bold 64px Arial",
    zIndex: "200"
  }
);

deathScreen.textContent =
  "YOU DIED";

document.body.appendChild(
  deathScreen
);

// ==================================================
// HUD HELPERS
// ==================================================
function anchorSymbol(
  anchor
) {
  if (
    anchor.state ===
    "FIRING"
  ) {
    return "→";
  }

  if (
    anchor.state ===
    "CONNECTED"
  ) {
    return "●";
  }

  return "○";
}

// ==================================================
// HUD UPDATE
// ==================================================
function updateHUD() {
  const speedMps =
    velocity.length() *
    METERS_PER_UNIT;

  const speedKmh =
    speedMps *
    3.6;

  const verticalMps =
    velocity.y *
    METERS_PER_UNIT;

  debugHUD.textContent =
    `Speed: ${speedMps.toFixed(1)} m/s\n` +
    `       ${speedKmh.toFixed(0)} km/h\n` +
    `Vertical: ${verticalMps.toFixed(1)} m/s\n` +
    `Titan: ${
      titanAlive
        ? `${Math.ceil(
            titanHealth
          )} / ${TITAN_MAX_HEALTH}`
        : "DOWN"
    }`;

  leftHUD.textContent =
    `Q L ${anchorSymbol(
      leftAnchor
    )}`;

  rightHUD.textContent =
    `${anchorSymbol(
      rightAnchor
    )} R R`;

  leftHUD.style.color =
    leftAnchor.state ===
    "OFF"
      ? "#777"
      : "#fff";

  rightHUD.style.color =
    rightAnchor.state ===
    "OFF"
      ? "#777"
      : "#fff";

  if (
    wallStunTimer > 0
  ) {
    statusHUD.textContent =
      `STUN ${wallStunTimer.toFixed(1)}s`;

    statusHUD.style.opacity =
      "1";
  } else {
    statusHUD.textContent = "";

    statusHUD.style.opacity =
      "0";
  }

  hpBar.label.textContent =
    `HP ${Math.ceil(
      health
    )} / ${MAX_HEALTH}`;

  hpBar.fill.style.width =
    `${
      health /
      MAX_HEALTH *
      100
    }%`;

  gasBar.label.textContent =
    `GAS ${Math.ceil(
      gas
    )} / ${MAX_GAS}`;

  gasBar.fill.style.width =
    `${
      gas /
      MAX_GAS *
      100
    }%`;
}

// ==================================================
// STUN UPDATE
// ==================================================
function updateStun(
  delta
) {
  if (
    wallStunTimer <= 0
  ) {
    return false;
  }

  wallStunTimer =
    Math.max(
      0,
      wallStunTimer -
      delta
    );

  velocity.y -=
    GRAVITY *
    delta;

  const drag =
    Math.exp(
      -1.8 *
      delta
    );

  velocity.x *= drag;
  velocity.z *= drag;

  moveHorizontal(delta);

  if (!dead) {
    moveVertical(delta);
  }

  spacePressed = false;

  return true;
}

// ==================================================
// PLAYER UPDATE
// ==================================================
function updatePlayer(
  delta
) {
  if (dead) {
    spacePressed = false;

    return;
  }

  gasBurstCooldown =
    Math.max(
      0,
      gasBurstCooldown -
      delta
    );

  camera.rotation.y = yaw;
  camera.rotation.x = pitch;

  forward.set(
    -Math.sin(yaw),
    0,
    -Math.cos(yaw)
  );

  right.set(
    Math.cos(yaw),
    0,
    -Math.sin(yaw)
  );

  if (
    updateStun(delta)
  ) {
    return;
  }

  if (
    grounded &&
    !leftAnchor.connected &&
    !rightAnchor.connected
  ) {
    updateGround(delta);
  }

  if (
    spacePressed &&
    grounded
  ) {
    velocity.y =
      JUMP_SPEED;

    grounded = false;
  }

  velocity.y -=
    GRAVITY *
    delta;

  updateAnchorProjectile(
    leftAnchor,
    delta
  );

  updateAnchorProjectile(
    rightAnchor,
    delta
  );

  const gasAvailable =
    updateWireGas(
      delta
    );

  updateWire(
    leftAnchor,
    delta,
    gasAvailable
  );

  updateWire(
    rightAnchor,
    delta,
    gasAvailable
  );

  updateGasFlight(delta);

  updateAirDrag(delta);

  limitSpeed();

  moveHorizontal(delta);

  if (dead) {
    return;
  }

  moveVertical(delta);

  if (dead) {
    return;
  }

  constrainRope(
    leftAnchor
  );

  constrainRope(
    rightAnchor
  );

  spacePressed = false;
}

// ==================================================
// RESIZE
// ==================================================
window.addEventListener(
  "resize",
  () => {
    camera.aspect =
      window.innerWidth /
      window.innerHeight;

    camera
      .updateProjectionMatrix();

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );
  }
);

// ==================================================
// GAME LOOP
// ==================================================
const clock =
  new THREE.Clock();

function animate() {
  requestAnimationFrame(
    animate
  );

  const delta =
    Math.min(
      clock.getDelta(),
      0.05
    );

  updatePlayer(delta);

  updateBladeAnimation(delta);

  updateWireVisual(
    leftAnchor
  );

  updateWireVisual(
    rightAnchor
  );

  updateCameraEffects(delta);

  updateHUD();

  renderer.render(
    scene,
    camera
  );
}

animate();
