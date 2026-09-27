// ==================================================
// DETERMINISTIC FOREST
// ==================================================

// --------------------------------------------------
// SETTINGS
// --------------------------------------------------
const DEFAULT_CHUNK_SIZE_METERS =
 500;

/*
 * 巨大樹の密度。
 *
 * 42m間隔相当。
 *
 * 小さくすると密集する。
 */
const GIANT_TREE_SPACING_METERS =
 42;

/*
 * 通常樹木。
 */
const NORMAL_TREE_SPACING_METERS =
 28;

// --------------------------------------------------
// HASH STRING
// --------------------------------------------------
function hashString(
 text
) {
 let hash =
 2166136261;

 for (
 let i = 0;
 i < text.length;
 i++
 ) {
 hash ^=
 text.charCodeAt(
 i
 );

 hash =
 Math.imul(
 hash,
 16777619
 );
 }

 return (
 hash >>>
 0
 );
}

// --------------------------------------------------
// RANDOM
// --------------------------------------------------
function createRandom(
 seed
) {
 let state =
 seed >>>
 0;

 return function random() {
 state =
 (
 state +
 0x6D2B79F5
 ) >>>
 0;

 let value =
 state;

 value =
 Math.imul(
 value ^
 (
 value >>>
 15
 ),
 value | 1
 );

 value ^=
 value +
 Math.imul(
 value ^
 (
 value >>>
 7
 ),
 value | 61
 );

 return (
 (
 value ^
 (
 value >>>
 14
 )
 ) >>>
 0
 ) /
 4294967296;
 };
}

// --------------------------------------------------
// CIRCLE / CHUNK
// --------------------------------------------------
function circleIntersectsChunk(
 forest,
 chunkX,
 chunkZ,
 chunkSize
) {
 const minX =
 chunkX *
 chunkSize;

 const minZ =
 chunkZ *
 chunkSize;

 const maxX =
 minX +
 chunkSize;

 const maxZ =
 minZ +
 chunkSize;

 const closestX =
 Math.max(
 minX,
 Math.min(
 forest.xMeters,
 maxX
 )
 );

 const closestZ =
 Math.max(
 minZ,
 Math.min(
 forest.zMeters,
 maxZ
 )
 );

 const dx =
 forest.xMeters -
 closestX;

 const dz =
 forest.zMeters -
 closestZ;

 return (
 dx *
 dx +
 dz *
 dz <=
 forest.radiusMeters *
 forest.radiusMeters
 );
}

// ==================================================
// GENERATE FOREST CHUNK
// ==================================================
export function generateDeterministicForestChunk(
 forests,
 chunkX,
 chunkZ,
 chunkSizeMeters =
 DEFAULT_CHUNK_SIZE_METERS
) {
 if (
 !Array.isArray(
 forests
 )
 ) {
 return [];
 }

 const output =
 [];

 const minX =
 chunkX *
 chunkSizeMeters;

 const minZ =
 chunkZ *
 chunkSizeMeters;

 for (
 const forest
 of forests
 ) {
 if (
 !forest ||
 !Number.isFinite(
 forest.xMeters
 ) ||
 !Number.isFinite(
 forest.zMeters
 ) ||
 !Number.isFinite(
 forest.radiusMeters
 )
 ) {
 continue;
 }

 if (
 !circleIntersectsChunk(
 forest,
 chunkX,
 chunkZ,
 chunkSizeMeters
 )
 ) {
 continue;
 }

 const giant =
 forest.type ===
 "giant";

 const spacing =
 Number(
 forest.treeSpacingMeters
 ) ||
 (
 giant
 ? GIANT_TREE_SPACING_METERS
 : NORMAL_TREE_SPACING_METERS
 );

 /*
 * 500x500m内に必要な本数。
 *
 * 42m間隔なら約142本。
 */
 const approximateCount =
 Math.max(
 1,
 Math.round(
 chunkSizeMeters *
 chunkSizeMeters /
 (
 spacing *
 spacing
 )
 )
 );

 const seed =
 (
 hashString(
 `${forest.id}:${forest.seed ?? 0}:${chunkX}:${chunkZ}`
 )
 );

 const random =
 createRandom(
 seed
 );

 /*
 * 少し自然な密度差。
 */
 const count =
 Math.max(
 1,
 Math.round(
 approximateCount *
 (
 0.82 +
 random() *
 0.36
 )
 )
 );

 for (
 let i = 0;
 i < count;
 i++
 ) {
 const x =
 minX +
 random() *
 chunkSizeMeters;

 const z =
 minZ +
 random() *
 chunkSizeMeters;

 const dx =
 x -
 forest.xMeters;

 const dz =
 z -
 forest.zMeters;

 const distanceSquared =
 dx *
 dx +
 dz *
 dz;

 if (
 distanceSquared >
 forest.radiusMeters *
 forest.radiusMeters
 ) {
 continue;
 }

 const distance =
 Math.sqrt(
 distanceSquared
 );

 const normalized =
 distance /
 forest.radiusMeters;

 /*
 * 森の端だけ少し薄くする。
 */
 const edgeDensity =
 1 -
 Math.max(
 0,
 (
 normalized -
 0.75
 ) /
 0.25
 ) *
 0.55;

 if (
 random() >
 edgeDensity
 ) {
 continue;
 }

 const minHeight =
 Number(
 forest.treeHeightMinMeters
 ) ||
 (
 giant
 ? 55
 : 12
 );

 const maxHeight =
 Number(
 forest.treeHeightMaxMeters
 ) ||
 (
 giant
 ? 100
 : 27
 );

 const height =
 minHeight +
 random() *
 (
 maxHeight -
 minHeight
 );

 const trunkRadius =
 giant
 ? (
 3.5 +
 random() *
 3.5
 )
 : (
 0.4 +
 random() *
 0.6
 );

 const crownRadius =
 giant
 ? (
 10 +
 random() *
 8
 )
 : (
 3 +
 random() *
 4
 );

 output.push({
 id:
 `forest:${forest.id}:${chunkX}:${chunkZ}:${i}`,

 type:
 "tree",

 giant,

 xMeters:
 x,

 zMeters:
 z,

 heightMeters:
 height,

 trunkRadiusMeters:
 trunkRadius,

 crownRadiusMeters:
 crownRadius,

 forestId:
 forest.id
 });
 }
 }

 return output;
}