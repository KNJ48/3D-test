// ==================================================
// IMPORTS
// ==================================================
import * as THREE from "three";

import {
 WORLD_MAP
} from "./worldMap.js";

import {
 TELEPORT_POINTS
} from "./teleportPoints.js";

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

// --------------------------
// NORMAL GAS SPEED LIMIT
// --------------------------

// 通常ガス飛行の3次元合成最高速度
// 150 km/h
const GAS_NORMAL_MAX_KMH = 150;

const GAS_NORMAL_MAX_SPEED =
  GAS_NORMAL_MAX_KMH /
  3.6 /
  METERS_PER_UNIT;

// --------------------------
// VERTICAL GAS
// --------------------------

// 通常ガスによる最高上昇速度
// 20 m/s
const GAS_CLIMB_MAX_MPS = 20;

const GAS_CLIMB_SPEED =
  GAS_CLIMB_MAX_MPS /
  METERS_PER_UNIT;

// 落下中にガスを使用した際の
// 上方向への回復加速度
const GAS_RECOVERY_ACCEL = 28;

// 通常上昇時の加速度
const GAS_CLIMB_ACCEL = 18;

// --------------------------
// AIR CONTROL
// --------------------------

// 空中WASD操作の加速度
// 元の24から80%へ調整
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

// ------------------------------------------
// TRAINING SETTINGS
// ------------------------------------------

const TRAINING_SPACING = 30;
const TRAINING_WIDTH = 8;
const TRAINING_DEPTH = 8;
const TRAINING_HEIGHT = 51;

/*
 * 巨大ワールドへ移行したので
 * 訓練塔は現在生成しない。
 */
const TRAINING_RADIUS = 0;

// ------------------------------------------
// WORLD SCALE HELPERS
// ------------------------------------------

/*
 * 巨大な地理上の距離だけ
 * 1/10へ圧縮する。
 *
 * 縮めないもの:
 * ・人間
 * ・巨人
 * ・家
 * ・壁の高さ
 * ・壁の厚さ
 * ・道路
 * ・ゲーム物理
 */
const WORLD_HORIZONTAL_SCALE =
  1.0;

/*
 * 実寸m
 * ↓
 * Three.js内部unit
 *
 * 現在:
 * 1unit = 0.5m
 */
function metersToUnits(
  meters
) {
  return (
    meters /
    METERS_PER_UNIT
  );
}

/*
 * 世界規模の水平距離専用。
 *
 * 実寸m
 * ↓
 * 1/10
 * ↓
 * Three.js内部unit
 */
function compressedDistance(
  meters
) {
  return (
    meters *
    WORLD_HORIZONTAL_SCALE /
    METERS_PER_UNIT
  );
}

// ------------------------------------------
// WALL SIZE
// ------------------------------------------

// 壁高50m
const CITY_WALL_HEIGHT =
  metersToUnits(
    50
  );

// 壁厚12m
const CITY_WALL_THICKNESS =
  metersToUnits(
    12
  );

// 将来の門用
// 幅18m
const CITY_GATE_WIDTH =
  metersToUnits(
    18
  );

// ------------------------------------------
// THREE WALLS
// ------------------------------------------

/*
 * 仮の世界設定。
 *
 * 元の巨大地理距離に
 * 1/10を適用する。
 *
 * Wall Maria:
 * ゲーム内半径20km
 * → 直径40km
 */
const MARIA_RADIUS =
  compressedDistance(
    200000
  );

/*
 * Wall Rose:
 * ゲーム内半径13km
 */
const ROSE_RADIUS =
  compressedDistance(
    130000
  );

/*
 * Wall Sina:
 * ゲーム内半径6.5km
 */
const SINA_RADIUS =
  compressedDistance(
    65000
  );

// ------------------------------------------
// CITY SETTINGS
// ------------------------------------------

// 道幅10m
const CITY_ROAD_WIDTH =
  metersToUnits(
    10
  );

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
    12000
  );

camera.rotation.order =
  "YXZ";

/*
 * 最外周南側の都市の中から開始。
 */
