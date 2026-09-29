// ==================================================
// FIXED WORLD
// ==================================================

// --------------------------------------------------
// FILE
// --------------------------------------------------
const FIXED_WORLD_URL =
 "/world/paradis-world.json";

// --------------------------------------------------
// VERSION
// --------------------------------------------------
const SUPPORTED_WORLD_VERSION =
 2;

// --------------------------------------------------
// STATE
// --------------------------------------------------
let fixedWorld =
 null;

let fixedWorldChunkSizeMeters =
 500;

/*
 * key:
 *
 * "chunkX,chunkZ"
 *
 * value:
 *
 * [
 * object,
 * object...
 * ]
 */
const fixedWorldChunkIndex =
 new Map();

// ==================================================
// DEFAULT TEMPLATES
// ==================================================
/*
 * JSON軽量化によって削除された
 * Template固有寸法をここで復元する。
 *
 * main.jsのHOUSE TEMPLATE 01と
 * 同じ寸法。
 */
const FIXED_HOUSE_TEMPLATES = {
 1: {
 widthMeters:
 9,

 depthMeters:
 11,

 heightMeters:
 9,

 roofHeightMeters:
 4
 }
};

// ==================================================
// KEY
// ==================================================
function getFixedWorldChunkKey(
 chunkX,
 chunkZ
) {
 return (
 `${chunkX},${chunkZ}`
 );
}

// ==================================================
// NUMBER
// ==================================================
function finiteNumber(
 value,
 fallback =
 0
) {
 const number =
 Number(
 value
 );

 return Number.isFinite(
 number
 )
 ? number
 : fallback;
}

// ==================================================
// NORMALIZE HOUSE
// ==================================================
function normalizeHouse(
 object,
 index
) {
 const templateId =
 Math.max(
 1,
 Math.floor(
 finiteNumber(
 object.templateId,
 1
 )
 )
 );

 const template =
 FIXED_HOUSE_TEMPLATES[
 templateId
 ] ??
 FIXED_HOUSE_TEMPLATES[
 1
 ];

 return {
 ...object,

 id:
 object.id ??
 `house:${index}`,

 type:
 "house",

 templateId,

 xMeters:
 finiteNumber(
 object.xMeters
 ),

 zMeters:
 finiteNumber(
 object.zMeters
 ),

 rotation:
 finiteNumber(
 object.rotation
 ),

 /*
  * Optimizerで削除されていても
  * Templateから復元。
  *
  * 将来、特殊建物だけJSON側で
  * 値を上書きすることも可能。
  */
 widthMeters:
 finiteNumber(
 object.widthMeters,
 template.widthMeters
 ),

 depthMeters:
 finiteNumber(
 object.depthMeters,
 template.depthMeters
 ),

 heightMeters:
 finiteNumber(
 object.heightMeters,
 template.heightMeters
 ),

 roofHeightMeters:
 finiteNumber(
 object.roofHeightMeters,
 template.roofHeightMeters
 )
 };
}

// ==================================================
// NORMALIZE TREE
// ==================================================
function normalizeTree(
 object,
 index
) {
 return {
 ...object,

 id:
 object.id ??
 `tree:${index}`,

 type:
 "tree",

 xMeters:
 finiteNumber(
 object.xMeters
 ),

 zMeters:
 finiteNumber(
 object.zMeters
 ),

 heightMeters:
 finiteNumber(
 object.heightMeters,
 20
 ),

 trunkRadiusMeters:
 finiteNumber(
 object.trunkRadiusMeters,
 0.7
 ),

 crownRadiusMeters:
 finiteNumber(
 object.crownRadiusMeters,
 5
 ),

 giant:
 object.giant ===
 true
 };
}

// ==================================================
// NORMALIZE GENERIC OBJECT
// ==================================================
function normalizeGenericObject(
 object,
 index
) {
 return {
 ...object,

 id:
 object.id ??
 `object:${index}`,

 xMeters:
 finiteNumber(
 object.xMeters
 ),

 zMeters:
 finiteNumber(
 object.zMeters
 )
 };
}

