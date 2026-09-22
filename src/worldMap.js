// ==================================================
// WORLD MAP
// ==================================================
export const WORLD_MAP = {

 // --------------------------------------------------
 // WORLD
 // --------------------------------------------------
 world: {
  name: "Paradis Island",

  widthMeters: 1400000,
  lengthMeters: 2000000
 },

 // --------------------------------------------------
 // WALLS
 // --------------------------------------------------
 /*
  * 模式図を基準にした仮配置。
  *
  * 中心 → Sina  = 250km
  * Sina → Rose  = 130km
  * Rose → Maria = 100km
  */
 walls: {
  sina: {
   id: "sina",
   name: "ウォール・シーナ",

   radiusMeters: 250000,
   heightMeters: 50,
   thicknessMeters: 12
  },

  rose: {
   id: "rose",
   name: "ウォール・ローゼ",

   radiusMeters: 380000,
   heightMeters: 50,
   thicknessMeters: 12
  },

  maria: {
   id: "maria",
   name: "ウォール・マリア",

   radiusMeters: 480000,
   heightMeters: 50,
   thicknessMeters: 12
  }
 },

 // --------------------------------------------------
 // DISTRICTS
 // --------------------------------------------------
 /*
  * 突出区。
  *
  * angleDegrees:
  *
  *   0 = 北
  *  90 = 東
  * 180 = 南
  * 270 = 西
  *
  * radiusMeters は地区そのものの
  * 仮半径。
  */
 districts: [

  // ------------------------------------------------
  // WALL MARIA
  // ------------------------------------------------
  {
   id: "utopia",
   name: "ユトピア区",
   wall: "maria",
   angleDegrees: 0,
   radiusMeters: 2800
  },

  {
   id: "karanes",
   name: "カラネス区",
   wall: "maria",
   angleDegrees: 90,
   radiusMeters: 2800
  },

  {
   id: "shiganshina",
   name: "シガンシナ区",
   wall: "maria",
   angleDegrees: 180,
   radiusMeters: 3200
  },

  {
   id: "quinta",
   name: "クインタ区",
   wall: "maria",
   angleDegrees: 270,
   radiusMeters: 2800
  },

  // ------------------------------------------------
  // WALL ROSE
  // ------------------------------------------------
  {
   id: "orvud",
   name: "オルブド区",
   wall: "rose",
   angleDegrees: 0,
   radiusMeters: 2600
  },

  {
   id: "stohess",
   name: "ストヘス区",
   wall: "rose",
   angleDegrees: 90,
   radiusMeters: 2600
  },

  {
   id: "trost",
   name: "トロスト区",
   wall: "rose",
   angleDegrees: 180,
   radiusMeters: 3000
  },

  {
   id: "krolva",
   name: "クロルバ区",
   wall: "rose",
   angleDegrees: 270,
   radiusMeters: 2600
  },

  // ------------------------------------------------
  // WALL SINA
  // ------------------------------------------------
  {
   id: "ermih",
   name: "エルミハ区",
   wall: "sina",
   angleDegrees: 180,
   radiusMeters: 2400
  },

  {
   id: "yalkell",
   name: "ヤルケル区",
   wall: "sina",
   angleDegrees: 270,
   radiusMeters: 2400
  }
 ],

 // --------------------------------------------------
 // FORESTS
 // --------------------------------------------------
 /*
  * 巨大樹の森。
  *
  * 後でチャンク生成時に
  * ノイズから木を配置する。
  */
 forests: [
  {
   id: "giant_forest_sw",
   name: "巨大樹の森 南西",

   xMeters: -150000,
   zMeters: 415000,

   radiusMeters: 30000,

   density: 0.72,

   treeHeightMinMeters: 45,
   treeHeightMaxMeters: 80
  },

  {
   id: "giant_forest_se",
   name: "巨大樹の森 南東",

   xMeters: 190000,
   zMeters: 335000,

   radiusMeters: 32000,

   density: 0.78,

   treeHeightMinMeters: 45,
   treeHeightMaxMeters: 85
  }
 ],

 // --------------------------------------------------
 // LANDMARKS
 // --------------------------------------------------
 landmarks: [
  {
   id: "mitras",
   name: "王都ミットラス",
   type: "capital",

   xMeters: 0,
   zMeters: 0
  },

  {
   id: "utgard",
   name: "ウトガルド城",
   type: "castle",

   xMeters: -145000,
   zMeters: 150000,

   radiusMeters: 500
  },

  {
   id: "ragako",
   name: "ラガコ村",
   type: "village",

   xMeters: -80000,
   zMeters: 185000,

   radiusMeters: 900
  },

  {
   id: "dauper",
   name: "ダウパー村",
   type: "village",

   xMeters: -130000,
   zMeters: 80000,

   radiusMeters: 900
  }
 ]
};
