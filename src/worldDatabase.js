// ==================================================
// IMPORTS
// ==================================================
import {
 WORLD_MAP
} from "./worldMap.js";

// ==================================================
// WORLD DATABASE SETTINGS
// ==================================================
const WORLD_DATABASE_VERSION =
 1;

const WORLD_DATABASE_NAME =
 "paradis-world-database";

const WORLD_DATABASE_STORE =
 "worlds";

const WORLD_DATABASE_KEY_PREFIX =
 "paradis-world-v1-";

/*
 * 3D側と同じ500m。
 */
export const WORLD_DATABASE_CHUNK_SIZE_METERS =
 500;

// ==================================================
// RUNTIME DATABASE
// ==================================================
/*
 * 現在ゲームが参照している
 * WORLD DATABASE。
 *
 * 初期化完了後は、
 * Mマップ・TP・3D世界の
 * 全部がこれを参照する。
 */
let activeWorldDatabase =
 null;

// ==================================================
// GET ACTIVE DATABASE
// ==================================================
export function getWorldDatabase() {
 return activeWorldDatabase;
}

// ==================================================
// HASH
// ==================================================
function hashInteger(
 value
) {
 let h =
  value | 0;

 h =
  Math.imul(
   h ^
   (
    h >>> 16
   ),
   0x45d9f3b
  );

 h =
  Math.imul(
   h ^
   (
    h >>> 16
   ),
   0x45d9f3b
  );

 h ^=
  h >>>
  16;

 return (
  h >>> 0
 );
}

// ==================================================
// STRING HASH
// ==================================================
function hashString(
 text
) {
 let h =
  2166136261;

 for (
  let i = 0;
  i < text.length;
  i++
 ) {
  h ^=
   text.charCodeAt(
    i
   );

  h =
   Math.imul(
    h,
    16777619
   );
 }

 return (
  h >>> 0
 );
}

// ==================================================
// COMBINE SEED
// ==================================================
function combineSeed(
 ...values
) {
 let h =
  0x811c9dc5;

 for (
  const value
  of values
 ) {
  const n =
   typeof value ===
   "string"
   ? hashString(
      value
     )
   : hashInteger(
      Number(
       value
      ) ||
      0
     );

  h ^=
   n;

  h =
   Math.imul(
    h,
    16777619
   );
 }

 return (
  h >>> 0
 );
}

// ==================================================
// SEEDED RANDOM
// ==================================================
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

  let t =
   state;

  t =
   Math.imul(
    t ^
    (
     t >>> 15
    ),
    t | 1
   );

  t ^=
   t +
   Math.imul(
    t ^
    (
     t >>> 7
    ),
    t | 61
   );

  return (
   (
    t ^
    (
     t >>> 14
    )
   ) >>>
   0
  ) /
  4294967296;
 };
}

// ==================================================
// RANDOM RANGE
// ==================================================
function randomRange(
 random,
 min,
 max
) {
 return (
  min +
  (
   max -
   min
  ) *
  random()
 );
}

// ==================================================
// CHUNK HELPERS
// ==================================================
function getDatabaseChunkCoordinate(
 meters
) {
 return Math.floor(
  meters /
  WORLD_DATABASE_CHUNK_SIZE_METERS
 );
}

function getDatabaseChunkKey(
 chunkX,
 chunkZ
) {
 return (
  `${chunkX},${chunkZ}`
 );
}

// ==================================================
// ADD TO CHUNK INDEX
// ==================================================
function addToChunkIndex(
 chunkIndex,
 type,
 id,
 xMeters,
 zMeters
) {
 const chunkX =
  getDatabaseChunkCoordinate(
   xMeters
  );

 const chunkZ =
  getDatabaseChunkCoordinate(
   zMeters
  );

 const key =
  getDatabaseChunkKey(
   chunkX,
   chunkZ
  );

 if (
  !chunkIndex[
   key
  ]
 ) {
  chunkIndex[
   key
  ] = {
   chunkX,
   chunkZ,

   buildings: [],
   roads: [],
   forests: [],
   landmarks: []
  };
 }

 const chunk =
  chunkIndex[
   key
  ];

 if (
  !chunk[
   type
  ]
 ) {
  chunk[
   type
  ] = [];
 }

 chunk[
  type
 ].push(
  id
 );
}

