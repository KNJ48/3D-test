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
const NORMAL_MAX_SPEED_KMH = 300;

const NORMAL_MAX_SPEED =
  NORMAL_MAX_SPEED_KMH /
  3.6 /
  METERS_PER_UNIT;

const TERMINAL_FALL_KMH = 300;

const TERMINAL_FALL_SPEED =
  TERMINAL_FALL_KMH /
  3.6 /
  METERS_PER_UNIT;

// ワイヤー側の非常用上限。
// 普通にはまず届かない。
const WIRE_SAFETY_MAX_KMH = 1000;

const WIRE_SAFETY_MAX_SPEED =
  WIRE_SAFETY_MAX_KMH /
  3.6 /
  METERS_PER_UNIT;

// 高速壁抜け対策
const MAX_MOVE_STEP = 0.22;

// ==================================================
// AIR
// ==================================================
const AIR_DRAG = 0.4;

// 300km/h超の慣性にだけ追加される抵抗
const HIGH_SPEED_DRAG = 0.32;

// ==================================================
// PLAYER DAMAGE
// ==================================================
const MAX_HEALTH = 500;

// 30km/h未満は安全
const SAFE_IMPACT_KMH = 30;

// 150km/hで即死
const LETHAL_IMPACT_KMH = 150;

const MIN_DAMAGE_THRESHOLD = 10;

// ==================================================
// WALL
// ==================================================
const WALL_JUMP_SAFE_KMH = 30;

const WALL_JUMP_BOOST = 1.04;
const WALL_JUMP_VERTICAL_SPEED = 2.5;

const WALL_STUN_MIN = 0.3;
const WALL_STUN_MAX = 2.5;
const WALL_STUN_MAX_KMH = 150;

// ==================================================
// GAS
// ==================================================
const MAX_GAS = 500;

const FLIGHT_GAS_USE_RATE = 2.4;

const WIRE_GAS_USE_RATE =
  FLIGHT_GAS_USE_RATE * 0.5;

// 上昇系は元の強さ
const GAS_RECOVERY_ACCEL = 28;
const GAS_CLIMB_SPEED = 8;
const GAS_CLIMB_ACCEL = 18;

// 24の80%
const AIR_CONTROL_ACCEL = 19.2;

// ==================================================
// GAS BURST
// ==================================================
const GAS_BURST_COST = 10;

const GAS_DOUBLE_TAP_WINDOW = 0.5;

const GAS_BURST_IMPULSE = 24;

// 0.5秒
const GAS_BURST_COOLDOWN = 0.5;

// ==================================================
// WIRE
// ==================================================

// 牽引開始時の初速
const WIRE_INITIAL_IMPULSE = 11;

// 継続加速度
const WIRE_SUSTAIN_ACCEL = 16;

// アンカー射出速度
const ANCHOR_SHOT_SPEED = 150;

// ワイヤー表示設定
const WIRE_VISUAL_RADIUS = 0.01;
const WIRE_VISUAL_SEGMENTS = 6;

// 黒
const WIRE_VISUAL_COLOR = 0x101214;

const WIRE_VISUAL_OPACITY = 1.0;

// 一人称視点での射出口
const WIRE_START_SIDE = 0.28;
const WIRE_START_DOWN = -0.22;
const WIRE_START_FORWARD = -0.45;

// ==================================================
// AUTO DUAL ANCHOR
// ==================================================

// 視線から左右へ何度まで探索するか
const AUTO_MAX_ANGLE = 68;

// 何度ずつ探索するか
const AUTO_ANGLE_STEP = 2;

// AUTOアンカー最大探索距離
const AUTO_MAX_DISTANCE = 350;

// 現在速度で何秒進むかを
// AUTOの先読み距離として使う
const AUTO_MIN_FORWARD_TIME = 1.5;

// 速度による先読み距離に
// さらに追加する前方距離
//
// 停止中でも最低15m先を狙う。
const AUTO_FORWARD_EXTRA_METERS = 15;

// 左右の奥行き差が20%以内なら
// 同じ建物列とみなす
const AUTO_DEPTH_TOLERANCE = 0.20;

// 左右アンカー接続点の最低間隔
const AUTO_MIN_SEPARATION = 5;

// 平均奥行きがこの値以内なら
// 同程度の列として深度差で比較
const AUTO_DEPTH_PRIORITY_EPSILON = 2;

// ==================================================
// BLADE
// ==================================================
const ATTACK_RANGE = 3.5;
const ATTACK_COOLDOWN = 0.35;

// ==================================================
// TITAN DAMAGE
// ==================================================
const TITAN_SLASH_REFERENCE_KMH = 150;

const TITAN_SLASH_BASE_DAMAGE = 200;

// うなじは累積ダメージではない。
// 一太刀の威力で判定。
const NAPE_KILL_POWER = 230;

const TITAN_ARM_MAX_HP = 300;
const TITAN_LEG_MAX_HP = 400;

const TITAN_PART_REGEN_TIME = 12;

// ==================================================
// TRAINING
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

camera.rotation.order =
  "YXZ";

const SPAWN =
  new THREE.Vector3(
    0,
    PLAYER_HEIGHT,
    12
  );

camera.position.copy(
  SPAWN
);

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
const textureLoader =
  new THREE.TextureLoader();

