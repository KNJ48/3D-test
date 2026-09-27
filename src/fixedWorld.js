// ==================================================
// FIXED WORLD
// ==================================================

// --------------------------------------------------
// FILE
// --------------------------------------------------
const FIXED_WORLD_URL =
 "/world/paradis-world.json";

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
 *  object,
 *  object...
 * ]
 */
const fixedWorldChunkIndex =
 new Map();

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
 Number(
 fixedWorld.chunkSizeMeters
 ) ||
 500;

 const objects =
 Array.isArray(
 fixedWorld.objects
 )
 ? fixedWorld.objects
 : [];

 for (
 const object
 of objects
 ) {
 const xMeters =
 Number(
 object.xMeters
 );

 const zMeters =
 Number(
 object.zMeters
 );

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

 fixedWorld =
 await response.json();

 buildFixedWorldChunkIndex();

 console.log(
 "FIXED WORLD INDEX READY",
 {
 objects:
 Array.isArray(
 fixedWorld.objects
 )
 ? fixedWorld.objects.length
 : 0,

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
/*
 * Mマップ用。
 *
 * 全世界objectsを走査せず、
 * 指定されたチャンクだけ返す。
 */
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