// ==================================================
// NORMALIZE OBJECT
// ==================================================
function normalizeWorldObject(
 object,
 index
) {
 if (
 !object ||
 typeof object !==
 "object"
 ) {
 return null;
 }

 if (
 object.type ===
 "house"
 ) {
 return normalizeHouse(
 object,
 index
 );
 }

 if (
 object.type ===
 "tree"
 ) {
 return normalizeTree(
 object,
 index
 );
 }

 return normalizeGenericObject(
 object,
 index
 );
}

// ==================================================
// NORMALIZE ROAD
// ==================================================
function normalizeRoad(
 road,
 index
) {
 if (
 !road ||
 typeof road !==
 "object"
 ) {
 return null;
 }

 return {
 ...road,

 id:
 road.id ??
 `road:${index}`,

 type:
 "road",

 x1:
 finiteNumber(
 road.x1
 ),

 z1:
 finiteNumber(
 road.z1
 ),

 x2:
 finiteNumber(
 road.x2
 ),

 z2:
 finiteNumber(
 road.z2
 ),

 widthMeters:
 finiteNumber(
 road.widthMeters,
 8
 )
 };
}

// ==================================================
// NORMALIZE ARRAY
// ==================================================
function safeArray(
 value
) {
 return Array.isArray(
 value
 )
 ? value
 : [];
}

// ==================================================
// NORMALIZE WORLD
// ==================================================
function normalizeFixedWorld(
 world
) {
 if (
 !world ||
 typeof world !==
 "object"
 ) {
 throw new Error(
 "Invalid fixed world."
 );
 }

 // ------------------------------------------------
 // OBJECTS
 // ------------------------------------------------
 const sourceObjects =
 safeArray(
 world.objects
 );

 const objects =
 [];

 for (
 let i = 0;
 i <
 sourceObjects.length;
 i++
 ) {
 const normalized =
 normalizeWorldObject(
 sourceObjects[
 i
 ],
 i
 );

 if (
 !normalized
 ) {
 continue;
 }

 if (
 !Number.isFinite(
 normalized.xMeters
 ) ||
 !Number.isFinite(
 normalized.zMeters
 )
 ) {
 continue;
 }

 objects.push(
 normalized
 );
 }

 // ------------------------------------------------
 // ROADS
 // ------------------------------------------------
 const sourceRoads =
 safeArray(
 world.roads
 );

 const roads =
 [];

 for (
 let i = 0;
 i <
 sourceRoads.length;
 i++
 ) {
 const normalized =
 normalizeRoad(
 sourceRoads[
 i
 ],
 i
 );

 if (
 normalized
 ) {
 roads.push(
 normalized
 );
 }
 }

 // ------------------------------------------------
 // WORLD
 // ------------------------------------------------
 return {
 ...world,

 chunkSizeMeters:
 finiteNumber(
 world.chunkSizeMeters,
 500
 ),

 walls:
 world.walls ??
 {},

 districts:
 safeArray(
 world.districts
 ),

 villages:
 safeArray(
 world.villages
 ),

 forests:
 safeArray(
 world.forests
 ),

 landmarks:
 safeArray(
 world.landmarks
 ),

 roads,

 objects
 };
}

