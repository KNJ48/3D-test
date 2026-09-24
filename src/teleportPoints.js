// ==================================================
// IMPORTS
// ==================================================
import {
 WORLD_MAP
} from "./worldMap.js";

// ==================================================
// TELEPORT POINTS
// ==================================================
export const TELEPORT_POINTS =
 [];

// --------------------------------------------------
// ADD POINT
// --------------------------------------------------
function addTeleportPoint(
 data,
 category
) {
 TELEPORT_POINTS.push({
  id:
   data.id,

  name:
   data.name,

  category,

  xMeters:
   data.entranceX ??
   data.xMeters,

  zMeters:
   data.entranceZ ??
   data.zMeters,

  targetX:
   data.xMeters,

  targetZ:
   data.zMeters
 });
}

// --------------------------------------------------
// DISTRICTS
// --------------------------------------------------
for (
 const district
 of WORLD_MAP.districts
) {
 const wall =
  WORLD_MAP.walls[
   district.wall
  ];

 addTeleportPoint(
  district,

  wall
  ? wall.name
  : "地区"
 );
}

// --------------------------------------------------
// FORESTS
// --------------------------------------------------
for (
 const forest
 of WORLD_MAP.forests
) {
 addTeleportPoint(
  forest,
  "森林"
 );
}

// --------------------------------------------------
// VILLAGES
// --------------------------------------------------
for (
 const village
 of WORLD_MAP.villages
) {
 addTeleportPoint(
  village,
  "村"
 );
}

// --------------------------------------------------
// LANDMARKS
// --------------------------------------------------
for (
 const landmark
 of WORLD_MAP.landmarks
) {
 let category =
  "ランドマーク";

 if (
  landmark.type ===
  "capital"
 ) {
  category =
   "王都";
 }

 if (
  landmark.type ===
  "castle"
 ) {
  category =
   "城";
 }

 addTeleportPoint(
  landmark,
  category
 );
}
