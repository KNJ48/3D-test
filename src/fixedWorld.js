// ==================================================
// FIXED WORLD
// ==================================================

// --------------------------------------------------
// FILE
// --------------------------------------------------
/*
 * ゲームが読む世界ファイルは
 * これ1個だけ。
 */
const FIXED_WORLD_URL =
 "/world/paradis-world.json";

// --------------------------------------------------
// STATE
// --------------------------------------------------
let fixedWorld =
 null;

/*
 * key:
 *
 * "chunkX,chunkZ"
 *
 * value:
 *
 * [
 *  object,
 *  object,
 *  ...
 * ]
 */
const fixedWorldChunkIndex =
 new Map();

// --------------------------------------------------
// SETTINGS
// --------------------------------------------------
let fixedWorldChunkSizeMeters =
 500;

// ==================================================
// CHUNK KEY
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
// BUILD CHUNK INDEX
// ==================================================
function buildFixedWorldChunkIndex() {
 fixedWorldChunkIndex.clear();

 if (
 !fixedWorld
 ) {
 return;
 }

 const objects =
 Array.isArray(
 fixedWorld.objects
 )
 ? fixedWorld.objects
 : [];

 fixedWorldChunkSizeMeters =
 Number(
 fixedWorld.chunkSizeMeters
 ) ||
 500;

 // --------------------------------------------------
 // OBJECTS
 // --------------------------------------------------
 for (
 const object
 of objects
 ) {
 if (
 !object
 ) {
 continue;
 }

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

 if (
 !fixedWorldChunkIndex.has(
 key
 )
 ) {
 fixedWorldChunkIndex.set(
 key,
 []
 );
 }

 fixedWorldChunkIndex
 .get(
 key
 )
 .push(
 object
 );
 }
}

// ==================================================
// LOAD FIXED WORLD
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
 "FIXED WORLD READY",
 {
 objects:
 Array.isArray(
 fixedWorld.objects
 )
 ? fixedWorld.objects.length
 : 0,

 chunks:
 fixedWorldChunkIndex.size,

 roads:
 Array.isArray(
 fixedWorld.roads
 )
 ? fixedWorld.roads.length
 : 0
 }
 );

 return fixedWorld;
}

// ==================================================
// GET FIXED WORLD
// ==================================================
export function getFixedWorld() {
 return fixedWorld;
}

// ==================================================
// GET FIXED WORLD CHUNK
// ==================================================
/*
 * fetchはしない。
 *
 * 起動時にロードした
 * paradis-world.jsonから
 * メモリ内INDEXを参照するだけ。
 */
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