const SPAWN =
  new THREE.Vector3(
    0,
    PLAYER_HEIGHT,
    MARIA_RADIUS - 90
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

/*
 * 100km級の巨大Planeなので
 * repeat 400では模様1枚が巨大になる。
 *
 * 1タイルを約10mとして扱う。
 *
 * 100km / 10m = 10000 repeats
 */
groundTexture.repeat.set(
  10000,
  10000
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

/*
 * 壁のテクスチャ。
 * 巨大化させず元の密度を維持。
 */
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

/*
 * 巨大Planeは廃止。
 *
 * 実際の地面はWORLD STREAMINGが
 * プレイヤー周辺だけ生成する。
 */
const groundChunkMaterial =
  new THREE.MeshStandardMaterial({
    map: groundTexture,
    roughness: 0.95,
    color: 0x8fa667
  });

// ==================================================
// WORLD STREAMING
// ==================================================

/*
 * 1チャンク = 500m × 500m
 */
const CHUNK_SIZE_METERS = 500;

const CHUNK_SIZE =
  CHUNK_SIZE_METERS /
  METERS_PER_UNIT;

/*
 * 現在の描画距離。
 *
 * 後でESC設定から変更可能にする。
 */
let renderDistanceKm = 3;

/*
 * 描画距離より少し外側まで
 * 先に準備する。
 */
const CHUNK_PREFETCH_EXTRA_KM = 1;

/*
 * この距離を超えたチャンクは破棄。
 *
 * 描画距離より広くすることで、
 * 境界付近で生成/削除を
 * 繰り返すのを防ぐ。
 */
const CHUNK_UNLOAD_EXTRA_KM = 1.5;

/*
 * プレイヤーの何秒先まで
 * 移動方向を先読みするか。
 */
const CHUNK_LOOK_AHEAD_SECONDS = 8;

/*
 * 1フレームで世界生成に
 * 使用してよい最大時間。
 */
const STREAMING_BUDGET_MS = 2;

/*
 * 現在ロードされているチャンク。
 *
 * key:
 * "x,z"
 */
const loadedChunks =
  new Map();

/*
 * 現在生成予約済みのチャンク。
 *
 * 同じチャンクを何度も
 * キューへ追加しないため。
 */
const queuedChunks =
  new Set();

/*
 * 少しずつ処理する生成キュー。
 */
const chunkGenerationQueue =
  [];

// --------------------------
// HELPERS
// --------------------------

function getChunkKey(
  chunkX,
  chunkZ
) {
  return (
    `${chunkX},${chunkZ}`
  );
}

function getChunkCoordinate(
  worldUnits
) {
  return Math.floor(
    worldUnits /
    CHUNK_SIZE
  );
}

function getChunkCenter(
  chunkX,
  chunkZ,
  target
) {
  target.set(
    (
      chunkX +
      0.5
    ) *
      CHUNK_SIZE,

    0,

    (
      chunkZ +
      0.5
    ) *
      CHUNK_SIZE
  );

  return target;
}

// --------------------------
// CREATE CHUNK
// --------------------------

function createGroundChunk(
  chunkX,
  chunkZ
) {
  const key =
    getChunkKey(
      chunkX,
      chunkZ
    );

  if (
    loadedChunks.has(
      key
    )
  ) {
    return;
  }

  const geometry =
    new THREE.PlaneGeometry(
      CHUNK_SIZE,
      CHUNK_SIZE
    );

  /*
   * 各チャンクで同じ地面模様を
   * 繰り返すため、
   * テクスチャをclone。
   */
  const material =
    groundChunkMaterial.clone();

  if (
    groundTexture
  ) {
    const texture =
      groundTexture.clone();

    texture.needsUpdate =
      true;

    texture.wrapS =
      THREE.RepeatWrapping;

    texture.wrapT =
      THREE.RepeatWrapping;

    /*
     * 500mチャンク。
     * 10mごとに1タイル。
     */
    const repeats =
      CHUNK_SIZE_METERS /
      10;

    texture.repeat.set(
      repeats,
      repeats
    );

    material.map =
      texture;
  }

  const mesh =
    new THREE.Mesh(
      geometry,
      material
    );

  mesh.rotation.x =
    -Math.PI / 2;

  mesh.position.set(
    (
      chunkX +
      0.5
    ) *
      CHUNK_SIZE,

    0,

    (
      chunkZ +
      0.5
    ) *
      CHUNK_SIZE
  );

  mesh.receiveShadow =
    true;

  scene.add(mesh);

  loadedChunks.set(
    key,
    {
      chunkX,
      chunkZ,
      mesh
    }
  );
}

// --------------------------
// DESTROY CHUNK
// --------------------------

function destroyGroundChunk(
  key,
  chunk
) {
  scene.remove(
    chunk.mesh
  );

  chunk.mesh.geometry
    .dispose();

  if (
    chunk.mesh.material.map &&
    chunk.mesh.material.map !==
      groundTexture
  ) {
    chunk.mesh.material.map
      .dispose();
  }

  chunk.mesh.material
    .dispose();

  loadedChunks.delete(
    key
  );
}

// --------------------------
// QUEUE CHUNK
// --------------------------

function queueGroundChunk(
  chunkX,
  chunkZ,
  priority
) {
  const key =
    getChunkKey(
      chunkX,
      chunkZ
    );

  if (
    loadedChunks.has(
      key
    ) ||
    queuedChunks.has(
      key
    )
  ) {
    return;
  }

  queuedChunks.add(
    key
  );

  chunkGenerationQueue.push({
    key,
    chunkX,
    chunkZ,
    priority
  });
}

// --------------------------
// REQUEST SURROUNDINGS
// --------------------------

const chunkTempCenter =
  new THREE.Vector3();

const chunkFuturePosition =
  new THREE.Vector3();

function requestWorldChunks() {
  /*
   * 現在位置。
   */
  const playerX =
    camera.position.x;

  const playerZ =
    camera.position.z;

  /*
   * 速度から数秒後の
   * 予測位置を出す。
   */
  chunkFuturePosition
    .copy(
      camera.position
    )
    .addScaledVector(
      velocity,
      CHUNK_LOOK_AHEAD_SECONDS
    );

  const currentChunkX =
    getChunkCoordinate(
      playerX
    );

  const currentChunkZ =
    getChunkCoordinate(
      playerZ
    );

  const futureChunkX =
    getChunkCoordinate(
      chunkFuturePosition.x
    );

  const futureChunkZ =
    getChunkCoordinate(
      chunkFuturePosition.z
    );

  const requestDistanceMeters =
    (
      renderDistanceKm +
      CHUNK_PREFETCH_EXTRA_KM
    ) *
    1000;

  const requestDistanceUnits =
    requestDistanceMeters /
    METERS_PER_UNIT;

  const chunkRadius =
    Math.ceil(
      requestDistanceUnits /
      CHUNK_SIZE
    );

  /*
   * 現在地と未来位置の間を
   * カバーする。
   */
  const minChunkX =
    Math.min(
      currentChunkX,
      futureChunkX
    ) -
    chunkRadius;

  const maxChunkX =
    Math.max(
      currentChunkX,
      futureChunkX
    ) +
    chunkRadius;

  const minChunkZ =
    Math.min(
      currentChunkZ,
      futureChunkZ
    ) -
    chunkRadius;

  const maxChunkZ =
    Math.max(
      currentChunkZ,
      futureChunkZ
    ) +
    chunkRadius;

  for (
    let x = minChunkX;
    x <= maxChunkX;
    x++
  ) {
    for (
      let z = minChunkZ;
      z <= maxChunkZ;
      z++
    ) {
      getChunkCenter(
        x,
        z,
        chunkTempCenter
      );

      /*
       * 現在位置からの距離。
       */
      const currentDistance =
        Math.hypot(
          chunkTempCenter.x -
            playerX,

          chunkTempCenter.z -
            playerZ
        );

      /*
       * 未来位置からの距離。
       */
      const futureDistance =
        Math.hypot(
          chunkTempCenter.x -
            chunkFuturePosition.x,

          chunkTempCenter.z -
            chunkFuturePosition.z
        );

      /*
       * 現在または未来位置の
       * どちらかに近ければ必要。
       */
      const distance =
        Math.min(
          currentDistance,
          futureDistance
        );

      if (
        distance >
        requestDistanceUnits
      ) {
        continue;
      }

      queueGroundChunk(
        x,
        z,
        distance
      );
    }
  }

  /*
   * 近いチャンクから先に作る。
   */
  chunkGenerationQueue.sort(
    (a, b) =>
      a.priority -
      b.priority
  );
}

// --------------------------
// PROCESS QUEUE
// --------------------------

function processChunkQueue() {
  const startTime =
    performance.now();

  while (
    chunkGenerationQueue.length >
    0
  ) {
    const job =
      chunkGenerationQueue.shift();

    queuedChunks.delete(
      job.key
    );

    createGroundChunk(
      job.chunkX,
      job.chunkZ
    );

    /*
     * 2ms使ったら
     * 次フレームへ回す。
     */
    if (
      performance.now() -
      startTime >=
      STREAMING_BUDGET_MS
    ) {
      break;
    }
  }
}

// --------------------------
// UNLOAD
// --------------------------

function unloadFarChunks() {
  const unloadDistanceMeters =
    (
      renderDistanceKm +
      CHUNK_UNLOAD_EXTRA_KM
    ) *
    1000;

  const unloadDistanceUnits =
    unloadDistanceMeters /
    METERS_PER_UNIT;

  for (
    const [
      key,
      chunk
    ]
    of loadedChunks
  ) {
    getChunkCenter(
      chunk.chunkX,
      chunk.chunkZ,
      chunkTempCenter
    );

    const distance =
      Math.hypot(
        chunkTempCenter.x -
          camera.position.x,

        chunkTempCenter.z -
          camera.position.z
      );

    if (
      distance >
      unloadDistanceUnits
    ) {
      destroyGroundChunk(
        key,
        chunk
      );
    }
  }
}

// --------------------------
// WORLD STREAMING UPDATE
// --------------------------

let chunkRequestTimer = 0;

function updateWorldStreaming(
  delta
) {
  /*
   * 必要チャンク探索自体は
   * 毎フレームする必要なし。
   */
  chunkRequestTimer -=
    delta;

  if (
    chunkRequestTimer <= 0
  ) {
    chunkRequestTimer =
      0.25;

    requestWorldChunks();

    unloadFarChunks();
  }

  /*
   * 実生成は毎フレーム少しずつ。
   */
  processChunkQueue();
}

// ==================================================
// AREA SYSTEM
// ==================================================
let currentAreaId = null;
let previousAreaChunkX = null;
let previousAreaChunkZ = null;
let areaSystemInitialized = false;

// --------------------------------------------------
// FIND AREA
// --------------------------------------------------
function findAreaAtPosition(
 position
) {
 /*
  * Three.js unit
  * ↓
  * 実寸m
  */
 const xMeters =
 position.x *
 METERS_PER_UNIT;

 const zMeters =
 position.z *
 METERS_PER_UNIT;

 for (
 const area
 of WORLD_MAP.areas
 ) {
  // ------------------------------------------------
  // RECTANGLE
  // ------------------------------------------------
  if (
   area.type ===
   "rectangle"
  ) {
   const halfWidth =
   area.widthMeters /
   2;

   const halfDepth =
   area.depthMeters /
   2;

   const inside =
   xMeters >=
   area.xMeters -
   halfWidth &&

   xMeters <=
   area.xMeters +
   halfWidth &&

   zMeters >=
   area.zMeters -
   halfDepth &&

   zMeters <=
   area.zMeters +
   halfDepth;

   if (inside) {
    return area;
   }
  }

  // ------------------------------------------------
  // CIRCLE
  // ------------------------------------------------
  if (
   area.type ===
   "circle"
  ) {
   const distance =
   Math.hypot(
    xMeters -
    area.xMeters,

    zMeters -
    area.zMeters
   );

   if (
    distance <=
    area.radiusMeters
   ) {
    return area;
   }
  }
 }

 return null;
}

// --------------------------------------------------
// ENTER AREA
// --------------------------------------------------
function enterArea(
 area
) {
 if (!area) {
  currentAreaId =
  null;

  return;
 }

 /*
  * 同じ場所なら表示しない。
  */
 if (
  currentAreaId ===
  area.id
 ) {
  return;
 }

 currentAreaId =
 area.id;

 showMessage(
  area.name
 );
}

// --------------------------------------------------
// UPDATE AREA
// --------------------------------------------------
function updateAreaSystem() {
 const chunkX =
 getChunkCoordinate(
  camera.position.x
 );

 const chunkZ =
 getChunkCoordinate(
  camera.position.z
 );

 /*
  * 初回、または別チャンクへ
  * 移動した場合だけ判定。
  */
 if (
  areaSystemInitialized &&
  chunkX ===
  previousAreaChunkX &&
  chunkZ ===
  previousAreaChunkZ
 ) {
  return;
 }

 previousAreaChunkX =
 chunkX;

 previousAreaChunkZ =
 chunkZ;

 areaSystemInitialized =
 true;

 const area =
 findAreaAtPosition(
  camera.position
 );

 enterArea(
  area
 );
}

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
const wallRings = [];

function createWallRing(
  radius,
  name
) {
  const halfThickness =
    CITY_WALL_THICKNESS / 2;

  const outerRadius =
    radius + halfThickness;

  const innerRadius =
    radius - halfThickness;

  const radialSegments = 512;

  // -------------------------
  // OUTER WALL
  // -------------------------
  const outerGeometry =
    new THREE.CylinderGeometry(
      outerRadius,
      outerRadius,
      CITY_WALL_HEIGHT,
      radialSegments,
      1,
      true
    );

  const outerMaterial =
    outerWallMaterial.clone();

  outerMaterial.side =
    THREE.FrontSide;

  const outerWall =
    new THREE.Mesh(
      outerGeometry,
      outerMaterial
    );

  outerWall.position.set(
    0,
    CITY_WALL_HEIGHT / 2,
    0
  );

  outerWall.castShadow = true;
  outerWall.receiveShadow = true;
  outerWall.frustumCulled = false;

  scene.add(
    outerWall
  );

  anchorTargets.push(
    outerWall
  );

  // -------------------------
  // INNER WALL
  // -------------------------
  const innerGeometry =
    new THREE.CylinderGeometry(
      innerRadius,
      innerRadius,
      CITY_WALL_HEIGHT,
      radialSegments,
      1,
      true
    );

  const innerMaterial =
    outerWallMaterial.clone();

  innerMaterial.side =
    THREE.BackSide;

  const innerWall =
    new THREE.Mesh(
      innerGeometry,
      innerMaterial
    );

  innerWall.position.set(
    0,
    CITY_WALL_HEIGHT / 2,
    0
  );

  innerWall.castShadow = true;
  innerWall.receiveShadow = true;
  innerWall.frustumCulled = false;

  scene.add(
    innerWall
  );

  anchorTargets.push(
    innerWall
  );

  // -------------------------
  // WALL TOP
  // -------------------------
  const topGeometry =
    new THREE.RingGeometry(
      innerRadius,
      outerRadius,
      radialSegments
    );

  const topMaterial =
    outerWallMaterial.clone();

  topMaterial.side =
    THREE.DoubleSide;

  const wallTop =
    new THREE.Mesh(
      topGeometry,
      topMaterial
    );

  wallTop.rotation.x =
    -Math.PI / 2;

  wallTop.position.set(
    0,
    CITY_WALL_HEIGHT,
    0
  );

  wallTop.receiveShadow = true;
  wallTop.frustumCulled = false;

  scene.add(
    wallTop
  );

  anchorTargets.push(
    wallTop
  );

  // -------------------------
  // REGISTER COLLISION DATA
  // -------------------------
  wallRings.push({
    radius: radius,
    innerRadius: innerRadius,
    outerRadius: outerRadius,
    outerWall: outerWall,
    innerWall: innerWall,
    wallTop: wallTop,
    name: name
  });
}

function createCityWall() {
  createWallRing(
    MARIA_RADIUS,
    "MARIA"
  );

  createWallRing(
    ROSE_RADIUS,
    "ROSE"
  );

  createWallRing(
    SINA_RADIUS,
    "SINA"
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

/*
 * 家そのものは1/100にしない。
 *
 * 全て実寸スケール。
 */
const HOUSE_TEMPLATES = [
  {
    width: 7,
    depth: 9,
    height: 8,
    roofHeight: 3
  },

  {
    width: 9,
    depth: 11,
    height: 10,
    roofHeight: 3.5
  },

  {
    width: 11,
    depth: 8,
    height: 12,
    roofHeight: 4
  },

  {
    width: 8,
    depth: 8,
    height: 14,
    roofHeight: 3
  },

  {
    width: 13,
    depth: 10,
    height: 9,
    roofHeight: 4
  }
];

/*
 * テンプレ値はmなので、
 * ここでunitへ変換。
 */
function createHouse(
  x,
  z,
  variant,
  rotation = 0
) {
  const template =
    HOUSE_TEMPLATES[
      variant %
      HOUSE_TEMPLATES.length
    ];

  const width =
    metersToUnits(
      template.width
    );

  const depth =
    metersToUnits(
      template.depth
    );

  const height =
    metersToUnits(
      template.height
    );

  const roofHeight =
    metersToUnits(
      template.roofHeight
    );

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

  house.rotation.y =
    rotation;

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

        roofHeight,

        4
      ),
      roofMaterial
    );

  roof.position.set(
    x,
    height +
      roofHeight / 2,
    z
  );

  roof.rotation.y =
    Math.PI / 4 +
    rotation;

  roof.castShadow = true;

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
function createDistrict(
  centerX,
  centerZ,
  facingAngle,
  houseCount
) {
  // 大規模城塞都市
  const districtLength =
    metersToUnits(900);

  const districtWidth =
    metersToUnits(650);

  const mainRoadWidth =
    metersToUnits(14);

  const sideRoadSpacing =
    metersToUnits(90);

  const forwardX =
    Math.sin(facingAngle);

  const forwardZ =
    Math.cos(facingAngle);

  const rightX =
    Math.cos(facingAngle);

  const rightZ =
    -Math.sin(facingAngle);

  // =================================================
  // MAIN ROAD
  // ==================================================
  const mainRoad =
    new THREE.Mesh(
      new THREE.PlaneGeometry(
        mainRoadWidth,
        districtLength
      ),
      roadMaterial
    );

  mainRoad.rotation.x =
    -Math.PI / 2;

  mainRoad.rotation.z =
    -facingAngle;

  mainRoad.position.set(
    centerX,
    0.03,
    centerZ
  );

  mainRoad.receiveShadow = true;

  scene.add(mainRoad);

  // =================================================
  // CROSS ROADS
  // ==================================================
  const roadCount =
    Math.floor(
      districtLength /
      sideRoadSpacing
    );

  for (
    let i =
      -Math.floor(
        roadCount / 2
      );
    i <=
      Math.floor(
        roadCount / 2
      );
    i++
  ) {
    const along =
      i *
      sideRoadSpacing;

    const roadX =
      centerX +
      forwardX *
      along;

    const roadZ =
      centerZ +
      forwardZ *
      along;

    const crossRoad =
      new THREE.Mesh(
        new THREE.PlaneGeometry(
          districtWidth,
          metersToUnits(7)
        ),
        roadMaterial
      );

    crossRoad.rotation.x =
      -Math.PI / 2;

    crossRoad.rotation.z =
      -facingAngle +
      Math.PI / 2;

    crossRoad.position.set(
      roadX,
      0.035,
      roadZ
    );

    crossRoad.receiveShadow = true;

    scene.add(crossRoad);
  }

  // =================================================
  // HOUSES
  // ==================================================
  let created = 0;

  let attempts = 0;

  const maxAttempts =
    houseCount * 20;

  while (
    created < houseCount &&
    attempts < maxAttempts
  ) {
    attempts++;

    const along =
      THREE.MathUtils.randFloat(
        -districtLength / 2 +
          metersToUnits(20),
        districtLength / 2 -
          metersToUnits(20)
      );

    const sideways =
      THREE.MathUtils.randFloat(
        -districtWidth / 2 +
          metersToUnits(15),
        districtWidth / 2 -
          metersToUnits(15)
      );

    // 中央大通り
    if (
      Math.abs(sideways) <
      mainRoadWidth / 2 +
        metersToUnits(7)
    ) {
      continue;
    }

    // 横道
    const nearestSideRoad =
      Math.round(
        along /
        sideRoadSpacing
      ) *
      sideRoadSpacing;

    if (
      Math.abs(
        along -
        nearestSideRoad
      ) <
      metersToUnits(7)
    ) {
      continue;
    }

    const x =
      centerX +
      forwardX *
        along +
      rightX *
        sideways;

    const z =
      centerZ +
      forwardZ *
        along +
      rightZ *
        sideways;

    createHouse(
      x,
      z,
      created,
      -facingAngle
    );

    created++;
  }
}

function createCity() {
  const housesPerDistrict =
    300;

  // =================================================
  // MARIA SOUTH
  // ==================================================
  createDistrict(
    0,
    MARIA_RADIUS -
      metersToUnits(470),
    Math.PI,
    housesPerDistrict
  );

  // =================================================
  // ROSE SOUTH
  // ==================================================
  createDistrict(
    0,
    ROSE_RADIUS -
      metersToUnits(470),
    Math.PI,
    housesPerDistrict
  );

  // =================================================
  // SINA SOUTH
  // ==================================================
  createDistrict(
    0,
    SINA_RADIUS -
      metersToUnits(470),
    Math.PI,
    housesPerDistrict
  );

  // =================================================
  // VILLAGES
  // ==================================================
  const villages = [
    [-2500, 3000],
    [3200, 2200],
    [-4000, -1800],
    [3600, -3500],
    [-7000, 6000],
    [6500, -6500],
    [-10000, 8000],
    [9000, 11000]
  ];

  for (
    let v = 0;
    v < villages.length;
    v++
  ) {
    const [
      villageX,
      villageZ
    ] =
      villages[v];

    for (
      let i = 0;
      i < 24;
      i++
    ) {
      const angle =
        Math.random() *
        Math.PI *
        2;

      const radius =
        THREE.MathUtils.randFloat(
          metersToUnits(20),
          metersToUnits(120)
        );

      createHouse(
        villageX +
          Math.cos(angle) *
          radius,
        villageZ +
          Math.sin(angle) *
          radius,
        i + v * 10,
        Math.random() *
          Math.PI *
          2
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

  ropeLocked: false,

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

  /*
   * 接続予定地点はここで確定。
   */
  anchor.targetPoint.copy(
    point
  );

  /*
   * アンカーの本当の発射位置。
   * ワイヤー射出口と同じ。
   */
  wireVisualStart.set(
    (anchor.side ?? 0) *
      WIRE_START_SIDE,
    WIRE_START_DOWN,
    WIRE_START_FORWARD
  );

  camera.localToWorld(
    wireVisualStart
  );

  anchor.launchPosition.copy(
    wireVisualStart
  );

  anchor.projectilePosition.copy(
    wireVisualStart
  );

  if (
    anchor.projectileMesh
  ) {
    anchor.projectileMesh.position.copy(
      wireVisualStart
    );

    anchor.projectileMesh.visible =
      true;
  }

  anchor.target =
    target;

  anchor.pulling =
    false;

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
   * targetPointは発射した瞬間に確定済み。
   * 途中で変更しない。
   */
  projectileDirection
    .subVectors(
      anchor.targetPoint,
      anchor.projectilePosition
    );

  const remaining =
    projectileDirection.length();

  if (
    remaining <= 0.001
  ) {
    anchor.projectilePosition.copy(
      anchor.targetPoint
    );

    connectAnchor(
      anchor,
      anchor.targetPoint,
      anchor.target
    );

    return;
  }

  projectileDirection.normalize();

  /*
   * projectileVelocityは
   * 発射時に決めた「速度の大きさ」として使用。
   */
  const projectileSpeed =
    anchor.projectileVelocity.length();

  if (
    projectileSpeed <= 0.001
  ) {
    releaseAnchor(
      anchor
    );

    return;
  }

  const travel =
    projectileSpeed *
    delta;

  /*
   * このフレームで目的地点へ
   * 到達できる場合だけ接続。
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
        anchor.projectilePosition
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
   * このフレームで実際に進める距離だけ
   * targetPoint方向へ進む。
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
    anchor.wire.visible =
      false;

    return;
  }

  /*
   * 重要:
   *
   * targetPointは絶対に
   * ワイヤー描画へ使用しない。
   *
   * 発射中のワイヤー先端は
   * projectilePositionそのもの。
   */
  const end =
    anchor.state === "FIRING"
      ? anchor.projectilePosition
      : anchor.point;

  // 左右の射出口
  wireVisualStart.set(
    (anchor.side ?? 0) *
      WIRE_START_SIDE,
    WIRE_START_DOWN,
    WIRE_START_FORWARD
  );

  camera.localToWorld(
    wireVisualStart
  );

  /*
   * 現在の射出口
   *      ↓
   * 現在のアンカー位置
   *
   * の距離しか描画しない。
   */
  wireVisualDirection
    .subVectors(
      end,
      wireVisualStart
    );

  const currentWireLength =
    wireVisualDirection.length();

  if (
    currentWireLength <= 0.001
  ) {
    anchor.wire.visible =
      false;

    return;
  }

  wireVisualMiddle
    .copy(
      wireVisualStart
    )
    .add(end)
    .multiplyScalar(
      0.5
    );

  anchor.wire.position.copy(
    wireVisualMiddle
  );

  /*
   * ワイヤー長 =
   * 現在のアンカーまでの距離。
   *
   * targetPointまでの距離ではない。
   */
  anchor.wire.scale.set(
    1,
    currentWireLength,
    1
  );

  wireVisualDirection.normalize();

  anchor.wire.quaternion
    .setFromUnitVectors(
      wireVisualYAxis,
      wireVisualDirection
    );

  anchor.wire.visible =
    true;
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
 // --------------------------------------------------
 // NOT CONNECTED
 // --------------------------------------------------
 if (
  !anchor.connected
 ) {
  anchor.pulling =
  false;

  anchor.impulseApplied =
  false;

  anchor.ropeLocked =
  false;

  return;
 }

// --------------------------------------------------
// SHIFT INPUT
// --------------------------------------------------
const ctrlHeld =
 keys["ShiftLeft"] ||
 keys["ShiftRight"];

 // --------------------------------------------------
 // ROPE LOCK
 // --------------------------------------------------
 if (ctrlHeld) {
  /*
   * Ctrlを押した最初のフレームだけ
   * 現在のアンカーとの距離を保存。
   *
   * 以降はCtrlを離すまで
   * lengthを絶対に変更しない。
   */
  if (
   !anchor.ropeLocked
  ) {
   anchor.length =
   camera.position.distanceTo(
    anchor.point
   );

   anchor.ropeLocked =
   true;
  }

  /*
   * ガス牽引は完全停止。
   */
  anchor.pulling =
  false;

  anchor.impulseApplied =
  false;

  return;
 }

 // --------------------------------------------------
 // UNLOCK
 // --------------------------------------------------
 if (
  anchor.ropeLocked
 ) {
  anchor.ropeLocked =
  false;

  anchor.impulseApplied =
  false;
 }

 // --------------------------------------------------
 // NO PULL
 // --------------------------------------------------
 if (
  !keys["KeyW"] ||
  !gasAvailable
 ) {
  anchor.pulling =
  false;

  anchor.impulseApplied =
  false;

  return;
 }

 // --------------------------------------------------
 // WIRE DIRECTION
 // --------------------------------------------------
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

 // --------------------------------------------------
 // INITIAL IMPULSE
 // --------------------------------------------------
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

 // --------------------------------------------------
 // SUSTAINED PULL
 // --------------------------------------------------
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
 // --------------------------------------------------
 // ACTIVE CHECK
 // --------------------------------------------------
 if (
  !anchor.connected ||
  (
   !anchor.pulling &&
   !anchor.ropeLocked
  )
 ) {
  return;
 }

 // --------------------------------------------------
 // ROPE VECTOR
 // --------------------------------------------------
 ropeOutward.subVectors(
  camera.position,
  anchor.point
 );

 const distance =
 ropeOutward.length();

 if (
  distance <
  0.001
 ) {
  return;
 }

 ropeOutward.normalize();

 // --------------------------------------------------
 // POSITION CONSTRAINT
 // --------------------------------------------------
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

 // --------------------------------------------------
 // VELOCITY CONSTRAINT
 // --------------------------------------------------
 const outwardVelocity =
 velocity.dot(
  ropeOutward
 );

 if (
  outwardVelocity > 0
 ) {
  /*
   * ロープを伸ばす方向の
   * 速度だけ取り除く。
   *
   * この処理は速度を追加しない。
   */
  velocity.addScaledVector(
   ropeOutward,
   -outwardVelocity
  );
 }

 // --------------------------------------------------
 // SAFETY
 // --------------------------------------------------
 /*
  * 拘束処理そのものから
  * 異常速度が発生した場合の
  * 最終安全装置。
  *
  * ワイヤー用1000km/h上限。
  */
 limitWireSafetySpeed();
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

  if (
    !usingGas
  ) {
    return;
  }

  // -------------------------
  // GAS CONSUMPTION
  // -------------------------
  gas -=
    FLIGHT_GAS_USE_RATE *
    delta;

  gas =
    Math.max(
      gas,
      0
    );

  /*
   * このフレームの通常ガスを
   * 使用する前の総速度。
   *
   * ワイヤーやBURSTですでに
   * 150km/hを超えていた場合、
   * その慣性は強制的に消さない。
   */
  const speedBeforeGas =
    velocity.length();

  const alreadyOverLimit =
    speedBeforeGas >
    GAS_NORMAL_MAX_SPEED;

  // =================================================
  // VERTICAL GAS
  // =================================================

  if (
    velocity.y < 0
  ) {
    /*
     * 落下中。
     *
     * ガスで下向き速度を回復する。
     */
    velocity.y +=
      GAS_RECOVERY_ACCEL *
      delta;

    /*
     * この処理によって
     * 上昇上限を飛び越さない。
     */
    velocity.y =
      Math.min(
        velocity.y,
        GAS_CLIMB_SPEED
      );
  } else if (
    velocity.y <
    GAS_CLIMB_SPEED
  ) {
    /*
     * 通常上昇。
     */
    velocity.y +=
      GAS_CLIMB_ACCEL *
      delta;

    velocity.y =
      Math.min(
        velocity.y,
        GAS_CLIMB_SPEED
      );
  }

  // =================================================
  // HORIZONTAL GAS CONTROL
  // =================================================

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

    /*
     * 既存の慣性を消さず、
     * 入力方向へ加速度を追加。
     */
    velocity.addScaledVector(
      input,
      AIR_CONTROL_ACCEL *
      delta
    );
  }

  // =================================================
  // NORMAL GAS TOTAL SPEED LIMIT
  // =================================================

  const speedAfterGas =
    velocity.length();

  /*
   * 通常速度域から、
   * このフレームのガスによって
   * 150km/hを突破した場合。
   */
  if (
    !alreadyOverLimit &&
    speedAfterGas >
    GAS_NORMAL_MAX_SPEED
  ) {
    velocity.multiplyScalar(
      GAS_NORMAL_MAX_SPEED /
      speedAfterGas
    );

    return;
  }

  /*
   * ワイヤーやGAS BURSTで
   * すでに150km/hを超えていた場合。
   *
   * 通常ガスを押したことで
   * さらに総速度が増えることだけ防ぐ。
   *
   * 150km/hへ強制減速はしない。
   */
  if (
    alreadyOverLimit &&
    speedAfterGas >
    speedBeforeGas &&
    speedAfterGas >
    0.001
  ) {
    velocity.multiplyScalar(
      speedBeforeGas /
      speedAfterGas
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
const WALL_JUMP_MAX_SURFACE_ANGLE =
 THREE.MathUtils.degToRad(
  30
 );

// --------------------------------------------------
// WALL JUMP ANGLE CHECK
// --------------------------------------------------
function canWallJumpByAngle(
 velocityX,
 velocityZ,
 normalX,
 normalZ
) {
 const horizontalSpeed =
 Math.hypot(
  velocityX,
  velocityZ
 );

 if (
  horizontalSpeed <
  0.001
 ) {
  return false;
 }

 /*
  * 壁面に対する進入角度を求める。
  *
  * 0° = 壁と完全に平行
  * 90° = 壁へ真正面から衝突
  */
 const normalSpeed =
 Math.abs(
  velocityX *
  normalX +
  velocityZ *
  normalZ
 );

 const ratio =
 THREE.MathUtils.clamp(
  normalSpeed /
  horizontalSpeed,
  0,
  1
 );

 const surfaceAngle =
 Math.asin(
  ratio
 );

 return (
  surfaceAngle <
  WALL_JUMP_MAX_SURFACE_ANGLE
 );
}

// --------------------------------------------------
// WALL JUMP
// --------------------------------------------------
function wallJump(
 normalX,
 normalZ
) {
 /*
  * 壁の法線成分だけ反転。
  *
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

 grounded =
 false;
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

// ==================================================
// RING WALL COLLISION
// ==================================================
function collidesRingWall(
  position
) {
  // 壁より上なら衝突しない
  const feet =
    position.y -
    PLAYER_HEIGHT;

  if (
    feet >=
    CITY_WALL_HEIGHT
  ) {
    return false;
  }

  // 世界中心からの水平距離
  const radialDistance =
    Math.hypot(
      position.x,
      position.z
    );

  const collisionThickness =
    CITY_WALL_THICKNESS /
      2 +
    PLAYER_RADIUS;

  // Maria / Rose / Sina
  for (
    const ring
    of wallRings
  ) {
    const difference =
      Math.abs(
        radialDistance -
        ring.radius
      );

    if (
      difference <=
      collisionThickness
    ) {
      return true;
    }
  }

  return false;
}

function collides(
  position
) {
  // 建物など
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

  // 三重壁
  if (
    collidesRingWall(
      position
    )
  ) {
    return true;
  }

  return false;
}

// ==================================================
// HORIZONTAL MOVEMENT STEP
// ==================================================
function moveHorizontalStep(
 delta
) {
 // --------------------------------------------------
 // X
 // --------------------------------------------------
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
  if (grounded) {
   velocity.x = 0;
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

   const angleWallJump =
   canWallJumpByAngle(
    velocity.x,
    velocity.z,
    normalX,
    0
   );

   /*
    * 壁面に対して30°未満なら
    * 速度に関係なく壁キック可能。
    *
    * それ以外は従来どおり
    * 30km/h未満なら壁キック。
    */
   if (
    wallStunTimer > 0
   ) {
    velocity.x = 0;
   } else if (
    angleWallJump ||
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
 }

 // --------------------------------------------------
 // Z
 // --------------------------------------------------
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
  if (grounded) {
   velocity.z = 0;
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

   const angleWallJump =
   canWallJumpByAngle(
    velocity.x,
    velocity.z,
    0,
    normalZ
   );

   if (
    wallStunTimer > 0
   ) {
    velocity.z = 0;
   } else if (
    angleWallJump ||
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

  // =================================================
  // GROUND
  // =================================================

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

  // =================================================
  // LAND ON RING WALL
  // =================================================

  if (
    velocity.y <= 0
  ) {
    const radialDistance =
      Math.hypot(
        camera.position.x,
        camera.position.z
      );

    for (
      const ring
      of wallRings
    ) {
      /*
       * プレイヤーが壁の厚みの
       * 範囲内にいるか。
       */
      const onWallHorizontally =
        radialDistance >=
          ring.innerRadius -
          PLAYER_RADIUS &&

        radialDistance <=
          ring.outerRadius +
          PLAYER_RADIUS;

      if (
        !onWallHorizontally
      ) {
        continue;
      }

      const oldFeet =
        oldY -
        PLAYER_HEIGHT;

      const newFeet =
        next.y -
        PLAYER_HEIGHT;

      /*
       * 上から壁上面を跨いだ場合。
       */
      if (
        oldFeet >=
          CITY_WALL_HEIGHT &&
        newFeet <=
          CITY_WALL_HEIGHT
      ) {
        damageFromImpact(
          velocity.y
        );

        if (dead) {
          return;
        }

        camera.position.y =
          CITY_WALL_HEIGHT +
          PLAYER_HEIGHT;

        velocity.y = 0;

        /*
         * 地面と完全に同じ扱い。
         */
        grounded = true;

        return;
      }
    }
  }

  // =================================================
  // NORMAL BUILDING MOVEMENT
  // =================================================

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

  // =================================================
  // LAND ON BUILDING
  // =================================================

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

        if (dead) {
          return;
        }

        camera.position.y =
          box.max.y +
          PLAYER_HEIGHT;

        velocity.y = 0;

        grounded = true;

        return;
      }
    }
  }

  /*
   * 天井等への縦衝突。
   */
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
   "opacity .35s",

  pointerEvents: "none",

  zIndex: "150"
 }
);

document.body.appendChild(
 messageHUD
);

let messageTimeout =
 null;

// --------------------------------------------------
// SHOW MESSAGE
// --------------------------------------------------
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
   2500
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

  pointerEvents: "none",

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

  pointerEvents: "none",

  zIndex: "100"
 }
);

// --------------------------------------------------
// LEFT / RIGHT
// --------------------------------------------------
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

  pointerEvents: "none",

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
   "0 1px 3px black",

  pointerEvents: "none",

  zIndex: "100"
 }
);

document.body.appendChild(
 resources
);

// --------------------------------------------------
// CREATE BAR
// --------------------------------------------------
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

// --------------------------------------------------
// HP / GAS
// --------------------------------------------------
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

  zIndex: "5000"
 }
);

