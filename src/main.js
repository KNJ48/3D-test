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

import {
 getTerrainHeightMeters,
 getTerrainSeed,
 setTerrainSeed
} from "./terrainGenerator.js";

import {
 generateWorldChunkContent
} from "./worldGenerator.js";

import {
 initializeWorldDatabase,
 getWorldDatabase,
 getWorldDatabaseChunk,
 exportWorldDatabase
} from "./worldDatabase.js";

import {
 loadFixedWorld,
 getFixedWorld,
 getFixedWorldChunk,
 getFixedWorldObjectsInChunkRange,
 getFixedWorldChunkSizeMeters
} from "./fixedWorld.js";

import {
 generateDeterministicForestChunk
} from "./deterministicForest.js";

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
// IMPACT MATERIALS
// ==================================================
/*
 * 衝突ダメージ用の材質。
 *
 * hardness:
 * 硬さ。
 *
 * safeKmh:
 * この速度以下なら
 * 衝突ダメージなし。
 *
 * lethalKmh:
 * この速度以上なら
 * 衝突だけで致死判定。
 *
 * damageMultiplier:
 * ダメージ曲線の倍率。
 */
const IMPACT_MATERIALS = {

 // --------------------------------------------------
 // STONE
 // --------------------------------------------------
 stone: {
  hardness: 1.0,
  safeKmh: 30,
  lethalKmh: 150,
  damageMultiplier: 1.0
 },

 // --------------------------------------------------
 // BUILDING
 // --------------------------------------------------
 building: {
  hardness: 0.75,
  safeKmh: 40,
  lethalKmh: 185,
  damageMultiplier: 0.8
 },

 // --------------------------------------------------
 // WOOD
 // --------------------------------------------------
 wood: {
  hardness: 0.5,
  safeKmh: 55,
  lethalKmh: 220,
  damageMultiplier: 0.55
 },

 // --------------------------------------------------
 // GROUND
 // --------------------------------------------------
 ground: {
  hardness: 0.3,
  safeKmh: 65,
  lethalKmh: 260,
  damageMultiplier: 0.4
 },

 // --------------------------------------------------
 // TITAN FLESH
 // --------------------------------------------------
 titanFlesh: {
  hardness: 0.12,
  safeKmh: 90,
  lethalKmh: 350,
  damageMultiplier: 0.18
 },

 // --------------------------------------------------
 // SOFT
 // --------------------------------------------------
 soft: {
  hardness: 0.08,
  safeKmh: 110,
  lethalKmh: 400,
  damageMultiplier: 0.1
 }
};

// ==================================================
// IMPACT DAMAGE
// ==================================================

// --------------------------------------------------
// CALCULATE DAMAGE
// --------------------------------------------------
function impactDamage(
 speed,
 materialName = "stone"
) {
 // ------------------------------------------------
 // MATERIAL
 // ------------------------------------------------
 const material =
  IMPACT_MATERIALS[
   materialName
  ] ||
  IMPACT_MATERIALS.stone;

 // ------------------------------------------------
 // SPEED
 // ------------------------------------------------
 const kmh =
  speedToKmh(
   speed
  );

 // ------------------------------------------------
 // SAFE SPEED
 // ------------------------------------------------
 if (
  kmh <=
  material.safeKmh
 ) {
  return 0;
 }

 // ------------------------------------------------
 // LETHAL SPEED
 // ------------------------------------------------
 if (
  kmh >=
  material.lethalKmh
 ) {
  return MAX_HEALTH;
 }

 // ------------------------------------------------
 // DAMAGE CURVE
 // ------------------------------------------------
 const t =
  (
   kmh -
   material.safeKmh
  ) /
  (
   material.lethalKmh -
   material.safeKmh
  );

 /*
  * 速度が致死速度へ近づくほど
  * 急激にダメージが増える。
  */
 const damage =
  t *
  t *
  MAX_HEALTH *
  material.damageMultiplier *
  material.hardness;

 // ------------------------------------------------
 // MINIMUM DAMAGE
 // ------------------------------------------------
 if (
  damage <
  MIN_DAMAGE_THRESHOLD
 ) {
  return 0;
 }

 return damage;
}

// --------------------------------------------------
// APPLY IMPACT DAMAGE
// --------------------------------------------------
function damageFromImpact(
 speed,
 materialName = "stone"
) {
 if (dead) {
  return;
 }

 const damage =
  impactDamage(
   speed,
   materialName
  );

 if (
  damage <= 0
 ) {
  return;
 }

 health -=
  damage;

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

// --------------------------------------------------
// BASE PULL
// --------------------------------------------------
/*
 * 基本の牽引開始初速。
 */
const WIRE_INITIAL_IMPULSE =
 11;

/*
 * 基本の継続加速度。
 */
const WIRE_SUSTAIN_ACCEL =
 16;

// --------------------------------------------------
// DISTANCE BOOST
// --------------------------------------------------
/*
 * この距離以下では
 * 距離ボーナスなし。
 */
const WIRE_BOOST_MIN_DISTANCE_METERS =
 20;

/*
 * この距離で
 * 最大ボーナスへ到達。
 */
const WIRE_BOOST_MAX_DISTANCE_METERS =
 350;

/*
 * 遠距離アンカー時の
 * 初速最大倍率。
 */
const WIRE_INITIAL_MAX_MULTIPLIER =
 2.0;

/*
 * 遠距離アンカー時の
 * 継続加速度最大倍率。
 */
const WIRE_ACCEL_MAX_MULTIPLIER =
 1.8;

// --------------------------------------------------
// ANCHOR PROJECTILE
// --------------------------------------------------
const ANCHOR_SHOT_SPEED =
 150;

// --------------------------------------------------
// WIRE VISUAL
// --------------------------------------------------
const WIRE_VISUAL_RADIUS =
 0.01;

const WIRE_VISUAL_SEGMENTS =
 6;

const WIRE_VISUAL_COLOR =
 0x101214;

const WIRE_VISUAL_OPACITY =
 1.0;

// --------------------------------------------------
// WIRE START
// --------------------------------------------------
const WIRE_START_SIDE =
 0.28;

const WIRE_START_DOWN =
 -0.22;

const WIRE_START_FORWARD =
 -0.45;

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
// BLADE SETTINGS
// ==================================================

// --------------------------------------------------
// ATTACK
// --------------------------------------------------
const ATTACK_RANGE =
 3.5;

/*
 * 1回の攻撃全体が長くなったので
 * モーション終了まで再攻撃不可。
 */
const ATTACK_COOLDOWN =
 1.4;

// --------------------------------------------------
// TIMING
// --------------------------------------------------
/*
 * 0.5秒かけて
 * 反対側へ振りかぶる。
 */
const BLADE_WINDUP_TIME =
 0.5;

/*
 * 0.7秒かけて
 * 反対側まで振り抜く。
 */
const BLADE_SWING_TIME =
 0.7;

/*
 * 最後に構えへ戻る。
 */
const BLADE_RECOVERY_TIME =
 0.2;

const BLADE_ATTACK_DURATION =
 BLADE_WINDUP_TIME +
 BLADE_SWING_TIME +
 BLADE_RECOVERY_TIME;

/*
 * 振りの中央付近で
 * 攻撃判定。
 *
 * 0.5 + 0.35 = 0.85秒。
 */
const BLADE_HIT_TIME =
 BLADE_WINDUP_TIME +
 BLADE_SWING_TIME *
 0.5;

// --------------------------------------------------
// ATTACK MOTIONS
// --------------------------------------------------
const BLADE_ATTACK_MOTION_COUNT =
 3;

// --------------------------------------------------
// VIEWMODEL
// --------------------------------------------------
const BLADE_SWAY_REFERENCE_KMH =
 300;

const BLADE_MAX_VIBRATION =
 0.006;

const BLADE_MAX_WIND_PUSH =
 0.035;

// --------------------------------------------------
// ANCHOR RECOIL
// --------------------------------------------------
const BLADE_ANCHOR_RECOIL_DISTANCE =
 0.13;

const BLADE_ANCHOR_RECOIL_ANGLE =
 0.16;

const BLADE_ANCHOR_RECOIL_DURATION =
 0.20;

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

// --------------------------------------------------
// GROUND
// --------------------------------------------------
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
 10000,
 10000
);

// --------------------------------------------------
// WALL
// --------------------------------------------------
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

// --------------------------------------------------
// HOUSE WALL
// --------------------------------------------------
const houseWallTexture =
 textureLoader.load(
 "/textures/house/wall.jpg"
 );

houseWallTexture.colorSpace =
 THREE.SRGBColorSpace;

houseWallTexture.wrapS =
 THREE.ClampToEdgeWrapping;

houseWallTexture.wrapT =
 THREE.ClampToEdgeWrapping;

// --------------------------------------------------
// HOUSE ROOF
// --------------------------------------------------
const houseRoofTexture =
 textureLoader.load(
 "/textures/house/roof.jpg"
 );

houseRoofTexture.colorSpace =
 THREE.SRGBColorSpace;

houseRoofTexture.wrapS =
 THREE.RepeatWrapping;

houseRoofTexture.wrapT =
 THREE.RepeatWrapping;

// --------------------------------------------------
// HOUSE WINDOW
// --------------------------------------------------
const houseWindowTexture =
 textureLoader.load(
 "/textures/house/window.jpg"
 );

houseWindowTexture.colorSpace =
 THREE.SRGBColorSpace;

houseWindowTexture.wrapS =
 THREE.ClampToEdgeWrapping;

houseWindowTexture.wrapT =
 THREE.ClampToEdgeWrapping;

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

sun.castShadow =
 true;

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
/*
 * 巨大Planeは使用しない。
 *
 * 実際の地面は
 * WORLD STREAMINGによって
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
const CHUNK_SIZE_METERS =
 500;

const CHUNK_SIZE =
 CHUNK_SIZE_METERS /
 METERS_PER_UNIT;

// --------------------------------------------------
// TERRAIN QUALITY
// --------------------------------------------------
/*
 * 500mチャンクを
 * 32 × 32 に分割。
 */
const TERRAIN_SEGMENTS =
 32;

// --------------------------------------------------
// RENDER DISTANCE
// --------------------------------------------------
let renderDistanceKm =
 3;

// --------------------------------------------------
// PREFETCH
// --------------------------------------------------
const CHUNK_PREFETCH_EXTRA_KM =
 1;

// --------------------------------------------------
// UNLOAD
// --------------------------------------------------
const CHUNK_UNLOAD_EXTRA_KM =
 1.5;

// --------------------------------------------------
// LOOK AHEAD
// --------------------------------------------------
const CHUNK_LOOK_AHEAD_SECONDS =
 8;

// --------------------------------------------------
// STREAMING BUDGET
// --------------------------------------------------
const STREAMING_BUDGET_MS =
 2;

// --------------------------------------------------
// LOADED CHUNKS
// --------------------------------------------------
/*
 * key:
 *
 * "chunkX,chunkZ"
 *
 * value:
 *
 * {
 *   chunkX,
 *   chunkZ,
 *   mesh,
 *   worldContent,
 *   terrainSeed
 * }
 */
const loadedChunks =
 new Map();

// --------------------------------------------------
// QUEUED CHUNKS
// --------------------------------------------------
const queuedChunks =
 new Set();

// --------------------------------------------------
// GENERATION QUEUE
// --------------------------------------------------
const chunkGenerationQueue =
 [];

// --------------------------------------------------
// HELPERS
// --------------------------------------------------
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

// --------------------------------------------------
// TERRAIN HEIGHT IN UNITS
// --------------------------------------------------
function getTerrainHeightUnits(
 worldXUnits,
 worldZUnits
) {
 const worldXMeters =
  worldXUnits *
  METERS_PER_UNIT;

 const worldZMeters =
  worldZUnits *
  METERS_PER_UNIT;

 return (
  getTerrainHeightMeters(
   worldXMeters,
   worldZMeters
  ) /
  METERS_PER_UNIT
 );
}

// --------------------------------------------------
// CREATE CHUNK
// --------------------------------------------------
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

 // ------------------------------------------------
 // CHUNK CENTER
 // ------------------------------------------------
 const chunkCenterX =
  (
   chunkX +
   0.5
  ) *
  CHUNK_SIZE;

 const chunkCenterZ =
  (
   chunkZ +
   0.5
  ) *
  CHUNK_SIZE;

 // ------------------------------------------------
 // TERRAIN GEOMETRY
 // ------------------------------------------------
 const geometry =
  new THREE.PlaneGeometry(
   CHUNK_SIZE,
   CHUNK_SIZE,

   TERRAIN_SEGMENTS,
   TERRAIN_SEGMENTS
  );

 const positions =
  geometry.attributes
  .position;

 // ------------------------------------------------
 // TERRAIN VERTICES
 // ------------------------------------------------
 for (
  let i = 0;
  i <
  positions.count;
  i++
 ) {
  const localX =
   positions.getX(
    i
   );

  const localPlaneY =
   positions.getY(
    i
   );

  const worldX =
   chunkCenterX +
   localX;

  /*
   * Planeを-X方向へ90°回すので、
   * local +Y は world -Z。
   */
  const worldZ =
   chunkCenterZ -
   localPlaneY;

  const height =
   getTerrainHeightUnits(
    worldX,
    worldZ
   );

  positions.setZ(
   i,
   height
  );
 }

 positions.needsUpdate =
  true;

 geometry.computeVertexNormals();
 geometry.computeBoundingBox();
 geometry.computeBoundingSphere();

 // ------------------------------------------------
 // TERRAIN MATERIAL
 // ------------------------------------------------
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

 // ------------------------------------------------
 // TERRAIN MESH
 // ------------------------------------------------
 const mesh =
  new THREE.Mesh(
   geometry,
   material
  );

 mesh.rotation.x =
  -Math.PI /
  2;

 mesh.position.set(
  chunkCenterX,
  0,
  chunkCenterZ
 );

 mesh.receiveShadow =
  true;

 mesh.frustumCulled =
  true;

 mesh.userData.chunkX =
  chunkX;

 mesh.userData.chunkZ =
  chunkZ;

 mesh.userData.chunkKey =
  key;

 mesh.userData.terrainSeed =
  getTerrainSeed();

 scene.add(
  mesh
 );

 // ------------------------------------------------
 // WORLD CONTENT
 // ------------------------------------------------
 /*
  * このチャンクに存在する、
  *
  * ・家
  * ・村
  * ・森林
  * ・巨大樹
  *
  * などを同時に生成する。
  */
 const worldContent =
  createChunkWorldContent(
   chunkX,
   chunkZ
  );

 // ------------------------------------------------
 // REGISTER
 // ------------------------------------------------
 loadedChunks.set(
  key,
  {
   chunkX,
   chunkZ,

   mesh,

   worldContent,

   terrainSeed:
    getTerrainSeed()
  }
 );
}

// --------------------------------------------------
// DESTROY CHUNK
// --------------------------------------------------
function destroyGroundChunk(
 key,
 chunk
) {
 if (!chunk) {
  loadedChunks.delete(
   key
  );

  return;
 }

 // ------------------------------------------------
 // WORLD CONTENT
 // ------------------------------------------------
 if (
  chunk.worldContent
 ) {
  destroyChunkWorldContent(
   chunk.worldContent
  );
 }

 // ------------------------------------------------
 // TERRAIN
 // ------------------------------------------------
 if (
  chunk.mesh
 ) {
  scene.remove(
   chunk.mesh
  );

  if (
   chunk.mesh.geometry
  ) {
   chunk.mesh.geometry
   .dispose();
  }

  const material =
   chunk.mesh.material;

  if (material) {
   if (
    material.map &&
    material.map !==
    groundTexture
   ) {
    material.map.dispose();
   }

   material.dispose();
  }
 }

 // ------------------------------------------------
 // DELETE
 // ------------------------------------------------
 loadedChunks.delete(
  key
 );
}

// --------------------------------------------------
// QUEUE CHUNK
// --------------------------------------------------
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

// --------------------------------------------------
// TEMP VECTORS
// --------------------------------------------------
const chunkTempCenter =
 new THREE.Vector3();

const chunkFuturePosition =
 new THREE.Vector3();

// --------------------------------------------------
// REQUEST SURROUNDINGS
// --------------------------------------------------
function requestWorldChunks() {
 const playerX =
  camera.position.x;

 const playerZ =
  camera.position.z;

 // ------------------------------------------------
 // FUTURE POSITION
 // ------------------------------------------------
 chunkFuturePosition.set(
  camera.position.x +
  velocity.x *
  CHUNK_LOOK_AHEAD_SECONDS,

  0,

  camera.position.z +
  velocity.z *
  CHUNK_LOOK_AHEAD_SECONDS
 );

 // ------------------------------------------------
 // CURRENT / FUTURE CHUNK
 // ------------------------------------------------
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

 // ------------------------------------------------
 // DISTANCE
 // ------------------------------------------------
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

 // ------------------------------------------------
 // SEARCH RANGE
 // ------------------------------------------------
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

 // ------------------------------------------------
 // REQUEST
 // ------------------------------------------------
 for (
  let x =
   minChunkX;

  x <=
  maxChunkX;

  x++
 ) {
  for (
   let z =
    minChunkZ;

   z <=
    maxChunkZ;

   z++
  ) {
   getChunkCenter(
    x,
    z,
    chunkTempCenter
   );

   const currentDistance =
    Math.hypot(
     chunkTempCenter.x -
     playerX,

     chunkTempCenter.z -
     playerZ
    );

   const futureDistance =
    Math.hypot(
     chunkTempCenter.x -
     chunkFuturePosition.x,

     chunkTempCenter.z -
     chunkFuturePosition.z
    );

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

 // ------------------------------------------------
 // PRIORITY
 // ------------------------------------------------
 chunkGenerationQueue.sort(
  (a, b) =>
   a.priority -
   b.priority
 );
}

// --------------------------------------------------
// PROCESS QUEUE
// --------------------------------------------------
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

  if (
   !loadedChunks.has(
    job.key
   )
  ) {
   createGroundChunk(
    job.chunkX,
    job.chunkZ
   );
  }

  // ------------------------------------------------
  // TIME BUDGET
  // ------------------------------------------------
  if (
   performance.now() -
   startTime >=
   STREAMING_BUDGET_MS
  ) {
   break;
  }
 }
}

// --------------------------------------------------
// UNLOAD FAR CHUNKS
// --------------------------------------------------
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
  of Array.from(
   loadedChunks
  )
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

// --------------------------------------------------
// CLEAR ALL CHUNKS
// --------------------------------------------------
function clearAllGroundChunks() {
 for (
  const [
   key,
   chunk
  ]
  of Array.from(
   loadedChunks
  )
 ) {
  destroyGroundChunk(
   key,
   chunk
  );
 }

 chunkGenerationQueue.length =
  0;

 queuedChunks.clear();
}

// --------------------------------------------------
// REBUILD CHUNKS
// --------------------------------------------------
/*
 * WORLD SEED変更時にも
 * 家・木・地形を全部
 * 同時に再生成する。
 */
function rebuildGroundChunks() {
 clearAllGroundChunks();

 chunkRequestTimer =
  0;
}

// --------------------------------------------------
// FORCE LOAD TELEPORT DESTINATION
// --------------------------------------------------
/*
 * TP直後の中心チャンクだけは
 * Queueを待たず即座に作る。
 *
 * 「TPしたら数秒更地」
 * を防止する。
 */
function forceLoadCurrentChunk() {
 const chunkX =
  getChunkCoordinate(
   camera.position.x
  );

 const chunkZ =
  getChunkCoordinate(
   camera.position.z
  );

 const key =
  getChunkKey(
   chunkX,
   chunkZ
  );

 if (
  !loadedChunks.has(
   key
  )
 ) {
  /*
   * Queueに入っていた場合も
   * 二重生成防止のため解除。
   */
  queuedChunks.delete(
   key
  );

  for (
   let i =
    chunkGenerationQueue.length -
    1;

   i >= 0;

   i--
  ) {
   if (
    chunkGenerationQueue[
     i
    ].key ===
    key
   ) {
    chunkGenerationQueue.splice(
     i,
     1
    );
   }
  }

  createGroundChunk(
   chunkX,
   chunkZ
  );
 }
}

// --------------------------------------------------
// WORLD STREAMING UPDATE
// --------------------------------------------------
let chunkRequestTimer =
 0;

function updateWorldStreaming(
 delta
) {
 // ------------------------------------------------
 // REQUEST
 // ------------------------------------------------
 chunkRequestTimer -=
  delta;

 if (
  chunkRequestTimer <=
  0
 ) {
  chunkRequestTimer =
   0.25;

  requestWorldChunks();

  unloadFarChunks();
 }

 // ------------------------------------------------
 // GENERATE
 // ------------------------------------------------
 processChunkQueue();
}

// ==================================================
// AREA SYSTEM
// ==================================================
let currentAreaId =
 null;

let previousAreaChunkX =
 null;

let previousAreaChunkZ =
 null;

let areaSystemInitialized =
 false;

// --------------------------------------------------
// FIND AREA
// --------------------------------------------------
function findAreaAtPosition(
 position
) {
 /*
  * WORLD_MAPにareasがまだ無ければ
  * エリアなしとして扱う。
  */
 if (
  !WORLD_MAP.areas ||
  WORLD_MAP.areas.length ===
  0
 ) {
  return null;
 }

 // --------------------------------------------------
 // UNIT TO METERS
 // --------------------------------------------------
 const xMeters =
  position.x *
  METERS_PER_UNIT;

 const zMeters =
  position.z *
  METERS_PER_UNIT;

 // --------------------------------------------------
 // SEARCH
 // --------------------------------------------------
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
 // --------------------------------------------------
 // OUTSIDE NAMED AREA
 // --------------------------------------------------
 if (!area) {
  currentAreaId =
   null;

  return;
 }

 // --------------------------------------------------
 // SAME AREA
 // --------------------------------------------------
 if (
  currentAreaId ===
  area.id
 ) {
  return;
 }

 // --------------------------------------------------
 // NEW AREA
 // --------------------------------------------------
 currentAreaId =
  area.id;

 showMessage(
  area.name
 );
}

// --------------------------------------------------
// UPDATE AREA SYSTEM
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

 // --------------------------------------------------
 // SAME CHUNK
 // --------------------------------------------------
 /*
  * 地名判定を毎フレームする必要はない。
  *
  * 新しい500mチャンクへ
  * 入った場合だけ判定。
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

 // --------------------------------------------------
 // STORE CHUNK
 // --------------------------------------------------
 previousAreaChunkX =
  chunkX;

 previousAreaChunkZ =
  chunkZ;

 areaSystemInitialized =
  true;

 // --------------------------------------------------
 // FIND CURRENT AREA
 // --------------------------------------------------
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
const colliders =
 [];

const anchorTargets =
 [];

const titanAttackTargets =
 [];

// ==================================================
// COLLISION SPATIAL INDEX
// ==================================================
const COLLISION_BASE_RANGE_METERS =
 50;

const COLLISION_LOOK_AHEAD_SECONDS =
 0.5;

// --------------------------------------------------
// BOX COLLIDER INDEX
// --------------------------------------------------
const colliderChunkIndex =
 new Map();

// --------------------------------------------------
// ROOF COLLIDER INDEX
// --------------------------------------------------
/*
 * Box3では表現できない
 * 切妻屋根専用Collider。
 */
