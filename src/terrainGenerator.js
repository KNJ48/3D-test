// ==================================================
// TERRAIN GENERATOR
// ==================================================

const TERRAIN_SEED_STORAGE_KEY =
 "paradisWorldSeed";

const DEFAULT_TERRAIN_SEED =
 104729;

// ==================================================
// LOAD SEED
// ==================================================
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

// ==================================================
// TERRAIN SETTINGS
// ==================================================
const TERRAIN_SETTINGS = {

 // --------------------------------------------------
 // BASE HEIGHT
 // --------------------------------------------------
 /*
  * 世界全体の基準標高。
  */
 baseHeightMeters: 20,

 // --------------------------------------------------
 // CONTINENTAL
 // --------------------------------------------------
 /*
  * 非常に大きな高地・低地。
  *
  * 数十km規模。
  */
 continentalScale:
  0.000035,

 continentalAmplitude:
  120,

 // --------------------------------------------------
 // LARGE TERRAIN
 // --------------------------------------------------
 /*
  * 数km規模の丘・山。
  */
 largeScale:
  0.00018,

 largeAmplitude:
  100,

 // --------------------------------------------------
 // MEDIUM TERRAIN
 // --------------------------------------------------
 /*
  * 数百m規模の丘。
  */
 mediumScale:
  0.0008,

 mediumAmplitude:
  35,

 // --------------------------------------------------
 // SMALL TERRAIN
 // --------------------------------------------------
 /*
  * 小規模な起伏。
  */
 smallScale:
  0.003,

 smallAmplitude:
  7,

 // --------------------------------------------------
 // GLOBAL STRENGTH
 // --------------------------------------------------
 strength:
  1
};

// ==================================================
// SEED
// ==================================================
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

 // --------------------------------------------------
 // SAVE
 // --------------------------------------------------
 localStorage.setItem(
  TERRAIN_SEED_STORAGE_KEY,
  String(
   terrainSeed
  )
 );

 return true;
}

export function getTerrainSeed() {
 return terrainSeed;
}

// ==================================================
// INTEGER HASH
// ==================================================
function hash2D(
 x,
 z
) {
 let h =
  Math.imul(
   x,
   374761393
  );

 h =
  (
   h +
   Math.imul(
    z,
    668265263
   )
  ) |
  0;

 h =
  (
   h +
   Math.imul(
    terrainSeed,
    1442695041
   )
  ) |
  0;

 h =
  h ^
  (
   h >>> 13
  );

 h =
  Math.imul(
   h,
   1274126177
  );

 h =
  h ^
  (
   h >>> 16
  );

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
// SMOOTHING
// ==================================================
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

// ==================================================
// VALUE NOISE 2D
// ==================================================
function valueNoise2D(
 x,
 z
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
  x0 + 1;

 const z1 =
  z0 + 1;

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
   z0
  );

 const b =
  hash2D(
   x1,
   z0
  );

 const c =
  hash2D(
   x0,
   z1
  );

 const d =
  hash2D(
   x1,
   z1
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
 octaves
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
    frequency
   ) *
   amplitude;

  totalAmplitude +=
   amplitude;

  frequency *=
   2.03;

  amplitude *=
   0.5;
 }

 return (
  value /
  totalAmplitude
 );
}

// ==================================================
// RIDGED NOISE
// ==================================================
function ridgedNoise(
 x,
 z
) {
 const n =
  fbm(
   x,
   z,
   5
  );

 /*
  * 山の稜線を作りやすい形へ変換。
  */
 return (
  1 -
  Math.abs(
   n
  )
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
 // CONTINENTAL SHAPE
 // --------------------------------------------------
 const continental =
  fbm(
   xMeters *
   TERRAIN_SETTINGS
   .continentalScale,

   zMeters *
   TERRAIN_SETTINGS
   .continentalScale,

   5
  ) *
  TERRAIN_SETTINGS
  .continentalAmplitude;

 // --------------------------------------------------
 // LARGE HILLS
 // --------------------------------------------------
 const large =
  fbm(
   xMeters *
   TERRAIN_SETTINGS
   .largeScale +
   73.41,

   zMeters *
   TERRAIN_SETTINGS
   .largeScale -
   181.72,

   5
  ) *
  TERRAIN_SETTINGS
  .largeAmplitude;

 // --------------------------------------------------
 // RIDGES
 // --------------------------------------------------
 /*
  * すべてを山にすると不自然なので
  * 別ノイズで山岳の強さを決める。
  */
 const mountainMaskRaw =
  fbm(
   xMeters *
   0.000045 +
   731.2,

   zMeters *
   0.000045 -
   413.7,

   4
  );

 const mountainMask =
  Math.max(
   0,
   mountainMaskRaw -
   0.12
  );

 const ridges =
  ridgedNoise(
   xMeters *
   0.00022,

   zMeters *
   0.00022
  ) *
  mountainMask *
  300;

 // --------------------------------------------------
 // MEDIUM
 // --------------------------------------------------
 const medium =
  fbm(
   xMeters *
   TERRAIN_SETTINGS
   .mediumScale -
   291.4,

   zMeters *
   TERRAIN_SETTINGS
   .mediumScale +
   517.8,

   4
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
   .smallScale +
   811.3,

   zMeters *
   TERRAIN_SETTINGS
   .smallScale -
   307.9,

   3
  ) *
  TERRAIN_SETTINGS
  .smallAmplitude;

 // --------------------------------------------------
 // FINAL
 // --------------------------------------------------
 return (
  TERRAIN_SETTINGS
  .baseHeightMeters +

  (
   continental +
   large +
   ridges +
   medium +
   small
  ) *
  TERRAIN_SETTINGS
  .strength
 );
}