deathScreen.textContent =
 "YOU DIED";

document.body.appendChild(
 deathScreen
);

// ==================================================
// TELEPORT HUD
// ==================================================
const teleportHUD =
 document.createElement(
  "div"
 );

Object.assign(
 teleportHUD.style,
 {
  position: "fixed",

  inset: "0",

  display: "none",

  background:
   "rgba(0,0,0,.82)",

  color: "white",

  fontFamily:
   "Arial, sans-serif",

  overflowY: "auto",

  padding: "60px",

  boxSizing:
   "border-box",

  zIndex: "9000"
 }
);

// --------------------------------------------------
// TITLE
// --------------------------------------------------
const teleportTitle =
 document.createElement(
  "div"
 );

teleportTitle.textContent =
 "TELEPORT";

Object.assign(
 teleportTitle.style,
 {
  fontSize: "40px",

  fontWeight: "bold",

  marginBottom: "10px"
 }
);

teleportHUD.appendChild(
 teleportTitle
);

// --------------------------------------------------
// HELP
// --------------------------------------------------
const teleportHelp =
 document.createElement(
  "div"
 );

teleportHelp.textContent =
 "移動先をクリック / T または ESC で閉じる";

Object.assign(
 teleportHelp.style,
 {
  color: "#bbb",

  fontSize: "16px",

  marginBottom: "32px"
 }
);