const roofColliderChunkIndex =
 new Map();

// --------------------------------------------------
// KEY
// --------------------------------------------------
function getColliderChunkKey(
 chunkX,
 chunkZ
) {
 return (
 `${chunkX},${chunkZ}`
 );
}

// --------------------------------------------------
// REGISTER BOX COLLIDER
// --------------------------------------------------
function registerCollider(
 box
) {
 if (
 !box
 ) {
 return;
 }

 colliders.push(
 box
 );

 const center =
 new THREE.Vector3();

 box.getCenter(
 center
 );

 const chunkX =
 getChunkCoordinate(
 center.x
 );

 const chunkZ =
 getChunkCoordinate(
 center.z
 );

 const key =
 getColliderChunkKey(
 chunkX,
 chunkZ
 );

 let set =
 colliderChunkIndex.get(
 key
 );

 if (
 !set
 ) {
 set =
 new Set();

 colliderChunkIndex.set(
 key,
 set
 );
 }

 set.add(
 box
 );

 box.userDataChunkX =
 chunkX;

 box.userDataChunkZ =
 chunkZ;
}

// --------------------------------------------------
// UNREGISTER BOX COLLIDER
// --------------------------------------------------
function unregisterCollider(
 box
) {
 if (
 !box
 ) {
 return;
 }

 removeArrayItem(
 colliders,
 box
 );

 const chunkX =
 box.userDataChunkX;

 const chunkZ =
 box.userDataChunkZ;

 if (
 !Number.isFinite(
 chunkX
 ) ||
 !Number.isFinite(
 chunkZ
 )
 ) {
 return;
 }

 const key =
 getColliderChunkKey(
 chunkX,
 chunkZ
 );

 const set =
 colliderChunkIndex.get(
 key
 );

 if (
 !set
 ) {
 return;
 }

 set.delete(
 box
 );

 if (
 set.size ===
 0
 ) {
 colliderChunkIndex.delete(
 key
 );
 }
}

// --------------------------------------------------
// REGISTER ROOF COLLIDER
// --------------------------------------------------
function registerRoofCollider(
 roof
) {
 if (
 !roof
 ) {
 return;
 }

 const chunkX =
 getChunkCoordinate(
 roof.x
 );

 const chunkZ =
 getChunkCoordinate(
 roof.z
 );

 const key =
 getColliderChunkKey(
 chunkX,
 chunkZ
 );

 let set =
 roofColliderChunkIndex.get(
 key
 );

 if (
 !set
 ) {
 set =
 new Set();

 roofColliderChunkIndex.set(
 key,
 set
 );
 }

 roof.chunkX =
 chunkX;

 roof.chunkZ =
 chunkZ;

 set.add(
 roof
 );
}

// --------------------------------------------------
// UNREGISTER ROOF COLLIDER
// --------------------------------------------------
function unregisterRoofCollider(
 roof
) {
 if (
 !roof
 ) {
 return;
 }

 const key =
 getColliderChunkKey(
 roof.chunkX,
 roof.chunkZ
 );

 const set =
 roofColliderChunkIndex.get(
 key
 );

 if (
 !set
 ) {
 return;
 }

 set.delete(
 roof
 );

 if (
 set.size ===
 0
 ) {
 roofColliderChunkIndex.delete(
 key
 );
 }
}

// --------------------------------------------------
// COLLISION RANGE
// --------------------------------------------------
function getCollisionRangeUnits() {
 const speedMetersPerSecond =
 velocity.length() *
 METERS_PER_UNIT;

 const rangeMeters =
 COLLISION_BASE_RANGE_METERS +
 speedMetersPerSecond *
 COLLISION_LOOK_AHEAD_SECONDS;

 return (
 rangeMeters /
 METERS_PER_UNIT
 );
}

// --------------------------------------------------
// NEARBY BOX COLLIDERS
// --------------------------------------------------
function getNearbyColliders(
 position
) {
 const output =
 [];

 const range =
 getCollisionRangeUnits();

 const minChunkX =
 getChunkCoordinate(
 position.x -
 range
 );

 const maxChunkX =
 getChunkCoordinate(
 position.x +
 range
 );

 const minChunkZ =
 getChunkCoordinate(
 position.z -
 range
 );

 const maxChunkZ =
 getChunkCoordinate(
 position.z +
 range
 );

 const rangeSquared =
 range *
 range;

 for (
 let chunkX =
 minChunkX;
 chunkX <=
 maxChunkX;
 chunkX++
 ) {
 for (
 let chunkZ =
 minChunkZ;
 chunkZ <=
 maxChunkZ;
 chunkZ++
 ) {
 const key =
 getColliderChunkKey(
 chunkX,
 chunkZ
 );

 const set =
 colliderChunkIndex.get(
 key
 );

 if (
 !set
 ) {
 continue;
 }

 for (
 const box
 of set
 ) {
 const nearestX =
 THREE.MathUtils.clamp(
 position.x,
 box.min.x,
 box.max.x
 );

 const nearestZ =
 THREE.MathUtils.clamp(
 position.z,
 box.min.z,
 box.max.z
 );

 const dx =
 position.x -
 nearestX;

 const dz =
 position.z -
 nearestZ;

 if (
 dx *
 dx +
 dz *
 dz <=
 rangeSquared
 ) {
 output.push(
 box
 );
 }
 }
 }
 }

 return output;
}

// --------------------------------------------------
// NEARBY ROOF COLLIDERS
// --------------------------------------------------
function getNearbyRoofColliders(
 position
) {
 const output =
 [];

 const range =
 getCollisionRangeUnits();

 const minChunkX =
 getChunkCoordinate(
 position.x -
 range
 );

 const maxChunkX =
 getChunkCoordinate(
 position.x +
 range
 );

 const minChunkZ =
 getChunkCoordinate(
 position.z -
 range
 );

 const maxChunkZ =
 getChunkCoordinate(
 position.z +
 range
 );

 const rangeSquared =
 range *
 range;

 for (
 let chunkX =
 minChunkX;
 chunkX <=
 maxChunkX;
 chunkX++
 ) {
 for (
 let chunkZ =
 minChunkZ;
 chunkZ <=
 maxChunkZ;
 chunkZ++
 ) {
 const key =
 getColliderChunkKey(
 chunkX,
 chunkZ
 );

 const set =
 roofColliderChunkIndex.get(
 key
 );

 if (
 !set
 ) {
 continue;
 }

 for (
 const roof
 of set
 ) {
 const dx =
 position.x -
 roof.x;

 const dz =
 position.z -
 roof.z;

 if (
 dx *
 dx +
 dz *
 dz <=
 rangeSquared
 ) {
 output.push(
 roof
 );
 }
 }
 }
 }

 return output;
}

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

/*
 * 巨大Cylinderは使用しない。
 *
 * paradis-world.jsonの半径を正として、
 * プレイヤー周辺だけ壁パネルを生成。
 */

// --------------------------------------------------
// SETTINGS
// --------------------------------------------------
const WALL_SEGMENT_LENGTH_METERS =
 120;

const WALL_STREAM_DISTANCE_METERS =
 4000;

/*
 * 壁は50m高。
 */
const DEFAULT_WALL_HEIGHT_METERS =
 50;

const DEFAULT_WALL_THICKNESS_METERS =
 12;

// --------------------------------------------------
// WALL RINGS
// --------------------------------------------------
const wallRings =
 [];

/*
 * 現在描画されている壁Mesh。
 */
const streamedWallSegments =
 new Map();

// --------------------------------------------------
// MATERIAL
// --------------------------------------------------
const streamedWallMaterial =
 outerWallMaterial.clone();

streamedWallMaterial.side =
 THREE.DoubleSide;

// --------------------------------------------------
// REGISTER WALL
// --------------------------------------------------
function registerWallRing(
 wall
) {
 if (
 !wall
 ) {
 return;
 }

 const radiusMeters =
 Number(
 wall.radiusMeters
 );

 if (
 !Number.isFinite(
 radiusMeters
 )
 ) {
 return;
 }

 const heightMeters =
 Number(
 wall.heightMeters
 ) ||
 DEFAULT_WALL_HEIGHT_METERS;

 const thicknessMeters =
 Number(
 wall.thicknessMeters
 ) ||
 DEFAULT_WALL_THICKNESS_METERS;

 const radius =
 metersToUnits(
 radiusMeters
 );

 const height =
 metersToUnits(
 heightMeters
 );

 const thickness =
 metersToUnits(
 thicknessMeters
 );

 wallRings.push({
 id:
 wall.id,

 name:
 wall.name,

 radiusMeters,

 radius,

 heightMeters,

 height,

 thicknessMeters,

 thickness,

 innerRadius:
 radius -
 thickness /
 2,

 outerRadius:
 radius +
 thickness /
 2
 });
}

// --------------------------------------------------
// CREATE CITY WALL
// --------------------------------------------------
function createCityWall() {
 wallRings.length =
 0;

 const world =
 getFixedWorld();

 const walls =
 world?.walls ??
 WORLD_MAP.walls;

 if (
 walls?.maria
 ) {
 registerWallRing(
 walls.maria
 );
 }

 if (
 walls?.rose
 ) {
 registerWallRing(
 walls.rose
 );
 }

 if (
 walls?.sina
 ) {
 registerWallRing(
 walls.sina
 );
 }
}

// --------------------------------------------------
// WALL SEGMENT KEY
// --------------------------------------------------
function getWallSegmentKey(
 ringId,
 segmentIndex
) {
 return (
 `${ringId}:${segmentIndex}`
 );
}

// --------------------------------------------------
// CREATE WALL SEGMENT
// --------------------------------------------------
function createWallSegment(
 ring,
 segmentIndex,
 segmentCount
) {
 const key =
 getWallSegmentKey(
 ring.id,
 segmentIndex
 );

 if (
 streamedWallSegments.has(
 key
 )
 ) {
 return;
 }

 const angleStep =
 Math.PI *
 2 /
 segmentCount;

 const angle =
 segmentIndex *
 angleStep;

 /*
 * 円弧の中心。
 */
 const xMeters =
 Math.sin(
 angle
 ) *
 ring.radiusMeters;

 const zMeters =
 -Math.cos(
 angle
 ) *
 ring.radiusMeters;

 const x =
 metersToUnits(
 xMeters
 );

 const z =
 metersToUnits(
 zMeters
 );

 /*
 * 地形高度へ合わせる。
 */
 const terrainY =
 metersToUnits(
 getTerrainHeightMeters(
 xMeters,
 zMeters
 )
 );

 /*
 * 円弧の実長。
 */
 const segmentLengthMeters =
 ring.radiusMeters *
 angleStep *
 1.015;

 const segmentLength =
 metersToUnits(
 segmentLengthMeters
 );

 const geometry =
 new THREE.BoxGeometry(
 segmentLength,
 ring.height,
 ring.thickness
 );

 const mesh =
 new THREE.Mesh(
 geometry,
 streamedWallMaterial
 );

 mesh.position.set(
 x,
 terrainY +
 ring.height /
 2,
 z
 );

 /*
 * 円周の接線方向へ向ける。
 */
 mesh.rotation.y =
 -angle;

 mesh.castShadow =
 true;

 mesh.receiveShadow =
 true;

 mesh.userData.wallId =
 ring.id;

 mesh.userData.wallSegment =
 segmentIndex;

 scene.add(
 mesh
 );

 anchorTargets.push(
 mesh
 );

 streamedWallSegments.set(
 key,
 {
 mesh,
 ring,
 segmentIndex
 }
 );
}

// --------------------------------------------------
// DESTROY WALL SEGMENT
// --------------------------------------------------
function destroyWallSegment(
 key,
 data
) {
 if (
 !data
 ) {
 return;
 }

 scene.remove(
 data.mesh
 );

 removeArrayItem(
 anchorTargets,
 data.mesh
 );

 if (
 data.mesh.geometry
 ) {
 data.mesh.geometry.dispose();
 }

 streamedWallSegments.delete(
 key
 );
}

