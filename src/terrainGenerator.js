// ==================================================
// TERRAIN GENERATOR
// ==================================================

/*
 * このファイルの担当:
 *
 * ・WORLD SEED
 * ・seedの保存
 * ・地形ノイズ
 * ・座標から地表高度を計算
 *
 * 家・村・森などは
 * worldGenerator.js が担当。
 */

// ==================================================
// WORLD SEED
// ==================================================
const TERRAIN_SEED_STORAGE_KEY =
 "paradisWorldSeed";

const DEFAULT_TERRAIN_SEED =
 104729;

// --------------------------------------------------
// LOAD SEED
// --------------------------------------------------
function loadTerrainSeed() {
 const saved =
  localStorage.getItem(
   TERRAIN_SEED_STORAGE_KEY
  );

 if (
  saved === null
 ) {
  return DEFAULT_TERRAIN_SEED;
 }

 const parsed =
  Number(
   saved
  );

 if (
  !Number.isFinite(
   parsed
  )
 ) {
  return DEFAULT_TERRAIN_SEED;
 }

 return Math.floor(
  parsed
 );
}

let terrainSeed =
 loadTerrainSeed();

// --------------------------------------------------
// GET SEED
// --------------------------------------------------
export function getTerrainSeed() {
 return terrainSeed;
}

// --------------------------------------------------
// SET SEED
// --------------------------------------------------
export function setTerrainSeed(
 seed
) {
 const parsed =
  Number(
   seed
  );

 if (
  !Number.isFinite(
   parsed
  )
 ) {
  return false;
 }

 terrainSeed =
  Math.floor(
   parsed
  );

 /*
  * リロードしても
  * 同じseedを維持する。
  */
 localStorage.setItem(
  TERRAIN_SEED_STORAGE_KEY,

  String(
   terrainSeed
  )
 );

 return true;
}

// ==================================================
// TERRAIN SETTINGS
// ==================================================
/*
 * 今は地形がはっきり見えるよう
 * 少し強めの設定。
 *
 * 後からESC設定に移動可能。
 */
const TERRAIN_SETTINGS = {

 // --------------------------------------------------
 // BASE HEIGHT
 // --------------------------------------------------
 baseHeightMeters:
  15,

 // --------------------------------------------------
 // CONTINENTAL
 // --------------------------------------------------
 /*
  * 数十km規模の
  * 大きな高地・低地。
  */
 continentalScale:
  0.000035,

 continentalAmplitude:
  100,

 // --------------------------------------------------
 // REGIONAL
 // --------------------------------------------------
 /*
  * 数km～十数km規模。
  */
 regionalScale:
  0.00011,

 regionalAmplitude:
  85,

 // --------------------------------------------------
 // LARGE HILLS
 // --------------------------------------------------
 /*
  * 数km規模の丘。
  */
 largeScale:
  0.00032,

 largeAmplitude:
  55,

 // --------------------------------------------------
 // MEDIUM HILLS
 // --------------------------------------------------
 /*
  * 数百m～1km規模。
  */
 mediumScale:
  0.0011,

 mediumAmplitude:
  18,

 // --------------------------------------------------
 // SMALL DETAIL
 // --------------------------------------------------
 /*
  * 小さな地面起伏。
  */
 smallScale:
  0.0038,

 smallAmplitude:
  4,

 // --------------------------------------------------
 // MOUNTAINS
 // --------------------------------------------------
 mountainScale:
  0.00016,

 mountainMaskScale:
  0.00004,

 mountainAmplitude:
  230,

 mountainThreshold:
  0.12,

 // --------------------------------------------------
 // GLOBAL
 // --------------------------------------------------
 strength:
  1
};

// ==================================================
// INTEGER HASH
// ==================================================
function hash2D(
 x,
 z,
 salt = 0
) {
 let h =
  Math.imul(
   x | 0,
   374761393
  );

 h =
  (
   h +
   Math.imul(
    z | 0,
    668265263
   )
  ) |
  0;

 h =
  (
   h +
   Math.imul(
    terrainSeed | 0,
    1442695041
   )
  ) |
  0;

 h =
  (
   h +
   Math.imul(
    salt | 0,
    1597334677
   )
  ) |
  0;

 h ^=
  h >>> 13;

 h =
  Math.imul(
   h,
   1274126177
  );

 h ^=
  h >>> 16;

 return (
  (
   h >>> 0
  ) /
  4294967295
 ) *
  2 -
  1;
}

// ==================================================
// MATH
// ==================================================

// --------------------------------------------------
// LERP
// --------------------------------------------------
function lerp(
 a,
 b,
 t
) {
 return (
  a +
  (
   b -
   a
  ) *
  t
 );
}

// --------------------------------------------------
// SMOOTH FADE
// --------------------------------------------------
function fade(
 t
) {
 return (
  t *
  t *
  t *
  (
   t *
   (
    t *
    6 -
    15
   ) +
   10
  )
 );
}