const groundTexture =
  textureLoader.load(
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
  textureLoader.load(
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

sun.shadow.camera.near = 1;
sun.shadow.camera.far = 2000;

sun.shadow.normalBias =
  0.02;

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

ground.receiveShadow =
  true;

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
        .setFromObject(
          mesh
        )
    );
  }

  if (anchorable) {
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
        x *
          TRAINING_SPACING,
        TRAINING_HEIGHT / 2,
        z *
          TRAINING_SPACING
      );

      addWorldObject(
        tower
      );
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
    CITY_CENTER_Z -
      halfD,
    CITY_WIDTH +
      CITY_WALL_THICKNESS,
    CITY_WALL_THICKNESS
  );

  createWallSegment(
    CITY_CENTER_X,
    CITY_CENTER_Z +
      halfD,
    CITY_WIDTH +
      CITY_WALL_THICKNESS,
    CITY_WALL_THICKNESS
  );

  createWallSegment(
    CITY_CENTER_X +
      halfW,
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
    CITY_CENTER_X -
      halfW,
    CITY_CENTER_Z -
      (
        CITY_GATE_WIDTH /
          2 +
        sideLength / 2
      ),
    CITY_WALL_THICKNESS,
    sideLength
  );

  createWallSegment(
    CITY_CENTER_X -
      halfW,
    CITY_CENTER_Z +
      (
        CITY_GATE_WIDTH /
          2 +
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

  scene.add(road);
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

  roof.castShadow = true;

  scene.add(roof);

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
        x *
          CITY_BLOCK_SPACING;

      const pz =
        CITY_CENTER_Z +
        z *
          CITY_BLOCK_SPACING;

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
        11 +
          seed % 13,
        seed
      );

      createHouse(
        px + 8,
        pz + 8,
        14,
        14,
        13 +
          (seed * 7) %
            15,
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

const titanParts = {
  armLeft: {
    health:
      TITAN_ARM_MAX_HP,
    maxHealth:
      TITAN_ARM_MAX_HP,
    destroyed: false,
    regenTimer: 0,
    meshes: []
  },

  armRight: {
    health:
      TITAN_ARM_MAX_HP,
    maxHealth:
      TITAN_ARM_MAX_HP,
    destroyed: false,
    regenTimer: 0,
    meshes: []
  },

  legLeft: {
    health:
      TITAN_LEG_MAX_HP,
    maxHealth:
      TITAN_LEG_MAX_HP,
    destroyed: false,
    regenTimer: 0,
    meshes: []
  },

  legRight: {
    health:
      TITAN_LEG_MAX_HP,
    maxHealth:
      TITAN_LEG_MAX_HP,
    destroyed: false,
    regenTimer: 0,
    meshes: []
  }
};

// ==================================================
// TITAN PART HELPER
// ==================================================
function addTitanPart(
  geometry,
  material,
  x,
  y,
  z,
  type,
  partId = null
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

  mesh.userData.titanType =
    type;

  mesh.userData.partId =
    partId;

  titan.add(mesh);

  anchorTargets.push(
    mesh
  );

  titanAttackTargets.push(
    mesh
  );

  if (
    partId &&
    titanParts[
      partId
    ]
  ) {
    titanParts[
      partId
    ].meshes.push(
      mesh
    );
  }

  return mesh;
}

// ==================================================
// TITAN LEGS
// ==================================================
function createTitanLeg(
  side
) {
  const id =
    side < 0
      ? "legLeft"
      : "legRight";

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
      id
    );

  thigh.scale.set(
    1.08,
    1,
    0.92
  );

  const knee =
    addTitanPart(
      new THREE.SphereGeometry(
        0.65,
        16,
        12
      ),
      titanDarkMaterial,
      side * 0.92,
      2.82,
      0,
      "LEG",
      id
    );

  knee.scale.set(
    0.92,
    1,
    0.86
  );

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
    id
  );

  const foot =
    addTitanPart(
      new THREE.SphereGeometry(
        0.7,
        18,
        14
      ),
      titanSkinMaterial,
      side * 0.92,
      0.46,
      0.38,
      "LEG",
      id
    );

  foot.scale.set(
    0.9,
    0.45,
    1.55
  );
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
    "BODY"
  );

titanPelvis.scale.set(
  1,
  0.75,
  0.75
);

const titanAbdomen =
  addTitanPart(
    new THREE.SphereGeometry(
      1.48,
      22,
      18
    ),
    titanSkinMaterial,
    0,
    7.45,
    0,
    "BODY"
  );

titanAbdomen.scale.set(
  0.9,
  1.15,
  0.68
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
    "BODY"
  );

titanTorso.scale.set(
  1.18,
  1.15,
  0.72
);

// ==================================================
// TITAN ARMS
// ==================================================
function createTitanArm(
  side
) {
  const id =
    side < 0
      ? "armLeft"
      : "armRight";

  const shoulder =
    addTitanPart(
      new THREE.SphereGeometry(
        0.82,
        18,
        14
      ),
      titanSkinMaterial,
      side * 2.48,
      10.15,
      0,
      "ARM",
      id
    );

  const upperArm =
    addTitanPart(
      new THREE.CapsuleGeometry(
        0.58,
        2.05,
        8,
        12
      ),
      titanSkinMaterial,
      side * 2.65,
      8.65,
      0,
      "ARM",
      id
    );

  upperArm.rotation.z =
    side * -0.1;

  addTitanPart(
    new THREE.SphereGeometry(
      0.5,
      16,
      12
    ),
    titanDarkMaterial,
    side * 2.78,
    7.25,
    0,
    "ARM",
    id
  );

  addTitanPart(
    new THREE.CapsuleGeometry(
      0.48,
      1.9,
      8,
      12
    ),
    titanSkinMaterial,
    side * 2.82,
    5.95,
    0,
    "ARM",
    id
  );

  const hand =
    addTitanPart(
      new THREE.SphereGeometry(
        0.62,
        18,
        14
      ),
      titanSkinMaterial,
      side * 2.84,
      4.65,
      0.08,
      "ARM",
      id
    );

  hand.scale.set(
    0.72,
    1.2,
    0.5
  );

  return shoulder;
}