// ==================================================
// HOUSE GENERATOR
// ==================================================
function createHouseData(
 id,
 random,
 xMeters,
 zMeters,
 scale = 1
) {
 return {
  id,

  type:
   "house",

  xMeters,

  zMeters,

  widthMeters:
   randomRange(
    random,
    7,
    13
   ) *
   scale,

  depthMeters:
   randomRange(
    random,
    8,
    14
   ) *
   scale,

  heightMeters:
   randomRange(
    random,
    7,
    15
   ) *
   scale,

  roofHeightMeters:
   randomRange(
    random,
    2.5,
    4.5
   ) *
   scale,

  rotation:
   random() *
   Math.PI *
   2,

  variant:
   Math.floor(
    random() *
    100000
   )
 };
}

// ==================================================
// GENERATE DISTRICT BUILDINGS
// ==================================================
function generateDistrictBuildings(
 district,
 buildings,
 chunkIndex
) {
 const random =
  createRandom(
   combineSeed(
    "district",
    district.seed
   )
  );

 const radius =
  district.cityRadiusMeters;

 /*
  * 主要都市は
  * 家の密度を高める。
  *
  * 最初は無茶な数にせず、
  * 1都市数千軒程度を上限にする。
  */
 const targetCount =
  Math.max(
   300,

   Math.floor(
    Math.PI *
    radius *
    radius /
    9000
   )
  );

 let created =
  0;

 let attempts =
  0;

 const maxAttempts =
  targetCount *
  12;

 while (
  created <
   targetCount &&

  attempts <
   maxAttempts
 ) {
  attempts++;

  const angle =
   random() *
   Math.PI *
   2;

  const distance =
   Math.sqrt(
    random()
   ) *
   radius;

  const x =
   district.xMeters +
   Math.cos(
    angle
   ) *
   distance;

  const z =
   district.zMeters +
   Math.sin(
    angle
   ) *
   distance;

  // ------------------------------------------------
  // MAIN ROAD
  // ------------------------------------------------
  /*
   * 中央大通りを空ける。
   */
  if (
   Math.abs(
    x -
    district.xMeters
   ) <
   18
  ) {
   continue;
  }

  // ------------------------------------------------
  // CROSS ROAD
  // ------------------------------------------------
  /*
   * 180m間隔で
   * 横道を空ける。
   */
  const localZ =
   z -
   district.zMeters;

  const nearestRoad =
   Math.round(
    localZ /
    180
   ) *
   180;

  if (
   Math.abs(
    localZ -
    nearestRoad
   ) <
   8
  ) {
   continue;
  }

  const id =
   `building:${district.id}:${created}`;

  const building =
   createHouseData(
    id,
    random,
    x,
    z,
    1
   );

  buildings.push(
   building
  );

  addToChunkIndex(
   chunkIndex,
   "buildings",
   id,
   x,
   z
  );

  created++;
 }
}

// ==================================================
// GENERATE VILLAGE BUILDINGS
// ==================================================
function generateVillageBuildings(
 village,
 buildings,
 chunkIndex
) {
 const random =
  createRandom(
   combineSeed(
    "village",
    village.seed
   )
  );

 /*
  * TP対象の確定村。
  *
  * 普通の自動村より
  * 明確に大きくする。
  */
 const targetCount =
  90;

 for (
  let i = 0;
  i < targetCount;
  i++
 ) {
  const angle =
   random() *
   Math.PI *
   2;

  const distance =
   Math.sqrt(
    random()
   ) *
   village.radiusMeters *
   0.85;

  const x =
   village.xMeters +
   Math.cos(
    angle
   ) *
   distance;

  const z =
   village.zMeters +
   Math.sin(
    angle
   ) *
   distance;

  const id =
   `building:${village.id}:${i}`;

  const building =
   createHouseData(
    id,
    random,
    x,
    z,
    0.88
   );

  buildings.push(
   building
  );

  addToChunkIndex(
   chunkIndex,
   "buildings",
   id,
   x,
   z
  );
 }
}

