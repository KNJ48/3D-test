import * as THREE from "three";

// ==================================================
// SCALE
// ==================================================
const METERS_PER_UNIT = 0.5;

function mpsToUnits(v) {
  return v / METERS_PER_UNIT;
}

function unitsToMps(v) {
  return v * METERS_PER_UNIT;
}

function kmhToUnits(v) {
  return (v / 3.6) / METERS_PER_UNIT;
}

function unitsToKmh(v) {
  return unitsToMps(v) * 3.6;
}

// ==================================================
// PLAYER
// ==================================================
const PLAYER_HEIGHT = 1.7;
const PLAYER_RADIUS = 0.35;

// 実9.8m/s²
const GRAVITY =
  mpsToUnits(9.8);

// 通常ジャンプ
const JUMP_SPEED = 3.5;

// 地上最高10m/s
const MAX_WALK_SPEED =
  mpsToUnits(10);

const GROUND_ACCEL = 18;
const GROUND_DECEL = 22;
const GROUND_TURN = 12;

// 全体最高300km/h
const MAX_SPEED =
  kmhToUnits(300);

// ==================================================
// AIR MOVEMENT
// ==================================================

// 空中WASD推進
// 実40m/s²
const AIR_MOVE_ACCEL =
  40 / METERS_PER_UNIT;

// 無操作時の抵抗
const AIR_DRAG = 0.4;

// ==================================================
// SPACE DOUBLE TAP
// ==================================================
const DOUBLE_TAP_WINDOW = 0.3;

// ダブルSpace時
// 上方向10m/s
const GAS_JUMP_SPEED =
  mpsToUnits(10);

const GAS_JUMP_COST = 5;

// ==================================================
// GAS
// ==================================================
const MAX_GAS = 500;

// 空中WASD推進の消費
const AIR_GAS_USE_RATE = 2.4;

// ==================================================
// WALL JUMP
// ==================================================
// 正面30km/h
// 45°60km/h
// 30°120km/h
const WALL_JUMP_BASE_KMH = 30;

// 壁から離れる速度5m/s
const WALL_JUMP_SPEED =
  mpsToUnits(5);

const WALL_PUSH_EPSILON = 0.03;

// ==================================================
// DAMAGE
// ==================================================
const MAX_HEALTH = 500;

const SAFE_IMPACT_KMH = 100;
const LETHAL_IMPACT_KMH = 300;
const MIN_DAMAGE_THRESHOLD = 10;

// ==================================================
// WIRE
// ==================================================
const ANCHOR_SHOT_SPEED = 150;
const WIRE_RADIUS = 0.07;
const DUAL_AIM_OFFSET = 0.035;

// ==================================================
// ATTACK
// ==================================================
const ATTACK_RANGE = 3.5;
const MIN_KILL_SPEED = 8;
const ATTACK_COOLDOWN = 0.35;

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

// 実100m
const CITY_WALL_HEIGHT =
  100 / METERS_PER_UNIT;

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
  new THREE.Color(
    0x87ceeb
  );

// ==================================================
// CAMERA
// ==================================================
const camera =
  new THREE.PerspectiveCamera(
    75,
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

camera.position.copy(
  SPAWN
);

camera.rotation.order =
  "YXZ";

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

renderer.toneMappingExposure =
  1;

renderer.shadowMap.enabled =
  true;

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

sun.shadow.mapSize.width =
  2048;

sun.shadow.mapSize.height =
  2048;

sun.shadow.camera.left =
  -350;

sun.shadow.camera.right =
  350;

sun.shadow.camera.top =
  1200;

sun.shadow.camera.bottom =
  -350;

sun.shadow.camera.near =
  1;

sun.shadow.camera.far =
  2000;

sun.shadow.normalBias =
  0.02;

scene.add(
  sun
);

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

ground.receiveShadow =
  true;

scene.add(
  ground
);

// ==================================================
// WORLD LISTS
// ==================================================
const colliders = [];
const anchorTargets = [];

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

const toriiMaterial =
  new THREE.MeshStandardMaterial({
    color: 0xb3261e,
    roughness: 0.72
  });

const toriiDarkMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x65110d,
    roughness: 0.82
  });

