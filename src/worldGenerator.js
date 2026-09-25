// ==================================================
// IMPORTS
// ==================================================
import {
 WORLD_MAP
} from "./worldMap.js";

// ==================================================
// WORLD GENERATOR SETTINGS
// ==================================================
const NORMAL_FOREST_CHANCE =
 0.055;

const NORMAL_VILLAGE_CHANCE =
 0.012;

const NORMAL_FOREST_RADIUS_METERS =
 6000;

const NORMAL_VILLAGE_RADIUS_METERS =
 650;

const NORMAL_TREE_MIN_HEIGHT_METERS =
 10;

const NORMAL_TREE_MAX_HEIGHT_METERS =
 24;

const GIANT_TREE_MIN_TRUNK_METERS =
 3.5;

const GIANT_TREE_MAX_TRUNK_METERS =
 7;

const NORMAL_TREE_MIN_TRUNK_METERS =
 0.35;

const NORMAL_TREE_MAX_TRUNK_METERS =
 0.9;

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

 h =
  h ^
  (
   h >>> 16
  );

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
// PRNG
// ==================================================
function createRandom(
 seed
) {
 let state =
  seed >>> 0;

 return function random() {
  state +=
   0x6D2B79F5;

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
// DISTANCE
// ==================================================
function distance2D(
 ax,
 az,
 bx,
 bz
) {
 return Math.hypot(
  ax -
  bx,

  az -
  bz
 );
}

// ==================================================
// CIRCLE / CHUNK INTERSECTION
// ==================================================
function circleIntersectsChunk(
 centerX,
 centerZ,
 radius,
 chunkMinX,
 chunkMinZ,
 chunkMaxX,
 chunkMaxZ
) {
 const closestX =
  Math.max(
   chunkMinX,
   Math.min(
    centerX,
    chunkMaxX
   )
  );

 const closestZ =
  Math.max(
   chunkMinZ,
   Math.min(
    centerZ,
    chunkMaxZ
   )
  );

 const dx =
  centerX -
  closestX;

 const dz =
  centerZ -
  closestZ;

 return (
  dx *
  dx +
  dz *
  dz <=
  radius *
  radius
 );
}

// ==================================================
// HOUSE DESCRIPTOR
// ==================================================
function makeHouse(
 random,
 xMeters,
 zMeters,
 scale = 1
) {
 return {
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
// TREE DESCRIPTOR
// ==================================================
function makeTree(
 random,
 xMeters,
 zMeters,
 giant = false,
 forcedMinHeight = null,
 forcedMaxHeight = null
) {
 const minHeight =
  forcedMinHeight ??
  (
   giant
   ? 50
   : NORMAL_TREE_MIN_HEIGHT_METERS
  );

 const maxHeight =
  forcedMaxHeight ??
  (
   giant
   ? 100
   : NORMAL_TREE_MAX_HEIGHT_METERS
  );

 return {
  type:
   "tree",

  giant,

  xMeters,

  zMeters,

  heightMeters:
   randomRange(
    random,
    minHeight,
    maxHeight
   ),

  trunkRadiusMeters:
   giant
   ? randomRange(
      random,
      GIANT_TREE_MIN_TRUNK_METERS,
      GIANT_TREE_MAX_TRUNK_METERS
     )
   : randomRange(
      random,
      NORMAL_TREE_MIN_TRUNK_METERS,
      NORMAL_TREE_MAX_TRUNK_METERS
     ),

  crownRadiusMeters:
   giant
   ? randomRange(
      random,
      9,
      18
     )
   : randomRange(
      random,
      3,
      7
     )
 };
}

// ==================================================
// GENERATE DISTRICT
// ==================================================
function generateDistrict(
 district,
 chunk,
 output
) {
 if (
  !circleIntersectsChunk(
   district.xMeters,
   district.zMeters,
   district.cityRadiusMeters,
   chunk.minX,
   chunk.minZ,
   chunk.maxX,
   chunk.maxZ
  )
 ) {
  return;
 }

 const random =
  createRandom(
   combineSeed(
    "district",
    district.seed,
    chunk.chunkX,
    chunk.chunkZ
   )
  );

 // --------------------------------------------------
 // HOUSES
 // --------------------------------------------------
 for (
  let i = 0;
  i < 90;
  i++
 ) {
  const x =
   randomRange(
    random,
    chunk.minX,
    chunk.maxX
   );

  const z =
   randomRange(
    random,
    chunk.minZ,
    chunk.maxZ
   );

  if (
   distance2D(
    x,
    z,
    district.xMeters,
    district.zMeters
   ) >
   district.cityRadiusMeters
  ) {
   continue;
  }

  /*
   * 中央大通り。
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

  /*
   * 横道。
   */
  const localZ =
   z -
   district.zMeters;

  const roadBand =
   Math.abs(
    (
     (
      localZ +
      10000
     ) %
     180
    ) -
    90
   );

  if (
   roadBand <
   8
  ) {
   continue;
  }

  output.push(
   makeHouse(
    random,
    x,
    z,
    1
   )
  );
 }
}

// ==================================================
// GENERATE MAJOR VILLAGE
// ==================================================
function generateMajorVillage(
 village,
 chunk,
 output
) {
 if (
  !circleIntersectsChunk(
   village.xMeters,
   village.zMeters,
   village.radiusMeters,
   chunk.minX,
   chunk.minZ,
   chunk.maxX,
   chunk.maxZ
  )
 ) {
  return;
 }

 const random =
  createRandom(
   combineSeed(
    "major-village",
    village.seed,
    chunk.chunkX,
    chunk.chunkZ
   )
  );

 for (
  let i = 0;
  i < 48;
  i++
 ) {
  const x =
   randomRange(
    random,
    chunk.minX,
    chunk.maxX
   );

  const z =
   randomRange(
    random,
    chunk.minZ,
    chunk.maxZ
   );

  if (
   distance2D(
    x,
    z,
    village.xMeters,
    village.zMeters
   ) >
   village.radiusMeters
  ) {
   continue;
  }

  output.push(
   makeHouse(
    random,
    x,
    z,
    0.9
   )
  );
 }
}

// ==================================================
// GENERATE MAJOR FOREST
// ==================================================
function generateMajorForest(
 forest,
 chunk,
 output
) {
 if (
  !circleIntersectsChunk(
   forest.xMeters,
   forest.zMeters,
   forest.radiusMeters,
   chunk.minX,
   chunk.minZ,
   chunk.maxX,
   chunk.maxZ
  )
 ) {
  return;
 }

 const random =
  createRandom(
   combineSeed(
    "major-forest",
    forest.seed,
    chunk.chunkX,
    chunk.chunkZ
   )
  );

 const attempts =
  forest.type ===
  "giant"
  ? 75
  : 120;

 for (
  let i = 0;
  i < attempts;
  i++
 ) {
  const x =
   randomRange(
    random,
    chunk.minX,
    chunk.maxX
   );

  const z =
   randomRange(
    random,
    chunk.minZ,
    chunk.maxZ
   );

  const distance =
   distance2D(
    x,
    z,
    forest.xMeters,
    forest.zMeters
   );

  if (
   distance >
   forest.radiusMeters
  ) {
   continue;
  }

  const normalizedDistance =
   distance /
   forest.radiusMeters;

  const edgeDensity =
   1 -
   normalizedDistance *
   0.55;

  if (
   random() >
   forest.density *
   edgeDensity
  ) {
   continue;
  }

  output.push(
   makeTree(
    random,
    x,
    z,
    forest.type ===
    "giant",
    forest.treeHeightMinMeters,
    forest.treeHeightMaxMeters
   )
  );
 }
}

// ==================================================
// PROCEDURAL CELL
// ==================================================
function getProceduralCell(
 cellX,
 cellZ,
 worldSeed
) {
 const random =
  createRandom(
   combineSeed(
    "procedural-cell",
    worldSeed,
    cellX,
    cellZ
   )
  );

 const value =
  random();

 if (
  value <
  NORMAL_VILLAGE_CHANCE
 ) {
  return {
   type: "village",
   random
  };
 }

 if (
  value <
  NORMAL_VILLAGE_CHANCE +
  NORMAL_FOREST_CHANCE
 ) {
  return {
   type: "forest",
   random
  };
 }

 return {
  type: "none",
  random
 };
}

// ==================================================
// GENERATE PROCEDURAL CONTENT
// ==================================================
function generateProceduralContent(
 chunk,
 worldSeed,
 output
) {
 const cellSize =
  10000;

 const centerX =
  (
   chunk.minX +
   chunk.maxX
  ) *
  0.5;

 const centerZ =
  (
   chunk.minZ +
   chunk.maxZ
  ) *
  0.5;

 const cellX =
  Math.floor(
   centerX /
   cellSize
  );

 const cellZ =
  Math.floor(
   centerZ /
   cellSize
  );

 // --------------------------------------------------
 // NEIGHBOUR CELLS
 // --------------------------------------------------
 for (
  let ox = -1;
  ox <= 1;
  ox++
 ) {
  for (
   let oz = -1;
   oz <= 1;
   oz++
  ) {
   const cx =
    cellX +
    ox;

   const cz =
    cellZ +
    oz;

   const cell =
    getProceduralCell(
     cx,
     cz,
     worldSeed
    );

   if (
    cell.type ===
    "none"
   ) {
    continue;
   }

   const random =
    cell.random;

   const landmarkX =
    cx *
    cellSize +
    randomRange(
     random,
     1500,
     cellSize -
     1500
    );

   const landmarkZ =
    cz *
    cellSize +
    randomRange(
     random,
     1500,
     cellSize -
     1500
    );

   // ------------------------------------------------
   // FOREST
   // ------------------------------------------------
   if (
    cell.type ===
    "forest"
   ) {
    if (
     !circleIntersectsChunk(
      landmarkX,
      landmarkZ,
      NORMAL_FOREST_RADIUS_METERS,
      chunk.minX,
      chunk.minZ,
      chunk.maxX,
      chunk.maxZ
     )
    ) {
     continue;
    }

    const treeRandom =
     createRandom(
      combineSeed(
       "normal-forest",
       worldSeed,
       cx,
       cz,
       chunk.chunkX,
       chunk.chunkZ
      )
     );

    for (
     let i = 0;
     i < 55;
     i++
    ) {
     const x =
      randomRange(
       treeRandom,
       chunk.minX,
       chunk.maxX
      );

     const z =
      randomRange(
       treeRandom,
       chunk.minZ,
       chunk.maxZ
      );

     if (
      distance2D(
       x,
       z,
       landmarkX,
       landmarkZ
      ) >
      NORMAL_FOREST_RADIUS_METERS
     ) {
      continue;
     }

     output.push(
      makeTree(
       treeRandom,
       x,
       z,
       false
      )
     );
    }
   }

   // ------------------------------------------------
   // VILLAGE
   // ------------------------------------------------
   if (
    cell.type ===
    "village"
   ) {
    if (
     !circleIntersectsChunk(
      landmarkX,
      landmarkZ,
      NORMAL_VILLAGE_RADIUS_METERS,
      chunk.minX,
      chunk.minZ,
      chunk.maxX,
      chunk.maxZ
     )
    ) {
     continue;
    }

    const villageRandom =
     createRandom(
      combineSeed(
       "normal-village",
       worldSeed,
       cx,
       cz,
       chunk.chunkX,
       chunk.chunkZ
      )
     );

    for (
     let i = 0;
     i < 26;
     i++
    ) {
     const x =
      randomRange(
       villageRandom,
       chunk.minX,
       chunk.maxX
      );

     const z =
      randomRange(
       villageRandom,
       chunk.minZ,
       chunk.maxZ
      );

     if (
      distance2D(
       x,
       z,
       landmarkX,
       landmarkZ
      ) >
      NORMAL_VILLAGE_RADIUS_METERS
     ) {
      continue;
     }

     output.push(
      makeHouse(
       villageRandom,
       x,
       z,
       0.82
      )
     );
    }
   }
  }
 }
}

// ==================================================
// GENERATE WORLD CHUNK CONTENT
// ==================================================
export function generateWorldChunkContent(
 chunkX,
 chunkZ,
 chunkSizeMeters,
 worldSeed
) {
 const minX =
  chunkX *
  chunkSizeMeters;

 const minZ =
  chunkZ *
  chunkSizeMeters;

 const maxX =
  minX +
  chunkSizeMeters;

 const maxZ =
  minZ +
  chunkSizeMeters;

 const chunk = {
  chunkX,
  chunkZ,

  minX,
  minZ,
  maxX,
  maxZ
 };

 const output =
  [];

 // --------------------------------------------------
 // MAJOR DISTRICTS
 // --------------------------------------------------
 for (
  const district
  of WORLD_MAP.districts
 ) {
  generateDistrict(
   district,
   chunk,
   output
  );
 }

 // --------------------------------------------------
 // MAJOR VILLAGES
 // --------------------------------------------------
 for (
  const village
  of WORLD_MAP.villages
 ) {
  generateMajorVillage(
   village,
   chunk,
   output
  );
 }

 // --------------------------------------------------
 // MAJOR FORESTS
 // --------------------------------------------------
 for (
  const forest
  of WORLD_MAP.forests
 ) {
  generateMajorForest(
   forest,
   chunk,
   output
  );
 }

 // --------------------------------------------------
 // PROCEDURAL WORLD
 // --------------------------------------------------
 generateProceduralContent(
  chunk,
  worldSeed,
  output
 );

 return output;
}