// ==================================================
// BUILD INDEX
// ==================================================
function buildFixedWorldChunkIndex() {
 fixedWorldChunkIndex.clear();

 if (
 !fixedWorld
 ) {
 return;
 }

 fixedWorldChunkSizeMeters =
 finiteNumber(
 fixedWorld.chunkSizeMeters,
 500
 );

 // ------------------------------------------------
 // OBJECTS
 // ------------------------------------------------
 for (
 const object
 of fixedWorld.objects
 ) {
 const xMeters =
 object.xMeters;

 const zMeters =
 object.zMeters;

 if (
 !Number.isFinite(
 xMeters
 ) ||
 !Number.isFinite(
 zMeters
 )
 ) {
 continue;
 }

 const chunkX =
 Math.floor(
 xMeters /
 fixedWorldChunkSizeMeters
 );

 const chunkZ =
 Math.floor(
 zMeters /
 fixedWorldChunkSizeMeters
 );

 const key =
 getFixedWorldChunkKey(
 chunkX,
 chunkZ
 );

 let chunk =
 fixedWorldChunkIndex.get(
 key
 );

 if (
 !chunk
 ) {
 chunk =
 [];

 fixedWorldChunkIndex.set(
 key,
 chunk
 );
 }

 chunk.push(
 object
 );
 }
}

// ==================================================
// LOAD
// ==================================================
export async function loadFixedWorld() {
 if (
 fixedWorld
 ) {
 return fixedWorld;
 }

 // ------------------------------------------------
 // FETCH
 // ------------------------------------------------
 const response =
 await fetch(
 FIXED_WORLD_URL,
 {
 cache:
 "no-cache"
 }
 );

 if (
 !response.ok
 ) {
 throw new Error(
 `FIXED WORLD LOAD FAILED: ${
 response.status
 } ${
 response.statusText
 }`
 );
 }

 // ------------------------------------------------
 // JSON
 // ------------------------------------------------
 const rawWorld =
 await response.json();

 // ------------------------------------------------
 // NORMALIZE
 // ------------------------------------------------
 fixedWorld =
 normalizeFixedWorld(
 rawWorld
 );

 // ------------------------------------------------
 // INDEX
 // ------------------------------------------------
 buildFixedWorldChunkIndex();

 // ------------------------------------------------
 // LOG
 // ------------------------------------------------
 const houseCount =
 fixedWorld.objects.filter(
 object =>
 object.type ===
 "house"
 ).length;

 const treeCount =
 fixedWorld.objects.filter(
 object =>
 object.type ===
 "tree"
 ).length;

 console.log(
 "FIXED WORLD READY",
 {
 version:
 fixedWorld.version ??
 1,

 supportedVersion:
 SUPPORTED_WORLD_VERSION,

 objects:
 fixedWorld.objects.length,

 houses:
 houseCount,

 trees:
 treeCount,

 roads:
 fixedWorld.roads.length,

 chunks:
 fixedWorldChunkIndex.size,

 chunkSizeMeters:
 fixedWorldChunkSizeMeters
 }
 );

 return fixedWorld;
}

// ==================================================
// GET WORLD
// ==================================================
export function getFixedWorld() {
 return fixedWorld;
}

// ==================================================
// GET CHUNK
// ==================================================
export function getFixedWorldChunk(
 chunkX,
 chunkZ
) {
 const key =
 getFixedWorldChunkKey(
 chunkX,
 chunkZ
 );

 return {
 chunkX,
 chunkZ,

 objects:
 fixedWorldChunkIndex.get(
 key
 ) ??
 []
 };
}

// ==================================================
// GET OBJECTS IN CHUNK RANGE
// ==================================================
export function getFixedWorldObjectsInChunkRange(
 minChunkX,
 minChunkZ,
 maxChunkX,
 maxChunkZ
) {
 const output =
 [];

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
 getFixedWorldChunkKey(
 chunkX,
 chunkZ
 );

 const objects =
 fixedWorldChunkIndex.get(
 key
 );

 if (
 !objects
 ) {
 continue;
 }

 output.push(
 ...objects
 );
 }
 }

 return output;
}

// ==================================================
// GET CHUNK SIZE
// ==================================================
export function getFixedWorldChunkSizeMeters() {
 return fixedWorldChunkSizeMeters;
}

// ==================================================
// CLEAR
// ==================================================
export function clearFixedWorld() {
 fixedWorld =
 null;

 fixedWorldChunkIndex.clear();

 fixedWorldChunkSizeMeters =
 500;
}