teleportHUD.appendChild(
 teleportHelp
);

// --------------------------------------------------
// LIST
// --------------------------------------------------
const teleportList =
 document.createElement(
  "div"
 );

Object.assign(
 teleportList.style,
 {
  display: "flex",

  flexDirection:
   "column",

  gap: "24px",

  maxWidth: "700px"
 }
);

teleportHUD.appendChild(
 teleportList
);

document.body.appendChild(
 teleportHUD
);

// ==================================================
// WORLD MAP HUD
// ==================================================
const worldMapHUD =
 document.createElement(
  "div"
 );

Object.assign(
 worldMapHUD.style,
 {
  position: "fixed",

  inset: "0",

  display: "none",

  background:
   "rgb(18,31,22)",

  overflow: "hidden",

  cursor: "grab",

  userSelect: "none",

  zIndex: "10000"
 }
);

// --------------------------------------------------
// MAP CANVAS
// --------------------------------------------------
const worldMapCanvas =
 document.createElement(
  "canvas"
 );

Object.assign(
 worldMapCanvas.style,
 {
  position: "absolute",

  left: "0",
  top: "0",

  width: "100%",
  height: "100%",

  display: "block"
 }
);

worldMapHUD.appendChild(
 worldMapCanvas
);

// --------------------------------------------------
// TITLE
// --------------------------------------------------
const worldMapTitle =
 document.createElement(
  "div"
 );