// ==================================================
// GENERATE CAPITAL BUILDINGS
// ==================================================
function generateCapitalBuildings(
 landmark,
 buildings,
 chunkIndex
) {
 const random =
  createRandom(
   combineSeed(
    "capital",
    landmark.seed
   )
  );

 const targetCount =
  1800;

 for (
  let i = 0;
  i < targetCount;
  i++
 ) {
  const angle =
   random() *
   Math.PI *
   2;

  const distance =
   Math.sqrt(
    random()
   ) *
   landmark.radiusMeters *
   0.9;

  const x =
   landmark.xMeters +
   Math.cos(
    angle
   ) *
   distance;

  const z =
   landmark.zMeters +
   Math.sin(
    angle
   ) *
   distance;

  /*
   * 王都中央部を少し空ける。
   */
  if (
   distance <
   350
  ) {
   continue;
  }

  const id =
   `building:${landmark.id}:${i}`;

  const building =
   createHouseData(
    id,
    random,
    x,
    z,
    1.15
   );

  buildings.push(
   building
  );

  addToChunkIndex(
   chunkIndex,
   "buildings",
   id,
   x,
   z
  );
 }
}

// ==================================================
// GENERATE ROADS
// ==================================================
function generateRoads(
 roads,
 chunkIndex
) {
 let roadId =
  0;

 for (
  const district
  of WORLD_MAP.districts
 ) {
  const id =
   `road:${roadId++}`;

  const road = {
   id,

   type:
    "road",

   x1:
    district.xMeters,

   z1:
    district.zMeters -
    district.cityRadiusMeters,

   x2:
    district.xMeters,

   z2:
    district.zMeters +
    district.cityRadiusMeters,

   widthMeters:
    14
  };

  roads.push(
   road
  );

  /*
   * Roadは複数チャンクを跨ぐので
   * 今は中央チャンクへ索引。
   *
   * 後で線分チャンク登録へ
   * 拡張可能。
   */
  addToChunkIndex(
   chunkIndex,
   "roads",
   id,

   district.xMeters,
   district.zMeters
  );
 }
}

// ==================================================
// GENERATE FORESTS
// ==================================================
function generateForests(
 forests,
 chunkIndex
) {
 for (
  const forest
  of WORLD_MAP.forests
 ) {
  const entry = {
   id:
    forest.id,

   name:
    forest.name,

   type:
    forest.type,

   xMeters:
    forest.xMeters,

   zMeters:
    forest.zMeters,

   radiusMeters:
    forest.radiusMeters,

   density:
    forest.density,

   seed:
    forest.seed,

   treeHeightMinMeters:
    forest.treeHeightMinMeters,

   treeHeightMaxMeters:
    forest.treeHeightMaxMeters
  };

  forests.push(
   entry
  );

  /*
   * 森全体は巨大なので
   * 後で範囲チャンク索引へ
   * 拡張する。
   *
   * 現段階では中心を登録。
   */
  addToChunkIndex(
   chunkIndex,
   "forests",
   forest.id,

   forest.xMeters,
   forest.zMeters
  );
 }
}

