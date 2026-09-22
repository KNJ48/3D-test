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

// ワイヤーは通常300km/h制限を突破可能。
// 人工的な上限はかなり高い場所に置く。
const WIRE_SAFETY_MAX_KMH = 1000;

const WIRE_SAFETY_MAX_SPEED =
  WIRE_SAFETY_MAX_KMH /
  3.6 /
  METERS_PER_UNIT;

// 高速衝突抜け防止
const MAX_MOVE_STEP = 0.22;

// ==================================================
// AIR
// ==================================================
const AIR_DRAG = 0.4;

// 300km/h以上で徐々に強くなる抵抗
const HIGH_SPEED_DRAG = 0.32;

// ==================================================
// DAMAGE
// ==================================================
const MAX_HEALTH = 500;

const SAFE_IMPACT_KMH = 30;
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

// 上下性能は元の値
const GAS_RECOVERY_ACCEL = 28;
const GAS_CLIMB_SPEED = 8;
const GAS_CLIMB_ACCEL = 18;

// 空中操作だけ80%
const AIR_CONTROL_ACCEL = 19.2;

// ==================================================
// GAS BURST
// ==================================================
const GAS_BURST_COST = 10;

const GAS_DOUBLE_TAP_WINDOW = 0.5;

const GAS_BURST_IMPULSE = 24;

const GAS_BURST_COOLDOWN = 0.5;

// ==================================================
// WIRE
// ==================================================

// 初動は元のまま
const WIRE_INITIAL_IMPULSE = 11;

// 継続加速だけ80%
const WIRE_SUSTAIN_ACCEL = 16;

const ANCHOR_SHOT_SPEED = 150;

// 視認性重視
const WIRE_RADIUS = 0.055;

// ==================================================
// AUTO ANCHOR
// ==================================================

// 右クリック探索距離
const AUTO_ANCHOR_MAX_DISTANCE = 350;

// 近すぎる対象はAUTOでは使わない
const AUTO_ANCHOR_MIN_DISTANCE = 8;

// 左右アンカー最低分離距離
const AUTO_ANCHOR_MIN_SEPARATION = 5;

// 到達時、プレイヤーから最低これだけ
// 前方に残っていることを要求
const AUTO_ANCHOR_MIN_FUTURE_AHEAD = 2;

// ==================================================
// BLADE
// ==================================================
const ATTACK_RANGE = 3.5;
const ATTACK_COOLDOWN = 0.35;

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
  new THREE.Color(0x87ceeb);

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

camera.rotation.order = "YXZ";

const SPAWN =
  new THREE.Vector3(
    0,
    PLAYER_HEIGHT,
    12
  );

camera.position.copy(SPAWN);

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

sun.shadow.mapSize.set?.(
  2048,
  2048
);

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
// WORLD MATERIALS
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

  road.receiveShadow = true;

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
// SIMPLE TITAN
// ==================================================
const titan =
  new THREE.Group();

titan.position.set(
  0,
  0,
  -60
);

scene.add(titan);

const titanSkin =
  new THREE.MeshStandardMaterial({
    color: 0xd18b70,
    roughness: 0.82
  });

function addTitanPart(
  geometry,
  x,
  y,
  z,
  type
) {
  const mesh =
    new THREE.Mesh(
      geometry,
      titanSkin
    );

  mesh.position.set(
    x,
    y,
    z
  );

  mesh.castShadow = true;

  mesh.userData.titanType =
    type;

  titan.add(mesh);

  anchorTargets.push(mesh);

  titanAttackTargets.push(mesh);

  return mesh;
}

addTitanPart(
  new THREE.CapsuleGeometry(
    0.75,
    5.2,
    8,
    12
  ),
  -0.9,
  3.3,
  0,
  "LEG"
);

addTitanPart(
  new THREE.CapsuleGeometry(
    0.75,
    5.2,
    8,
    12
  ),
  0.9,
  3.3,
  0,
  "LEG"
);

addTitanPart(
  new THREE.CapsuleGeometry(
    2.2,
    4.2,
    8,
    12
  ),
  0,
  8.7,
  0,
  "BODY"
);

addTitanPart(
  new THREE.CapsuleGeometry(
    0.55,
    5,
    8,
    10
  ),
  -2.6,
  8.5,
  0,
  "ARM"
);

addTitanPart(
  new THREE.CapsuleGeometry(
    0.55,
    5,
    8,
    10
  ),
  2.6,
  8.5,
  0,
  "ARM"
);