createTitanArm(-1);
createTitanArm(1);

// ==================================================
// TITAN NECK / HEAD
// ==================================================
addTitanPart(
  new THREE.CylinderGeometry(
    0.58,
    0.78,
    1.5,
    18
  ),
  titanSkinMaterial,
  0,
  11.65,
  0,
  "BODY"
);

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
    "HEAD"
  );

titanHead.scale.set(
  0.83,
  1.07,
  0.82
);

const titanJaw =
  addTitanPart(
    new THREE.SphereGeometry(
      0.92,
      22,
      18
    ),
    titanSkinMaterial,
    0,
    12.7,
    0.52,
    "HEAD"
  );

titanJaw.scale.set(
  0.92,
  0.56,
  0.72
);

// ==================================================
// TITAN FACE
// ==================================================
function createTitanEye(
  side
) {
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

  anchorTargets.push(
    eye
  );

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

titan.add(
  titanMouth
);

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

titan.add(
  titanHair
);

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

titanNape.userData.titanType =
  "NAPE";

titan.add(
  titanNape
);

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

let health =
  MAX_HEALTH;

let gas =
  MAX_GAS;

let dead = false;

let wallStunTimer = 0;

// ==================================================
// GAS BURST STATE
// ==================================================
let lastSpaceTapTime =
  -Infinity;

let gasBurstCooldown = 0;

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
// INPUT
// ==================================================
const keys = {};

let spacePressed = false;

let yaw = 0;
let pitch = 0;

const MOUSE_SENSITIVITY =
  0.002;

// ==================================================
// TEMP VECTORS
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

const projectileDirection =
  new THREE.Vector3();

const burstDirection =
  new THREE.Vector3();

const autoForward =
  new THREE.Vector3();

const autoUp =
  new THREE.Vector3();

const autoOffset =
  new THREE.Vector3();

const autoDirection =
  new THREE.Vector3();

const tempTravel =
  new THREE.Vector3();

const tempAimDirection =
  new THREE.Vector3();

const tempFuturePlayer =
  new THREE.Vector3();

const tempFutureTarget =
  new THREE.Vector3();

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

function speedToKmh(
  speed
) {
  return (
    Math.abs(speed) *
    METERS_PER_UNIT *
    3.6
  );
}

function limitNormalSpeed() {
  const speed =
    velocity.length();

  if (
    speed >
    NORMAL_MAX_SPEED
  ) {
    velocity.multiplyScalar(
      NORMAL_MAX_SPEED /
        speed
    );
  }
}

function limitWireSafetySpeed() {
  const speed =
    velocity.length();

  if (
    speed >
    WIRE_SAFETY_MAX_SPEED
  ) {
    velocity.multiplyScalar(
      WIRE_SAFETY_MAX_SPEED /
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
    gas <
      GAS_BURST_COST
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

  // 純粋な加算方式
  velocity.addScaledVector(
    burstDirection,
    GAS_BURST_IMPULSE
  );

  // ワイヤー牽引中なら
  // 300km/hを突破できる。
  if (
    leftAnchor.pulling ||
    rightAnchor.pulling
  ) {
    limitWireSafetySpeed();
  } else {
    limitNormalSpeed();
  }

  return true;
}

// ==================================================
// TITAN SLASH POWER
// ==================================================
function calculateSlashPower() {
  const kmh =
    velocity.length() *
    METERS_PER_UNIT *
    3.6;

  const ratio =
    kmh /
    TITAN_SLASH_REFERENCE_KMH;

  return (
    TITAN_SLASH_BASE_DAMAGE *
    ratio *
    ratio
  );
}

// ==================================================
// TITAN PART DAMAGE
// ==================================================
function damageTitanPart(
  partId,
  damage
) {
  const part =
    titanParts[
      partId
    ];

  if (
    !part ||
    part.destroyed
  ) {
    return;
  }

  part.health -=
    damage;

  if (
    part.health > 0
  ) {
    return;
  }

  part.health = 0;

  part.destroyed = true;

  part.regenTimer =
    TITAN_PART_REGEN_TIME;

  for (
    const mesh
    of part.meshes
  ) {
    mesh.visible =
      false;
  }
}

// ==================================================
// TITAN REGEN
// ==================================================
function updateTitanParts(
  delta
) {
  if (!titanAlive) {
    return;
  }

  for (
    const part
    of Object.values(
      titanParts
    )
  ) {
    if (
      !part.destroyed
    ) {
      continue;
    }

    part.regenTimer -=
      delta;

    if (
      part.regenTimer > 0
    ) {
      continue;
    }

    part.health =
      part.maxHealth;

    part.destroyed =
      false;

    part.regenTimer = 0;

    for (
      const mesh
      of part.meshes
    ) {
      mesh.visible =
        true;
    }
  }
}

// ==================================================
// TITAN DEATH
// ==================================================
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

  titan.visible = true;

  titanAlive = true;

  for (
    const part
    of Object.values(
      titanParts
    )
  ) {
    part.health =
      part.maxHealth;

    part.destroyed =
      false;

    part.regenTimer =
      0;

    for (
      const mesh
      of part.meshes
    ) {
      mesh.visible =
        true;
    }
  }
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

  const target =
    hits[0].object;

  const type =
    target.userData
      .titanType;

  const power =
    calculateSlashPower();

  // うなじだけ本体討伐判定
  if (
    type === "NAPE"
  ) {
    if (
      power >=
      NAPE_KILL_POWER
    ) {
      killTitan();
    }

    return;
  }

  // 腕・脚は部位破壊のみ
  const partId =
    target.userData
      .partId;

  if (partId) {
    damageTitanPart(
      partId,
      power
    );
  }

  // BODY / HEADは
  // 巨人本体にはダメージなし
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
      attackTimer /
        0.28,
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
// ANCHOR RAYCASTERS
// ==================================================
const raycaster =
  new THREE.Raycaster();

const autoRaycaster =
  new THREE.Raycaster();

const anchorProjectileRay =
  new THREE.Raycaster();

// ==================================================
// THIN WIRE
// ==================================================
function createWire() {
  const geometry =
    new THREE.CylinderGeometry(
      WIRE_VISUAL_RADIUS,
      WIRE_VISUAL_RADIUS,
      1,
      WIRE_VISUAL_SEGMENTS
    );

  const material =
    new THREE.MeshBasicMaterial({
      color: WIRE_VISUAL_COLOR,
      toneMapped: false
    });

  const wire =
    new THREE.Mesh(
      geometry,
      material
    );

  wire.visible = false;
  wire.frustumCulled = false;

  scene.add(wire);

  return wire;
}

function createAnchorProjectileMesh() {
  /*
   * 今はテスト用の小さな金属弾。
   * 後から3Dアンカーモデルへ
   * そのまま交換可能。
   */
  const projectile =
    new THREE.Mesh(
      new THREE.ConeGeometry(
        0.07,
        0.32,
        6
      ),
      new THREE.MeshStandardMaterial({
        color: 0x34383c,
        metalness: 0.75,
        roughness: 0.3
      })
    );

  projectile.visible = false;

  projectile.castShadow = true;

  projectile.frustumCulled = false;

  scene.add(projectile);

  return projectile;
}

// ==================================================
// CREATE ANCHOR
// ==================================================
function createAnchor(
  side
) {
  return {
    side,

    state: "OFF",

    connected: false,

    targetPoint:
      new THREE.Vector3(),

    point:
      new THREE.Vector3(),

    projectilePosition:
      new THREE.Vector3(),

    projectileVelocity:
      new THREE.Vector3(),

    launchPosition:
      new THREE.Vector3(),

    target: null,

    length: 0,

    pulling: false,

    impulseApplied: false,

    wire:
      createWire(),

    projectileMesh:
      createAnchorProjectileMesh()
  };
}

const leftAnchor =
  createAnchor(-1);

const rightAnchor =
  createAnchor(1);

// ==================================================
// ANCHOR LAUNCH SOLVER
// ==================================================
function calculateAnchorLaunch(
  targetPoint,
  outputVelocity
) {
  /*
   * 接続予定地点は絶対に変えない。
   *
   * プレイヤーの慣性は
   * 「接続地点方向への速度成分」
   * としてのみアンカー速度へ反映する。
   */

  tempAimDirection
    .subVectors(
      targetPoint,
      camera.position
    );

  const distance =
    tempAimDirection.length();

  if (
    distance < 0.001
  ) {
    return -1;
  }

  tempAimDirection.normalize();

  /*
   * プレイヤー速度のうち、
   * アンカー方向へ向かっている成分。
   *
   * 正 = 接続地点へ向かっている
   * 負 = 接続地点から離れている
   */
  const inheritedSpeed =
    velocity.dot(
      tempAimDirection
    );

  /*
   * アンカーのワールド上の速度。
   *
   * 最低速度も確保する。
   */
  const finalSpeed =
    Math.max(
      ANCHOR_SHOT_SPEED * 0.25,

      ANCHOR_SHOT_SPEED +
      inheritedSpeed
    );

  outputVelocity
    .copy(
      tempAimDirection
    )
    .multiplyScalar(
      finalSpeed
    );

  /*
   * 予想到達時間。
   * AUTOの未来位置計算にも使える。
   */
  return (
    distance /
    finalSpeed
  );
}

// ==================================================
// FIRE ANCHOR AT POINT
// ==================================================
function fireAnchorAtPoint(
  anchor,
  point,
  target
) {
  if (
    dead ||
    wallStunTimer > 0
  ) {
    return false;
  }

  /*
   * ここでは「狙う方向」を計算するだけ。
   *
   * まだ接続はしない。
   */
  const time =
    calculateAnchorLaunch(
      point,
      anchor.projectileVelocity
    );

  if (
    time <= 0
  ) {
    return false;
  }

  anchor.state = "FIRING";

  anchor.connected = false;

  // AUTO / 手動が狙った予定地点
  anchor.targetPoint.copy(
    point
  );

  anchor.launchPosition.copy(
    camera.position
  );

  /*
   * 実際のアンカー弾は
   * プレイヤー位置からスタート。
   */
  anchor.projectilePosition.copy(
    camera.position
  );

  anchor.projectileMesh.position.copy(
    anchor.projectilePosition
  );

  anchor.projectileMesh.visible =
    true;

  anchor.target = target;

  anchor.pulling = false;

  anchor.impulseApplied = false;

  anchor.wire.visible = true;

  return true;
}

// ==================================================
// MANUAL Q / R
// ==================================================
function fireManualAnchor(
  anchor
) {
  if (
    dead ||
    wallStunTimer > 0
  ) {
    return;
  }

  raycaster.setFromCamera(
    new THREE.Vector2(
      0,
      0
    ),
    camera
  );

  raycaster.far =
    AUTO_MAX_DISTANCE;

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

  fireAnchorAtPoint(
    anchor,
    hits[0].point,
    hits[0].object
  );
}

// ==================================================
// AUTO CANDIDATES
// ==================================================
function collectAutoAnchorCandidates(
  side
) {
  const candidates = [];

  // 現在の視線方向
  camera.getWorldDirection(
    autoForward
  );

  autoForward.normalize();

  // カメラ基準の上方向。
  // これを軸として左右へ探索する。
  autoUp
    .set(
      0,
      1,
      0
    )
    .applyQuaternion(
      camera.quaternion
    )
    .normalize();

  // -------------------------
  // MINIMUM FORWARD DISTANCE
  // -------------------------

  // 現在速度をm/sへ変換
  const speedMps =
    velocity.length() *
    METERS_PER_UNIT;

  /*
   * AUTOで狙える最低奥行き。
   *
   * 速度 × 1.5秒
   * +
   * 15m
   *
   * 例:
   *
   * 停止
   * 0 × 1.5 + 15
   * = 15m
   *
   * 10m/s
   * 10 × 1.5 + 15
   * = 30m
   *
   * 20m/s
   * 20 × 1.5 + 15
   * = 45m
   */
  const minimumForwardMeters =
    speedMps *
    AUTO_MIN_FORWARD_TIME +
    AUTO_FORWARD_EXTRA_METERS;

  // meter → internal unit
  const minimumForwardUnits =
    minimumForwardMeters /
    METERS_PER_UNIT;

  const seenObjects =
    new Set();

  // -------------------------
  // LEFT / RIGHT SEARCH
  // -------------------------
  for (
    let angleDeg =
      AUTO_ANGLE_STEP;

    angleDeg <=
      AUTO_MAX_ANGLE;

    angleDeg +=
      AUTO_ANGLE_STEP
  ) {
    const angle =
      THREE.MathUtils.degToRad(
        angleDeg *
        side
      );

    autoDirection
      .copy(
        autoForward
      )
      .applyAxisAngle(
        autoUp,
        angle
      )
      .normalize();

    autoRaycaster.set(
      camera.position,
      autoDirection
    );

    autoRaycaster.far =
      AUTO_MAX_DISTANCE;

    const hits =
      autoRaycaster
        .intersectObjects(
          anchorTargets,
          false
        );

    if (
      hits.length === 0
    ) {
      continue;
    }

    const hit =
      hits[0];

    if (
      seenObjects.has(
        hit.object
      )
    ) {
      continue;
    }

    // -------------------------
    // FORWARD DEPTH
    // -------------------------
    autoOffset.subVectors(
      hit.point,
      camera.position
    );

    /*
     * 視線方向へどれだけ
     * 前にあるか。
     *
     * 斜め方向の直線距離ではない。
     */
    const depth =
      autoOffset.dot(
        autoForward
      );

    // 背後・真横
    if (
      depth <= 0
    ) {
      continue;
    }

    /*
     * 速度×1.5秒 + 15mより
     * 手前ならAUTO対象外。
     */
    if (
      depth <
      minimumForwardUnits
    ) {
      continue;
    }

    // -------------------------
    // PROJECTILE TRAVEL
    // -------------------------
    const testVelocity =
      new THREE.Vector3();

    const travelTime =
      calculateAnchorLaunch(
        hit.point,
        testVelocity
      );

    if (
      travelTime <= 0
    ) {
      continue;
    }

    // -------------------------
    // FUTURE PLAYER
    // -------------------------
    tempFuturePlayer
      .copy(
        camera.position
      )
      .addScaledVector(
        velocity,
        travelTime
      );

    tempFutureTarget
      .subVectors(
        hit.point,
        tempFuturePlayer
      );

    const futureDepth =
      tempFutureTarget.dot(
        autoForward
      );

    /*
     * アンカーが届く頃には
     * もう通り過ぎる場所も除外。
     */
    if (
      velocity.length() > 3 &&
      futureDepth <= 0
    ) {
      continue;
    }

    seenObjects.add(
      hit.object
    );

    candidates.push({
      point:
        hit.point.clone(),

      object:
        hit.object,

      depth,

      angleDeg,

      travelTime
    });
  }

  return candidates;
}

// ==================================================
// FIND BEST LEFT / RIGHT PAIR
// ==================================================
function findBestAutoAnchorPair() {
  const leftCandidates =
    collectAutoAnchorCandidates(
      1
    );

  const rightCandidates =
    collectAutoAnchorCandidates(
      -1
    );

  let bestPair = null;

  let bestDepth =
    Infinity;

  let bestDifference =
    Infinity;

  for (
    const left
    of leftCandidates
  ) {
    for (
      const right
      of rightCandidates
    ) {
      /*
       * 基本的に同じ建物へ
       * 左右2本は撃たない。
       */
      if (
        left.object ===
        right.object
      ) {
        continue;
      }

      const separation =
        left.point.distanceTo(
          right.point
        );

      if (
        separation <
        AUTO_MIN_SEPARATION
      ) {
        continue;
      }

      const averageDepth =
        (
          left.depth +
          right.depth
        ) /
        2;

      if (
        averageDepth <= 0
      ) {
        continue;
      }

      const difference =
        Math.abs(
          left.depth -
          right.depth
        );

      const differenceRatio =
        difference /
        averageDepth;

      /*
       * 左右の奥行き差が20%を
       * 超えるなら別の建物列と判断。
       */
      if (
        differenceRatio >
        AUTO_DEPTH_TOLERANCE
      ) {
        continue;
      }

      /*
       * 基本的には
       * 「同じ列の中で一番手前」
       * を選択。
       *
       * 奥行きがほぼ同じなら
       * 左右の深度差が小さい方。
       */
      if (
        averageDepth <
        bestDepth -
          AUTO_DEPTH_PRIORITY_EPSILON
      ) {
        bestDepth =
          averageDepth;

        bestDifference =
          difference;

        bestPair = {
          left,
          right
        };

        continue;
      }

      const sameDepthBand =
        Math.abs(
          averageDepth -
          bestDepth
        ) <=
        AUTO_DEPTH_PRIORITY_EPSILON;

      if (
        sameDepthBand &&
        difference <
          bestDifference
      ) {
        bestDepth =
          averageDepth;

        bestDifference =
          difference;

        bestPair = {
          left,
          right
        };
      }
    }
  }

  return {
    pair: bestPair,
    leftCandidates,
    rightCandidates
  };
}

// ==================================================
// AUTO DUAL ANCHOR
// ==================================================
function fireAutoDualAnchors() {
  if (
    dead ||
    wallStunTimer > 0
  ) {
    return;
  }

  /*
   * 右クリック2回目は
   * 左右とも解除。
   */
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

  const result =
    findBestAutoAnchorPair();

  if (
    result.pair
  ) {
    fireAnchorAtPoint(
      leftAnchor,
      result.pair.left.point,
      result.pair.left.object
    );

    fireAnchorAtPoint(
      rightAnchor,
      result.pair.right.point,
      result.pair.right.object
    );

    return;
  }

  /*
   * 同じ列として成立するペアが
   * 見つからなかった場合。
   *
   * 無理に左右の違う列へ2本を
   * 撃たない。
   *
   * 一番手前の片側だけ使用する。
   */
  const left =
    result.leftCandidates
      .sort(
        (a, b) =>
          a.depth -
          b.depth
      )[0];

  const right =
    result.rightCandidates
      .sort(
        (a, b) =>
          a.depth -
          b.depth
      )[0];

  if (
    left &&
    right
  ) {
    if (
      left.depth <=
      right.depth
    ) {
      fireAnchorAtPoint(
        leftAnchor,
        left.point,
        left.object
      );
    } else {
      fireAnchorAtPoint(
        rightAnchor,
        right.point,
        right.object
      );
    }

    return;
  }

  if (left) {
    fireAnchorAtPoint(
      leftAnchor,
      left.point,
      left.object
    );

    return;
  }

  if (right) {
    fireAnchorAtPoint(
      rightAnchor,
      right.point,
      right.object
    );
  }
}

// ==================================================
// CONNECT ANCHOR
// ==================================================
function connectAnchor(
  anchor,
  point,
  target
) {
  anchor.state =
    "CONNECTED";

  anchor.connected = true;

  anchor.point.copy(
    point
  );

  anchor.targetPoint.copy(
    point
  );

  anchor.target =
    target;

  anchor.length =
    camera.position.distanceTo(
      point
    );

  anchor.pulling = false;

  anchor.impulseApplied = false;

  /*
   * 接続地点にアンカー本体を残す。
   */
  anchor.projectileMesh.position.copy(
    point
  );

  anchor.projectileMesh.visible =
    true;
}

// ==================================================
// RELEASE ANCHOR
// ==================================================
function releaseAnchor(
  anchor
) {
  anchor.state = "OFF";

  anchor.connected = false;

  anchor.target = null;

  anchor.pulling = false;

  anchor.impulseApplied = false;

  anchor.projectileVelocity.set(
    0,
    0,
    0
  );

  anchor.wire.visible = false;

  anchor.projectileMesh.visible =
    false;
}

// ==================================================
// MANUAL TOGGLE
// ==================================================
function toggleManualAnchor(
  anchor
) {
  if (
    anchor.state ===
    "OFF"
  ) {
    fireManualAnchor(
      anchor
    );
  } else {
    releaseAnchor(
      anchor
    );
  }
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

  /*
   * 現在のアンカー位置から
   * 最初に確定したtargetPointへ。
   */
  projectileDirection
    .subVectors(
      anchor.targetPoint,
      anchor.projectilePosition
    );

  const remaining =
    projectileDirection.length();

  if (
    remaining < 0.001
  ) {
    connectAnchor(
      anchor,
      anchor.targetPoint,
      anchor.target
    );

    return;
  }

  projectileDirection.normalize();

  /*
   * 発射時に決定した速度の
   * 大きさだけを利用する。
   *
   * 方向は常に固定接続点方向。
   */
  const projectileSpeed =
    anchor.projectileVelocity.length();

  const travel =
    projectileSpeed *
    delta;

  /*
   * このフレームで接続点へ
   * 到達する場合。
   */
  if (
    travel >= remaining
  ) {
    anchor.projectilePosition.copy(
      anchor.targetPoint
    );

    if (
      anchor.projectileMesh
    ) {
      anchor.projectileMesh.position.copy(
        anchor.targetPoint
      );
    }

    connectAnchor(
      anchor,
      anchor.targetPoint,
      anchor.target
    );

    return;
  }

  /*
   * 接続点へ向かって
   * 実速度分だけ進む。
   */
  anchor.projectilePosition
    .addScaledVector(
      projectileDirection,
      travel
    );

  if (
    anchor.projectileMesh
  ) {
    anchor.projectileMesh.position.copy(
      anchor.projectilePosition
    );
  }
}

// ==================================================
// WIRE VISUAL
// ==================================================
const wireVisualStart =
  new THREE.Vector3();

const wireVisualDirection =
  new THREE.Vector3();

const wireVisualMiddle =
  new THREE.Vector3();

const wireVisualYAxis =
  new THREE.Vector3(
    0,
    1,
    0
  );

function updateWireVisual(
  anchor
) {
  if (
    anchor.state === "OFF"
  ) {
    anchor.wire.visible = false;
    return;
  }

  /*
   * ワイヤー終端は常に
   * 実体アンカーの現在位置。
   *
   * targetPointは使わない。
   */
  const end =
    anchor.projectileMesh.position;

  wireVisualStart.set(
    anchor.side *
      WIRE_START_SIDE,
    WIRE_START_DOWN,
    WIRE_START_FORWARD
  );

  camera.localToWorld(
    wireVisualStart
  );

  wireVisualDirection.subVectors(
    end,
    wireVisualStart
  );

  const distance =
    wireVisualDirection.length();

  if (
    distance < 0.001
  ) {
    anchor.wire.visible = false;
    return;
  }

  wireVisualMiddle
    .copy(
      wireVisualStart
    )
    .add(end)
    .multiplyScalar(0.5);

  anchor.wire.position.copy(
    wireVisualMiddle
  );

  anchor.wire.scale.set(
    1,
    distance,
    1
  );

  wireVisualDirection.normalize();

  anchor.wire.quaternion
    .setFromUnitVectors(
      wireVisualYAxis,
      wireVisualDirection
    );

  anchor.wire.visible = true;
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
    anchor.pulling =
      false;

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

  anchor.pulling =
    true;

  velocity.addScaledVector(
    wireDirection,
    WIRE_SUSTAIN_ACCEL *
      delta
  );

  limitWireSafetySpeed();
}

// ==================================================
// ROPE CONSTRAINT
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
// NORMAL GAS FLIGHT
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

  // 上下性能は元通り
  if (
    velocity.y < 0
  ) {
    velocity.y +=
      GAS_RECOVERY_ACCEL *
      delta;
  } else if (
    velocity.y <
    GAS_CLIMB_SPEED
  ) {
    velocity.y +=
      GAS_CLIMB_ACCEL *
      delta;

    velocity.y =
      Math.min(
        velocity.y,
        GAS_CLIMB_SPEED
      );
  }

  /*
   * WASDは既存速度を消さず、
   * 加速度だけ足す。
   */
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

  if (
    input.lengthSq() > 0
  ) {
    input.normalize();

    velocity.addScaledVector(
      input,
      AIR_CONTROL_ACCEL *
      delta
    );
  }
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

  const gasActive =
    keys["Space"] &&
    gas > 0;

  const wireActive =
    leftAnchor.pulling ||
    rightAnchor.pulling;

  if (
    !movementInput &&
    !gasActive &&
    !wireActive
  ) {
    const drag =
      Math.exp(
        -AIR_DRAG *
        delta
      );

    velocity.x *= drag;
    velocity.z *= drag;
  }

  /*
   * ワイヤー等で300km/hを
   * 超えた速度は即切らない。
   * 超過分だけ徐々に空気抵抗。
   */
  const speed =
    velocity.length();

  if (
    speed >
    NORMAL_MAX_SPEED
  ) {
    const excessRatio =
      (
        speed -
        NORMAL_MAX_SPEED
      ) /
      NORMAL_MAX_SPEED;

    const highDrag =
      Math.exp(
        -HIGH_SPEED_DRAG *
        excessRatio *
        delta
      );

    velocity.multiplyScalar(
      highDrag
    );
  }
}

// ==================================================
// IMPACT DAMAGE
// ==================================================
function impactDamage(
  speed
) {
  const kmh =
    speedToKmh(
      speed
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
  if (dead) {
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
// WALL JUMP
// ==================================================
function wallJump(
  normalX,
  normalZ
) {
  /*
   * 壁の法線成分だけ反転。
   * 壁と平行な慣性は保持。
   */
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
}

// ==================================================
// WALL STUN
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

  leftAnchor.pulling =
    false;

  rightAnchor.pulling =
    false;
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
// HORIZONTAL MOVEMENT STEP
// ==================================================
function moveHorizontalStep(
  delta
) {
  // -------------------------
  // X
  // -------------------------
  const nextX =
    camera.position.clone();

  nextX.x +=
    velocity.x *
    delta;

  if (
    !collides(
      nextX
    )
  ) {
    camera.position.x =
      nextX.x;
  } else {
    const impact =
      velocity.x;

    const kmh =
      speedToKmh(
        impact
      );

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

  // -------------------------
  // Z
  // -------------------------
  const nextZ =
    camera.position.clone();

  nextZ.z +=
    velocity.z *
    delta;

  if (
    !collides(
      nextZ
    )
  ) {
    camera.position.z =
      nextZ.z;
  } else {
    const impact =
      velocity.z;

    const kmh =
      speedToKmh(
        impact
      );

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
// HIGH SPEED HORIZONTAL MOVEMENT
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
    const hit =
      moveHorizontalStep(
        stepDelta
      );

    if (
      hit ||
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

  // -------------------------
  // GROUND
  // -------------------------
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

  // -------------------------
  // NO COLLISION
  // -------------------------
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

  // -------------------------
  // LAND ON BUILDING
  // -------------------------
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

  health =
    MAX_HEALTH;

  gas =
    MAX_GAS;

  grounded = true;

  dead = false;

  wallStunTimer = 0;

  gasBurstCooldown =
    0;

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

    // -------------------------
    // SPACE
    // -------------------------
    if (
      event.code ===
      "Space"
    ) {
      event.preventDefault();

      if (
        !keys["Space"]
      ) {
        spacePressed =
          true;

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

    // -------------------------
    // Q = LEFT MANUAL
    // -------------------------
    if (
      event.code ===
        "KeyQ" &&
      !keys["KeyQ"] &&
      wallStunTimer <= 0
    ) {
      toggleManualAnchor(
        leftAnchor
      );
    }

    // -------------------------
    // R = RIGHT MANUAL
    // -------------------------
    if (
      event.code ===
        "KeyR" &&
      !keys["KeyR"] &&
      wallStunTimer <= 0
    ) {
      toggleManualAnchor(
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
        of Object.keys(
          keys
        )
      ) {
        keys[code] =
          false;
      }

      spacePressed =
        false;
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
        event.button ===
        0
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

    // LEFT CLICK = BLADE
    if (
      event.button ===
      0
    ) {
      bladeAttack();
    }

    // RIGHT CLICK = AUTO DUAL
    if (
      event.button ===
      2
    ) {
      fireAutoDualAnchors();
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
    fontFamily:
      "monospace",
    fontSize: "18px",
    fontWeight: "bold",
    whiteSpace: "pre",
    textShadow:
      "0 1px 4px black",
    pointerEvents:
      "none",
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
    pointerEvents:
      "none",
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
    pointerEvents:
      "none",
    zIndex: "100"
  }
);

document.body.appendChild(
  crosshair
);

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
    fontFamily:
      "monospace",
    fontSize: "18px",
    fontWeight: "bold",
    textShadow:
      "0 1px 4px black",
    pointerEvents:
      "none",
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
    fontFamily:
      "monospace",
    fontSize: "15px",
    fontWeight: "bold",
    textShadow:
      "0 1px 3px black",
    pointerEvents:
      "none",
    opacity: "0",
    zIndex: "100"
  }
);

document.body.appendChild(
  statusHUD
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
    alignItems:
      "center",
    justifyContent:
      "center",
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

  if (
    wallStunTimer > 0
  ) {
    statusHUD.textContent =
      `STUN ${wallStunTimer.toFixed(1)}s`;

    statusHUD.style.opacity =
      "1";
  } else {
    statusHUD.textContent =
      "";

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

  velocity.y =
    Math.max(
      velocity.y,
      -TERMINAL_FALL_SPEED
    );

  const drag =
    Math.exp(
      -1.8 *
      delta
    );

  velocity.x *=
    drag;

  velocity.z *=
    drag;

  moveHorizontal(
    delta
  );

  if (!dead) {
    moveVertical(
      delta
    );
  }

  spacePressed =
    false;

  return true;
}

// ==================================================
// PLAYER UPDATE
// ==================================================
function updatePlayer(
  delta
) {
  if (dead) {
    spacePressed =
      false;

    return;
  }

  gasBurstCooldown =
    Math.max(
      0,
      gasBurstCooldown -
        delta
    );

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

  if (
    updateStun(
      delta
    )
  ) {
    return;
  }

  // Ground
  if (
    grounded &&
    !leftAnchor.connected &&
    !rightAnchor.connected
  ) {
    updateGround(
      delta
    );
  }

  // Jump
  if (
    spacePressed &&
    grounded
  ) {
    velocity.y =
      JUMP_SPEED;

    grounded =
      false;
  }

  // Gravity
  velocity.y -=
    GRAVITY *
    delta;

  // 落下終端速度
  velocity.y =
    Math.max(
      velocity.y,
      -TERMINAL_FALL_SPEED
    );

  // Anchor projectiles
  updateAnchorProjectile(
    leftAnchor,
    delta
  );

  updateAnchorProjectile(
    rightAnchor,
    delta
  );

  // Wire gas
  const gasAvailable =
    updateWireGas(
      delta
    );

  // Wire acceleration
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

  // Normal gas
  updateGasFlight(
    delta
  );

  // Drag
  updateAirDrag(
    delta
  );

  // Movement
  moveHorizontal(
    delta
  );

  if (dead) {
    return;
  }

  moveVertical(
    delta
  );

  if (dead) {
    return;
  }

  constrainRope(
    leftAnchor
  );

  constrainRope(
    rightAnchor
  );

  spacePressed =
    false;
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

  updatePlayer(
    delta
  );

  updateTitanParts(
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
