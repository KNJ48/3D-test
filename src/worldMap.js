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
 // AREAS
 // --------------------------------------------------
 /*
  * 地名表示用のエリア。
  *
  * 座標とサイズはすべて実寸m。
  *
  * 現在は動作確認用として
  * シガンシナ周辺を
  * 西・中央・東の3エリアに分割。
  */
 areas: [
  {
   id: "shiganshina_west",
   name: "西シガンシナ区",

   type: "rectangle",

   xMeters: -1500,
   zMeters: 480000,

   widthMeters: 1000,
   depthMeters: 4000
  },

  {
   id: "shiganshina_central",
   name: "シガンシナ区",

   type: "rectangle",

   xMeters: 0,
   zMeters: 480000,

   widthMeters: 2000,
   depthMeters: 4000
  },

  {
   id: "shiganshina_east",
   name: "東シガンシナ区",

   type: "rectangle",

   xMeters: 1500,
   zMeters: 480000,

   widthMeters: 1000,
   depthMeters: 4000
  }
 ],

 // --------------------------------------------------
 // DISTRICTS
 // --------------------------------------------------
 districts: [
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
 forests: [
  {
   id: "giant_forest_sw",
   name: "巨大樹の森",

   xMeters: -150000,
   zMeters: 415000,

   radiusMeters: 30000
  },

  {
   id: "giant_forest_se",
   name: "巨大樹の森",

   xMeters: 190000,
   zMeters: 335000,

   radiusMeters: 32000
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