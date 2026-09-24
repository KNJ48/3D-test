// ==================================================
// TERRAIN GENERATOR
// ==================================================

let terrainSeed =
 104729;

// ==================================================
// TERRAIN SETTINGS
// ==================================================
const TERRAIN_SETTINGS = {

 // --------------------------------------------------
 // GENERAL
 // --------------------------------------------------
 /*
  * 世界の基本標高。
  *
  * ノイズがマイナスになっても
  * 地面全体がY=0より
  * 大きく沈みにくくする。
  */
 baseHeightMeters: 35,

 // --------------------------------------------------
 // LARGE TERRAIN
 // --------------------------------------------------
 /*
  * 数km単位の大きな丘陵。
  */
 largeScale: 0.00012,

 largeAmplitude: 35,

 // --------------------------------------------------
 // MEDIUM TERRAIN
 // --------------------------------------------------
 /*
  * 数百m～km単位の丘。
  */
 mediumScale: 0.00055,

 mediumAmplitude: 10,

 // --------------------------------------------------
 // SMALL TERRAIN
 // --------------------------------------------------
 /*
  * 地面の細かな起伏。
  */
 smallScale: 0.0025,

 smallAmplitude: 2,

 // --------------------------------------------------
 // GLOBAL STRENGTH
 // --------------------------------------------------
 strength: 1
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
  return;
 }

 terrainSeed =
  Math.floor(
   parsed
  );
}

export function getTerrainSeed() {
 return terrainSeed;
}

// ==================================================
// HASH
// ==================================================
function hash2D(
 x,
 z
) {
 let h =
  Math.imul(
   x,
   374761393
  ) +
  Math.imul(
   z,
   668265263
  ) +
  Math.imul(
   terrainSeed,
   1442695041
  );

 h =
  (
   h ^
   (
    h >>> 13
   )
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
  h >>> 0
 ) /
  4294967295;
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
  ) *
  2 -
  1;

 const b =
  hash2D(
   x1,
   z0
  ) *
  2 -
  1;

 const c =
  hash2D(
   x0,
   z1
  ) *
  2 -
  1;

 const d =
  hash2D(
   x1,
   z1
  ) *
  2 -
  1;

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
 let value = 0;
 let amplitude = 0.5;
 let frequency = 1;
 let totalAmplitude = 0;

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
   2;

  amplitude *=
   0.5;
 }

 if (
  totalAmplitude <= 0
 ) {
  return 0;
 }

 return (
  value /
  totalAmplitude
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
 // LARGE
 // --------------------------------------------------
 const large =
  fbm(
   xMeters *
   TERRAIN_SETTINGS.largeScale,
   zMeters *
   TERRAIN_SETTINGS.largeScale,
   5
  ) *
  TERRAIN_SETTINGS.largeAmplitude;

 // --------------------------------------------------
 // MEDIUM
 // --------------------------------------------------
 const medium =
  fbm(
   xMeters *
   TERRAIN_SETTINGS.mediumScale +
   81.7,
   zMeters *
   TERRAIN_SETTINGS.mediumScale -
   143.2,
   4
  ) *
  TERRAIN_SETTINGS.mediumAmplitude;

 // --------------------------------------------------
 // SMALL
 // --------------------------------------------------
 const small =
  fbm(
   xMeters *
   TERRAIN_SETTINGS.smallScale -
   291.4,
   zMeters *
   TERRAIN_SETTINGS.smallScale +
   517.8,
   3
  ) *
  TERRAIN_SETTINGS.smallAmplitude;

 // --------------------------------------------------
 // FINAL
 // --------------------------------------------------
 return (
  TERRAIN_SETTINGS.baseHeightMeters +
  (
   large +
   medium +
   small
  ) *
  TERRAIN_SETTINGS.strength
 );
}