worldMapTitle.textContent =
 "PARADIS ISLAND";

Object.assign(
 worldMapTitle.style,
 {
  position: "absolute",

  left: "30px",
  top: "25px",

  color: "white",

  fontFamily: "Arial",

  fontSize: "30px",

  fontWeight: "bold",

  textShadow:
   "0 2px 5px black",

  pointerEvents: "none",

  zIndex: "2"
 }
);

worldMapHUD.appendChild(
 worldMapTitle
);

// --------------------------------------------------
// HELP
// --------------------------------------------------
const worldMapHelp =
 document.createElement(
  "div"
 );

worldMapHelp.textContent =
 "M / ESC : CLOSE    WHEEL : ZOOM    DRAG : MOVE";

Object.assign(
 worldMapHelp.style,
 {
  position: "absolute",

  left: "30px",
  bottom: "25px",

  color: "#ccc",

  fontFamily:
   "monospace",

  fontSize: "15px",

  textShadow:
   "0 1px 3px black",

  pointerEvents: "none",

  zIndex: "2"
 }
);

worldMapHUD.appendChild(
 worldMapHelp
);

// --------------------------------------------------
// ZOOM DISPLAY
// --------------------------------------------------
const worldMapZoomHUD =
 document.createElement(
  "div"
 );

Object.assign(
 worldMapZoomHUD.style,
 {
  position: "absolute",

  right: "30px",
  bottom: "25px",

  color: "#ccc",

  fontFamily:
   "monospace",

  fontSize: "15px",

  pointerEvents: "none",

  zIndex: "2"
 }
);