// ==================================================
// WORLD OBJECT
// ==================================================
function addWorldObject(
  mesh,
  collision = true,
  anchorable = true
) {
  mesh.castShadow =
    true;

  mesh.receiveShadow =
    true;

  scene.add(
    mesh
  );

  if (
    collision
  ) {
    colliders.push(
      new THREE.Box3()
        .setFromObject(
          mesh
        )
    );
  }

  if (
    anchorable
  ) {
    anchorTargets.push(
      mesh
    );
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

      addWorldObject(
        tower
      );
    }
  }
}

// ==================================================
// GIANT TORII
// ==================================================
function createGiantTorii() {
  const centerX = 0;
  const centerZ = -120;

  const leftPillar =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        8,
        130,
        8
      ),
      toriiMaterial
    );

  leftPillar.position.set(
    centerX - 42,
    65,
    centerZ
  );

  addWorldObject(
    leftPillar
  );

  const rightPillar =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        8,
        130,
        8
      ),
      toriiMaterial
    );

  rightPillar.position.set(
    centerX + 42,
    65,
    centerZ
  );

  addWorldObject(
    rightPillar
  );

  const mainBeam =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        110,
        10,
        10
      ),
      toriiMaterial
    );

  mainBeam.position.set(
    centerX,
    135,
    centerZ
  );

  addWorldObject(
    mainBeam
  );

  const upperBeam =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        125,
        7,
        12
      ),
      toriiDarkMaterial
    );

  upperBeam.position.set(
    centerX,
    145,
    centerZ
  );

  addWorldObject(
    upperBeam
  );

  const lowerBeam =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        88,
        7,
        8
      ),
      toriiMaterial
    );

  lowerBeam.position.set(
    centerX,
    105,
    centerZ
  );

  addWorldObject(
    lowerBeam
  );

  const centerSupport =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        9,
        30,
        8
      ),
      toriiDarkMaterial
    );

  centerSupport.position.set(
    centerX,
    120,
    centerZ
  );

  addWorldObject(
    centerSupport
  );
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

  addWorldObject(
    wall
  );
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
  const road =
    new THREE.Mesh(
      new THREE.PlaneGeometry(
        width,
        depth
      ),
      roadMaterial
    );

  road.rotation.x =
    -Math.PI / 2;

  road.position.set(
    x,
    0.025,
    z
  );

  road.receiveShadow =
    true;

  scene.add(
    road
  );
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

  addWorldObject(
    house
  );

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

  roof.castShadow =
    true;

  scene.add(
    roof
  );

  anchorTargets.push(
    roof
  );
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
          (
            seed * 7
          ) % 15,
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

scene.add(
  titan
);

const titanSkinMaterial =
  new THREE.MeshStandardMaterial({
    color: 0xd8a27f,
    roughness: 0.75
  });

const titanHairMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x30251f,
    roughness: 0.9
  });

const titanWeakMaterial =
  new THREE.MeshBasicMaterial({
    color: 0xffee55,
    transparent: true,
    opacity: 0.15
  });

function addTitanPart(
  geometry,
  material,
  x,
  y,
  z
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

  mesh.castShadow =
    true;

  mesh.receiveShadow =
    true;

  titan.add(
    mesh
  );

  anchorTargets.push(
    mesh
  );

  return mesh;
}

// Legs
addTitanPart(
  new THREE.CapsuleGeometry(
    0.75,
    5.2,
    8,
    12
  ),
  titanSkinMaterial,
  -0.9,
  3.3,
  0
);

addTitanPart(
  new THREE.CapsuleGeometry(
    0.75,
    5.2,
    8,
    12
  ),
  titanSkinMaterial,
  0.9,
  3.3,
  0
);