addTitanPart(
  new THREE.SphereGeometry(
    1.5,
    20,
    16
  ),
  0,
  13.4,
  0,
  "HEAD"
);

const titanNape =
  new THREE.Mesh(
    new THREE.BoxGeometry(
      1.3,
      1,
      0.5
    ),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false
    })
  );

titanNape.position.set(
  0,
  12.2,
  -1.45
);

titanNape.userData.titanType =
  "NAPE";

titan.add(titanNape);

titanAttackTargets.push(
  titanNape
);

let titanAlive = true;

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
// BLADES
// ==================================================
const bladeMaterial =
  new THREE.MeshStandardMaterial({
    color: 0xdfe7ec,
    metalness: 0.9,
    roughness: 0.18
  });

const handleMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x252525,
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
      handleMaterial
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

const wireMiddle =
  new THREE.Vector3();

const projectileDirection =
  new THREE.Vector3();

const burstDirection =
  new THREE.Vector3();

const yAxis =
  new THREE.Vector3(
    0,
    1,
    0
  );

const tempFuture =
  new THREE.Vector3();

const tempToTarget =
  new THREE.Vector3();

const tempTravel =
  new THREE.Vector3();

const tempAimDirection =
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

function speedToKmh(speed) {
  return (
    Math.abs(speed) *
    METERS_PER_UNIT *
    3.6
  );
}

// ==================================================
// SPEED LIMITS
// ==================================================
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

  velocity.addScaledVector(
    burstDirection,
    GAS_BURST_IMPULSE
  );

  // ワイヤー中なら300km/h以上を許可
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
// ANCHOR RAYCASTER
// ==================================================
const raycaster =
  new THREE.Raycaster();

raycaster.far =
  AUTO_ANCHOR_MAX_DISTANCE;

// ==================================================
// WIRE MATERIAL
// ==================================================
const wireMaterial =
  new THREE.MeshBasicMaterial({
    color: 0xe5e8eb,

    // ワイヤーの表裏で消えない
    side: THREE.DoubleSide,

    // 暗い場所でも見える
    toneMapped: false
  });

// ==================================================
// ANCHOR
// ==================================================
function createAnchor() {
  const wire =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        WIRE_RADIUS,
        WIRE_RADIUS,
        1,
        8
      ),
      wireMaterial
    );

  wire.visible = false;

  // 背景に完全に埋もれにくくする
  wire.renderOrder = 10;

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

    projectileVelocity:
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

// ==================================================
// SOLVE ANCHOR INITIAL VELOCITY
// ==================================================
function calculateAnchorLaunch(
  targetPoint,
  output
) {
  /*
   * 発射瞬間のプレイヤー慣性を継承しつつ、
   * 静止したtargetPointへ飛ぶ方向を求める。
   *
   * projectile velocity =
   * player velocity + shot direction * shotSpeed
   *
   * |target - start - playerVelocity*t|
   * = shotSpeed*t
   *
   * の正の解を求める。
   */

  tempTravel.subVectors(
    targetPoint,
    camera.position
  );

  const a =
    velocity.lengthSq() -
    ANCHOR_SHOT_SPEED *
      ANCHOR_SHOT_SPEED;

  const b =
    -2 *
    tempTravel.dot(
      velocity
    );

  const c =
    tempTravel.lengthSq();

  let time = -1;

  if (
    Math.abs(a) <
    0.000001
  ) {
    if (
      Math.abs(b) >
      0.000001
    ) {
      const t =
        -c / b;

      if (
        t > 0
      ) {
        time = t;
      }
    }
  } else {
    const discriminant =
      b * b -
      4 * a * c;

    if (
      discriminant >= 0
    ) {
      const root =
        Math.sqrt(
          discriminant
        );

      const t1 =
        (
          -b - root
        ) /
        (
          2 * a
        );

      const t2 =
        (
          -b + root
        ) /
        (
          2 * a
        );

      if (
        t1 > 0 &&
        t2 > 0
      ) {
        time =
          Math.min(
            t1,
            t2
          );
      } else if (
        t1 > 0
      ) {
        time = t1;
      } else if (
        t2 > 0
      ) {
        time = t2;
      }
    }
  }

  if (
    time <= 0 ||
    !Number.isFinite(time)
  ) {
    return -1;
  }

  tempAimDirection
    .copy(
      targetPoint
    )
    .addScaledVector(
      velocity,
      -time
    )
    .sub(
      camera.position
    )
    .normalize();

  output
    .copy(
      velocity
    )
    .addScaledVector(
      tempAimDirection,
      ANCHOR_SHOT_SPEED
    );

  return time;
}