worldMapZoomHUD.textContent =
 "ZOOM 1.00x";

worldMapHUD.appendChild(
 worldMapZoomHUD
);

document.body.appendChild(
 worldMapHUD
);

// ==================================================
// TELEPORT SYSTEM
// ==================================================
let teleportMenuOpen =
 false;

// --------------------------------------------------
// TELEPORT TO POINT
// --------------------------------------------------
function teleportToPoint(
 point
) {
 if (!point) {
  return;
 }

 // ------------------------------------------------
 // RELEASE ANCHORS
 // ------------------------------------------------
 releaseAnchor(
  leftAnchor
 );

 releaseAnchor(
  rightAnchor
 );

 // ------------------------------------------------
 // RESET PLAYER
 // ------------------------------------------------
 velocity.set(
  0,
  0,
  0
 );

 wallStunTimer =
  0;

 grounded =
  true;

 // ------------------------------------------------
 // MOVE PLAYER
 // ------------------------------------------------
 camera.position.set(
  metersToUnits(
   point.xMeters
  ),

  PLAYER_HEIGHT,

  metersToUnits(
   point.zMeters
  )
 );

 // ------------------------------------------------
 // RESET AREA SYSTEM
 // ------------------------------------------------
 /*
  * AREA SYSTEMが導入済みなら
  * TP先で再判定させる。
  */
 if (
  typeof previousAreaChunkX !==
  "undefined"
 ) {
  previousAreaChunkX =
   null;

  previousAreaChunkZ =
   null;

  areaSystemInitialized =
   false;
 }

 // ------------------------------------------------
 // RESET STREAMING QUEUE
 // ------------------------------------------------
 chunkGenerationQueue.length =
  0;

 queuedChunks.clear();

 chunkRequestTimer =
  0;

 // ------------------------------------------------
 // CLOSE
 // ------------------------------------------------
 closeTeleportMenu();

 // ------------------------------------------------
 // MESSAGE
 // ------------------------------------------------
 showMessage(
  point.name
 );
}

// --------------------------------------------------
// BUILD TELEPORT MENU
// --------------------------------------------------
function buildTeleportMenu() {
 teleportList.replaceChildren();

 // ------------------------------------------------
 // EMPTY
 // ------------------------------------------------
 if (
  TELEPORT_POINTS.length ===
  0
 ) {
  const empty =
   document.createElement(
    "div"
   );

  empty.textContent =
   "TP地点が登録されていません";

  empty.style.color =
   "#ff7777";

  teleportList.appendChild(
   empty
  );

  return;
 }

 // ------------------------------------------------
 // GROUP BY CATEGORY
 // ------------------------------------------------
 const categories =
  new Map();

 for (
  const point
  of TELEPORT_POINTS
 ) {
  const category =
   point.category ||
   "その他";

  if (
   !categories.has(
    category
   )
  ) {
   categories.set(
    category,
    []
   );
  }

  categories
  .get(
   category
  )
  .push(
   point
  );
 }

 // ------------------------------------------------
 // CATEGORY SECTIONS
 // ------------------------------------------------
 for (
  const [
   category,
   points
  ]
  of categories
 ) {
  const section =
   document.createElement(
    "div"
   );

  const title =
   document.createElement(
    "div"
   );

  title.textContent =
   category;

  Object.assign(
   title.style,
   {
    color: "#ffcc66",

    fontSize: "22px",

    fontWeight: "bold",

    marginBottom: "8px"
   }
  );

  section.appendChild(
   title
  );

  // -----------------------------------------------
  // POINT BUTTONS
  // -----------------------------------------------
  for (
   const point
   of points
  ) {
   const button =
    document.createElement(
     "button"
    );

   button.textContent =
    point.name;

   Object.assign(
    button.style,
    {
     display: "block",

     width: "100%",

     marginBottom: "6px",

     padding:
      "12px 16px",

     color: "white",

     background:
      "rgba(255,255,255,.08)",

     border:
      "1px solid #777",

     borderRadius:
      "5px",

     fontSize: "18px",

     textAlign: "left",

     cursor: "pointer"
    }
   );

   button.addEventListener(
    "mouseenter",
    () => {
     button.style.background =
      "rgba(255,255,255,.22)";
    }
   );

   button.addEventListener(
    "mouseleave",
    () => {
     button.style.background =
      "rgba(255,255,255,.08)";
    }
   );

   button.addEventListener(
    "click",
    () => {
     teleportToPoint(
      point
     );
    }
   );

   section.appendChild(
    button
   );
  }

  teleportList.appendChild(
   section
  );
 }
}