// Torso
addTitanPart(
  new THREE.CapsuleGeometry(
    2.2,
    4.2,
    8,
    12
  ),
  titanSkinMaterial,
  0,
  8.7,
  0
);

// Arms
const leftTitanArm =
  addTitanPart(
    new THREE.CapsuleGeometry(
      0.55,
      5,
      8,
      10
    ),
    titanSkinMaterial,
    -2.6,
    8.5,
    0
  );

leftTitanArm.rotation.z =
  -0.15;

const rightTitanArm =
  addTitanPart(
    new THREE.CapsuleGeometry(
      0.55,
      5,
      8,
      10
    ),
    titanSkinMaterial,
    2.6,
    8.5,
    0
  );

rightTitanArm.rotation.z =
  0.15;

// Head
addTitanPart(
  new THREE.SphereGeometry(
    1.5,
    20,
    16
  ),
  titanSkinMaterial,
  0,
  13.4,
  0
);

// Hair
const titanHair =
  new THREE.Mesh(
    new THREE.SphereGeometry(
      1.55,
      20,
      16,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.48
    ),
    titanHairMaterial
  );

titanHair.position.set(
  0,
  13.7,
  0
);

titan.add(
  titanHair
);

// Nape
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
  12.2,
  -1.45
);

titan.add(
  titanNape
);

let titanAlive =
  true;

const attackTargets = [
  titanNape
];

// ==================================================
// BUILD WORLD
// ==================================================
createTrainingArea();
createCityWall();
createCity();
createGiantTorii();

// ==================================================
// PLAYER STATE
// ==================================================
const velocity =
  new THREE.Vector3();

let grounded =
  true;

let health =
  MAX_HEALTH;

let gas =
  MAX_GAS;

let dead =
  false;

// ==================================================
// BLADE
// ==================================================
scene.add(
  camera
);

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

function createBlade(
  side
) {
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

  group.add(
    handle
  );

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

  group.add(
    blade
  );

  group.position.set(
    side * 0.38,
    -0.35,
    -0.7
  );

  group.rotation.x =
    -0.12;

  group.rotation.y =
    side * -0.12;

  camera.add(
    group
  );

  return group;
}

const leftBlade =
  createBlade(-1);

const rightBlade =
  createBlade(1);

let attacking =
  false;

let attackTimer =
  0;

let attackCooldownTimer =
  0;

const attackRaycaster =
  new THREE.Raycaster();

// ==================================================
// ATTACK
// ==================================================
function bladeAttack() {
  if (
    dead ||
    attacking ||
    attackCooldownTimer > 0
  ) {
    return;
  }

  attacking =
    true;

  attackTimer =
    0;

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
      attackTargets,
      false
    );

  if (
    hits.length ===
      0 ||
    !titanAlive
  ) {
    return;
  }

  if (
    velocity.length() <
    MIN_KILL_SPEED
  ) {
    showMessage(
      "NOT ENOUGH SPEED"
    );

    return;
  }

  killTitan();
}