// ==================================================
// GENERATE LANDMARK INDEX
// ==================================================
function generateLandmarkIndex(
 chunkIndex
) {
 for (
  const landmark
  of WORLD_MAP.landmarks
 ) {
  addToChunkIndex(
   chunkIndex,
   "landmarks",
   landmark.id,

   landmark.xMeters,
   landmark.zMeters
  );
 }

 for (
  const district
  of WORLD_MAP.districts
 ) {
  addToChunkIndex(
   chunkIndex,
   "landmarks",
   district.id,

   district.xMeters,
   district.zMeters
  );
 }

 for (
  const village
  of WORLD_MAP.villages
 ) {
  addToChunkIndex(
   chunkIndex,
   "landmarks",
   village.id,

   village.xMeters,
   village.zMeters
  );
 }
}

// ==================================================
// GENERATE WORLD DATABASE
// ==================================================
export function generateWorldDatabase(
 worldSeed
) {
 const start =
  performance.now();

 const buildings =
  [];

 const roads =
  [];

 const forests =
  [];

 const chunkIndex =
  {};

 // --------------------------------------------------
 // DISTRICTS
 // --------------------------------------------------
 for (
  const district
  of WORLD_MAP.districts
 ) {
  generateDistrictBuildings(
   district,
   buildings,
   chunkIndex
  );
 }

 // --------------------------------------------------
 // VILLAGES
 // --------------------------------------------------
 for (
  const village
  of WORLD_MAP.villages
 ) {
  generateVillageBuildings(
   village,
   buildings,
   chunkIndex
  );
 }

 // --------------------------------------------------
 // LANDMARK BUILDINGS
 // --------------------------------------------------
 for (
  const landmark
  of WORLD_MAP.landmarks
 ) {
  if (
   landmark.type ===
   "capital"
  ) {
   generateCapitalBuildings(
    landmark,
    buildings,
    chunkIndex
   );
  }
 }

 // --------------------------------------------------
 // ROADS
 // --------------------------------------------------
 generateRoads(
  roads,
  chunkIndex
 );

 // --------------------------------------------------
 // FORESTS
 // --------------------------------------------------
 generateForests(
  forests,
  chunkIndex
 );

 // --------------------------------------------------
 // LANDMARK INDEX
 // --------------------------------------------------
 generateLandmarkIndex(
  chunkIndex
 );

 // --------------------------------------------------
 // DATABASE
 // --------------------------------------------------
 const database = {
  version:
   WORLD_DATABASE_VERSION,

  id:
   "paradis",

  generatedAt:
   Date.now(),

  worldSeed,

  world:
   structuredClone(
    WORLD_MAP.world
   ),

  walls:
   structuredClone(
    WORLD_MAP.walls
   ),

  districts:
   structuredClone(
    WORLD_MAP.districts
   ),

  villages:
   structuredClone(
    WORLD_MAP.villages
   ),

  landmarks:
   structuredClone(
    WORLD_MAP.landmarks
   ),

  buildings,

  roads,

  forests,

  chunkIndex,

  statistics: {
   buildingCount:
    buildings.length,

   roadCount:
    roads.length,

   forestCount:
    forests.length,

   chunkCount:
    Object.keys(
     chunkIndex
    ).length,

   generationTimeMs:
    performance.now() -
    start
  }
 };

 return database;
}

// ==================================================
// INDEXED DB
// ==================================================

// --------------------------------------------------
// OPEN DATABASE
// --------------------------------------------------
function openIndexedDatabase() {
 return new Promise(
  (
   resolve,
   reject
  ) => {
   const request =
    indexedDB.open(
     WORLD_DATABASE_NAME,
     1
    );

   request.onerror =
    () => {
     reject(
      request.error
     );
    };

   request.onupgradeneeded =
    () => {
     const db =
      request.result;

     if (
      !db.objectStoreNames
      .contains(
       WORLD_DATABASE_STORE
      )
     ) {
      db.createObjectStore(
       WORLD_DATABASE_STORE
      );
     }
    };

   request.onsuccess =
    () => {
     resolve(
      request.result
     );
    };
  }
 );
}