// --------------------------------------------------
// OPEN TELEPORT MENU
// --------------------------------------------------
function openTeleportMenu() {
 if (
  teleportMenuOpen
 ) {
  return;
 }

 /*
  * MAPが開いていたら閉じる。
  */
 if (
  typeof worldMapOpen !==
   "undefined" &&
  worldMapOpen
 ) {
  closeWorldMap();
 }

 teleportMenuOpen =
  true;

 if (
  document.pointerLockElement
 ) {
  document.exitPointerLock();
 }

 /*
  * プレイヤー入力を解除。
  */
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

 buildTeleportMenu();

 teleportHUD.style.display =
  "block";
}

// --------------------------------------------------
// CLOSE TELEPORT MENU
// --------------------------------------------------
function closeTeleportMenu() {
 teleportMenuOpen =
  false;

 teleportHUD.style.display =
  "none";
}

// --------------------------------------------------
// TOGGLE TELEPORT MENU
// --------------------------------------------------
function toggleTeleportMenu() {
 if (
  teleportMenuOpen
 ) {
  closeTeleportMenu();
 } else {
  openTeleportMenu();
 }
}

// ==================================================
// WORLD MAP SYSTEM
// ==================================================
const worldMapContext =
 worldMapCanvas.getContext(
  "2d"
 );

let worldMapOpen =
 false;

let worldMapZoom =
 1;

let worldMapPanX =
 0;

let worldMapPanY =
 0;

let worldMapDragging =
 false;

let worldMapLastMouseX =
 0;

let worldMapLastMouseY =
 0;

// --------------------------------------------------
// WORLD TO MAP
// --------------------------------------------------
function worldToMap(
 xMeters,
 zMeters
) {
 const mariaRadius =
  WORLD_MAP.walls.maria
  .radiusMeters;

 /*
  * zoom=1でMaria全体が
  * 画面内に入る倍率。
  */
 const availableSize =
  Math.min(
   window.innerWidth,
   window.innerHeight
  ) *
  0.78;

 const baseScale =
  availableSize /
  (
   mariaRadius *
   2
  );

 const scale =
  baseScale *
  worldMapZoom;

 return {
  x:
   window.innerWidth /
   2 +
   worldMapPanX +
   xMeters *
   scale,

  y:
   window.innerHeight /
   2 +
   worldMapPanY +
   zMeters *
   scale,

  scale
 };
}

// --------------------------------------------------
// DRAW WALL
// --------------------------------------------------
function drawMapWall(
 wall,
 color
) {
 if (!wall) {
  return;
 }

 const center =
  worldToMap(
   0,
   0
  );

 const radius =
  wall.radiusMeters *
  center.scale;

 worldMapContext.beginPath();

 worldMapContext.arc(
  center.x,
  center.y,
  radius,
  0,
  Math.PI *
  2
 );

 worldMapContext.strokeStyle =
  color;

 worldMapContext.lineWidth =
  4;

 worldMapContext.stroke();
}

// --------------------------------------------------
// DRAW TELEPORT POINT
// --------------------------------------------------
function drawMapPoint(
 point
) {
 const position =
  worldToMap(
   point.xMeters,
   point.zMeters
  );

 const pointRadius =
  worldMapZoom >= 2
  ? 6
  : 4;

 worldMapContext.beginPath();

 worldMapContext.arc(
  position.x,
  position.y,
  pointRadius,
  0,
  Math.PI *
  2
 );

 worldMapContext.fillStyle =
  "#ffcc66";

 worldMapContext.fill();

 // ------------------------------------------------
 // LABEL
 // ------------------------------------------------
 if (
  worldMapZoom <
  0.65
 ) {
  return;
 }

 worldMapContext.font =
  "13px Arial";

 worldMapContext.fillStyle =
  "white";

 worldMapContext.textAlign =
  "left";

 worldMapContext.textBaseline =
  "middle";

 worldMapContext.fillText(
  point.name,
  position.x +
  pointRadius +
  5,
  position.y
 );
}

// --------------------------------------------------
// DRAW PLAYER
// --------------------------------------------------
function drawMapPlayer() {
 const playerXMeters =
  camera.position.x *
  METERS_PER_UNIT;

 const playerZMeters =
  camera.position.z *
  METERS_PER_UNIT;

 const position =
  worldToMap(
   playerXMeters,
   playerZMeters
  );

 worldMapContext.save();

 worldMapContext.translate(
  position.x,
  position.y
 );

 /*
  * yaw=0 はゲームでは -Z方向。
  */
 worldMapContext.rotate(
  -yaw
 );

 worldMapContext.beginPath();

 worldMapContext.moveTo(
  0,
  -12
 );

 worldMapContext.lineTo(
  8,
  10
 );

 worldMapContext.lineTo(
  0,
  6
 );

 worldMapContext.lineTo(
  -8,
  10
 );

 worldMapContext.closePath();

 worldMapContext.fillStyle =
  "#29b6f6";

 worldMapContext.fill();

 worldMapContext.strokeStyle =
  "white";

 worldMapContext.lineWidth =
  1.5;

 worldMapContext.stroke();

 worldMapContext.restore();
}

// --------------------------------------------------
// DRAW WORLD MAP
// --------------------------------------------------
function drawWorldMap() {
 if (
  !worldMapOpen
 ) {
  return;
 }

 const width =
  worldMapCanvas.width;

 const height =
  worldMapCanvas.height;

 // ------------------------------------------------
 // CLEAR
 // ------------------------------------------------
 worldMapContext.clearRect(
  0,
  0,
  width,
  height
 );

 // ------------------------------------------------
 // BACKGROUND
 // ------------------------------------------------
 worldMapContext.fillStyle =
  "#18271d";

 worldMapContext.fillRect(
  0,
  0,
  width,
  height
 );

 // ------------------------------------------------
 // WALL MARIA
 // ------------------------------------------------
 drawMapWall(
  WORLD_MAP.walls.maria,
  "#eee5cf"
 );

 // ------------------------------------------------
 // WALL ROSE
 // ------------------------------------------------
 drawMapWall(
  WORLD_MAP.walls.rose,
  "#d4ccb6"
 );

 // ------------------------------------------------
 // WALL SINA
 // ------------------------------------------------
 drawMapWall(
  WORLD_MAP.walls.sina,
  "#b9b19b"
 );

 // ------------------------------------------------
 // TELEPORT POINTS
 // ------------------------------------------------
 for (
  const point
  of TELEPORT_POINTS
 ) {
  drawMapPoint(
   point
  );
 }

 // ------------------------------------------------
 // PLAYER
 // ------------------------------------------------
 drawMapPlayer();

 // ------------------------------------------------
 // ZOOM HUD
 // ------------------------------------------------
 worldMapZoomHUD.textContent =
  `ZOOM ${worldMapZoom.toFixed(
   2
  )}x`;
}

// --------------------------------------------------
// RESIZE MAP CANVAS
// --------------------------------------------------
function resizeWorldMapCanvas() {
 worldMapCanvas.width =
  window.innerWidth;

 worldMapCanvas.height =
  window.innerHeight;

 drawWorldMap();
}

// --------------------------------------------------
// OPEN WORLD MAP
// --------------------------------------------------
function openWorldMap() {
 if (
  worldMapOpen
 ) {
  return;
 }

 if (
  teleportMenuOpen
 ) {
  closeTeleportMenu();
 }

 worldMapOpen =
  true;

 if (
  document.pointerLockElement
 ) {
  document.exitPointerLock();
 }

 /*
  * WASD等が押しっぱなしに
  * ならないようにする。
  */
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

 worldMapHUD.style.display =
  "block";

 resizeWorldMapCanvas();

 drawWorldMap();
}

// --------------------------------------------------
// CLOSE WORLD MAP
// --------------------------------------------------
function closeWorldMap() {
 worldMapOpen =
  false;

 worldMapDragging =
  false;

 worldMapHUD.style.display =
  "none";

 worldMapHUD.style.cursor =
  "grab";
}