function killTitan() {
  titanAlive =
    false;

  showMessage(
    "TITAN DOWN"
  );

  titan.rotation.z =
    0.15;

  setTimeout(
    () => {
      titan.visible =
        false;
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

  titan.visible =
    true;

  titanAlive =
    true;
}

// ==================================================
// BLADE ANIMATION
// ==================================================
function updateBladeAnimation(
  delta
) {
  if (
    attackCooldownTimer > 0
  ) {
    attackCooldownTimer -=
      delta;
  }

  if (
    !attacking
  ) {
    return;
  }

  attackTimer +=
    delta;

  const duration =
    0.28;

  const t =
    Math.min(
      attackTimer /
        duration,
      1
    );

  const swing =
    Math.sin(
      t *
      Math.PI
    );

  leftBlade.rotation.z =
    -swing *
    1.15;

  rightBlade.rotation.z =
    swing *
    1.15;

  leftBlade.rotation.x =
    -0.12 +
    swing *
    0.65;

  rightBlade.rotation.x =
    -0.12 +
    swing *
    0.65;

  if (
    t >= 1
  ) {
    attacking =
      false;

    leftBlade.rotation.z =
      0;

    rightBlade.rotation.z =
      0;

    leftBlade.rotation.x =
      -0.12;

    rightBlade.rotation.x =
      -0.12;
  }
}

// ==================================================
// INPUT STATE
// ==================================================
const keys = {};

let yaw = 0;
let pitch = 0;

const MOUSE_SENSITIVITY =
  0.002;

// Spaceダブルタップ
let lastSpaceTapTime =
  -Infinity;

// 地上ジャンプ用
let groundJumpRequested =
  false;

// ==================================================
// TEMP VECTORS
// ==================================================
const forward =
  new THREE.Vector3();

const right =
  new THREE.Vector3();

const input =
  new THREE.Vector3();

const airInput =
  new THREE.Vector3();

const currentDirection =
  new THREE.Vector3();

const targetDirection =
  new THREE.Vector3();

const wireDirection =
  new THREE.Vector3();

const ropeDirection =
  new THREE.Vector3();

const wireMiddle =
  new THREE.Vector3();

const projectileDirection =
  new THREE.Vector3();

const yAxis =
  new THREE.Vector3(
    0,
    1,
    0
  );

// ==================================================
// UTILITY
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

function isCtrlPressed() {
  return (
    keys["ControlLeft"] ||
    keys["ControlRight"]
  );
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

  wire.visible =
    false;

  scene.add(
    wire
  );

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

    /*
     * Ctrlを押した瞬間の長さ。
     */
    lockedLength: 0,

    lengthLocked: false,

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
    dead
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
    hits.length ===
    0
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

  anchor.target =
    hit.object;

  anchor.projectilePosition.copy(
    camera.position
  );

  anchor.lengthLocked =
    false;

  anchor.lockedLength =
    0;

  anchor.wire.visible =
    true;
}

function connectAnchor(
  anchor
) {
  anchor.state =
    "CONNECTED";

  anchor.connected =
    true;

  anchor.point.copy(
    anchor.targetPoint
  );

  /*
   * Ctrlがすでに押されているなら
   * 接続した瞬間の距離で固定。
   */
  if (
    isCtrlPressed()
  ) {
    lockAnchorLength(
      anchor
    );
  }
}

function releaseAnchor(
  anchor
) {
  anchor.state =
    "OFF";

  anchor.connected =
    false;

  anchor.target =
    null;

  anchor.lengthLocked =
    false;

  anchor.lockedLength =
    0;

  anchor.wire.visible =
    false;
}

function toggleAnchor(
  anchor
) {
  if (
    anchor.state ===
    "OFF"
  ) {
    fireAnchor(
      anchor
    );
  } else {
    releaseAnchor(
      anchor
    );
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
// ANCHOR PROJECTILE
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
    travel >=
    remaining
  ) {
    anchor.projectilePosition.copy(
      anchor.targetPoint
    );

    connectAnchor(
      anchor
    );

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
    anchor.state ===
    "OFF"
  ) {
    return;
  }

  const end =
    anchor.state ===
      "FIRING"
      ? anchor.projectilePosition
      : anchor.point;

  wireDirection.subVectors(
    end,
    camera.position
  );

  const distance =
    wireDirection.length();

  if (
    distance <
    0.001
  ) {
    anchor.wire.visible =
      false;

    return;
  }

  anchor.wire.visible =
    true;

  wireMiddle
    .copy(
      camera.position
    )
    .add(
      end
    )
    .multiplyScalar(
      0.5
    );

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
// CTRL ROPE LOCK
// ==================================================
function lockAnchorLength(
  anchor
) {
  if (
    !anchor.connected
  ) {
    return;
  }

  anchor.lockedLength =
    camera.position.distanceTo(
      anchor.point
    );

  anchor.lengthLocked =
    true;
}

function unlockAnchorLength(
  anchor
) {
  anchor.lengthLocked =
    false;
}

/*
 * Ctrlを押した瞬間に呼ぶ。
 *
 * ここでは加速処理は絶対にしない。
 */
function startRopeLock() {
  lockAnchorLength(
    leftAnchor
  );

  lockAnchorLength(
    rightAnchor
  );
}

/*
 * Ctrlを離した瞬間。
 */
function stopRopeLock() {
  unlockAnchorLength(
    leftAnchor
  );

  unlockAnchorLength(
    rightAnchor
  );
}

// ==================================================
// STRICT ROPE LENGTH CONSTRAINT
// ==================================================
function constrainLockedRope(
  anchor
) {
  if (
    !anchor.connected ||
    !anchor.lengthLocked ||
    !isCtrlPressed()
  ) {
    return;
  }

  ropeDirection.subVectors(
    camera.position,
    anchor.point
  );

  const distance =
    ropeDirection.length();

  if (
    distance <
    0.001
  ) {
    return;
  }

  ropeDirection.normalize();

  /*
   * Ctrl中は必ず
   *
   * distance === lockedLength
   *
   * にする。
   *
   * 近づくことも、
   * 離れることもできない。
   *
   * 接線方向には自由に動ける。
   */
  camera.position
    .copy(
      anchor.point
    )
    .addScaledVector(
      ropeDirection,
      anchor.lockedLength
    );

  /*
   * 半径方向の速度を完全除去。
   *
   * 内向き・外向きの両方を消す。
   *
   * 接線方向だけ残る。
   */
  const radialVelocity =
    velocity.dot(
      ropeDirection
    );

  velocity.addScaledVector(
    ropeDirection,
    -radialVelocity
  );
}

// ==================================================
// DOUBLE SPACE GAS JUMP
// ==================================================
function doGasJump() {
  if (
    grounded ||
    gas <
      GAS_JUMP_COST
  ) {
    return;
  }

  gas -=
    GAS_JUMP_COST;

  gas =
    Math.max(
      gas,
      0
    );

  /*
   * 落下中なら即+10m/s。
   */
  if (
    velocity.y <= 0
  ) {
    velocity.y =
      GAS_JUMP_SPEED;
  } else {
    /*
     * 上昇中なら現在速度+10m/s。
     */
    velocity.y +=
      GAS_JUMP_SPEED;
  }
}

function handleSpacePress() {
  const now =
    performance.now() /
    1000;

  /*
   * 地上なら普通のジャンプ。
   */
  if (
    grounded
  ) {
    groundJumpRequested =
      true;

    lastSpaceTapTime =
      -Infinity;

    return;
  }

  /*
   * 空中でのSpace単押しは
   * 何もしない。
   *
   * 2回目だけガスジャンプ。
   */
  if (
    now -
      lastSpaceTapTime <=
    DOUBLE_TAP_WINDOW
  ) {
    doGasJump();

    /*
     * 三連打で2回連続発動しないよう
     * 一度リセット。
     */
    lastSpaceTapTime =
      -Infinity;
  } else {
    lastSpaceTapTime =
      now;
  }
}

// ==================================================
// AIR WASD GAS ACCELERATION
// ==================================================
function updateAirMovement(
  delta
) {
  if (
    grounded ||
    gas <= 0
  ) {
    return;
  }

  airInput.set(
    0,
    0,
    0
  );

  if (
    keys["KeyW"]
  ) {
    airInput.add(
      forward
    );
  }

  if (
    keys["KeyS"]
  ) {
    airInput.sub(
      forward
    );
  }

  if (
    keys["KeyD"]
  ) {
    airInput.add(
      right
    );
  }

  if (
    keys["KeyA"]
  ) {
    airInput.sub(
      right
    );
  }

  if (
    airInput.lengthSq() <=
    0
  ) {
    return;
  }

  /*
   * 斜めでも加速度一定。
   */
  airInput.normalize();

  /*
   * Space不要。
   *
   * Wを押しただけで
   * 前方へ40m/s²。
   */
  velocity.x +=
    airInput.x *
    AIR_MOVE_ACCEL *
    delta;

  velocity.z +=
    airInput.z *
    AIR_MOVE_ACCEL *
    delta;

  /*
   * 空中WASDはガス推進なので消費。
   */
  gas -=
    AIR_GAS_USE_RATE *
    delta;

  gas =
    Math.max(
      gas,
      0
    );
}

// ==================================================
// AIR DRAG
// ==================================================
function updateAirDrag(
  delta
) {
  if (
    grounded
  ) {
    return;
  }

  const hasMovementInput =
    keys["KeyW"] ||
    keys["KeyA"] ||
    keys["KeyS"] ||
    keys["KeyD"];

  /*
   * Ctrl中はブランコの慣性を
   * 不自然に削らない。
   */
  if (
    hasMovementInput ||
    isCtrlPressed()
  ) {
    return;
  }

  const factor =
    Math.exp(
      -AIR_DRAG *
      delta
    );

  velocity.x *=
    factor;

  velocity.z *=
    factor;

  if (
    Math.abs(
      velocity.x
    ) <
    0.001
  ) {
    velocity.x = 0;
  }

  if (
    Math.abs(
      velocity.z
    ) <
    0.001
  ) {
    velocity.z = 0;
  }
}

// ==================================================
// DAMAGE
// ==================================================
function impactDamage(
  speed
) {
  const kmh =
    unitsToKmh(
      Math.abs(
        speed
      )
    );

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
  if (
    dead
  ) {
    return;
  }

  health -=
    impactDamage(
      speed
    );

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

function findCollision(
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
      return box;
    }
  }

  return null;
}

function collides(
  position
) {
  return (
    findCollision(
      position
    ) !== null
  );
}

// ==================================================
// WALL JUMP
// ==================================================
function getWallJumpInfo(
  axis
) {
  const vx =
    Math.abs(
      velocity.x
    );

  const vz =
    Math.abs(
      velocity.z
    );

  const horizontal =
    Math.hypot(
      vx,
      vz
    );

  if (
    horizontal <
    0.001
  ) {
    return {
      speedKmh: 0,
      allowedKmh:
        WALL_JUMP_BASE_KMH,
      canJump: true
    };
  }

  const normal =
    axis === "x"
      ? vx
      : vz;

  const sinAngle =
    THREE.MathUtils.clamp(
      normal /
        horizontal,
      0,
      1
    );

  const speedKmh =
    unitsToKmh(
      horizontal
    );

  const sinSquared =
    sinAngle *
    sinAngle;

  const allowedKmh =
    sinSquared <
      0.000001
      ? Infinity
      : WALL_JUMP_BASE_KMH /
        sinSquared;

  return {
    speedKmh,
    allowedKmh,

    canJump:
      speedKmh <=
      allowedKmh
  };
}

function shouldAutoWallJump(
  axis
) {
  if (
    grounded
  ) {
    return false;
  }

  return (
    getWallJumpInfo(
      axis
    ).canJump
  );
}

function autoWallJumpX(
  box
) {
  const center =
    (
      box.min.x +
      box.max.x
    ) / 2;

  const normal =
    camera.position.x <
      center
      ? -1
      : 1;

  velocity.x =
    normal *
    WALL_JUMP_SPEED;

  if (
    normal < 0
  ) {
    camera.position.x =
      box.min.x -
      PLAYER_RADIUS -
      WALL_PUSH_EPSILON;
  } else {
    camera.position.x =
      box.max.x +
      PLAYER_RADIUS +
      WALL_PUSH_EPSILON;
  }

  grounded = false;
}

function autoWallJumpZ(
  box
) {
  const center =
    (
      box.min.z +
      box.max.z
    ) / 2;

  const normal =
    camera.position.z <
      center
      ? -1
      : 1;

  velocity.z =
    normal *
    WALL_JUMP_SPEED;

  if (
    normal < 0
  ) {
    camera.position.z =
      box.min.z -
      PLAYER_RADIUS -
      WALL_PUSH_EPSILON;
  } else {
    camera.position.z =
      box.max.z +
      PLAYER_RADIUS +
      WALL_PUSH_EPSILON;
  }

  grounded = false;
}

// ==================================================
// HORIZONTAL MOVE
// ==================================================
function moveHorizontal(
  delta
) {
  const nextX =
    camera.position.clone();

  nextX.x +=
    velocity.x *
    delta;

  const hitX =
    findCollision(
      nextX
    );

  if (
    !hitX
  ) {
    camera.position.x =
      nextX.x;
  } else if (
    shouldAutoWallJump(
      "x"
    )
  ) {
    autoWallJumpX(
      hitX
    );
  } else {
    damageFromImpact(
      velocity.x
    );

    velocity.x = 0;
  }

  if (
    dead
  ) {
    return;
  }

  const nextZ =
    camera.position.clone();

  nextZ.z +=
    velocity.z *
    delta;

  const hitZ =
    findCollision(
      nextZ
    );

  if (
    !hitZ
  ) {
    camera.position.z =
      nextZ.z;
  } else if (
    shouldAutoWallJump(
      "z"
    )
  ) {
    autoWallJumpZ(
      hitZ
    );
  } else {
    damageFromImpact(
      velocity.z
    );

    velocity.z = 0;
  }
}

// ==================================================
// VERTICAL MOVE
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
    !collides(
      next
    )
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

      if (
        !horizontal
      ) {
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
// GROUND CONTROL
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
    input.add(
      forward
    );
  }

  if (
    keys["KeyS"]
  ) {
    input.sub(
      forward
    );
  }

  if (
    keys["KeyD"]
  ) {
    input.add(
      right
    );
  }

  if (
    keys["KeyA"]
  ) {
    input.sub(
      right
    );
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

    velocity.x *=
      scale;

    velocity.z *=
      scale;
  }
}

// ==================================================
// SPEED LIMIT
// ==================================================
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
// DEATH
// ==================================================
function die() {
  if (
    dead
  ) {
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

  health =
    MAX_HEALTH;

  gas =
    MAX_GAS;

  grounded = true;

  dead = false;

  yaw = 0;
  pitch = 0;

  lastSpaceTapTime =
    -Infinity;

  groundJumpRequested =
    false;

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

    // ----------------------------------------------
    // CTRL = rope length lock ONLY
    // ----------------------------------------------
    if (
      event.code ===
        "ControlLeft" ||
      event.code ===
        "ControlRight"
    ) {
      if (
        document.pointerLockElement ===
        renderer.domElement
      ) {
        event.preventDefault();
      }

      /*
       * リピートではなく
       * 押した瞬間だけ固定。
       */
      if (
        !keys[event.code]
      ) {
        keys[event.code] =
          true;

        startRopeLock();
      }

      return;
    }

    // ----------------------------------------------
    // SPACE
    // ----------------------------------------------
    if (
      event.code ===
      "Space"
    ) {
      event.preventDefault();

      if (
        !keys["Space"]
      ) {
        handleSpacePress();
      }

      keys["Space"] =
        true;

      return;
    }

    // ----------------------------------------------
    // LEFT ANCHOR
    // ----------------------------------------------
    if (
      event.code ===
        "KeyQ" &&
      !keys["KeyQ"]
    ) {
      toggleAnchor(
        leftAnchor
      );
    }

    // ----------------------------------------------
    // RIGHT ANCHOR
    // ----------------------------------------------
    if (
      event.code ===
        "KeyR" &&
      !keys["KeyR"]
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
    if (
      event.code ===
        "ControlLeft" ||
      event.code ===
        "ControlRight"
    ) {
      keys[event.code] =
        false;

      /*
       * 左右Ctrlの両方が離れたときだけ解除。
       */
      if (
        !isCtrlPressed()
      ) {
        stopRopeLock();
      }

      return;
    }

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
        of Object.keys(
          keys
        )
      ) {
        keys[code] =
          false;
      }

      stopRopeLock();

      groundJumpRequested =
        false;

      lastSpaceTapTime =
        -Infinity;
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
      dead
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
        -Math.PI / 2 +
          0.01,
        Math.PI / 2 -
          0.01
      );
  }
);