// --------------------------------------------------
// SMOOTHSTEP
// --------------------------------------------------
function smoothstep(
 edge0,
 edge1,
 value
) {
 if (
  edge0 ===
  edge1
 ) {
  return (
   value <
   edge0
   ? 0
   : 1
  );
 }

 const t =
  Math.max(
   0,

   Math.min(
    1,

    (
     value -
     edge0
    ) /
    (
     edge1 -
     edge0
    )
   )
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

// ==================================================
// VALUE NOISE 2D
// ==================================================
function valueNoise2D(
 x,
 z,
 salt = 0
) {
 const x0 =
  Math.floor(
   x
  );

 const z0 =
  Math.floor(
   z
  );

 const x1 =
  x0 +
  1;

 const z1 =
  z0 +
  1;

 const tx =
  fade(
   x -
   x0
  );

 const tz =
  fade(
   z -
   z0
  );

 const a =
  hash2D(
   x0,
   z0,
   salt
  );

 const b =
  hash2D(
   x1,
   z0,
   salt
  );

 const c =
  hash2D(
   x0,
   z1,
   salt
  );

 const d =
  hash2D(
   x1,
   z1,
   salt
  );

 const top =
  lerp(
   a,
   b,
   tx
  );

 const bottom =
  lerp(
   c,
   d,
   tx
  );

 return lerp(
  top,
  bottom,
  tz
 );
}

// ==================================================
// FBM
// ==================================================
function fbm(
 x,
 z,
 octaves,
 salt
) {
 let value =
  0;

 let amplitude =
  0.5;

 let frequency =
  1;

 let totalAmplitude =
  0;

 for (
  let i = 0;
  i < octaves;
  i++
 ) {
  value +=
   valueNoise2D(
    x *
    frequency,

    z *
    frequency,

    salt +
    i *
    1013
   ) *
   amplitude;

  totalAmplitude +=
   amplitude;

  frequency *=
   2.03;

  amplitude *=
   0.5;
 }

 if (
  totalAmplitude <=
  0
 ) {
  return 0;
 }

 return (
  value /
  totalAmplitude
 );
}

// ==================================================
// RIDGED FBM
// ==================================================
function ridgedFbm(
 x,
 z
) {
 let value =
  0;

 let amplitude =
  0.55;

 let frequency =
  1;

 let total =
  0;

 for (
  let i = 0;
  i < 5;
  i++
 ) {
  const n =
   valueNoise2D(
    x *
    frequency,

    z *
    frequency,

    7001 +
    i *
    997
   );

  /*
   * -1～1を
   * 山の稜線型へ変換。
   */
  let ridge =
   1 -
   Math.abs(
    n
   );

  ridge *=
   ridge;

  value +=
   ridge *
   amplitude;

  total +=
   amplitude;

  amplitude *=
   0.5;

  frequency *=
   2.05;
 }

 return (
  value /
  total
 );
}

// ==================================================
// TERRAIN HEIGHT
// ==================================================
export function getTerrainHeightMeters(
 xMeters,
 zMeters
) {
 // --------------------------------------------------
 // CONTINENTAL
 // --------------------------------------------------
 const continental =
  fbm(
   xMeters *
   TERRAIN_SETTINGS
   .continentalScale,

   zMeters *
   TERRAIN_SETTINGS
   .continentalScale,

   5,

   101
  ) *
  TERRAIN_SETTINGS
  .continentalAmplitude;

 // --------------------------------------------------
 // REGIONAL
 // --------------------------------------------------
 const regional =
  fbm(
   xMeters *
   TERRAIN_SETTINGS
   .regionalScale +
   117.31,

   zMeters *
   TERRAIN_SETTINGS
   .regionalScale -
   281.17,

   5,

   401
  ) *
  TERRAIN_SETTINGS
  .regionalAmplitude;

 // --------------------------------------------------
 // LARGE
 // --------------------------------------------------
 const large =
  fbm(
   xMeters *
   TERRAIN_SETTINGS
   .largeScale -
   421.8,

   zMeters *
   TERRAIN_SETTINGS
   .largeScale +
   193.4,

   5,

   1201
  ) *
  TERRAIN_SETTINGS
  .largeAmplitude;

 // --------------------------------------------------
 // MEDIUM
 // --------------------------------------------------
 const medium =
  fbm(
   xMeters *
   TERRAIN_SETTINGS
   .mediumScale +
   811.4,

   zMeters *
   TERRAIN_SETTINGS
   .mediumScale -
   517.7,

   4,

   2203
  ) *
  TERRAIN_SETTINGS
  .mediumAmplitude;

 // --------------------------------------------------
 // SMALL
 // --------------------------------------------------
 const small =
  fbm(
   xMeters *
   TERRAIN_SETTINGS
   .smallScale -
   137.2,

   zMeters *
   TERRAIN_SETTINGS
   .smallScale +
   933.8,

   3,

   3209
  ) *
  TERRAIN_SETTINGS
  .smallAmplitude;

 // --------------------------------------------------
 // MOUNTAIN MASK
 // --------------------------------------------------
 /*
  * 世界全体を山だらけにせず、
  * 大きな別ノイズから
  * 山岳地域だけを選ぶ。
  */
 const mountainMaskNoise =
  fbm(
   xMeters *
   TERRAIN_SETTINGS
   .mountainMaskScale +
   1731.7,

   zMeters *
   TERRAIN_SETTINGS
   .mountainMaskScale -
   941.3,

   4,

   4301
  );

 const mountainMask =
  smoothstep(
   TERRAIN_SETTINGS
   .mountainThreshold,

   0.55,

   mountainMaskNoise
  );

 // --------------------------------------------------
 // MOUNTAIN RIDGES
 // --------------------------------------------------
 const ridge =
  ridgedFbm(
   xMeters *
   TERRAIN_SETTINGS
   .mountainScale,

   zMeters *
   TERRAIN_SETTINGS
   .mountainScale
  );

 /*
  * ridgeは0～1付近なので、
  * 少し底を切って山だけ残す。
  */
 const shapedRidge =
  Math.max(
   0,
   ridge -
   0.28
  );

 const mountains =
  shapedRidge *
  mountainMask *
  TERRAIN_SETTINGS
  .mountainAmplitude;

 // --------------------------------------------------
 // FINAL HEIGHT
 // --------------------------------------------------
 const terrain =
  continental +
  regional +
  large +
  medium +
  small +
  mountains;

 return (
  TERRAIN_SETTINGS
  .baseHeightMeters +

  terrain *
  TERRAIN_SETTINGS
  .strength
 );
}