// --------------------------------------------------
// UPDATE WALL STREAMING
// --------------------------------------------------
function updateWallStreaming() {
 const playerXMeters =
 camera.position.x *
 METERS_PER_UNIT;

 const playerZMeters =
 camera.position.z *
 METERS_PER_UNIT;

 const playerRadiusMeters =
 Math.hypot(
 playerXMeters,
 playerZMeters
 );

 const needed =
 new Set();

 for (
 const ring
 of wallRings
 ) {
 /*
 * 壁から4km以上離れているなら、
 * 3D壁を作る必要なし。
 */
 const radialDifference =
 Math.abs(
 playerRadiusMeters -
 ring.radiusMeters
 );

 if (
 radialDifference >
 WALL_STREAM_DISTANCE_METERS
 ) {
 continue;
 }

 const playerAngle =
 Math.atan2(
 playerXMeters,
 -playerZMeters
 );

 /*
 * 円周を約120mごとの
 * セグメントへ分割。
 */
 const circumference =
 Math.PI *
 2 *
 ring.radiusMeters;

 const segmentCount =
 Math.max(
 64,
 Math.ceil(
 circumference /
 WALL_SEGMENT_LENGTH_METERS
 )
 );

 const angleStep =
 Math.PI *
 2 /
 segmentCount;

 let centerIndex =
 Math.round(
 playerAngle /
 angleStep
 );

 centerIndex =
 (
 (
 centerIndex %
 segmentCount
 ) +
 segmentCount
 ) %
 segmentCount;

 const segmentRadius =
 Math.ceil(
 WALL_STREAM_DISTANCE_METERS /
 WALL_SEGMENT_LENGTH_METERS
 ) +
 2;

 for (
 let offset =
 -segmentRadius;
 offset <=
 segmentRadius;
 offset++
 ) {
 let index =
 centerIndex +
 offset;

 index =
 (
 (
 index %
 segmentCount
 ) +
 segmentCount
 ) %
 segmentCount;

 const key =
 getWallSegmentKey(
 ring.id,
 index
 );

 needed.add(
 key
 );

 createWallSegment(
 ring,
 index,
 segmentCount
 );
 }
 }

 // ------------------------------------------------
 // UNLOAD
 // ------------------------------------------------
 for (
 const [
 key,
 data
 ]
 of Array.from(
 streamedWallSegments
 )
 ) {
 if (
 needed.has(
 key
 )
 ) {
 continue;
 }

 destroyWallSegment(
 key,
 data
 );
 }
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
 * HOUSE TEMPLATE 01
 *
 * 3階建て木骨住宅
 *
 * ・InstancedMesh
 * ・切妻屋根
 * ・妻壁
 * ・窓
 * ・斜面屋根Collider
 */

// --------------------------------------------------
// TEMPLATE 01
// --------------------------------------------------
const HOUSE_TEMPLATE_01 = {
 widthMeters: 9,
 depthMeters: 11,

 floorCount: 3,
 floorHeightMeters: 3,

 roofHeightMeters: 4,
 roofOverhangMeters: 0.45,

 frontWindowsPerFloor: 3,
 sideWindowsPerFloor: 2,

 windowWidthMeters: 1.35,
 windowHeightMeters: 1.75,

 windowSurfaceOffsetMeters: 0.025
};

// --------------------------------------------------
// DIMENSIONS
// --------------------------------------------------
const HOUSE_01_WIDTH =
 metersToUnits(
 HOUSE_TEMPLATE_01.widthMeters
 );

const HOUSE_01_DEPTH =
 metersToUnits(
 HOUSE_TEMPLATE_01.depthMeters
 );

const HOUSE_01_FLOOR_HEIGHT =
 metersToUnits(
 HOUSE_TEMPLATE_01.floorHeightMeters
 );

const HOUSE_01_HEIGHT =
 HOUSE_01_FLOOR_HEIGHT *
 HOUSE_TEMPLATE_01.floorCount;

const HOUSE_01_ROOF_HEIGHT =
 metersToUnits(
 HOUSE_TEMPLATE_01.roofHeightMeters
 );

const HOUSE_01_OVERHANG =
 metersToUnits(
 HOUSE_TEMPLATE_01.roofOverhangMeters
 );

const HOUSE_01_HALF_WIDTH =
 HOUSE_01_WIDTH /
 2;

const HOUSE_01_HALF_DEPTH =
 HOUSE_01_DEPTH /
 2;

// --------------------------------------------------
// MATERIALS
// --------------------------------------------------
/*
 * 全住宅で共有する。
 *
 * 家ごと・窓ごとにMaterialを
 * 作らないことが重要。
 */
const houseInstanceWallMaterial =
 new THREE.MeshStandardMaterial({
 map: houseWallTexture,
 color: 0xffffff,
 roughness: 0.9,
 side: THREE.DoubleSide
 });

const houseInstanceRoofMaterial =
 new THREE.MeshStandardMaterial({
 map: houseRoofTexture,
 color: 0xffffff,
 roughness: 0.88,
 side: THREE.DoubleSide
 });

const houseInstanceWindowMaterial =
 new THREE.MeshStandardMaterial({
 map: houseWindowTexture,
 color: 0xffffff,
 roughness: 0.58,
 side: THREE.DoubleSide
 });

// --------------------------------------------------
// FLOOR GEOMETRY
// --------------------------------------------------
const houseInstanceFloorGeometry =
 new THREE.BoxGeometry(
 HOUSE_01_WIDTH,
 HOUSE_01_FLOOR_HEIGHT,
 HOUSE_01_DEPTH
 );

// --------------------------------------------------
// WINDOW GEOMETRY
// --------------------------------------------------
const houseInstanceWindowGeometry =
 new THREE.PlaneGeometry(
 metersToUnits(
 HOUSE_TEMPLATE_01.windowWidthMeters
 ),
 metersToUnits(
 HOUSE_TEMPLATE_01.windowHeightMeters
 )
 );

// --------------------------------------------------
// GABLE GEOMETRY
// --------------------------------------------------
function createHouse01GableGeometry() {
 const geometry =
 new THREE.BufferGeometry();

 /*
  * 正面から見た三角形。
  *
  *           C
  *          / \
  *         /   \
  *        A-----B
  */
 const positions =
 new Float32Array([
 -HOUSE_01_HALF_WIDTH,
 0,
 0,

 HOUSE_01_HALF_WIDTH,
 0,
 0,

 0,
 HOUSE_01_ROOF_HEIGHT,
 0
 ]);

 const uvs =
 new Float32Array([
 0,
 0,

 1,
 0,

 0.5,
 1
 ]);

 geometry.setAttribute(
 "position",
 new THREE.BufferAttribute(
 positions,
 3
 )
 );

 geometry.setAttribute(
 "uv",
 new THREE.BufferAttribute(
 uvs,
 2
 )
 );

 geometry.computeVertexNormals();

 return geometry;
}

const houseInstanceGableGeometry =
 createHouse01GableGeometry();

// --------------------------------------------------
// ROOF GEOMETRY
// --------------------------------------------------
/*
 * BoxGeometryを回転させない。
 *
 * 最初から正しい斜面の頂点を作る。
 *
 * これにより左右屋根が
 * クロスする問題をなくす。
 */
function createHouse01RoofGeometry(
 side
) {
 const geometry =
 new THREE.BufferGeometry();

 const outerX =
 side <
 0
 ? -HOUSE_01_HALF_WIDTH -
 HOUSE_01_OVERHANG
 : HOUSE_01_HALF_WIDTH +
 HOUSE_01_OVERHANG;

 const ridgeX =
 0;

 const outerY =
 0;

 const ridgeY =
 HOUSE_01_ROOF_HEIGHT;

 const frontZ =
 -HOUSE_01_HALF_DEPTH -
 HOUSE_01_OVERHANG;

 const backZ =
 HOUSE_01_HALF_DEPTH +
 HOUSE_01_OVERHANG;

 const positions =
 new Float32Array([
 // Triangle 1
 outerX,
 outerY,
 frontZ,

 outerX,
 outerY,
 backZ,

 ridgeX,
 ridgeY,
 backZ,

 // Triangle 2
 outerX,
 outerY,
 frontZ,

 ridgeX,
 ridgeY,
 backZ,

 ridgeX,
 ridgeY,
 frontZ
 ]);

 const uvs =
 new Float32Array([
 0,
 0,

 1,
 0,

 1,
 1,

 0,
 0,

 1,
 1,

 0,
 1
 ]);

 geometry.setAttribute(
 "position",
 new THREE.BufferAttribute(
 positions,
 3
 )
 );

 geometry.setAttribute(
 "uv",
 new THREE.BufferAttribute(
 uvs,
 2
 )
 );

 geometry.computeVertexNormals();

 return geometry;
}

const houseInstanceLeftRoofGeometry =
 createHouse01RoofGeometry(
 -1
 );

const houseInstanceRightRoofGeometry =
 createHouse01RoofGeometry(
 1
 );

// --------------------------------------------------
// TEMP OBJECT
// --------------------------------------------------
const houseInstanceDummy =
 new THREE.Object3D();

// --------------------------------------------------
// BODY COLLIDER
// --------------------------------------------------
function createHouseTemplate01Collider(
 descriptor
) {
 const x =
 metersToUnits(
 descriptor.xMeters
 );

 const z =
 metersToUnits(
 descriptor.zMeters
 );

 const terrainY =
 metersToUnits(
 getTerrainHeightMeters(
 descriptor.xMeters,
 descriptor.zMeters
 )
 );

 /*
  * 現行物理との互換性を維持するため
  * 家本体はAABB。
  */
 const object =
 new THREE.Object3D();

 object.position.set(
 x,
 terrainY +
 HOUSE_01_HEIGHT /
 2,
 z
 );

 object.rotation.y =
 descriptor.rotation ??
 0;

 object.updateMatrixWorld(
 true
 );

 const box =
 new THREE.Box3(
 new THREE.Vector3(
 -HOUSE_01_HALF_WIDTH,
 -HOUSE_01_HEIGHT /
 2,
 -HOUSE_01_HALF_DEPTH
 ),
 new THREE.Vector3(
 HOUSE_01_HALF_WIDTH,
 HOUSE_01_HEIGHT /
 2,
 HOUSE_01_HALF_DEPTH
 )
 );

 box.applyMatrix4(
 object.matrixWorld
 );

 return box;
}

// --------------------------------------------------
// ROOF COLLIDER
// --------------------------------------------------
function createHouseTemplate01RoofCollider(
 descriptor
) {
 const terrainY =
 metersToUnits(
 getTerrainHeightMeters(
 descriptor.xMeters,
 descriptor.zMeters
 )
 );

 return {
 type:
 "gable-roof",

 x:
 metersToUnits(
 descriptor.xMeters
 ),

 z:
 metersToUnits(
 descriptor.zMeters
 ),

 rotation:
 descriptor.rotation ??
 0,

 halfWidth:
 HOUSE_01_HALF_WIDTH,

 halfDepth:
 HOUSE_01_HALF_DEPTH +
 HOUSE_01_OVERHANG,

 baseY:
 terrainY +
 HOUSE_01_HEIGHT,

 height:
 HOUSE_01_ROOF_HEIGHT
 };
}

// --------------------------------------------------
// ADD WINDOW MATRIX
// --------------------------------------------------
function addHouse01WindowMatrix(
 matrices,
 houseX,
 terrainY,
 houseZ,
 houseRotation,
 localX,
 localY,
 localZ,
 localRotationY
) {
 /*
  * 窓のlocal位置を
  * 家のY回転へ変換する。
  */
 const cos =
 Math.cos(
 houseRotation
 );

 const sin =
 Math.sin(
 houseRotation
 );

 const worldX =
 houseX +
 localX *
 cos +
 localZ *
 sin;

 const worldZ =
 houseZ -
 localX *
 sin +
 localZ *
 cos;

 houseInstanceDummy.position.set(
 worldX,
 terrainY +
 localY,
 worldZ
 );

 houseInstanceDummy.rotation.set(
 0,
 houseRotation +
 localRotationY,
 0
 );

 houseInstanceDummy.scale.set(
 1,
 1,
 1
 );

 houseInstanceDummy.updateMatrix();

 matrices.push(
 houseInstanceDummy.matrix.clone()
 );
}

// --------------------------------------------------
// BUILD HOUSE WINDOW MATRICES
// --------------------------------------------------
function buildHouse01WindowMatrices(
 descriptor,
 output
) {
 const houseX =
 metersToUnits(
 descriptor.xMeters
 );

 const houseZ =
 metersToUnits(
 descriptor.zMeters
 );

 const terrainY =
 metersToUnits(
 getTerrainHeightMeters(
 descriptor.xMeters,
 descriptor.zMeters
 )
 );

 const rotation =
 descriptor.rotation ??
 0;

 const offset =
 metersToUnits(
 HOUSE_TEMPLATE_01
 .windowSurfaceOffsetMeters
 );

 // ------------------------------------------------
 // FLOORS
 // ------------------------------------------------
 for (
 let floor = 0;
 floor <
 HOUSE_TEMPLATE_01.floorCount;
 floor++
 ) {
 const y =
 HOUSE_01_FLOOR_HEIGHT *
 (
 floor +
 0.55
 );

 // ------------------------------------------------
 // FRONT / BACK
 // ------------------------------------------------
 const frontCount =
 HOUSE_TEMPLATE_01
 .frontWindowsPerFloor;

 for (
 let i = 0;
 i < frontCount;
 i++
 ) {
 const localX =
 THREE.MathUtils.lerp(
 -HOUSE_01_HALF_WIDTH *
 0.68,
 HOUSE_01_HALF_WIDTH *
 0.68,
 frontCount ===
 1
 ? 0.5
 : i /
 (
 frontCount -
 1
 )
 );

 // ----------------------------------------------
 // FRONT
 // ----------------------------------------------
 /*
  * 1階中央は玄関用に空ける。
  */
 if (
 !(
 floor ===
 0 &&
 i ===
 Math.floor(
 frontCount /
 2
 )
 )
 ) {
 addHouse01WindowMatrix(
 output,
 houseX,
 terrainY,
 houseZ,
 rotation,
 localX,
 y,
 HOUSE_01_HALF_DEPTH +
 offset,
 0
 );
 }

 // ----------------------------------------------
 // BACK
 // ----------------------------------------------
 addHouse01WindowMatrix(
 output,
 houseX,
 terrainY,
 houseZ,
 rotation,
 localX,
 y,
 -HOUSE_01_HALF_DEPTH -
 offset,
 Math.PI
 );
 }

 // ------------------------------------------------
 // LEFT / RIGHT
 // ------------------------------------------------
 const sideCount =
 HOUSE_TEMPLATE_01
 .sideWindowsPerFloor;

 for (
 let i = 0;
 i < sideCount;
 i++
 ) {
 const localZ =
 THREE.MathUtils.lerp(
 -HOUSE_01_HALF_DEPTH *
 0.55,
 HOUSE_01_HALF_DEPTH *
 0.55,
 sideCount ===
 1
 ? 0.5
 : i /
 (
 sideCount -
 1
 )
 );

 // LEFT
 addHouse01WindowMatrix(
 output,
 houseX,
 terrainY,
 houseZ,
 rotation,
 -HOUSE_01_HALF_WIDTH -
 offset,
 y,
 localZ,
 -Math.PI /
 2
 );

 // RIGHT
 addHouse01WindowMatrix(
 output,
 houseX,
 terrainY,
 houseZ,
 rotation,
 HOUSE_01_HALF_WIDTH +
 offset,
 y,
 localZ,
 Math.PI /
 2
 );
 }
 }
}

// --------------------------------------------------
// CREATE CHUNK INSTANCES
// --------------------------------------------------
function createHouseTemplate01Instances(
 descriptors,
 chunkData
) {
 const houses =
 descriptors.filter(
 descriptor =>
 descriptor.type ===
 "house"
 );

 if (
 houses.length ===
 0
 ) {
 return;
 }

 const houseCount =
 houses.length;

 // ------------------------------------------------
 // FLOORS
 // ------------------------------------------------
 const floor1 =
 new THREE.InstancedMesh(
 houseInstanceFloorGeometry,
 houseInstanceWallMaterial,
 houseCount
 );

 const floor2 =
 new THREE.InstancedMesh(
 houseInstanceFloorGeometry,
 houseInstanceWallMaterial,
 houseCount
 );

 const floor3 =
 new THREE.InstancedMesh(
 houseInstanceFloorGeometry,
 houseInstanceWallMaterial,
 houseCount
 );

 // ------------------------------------------------
 // ROOFS
 // ------------------------------------------------
 const leftRoofs =
 new THREE.InstancedMesh(
 houseInstanceLeftRoofGeometry,
 houseInstanceRoofMaterial,
 houseCount
 );

 const rightRoofs =
 new THREE.InstancedMesh(
 houseInstanceRightRoofGeometry,
 houseInstanceRoofMaterial,
 houseCount
 );

 // ------------------------------------------------
 // GABLES
 // ------------------------------------------------
 const frontGables =
 new THREE.InstancedMesh(
 houseInstanceGableGeometry,
 houseInstanceWallMaterial,
 houseCount
 );

 const backGables =
 new THREE.InstancedMesh(
 houseInstanceGableGeometry,
 houseInstanceWallMaterial,
 houseCount
 );

 // ------------------------------------------------
 // WINDOW MATRICES
 // ------------------------------------------------
 const windowMatrices =
 [];

 for (
 const descriptor
 of houses
 ) {
 buildHouse01WindowMatrices(
 descriptor,
 windowMatrices
 );
 }

 const windows =
 new THREE.InstancedMesh(
 houseInstanceWindowGeometry,
 houseInstanceWindowMaterial,
 Math.max(
 1,
 windowMatrices.length
 )
 );

 windows.count =
 windowMatrices.length;

 // ------------------------------------------------
 // HOUSES
 // ------------------------------------------------
 for (
 let i = 0;
 i < houseCount;
 i++
 ) {
 const descriptor =
 houses[
 i
 ];

 const x =
 metersToUnits(
 descriptor.xMeters
 );

 const z =
 metersToUnits(
 descriptor.zMeters
 );

 const terrainY =
 metersToUnits(
 getTerrainHeightMeters(
 descriptor.xMeters,
 descriptor.zMeters
 )
 );

 const rotation =
 descriptor.rotation ??
 0;

 // ------------------------------------------------
 // FLOOR 1
 // ------------------------------------------------
 houseInstanceDummy.position.set(
 x,
 terrainY +
 HOUSE_01_FLOOR_HEIGHT *
 0.5,
 z
 );

 houseInstanceDummy.rotation.set(
 0,
 rotation,
 0
 );

 houseInstanceDummy.scale.set(
 1,
 1,
 1
 );

 houseInstanceDummy.updateMatrix();

 floor1.setMatrixAt(
 i,
 houseInstanceDummy.matrix
 );

 // ------------------------------------------------
 // FLOOR 2
 // ------------------------------------------------
 houseInstanceDummy.position.set(
 x,
 terrainY +
 HOUSE_01_FLOOR_HEIGHT *
 1.5,
 z
 );

 houseInstanceDummy.updateMatrix();

 floor2.setMatrixAt(
 i,
 houseInstanceDummy.matrix
 );

 // ------------------------------------------------
 // FLOOR 3
 // ------------------------------------------------
 houseInstanceDummy.position.set(
 x,
 terrainY +
 HOUSE_01_FLOOR_HEIGHT *
 2.5,
 z
 );

 houseInstanceDummy.updateMatrix();

 floor3.setMatrixAt(
 i,
 houseInstanceDummy.matrix
 );

 // ------------------------------------------------
 // ROOF
 // ------------------------------------------------
 /*
  * 屋根Geometry自身が
  * 正しい /\ 形になっている。
  *
  * ここでは家のY回転しか行わない。
  */
 houseInstanceDummy.position.set(
 x,
 terrainY +
 HOUSE_01_HEIGHT,
 z
 );

 houseInstanceDummy.rotation.set(
 0,
 rotation,
 0
 );

 houseInstanceDummy.updateMatrix();

 leftRoofs.setMatrixAt(
 i,
 houseInstanceDummy.matrix
 );

 rightRoofs.setMatrixAt(
 i,
 houseInstanceDummy.matrix
 );

 // ------------------------------------------------
 // FRONT GABLE
 // ------------------------------------------------
 houseInstanceDummy.position.set(
 x,
 terrainY +
 HOUSE_01_HEIGHT,
 z
 );

 houseInstanceDummy.rotation.set(
 0,
 rotation,
 0
 );

 houseInstanceDummy.translateZ(
 HOUSE_01_HALF_DEPTH +
 0.01
 );

 houseInstanceDummy.updateMatrix();

 frontGables.setMatrixAt(
 i,
 houseInstanceDummy.matrix
 );

 // ------------------------------------------------
 // BACK GABLE
 // ------------------------------------------------
 houseInstanceDummy.position.set(
 x,
 terrainY +
 HOUSE_01_HEIGHT,
 z
 );

 houseInstanceDummy.rotation.set(
 0,
 rotation +
 Math.PI,
 0
 );

 houseInstanceDummy.translateZ(
 HOUSE_01_HALF_DEPTH +
 0.01
 );

 houseInstanceDummy.updateMatrix();

 backGables.setMatrixAt(
 i,
 houseInstanceDummy.matrix
 );

 // ------------------------------------------------
 // BODY PHYSICS
 // ------------------------------------------------
 const bodyCollider =
 createHouseTemplate01Collider(
 descriptor
 );

 registerCollider(
 bodyCollider
 );

 chunkData.colliders.push(
 bodyCollider
 );

 // ------------------------------------------------
 // ROOF PHYSICS
 // ------------------------------------------------
 const roofCollider =
 createHouseTemplate01RoofCollider(
 descriptor
 );

 registerRoofCollider(
 roofCollider
 );

 chunkData.roofColliders.push(
 roofCollider
 );
 }

 // ------------------------------------------------
 // WINDOWS
 // ------------------------------------------------
 for (
 let i = 0;
 i <
 windowMatrices.length;
 i++
 ) {
 windows.setMatrixAt(
 i,
 windowMatrices[
 i
 ]
 );
 }

 // ------------------------------------------------
 // UPDATE MATRICES
 // ------------------------------------------------
 for (
 const mesh
 of [
 floor1,
 floor2,
 floor3,
 leftRoofs,
 rightRoofs,
 frontGables,
 backGables,
 windows
 ]
 ) {
 mesh.instanceMatrix.needsUpdate =
 true;

 /*
  * 王都のShadow Draw Callを
  * 爆発させない。
  */
 mesh.castShadow =
 false;

 mesh.receiveShadow =
 true;

 chunkData.group.add(
 mesh
 );

 anchorTargets.push(
 mesh
 );

 chunkData.anchorTargets.push(
 mesh
 );
 }
}

// ==================================================
// FIXED FOREST CHUNK SYSTEM
// ==================================================
function getFixedForestChunkObjects(
 chunkX,
 chunkZ
) {
 const world =
 getFixedWorld();

 if (
 !world
 ) {
 return [];
 }

 return generateDeterministicForestChunk(
 world.forests,
 chunkX,
 chunkZ,
 CHUNK_SIZE_METERS
 );
}

// ==================================================
// CHUNK WORLD OBJECTS
// ==================================================
const treeTrunkMaterial =
 new THREE.MeshStandardMaterial({
 color: 0x5b3a22,
 roughness: 1
 });

const treeLeafMaterial =
 new THREE.MeshStandardMaterial({
 color: 0x356b2f,
 roughness: 1
 });

// --------------------------------------------------
// REMOVE ARRAY ITEM
// --------------------------------------------------
function removeArrayItem(
 array,
 item
) {
 const index =
 array.indexOf(
 item
 );

 if (
 index >= 0
 ) {
 array.splice(
 index,
 1
 );
 }
}

// --------------------------------------------------
// STABLE VARIANT
// --------------------------------------------------
function getWorldObjectVariant(
 descriptor
) {
 if (
 Number.isFinite(
 descriptor.variant
 )
 ) {
 return Math.abs(
 descriptor.variant
 );
 }

 const text =
 String(
 descriptor.id ??
 ""
 );

 let value =
 0;

 for (
 let i = 0;
 i < text.length;
 i++
 ) {
 value =
 (
 value *
 31 +
 text.charCodeAt(
 i
 )
 ) >>>
 0;
 }

 return value;
}

// --------------------------------------------------
// CREATE FIXED TREE
// --------------------------------------------------
function createGeneratedTree(
 descriptor,
 chunkData
) {
 const x =
 metersToUnits(
 descriptor.xMeters
 );

 const z =
 metersToUnits(
 descriptor.zMeters
 );

 const height =
 metersToUnits(
 descriptor.heightMeters ??
 20
 );

 const trunkRadius =
 metersToUnits(
 descriptor.trunkRadiusMeters ??
 0.7
 );

 const crownRadius =
 metersToUnits(
 descriptor.crownRadiusMeters ??
 5
 );

 const giant =
 descriptor.giant ??
 false;

 const terrainY =
 metersToUnits(
 getTerrainHeightMeters(
 descriptor.xMeters,
 descriptor.zMeters
 )
 );

 // ------------------------------------------------
 // TRUNK
 // ------------------------------------------------
 const trunk =
 new THREE.Mesh(
 new THREE.CylinderGeometry(
 trunkRadius,
 trunkRadius *
 1.12,
 height,
 giant
 ? 12
 : 8
 ),
 treeTrunkMaterial
 );

 trunk.position.set(
 x,
 terrainY +
 height /
 2,
 z
 );

 trunk.castShadow =
 false;

 trunk.receiveShadow =
 true;

 trunk.userData.worldObjectId =
 descriptor.id;

 chunkData.group.add(
 trunk
 );

 // ------------------------------------------------
 // WORLD MATRIX
 // ------------------------------------------------
 /*
  * Colliderを生成する前に
  * 現在のWorldMatrixを確定する。
  */
 trunk.updateWorldMatrix(
 true,
 true
 );

 // ------------------------------------------------
 // COLLISION
 // ------------------------------------------------
 const box =
 new THREE.Box3()
 .setFromObject(
 trunk
 );

 registerCollider(
 box
 );

 chunkData.colliders.push(
 box
 );

 // ------------------------------------------------
 // TRUNK ANCHOR
 // ------------------------------------------------
 anchorTargets.push(
 trunk
 );

 chunkData.anchorTargets.push(
 trunk
 );

 // ------------------------------------------------
 // CROWN
 // ------------------------------------------------
 const crown =
 new THREE.Mesh(
 new THREE.SphereGeometry(
 crownRadius,
 giant
 ? 12
 : 8,
 giant
 ? 8
 : 6
 ),
 treeLeafMaterial
 );

 crown.position.set(
 x,
 terrainY +
 height,
 z
 );

 crown.scale.y =
 0.7;

 crown.castShadow =
 false;

 crown.receiveShadow =
 false;

 crown.userData.worldObjectId =
 descriptor.id;

 chunkData.group.add(
 crown
 );

 // ------------------------------------------------
 // CROWN ANCHOR
 // ------------------------------------------------
 anchorTargets.push(
 crown
 );

 chunkData.anchorTargets.push(
 crown
 );
}

// --------------------------------------------------
// CREATE CHUNK WORLD CONTENT
// --------------------------------------------------
function createChunkWorldContent(
 chunkX,
 chunkZ
) {
 const fixedChunk =
 getFixedWorldChunk(
 chunkX,
 chunkZ
 );

 const descriptors =
 fixedChunk.objects;

 const group =
 new THREE.Group();

 // ------------------------------------------------
 // CHUNK DATA
 // ------------------------------------------------
 /*
  * colliders:
  * 通常Box Collider
  *
  * roofColliders:
  * 切妻屋根専用の斜面Collider
  *
  * anchorTargets:
  * アンカーRaycast対象
  */
 const chunkData = {
 group,
 colliders: [],
 roofColliders: [],
 anchorTargets: []
 };

 // ------------------------------------------------
 // HOUSES
 // ------------------------------------------------
 /*
  * チャンク内のTemplate 01住宅を
  * InstancedMeshとしてまとめて生成する。
  *
  * 家1軒ごとのMeshは作らない。
  */
 createHouseTemplate01Instances(
 descriptors,
 chunkData
 );

 // ------------------------------------------------
 // OTHER OBJECTS
 // ------------------------------------------------
 for (
 const descriptor
 of descriptors
 ) {
 // ------------------------------------------------
 // HOUSE
 // ------------------------------------------------
 if (
 descriptor.type ===
 "house"
 ) {
 continue;
 }

 // ------------------------------------------------
 // TREE
 // ------------------------------------------------
 if (
 descriptor.type ===
 "tree"
 ) {
 createGeneratedTree(
 descriptor,
 chunkData
 );
 }
 }

 // ------------------------------------------------
 // ADD TO SCENE
 // ------------------------------------------------
 scene.add(
 group
 );

 group.updateWorldMatrix(
 true,
 true
 );

 return chunkData;
}

// --------------------------------------------------
// DESTROY CHUNK WORLD CONTENT
// --------------------------------------------------
function destroyChunkWorldContent(
 data
) {
 if (
 !data
 ) {
 return;
 }

 // ------------------------------------------------
 // BOX COLLIDERS
 // ------------------------------------------------
 for (
 const box
 of data.colliders
 ) {
 unregisterCollider(
 box
 );
 }

 // ------------------------------------------------
 // ROOF COLLIDERS
 // ------------------------------------------------
 /*
  * これを行わないと、
  * チャンクが消えたあとにも
  * 見えない屋根判定だけ残る。
  */
 if (
 Array.isArray(
 data.roofColliders
 )
 ) {
 for (
 const roof
 of data.roofColliders
 ) {
 unregisterRoofCollider(
 roof
 );
 }
 }

 // ------------------------------------------------
 // ANCHOR TARGETS
 // ------------------------------------------------
 for (
 const mesh
 of data.anchorTargets
 ) {
 removeArrayItem(
 anchorTargets,
 mesh
 );
 }

 // ------------------------------------------------
 // REMOVE FROM SCENE
 // ------------------------------------------------
 scene.remove(
 data.group
 );

 // ------------------------------------------------
 // DISPOSE
 // ------------------------------------------------
 /*
  * HOUSE
  *
  * Geometry / Materialは
  * 全チャンクで共有している。
  *
  * InstancedMeshだからといって
  * ここで共有Geometryをdisposeすると、
  * 他チャンクの家まで壊れる。
  *
  *
  * TREE
  *
  * 現在は木だけ個別Geometryなので
  * Geometryを破棄する。
  */
 data.group.traverse(
 object => {
 // ----------------------------------------------
 // SHARED HOUSE INSTANCE
 // ----------------------------------------------
 if (
 object.isInstancedMesh
 ) {
 return;
 }

 // ----------------------------------------------
 // NORMAL OBJECT
 // ----------------------------------------------
 if (
 object.geometry
 ) {
 object.geometry.dispose();
 }
 }
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
/*
 * 固定ワールド移行後は、
 *
 * createCity()
 *
 * を絶対に呼ばない。
 *
 * createCity()は旧システムで
 * Math.random()を使って家を配置するため、
 * リロードごとに街並みが変化してしまう。
 *
 *
 * 家・木・道路・都市配置の正本は、
 *
 * /world/paradis-world.json
 *
 * のみ。
 */

// --------------------------------------------------
// TRAINING
// --------------------------------------------------
createTrainingArea();

/*
 * WALLは固定Worldロード後の情報を使う。
 *
 * createCityWall()自体は
 * WORLD_MAPへのfallbackも持っているので
 * 初期化だけ可能。
 */
createCityWall();

/*
 * IMPORTANT:
 *
 * createCity();
 *
 * は呼ばない。
 */

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
// BLADE VIEWMODEL
// ==================================================

// --------------------------------------------------
// MATERIALS
// --------------------------------------------------
const bladeMaterial =
 new THREE.MeshStandardMaterial({
 color: 0xd7dce1,
 metalness: 0.32,
 roughness: 0.20,
 emissive: 0x202326,
 emissiveIntensity: 0.08,
 side: THREE.DoubleSide
 });

const bladeEdgeMaterial =
 new THREE.MeshStandardMaterial({
 color: 0xffffff,
 metalness: 0.40,
 roughness: 0.07,
 emissive: 0x454a4f,
 emissiveIntensity: 0.18,
 side: THREE.DoubleSide
 });

const bladeJointMaterial =
 new THREE.MeshBasicMaterial({
 color: 0x4b5054,
 side: THREE.DoubleSide
 });

const bladeMechanismMaterial =
 new THREE.MeshStandardMaterial({
 color: 0x969da3,
 metalness: 0.58,
 roughness: 0.24
 });

const bladeLightMetalMaterial =
 new THREE.MeshStandardMaterial({
 color: 0xd2d6da,
 metalness: 0.50,
 roughness: 0.18
 });

const bladeDarkMetalMaterial =
 new THREE.MeshStandardMaterial({
 color: 0x383c40,
 metalness: 0.55,
 roughness: 0.28
 });

const bladeGripMaterial =
 new THREE.MeshStandardMaterial({
 color: 0x63372f,
 metalness: 0.04,
 roughness: 0.82
 });

const bladeGripDarkMaterial =
 new THREE.MeshStandardMaterial({
 color: 0x201716,
 metalness: 0.06,
 roughness: 0.86
 });

// --------------------------------------------------
// MODEL SETTINGS
// --------------------------------------------------
const BLADE_MODEL_LENGTH =
 2.90;

const BLADE_MODEL_WIDTH =
 0.22;

const BLADE_EDGE_WIDTH =
 0.046;

const BLADE_TIP_CUT =
 0.28;

const BLADE_CENTER_PIVOT_Z =
 -1.45;

// --------------------------------------------------
// BLADE FACE DEPTH
// --------------------------------------------------
/*
 * 刀身本体はほぼ紙。
 *
 * 装飾だけ表裏へ
 * わずかに浮かせる。
 */
const BLADE_FACE_OFFSET =
 0.004;

const BLADE_JOINT_OFFSET =
 0.007;

// --------------------------------------------------
// GRIP SETTINGS
// --------------------------------------------------
const BLADE_GRIP_RADIUS =
 0.078;

const BLADE_GRIP_SEGMENTS =
 32;

const BLADE_GRIP_RADIAL_SEGMENTS =
 12;

// --------------------------------------------------
// FLAT GEOMETRY
// --------------------------------------------------
function createBladeFlatGeometry(
 points
) {
 const vertices =
 [];

 for (
 let i = 1;
 i <
 points.length - 1;
 i++
 ) {
 const a =
 points[0];

 const b =
 points[i];

 const c =
 points[
 i + 1
 ];

 vertices.push(
 a[0],
 a[1],
 0,

 b[0],
 b[1],
 0,

 c[0],
 c[1],
 0
 );
 }

 const geometry =
 new THREE.BufferGeometry();

 geometry.setAttribute(
 "position",
 new THREE.Float32BufferAttribute(
 vertices,
 3
 )
 );

 geometry.computeVertexNormals();

 return geometry;
}

// --------------------------------------------------
// FLAT MESH
// --------------------------------------------------
function createBladeFlatMesh(
 points,
 material,
 depth = 0
) {
 const mesh =
 new THREE.Mesh(
 createBladeFlatGeometry(
 points
 ),
 material
 );

 mesh.position.z =
 depth;

 return mesh;
}

// --------------------------------------------------
// CREATE SMOOTH GRIP
// --------------------------------------------------
function createSmoothBladeGrip(
 side
) {
 const group =
 new THREE.Group();

 // ------------------------------------------------
 // MAIN CURVE
 // ------------------------------------------------
 const curve =
 new THREE.CatmullRomCurve3(
 [
 new THREE.Vector3(
 0,
 0,
 0
 ),

 new THREE.Vector3(
 side *
 0.025,
 -0.11,
 0
 ),

 new THREE.Vector3(
 side *
 0.065,
 -0.23,
 0
 ),

 new THREE.Vector3(
 side *
 0.115,
 -0.36,
 0
 ),

 new THREE.Vector3(
 side *
 0.155,
 -0.49,
 0
 )
 ],
 false,
 "catmullrom",
 0.45
 );

 // ------------------------------------------------
 // GRIP BODY
 // ------------------------------------------------
 const grip =
 new THREE.Mesh(
 new THREE.TubeGeometry(
 curve,
 BLADE_GRIP_SEGMENTS,
 BLADE_GRIP_RADIUS,
 BLADE_GRIP_RADIAL_SEGMENTS,
 false
 ),
 bladeGripMaterial
 );

 /*
 * 丸棒ではなく
 * 平たいグリップ。
 */
 grip.scale.z =
 0.62;

 grip.castShadow =
 true;

 grip.receiveShadow =
 true;

 group.add(
 grip
 );

 // ------------------------------------------------
 // DARK BACK STRIP
 // ------------------------------------------------
 const backCurve =
 new THREE.CatmullRomCurve3(
 [
 new THREE.Vector3(
 -side *
 0.050,
 0.005,
 0.002
 ),

 new THREE.Vector3(
 -side *
 0.025,
 -0.12,
 0.002
 ),

 new THREE.Vector3(
 side *
 0.020,
 -0.25,
 0.002
 ),

 new THREE.Vector3(
 side *
 0.070,
 -0.38,
 0.002
 ),

 new THREE.Vector3(
 side *
 0.112,
 -0.49,
 0.002
 )
 ],
 false,
 "catmullrom",
 0.45
 );

 const backStrip =
 new THREE.Mesh(
 new THREE.TubeGeometry(
 backCurve,
 BLADE_GRIP_SEGMENTS,
 0.020,
 8,
 false
 ),
 bladeGripDarkMaterial
 );

 backStrip.scale.z =
 0.58;

 group.add(
 backStrip
 );

 // ------------------------------------------------
 // GRIP RINGS
 // ------------------------------------------------
 for (
 let i = 1;
 i <= 6;
 i++
 ) {
 const t =
 i /
 7;

 const center =
 curve.getPointAt(
 t
 );

 const tangent =
 curve.getTangentAt(
 t
 );

 const ring =
 new THREE.Mesh(
 new THREE.TorusGeometry(
 BLADE_GRIP_RADIUS *
 1.01,
 0.006,
 6,
 14
 ),
 bladeGripDarkMaterial
 );

 ring.position.copy(
 center
 );

 ring.quaternion
 .setFromUnitVectors(
 new THREE.Vector3(
 0,
 0,
 1
 ),
 tangent.clone()
 .normalize()
 );

 ring.scale.z =
 0.62;

 group.add(
 ring
 );
 }

 // ------------------------------------------------
 // TOP COLLAR
 // ------------------------------------------------
 const topCollar =
 new THREE.Mesh(
 new THREE.BoxGeometry(
 0.18,
 0.075,
 0.10
 ),
 bladeLightMetalMaterial
 );

 topCollar.position.set(
 0,
 0.005,
 0
 );

 group.add(
 topCollar
 );

 // ------------------------------------------------
 // POMMEL
 // ------------------------------------------------
 const endPoint =
 curve.getPointAt(
 1
 );

 const pommel =
 new THREE.Mesh(
 new THREE.BoxGeometry(
 0.19,
 0.078,
 0.105
 ),
 bladeLightMetalMaterial
 );

 pommel.position.copy(
 endPoint
 );

 pommel.rotation.z =
 -side *
 THREE.MathUtils.degToRad(
 17
 );

 group.add(
 pommel
 );

 // ------------------------------------------------
 // END SCREW
 // ------------------------------------------------
 const screw =
 new THREE.Mesh(
 new THREE.CylinderGeometry(
 0.025,
 0.021,
 0.065,
 10
 ),
 bladeDarkMetalMaterial
 );

 screw.position.set(
 endPoint.x +
 side *
 0.020,
 endPoint.y -
 0.065,
 0
 );

 group.add(
 screw
 );

 return group;
}

// --------------------------------------------------
// CREATE VISUAL
// --------------------------------------------------
function createBladeVisual(
 side
) {
 const visual =
 new THREE.Group();

 const halfWidth =
 BLADE_MODEL_WIDTH /
 2;

 // ------------------------------------------------
 // BLADE SHAPE
 // ------------------------------------------------
 let bladePoints;

 if (
 side < 0
 ) {
 bladePoints = [
 [
 -halfWidth,
 0
 ],
 [
 halfWidth,
 0
 ],
 [
 halfWidth,
 BLADE_MODEL_LENGTH
 ],
 [
 -halfWidth,
 BLADE_MODEL_LENGTH -
 BLADE_TIP_CUT
 ]
 ];
 } else {
 bladePoints = [
 [
 -halfWidth,
 0
 ],
 [
 halfWidth,
 0
 ],
 [
 halfWidth,
 BLADE_MODEL_LENGTH -
 BLADE_TIP_CUT
 ],
 [
 -halfWidth,
 BLADE_MODEL_LENGTH
 ]
 ];
 }

 // ------------------------------------------------
 // MAIN BLADE
 // ------------------------------------------------
 /*
 * 本体自体はDoubleSide。
 */
 const blade =
 createBladeFlatMesh(
 bladePoints,
 bladeMaterial,
 0
 );

 blade.castShadow =
 true;

 visual.add(
 blade
 );

 // ------------------------------------------------
 // EDGE SHAPE
 // ------------------------------------------------
 let edgePoints;

 if (
 side < 0
 ) {
 edgePoints = [
 [
 halfWidth -
 BLADE_EDGE_WIDTH,
 0
 ],
 [
 halfWidth,
 0
 ],
 [
 halfWidth,
 BLADE_MODEL_LENGTH
 ],
 [
 halfWidth -
 BLADE_EDGE_WIDTH,
 BLADE_MODEL_LENGTH -
 BLADE_TIP_CUT *
 0.78
 ]
 ];
 } else {
 edgePoints = [
 [
 -halfWidth,
 0
 ],
 [
 -halfWidth +
 BLADE_EDGE_WIDTH,
 0
 ],
 [
 -halfWidth +
 BLADE_EDGE_WIDTH,
 BLADE_MODEL_LENGTH -
 BLADE_TIP_CUT *
 0.78
 ],
 [
 -halfWidth,
 BLADE_MODEL_LENGTH
 ]
 ];
 }

 // ------------------------------------------------
 // FRONT EDGE
 // ------------------------------------------------
 const frontEdge =
 createBladeFlatMesh(
 edgePoints,
 bladeEdgeMaterial,
 BLADE_FACE_OFFSET
 );

 visual.add(
 frontEdge
 );

 // ------------------------------------------------
 // BACK EDGE
 // ------------------------------------------------
 /*
 * 裏面にも同じ白銀の刃。
 *
 * 物理的な刃側は同じ。
 */
 const backEdge =
 createBladeFlatMesh(
 edgePoints,
 bladeEdgeMaterial,
 -BLADE_FACE_OFFSET
 );

 /*
 * 裏側へ向ける。
 */
 backEdge.rotation.y =
 Math.PI;

 /*
 * rotationでXが反転するため
 * 位置も補正。
 */
 backEdge.scale.x =
 -1;

 visual.add(
 backEdge
 );

 // ------------------------------------------------
 // BLADE JOINTS
 // ------------------------------------------------
 const jointCount =
 6;

 for (
 let i = 1;
 i <= jointCount;
 i++
 ) {
 const y =
 (
 BLADE_MODEL_LENGTH -
 0.30
 ) *
 i /
 (
 jointCount +
 1
 );

 // ----------------------------------------------
 // FRONT JOINT
 // ----------------------------------------------
 const frontJoint =
 new THREE.Mesh(
 new THREE.PlaneGeometry(
 BLADE_MODEL_WIDTH *
 0.98,
 0.012
 ),
 bladeJointMaterial
 );

 frontJoint.position.set(
 0,
 y,
 BLADE_JOINT_OFFSET
 );

 frontJoint.rotation.z =
 side *
 THREE.MathUtils.degToRad(
 17
 );

 visual.add(
 frontJoint
 );

 // ----------------------------------------------
 // BACK JOINT
 // ----------------------------------------------
 /*
 * 裏面にも同じ分割線。
 */
 const backJoint =
 new THREE.Mesh(
 new THREE.PlaneGeometry(
 BLADE_MODEL_WIDTH *
 0.98,
 0.012
 ),
 bladeJointMaterial
 );

 backJoint.position.set(
 0,
 y,
 -BLADE_JOINT_OFFSET
 );

 /*
 * 裏から見た時に
 * 表と対応する線になるよう
 * Z方向へ反転。
 */
 backJoint.rotation.y =
 Math.PI;

 backJoint.rotation.z =
 -side *
 THREE.MathUtils.degToRad(
 17
 );

 visual.add(
 backJoint
 );
 }

 // ------------------------------------------------
 // ROOT HOLDER
 // ------------------------------------------------
 const rootHolder =
 new THREE.Mesh(
 new THREE.BoxGeometry(
 0.25,
 0.18,
 0.075
 ),
 bladeMechanismMaterial
 );

 rootHolder.position.set(
 0,
 -0.08,
 0
 );

 visual.add(
 rootHolder
 );

 // ------------------------------------------------
 // ROOT TEETH
 // ------------------------------------------------
 for (
 let i = -2;
 i <= 2;
 i++
 ) {
 const tooth =
 new THREE.Mesh(
 new THREE.BoxGeometry(
 0.035,
 0.065,
 0.080
 ),
 bladeLightMetalMaterial
 );

 tooth.position.set(
 i *
 0.044,
 0.015 +
 Math.abs(
 i
 ) %
 2 *
 0.012,
 0
 );

 visual.add(
 tooth
 );
 }

 // ------------------------------------------------
 // MAIN MECHANISM
 // ------------------------------------------------
 const mechanism =
 new THREE.Mesh(
 new THREE.BoxGeometry(
 0.34,
 0.30,
 0.095
 ),
 bladeDarkMetalMaterial
 );

 mechanism.position.set(
 0,
 -0.27,
 0
 );

 mechanism.castShadow =
 true;

 visual.add(
 mechanism
 );

 // ------------------------------------------------
 // MECHANISM PLATE FRONT
 // ------------------------------------------------
 const frontPlate =
 new THREE.Mesh(
 new THREE.BoxGeometry(
 0.26,
 0.16,
 0.018
 ),
 bladeMechanismMaterial
 );

 frontPlate.position.set(
 0,
 -0.18,
 0.057
 );

 visual.add(
 frontPlate
 );

 // ------------------------------------------------
 // MECHANISM PLATE BACK
 // ------------------------------------------------
 /*
 * 持ち手機構も180°返した時に
 * 裏が完全な無地にならないよう
 * 同じ銀プレートを配置。
 */
 const backPlate =
 frontPlate.clone();

 backPlate.position.z =
 -0.057;

 visual.add(
 backPlate
 );

 // ------------------------------------------------
 // SMOOTH GRIP
 // ------------------------------------------------
 const grip =
 createSmoothBladeGrip(
 side
 );

 grip.position.set(
 0,
 -0.37,
 0
 );

 visual.add(
 grip
 );

 // ------------------------------------------------
 // TRIGGER
 // ------------------------------------------------
 const trigger =
 new THREE.Mesh(
 new THREE.BoxGeometry(
 0.025,
 0.11,
 0.055
 ),
 bladeDarkMetalMaterial
 );

 trigger.position.set(
 -side *
 0.045,
 -0.41,
 0
 );

 trigger.rotation.z =
 side *
 THREE.MathUtils.degToRad(
 10
 );

 visual.add(
 trigger
 );

 // ------------------------------------------------
 // TRIGGER GUARD
 // ------------------------------------------------
 const guardCurve =
 new THREE.CatmullRomCurve3(
 [
 new THREE.Vector3(
 -side *
 0.08,
 -0.30,
 0
 ),

 new THREE.Vector3(
 -side *
 0.14,
 -0.39,
 0
 ),

 new THREE.Vector3(
 -side *
 0.12,
 -0.51,
 0
 ),

 new THREE.Vector3(
 -side *
 0.045,
 -0.54,
 0
 )
 ],
 false,
 "catmullrom",
 0.4
 );

 const guard =
 new THREE.Mesh(
 new THREE.TubeGeometry(
 guardCurve,
 16,
 0.014,
 8,
 false
 ),
 bladeLightMetalMaterial
 );

 visual.add(
 guard
 );

 // ------------------------------------------------
 // CONTROL LEVER
 // ------------------------------------------------
 const leverCurve =
 new THREE.CatmullRomCurve3(
 [
 new THREE.Vector3(
 side *
 0.13,
 -0.28,
 0
 ),

 new THREE.Vector3(
 side *
 0.16,
 -0.38,
 0
 ),

 new THREE.Vector3(
 side *
 0.18,
 -0.49,
 0
 ),

 new THREE.Vector3(
 side *
 0.16,
 -0.59,
 0
 )
 ],
 false,
 "catmullrom",
 0.4
 );

 const lever =
 new THREE.Mesh(
 new THREE.TubeGeometry(
 leverCurve,
 16,
 0.016,
 8,
 false
 ),
 bladeLightMetalMaterial
 );

 visual.add(
 lever
 );

 // ------------------------------------------------
 // FINAL ORIENTATION
 // ------------------------------------------------
 visual.rotation.x =
 -Math.PI /
 2;

 return visual;
}

// --------------------------------------------------
// CREATE BLADE
// --------------------------------------------------
function createBlade(
 side
) {
 const handGroup =
 new THREE.Group();

 const swingPivot =
 new THREE.Group();

 const twistPivot =
 new THREE.Group();

 const weapon =
 new THREE.Group();

 handGroup.add(
 swingPivot
 );

 swingPivot.add(
 twistPivot
 );

 twistPivot.add(
 weapon
 );

 // ------------------------------------------------
 // PIVOTS
 // ------------------------------------------------
 swingPivot.position.set(
 0,
 0.065,
 BLADE_CENTER_PIVOT_Z
 );

 twistPivot.position.set(
 0,
 -0.065,
 -BLADE_CENTER_PIVOT_Z
 );

 weapon.position.set(
 0,
 0,
 0
 );

 // ------------------------------------------------
 // VISUAL
 // ------------------------------------------------
 const visual =
 createBladeVisual(
 side
 );

 visual.position.set(
 0,
 0.04,
 -0.10
 );

 weapon.add(
 visual
 );

 // ------------------------------------------------
 // REST POSE
 // ------------------------------------------------
 handGroup.position.set(
 side *
 0.39,
 -0.37,
 -0.56
 );

 handGroup.rotation.set(
 -0.09,
 side *
 -0.09,
 side *
 -0.035
 );

 // ------------------------------------------------
 // ANIMATION DATA
 // ------------------------------------------------
 handGroup.userData.side =
 side;

 handGroup.userData.restPosition =
 handGroup.position.clone();

 handGroup.userData.restRotation =
 handGroup.rotation.clone();

 handGroup.userData.swingPivot =
 swingPivot;

 handGroup.userData.twistPivot =
 twistPivot;

 handGroup.userData.weapon =
 weapon;

 handGroup.userData.visual =
 visual;

 handGroup.userData.swayX =
 0;

 handGroup.userData.swayY =
 0;

 handGroup.userData.anchorRecoil =
 0;

 // ------------------------------------------------
 // CAMERA
 // ------------------------------------------------
 camera.add(
 handGroup
 );

 return handGroup;
}

// --------------------------------------------------
// LEFT / RIGHT
// --------------------------------------------------
const leftBlade =
 createBlade(
 -1
 );

const rightBlade =
 createBlade(
 1
 );

// --------------------------------------------------
// ATTACK STATE
// --------------------------------------------------
let attacking =
 false;

let attackTimer =
 0;

let attackCooldownTimer =
 0;

let bladeHitApplied =
 false;

let bladeAttackMotion =
 1;

const attackRaycaster =
 new THREE.Raycaster();

// --------------------------------------------------
// CAMERA MOTION STATE
// --------------------------------------------------
let bladePreviousYaw =
 0;

let bladePreviousPitch =
 0;

// ==================================================
// INPUT
// ==================================================
const keys =
 {};

let spacePressed =
 false;

let yaw =
 0;

let pitch =
 0;

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

// --------------------------------------------------
// START ATTACK
// --------------------------------------------------
function bladeAttack() {
 if (
  dead ||
  attacking ||
  attackCooldownTimer > 0 ||
  wallStunTimer > 0
 ) {
  return;
 }

 attacking =
  true;

 attackTimer =
  0;

 bladeSwingTimer =
  0;

 bladeSwingStarted =
  false;

 bladeHitApplied =
  false;

 attackCooldownTimer =
  ATTACK_COOLDOWN;

 // --------------------------------------------------
 // RANDOM MOTION
 // --------------------------------------------------
 bladeAttackMotion =
  1 +
  Math.floor(
   Math.random() *
   BLADE_ATTACK_MOTION_COUNT
  );
}

// --------------------------------------------------
// APPLY HIT
// --------------------------------------------------
function applyBladeHit() {
 if (
  bladeHitApplied ||
  !titanAlive
 ) {
  return;
 }

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
  attackRaycaster
  .intersectObjects(
   titanAttackTargets,
   false
  );

 if (
  hits.length ===
  0
 ) {
  return;
 }

 const target =
  hits[0]
  .object;

 const type =
  target.userData
  .titanType;

 const power =
  calculateSlashPower();

 // --------------------------------------------------
 // NAPE
 // --------------------------------------------------
 if (
  type ===
  "NAPE"
 ) {
  if (
   power >=
   NAPE_KILL_POWER
  ) {
   killTitan();
  }

  return;
 }

 // --------------------------------------------------
 // LIMBS
 // --------------------------------------------------
 const partId =
  target.userData
  .partId;

 if (partId) {
  damageTitanPart(
   partId,
   power
  );
 }
}

// ==================================================
// BLADE ANIMATION
// ==================================================
let bladeAttackHeld =
 false;

let bladeAttackReleased =
 false;

let bladeSwingStarted =
 false;

let bladeSwingTimer =
 0;

let bladeRecoveryStarted =
 false;

let bladeRecoveryTimer =
 0;

// --------------------------------------------------
// ATTACK TIMING
// --------------------------------------------------
/*
 * クリック開始から
 * 構えが完成するまで。
 */
const BLADE_WINDUP_DURATION =
 0.5;

/*
 * クリックを離してから
 * 振り切るまで。
 *
 * 確定値:
 * 0.4秒
 */
const BLADE_SWING_DURATION =
 0.4;

/*
 * 振り切った後、
 * 通常姿勢へ戻る時間。
 */
const BLADE_RECOVERY_DURATION =
 0.25;

// --------------------------------------------------
// ATTACK ROTATION
// --------------------------------------------------
/*
 * 確定値:
 * 70°
 *
 * 構え:
 * 0° → +70°
 *
 * 振り抜き:
 * +70° → -70°
 *
 * 合計140°。
 */
const BLADE_WINDUP_ANGLE =
 THREE.MathUtils.degToRad(
 70
 );

// --------------------------------------------------
// SIDE MOVEMENT
// --------------------------------------------------
/*
 * 横方向の振れ幅。
 *
 * 現在:
 * 2.0
 */
const BLADE_SIDE_EDGE =
 2.0;

// --------------------------------------------------
// DEPTH ARC
// --------------------------------------------------
/*
 * 上から見た時の円弧。
 *
 * 斬撃中央で、
 * 手元が最も奥へ入る。
 */
const BLADE_ARC_DEPTH =
 0.42;

// --------------------------------------------------
// SWING ACCELERATION
// --------------------------------------------------
/*
 * 振り始めは遅く、
 * 後半へ向かって加速。
 *
 * 1.0 = 等速
 * 1.5 = 軽い加速
 * 2.0 = 現在
 * 2.5 = 強い加速
 * 3.0 = 終盤へ集中
 */
const BLADE_SWING_ACCEL_POWER =
 2.0;

// --------------------------------------------------
// BLADE TWIST
// --------------------------------------------------
/*
 * 刀身そのものを
 * 長手方向へひねる量。
 *
 * 確定値:
 * 180°
 */
const BLADE_TWIST_ANGLE =
 THREE.MathUtils.degToRad(
 180
 );

/*
 * ひねり方向。
 *
 * 実画面で逆方向へしたい場合は
 * 1 → -1。
 */
const BLADE_TWIST_DIRECTION =
 1;

// --------------------------------------------------
// WIRE PULLBACK
// --------------------------------------------------
/*
 * Wで実際にワイヤー牽引している間だけ
 * 手元をプレイヤー側へ引く。
 *
 * アンカー射出時:
 * 動かない。
 *
 * FIRING中:
 * 動かない。
 *
 * CONNECTEDのみ:
 * 動かない。
 */
const BLADE_WIRE_PULLBACK =
 0.65;

/*
 * 速度による追加後退量。
 *
 * 300km/hで最大値。
 */
const BLADE_WIRE_SPEED_PULLBACK =
 0.25;

/*
 * W牽引を始めた時、
 * 後ろへ移動する速度。
 *
 * ゆっくり動かす。
 */
const BLADE_WIRE_PULL_IN_SPEED =
 1.6;

/*
 * Wを離した後、
 * 通常位置へ戻る速度。
 */
const BLADE_WIRE_RETURN_SPEED =
 1.8;

/*
 * W牽引中の
 * 小さな外開き。
 *
 * 0にすると
 * 純粋な後退のみ。
 */
const BLADE_WIRE_OPEN_ANGLE =
 THREE.MathUtils.degToRad(
 4
 );

// --------------------------------------------------
// WIRE RUNTIME
// --------------------------------------------------
let leftBladeWirePullback =
 0;

let rightBladeWirePullback =
 0;

// --------------------------------------------------
// HELPERS
// --------------------------------------------------
function bladeClamp01(
 value
) {
 return THREE.MathUtils.clamp(
 value,
 0,
 1
 );
}

function bladeSmoothStep(
 value
) {
 const t =
 bladeClamp01(
 value
 );

 return (
 t *
 t *
 (
 3 -
 2 *
 t
 )
 );
}

/*
 * 攻撃専用の加速カーブ。
 */
function bladeAccelerationCurve(
 value
) {
 return Math.pow(
 bladeClamp01(
 value
 ),
 BLADE_SWING_ACCEL_POWER
 );
}

function bladeMoveTowards(
 current,
 target,
 maxDelta
) {
 if (
 Math.abs(
 target -
 current
 ) <=
 maxDelta
 ) {
 return target;
 }

 return (
 current +
 Math.sign(
 target -
 current
 ) *
 maxDelta
 );
}

// --------------------------------------------------
// ANCHOR SHOT COMPATIBILITY
// --------------------------------------------------
/*
 * fireAnchorAtPoint()側には、
 *
 * triggerBladeAnchorRecoil(
 *  anchor.side
 * );
 *
 * が残っている。
 *
 * 現在の仕様では
 * 射出時に刀を動かさないので
 * 何もしない。
 */
function triggerBladeAnchorRecoil(
 side
) {
 void side;
}

// --------------------------------------------------
// UPDATE WIRE PULLBACK
// --------------------------------------------------
function updateBladeWirePullback(
 delta
) {
 // ------------------------------------------------
 // SPEED
 // ------------------------------------------------
 const speedKmh =
 velocity.length() *
 METERS_PER_UNIT *
 3.6;

 const speedFactor =
 bladeClamp01(
 speedKmh /
 300
 );

 /*
 * W牽引中の目標後退量。
 */
 const activePullback =
 BLADE_WIRE_PULLBACK +
 BLADE_WIRE_SPEED_PULLBACK *
 speedFactor;

 // ------------------------------------------------
 // ACTIVE STATE
 // ------------------------------------------------
 /*
 * updateWire()が
 * pulling=true にしている時だけ。
 */
 const leftActive =
 leftAnchor.pulling &&
 keys["KeyW"];

 const rightActive =
 rightAnchor.pulling &&
 keys["KeyW"];

 // ------------------------------------------------
 // TARGET
 // ------------------------------------------------
 const leftTarget =
 leftActive
 ? activePullback
 : 0;

 const rightTarget =
 rightActive
 ? activePullback
 : 0;

 // ------------------------------------------------
 // LEFT
 // ------------------------------------------------
 const leftSpeed =
 leftTarget >
 leftBladeWirePullback
 ? BLADE_WIRE_PULL_IN_SPEED
 : BLADE_WIRE_RETURN_SPEED;

 leftBladeWirePullback =
 bladeMoveTowards(
 leftBladeWirePullback,
 leftTarget,
 leftSpeed *
 delta
 );

 // ------------------------------------------------
 // RIGHT
 // ------------------------------------------------
 const rightSpeed =
 rightTarget >
 rightBladeWirePullback
 ? BLADE_WIRE_PULL_IN_SPEED
 : BLADE_WIRE_RETURN_SPEED;

 rightBladeWirePullback =
 bladeMoveTowards(
 rightBladeWirePullback,
 rightTarget,
 rightSpeed *
 delta
 );
}

// --------------------------------------------------
// GET WIRE MOTION
// --------------------------------------------------
function getBladeWireMotion(
 blade
) {
 const side =
 blade.userData.side;

 const anchor =
 side < 0
 ? leftAnchor
 : rightAnchor;

 const pullback =
 side < 0
 ? leftBladeWirePullback
 : rightBladeWirePullback;

 const active =
 anchor.pulling &&
 keys["KeyW"];

 const openAngle =
 active
 ? side *
 BLADE_WIRE_OPEN_ANGLE
 : 0;

 return {
 pullback,
 openAngle
 };
}

// --------------------------------------------------
// SET SWING ROTATION
// --------------------------------------------------
function setBladeSwingAngle(
 blade,
 attackAngle
) {
 const swingPivot =
 blade.userData
 .swingPivot;

 const wireMotion =
 getBladeWireMotion(
 blade
 );

 swingPivot.rotation.x =
 0;

 swingPivot.rotation.y =
 attackAngle +
 wireMotion.openAngle;

 swingPivot.rotation.z =
 0;
}

// --------------------------------------------------
// SET TWIST
// --------------------------------------------------
/*
 * amount:
 *
 * 0 = 0°
 * 1 = 180°
 */
function setBladeTwist(
 blade,
 amount
) {
 const twistPivot =
 blade.userData
 .twistPivot;

 const side =
 blade.userData.side;

 twistPivot.rotation.x =
 0;

 twistPivot.rotation.y =
 0;

 twistPivot.rotation.z =
 side *
 BLADE_TWIST_DIRECTION *
 BLADE_TWIST_ANGLE *
 bladeClamp01(
 amount
 );
}

// --------------------------------------------------
// SET POSITION
// --------------------------------------------------
function setBladeMotionPosition(
 blade,
 x,
 attackDepth = 0
) {
 const rest =
 blade.userData
 .restPosition;

 const wireMotion =
 getBladeWireMotion(
 blade
 );

 // X = 攻撃横移動
 blade.position.x =
 x;

 // Y = 現在は通常位置
 blade.position.y =
 rest.y;

 /*
 * Z:
 *
 * - attackDepth
 * =
 * 斬撃中央で奥へ。
 *
 * + pullback
 * =
 * W牽引中にプレイヤー側へ。
 */
 blade.position.z =
 rest.z -
 attackDepth +
 wireMotion.pullback;
}

// --------------------------------------------------
// RESET
// --------------------------------------------------
function resetBladeSwing(
 blade
) {
 const rest =
 blade.userData
 .restPosition;

 blade.rotation.copy(
 blade.userData
 .restRotation
 );

 /*
 * W牽引による後退位置は
 * 攻撃していなくても維持。
 */
 setBladeMotionPosition(
 blade,
 rest.x,
 0
 );

 setBladeSwingAngle(
 blade,
 0
 );

 setBladeTwist(
 blade,
 0
 );
}

// --------------------------------------------------
// WINDUP
// --------------------------------------------------
function applyBladeWindup(
 blade,
 direction,
 time
) {
 const t =
 bladeSmoothStep(
 time /
 BLADE_WINDUP_DURATION
 );

 const rest =
 blade.userData
 .restPosition;

 // ------------------------------------------------
 // ROTATION
 // ------------------------------------------------
 const angle =
 THREE.MathUtils.lerp(
 0,
 direction *
 BLADE_WINDUP_ANGLE,
 t
 );

 setBladeSwingAngle(
 blade,
 angle
 );

 // ------------------------------------------------
 // SIDE MOVEMENT
 // ------------------------------------------------
 /*
 * 持っている側とは逆方向へ。
 */
 const x =
 THREE.MathUtils.lerp(
 rest.x,
 -direction *
 BLADE_SIDE_EDGE,
 t
 );

 setBladeMotionPosition(
 blade,
 x,
 0
 );

 // ------------------------------------------------
 // TWIST
 // ------------------------------------------------
 /*
 * 振りかぶる0.5秒と同時に
 *
 * 0° → 180°
 */
 setBladeTwist(
 blade,
 t
 );
}

// --------------------------------------------------
// HOLD WINDUP
// --------------------------------------------------
function holdBladeWindupPose(
 blade,
 direction
) {
 setBladeSwingAngle(
 blade,
 direction *
 BLADE_WINDUP_ANGLE
 );

 setBladeMotionPosition(
 blade,
 -direction *
 BLADE_SIDE_EDGE,
 0
 );

 /*
 * 長押し中は
 * 180°で固定。
 */
 setBladeTwist(
 blade,
 1
 );
}

// --------------------------------------------------
// RELEASE SWING
// --------------------------------------------------
function applyBladeReleaseSwing(
 blade,
 direction,
 time
) {
 const rawT =
 bladeClamp01(
 time /
 BLADE_SWING_DURATION
 );

 /*
 * rawT:
 * 時間。
 *
 * swingT:
 * 加速を適用した
 * 実際のモーション進行度。
 */
 const swingT =
 bladeAccelerationCurve(
 rawT
 );

 // ------------------------------------------------
 // ROTATION
 // ------------------------------------------------
 /*
 * +70° → -70°
 *
 * 合計140°。
 */
 const angle =
 THREE.MathUtils.lerp(
 direction *
 BLADE_WINDUP_ANGLE,
 -direction *
 BLADE_WINDUP_ANGLE,
 swingT
 );

 setBladeSwingAngle(
 blade,
 angle
 );

 // ------------------------------------------------
 // SIDE MOVEMENT
 // ------------------------------------------------
 /*
 * -2 → +2
 *
 * 左右はdirectionで反転。
 */
 const x =
 THREE.MathUtils.lerp(
 -direction *
 BLADE_SIDE_EDGE,
 direction *
 BLADE_SIDE_EDGE,
 swingT
 );

 // ------------------------------------------------
 // DEPTH ARC
 // ------------------------------------------------
 /*
 * 上から見ると、
 *
 * START ─╮
 *        ╰─ 奥 ─╮
 *               ╰─ END
 *
 * のような円弧。
 */
 const depth =
 Math.sin(
 swingT *
 Math.PI
 ) *
 BLADE_ARC_DEPTH;

 setBladeMotionPosition(
 blade,
 x,
 depth
 );

 // ------------------------------------------------
 // TWIST HOLD
 // ------------------------------------------------
 /*
 * 斬撃中は
 * 180°を維持。
 */
 setBladeTwist(
 blade,
 1
 );
}

// --------------------------------------------------
// RECOVERY
// --------------------------------------------------
function applyBladeRecovery(
 blade,
 direction,
 time
) {
 const t =
 bladeSmoothStep(
 time /
 BLADE_RECOVERY_DURATION
 );

 const rest =
 blade.userData
 .restPosition;

 // ------------------------------------------------
 // ROTATION RETURN
 // ------------------------------------------------
 const angle =
 THREE.MathUtils.lerp(
 -direction *
 BLADE_WINDUP_ANGLE,
 0,
 t
 );

 setBladeSwingAngle(
 blade,
 angle
 );

 // ------------------------------------------------
 // POSITION RETURN
 // ------------------------------------------------
 const x =
 THREE.MathUtils.lerp(
 direction *
 BLADE_SIDE_EDGE,
 rest.x,
 t
 );

 setBladeMotionPosition(
 blade,
 x,
 0
 );

 // ------------------------------------------------
 // TWIST RETURN
 // ------------------------------------------------
 /*
 * 振り終わってから
 *
 * 180° → 0°
 */
 setBladeTwist(
 blade,
 1 -
 t
 );
}

// --------------------------------------------------
// PASSIVE
// --------------------------------------------------
function applyPassiveBladeMotion(
 blade
) {
 resetBladeSwing(
 blade
 );
}

// --------------------------------------------------
// WINDUP MOTION
// --------------------------------------------------
function applyBladeWindupMotion(
 time
) {
 // RIGHT
 if (
 bladeAttackMotion ===
 1
 ) {
 applyBladeWindup(
 rightBlade,
 1,
 time
 );

 applyPassiveBladeMotion(
 leftBlade
 );

 return;
 }

 // LEFT
 if (
 bladeAttackMotion ===
 2
 ) {
 applyBladeWindup(
 leftBlade,
 -1,
 time
 );

 applyPassiveBladeMotion(
 rightBlade
 );

 return;
 }

 // BOTH
 applyBladeWindup(
 rightBlade,
 1,
 time
 );

 applyBladeWindup(
 leftBlade,
 -1,
 time
 );
}

// --------------------------------------------------
// HOLD MOTION
// --------------------------------------------------
function holdBladeWindup() {
 // RIGHT
 if (
 bladeAttackMotion ===
 1
 ) {
 holdBladeWindupPose(
 rightBlade,
 1
 );

 resetBladeSwing(
 leftBlade
 );

 return;
 }

 // LEFT
 if (
 bladeAttackMotion ===
 2
 ) {
 holdBladeWindupPose(
 leftBlade,
 -1
 );

 resetBladeSwing(
 rightBlade
 );

 return;
 }

 // BOTH
 holdBladeWindupPose(
 rightBlade,
 1
 );

 holdBladeWindupPose(
 leftBlade,
 -1
 );
}

// --------------------------------------------------
// RELEASE MOTION
// --------------------------------------------------
function applyBladeReleaseMotion(
 time
) {
 // RIGHT
 if (
 bladeAttackMotion ===
 1
 ) {
 applyBladeReleaseSwing(
 rightBlade,
 1,
 time
 );

 return;
 }

 // LEFT
 if (
 bladeAttackMotion ===
 2
 ) {
 applyBladeReleaseSwing(
 leftBlade,
 -1,
 time
 );

 return;
 }

 // BOTH
 applyBladeReleaseSwing(
 rightBlade,
 1,
 time
 );

 applyBladeReleaseSwing(
 leftBlade,
 -1,
 time
 );
}

// --------------------------------------------------
// RECOVERY MOTION
// --------------------------------------------------
function applyBladeRecoveryMotion(
 time
) {
 // RIGHT
 if (
 bladeAttackMotion ===
 1
 ) {
 applyBladeRecovery(
 rightBlade,
 1,
 time
 );

 resetBladeSwing(
 leftBlade
 );

 return;
 }

 // LEFT
 if (
 bladeAttackMotion ===
 2
 ) {
 applyBladeRecovery(
 leftBlade,
 -1,
 time
 );

 resetBladeSwing(
 rightBlade
 );

 return;
 }

 // BOTH
 applyBladeRecovery(
 rightBlade,
 1,
 time
 );

 applyBladeRecovery(
 leftBlade,
 -1,
 time
 );
}

// --------------------------------------------------
// UPDATE
// --------------------------------------------------
function updateBladeAnimation(
 delta
) {
 // ------------------------------------------------
 // COOLDOWN
 // ------------------------------------------------
 attackCooldownTimer =
 Math.max(
 0,
 attackCooldownTimer -
 delta
 );

 // ------------------------------------------------
 // WIRE
 // ------------------------------------------------
 /*
 * 射出しただけでは動かない。
 *
 * 実際にW牽引している時だけ
 * 徐々に後ろへ移動。
 */
 updateBladeWirePullback(
 delta
 );

 // ------------------------------------------------
 // NO ATTACK
 // ------------------------------------------------
 if (
 !attacking
 ) {
 resetBladeSwing(
 leftBlade
 );

 resetBladeSwing(
 rightBlade
 );

 return;
 }

 // ------------------------------------------------
 // WINDUP
 // ------------------------------------------------
 if (
 !bladeSwingStarted
 ) {
 attackTimer +=
 delta;

 if (
 attackTimer <
 BLADE_WINDUP_DURATION
 ) {
 applyBladeWindupMotion(
 attackTimer
 );

 return;
 }

 // ------------------------------------------------
 // HOLD
 // ------------------------------------------------
 holdBladeWindup();

 if (
 bladeAttackHeld
 ) {
 return;
 }

 // ------------------------------------------------
 // START SWING
 // ------------------------------------------------
 bladeSwingStarted =
 true;

 bladeSwingTimer =
 0;

 bladeHitApplied =
 false;

 return;
 }

 // ------------------------------------------------
 // SWING
 // ------------------------------------------------
 if (
 !bladeRecoveryStarted
 ) {
 bladeSwingTimer +=
 delta;

 applyBladeReleaseMotion(
 bladeSwingTimer
 );

 // ------------------------------------------------
 // HIT
 // ------------------------------------------------
 /*
 * 加速カーブにより
 * 時刻50%では刀が中央にいないため、
 * モーション進行度が50%になる時刻を
 * 逆算する。
 */
 const hitNormalizedTime =
 Math.pow(
 0.5,
 1 /
 BLADE_SWING_ACCEL_POWER
 );

 if (
 !bladeHitApplied &&
 bladeSwingTimer >=
 BLADE_SWING_DURATION *
 hitNormalizedTime
 ) {
 applyBladeHit();

 bladeHitApplied =
 true;
 }

 // ------------------------------------------------
 // RECOVERY START
 // ------------------------------------------------
 if (
 bladeSwingTimer >=
 BLADE_SWING_DURATION
 ) {
 bladeRecoveryStarted =
 true;

 bladeRecoveryTimer =
 0;
 }

 return;
 }

 // ------------------------------------------------
 // RECOVERY
 // ------------------------------------------------
 bladeRecoveryTimer +=
 delta;

 applyBladeRecoveryMotion(
 bladeRecoveryTimer
 );

 // ------------------------------------------------
 // FINISH
 // ------------------------------------------------
 if (
 bladeRecoveryTimer >=
 BLADE_RECOVERY_DURATION
 ) {
 attacking =
 false;

 attackTimer =
 0;

 bladeSwingTimer =
 0;

 bladeRecoveryTimer =
 0;

 bladeSwingStarted =
 false;

 bladeRecoveryStarted =
 false;

 bladeAttackReleased =
 false;

 resetBladeSwing(
 leftBlade
 );

 resetBladeSwing(
 rightBlade
 );
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
 // --------------------------------------------------
 // CHECK
 // --------------------------------------------------
 if (
  dead ||
  wallStunTimer > 0
 ) {
  return false;
 }

 // --------------------------------------------------
 // LAUNCH VELOCITY
 // --------------------------------------------------
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

 // --------------------------------------------------
 // STATE
 // --------------------------------------------------
 anchor.state =
  "FIRING";

 anchor.connected =
  false;

 // --------------------------------------------------
 // TARGET
 // --------------------------------------------------
 /*
  * 発射時点で接続予定地点を固定。
  */
 anchor.targetPoint.copy(
  point
 );

 anchor.target =
  target;

 // --------------------------------------------------
 // LAUNCH POSITION
 // --------------------------------------------------
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

 // --------------------------------------------------
 // PROJECTILE MESH
 // --------------------------------------------------
 if (
  anchor.projectileMesh
 ) {
  anchor.projectileMesh
  .position
  .copy(
   wireVisualStart
  );

  anchor.projectileMesh.visible =
   true;
 }

 // --------------------------------------------------
 // PULL STATE
 // --------------------------------------------------
 anchor.pulling =
  false;

 anchor.impulseApplied =
  false;

 anchor.ropeLocked =
  false;

 // --------------------------------------------------
 // WIRE
 // --------------------------------------------------
 anchor.wire.visible =
  true;

 // --------------------------------------------------
 // BLADE / HAND RECOIL
 // --------------------------------------------------
 /*
  * 本当にアンカー射出へ
  * 成功した場合だけ反動。
  *
  * 左アンカー → 左手
  * 右アンカー → 右手
  */
 triggerBladeAnchorRecoil(
  anchor.side
 );

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
// WIRE DISTANCE BOOST
// ==================================================
function getWireDistanceBoost(
 anchor
) {
 // --------------------------------------------------
 // DISTANCE
 // --------------------------------------------------
 const distanceUnits =
  camera.position.distanceTo(
   anchor.point
  );

 const distanceMeters =
  distanceUnits *
  METERS_PER_UNIT;

 // --------------------------------------------------
 // NORMALIZE
 // --------------------------------------------------
 const range =
  WIRE_BOOST_MAX_DISTANCE_METERS -
  WIRE_BOOST_MIN_DISTANCE_METERS;

 let t =
  (
   distanceMeters -
   WIRE_BOOST_MIN_DISTANCE_METERS
  ) /
  range;

 t =
  THREE.MathUtils.clamp(
   t,
   0,
   1
  );

 /*
  * 最初は緩やか、
  * 遠距離で強くなる。
  */
 t =
  t *
  t *
  (
   3 -
   2 *
   t
  );

 // --------------------------------------------------
 // INITIAL IMPULSE
 // --------------------------------------------------
 const initialMultiplier =
  THREE.MathUtils.lerp(
   1,
   WIRE_INITIAL_MAX_MULTIPLIER,
   t
  );

 // --------------------------------------------------
 // ACCELERATION
 // --------------------------------------------------
 const accelerationMultiplier =
  THREE.MathUtils.lerp(
   1,
   WIRE_ACCEL_MAX_MULTIPLIER,
   t
  );

 return {
  distanceMeters,
  initialMultiplier,
  accelerationMultiplier
 };
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
 // SHIFT = ROPE LOCK
 // --------------------------------------------------
 const shiftHeld =
  keys["ShiftLeft"] ||
  keys["ShiftRight"];

 if (shiftHeld) {
  /*
   * Shiftを押した瞬間の
   * ロープ長を保存。
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
   * ロープ拘束のみ。
   * ガス牽引はしない。
   */
  anchor.pulling =
   false;

  anchor.impulseApplied =
   false;

  return;
 }

 // --------------------------------------------------
 // RELEASE ROPE LOCK
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
 // DISTANCE BOOST
 // --------------------------------------------------
 const boost =
  getWireDistanceBoost(
   anchor
  );

 // --------------------------------------------------
 // INITIAL IMPULSE
 // --------------------------------------------------
 if (
  !anchor.impulseApplied
 ) {
  velocity.addScaledVector(
   wireDirection,

   WIRE_INITIAL_IMPULSE *
   boost.initialMultiplier
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
  boost.accelerationMultiplier *
  delta
 );

 // --------------------------------------------------
 // SAFETY
 // --------------------------------------------------
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

// --------------------------------------------------
// ROOF HEIGHT
// --------------------------------------------------
function getRoofSurfaceHeight(
 roof,
 worldX,
 worldZ
) {
 // ------------------------------------------------
 // WORLD OFFSET
 // ------------------------------------------------
 const dx =
 worldX -
 roof.x;

 const dz =
 worldZ -
 roof.z;

 // ------------------------------------------------
 // WORLD -> HOUSE LOCAL
 // ------------------------------------------------
 const cos =
 Math.cos(
 roof.rotation
 );

 const sin =
 Math.sin(
 roof.rotation
 );

 const localX =
 dx *
 cos -
 dz *
 sin;

 const localZ =
 dx *
 sin +
 dz *
 cos;

 // ------------------------------------------------
 // BOUNDS
 // ------------------------------------------------
 if (
 Math.abs(
 localX
 ) >
 roof.halfWidth +
 PLAYER_RADIUS
 ) {
 return null;
 }

 if (
 Math.abs(
 localZ
 ) >
 roof.halfDepth +
 PLAYER_RADIUS
 ) {
 return null;
 }

 // ------------------------------------------------
 // SLOPE
 // ------------------------------------------------
 const normalized =
 1 -
 Math.abs(
 localX
 ) /
 roof.halfWidth;

 const heightFactor =
 THREE.MathUtils.clamp(
 normalized,
 0,
 1
 );

 return (
 roof.baseY +
 roof.height *
 heightFactor
 );
}

// ==================================================
// RING WALL COLLISION
// ==================================================
function collidesRingWall(
 position
) {
 // --------------------------------------------------
 // ABOVE WALL
 // --------------------------------------------------
 const feet =
 position.y -
 PLAYER_HEIGHT;

 if (
 feet >=
 CITY_WALL_HEIGHT
 ) {
 return false;
 }

 // --------------------------------------------------
 // DISTANCE FROM WORLD CENTER
 // --------------------------------------------------
 const radialDistance =
 Math.hypot(
 position.x,
 position.z
 );

 // --------------------------------------------------
 // WALL RINGS
 // --------------------------------------------------
 for (
 const ring
 of wallRings
 ) {
 const collisionThickness =
 ring.thickness /
 2 +
 PLAYER_RADIUS;

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

// --------------------------------------------------
// COLLIDES
// --------------------------------------------------
function collides(
 position
) {
 // --------------------------------------------------
 // NEARBY OBJECTS
 // --------------------------------------------------
 const nearby =
 getNearbyColliders(
 position
 );

 for (
 const box
 of nearby
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

 // --------------------------------------------------
 // RING WALLS
 // --------------------------------------------------
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
 if (
 grounded
 ) {
 velocity.x =
 0;
 } else {
 const impact =
 velocity.x;

 const kmh =
 speedToKmh(
 impact
 );

 const normalX =
 impact >
 0
 ? -1
 : 1;

 const angleWallJump =
 canWallJumpByAngle(
 velocity.x,
 velocity.z,
 normalX,
 0
 );

 if (
 wallStunTimer >
 0
 ) {
 velocity.x =
 0;
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

 if (
 !dead
 ) {
 applyWallStun(
 kmh
 );
 }

 velocity.x =
 0;

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
 if (
 grounded
 ) {
 velocity.z =
 0;
 } else {
 const impact =
 velocity.z;

 const kmh =
 speedToKmh(
 impact
 );

 const normalZ =
 impact >
 0
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
 wallStunTimer >
 0
 ) {
 velocity.z =
 0;
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

 if (
 !dead
 ) {
 applyWallStun(
 kmh
 );
 }

 velocity.z =
 0;

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

 // --------------------------------------------------
 // TERRAIN HEIGHT
 // --------------------------------------------------
 const groundHeightMeters =
 getTerrainHeightMeters(
 camera.position.x *
 METERS_PER_UNIT,
 camera.position.z *
 METERS_PER_UNIT
 );

 const groundHeight =
 groundHeightMeters /
 METERS_PER_UNIT;

 const playerGroundY =
 groundHeight +
 PLAYER_HEIGHT;

 // --------------------------------------------------
 // ROOF SURFACE
 // --------------------------------------------------
 /*
  * 屋根上では毎フレーム
  * 現在XZ位置の正確な屋根高さを求める。
  */
 const nearbyRoofs =
 getNearbyRoofColliders(
 camera.position
 );

 let roofSurfaceY =
 -Infinity;

 for (
 const roof
 of nearbyRoofs
 ) {
 const roofY =
 getRoofSurfaceHeight(
 roof,
 camera.position.x,
 camera.position.z
 );

 if (
 roofY ===
 null
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
  * 上から屋根を横切った。
  */
 const crossedRoof =
 oldFeet >=
 roofY &&
 newFeet <=
 roofY;

 /*
  * 既に屋根へ接地している。
  *
  * 重力による微小な上下動を
  * ここで吸収する。
  */
 const standingOnRoof =
 grounded &&
 Math.abs(
 oldFeet -
 roofY
 ) <=
 0.35;

 if (
 (
 crossedRoof ||
 standingOnRoof
 ) &&
 roofY >
 roofSurfaceY
 ) {
 roofSurfaceY =
 roofY;
 }
 }

 // --------------------------------------------------
 // ROOF LANDING / FOLLOW
 // --------------------------------------------------
 if (
 roofSurfaceY >
 -Infinity &&
 velocity.y <=
 0
 ) {
 /*
  * 実際に落下してきた場合だけ
  * 衝突ダメージを出す。
  *
  * 既に立っている時には
  * 毎フレームDamageを出さない。
  */
 const oldFeet =
 oldY -
 PLAYER_HEIGHT;

 if (
 oldFeet >
 roofSurfaceY +
 0.35
 ) {
 damageFromImpact(
 velocity.y,
 "building"
 );
 }

 if (
 dead
 ) {
 return;
 }

 camera.position.y =
 roofSurfaceY +
 PLAYER_HEIGHT;

 velocity.y =
 0;

 grounded =
 true;

 return;
 }

 // --------------------------------------------------
 // TERRAIN LANDING
 // --------------------------------------------------
 if (
 next.y <=
 playerGroundY
 ) {
 if (
 velocity.y <
 0
 ) {
 damageFromImpact(
 velocity.y,
 "ground"
 );
 }

 if (
 dead
 ) {
 return;
 }

 camera.position.y =
 playerGroundY;

 velocity.y =
 0;

 grounded =
 true;

 return;
 }

 // --------------------------------------------------
 // LAND ON RING WALL
 // --------------------------------------------------
 if (
 velocity.y <=
 0
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

 if (
 oldFeet >=
 CITY_WALL_HEIGHT &&
 newFeet <=
 CITY_WALL_HEIGHT
 ) {
 damageFromImpact(
 velocity.y,
 "stone"
 );

 if (
 dead
 ) {
 return;
 }

 camera.position.y =
 CITY_WALL_HEIGHT +
 PLAYER_HEIGHT;

 velocity.y =
 0;

 grounded =
 true;

 return;
 }
 }
 }

 // --------------------------------------------------
 // NEARBY BUILDINGS
 // --------------------------------------------------
 const nearbyColliders =
 getNearbyColliders(
 camera.position
 );

 // --------------------------------------------------
 // NORMAL MOVEMENT
 // --------------------------------------------------
 if (
 !collides(
 next
 )
 ) {
 camera.position.y =
 next.y;

 grounded =
 false;

 return;
 }

 // --------------------------------------------------
 // BUILDING TOP
 // --------------------------------------------------
 if (
 velocity.y <=
 0
 ) {
 for (
 const box
 of nearbyColliders
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
 velocity.y,
 "building"
 );

 if (
 dead
 ) {
 return;
 }

 camera.position.y =
 box.max.y +
 PLAYER_HEIGHT;

 velocity.y =
 0;

 grounded =
 true;

 return;
 }
 }
 }

 // --------------------------------------------------
 // CEILING
 // --------------------------------------------------
 damageFromImpact(
 velocity.y,
 "building"
 );

 velocity.y =
 0;
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
// SETTINGS HUD
// ==================================================
const settingsHUD =
 document.createElement(
 "div"
 );

Object.assign(
 settingsHUD.style,
 {
 position: "fixed",
 inset: "0",
 display: "none",
 alignItems: "center",
 justifyContent: "center",
 background:
 "rgba(0,0,0,.78)",
 color: "white",
 fontFamily:
 "Arial",
 zIndex: "11000"
 }
);

// --------------------------------------------------
// PANEL
// --------------------------------------------------
const settingsPanel =
 document.createElement(
 "div"
 );

Object.assign(
 settingsPanel.style,
 {
 width: "440px",
 padding: "32px",
 background:
 "rgba(25,30,28,.98)",
 border:
 "1px solid #777",
 borderRadius:
 "8px"
 }
);

settingsHUD.appendChild(
 settingsPanel
);

// --------------------------------------------------
// TITLE
// --------------------------------------------------
const settingsTitle =
 document.createElement(
 "div"
 );

settingsTitle.textContent =
 "SETTINGS";

Object.assign(
 settingsTitle.style,
 {
 fontSize: "32px",
 fontWeight: "bold",
 marginBottom: "32px"
 }
);

settingsPanel.appendChild(
 settingsTitle
);

// --------------------------------------------------
// RENDER DISTANCE SECTION
// --------------------------------------------------
const renderDistanceSection =
 document.createElement(
 "div"
 );

settingsPanel.appendChild(
 renderDistanceSection
);

// --------------------------------------------------
// LABEL ROW
// --------------------------------------------------
const renderDistanceLabelRow =
 document.createElement(
 "div"
 );

Object.assign(
 renderDistanceLabelRow.style,
 {
 display: "flex",
 justifyContent: "space-between",
 alignItems: "center",
 marginBottom: "12px"
 }
);

renderDistanceSection.appendChild(
 renderDistanceLabelRow
);

const renderDistanceLabel =
 document.createElement(
 "div"
 );

renderDistanceLabel.textContent =
 "RENDER DISTANCE";

Object.assign(
 renderDistanceLabel.style,
 {
 fontSize: "16px",
 fontWeight: "bold"
 }
);

renderDistanceLabelRow.appendChild(
 renderDistanceLabel
);

// --------------------------------------------------
// VALUE
// --------------------------------------------------
const renderDistanceValue =
 document.createElement(
 "div"
 );

renderDistanceValue.textContent =
 `${renderDistanceKm.toFixed(
 1
 )} km`;

Object.assign(
 renderDistanceValue.style,
 {
 color: "#9fd3a5",
 fontFamily: "monospace",
 fontSize: "17px",
 fontWeight: "bold"
 }
);

renderDistanceLabelRow.appendChild(
 renderDistanceValue
);

// --------------------------------------------------
// SLIDER
// --------------------------------------------------
const renderDistanceInput =
 document.createElement(
 "input"
 );

renderDistanceInput.type =
 "range";

renderDistanceInput.min =
 "0.5";

renderDistanceInput.max =
 "5";

renderDistanceInput.step =
 "0.5";

renderDistanceInput.value =
 String(
 renderDistanceKm
 );

Object.assign(
 renderDistanceInput.style,
 {
 width: "100%",
 cursor: "pointer",
 accentColor: "#6ca56c"
 }
);

renderDistanceSection.appendChild(
 renderDistanceInput
);

// --------------------------------------------------
// RANGE INFO
// --------------------------------------------------
const renderDistanceInfo =
 document.createElement(
 "div"
 );

renderDistanceInfo.textContent =
 "0.5 km                       5.0 km";

Object.assign(
 renderDistanceInfo.style,
 {
 marginTop: "6px",
 color: "#777",
 fontFamily: "monospace",
 fontSize: "12px",
 whiteSpace: "pre"
 }
);

renderDistanceSection.appendChild(
 renderDistanceInfo
);

// --------------------------------------------------
// PERFORMANCE INFO
// --------------------------------------------------
const renderDistancePerformance =
 document.createElement(
 "div"
 );

renderDistancePerformance.textContent =
 "都市部では 0.5 - 1.5 km 推奨";

Object.assign(
 renderDistancePerformance.style,
 {
 marginTop: "16px",
 padding: "10px 12px",
 color: "#c9c9c9",
 background:
 "rgba(255,255,255,.04)",
 borderLeft:
 "3px solid #6ca56c",
 fontSize: "13px"
 }
);

renderDistanceSection.appendChild(
 renderDistancePerformance
);

// --------------------------------------------------
// HELP
// --------------------------------------------------
const settingsHelp =
 document.createElement(
 "div"
 );

settingsHelp.textContent =
 "ESC : CLOSE";

Object.assign(
 settingsHelp.style,
 {
 marginTop: "30px",
 color: "#aaa",
 fontFamily:
 "monospace",
 fontSize: "14px"
 }
);

settingsPanel.appendChild(
 settingsHelp
);

document.body.appendChild(
 settingsHUD
);

// ==================================================
// MAIN MENU
// ==================================================
const mainMenuHUD =
 document.createElement(
 "div"
 );

Object.assign(
 mainMenuHUD.style,
 {
 position: "fixed",
 inset: "0",
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 background:
 "linear-gradient(180deg, #18251d 0%, #090d0a 100%)",
 color: "white",
 fontFamily:
 "Arial, sans-serif",
 zIndex: "60000"
 }
);

document.body.appendChild(
 mainMenuHUD
);

// --------------------------------------------------
// PANEL
// --------------------------------------------------
const mainMenuPanel =
 document.createElement(
 "div"
 );

Object.assign(
 mainMenuPanel.style,
 {
 width: "520px",
 textAlign: "center"
 }
);

mainMenuHUD.appendChild(
 mainMenuPanel
);

// --------------------------------------------------
// TITLE
// --------------------------------------------------
const mainMenuTitle =
 document.createElement(
 "div"
 );

mainMenuTitle.textContent =
 "PARADIS";

Object.assign(
 mainMenuTitle.style,
 {
 fontSize: "64px",
 fontWeight: "bold",
 letterSpacing: "8px",
 marginBottom: "8px",
 textShadow:
 "0 4px 14px rgba(0,0,0,.8)"
 }
);

mainMenuPanel.appendChild(
 mainMenuTitle
);

// --------------------------------------------------
// SUBTITLE
// --------------------------------------------------
const mainMenuSubtitle =
 document.createElement(
 "div"
 );

mainMenuSubtitle.textContent =
 "3D MANEUVER GAME";

Object.assign(
 mainMenuSubtitle.style,
 {
 color: "#aeb9ae",
 fontFamily: "monospace",
 fontSize: "16px",
 letterSpacing: "4px",
 marginBottom: "55px"
 }
);

mainMenuPanel.appendChild(
 mainMenuSubtitle
);

// --------------------------------------------------
// BUTTON CONTAINER
// --------------------------------------------------
const mainMenuButtons =
 document.createElement(
 "div"
 );

Object.assign(
 mainMenuButtons.style,
 {
 display: "flex",
 flexDirection: "column",
 gap: "14px"
 }
);

mainMenuPanel.appendChild(
 mainMenuButtons
);

// --------------------------------------------------
// BUTTON FACTORY
// --------------------------------------------------
function createMainMenuButton(
 text,
 onClick,
 options = {}
) {
 const button =
 document.createElement(
 "button"
 );

 button.textContent =
 text;

 Object.assign(
 button.style,
 {
 width: "100%",
 padding: "17px 20px",
 color:
 options.disabled
 ? "#777"
 : "white",
 background:
 options.disabled
 ? "rgba(255,255,255,.035)"
 : "rgba(255,255,255,.08)",
 border:
 options.disabled
 ? "1px solid #444"
 : "1px solid #777",
 borderRadius: "4px",
 fontFamily: "Arial",
 fontSize: "19px",
 fontWeight: "bold",
 letterSpacing: "2px",
 cursor:
 options.disabled
 ? "default"
 : "pointer",
 transition:
 "background .15s, border-color .15s"
 }
 );

 if (
 !options.disabled
 ) {
 button.addEventListener(
 "mouseenter",
 () => {
 button.style.background =
 "rgba(130,170,130,.25)";
 button.style.borderColor =
 "#9fbd9f";
 }
 );

 button.addEventListener(
 "mouseleave",
 () => {
 button.style.background =
 "rgba(255,255,255,.08)";
 button.style.borderColor =
 "#777";
 }
 );

 button.addEventListener(
 "click",
 onClick
 );
 }

 mainMenuButtons.appendChild(
 button
 );

 return button;
}

// --------------------------------------------------
// STATE
// --------------------------------------------------
let mainMenuOpen =
 true;
let openWorldStarting =
 false;

// --------------------------------------------------
// OPEN WORLD
// --------------------------------------------------
const openWorldButton =
 createMainMenuButton(
 "OPEN WORLD",
 async () => {
 if (
 openWorldStarting
 ) {
 return;
 }

 openWorldStarting =
 true;

 openWorldButton.disabled =
 true;

 openWorldButton.textContent =
 "STARTING...";

 await startOpenWorld();
 }
);

// --------------------------------------------------
// MINI GAMES
// --------------------------------------------------
createMainMenuButton(
 "MINI GAMES",
 () => {
 showMessage(
 "MINI GAMES - COMING SOON"
 );
 },
 {
 disabled: true
 }
);

// --------------------------------------------------
// SETTINGS
// --------------------------------------------------
createMainMenuButton(
 "SETTINGS",
 () => {
 openSettings();
 }
);

// --------------------------------------------------
// FOOTER
// --------------------------------------------------
const mainMenuFooter =
 document.createElement(
 "div"
 );

mainMenuFooter.textContent =
 "SELECT GAME MODE";

Object.assign(
 mainMenuFooter.style,
 {
 marginTop: "35px",
 color: "#697469",
 fontFamily: "monospace",
 fontSize: "12px",
 letterSpacing: "2px"
 }
);

mainMenuPanel.appendChild(
 mainMenuFooter
);

// --------------------------------------------------
// SHOW MENU
// --------------------------------------------------
function showMainMenu() {
 mainMenuOpen =
 true;

 mainMenuHUD.style.display =
 "flex";

 if (
 document.pointerLockElement
 ) {
 document.exitPointerLock();
 }
}

// --------------------------------------------------
// HIDE MENU
// --------------------------------------------------
function hideMainMenu() {
 mainMenuOpen =
 false;

 mainMenuHUD.style.display =
 "none";
}

// ==================================================
// WORLD LOADING HUD
// ==================================================
const worldLoadingHUD =
 document.createElement(
  "div"
 );

Object.assign(
 worldLoadingHUD.style,
 {
  position: "fixed",
  inset: "0",

  display: "flex",

  alignItems: "center",
  justifyContent: "center",

  background:
   "#0b100d",

  color: "white",

  fontFamily:
   "Arial, sans-serif",

  zIndex: "50000"
 }
);

// --------------------------------------------------
// PANEL
// --------------------------------------------------
const worldLoadingPanel =
 document.createElement(
  "div"
 );

Object.assign(
 worldLoadingPanel.style,
 {
  width: "520px",

  textAlign: "center"
 }
);

worldLoadingHUD.appendChild(
 worldLoadingPanel
);

// --------------------------------------------------
// TITLE
// --------------------------------------------------
const worldLoadingTitle =
 document.createElement(
  "div"
 );

worldLoadingTitle.textContent =
 "PARADIS ISLAND";

Object.assign(
 worldLoadingTitle.style,
 {
  fontSize: "42px",

  fontWeight: "bold",

  letterSpacing: "3px",

  marginBottom: "25px"
 }
);

worldLoadingPanel.appendChild(
 worldLoadingTitle
);

// --------------------------------------------------
// STATUS
// --------------------------------------------------
const worldLoadingStatus =
 document.createElement(
  "div"
 );

worldLoadingStatus.textContent =
 "PREPARING WORLD...";

Object.assign(
 worldLoadingStatus.style,
 {
  color: "#ccc",

  fontFamily: "monospace",

  fontSize: "17px",

  marginBottom: "20px"
 }
);

worldLoadingPanel.appendChild(
 worldLoadingStatus
);

// --------------------------------------------------
// BAR BACKGROUND
// --------------------------------------------------
const worldLoadingBarBackground =
 document.createElement(
  "div"
 );

Object.assign(
 worldLoadingBarBackground.style,
 {
  width: "100%",
  height: "12px",

  background:
   "#202820",

  border:
   "1px solid #536253",

  overflow: "hidden"
 }
);

worldLoadingPanel.appendChild(
 worldLoadingBarBackground
);

// --------------------------------------------------
// BAR
// --------------------------------------------------
const worldLoadingBar =
 document.createElement(
  "div"
 );

Object.assign(
 worldLoadingBar.style,
 {
  width: "0%",
  height: "100%",

  background:
   "#6ca56c",

  transition:
   "width .15s"
 }
);

worldLoadingBarBackground.appendChild(
 worldLoadingBar
);

// --------------------------------------------------
// DETAILS
// --------------------------------------------------
const worldLoadingDetails =
 document.createElement(
  "div"
 );

Object.assign(
 worldLoadingDetails.style,
 {
  marginTop: "18px",

  color: "#8f9b8f",

  fontFamily: "monospace",

  fontSize: "14px",

  whiteSpace: "pre"
 }
);

worldLoadingPanel.appendChild(
 worldLoadingDetails
);

document.body.appendChild(
 worldLoadingHUD
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
 // DESTINATION
 // ------------------------------------------------
 const xUnits =
  metersToUnits(
   point.xMeters
  );

 const zUnits =
  metersToUnits(
   point.zMeters
  );

 /*
  * TP先の地形高度。
  */
 const terrainHeightMeters =
  getTerrainHeightMeters(
   point.xMeters,
   point.zMeters
  );

 const terrainY =
  metersToUnits(
   terrainHeightMeters
  );

 // ------------------------------------------------
 // MOVE PLAYER
 // ------------------------------------------------
 camera.position.set(
  xUnits,

  terrainY +
  PLAYER_HEIGHT,

  zUnits
 );

 // ------------------------------------------------
 // RESET AREA SYSTEM
 // ------------------------------------------------
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
 // CLEAR OLD GENERATION QUEUE
 // ------------------------------------------------
 chunkGenerationQueue.length =
  0;

 queuedChunks.clear();

 chunkRequestTimer =
  0;

 // ------------------------------------------------
 // FORCE LOAD DESTINATION
 // ------------------------------------------------
 /*
  * 中心500mチャンクは
  * TP直後に同期生成。
  */
 forceLoadCurrentChunk();

 /*
  * 周辺チャンクは次の
  * streaming updateから
  * 優先生成される。
  */
 requestWorldChunks();

 // ------------------------------------------------
 // CLOSE MENU
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
 // CATEGORY
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
    color:
     "#ffcc66",

    fontSize:
     "22px",

    fontWeight:
     "bold",

    marginBottom:
     "8px"
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
     display:
      "block",

     width:
      "100%",

     marginBottom:
      "6px",

     padding:
      "12px 16px",

     color:
      "white",

     background:
      "rgba(255,255,255,.08)",

     border:
      "1px solid #777",

     borderRadius:
      "5px",

     fontSize:
      "18px",

     textAlign:
      "left",

     cursor:
      "pointer"
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

 if (
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

 // ------------------------------------------------
 // CLEAR INPUT
 // ------------------------------------------------
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

// ==================================================
// MAP COLORS
// ==================================================
const WORLD_MAP_COLORS = {

 // --------------------------------------------------
 // TERRAIN
 // --------------------------------------------------
 background:
  "#75985d",

 grass:
  "#829f68",

 // --------------------------------------------------
 // FOREST
 // --------------------------------------------------
 forest:
  "rgba(42,89,45,.68)",

 giantForest:
  "rgba(20,66,32,.80)",

 forestOutline:
  "rgba(27,70,34,.95)",

 // --------------------------------------------------
 // CITY
 // --------------------------------------------------
 district:
  "rgba(190,168,126,.28)",

 districtOutline:
  "rgba(225,208,170,.85)",

 village:
  "rgba(184,158,112,.40)",

 // --------------------------------------------------
 // BUILDINGS
 // --------------------------------------------------
 building:
  "#d8c39a",

 buildingOutline:
  "#806c4e",

 // --------------------------------------------------
 // ROAD
 // --------------------------------------------------
 road:
  "#806f59",

 // --------------------------------------------------
 // WALL
 // --------------------------------------------------
 wall:
  "#ddd7c8",

 wallShadow:
  "rgba(40,40,35,.55)",

 // --------------------------------------------------
 // LABEL
 // --------------------------------------------------
 label:
  "#ffffff",

 labelShadow:
  "rgba(0,0,0,.85)",

 // --------------------------------------------------
 // PLAYER
 // --------------------------------------------------
 player:
  "#29b6f6",

 playerOutline:
  "#ffffff",

 // --------------------------------------------------
 // TP
 // --------------------------------------------------
 teleport:
  "#ffca55",

 // --------------------------------------------------
 // CHUNK
 // --------------------------------------------------
 chunk:
  "rgba(255,255,255,.13)",

 chunkText:
  "rgba(255,255,255,.38)"
};

// ==================================================
// RESIZE MAP
// ==================================================
function resizeWorldMapCanvas() {
 worldMapCanvas.width =
  window.innerWidth;

 worldMapCanvas.height =
  window.innerHeight;

 drawWorldMap();
}

// ==================================================
// BASE SCALE
// ==================================================
function getWorldMapBaseScale() {
 const database =
  getActiveWorldDatabase();

 const maria =
  database?.walls?.maria ??
  WORLD_MAP.walls.maria;

 const mariaRadius =
  maria.radiusMeters;

 const availableSize =
  Math.min(
   window.innerWidth,
   window.innerHeight
  ) *
  0.78;

 return (
  availableSize /
  (
   mariaRadius *
   2
  )
 );
}

// ==================================================
// WORLD TO MAP
// ==================================================
function worldToMap(
 xMeters,
 zMeters
) {
 const scale =
  getWorldMapBaseScale() *
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

// ==================================================
// MAP TO WORLD
// ==================================================
function mapToWorld(
 screenX,
 screenY
) {
 const scale =
  getWorldMapBaseScale() *
  worldMapZoom;

 return {
  xMeters:
   (
    screenX -
    window.innerWidth /
    2 -
    worldMapPanX
   ) /
   scale,

  zMeters:
   (
    screenY -
    window.innerHeight /
    2 -
    worldMapPanY
   ) /
   scale
 };
}

// ==================================================
// VISIBILITY HELPERS
// ==================================================
function mapCircleVisible(
 xMeters,
 zMeters,
 radiusMeters
) {
 const center =
  worldToMap(
   xMeters,
   zMeters
  );

 const radius =
  radiusMeters *
  center.scale;

 return (
  center.x +
  radius >= 0 &&

  center.x -
  radius <=
  window.innerWidth &&

  center.y +
  radius >= 0 &&

  center.y -
  radius <=
  window.innerHeight
 );
}

function mapPointVisible(
 x,
 y,
 padding = 40
) {
 return (
  x >=
  -padding &&

  x <=
  window.innerWidth +
  padding &&

  y >=
  -padding &&

  y <=
  window.innerHeight +
  padding
 );
}

// ==================================================
// DRAW LABEL
// ==================================================
function drawWorldMapLabel(
 text,
 x,
 y,
 options = {}
) {
 const size =
  options.size ??
  14;

 const color =
  options.color ??
  WORLD_MAP_COLORS.label;

 const align =
  options.align ??
  "center";

 worldMapContext.save();

 worldMapContext.font =
  `${
   options.bold === false
   ? ""
   : "bold "
  }${size}px Arial`;

 worldMapContext.textAlign =
  align;

 worldMapContext.textBaseline =
  "middle";

 worldMapContext.lineWidth =
  4;

 worldMapContext.strokeStyle =
  WORLD_MAP_COLORS
  .labelShadow;

 worldMapContext.strokeText(
  text,
  x,
  y
 );

 worldMapContext.fillStyle =
  color;

 worldMapContext.fillText(
  text,
  x,
  y
 );

 worldMapContext.restore();
}

// ==================================================
// DRAW WALL
// ==================================================
function drawDatabaseWall(
 wall
) {
 const center =
  worldToMap(
   0,
   0
  );

 const radius =
  wall.radiusMeters *
  center.scale;

 // --------------------------------------------------
 // SHADOW
 // --------------------------------------------------
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
  WORLD_MAP_COLORS
  .wallShadow;

 worldMapContext.lineWidth =
  Math.max(
   4,
   8 *
   Math.min(
    worldMapZoom,
    2
   )
  );

 worldMapContext.stroke();

 // --------------------------------------------------
 // WALL
 // --------------------------------------------------
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
  WORLD_MAP_COLORS.wall;

 worldMapContext.lineWidth =
  Math.max(
   2,
   4 *
   Math.min(
    worldMapZoom,
    2
   )
  );

 worldMapContext.stroke();
}

// ==================================================
// DRAW DISTRICTS
// ==================================================
function drawDatabaseDistricts(
 database
) {
 const districts =
 Array.isArray(
 database.districts
 )
 ? database.districts
 : [];

 /*
 * 城壁外へ張り出す
 * 円形城塞区域。
 *
 * 半径5km。
 */
 const DISPLAY_DISTRICT_RADIUS_METERS =
 5000;

 for (
 const district
 of districts
 ) {
 if (
 !Number.isFinite(
 district.xMeters
 ) ||
 !Number.isFinite(
 district.zMeters
 )
 ) {
 continue;
 }

 const radiusMeters =
 DISPLAY_DISTRICT_RADIUS_METERS;

 if (
 !mapCircleVisible(
 district.xMeters,
 district.zMeters,
 radiusMeters
 )
 ) {
 continue;
 }

 const position =
 worldToMap(
 district.xMeters,
 district.zMeters
 );

 const radius =
 radiusMeters *
 position.scale;

 // ------------------------------------------------
 // DISTRICT AREA
 // ------------------------------------------------
 worldMapContext.beginPath();

 worldMapContext.arc(
 position.x,
 position.y,
 radius,
 0,
 Math.PI *
 2
 );

 worldMapContext.fillStyle =
 WORLD_MAP_COLORS
 .district;

 worldMapContext.fill();

 worldMapContext.strokeStyle =
 WORLD_MAP_COLORS
 .districtOutline;

 worldMapContext.lineWidth =
 Math.max(
 1.5,
 Math.min(
 4,
 worldMapZoom *
 0.15
 )
 );

 worldMapContext.stroke();

 // ------------------------------------------------
 // CONNECTION TO WALL
 // ------------------------------------------------
 /*
 * 城塞区域の中心から
 * 世界中心方向へ短い接続線。
 *
 * 「壁から張り出している」
 * ことを地図上で分かりやすくする。
 */
 const distance =
 Math.hypot(
 district.xMeters,
 district.zMeters
 );

 if (
 distance >
 0.001
 ) {
 const nx =
 district.xMeters /
 distance;

 const nz =
 district.zMeters /
 distance;

 const inner =
 worldToMap(
 district.xMeters -
 nx *
 radiusMeters,
 district.zMeters -
 nz *
 radiusMeters
 );

 worldMapContext.beginPath();

 worldMapContext.moveTo(
 position.x,
 position.y
 );

 worldMapContext.lineTo(
 inner.x,
 inner.y
 );

 worldMapContext.strokeStyle =
 WORLD_MAP_COLORS.wall;

 worldMapContext.lineWidth =
 2;

 worldMapContext.stroke();
 }

 // ------------------------------------------------
 // LABEL
 // ------------------------------------------------
 if (
 worldMapZoom >=
 0.65
 ) {
 drawWorldMapLabel(
 district.name,
 position.x,
 position.y,
 {
 size:
 worldMapZoom >=
 3
 ? 16
 : 13,

 color:
 "#fff0cd"
 }
 );
 }
 }
}

// ==================================================
// DRAW VILLAGES
// ==================================================
function drawDatabaseVillages(
 database
) {
 for (
  const village
  of database.villages
 ) {
  if (
   !mapCircleVisible(
    village.xMeters,
    village.zMeters,
    village.radiusMeters
   )
  ) {
   continue;
  }

  const position =
   worldToMap(
    village.xMeters,
    village.zMeters
   );

  const radius =
   Math.max(
    4,
    village.radiusMeters *
    position.scale
   );

  worldMapContext.beginPath();

  worldMapContext.arc(
   position.x,
   position.y,
   radius,
   0,
   Math.PI *
   2
  );

  worldMapContext.fillStyle =
   WORLD_MAP_COLORS
   .village;

  worldMapContext.fill();

  if (
   worldMapZoom >=
   1.5
  ) {
   drawWorldMapLabel(
    village.name,
    position.x,
    position.y -
    radius -
    9,

    {
     size: 13,
     color: "#ffe5b1"
    }
   );
  }
 }
}

// ==================================================
// DRAW FORESTS
// ==================================================
function drawDatabaseForests(
 database
) {
 for (
  const forest
  of database.forests
 ) {
  if (
   !mapCircleVisible(
    forest.xMeters,
    forest.zMeters,
    forest.radiusMeters
   )
  ) {
   continue;
  }

  const position =
   worldToMap(
    forest.xMeters,
    forest.zMeters
   );

  const radius =
   forest.radiusMeters *
   position.scale;

  // ------------------------------------------------
  // AREA
  // ------------------------------------------------
  worldMapContext.beginPath();

  worldMapContext.arc(
   position.x,
   position.y,
   radius,
   0,
   Math.PI *
   2
  );

  worldMapContext.fillStyle =
   forest.type ===
   "giant"
   ? WORLD_MAP_COLORS
     .giantForest
   : WORLD_MAP_COLORS
     .forest;

  worldMapContext.fill();

  worldMapContext.strokeStyle =
   WORLD_MAP_COLORS
   .forestOutline;

  worldMapContext.lineWidth =
   2;

  worldMapContext.stroke();

  // ------------------------------------------------
  // TREE PATTERN
  // ------------------------------------------------
  /*
   * 中距離以上では
   * 木が生えていることが
   * 分かる模様を表示。
   *
   * これは表示専用で、
   * 木の確定座標化は
   * 次の段階で共通Generatorへ移す。
   */
  if (
   worldMapZoom >=
   2
  ) {
   const spacing =
    Math.max(
     18,
     55 /
     Math.sqrt(
      worldMapZoom
     )
    );

   worldMapContext.save();

   worldMapContext.beginPath();

   worldMapContext.arc(
    position.x,
    position.y,
    radius,
    0,
    Math.PI *
    2
   );

   worldMapContext.clip();

   worldMapContext.fillStyle =
    forest.type ===
    "giant"
    ? "rgba(13,46,23,.70)"
    : "rgba(29,70,33,.55)";

   const minX =
    Math.max(
     0,
     position.x -
     radius
    );

   const maxX =
    Math.min(
     window.innerWidth,
     position.x +
     radius
    );

   const minY =
    Math.max(
     0,
     position.y -
     radius
    );

   const maxY =
    Math.min(
     window.innerHeight,
     position.y +
     radius
    );

   for (
    let x = minX;
    x <= maxX;
    x += spacing
   ) {
    for (
     let y = minY;
     y <= maxY;
     y += spacing
    ) {
     /*
      * 規則正しすぎないよう
      * 座標由来の揺らぎ。
      */
     const jitterX =
      Math.sin(
       x *
       12.9898 +
       y *
       78.233
      ) *
      5;

     const jitterY =
      Math.cos(
       x *
       4.123 +
       y *
       17.71
      ) *
      5;

     const px =
      x +
      jitterX;

     const py =
      y +
      jitterY;

     const dx =
      px -
      position.x;

     const dy =
      py -
      position.y;

     if (
      dx *
      dx +
      dy *
      dy >
      radius *
      radius
     ) {
      continue;
     }

     worldMapContext.beginPath();

     worldMapContext.arc(
      px,
      py,

      forest.type ===
      "giant"
      ? 3.5
      : 2.2,

      0,
      Math.PI *
      2
     );

     worldMapContext.fill();
    }
   }

   worldMapContext.restore();
  }

  // ------------------------------------------------
  // NAME
  // ------------------------------------------------
  if (
   worldMapZoom >=
   0.7
  ) {
   drawWorldMapLabel(
    forest.name,
    position.x,
    position.y,

    {
     size:
      worldMapZoom >= 2
      ? 16
      : 13,

     color:
      "#cde8b2"
    }
   );
  }
 }
}

// ==================================================
// DRAW ROADS
// ==================================================
function drawDatabaseRoads(
 database
) {
 if (
  worldMapZoom <
  1.5
 ) {
  return;
 }

 worldMapContext.save();

 worldMapContext.lineCap =
  "round";

 for (
  const road
  of database.roads
 ) {
  const start =
   worldToMap(
    road.x1,
    road.z1
   );

  const end =
   worldToMap(
    road.x2,
    road.z2
   );

  const width =
   Math.max(
    1.5,

    road.widthMeters *
    start.scale
   );

  worldMapContext.beginPath();

  worldMapContext.moveTo(
   start.x,
   start.y
  );

  worldMapContext.lineTo(
   end.x,
   end.y
  );

  worldMapContext.strokeStyle =
   WORLD_MAP_COLORS.road;

  worldMapContext.lineWidth =
   width;

  worldMapContext.stroke();
 }

 worldMapContext.restore();
}

// ==================================================
// WORLD MAP VISIBLE OBJECTS
// ==================================================
/*
 * 現在画面に入っている
 * 500mチャンクだけ取得する。
 */
function getWorldMapVisibleObjects(
 paddingMeters =
 500
) {
 const topLeft =
 mapToWorld(
 0,
 0
 );

 const bottomRight =
 mapToWorld(
 window.innerWidth,
 window.innerHeight
 );

 const chunkSize =
 getFixedWorldChunkSizeMeters();

 const minX =
 Math.min(
 topLeft.xMeters,
 bottomRight.xMeters
 ) -
 paddingMeters;

 const maxX =
 Math.max(
 topLeft.xMeters,
 bottomRight.xMeters
 ) +
 paddingMeters;

 const minZ =
 Math.min(
 topLeft.zMeters,
 bottomRight.zMeters
 ) -
 paddingMeters;

 const maxZ =
 Math.max(
 topLeft.zMeters,
 bottomRight.zMeters
 ) +
 paddingMeters;

 const minChunkX =
 Math.floor(
 minX /
 chunkSize
 );

 const maxChunkX =
 Math.floor(
 maxX /
 chunkSize
 );

 const minChunkZ =
 Math.floor(
 minZ /
 chunkSize
 );

 const maxChunkZ =
 Math.floor(
 maxZ /
 chunkSize
 );

 return getFixedWorldObjectsInChunkRange(
 minChunkX,
 minChunkZ,
 maxChunkX,
 maxChunkZ
 );
}

// ==================================================
// DRAW BUILDINGS
// ==================================================
function drawDatabaseBuildings(
 database
) {
 // --------------------------------------------------
 // ZOOM
 // --------------------------------------------------
 /*
 * 世界が巨大なので、
 * 家一軒表示は100倍から。
 */
 if (
 worldMapZoom <
 100
 ) {
 return;
 }

 // --------------------------------------------------
 // FIXED OBJECTS ONLY
 // --------------------------------------------------
 /*
 * 必ずparadis-world.jsonから
 * 作られたチャンクINDEXを使用。
 *
 * database.buildings等の
 * 旧DBは一切使用しない。
 */
 const objects =
 getWorldMapVisibleObjects(
 1000
 );

 const scale =
 getWorldMapBaseScale() *
 worldMapZoom;

 // --------------------------------------------------
 // DRAW
 // --------------------------------------------------
 for (
 const building
 of objects
 ) {
 if (
 building.type !==
 "house"
 ) {
 continue;
 }

 if (
 !Number.isFinite(
 building.xMeters
 ) ||
 !Number.isFinite(
 building.zMeters
 )
 ) {
 continue;
 }

 const position =
 worldToMap(
 building.xMeters,
 building.zMeters
 );

 if (
 !mapPointVisible(
 position.x,
 position.y,
 60
 )
 ) {
 continue;
 }

 const width =
 Math.max(
 2,
 (
 Number(
 building.widthMeters
 ) ||
 15
 ) *
 scale
 );

 const depth =
 Math.max(
 2,
 (
 Number(
 building.depthMeters
 ) ||
 18
 ) *
 scale
 );

 worldMapContext.save();

 worldMapContext.translate(
 position.x,
 position.y
 );

 worldMapContext.rotate(
 Number(
 building.rotation
 ) ||
 0
 );

 // ------------------------------------------------
 // BUILDING
 // ------------------------------------------------
 worldMapContext.fillStyle =
 WORLD_MAP_COLORS
 .building;

 worldMapContext.fillRect(
 -width /
 2,
 -depth /
 2,
 width,
 depth
 );

 // ------------------------------------------------
 // OUTLINE
 // ------------------------------------------------
 if (
 worldMapZoom >=
 500
 ) {
 worldMapContext.strokeStyle =
 WORLD_MAP_COLORS
 .buildingOutline;

 worldMapContext.lineWidth =
 1;

 worldMapContext.strokeRect(
 -width /
 2,
 -depth /
 2,
 width,
 depth
 );
 }

 worldMapContext.restore();
 }
}

// ==================================================
// DRAW TREES
// ==================================================
function drawDatabaseTrees(
 database
) {
 /*
 * 木一本表示は150倍以上。
 */
 if (
 worldMapZoom <
 150
 ) {
 return;
 }

 const objects =
 getWorldMapVisibleObjects(
 1000
 );

 const scale =
 getWorldMapBaseScale() *
 worldMapZoom;

 for (
 const tree
 of objects
 ) {
 if (
 tree.type !==
 "tree"
 ) {
 continue;
 }

 if (
 !Number.isFinite(
 tree.xMeters
 ) ||
 !Number.isFinite(
 tree.zMeters
 )
 ) {
 continue;
 }

 const position =
 worldToMap(
 tree.xMeters,
 tree.zMeters
 );

 if (
 !mapPointVisible(
 position.x,
 position.y,
 50
 )
 ) {
 continue;
 }

 const radius =
 Math.max(
 tree.giant
 ? 3
 : 1.5,
 (
 Number(
 tree.crownRadiusMeters
 ) ||
 5
 ) *
 scale
 );

 worldMapContext.beginPath();

 worldMapContext.arc(
 position.x,
 position.y,
 radius,
 0,
 Math.PI *
 2
 );

 worldMapContext.fillStyle =
 tree.giant
 ? "#174d25"
 : "#315f31";

 worldMapContext.fill();

 if (
 worldMapZoom >=
 500
 ) {
 worldMapContext.strokeStyle =
 "#173a1d";

 worldMapContext.lineWidth =
 1;

 worldMapContext.stroke();
 }
 }
}

// ==================================================
// DRAW LANDMARKS
// ==================================================
function drawDatabaseLandmarks(
 database
) {
 for (
  const landmark
  of database.landmarks
 ) {
  const position =
   worldToMap(
    landmark.xMeters,
    landmark.zMeters
   );

  if (
   !mapPointVisible(
    position.x,
    position.y
   )
  ) {
   continue;
  }

  // ------------------------------------------------
  // MARKER
  // ------------------------------------------------
  worldMapContext.beginPath();

  worldMapContext.arc(
   position.x,
   position.y,
   5,
   0,
   Math.PI *
   2
  );

  worldMapContext.fillStyle =
   WORLD_MAP_COLORS
   .teleport;

  worldMapContext.fill();

  // ------------------------------------------------
  // LABEL
  // ------------------------------------------------
  if (
   worldMapZoom >=
   0.7
  ) {
   drawWorldMapLabel(
    landmark.name,
    position.x,
    position.y -
    13,

    {
     size: 13,
     color: "#ffe39b"
    }
   );
  }
 }
}

// ==================================================
// DRAW CHUNK GRID
// ==================================================
function drawWorldMapChunkGrid() {
 if (
  worldMapZoom <
  10
 ) {
  return;
 }

 const topLeft =
  mapToWorld(
   0,
   0
  );

 const bottomRight =
  mapToWorld(
   window.innerWidth,
   window.innerHeight
  );

 const chunkSize =
  500;

 const minChunkX =
  Math.floor(
   Math.min(
    topLeft.xMeters,
    bottomRight.xMeters
   ) /
   chunkSize
  );

 const maxChunkX =
  Math.floor(
   Math.max(
    topLeft.xMeters,
    bottomRight.xMeters
   ) /
   chunkSize
  );

 const minChunkZ =
  Math.floor(
   Math.min(
    topLeft.zMeters,
    bottomRight.zMeters
   ) /
   chunkSize
  );

 const maxChunkZ =
  Math.floor(
   Math.max(
    topLeft.zMeters,
    bottomRight.zMeters
   ) /
   chunkSize
  );

 worldMapContext.save();

 worldMapContext.strokeStyle =
  WORLD_MAP_COLORS.chunk;

 worldMapContext.lineWidth =
  1;

 // --------------------------------------------------
 // VERTICAL
 // --------------------------------------------------
 for (
  let x = minChunkX;
  x <= maxChunkX + 1;
  x++
 ) {
  const position =
   worldToMap(
    x *
    chunkSize,
    0
   );

  worldMapContext.beginPath();

  worldMapContext.moveTo(
   position.x,
   0
  );

  worldMapContext.lineTo(
   position.x,
   window.innerHeight
  );

  worldMapContext.stroke();
 }

 // --------------------------------------------------
 // HORIZONTAL
 // --------------------------------------------------
 for (
  let z = minChunkZ;
  z <= maxChunkZ + 1;
  z++
 ) {
  const position =
   worldToMap(
    0,
    z *
    chunkSize
   );

  worldMapContext.beginPath();

  worldMapContext.moveTo(
   0,
   position.y
  );

  worldMapContext.lineTo(
   window.innerWidth,
   position.y
  );

  worldMapContext.stroke();
 }

 // --------------------------------------------------
 // CHUNK LABELS
 // --------------------------------------------------
 if (
  worldMapZoom >=
  16
 ) {
  worldMapContext.font =
   "10px monospace";

  worldMapContext.fillStyle =
   WORLD_MAP_COLORS
   .chunkText;

  worldMapContext.textAlign =
   "center";

  worldMapContext.textBaseline =
   "middle";

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
    const center =
     worldToMap(
      (
       x +
       0.5
      ) *
      chunkSize,

      (
       z +
       0.5
      ) *
      chunkSize
     );

    worldMapContext.fillText(
     `${x},${z}`,
     center.x,
     center.y
    );
   }
  }
 }

 worldMapContext.restore();
}

// ==================================================
// DRAW TELEPORT POINTS
// ==================================================
function drawDatabaseTeleportPoints() {
 if (
  worldMapZoom <
  1
 ) {
  return;
 }

 for (
  const point
  of TELEPORT_POINTS
 ) {
  const position =
   worldToMap(
    point.xMeters,
    point.zMeters
   );

  if (
   !mapPointVisible(
    position.x,
    position.y
   )
  ) {
   continue;
  }

  worldMapContext.beginPath();

  worldMapContext.arc(
   position.x,
   position.y,
   4,
   0,
   Math.PI *
   2
  );

  worldMapContext.fillStyle =
   WORLD_MAP_COLORS
   .teleport;

  worldMapContext.fill();
 }
}

// ==================================================
// DRAW PLAYER
// ==================================================
function drawMapPlayer() {
 const position =
  worldToMap(
   camera.position.x *
   METERS_PER_UNIT,

   camera.position.z *
   METERS_PER_UNIT
  );

 worldMapContext.save();

 worldMapContext.translate(
  position.x,
  position.y
 );

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
  WORLD_MAP_COLORS.player;

 worldMapContext.fill();

 worldMapContext.strokeStyle =
  WORLD_MAP_COLORS
  .playerOutline;

 worldMapContext.lineWidth =
  1.5;

 worldMapContext.stroke();

 worldMapContext.restore();
}

// ==================================================
// DRAW WORLD MAP
// ==================================================
function drawWorldMap() {
 if (
 !worldMapOpen
 ) {
 return;
 }

 const database =
 getActiveWorldDatabase();

 if (
 !database
 ) {
 return;
 }

 // --------------------------------------------------
 // BACKGROUND
 // --------------------------------------------------
 worldMapContext.clearRect(
 0,
 0,
 worldMapCanvas.width,
 worldMapCanvas.height
 );

 worldMapContext.fillStyle =
 WORLD_MAP_COLORS
 .background;

 worldMapContext.fillRect(
 0,
 0,
 worldMapCanvas.width,
 worldMapCanvas.height
 );

 // --------------------------------------------------
 // FOREST AREAS
 // --------------------------------------------------
 drawDatabaseForests(
 database
 );

 // --------------------------------------------------
 // DISTRICTS
 // --------------------------------------------------
 drawDatabaseDistricts(
 database
 );

 // --------------------------------------------------
 // VILLAGES
 // --------------------------------------------------
 drawDatabaseVillages(
 database
 );

 // --------------------------------------------------
 // ROADS
 // --------------------------------------------------
 drawDatabaseRoads(
 database
 );

 // --------------------------------------------------
 // BUILDINGS
 // --------------------------------------------------
 /*
 * 4x以上で自動表示。
 */
 drawDatabaseBuildings(
 database
 );

 // --------------------------------------------------
 // TREES
 // --------------------------------------------------
 /*
 * 6x以上で自動表示。
 */
 drawDatabaseTrees(
 database
 );

 // --------------------------------------------------
 // WALLS
 // --------------------------------------------------
 if (
 database.walls
 ) {
 if (
 database.walls.maria
 ) {
 drawDatabaseWall(
 database.walls.maria
 );
 }

 if (
 database.walls.rose
 ) {
 drawDatabaseWall(
 database.walls.rose
 );
 }

 if (
 database.walls.sina
 ) {
 drawDatabaseWall(
 database.walls.sina
 );
 }
 }

 // --------------------------------------------------
 // LANDMARKS
 // --------------------------------------------------
 drawDatabaseLandmarks(
 database
 );

 // --------------------------------------------------
 // TELEPORT POINTS
 // --------------------------------------------------
 drawDatabaseTeleportPoints();

 // --------------------------------------------------
 // CHUNK GRID
 // --------------------------------------------------
 drawWorldMapChunkGrid();

 // --------------------------------------------------
 // PLAYER
 // --------------------------------------------------
 drawMapPlayer();

 // --------------------------------------------------
 // ZOOM
 // --------------------------------------------------
 worldMapZoomHUD.textContent =
 `ZOOM ${worldMapZoom.toFixed(
 2
 )}x`;
}

// ==================================================
// OPEN MAP
// ==================================================
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

 if (
  typeof settingsOpen !==
   "undefined" &&
  settingsOpen
 ) {
  closeSettings();
 }

 worldMapOpen =
  true;

 if (
  document.pointerLockElement
 ) {
  document.exitPointerLock();
 }

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
}

// ==================================================
// CLOSE MAP
// ==================================================
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

// ==================================================
// TOGGLE MAP
// ==================================================
function toggleWorldMap() {
 if (
  worldMapOpen
 ) {
  closeWorldMap();
 } else {
  openWorldMap();
 }
}

// ==================================================
// MAP ZOOM
// ==================================================
const WORLD_MAP_MIN_ZOOM =
 0.3;

const WORLD_MAP_MAX_ZOOM =
 10000;

// --------------------------------------------------
// ZOOM STEP
// --------------------------------------------------
function getWorldMapZoomStep() {
 if (
 worldMapZoom <
 10
 ) {
 return 1.20;
 }

 if (
 worldMapZoom <
 100
 ) {
 return 1.28;
 }

 if (
 worldMapZoom <
 1000
 ) {
 return 1.35;
 }

 return 1.45;
}

// --------------------------------------------------
// WHEEL
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

 const mouseX =
 event.clientX;

 const mouseY =
 event.clientY;

 const before =
 mapToWorld(
 mouseX,
 mouseY
 );

 const step =
 getWorldMapZoomStep();

 if (
 event.deltaY <
 0
 ) {
 worldMapZoom *=
 step;
 } else {
 worldMapZoom /=
 step;
 }

 worldMapZoom =
 THREE.MathUtils.clamp(
 worldMapZoom,
 WORLD_MAP_MIN_ZOOM,
 WORLD_MAP_MAX_ZOOM
 );

 const scale =
 getWorldMapBaseScale() *
 worldMapZoom;

 worldMapPanX =
 mouseX -
 window.innerWidth /
 2 -
 before.xMeters *
 scale;

 worldMapPanY =
 mouseY -
 window.innerHeight /
 2 -
 before.zMeters *
 scale;

 drawWorldMap();
 },
 {
 passive: false
 }
);

// ==================================================
// MAP DRAG START
// ==================================================
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

// ==================================================
// MAP DRAG MOVE
// ==================================================
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

// ==================================================
// MAP DRAG END
// ==================================================
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
// SETTINGS SYSTEM
// ==================================================
let settingsOpen =
 false;

/*
 * 設定をどこから開いたか。
 *
 * "main-menu"
 * "game"
 */
let settingsSource =
 "game";

// --------------------------------------------------
// STORAGE
// --------------------------------------------------
const SETTINGS_RENDER_DISTANCE_KEY =
 "paradis-render-distance-km";

// --------------------------------------------------
// LOAD SETTINGS
// --------------------------------------------------
function loadGameSettings() {
 const savedRenderDistance =
 Number(
 localStorage.getItem(
 SETTINGS_RENDER_DISTANCE_KEY
 )
 );

 if (
 Number.isFinite(
 savedRenderDistance
 )
 ) {
 renderDistanceKm =
 THREE.MathUtils.clamp(
 savedRenderDistance,
 0.5,
 5
 );
 }

 if (
 typeof renderDistanceInput !==
 "undefined"
 ) {
 renderDistanceInput.value =
 String(
 renderDistanceKm
 );
 }

 if (
 typeof renderDistanceValue !==
 "undefined"
 ) {
 renderDistanceValue.textContent =
 `${renderDistanceKm.toFixed(
 1
 )} km`;
 }
}

// --------------------------------------------------
// SAVE RENDER DISTANCE
// --------------------------------------------------
function saveRenderDistance() {
 localStorage.setItem(
 SETTINGS_RENDER_DISTANCE_KEY,
 String(
 renderDistanceKm
 )
 );
}

// --------------------------------------------------
// APPLY RENDER DISTANCE
// --------------------------------------------------
function applyRenderDistance(
 value
) {
 const parsed =
 Number(
 value
 );

 if (
 !Number.isFinite(
 parsed
 )
 ) {
 return;
 }

 renderDistanceKm =
 THREE.MathUtils.clamp(
 parsed,
 0.5,
 5
 );

 // ------------------------------------------------
 // UI
 // ------------------------------------------------
 renderDistanceInput.value =
 String(
 renderDistanceKm
 );

 renderDistanceValue.textContent =
 `${renderDistanceKm.toFixed(
 1
 )} km`;

 // ------------------------------------------------
 // SAVE
 // ------------------------------------------------
 saveRenderDistance();

 // ------------------------------------------------
 // ACTIVE WORLD
 // ------------------------------------------------
 if (
 worldDatabaseReady
 ) {
 unloadFarChunks();

 requestWorldChunks();

 chunkRequestTimer =
 0;
 }
}

// --------------------------------------------------
// SLIDER
// --------------------------------------------------
renderDistanceInput.addEventListener(
 "input",
 () => {
 applyRenderDistance(
 renderDistanceInput.value
 );
 }
);

// --------------------------------------------------
// OPEN SETTINGS
// --------------------------------------------------
function openSettings(
 source = null
) {
 if (
 settingsOpen
 ) {
 return;
 }

 // ------------------------------------------------
 // SOURCE
 // ------------------------------------------------
 if (
 source
 ) {
 settingsSource =
 source;
 } else if (
 mainMenuOpen
 ) {
 settingsSource =
 "main-menu";
 } else {
 settingsSource =
 "game";
 }

 // ------------------------------------------------
 // CLOSE OTHER UI
 // ------------------------------------------------
 if (
 worldMapOpen
 ) {
 closeWorldMap();
 }

 if (
 teleportMenuOpen
 ) {
 closeTeleportMenu();
 }

 settingsOpen =
 true;

 // ------------------------------------------------
 // POINTER LOCK
 // ------------------------------------------------
 if (
 document.pointerLockElement
 ) {
 document.exitPointerLock();
 }

 // ------------------------------------------------
 // CLEAR INPUT
 // ------------------------------------------------
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

 // ------------------------------------------------
 // VALUE
 // ------------------------------------------------
 renderDistanceInput.value =
 String(
 renderDistanceKm
 );

 renderDistanceValue.textContent =
 `${renderDistanceKm.toFixed(
 1
 )} km`;

 // ------------------------------------------------
 // MAIN MENU
 // ------------------------------------------------
 /*
  * メインメニューから設定を開いた場合は
  * メニューを一時的に隠す。
  *
  * hideMainMenu()は状態まで変えてしまうため
  * ここではdisplayだけ変更する。
  */
 if (
 settingsSource ===
 "main-menu"
 ) {
 mainMenuHUD.style.display =
 "none";
 }

 // ------------------------------------------------
 // SHOW
 // ------------------------------------------------
 settingsHUD.style.display =
 "flex";
}

// --------------------------------------------------
// CLOSE SETTINGS
// --------------------------------------------------
function closeSettings() {
 if (
 !settingsOpen
 ) {
 return;
 }

 settingsOpen =
 false;

 settingsHUD.style.display =
 "none";

 // ------------------------------------------------
 // RETURN TO MAIN MENU
 // ------------------------------------------------
 if (
 settingsSource ===
 "main-menu"
 ) {
 mainMenuHUD.style.display =
 "flex";
 }

 settingsSource =
 "game";
}

// --------------------------------------------------
// INITIAL LOAD
// --------------------------------------------------
loadGameSettings();

// ==================================================
// WORLD DATABASE SYSTEM
// ==================================================
/*
 * 名前は既存コードとの互換性のため
 * WORLD DATABASE SYSTEM のまま。
 *
 * 実際の正本は、
 *
 * /world/paradis-world.json
 *
 * だけ。
 */

// --------------------------------------------------
// STATE
// --------------------------------------------------
let worldDatabaseReady =
 false;

let worldDatabase =
 null;

// --------------------------------------------------
// LOADING STATUS
// --------------------------------------------------
function setWorldLoadingStatus(
 text,
 progress
) {
 worldLoadingStatus.textContent =
 text;

 worldLoadingBar.style.width =
 `${
 THREE.MathUtils.clamp(
 progress,
 0,
 1
 ) *
 100
 }%`;
}

// --------------------------------------------------
// INITIALIZE FIXED WORLD
// --------------------------------------------------
async function initializeGameWorldDatabase() {
 worldDatabaseReady =
 false;

 worldLoadingHUD.style.display =
 "flex";

 setWorldLoadingStatus(
 "LOADING PARADIS WORLD...",
 0.10
 );

 worldLoadingDetails.textContent =
 "Loading /world/paradis-world.json";

 // ------------------------------------------------
 // LOAD
 // ------------------------------------------------
 const database =
 await loadFixedWorld();

 if (
 !database
 ) {
 throw new Error(
 "paradis-world.json is empty."
 );
 }

 /*
 * 旧変数名も残す。
 *
 * Mマップ等の古い処理が
 * worldDatabaseを参照しても
 * 同じ固定Worldが返る。
 */
 worldDatabase =
 database;

 // ------------------------------------------------
 // COUNTS
 // ------------------------------------------------
 const objects =
 Array.isArray(
 database.objects
 )
 ? database.objects
 : [];

 const roads =
 Array.isArray(
 database.roads
 )
 ? database.roads
 : [];

 const districts =
 Array.isArray(
 database.districts
 )
 ? database.districts
 : [];

 const villages =
 Array.isArray(
 database.villages
 )
 ? database.villages
 : [];

 const forests =
 Array.isArray(
 database.forests
 )
 ? database.forests
 : [];

 const houseCount =
 objects.filter(
 object =>
 object.type ===
 "house"
 ).length;

 const treeCount =
 objects.filter(
 object =>
 object.type ===
 "tree"
 ).length;

 // ------------------------------------------------
 // DETAILS
 // ------------------------------------------------
 worldLoadingDetails.textContent =
 `WORLD: ${
 database.name ??
 "Paradis Island"
 }\n` +
 `HOUSES: ${houseCount}\n` +
 `TREES: ${treeCount}\n` +
 `ROADS: ${roads.length}\n` +
 `DISTRICTS: ${districts.length}\n` +
 `VILLAGES: ${villages.length}\n` +
 `FORESTS: ${forests.length}`;

 // ------------------------------------------------
 // READY
 // ------------------------------------------------
 setWorldLoadingStatus(
 "WORLD READY",
 1
 );

 worldDatabaseReady =
 true;

 return {
 database,
 source:
 "fixed-world"
 };
}

// --------------------------------------------------
// GET ACTIVE WORLD
// --------------------------------------------------
/*
 * 3DとMマップで
 * 必ず同じオブジェクトを返す。
 */
function getActiveWorldDatabase() {
 return (
 getFixedWorld() ||
 worldDatabase
 );
}

// ==================================================
// KEYBOARD
// ==================================================
window.addEventListener(
 "keydown",
 event => {
 // --------------------------------------------------
 // SETTINGS OPEN
 // --------------------------------------------------
 /*
  * 設定画面を開いているときのESCは
  * 設定を閉じる。
  */
 if (
 settingsOpen
 ) {
 if (
 event.code ===
 "Escape"
 ) {
 event.preventDefault();

 closeSettings();
 }

 return;
 }

 // --------------------------------------------------
 // MAIN MENU
 // --------------------------------------------------
 /*
  * メインメニューでは
  *
  * ESC = SETTINGS
  *
  * とする。
  */
 if (
 mainMenuOpen
 ) {
 if (
 event.code ===
 "Escape"
 ) {
 event.preventDefault();

 openSettings(
 "main-menu"
 );
 }

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
 // ESC = SETTINGS
 // --------------------------------------------------
 /*
  * ゲームプレイ中。
  */
 if (
 event.code ===
 "Escape"
 ) {
 event.preventDefault();

 openSettings(
 "game"
 );

 return;
 }

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

 if (
 fired
 ) {
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

// --------------------------------------------------
// MOUSE DOWN
// --------------------------------------------------
renderer.domElement.addEventListener(
 "mousedown",
 event => {
  // --------------------------------------------------
  // UI OPEN
  // --------------------------------------------------
  if (
   worldMapOpen ||
   teleportMenuOpen ||
   (
    typeof settingsOpen !==
    "undefined" &&
    settingsOpen
   )
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
   bladeAttackHeld =
    true;

   bladeAttackReleased =
    false;

   /*
    * 攻撃開始。
    */
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
// MOUSE UP
// --------------------------------------------------
renderer.domElement.addEventListener(
 "mouseup",
 event => {
  if (
   event.button !==
   0
  ) {
   return;
  }

  bladeAttackHeld =
   false;

  bladeAttackReleased =
   true;
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
   teleportMenuOpen ||
   (
    typeof settingsOpen !==
    "undefined" &&
    settingsOpen
   )
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

    -Math.PI /
    2 +
    0.01,

    Math.PI /
    2 -
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

let gameLoopStarted =
 false;

// --------------------------------------------------
// ANIMATE
// --------------------------------------------------
function animate() {
 requestAnimationFrame(
 animate
 );

 if (
 !worldDatabaseReady
 ) {
 return;
 }

 const delta =
 Math.min(
 clock.getDelta(),
 0.05
 );

 // ------------------------------------------------
 // PLAYER
 // ------------------------------------------------
 updatePlayer(
 delta
 );

 // ------------------------------------------------
 // WORLD
 // ------------------------------------------------
 updateWorldStreaming(
 delta
 );

 updateWallStreaming();

 updateAreaSystem();

 // ------------------------------------------------
 // TITAN
 // ------------------------------------------------
 updateTitanParts(
 delta
 );

 // ------------------------------------------------
 // EQUIPMENT
 // ------------------------------------------------
 updateBladeAnimation(
 delta
 );

 updateWireVisual(
 leftAnchor
 );

 updateWireVisual(
 rightAnchor
 );

 // ------------------------------------------------
 // HUD
 // ------------------------------------------------
 updateHUD();

 // ------------------------------------------------
 // MAP
 // ------------------------------------------------
 /*
 * Mマップは毎フレーム描画しない。
 *
 * OPEN / ZOOM / DRAG時だけ。
 */

 // ------------------------------------------------
 // RENDER
 // ------------------------------------------------
 renderer.render(
 scene,
 camera
 );
}

// --------------------------------------------------
// START GAME LOOP
// --------------------------------------------------
function startGameLoop() {
 if (
 gameLoopStarted
 ) {
 return;
 }

 gameLoopStarted =
 true;

 clock.start();

 animate();
}

// ==================================================
// BOOT
// ==================================================
async function startOpenWorld() {
 try {
 // ------------------------------------------------
 // CLOSE MAIN MENU
 // ------------------------------------------------
 hideMainMenu();

 // ------------------------------------------------
 // LOADING SCREEN
 // ------------------------------------------------
 worldLoadingHUD.style.display =
 "flex";

 setWorldLoadingStatus(
 "LOADING PARADIS WORLD...",
 0.05
 );

 worldLoadingDetails.textContent =
 "Loading /world/paradis-world.json";

 // ------------------------------------------------
 // FIXED WORLD
 // ------------------------------------------------
 const fixedWorld =
 await loadFixedWorld();

 if (
 !fixedWorld
 ) {
 throw new Error(
 "Fixed world data is empty."
 );
 }

 // ------------------------------------------------
 // ACTIVE WORLD
 // ------------------------------------------------
 worldDatabase =
 fixedWorld;

 // ------------------------------------------------
 // STATISTICS
 // ------------------------------------------------
 const objects =
 Array.isArray(
 fixedWorld.objects
 )
 ? fixedWorld.objects
 : [];

 const roads =
 Array.isArray(
 fixedWorld.roads
 )
 ? fixedWorld.roads
 : [];

 const districts =
 Array.isArray(
 fixedWorld.districts
 )
 ? fixedWorld.districts
 : [];

 const villages =
 Array.isArray(
 fixedWorld.villages
 )
 ? fixedWorld.villages
 : [];

 const forests =
 Array.isArray(
 fixedWorld.forests
 )
 ? fixedWorld.forests
 : [];

 const houseCount =
 objects.filter(
 object =>
 object.type ===
 "house"
 ).length;

 const treeCount =
 objects.filter(
 object =>
 object.type ===
 "tree"
 ).length;

 // ------------------------------------------------
 // LOADING DETAILS
 // ------------------------------------------------
 worldLoadingDetails.textContent =
 `WORLD: ${
 fixedWorld.name ??
 "Paradis Island"
 }\n` +
 `HOUSES: ${houseCount}\n` +
 `TREES: ${treeCount}\n` +
 `ROADS: ${roads.length}\n` +
 `DISTRICTS: ${districts.length}\n` +
 `VILLAGES: ${villages.length}\n` +
 `FORESTS: ${forests.length}`;

 // ------------------------------------------------
 // WORLD SYSTEMS
 // ------------------------------------------------
 /*
  * 壁情報は固定Worldをロードした後に
  * 作り直す。
  *
  * 起動時にWORLD_MAP fallbackから
  * 作られていた場合でも、
  * ここで固定Worldを正本にする。
  */
 createCityWall();

 /*
  * プレイヤー周辺の中心チャンクを
  * ゲーム開始前に生成する。
  */
 forceLoadCurrentChunk();

 requestWorldChunks();

 updateWallStreaming();

 // ------------------------------------------------
 // READY
 // ------------------------------------------------
 setWorldLoadingStatus(
 "WORLD READY",
 1
 );

 worldDatabaseReady =
 true;

 await new Promise(
 resolve => {
 setTimeout(
 resolve,
 250
 );
 }
 );

 worldLoadingHUD.style.display =
 "none";

 console.log(
 "PARADIS FIXED WORLD READY",
 fixedWorld
 );

 // ------------------------------------------------
 // START
 // ------------------------------------------------
 startGameLoop();
 } catch (
 error
 ) {
 console.error(
 "GAME BOOT FAILED",
 error
 );

 worldDatabaseReady =
 false;

 openWorldStarting =
 false;

 openWorldButton.disabled =
 false;

 openWorldButton.textContent =
 "OPEN WORLD";

 worldLoadingHUD.style.display =
 "flex";

 worldLoadingStatus.textContent =
 "WORLD LOAD FAILED";

 worldLoadingDetails.textContent =
 String(
 error?.stack ||
 error
 );
 }
}