// --------------------------------------------------
// TOGGLE WORLD MAP
// --------------------------------------------------
function toggleWorldMap() {
 if (
  worldMapOpen
 ) {
  closeWorldMap();
 } else {
  openWorldMap();
 }
}

// --------------------------------------------------
// MAP ZOOM
// --------------------------------------------------
worldMapHUD.addEventListener(
 "wheel",
 event => {
  if (
   !worldMapOpen
  ) {
   return;
  }

  event.preventDefault();

  // -----------------------------------------------
  // MOUSE POSITION
  // -----------------------------------------------
  const mouseX =
   event.clientX;

  const mouseY =
   event.clientY;

  const centerX =
   window.innerWidth /
   2 +
   worldMapPanX;

  const centerY =
   window.innerHeight /
   2 +
   worldMapPanY;

  const oldZoom =
   worldMapZoom;

  // -----------------------------------------------
  // ZOOM
  // -----------------------------------------------
  if (
   event.deltaY < 0
  ) {
   worldMapZoom *=
    1.2;
  } else {
   worldMapZoom /=
    1.2;
  }

  worldMapZoom =
   THREE.MathUtils.clamp(
    worldMapZoom,
    0.3,
    30
   );

  // -----------------------------------------------
  // ZOOM TOWARD CURSOR
  // -----------------------------------------------
  const ratio =
   worldMapZoom /
   oldZoom;

  worldMapPanX +=
   (
    mouseX -
    centerX
   ) *
   (
    1 -
    ratio
   );

  worldMapPanY +=
   (
    mouseY -
    centerY
   ) *
   (
    1 -
    ratio
   );

  drawWorldMap();
 },
 {
  passive: false
 }
);

// --------------------------------------------------
// MAP DRAG START
// --------------------------------------------------
worldMapHUD.addEventListener(
 "mousedown",
 event => {
  if (
   event.button !==
   0
  ) {
   return;
  }

  worldMapDragging =
   true;

  worldMapLastMouseX =
   event.clientX;

  worldMapLastMouseY =
   event.clientY;

  worldMapHUD.style.cursor =
   "grabbing";
 }
);

// --------------------------------------------------
// MAP DRAG MOVE
// --------------------------------------------------
window.addEventListener(
 "mousemove",
 event => {
  if (
   !worldMapDragging
  ) {
   return;
  }

  worldMapPanX +=
   event.clientX -
   worldMapLastMouseX;

  worldMapPanY +=
   event.clientY -
   worldMapLastMouseY;

  worldMapLastMouseX =
   event.clientX;

  worldMapLastMouseY =
   event.clientY;

  drawWorldMap();
 }
);

// --------------------------------------------------
// MAP DRAG END
// --------------------------------------------------
window.addEventListener(
 "mouseup",
 () => {
  if (
   !worldMapDragging
  ) {
   return;
  }

  worldMapDragging =
   false;

  worldMapHUD.style.cursor =
   "grab";
 }
);

// ==================================================
// KEYBOARD
// ==================================================
window.addEventListener(
 "keydown",
 event => {

 // --------------------------------------------------
 // M = WORLD MAP
 // --------------------------------------------------
 if (
  event.code ===
  "KeyM" &&
  !event.repeat
 ) {
  event.preventDefault();

  toggleWorldMap();

  return;
 }

 // --------------------------------------------------
 // WORLD MAP OPEN
 // --------------------------------------------------
 if (
  worldMapOpen
 ) {
  if (
   event.code ===
   "Escape"
  ) {
   event.preventDefault();

   closeWorldMap();
  }

  return;
 }

 // --------------------------------------------------
 // T = TELEPORT
 // --------------------------------------------------
 if (
  event.code ===
  "KeyT" &&
  !event.repeat
 ) {
  event.preventDefault();

  toggleTeleportMenu();

  return;
 }

 // --------------------------------------------------
 // TELEPORT MENU OPEN
 // --------------------------------------------------
 if (
  teleportMenuOpen
 ) {
  if (
   event.code ===
   "Escape"
  ) {
   event.preventDefault();

   closeTeleportMenu();
  }

  return;
 }

 // --------------------------------------------------
 // ESCAPE
 // --------------------------------------------------
 if (
  event.code ===
  "Escape"
 ) {
  return;
 }

 // --------------------------------------------------
 // SPACE
 // --------------------------------------------------
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

 // --------------------------------------------------
 // Q = LEFT MANUAL
 // --------------------------------------------------
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

 // --------------------------------------------------
 // R = RIGHT MANUAL
 // --------------------------------------------------
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

 // --------------------------------------------------
 // KEY STATE
 // --------------------------------------------------
 keys[event.code] =
  true;
 }
);

// --------------------------------------------------
// KEY UP
// --------------------------------------------------
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
   document.pointerLockElement ===
   renderer.domElement
  ) {
   return;
  }

  // --------------------------------------------------
  // CLEAR INPUT
  // --------------------------------------------------
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
);

// ==================================================
// MOUSE
// ==================================================
renderer.domElement.addEventListener(
 "mousedown",
 event => {

 // --------------------------------------------------
 // UI OPEN
 // --------------------------------------------------
 if (
  worldMapOpen ||
  teleportMenuOpen
 ) {
  return;
 }

 // --------------------------------------------------
 // POINTER LOCK
 // --------------------------------------------------
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

 // --------------------------------------------------
 // DISABLED
 // --------------------------------------------------
 if (
  dead ||
  wallStunTimer > 0
 ) {
  return;
 }

 // --------------------------------------------------
 // LEFT CLICK = BLADE
 // --------------------------------------------------
 if (
  event.button ===
  0
 ) {
  bladeAttack();
 }

 // --------------------------------------------------
 // RIGHT CLICK = AUTO DUAL
 // --------------------------------------------------
 if (
  event.button ===
  2
 ) {
  fireAutoDualAnchors();
 }
 }
);

// --------------------------------------------------
// CONTEXT MENU
// --------------------------------------------------
renderer.domElement.addEventListener(
 "contextmenu",
 event => {
  event.preventDefault();
 }
);

// --------------------------------------------------
// CAMERA LOOK
// --------------------------------------------------
document.addEventListener(
 "mousemove",
 event => {
  if (
   worldMapOpen ||
   teleportMenuOpen
  ) {
   return;
  }

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
 // --------------------------------------------------
 // SPEED
 // --------------------------------------------------
 const speedMps =
 velocity.length() *
 METERS_PER_UNIT;

 const speedKmh =
 speedMps *
 3.6;

 const verticalMps =
 velocity.y *
 METERS_PER_UNIT;

 // --------------------------------------------------
 // CURRENT CHUNK
 // --------------------------------------------------
 const currentChunkX =
 getChunkCoordinate(
 camera.position.x
 );

 const currentChunkZ =
 getChunkCoordinate(
 camera.position.z
 );

 // --------------------------------------------------
 // DEBUG HUD
 // --------------------------------------------------
 debugHUD.textContent =
 `Speed: ${speedMps.toFixed(1)} m/s\n` +
 ` ${speedKmh.toFixed(0)} km/h\n` +
 `Chunk: ${currentChunkX}, ${currentChunkZ}\n` +
 `Vertical: ${verticalMps.toFixed(1)} m/s\n` +
 `Titan: ${
 titanAlive
 ? "ALIVE"
 : "DOWN"
 }`;

 // --------------------------------------------------
 // ANCHOR HUD
 // --------------------------------------------------
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

 // --------------------------------------------------
 // STUN HUD
 // --------------------------------------------------
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

 // --------------------------------------------------
 // HP
 // --------------------------------------------------
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

 // --------------------------------------------------
 // GAS
 // --------------------------------------------------
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

 // --------------------------------------------------
 // PLAYER
 // --------------------------------------------------
 updatePlayer(
  delta
 );

 // --------------------------------------------------
 // WORLD
 // --------------------------------------------------
 updateWorldStreaming(
  delta
 );

 updateAreaSystem();

 // --------------------------------------------------
 // TITAN
 // --------------------------------------------------
 updateTitanParts(
  delta
 );

 // --------------------------------------------------
 // EQUIPMENT
 // --------------------------------------------------
 updateBladeAnimation(
  delta
 );

 updateWireVisual(
  leftAnchor
 );

 updateWireVisual(
  rightAnchor
 );

 // --------------------------------------------------
 // HUD
 // --------------------------------------------------
 updateHUD();

 // --------------------------------------------------
 // RENDER
 // --------------------------------------------------
 renderer.render(
  scene,
  camera
 );
}

animate();