// --------------------------------------------------
// LOAD SAVED WORLD
// --------------------------------------------------
async function loadSavedWorld(
 key
) {
 const db =
  await openIndexedDatabase();

 return new Promise(
  (
   resolve,
   reject
  ) => {
   const transaction =
    db.transaction(
     WORLD_DATABASE_STORE,
     "readonly"
    );

   const store =
    transaction.objectStore(
     WORLD_DATABASE_STORE
    );

   const request =
    store.get(
     key
    );

   request.onsuccess =
    () => {
     resolve(
      request.result ??
      null
     );
    };

   request.onerror =
    () => {
     reject(
      request.error
     );
    };
  }
 );
}

// --------------------------------------------------
// SAVE WORLD
// --------------------------------------------------
async function saveWorld(
 key,
 world
) {
 const db =
  await openIndexedDatabase();

 return new Promise(
  (
   resolve,
   reject
  ) => {
   const transaction =
    db.transaction(
     WORLD_DATABASE_STORE,
     "readwrite"
    );

   const store =
    transaction.objectStore(
     WORLD_DATABASE_STORE
    );

   store.put(
    world,
    key
   );

   transaction.oncomplete =
    () => {
     resolve();
    };

   transaction.onerror =
    () => {
     reject(
      transaction.error
     );
    };
  }
 );
}

// ==================================================
// INITIALIZE WORLD DATABASE
// ==================================================
export async function initializeWorldDatabase(
 worldSeed,
 options = {}
) {
 const forceRegenerate =
  options.forceRegenerate ??
  false;

 const key =
  WORLD_DATABASE_KEY_PREFIX +
  worldSeed;

 // --------------------------------------------------
 // LOAD
 // --------------------------------------------------
 if (
  !forceRegenerate
 ) {
  try {
   const saved =
    await loadSavedWorld(
     key
    );

   if (
    saved &&
    saved.version ===
     WORLD_DATABASE_VERSION
   ) {
    activeWorldDatabase =
     saved;

    return {
     database:
      activeWorldDatabase,

     source:
      "indexeddb"
    };
   }
  } catch (
   error
  ) {
   console.warn(
    "WORLD DATABASE LOAD FAILED",
    error
   );
  }
 }

 // --------------------------------------------------
 // GENERATE
 // --------------------------------------------------
 const generated =
  generateWorldDatabase(
   worldSeed
  );

 activeWorldDatabase =
  generated;

 // --------------------------------------------------
 // SAVE
 // --------------------------------------------------
 try {
  await saveWorld(
   key,
   generated
  );
 } catch (
  error
 ) {
  console.warn(
   "WORLD DATABASE SAVE FAILED",
   error
  );
 }

 return {
  database:
   activeWorldDatabase,

  source:
   "generated"
 };
}

// ==================================================
// GET CHUNK DATA
// ==================================================
export function getWorldDatabaseChunk(
 chunkX,
 chunkZ
) {
 if (
  !activeWorldDatabase
 ) {
  return null;
 }

 const key =
  getDatabaseChunkKey(
   chunkX,
   chunkZ
  );

 return (
  activeWorldDatabase
  .chunkIndex[
   key
  ] ??
  null
 );
}

// ==================================================
// EXPORT WORLD
// ==================================================
export function exportWorldDatabase() {
 if (
  !activeWorldDatabase
 ) {
  return false;
 }

 const json =
  JSON.stringify(
   activeWorldDatabase,
   null,
   2
  );

 const blob =
  new Blob(
   [
    json
   ],
   {
    type:
     "application/json"
   }
  );

 const url =
  URL.createObjectURL(
   blob
  );

 const anchor =
  document.createElement(
   "a"
  );

 anchor.href =
  url;

 anchor.download =
  `paradis-world-${activeWorldDatabase.worldSeed}.json`;

 document.body.appendChild(
  anchor
 );

 anchor.click();

 anchor.remove();

 URL.revokeObjectURL(
  url
 );

 return true;
}