// ==================================================
// FIRE ANCHOR TO EXACT WORLD POINT
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

  anchor.state =
    "FIRING";

  anchor.connected =
    false;

  anchor.targetPoint.copy(
    point
  );

  anchor.projectilePosition.copy(
    camera.position
  );

  anchor.target = target;

  anchor.pulling = false;

  anchor.impulseApplied =
    false;

  anchor.wire.visible =
    true;

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
// AUTO ANCHOR SAMPLE POSITIONS
// ==================================================
// 左右を明確に別探索。
// 上側をやや優先する。
const AUTO_LEFT_SAMPLES = [
  [-0.20, 0.10],

  [-0.32, 0.18],
  [-0.45, 0.20],
  [-0.58, 0.22],
  [-0.72, 0.22],

  [-0.28, 0.38],
  [-0.42, 0.42],
  [-0.58, 0.46],
  [-0.72, 0.48],

  [-0.32, -0.05],
  [-0.50, -0.05],
  [-0.68, -0.05]
];

const AUTO_RIGHT_SAMPLES =
  AUTO_LEFT_SAMPLES.map(
    ([x, y]) => [
      -x,
      y
    ]
  );

// ==================================================
// AUTO CANDIDATES
// ==================================================
function findAutoCandidates(
  samples,
  side
) {
  const candidates = [];

  const velocitySpeed =
    velocity.length();

  const movementDirection =
    new THREE.Vector3();

  if (
    velocitySpeed > 1
  ) {
    movementDirection.copy(
      velocity
    ).normalize();
  } else {
    camera.getWorldDirection(
      movementDirection
    );

    movementDirection.y = 0;

    if (
      movementDirection.lengthSq() >
      0.001
    ) {
      movementDirection.normalize();
    }
  }

  for (
    const [screenX, screenY]
    of samples
  ) {
    raycaster.setFromCamera(
      new THREE.Vector2(
        screenX,
        screenY
      ),
      camera
    );

    raycaster.far =
      AUTO_ANCHOR_MAX_DISTANCE;

    const hits =
      raycaster.intersectObjects(
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

    const distance =
      camera.position.distanceTo(
        hit.point
      );

    if (
      distance <
      AUTO_ANCHOR_MIN_DISTANCE
    ) {
      continue;
    }

    const projectileVelocity =
      new THREE.Vector3();

    const travelTime =
      calculateAnchorLaunch(
        hit.point,
        projectileVelocity
      );

    if (
      travelTime <= 0
    ) {
      continue;
    }

    // アンカー到着時の
    // プレイヤー予測位置
    tempFuture
      .copy(
        camera.position
      )
      .addScaledVector(
        velocity,
        travelTime
      );

    tempToTarget.subVectors(
      hit.point,
      tempFuture
    );

    const futureDistance =
      tempToTarget.length();

    if (
      futureDistance <
      AUTO_ANCHOR_MIN_FUTURE_AHEAD
    ) {
      continue;
    }

    const targetDirection =
      tempToTarget
        .clone()
        .normalize();

    const ahead =
      targetDirection.dot(
        movementDirection
      );

    /*
     * アンカー到着時に
     * 完全に真後ろへなっている候補は除外。
     *
     * -0.05程度を許容しているので、
     * 真横付近は使用可能。
     */
    if (
      velocitySpeed > 3 &&
      ahead < -0.05
    ) {
      continue;
    }

    // -------------------------
    // SCORE
    // -------------------------

    let score = 0;

    // 未来位置から前方に残る
    score +=
      ahead * 6;

    // 高い場所を優先
    const relativeHeight =
      hit.point.y -
      camera.position.y;

    score +=
      THREE.MathUtils.clamp(
        relativeHeight /
          25,
        -1,
        2
      ) * 1.8;

    // 遠すぎず近すぎず
    const idealDistance = 65;

    score -=
      Math.abs(
        distance -
        idealDistance
      ) /
      idealDistance *
      1.5;

    // 画面中央側の候補を少し優先
    score -=
      Math.abs(
        screenX
      ) * 0.45;

    // 左右の正しい側を優先
    if (
      Math.sign(screenX) ===
      side
    ) {
      score += 1.5;
    }

    // 到達時間が長すぎる候補を減点
    score -=
      travelTime * 0.35;

    candidates.push({
      point:
        hit.point.clone(),

      target:
        hit.object,

      projectileVelocity,

      travelTime,

      score,

      screenX,

      screenY
    });
  }

  candidates.sort(
    (a, b) =>
      b.score -
      a.score
  );

  return candidates;
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
   * 既にアンカーが出ている場合は
   * 右クリックで両方解除。
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

  const leftCandidates =
    findAutoCandidates(
      AUTO_LEFT_SAMPLES,
      -1
    );

  const rightCandidates =
    findAutoCandidates(
      AUTO_RIGHT_SAMPLES,
      1
    );

  let bestLeft = null;

  let bestRight = null;

  let bestPairScore =
    -Infinity;

  // 左右をペアとして評価
  for (
    const left
    of leftCandidates
  ) {
    for (
      const right
      of rightCandidates
    ) {
      const separation =
        left.point.distanceTo(
          right.point
        );

      // 同じ場所・近すぎる場所は不可
      if (
        separation <
        AUTO_ANCHOR_MIN_SEPARATION
      ) {
        continue;
      }

      // 同一オブジェクトでも
      // 点が十分離れていれば許可。
      // 大きな壁の左右へ刺せるため。

      let pairScore =
        left.score +
        right.score;

      // 左右が離れているほど
      // 少しだけ評価
      pairScore +=
        Math.min(
          separation / 20,
          1.5
        );

      // 到達時間が近い方が
      // 両アンカーらしく見える
      pairScore -=
        Math.abs(
          left.travelTime -
          right.travelTime
        ) * 0.6;

      if (
        pairScore >
        bestPairScore
      ) {
        bestPairScore =
          pairScore;

        bestLeft = left;

        bestRight = right;
      }
    }
  }

  // 理想的なペアがある
  if (
    bestLeft &&
    bestRight
  ) {
    fireAnchorAtPoint(
      leftAnchor,
      bestLeft.point,
      bestLeft.target
    );

    fireAnchorAtPoint(
      rightAnchor,
      bestRight.point,
      bestRight.target
    );

    return;
  }

  /*
   * 両方揃わなかった場合、
   * 無理に同じ場所へ2本撃たない。
   * 良い方だけ撃つ。
   */
  const left =
    leftCandidates[0];

  const right =
    rightCandidates[0];

  if (
    left &&
    (
      !right ||
      left.score >=
        right.score
    )
  ) {
    fireAnchorAtPoint(
      leftAnchor,
      left.point,
      left.target
    );

    return;
  }

  if (right) {
    fireAnchorAtPoint(
      rightAnchor,
      right.point,
      right.target
    );
  }
}

// ==================================================
// RELEASE / TOGGLE MANUAL
// ==================================================
function releaseAnchor(
  anchor
) {
  anchor.state =
    "OFF";

  anchor.connected =
    false;

  anchor.target =
    null;

  anchor.pulling =
    false;

  anchor.impulseApplied =
    false;

  anchor.projectileVelocity.set(
    0,
    0,
    0
  );

  anchor.wire.visible =
    false;
}

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
// CONNECT
// ==================================================
function connectAnchor(
  anchor,
  point,
  target
) {
  anchor.state =
    "CONNECTED";

  anchor.connected =
    true;

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

  anchor.pulling =
    false;

  anchor.impulseApplied =
    false;
}

// ==================================================
// ANCHOR PROJECTILE
// ==================================================
const anchorProjectileRay =
  new THREE.Raycaster();

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

  const speed =
    anchor.projectileVelocity.length();

  if (
    speed < 0.001
  ) {
    releaseAnchor(anchor);
    return;
  }

  const travelDistance =
    speed *
    delta;

  projectileDirection
    .copy(
      anchor.projectileVelocity
    )
    .normalize();

  /*
   * 実際の飛翔経路上で
   * 衝突判定する。
   */
  anchorProjectileRay.set(
    anchor.projectilePosition,
    projectileDirection
  );

  anchorProjectileRay.far =
    travelDistance;

  const hits =
    anchorProjectileRay
      .intersectObjects(
        anchorTargets,
        false
      );

  if (
    hits.length > 0
  ) {
    const hit =
      hits[0];

    anchor.projectilePosition.copy(
      hit.point
    );

    connectAnchor(
      anchor,
      hit.point,
      hit.object
    );

    return;
  }

  anchor.projectilePosition
    .addScaledVector(
      anchor.projectileVelocity,
      delta
    );

  /*
   * 予定していたターゲット地点を
   * 十分通り過ぎた場合は失敗。
   */
  const distanceFromLaunch =
    camera.position.distanceTo(
      anchor.projectilePosition
    );

  if (
    distanceFromLaunch >
    AUTO_ANCHOR_MAX_DISTANCE *
      1.5
  ) {
    releaseAnchor(anchor);
  }
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
    anchor.wire.visible =
      false;

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
    distance < 0.001
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
    .add(end)
    .multiplyScalar(
      0.5
    );

  anchor.wire.position.copy(
    wireMiddle
  );

  /*
   * 遠くでも肉眼で確認できるよう、
   * 距離に応じて僅かに太くする。
   */
  const visualRadiusScale =
    THREE.MathUtils.clamp(
      1 +
        distance /
          150,
      1,
      2.5
    );

  anchor.wire.scale.set(
    visualRadiusScale,
    distance,
    visualRadiusScale
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

  /*
   * 通常の低速抵抗
   */
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
   * 300km/hを超えた慣性は
   * 即座に切らず、
   * 高速域だけ空気抵抗で
   * 徐々に落とす。
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
        Math.max(
          0,
          excessRatio
        ) *
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
// HORIZONTAL MOVEMENT
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
    if (
      moveHorizontalStep(
        stepDelta
      ) ||
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

  if (
    hits[0].object.userData
      .titanType ===
    "NAPE"
  ) {
    const kmh =
      velocity.length() *
      METERS_PER_UNIT *
      3.6;

    if (
      kmh >= 100
    ) {
      titanAlive = false;

      showMessage(
        "TITAN DOWN"
      );

      titan.visible =
        false;

      setTimeout(
        () => {
          titan.visible =
            true;

          titanAlive =
            true;
        },
        4000
      );
    }
  }
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

  if (
    t >= 1
  ) {
    attacking = false;

    leftBlade.rotation.z =
      0;

    rightBlade.rotation.z =
      0;
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

  dead = false;

  grounded = true;

  wallStunTimer = 0;

  gasBurstCooldown = 0;

  lastSpaceTapTime =
    -Infinity;

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

        if (
          now -
          lastSpaceTapTime <
          GAS_DOUBLE_TAP_WINDOW &&
          !grounded
        ) {
          if (
            gasBurst()
          ) {
            lastSpaceTapTime =
              -Infinity;
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
      toggleManualAnchor(
        leftAnchor
      );
    }

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
    font:
      "bold 38px Arial",
    opacity: "0",
    textShadow:
      "0 3px 8px black",
    pointerEvents:
      "none"
  }
);

document.body.appendChild(
  messageHUD
);

let messageTimeout = null;

function showMessage(text) {
  messageHUD.textContent =
    text;

  messageHUD.style.opacity =
    "1";

  clearTimeout(
    messageTimeout
  );

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
      "none"
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
      "none"
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
// STATUS
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
    font:
      "bold 15px monospace",
    textShadow:
      "0 1px 3px black",
    pointerEvents:
      "none"
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
    fontWeight: "bold"
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

  const label =
    document.createElement(
      "div"
    );

  const background =
    document.createElement(
      "div"
    );

  background.style.height =
    "18px";

  background.style.border =
    "2px solid white";

  background.style.background =
    "rgba(0,0,0,.6)";

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
    return "●";
  }

  return "○";
}

function updateHUD() {
  const kmh =
    velocity.length() *
    METERS_PER_UNIT *
    3.6;

  debugHUD.textContent =
    `Speed: ${kmh.toFixed(0)} km/h\n` +
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
  } else {
    statusHUD.textContent =
      "";
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
// PLAYER UPDATE
// ==================================================
function updatePlayer(
  delta
) {
  if (dead) {
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
    wallStunTimer > 0
  ) {
    wallStunTimer -=
      delta;

    velocity.y -=
      GRAVITY *
      delta;

    velocity.y =
      Math.max(
        velocity.y,
        -TERMINAL_FALL_SPEED
      );

    moveHorizontal(
      delta
    );

    moveVertical(
      delta
    );

    spacePressed =
      false;

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

  // Gravity
  velocity.y -=
    GRAVITY *
    delta;

  // Terminal velocity
  velocity.y =
    Math.max(
      velocity.y,
      -TERMINAL_FALL_SPEED
    );

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

  updateGasFlight(
    delta
  );

  updateAirDrag(
    delta
  );

  /*
   * ワイヤーで得た300km/h超の速度を
   * ワイヤー解除直後に消さない。
   *
   * 通常速度上限は
   * バースト時など、
   * 明示的に必要な場所だけに使う。
   */

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

  updatePlayer(delta);

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
