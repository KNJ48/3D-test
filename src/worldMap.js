// ==================================================
// WORLD MAP
// ==================================================
/*
 * このファイルにある地点は
 * WORLD SEEDに関係なく存在する。
 *
 * WORLD SEEDが変更するのは、
 *
 * ・地形の細部
 * ・普通の村
 * ・普通の森林
 * ・家の細かな配置
 * ・木の細かな配置
 *
 * など。
 */
export const WORLD_MAP = {

 // --------------------------------------------------
 // WORLD
 // --------------------------------------------------
 world: {
  id: "paradis",

  name:
   "Paradis Island",

  widthMeters:
   1400000,

  lengthMeters:
   2000000
 },

 // --------------------------------------------------
 // WALLS
 // --------------------------------------------------
 /*
  * 模式図を基準にした
  * 現在の仮スケール。
  *
  * 中心 → Sina
  * 250km
  *
  * Sina → Rose
  * 130km
  *
  * Rose → Maria
  * 100km
  */
 walls: {
  sina: {
   id: "sina",

   name:
    "ウォール・シーナ",

   radiusMeters:
    250000,

   heightMeters:
    50,

   thicknessMeters:
    12
  },

  rose: {
   id: "rose",

   name:
    "ウォール・ローゼ",

   radiusMeters:
    380000,

   heightMeters:
    50,

   thicknessMeters:
    12
  },

  maria: {
   id: "maria",

   name:
    "ウォール・マリア",

   radiusMeters:
    480000,

   heightMeters:
    50,

   thicknessMeters:
    12
  }
 },

 // --------------------------------------------------
 // MAJOR DISTRICTS
 // --------------------------------------------------
 /*
  * 主要地区。
  *
  * ここに登録された地区は
  * seedに関係なく必ず生成する。
  *
  * x/zは地区中心。
  *
  * entranceX/Zは
  * TPで着地する入口。
  */
 districts: [

  // ------------------------------------------------
  // MARIA
  // ------------------------------------------------
  {
   id:
    "shiganshina",

   name:
    "シガンシナ区",

   wall:
    "maria",

   xMeters:
    0,

   zMeters:
    483000,

   entranceX:
    0,

   entranceZ:
    479500,

   radiusMeters:
    3200,

   cityRadiusMeters:
    2600,

   importance:
    "major",

   seed:
    19347
  },

  {
   id:
    "utopia",

   name:
    "ユトピア区",

   wall:
    "maria",

   xMeters:
    0,

   zMeters:
    -483000,

   entranceX:
    0,

   entranceZ:
    -479500,

   radiusMeters:
    2800,

   cityRadiusMeters:
    2200,

   importance:
    "major",

   seed:
    29471
  },

  {
   id:
    "quinta",

   name:
    "クインタ区",

   wall:
    "maria",

   xMeters:
    -483000,

   zMeters:
    0,

   entranceX:
    -479500,

   entranceZ:
    0,

   radiusMeters:
    2800,

   cityRadiusMeters:
    2200,

   importance:
    "major",

   seed:
    51829
  },

  {
   id:
    "karanes",

   name:
    "カラネス区",

   wall:
    "maria",

   xMeters:
    483000,

   zMeters:
    0,

   entranceX:
    479500,

   entranceZ:
    0,

   radiusMeters:
    2800,

   cityRadiusMeters:
    2200,

   importance:
    "major",

   seed:
    68171
  },

  // ------------------------------------------------
  // ROSE
  // ------------------------------------------------
  {
   id:
    "trost",

   name:
    "トロスト区",

   wall:
    "rose",

   xMeters:
    0,

   zMeters:
    383000,

   entranceX:
    0,

   entranceZ:
    379500,

   radiusMeters:
    3000,

   cityRadiusMeters:
    2400,

   importance:
    "major",

   seed:
    82741
  },

  {
   id:
    "orvud",

   name:
    "オルブド区",

   wall:
    "rose",

   xMeters:
    0,

   zMeters:
    -383000,

   entranceX:
    0,

   entranceZ:
    -379500,

   radiusMeters:
    2600,

   cityRadiusMeters:
    2100,

   importance:
    "major",

   seed:
    43853
  },

  {
   id:
    "krolva",

   name:
    "クロルバ区",

   wall:
    "rose",

   xMeters:
    -383000,

   zMeters:
    0,

   entranceX:
    -379500,

   entranceZ:
    0,

   radiusMeters:
    2600,

   cityRadiusMeters:
    2100,

   importance:
    "major",

   seed:
    73553
  },

  {
   id:
    "stohess",

   name:
    "ストヘス区",

   wall:
    "rose",

   xMeters:
    383000,

   zMeters:
    0,

   entranceX:
    379500,

   entranceZ:
    0,

   radiusMeters:
    2600,

   cityRadiusMeters:
    2100,

   importance:
    "major",

   seed:
    91367
  },

  // ------------------------------------------------
  // SINA
  // ------------------------------------------------
  {
   id:
    "ermih",

   name:
    "エルミハ区",

   wall:
    "sina",

   xMeters:
    0,

   zMeters:
    253000,

   entranceX:
    0,

   entranceZ:
    249500,

   radiusMeters:
    2400,

   cityRadiusMeters:
    1900,

   importance:
    "major",

   seed:
    35279
  },

  {
   id:
    "yalkell",

   name:
    "ヤルケル区",

   wall:
    "sina",

   xMeters:
    -253000,

   zMeters:
    0,

   entranceX:
    -249500,

   entranceZ:
    0,

   radiusMeters:
    2400,

   cityRadiusMeters:
    1900,

   importance:
    "major",

   seed:
    62701
  }
 ],

 // --------------------------------------------------
 // MAJOR FORESTS
 // --------------------------------------------------
 /*
  * TP対象になる確定森林。
  *
  * 普通のprocedural森林より
  * 明確に巨大。
  */
 forests: [
  {
   id:
    "giant_forest_sw",

   name:
    "巨大樹の森・南西",

   type:
    "giant",

   xMeters:
    -150000,

   zMeters:
    415000,

   radiusMeters:
    30000,

   entranceX:
    -150000,

   entranceZ:
    385000,

   treeHeightMinMeters:
    50,

   treeHeightMaxMeters:
    100,

   treeScale:
    5,

   density:
    0.8,

   seed:
    44021
  },

  {
   id:
    "giant_forest_se",

   name:
    "巨大樹の森・南東",

   type:
    "giant",

   xMeters:
    190000,

   zMeters:
    335000,

   radiusMeters:
    32000,

   entranceX:
    190000,

   entranceZ:
    303000,

   treeHeightMinMeters:
    50,

   treeHeightMaxMeters:
    105,

   treeScale:
    5,

   density:
    0.82,

   seed:
    78017
  }
 ],

 // --------------------------------------------------
 // MAJOR VILLAGES
 // --------------------------------------------------
 /*
  * 普通のseed生成村より
  * 大きい確定村。
  */
 villages: [
  {
   id:
    "ragako",

   name:
    "ラガコ村",

   xMeters:
    -80000,

   zMeters:
    185000,

   radiusMeters:
    1200,

   entranceX:
    -80000,

   entranceZ:
    183800,

   importance:
    "landmark",

   seed:
    30727
  },

  {
   id:
    "dauper",

   name:
    "ダウパー村",

   xMeters:
    -130000,

   zMeters:
    80000,

   radiusMeters:
    1200,

   entranceX:
    -130000,

   entranceZ:
    78800,

   importance:
    "landmark",

   seed:
    56039
  }
 ],

 // --------------------------------------------------
 // LANDMARKS
 // --------------------------------------------------
 landmarks: [
  {
   id:
    "mitras",

   name:
    "王都ミットラス",

   type:
    "capital",

   xMeters:
    0,

   zMeters:
    0,

   radiusMeters:
    4500,

   entranceX:
    0,

   entranceZ:
    4300,

   importance:
    "major",

   seed:
    10103
  },

  {
   id:
    "utgard",

   name:
    "ウトガルド城",

   type:
    "castle",

   xMeters:
    -145000,

   zMeters:
    150000,

   radiusMeters:
    700,

   entranceX:
    -145000,

   entranceZ:
    150700,

   importance:
    "major",

   seed:
    29059
  }
 ]
};