// ==================================================
// HUD
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
// MESSAGE
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

function showMessage(
  text
) {
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
    pointerEvents: "none"
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
    pointerEvents: "none"
  }
);

document.body.appendChild(
  crosshair
);

// ==================================================
// RESOURCES
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

function createBar(
  color
) {
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
// HUD UPDATE
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
    return anchor.lengthLocked
      ? "◆"
      : "●";
  }

  return "○";
}

function updateHUD() {
  const speedMps =
    unitsToMps(
      velocity.length()
    );

  const speedKmh =
    speedMps *
    3.6;

  const verticalMps =
    unitsToMps(
      velocity.y
    );

  debugHUD.textContent =
    `Speed: ${speedMps.toFixed(1)} m/s\n` +
    ` ${speedKmh.toFixed(0)} km/h\n` +
    `Vertical: ${verticalMps.toFixed(1)} m/s\n` +
    `WASD GAS: 40 m/s²\n` +
    `Ctrl Rope: ${
      isCtrlPressed()
        ? "LOCKED"
        : "FREE"
    }\n` +
    `Max: 300 km/h\n` +
    `Titan: ${
      titanAlive
        ? "ALIVE"
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
// PLAYER UPDATE
// ==================================================
function updatePlayer(
  delta
) {
  if (
    dead
  ) {
    groundJumpRequested =
      false;

    return;
  }

  camera.rotation.y =
    yaw;

  camera.rotation.x =
    pitch;

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

  // ----------------------------------------------
  // Ground
  // ----------------------------------------------
  if (
    grounded
  ) {
    updateGround(
      delta
    );
  }

  // ----------------------------------------------
  // Ground jump
  // ----------------------------------------------
  if (
    groundJumpRequested &&
    grounded
  ) {
    velocity.y =
      JUMP_SPEED;

    grounded =
      false;
  }

  groundJumpRequested =
    false;

  // ----------------------------------------------
  // Gravity
  // ----------------------------------------------
  velocity.y -=
    GRAVITY *
    delta;

  // ----------------------------------------------
  // Anchor projectile
  // ----------------------------------------------
  updateAnchorProjectile(
    leftAnchor,
    delta
  );

  updateAnchorProjectile(
    rightAnchor,
    delta
  );

  // ----------------------------------------------
  // WASD = air acceleration
  // Ctrl has NO acceleration here.
  // ----------------------------------------------
  updateAirMovement(
    delta
  );

  // ----------------------------------------------
  // Air drag
  // ----------------------------------------------
  updateAirDrag(
    delta
  );

  // ----------------------------------------------
  // 300km/h
  // ----------------------------------------------
  limitSpeed();

  // ----------------------------------------------
  // Move
  // ----------------------------------------------
  moveHorizontal(
    delta
  );

  if (
    dead
  ) {
    return;
  }

  moveVertical(
    delta
  );

  if (
    dead
  ) {
    return;
  }

  // ----------------------------------------------
  // Ctrl = fixed rope radius ONLY
  // ----------------------------------------------
  constrainLockedRope(
    leftAnchor
  );

  constrainLockedRope(
    rightAnchor
  );
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

    camera.updateProjectionMatrix();

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );
  }
);

// ==================================================
// LOOP
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

  updatePlayer(
    delta
  );

  updateBladeAnimation(
    delta
  );

  updateWireVisual(
    leftAnchor
  );

  updateWireVisual(
    rightAnchor
  );

  updateHUD();

  renderer.render(
    scene,
    camera
  );
}

animate();
