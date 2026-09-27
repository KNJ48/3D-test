// ==================================================
// WORLD MAP
// ==================================================
export const WORLD_MAP = {

 // --------------------------------------------------
 // WORLD
 // --------------------------------------------------
 world: {
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
 walls: {
 sina: {
 id:
 "sina",

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
 id:
 "rose",

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
 id:
 "maria",

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
 // AREAS
 // --------------------------------------------------
 areas: [
 {
 id:
 "shiganshina_west",

 name:
 "西シガンシナ区",

 type:
 "rectangle",

 xMeters:
 -1500,

 zMeters:
 480000,

 widthMeters:
 1000,

 depthMeters:
 4000
 },

 {
 id:
 "shiganshina_central",

 name:
 "シガンシナ区",

 type:
 "rectangle",

 xMeters:
 0,

 zMeters:
 480000,

 widthMeters:
 2000,

 depthMeters:
 4000
 },

 {
 id:
 "shiganshina_east",

 name:
 "東シガンシナ区",

 type:
 "rectangle",

 xMeters:
 1500,

 zMeters:
 480000,

 widthMeters:
 1000,

 depthMeters:
 4000
 }
 ],

 // --------------------------------------------------
 // DISTRICTS
 // --------------------------------------------------
 /*
 * 旧Generatorとの互換性のため、
 *
 * cityRadiusMeters
 * xMeters
 * zMeters
 * seed
 *
 * も確定値として持つ。
 */
 districts: [
 {
 id:
 "utopia",

 name:
 "ユトピア区",

 wall:
 "maria",

 angleDegrees:
 0,

 radiusMeters:
 2800,

 cityRadiusMeters:
 2800,

 xMeters:
 0,

 zMeters:
 -480000,

 seed:
 1001
 },

 {
 id:
 "karanes",

 name:
 "カラネス区",

 wall:
 "maria",

 angleDegrees:
 90,

 radiusMeters:
 2800,

 cityRadiusMeters:
 2800,

 xMeters:
 480000,

 zMeters:
 0,

 seed:
 1002
 },

 {
 id:
 "shiganshina",

 name:
 "シガンシナ区",

 wall:
 "maria",

 angleDegrees:
 180,

 radiusMeters:
 3200,

 cityRadiusMeters:
 3200,

 xMeters:
 0,

 zMeters:
 480000,

 seed:
 1003
 },

 {
 id:
 "quinta",

 name:
 "クインタ区",

 wall:
 "maria",

 angleDegrees:
 270,

 radiusMeters:
 2800,

 cityRadiusMeters:
 2800,

 xMeters:
 -480000,

 zMeters:
 0,

 seed:
 1004
 },

 {
 id:
 "orvud",

 name:
 "オルブド区",

 wall:
 "rose",

 angleDegrees:
 0,

 radiusMeters:
 2600,

 cityRadiusMeters:
 2600,

 xMeters:
 0,

 zMeters:
 -380000,

 seed:
 2001
 },

 {
 id:
 "stohess",

 name:
 "ストヘス区",

 wall:
 "rose",

 angleDegrees:
 90,

 radiusMeters:
 2600,

 cityRadiusMeters:
 2600,

 xMeters:
 380000,

 zMeters:
 0,

 seed:
 2002
 },

 {
 id:
 "trost",

 name:
 "トロスト区",

 wall:
 "rose",

 angleDegrees:
 180,

 radiusMeters:
 3000,

 cityRadiusMeters:
 3000,

 xMeters:
 0,

 zMeters:
 380000,

 seed:
 2003
 },

 {
 id:
 "krolva",

 name:
 "クロルバ区",

 wall:
 "rose",

 angleDegrees:
 270,

 radiusMeters:
 2600,

 cityRadiusMeters:
 2600,

 xMeters:
 -380000,

 zMeters:
 0,

 seed:
 2004
 },

 {
 id:
 "ermih",

 name:
 "エルミハ区",

 wall:
 "sina",

 angleDegrees:
 180,

 radiusMeters:
 2400,

 cityRadiusMeters:
 2400,

 xMeters:
 0,

 zMeters:
 250000,

 seed:
 3001
 },

 {
 id:
 "yalkell",

 name:
 "ヤルケル区",

 wall:
 "sina",

 angleDegrees:
 270,

 radiusMeters:
 2400,

 cityRadiusMeters:
 2400,

 xMeters:
 -250000,

 zMeters:
 0,

 seed:
 3002
 }
 ],

 // --------------------------------------------------
 // VILLAGES
 // --------------------------------------------------
 /*
 * ここが今回のエラーの根本修正。
 *
 * WORLD_MAP.villagesを
 * 正式に定義する。
 */
 villages: [
 {
 id:
 "ragako",

 name:
 "ラガコ村",

 type:
 "village",

 xMeters:
 -80000,

 zMeters:
 185000,

 radiusMeters:
 900,

 seed:
 4001
 },

 {
 id:
 "dauper",

 name:
 "ダウパー村",

 type:
 "village",

 xMeters:
 -130000,

 zMeters:
 80000,

 radiusMeters:
 900,

 seed:
 4002
 }
 ],

 // --------------------------------------------------
 // FORESTS
 // --------------------------------------------------
 forests: [
 {
 id:
 "giant_forest_sw",

 name:
 "巨大樹の森",

 type:
 "giant",

 xMeters:
 -150000,

 zMeters:
 415000,

 radiusMeters:
 30000,

 density:
 0.68,

 seed:
 5001,

 treeHeightMinMeters:
 55,

 treeHeightMaxMeters:
 100
 },

 {
 id:
 "giant_forest_se",

 name:
 "巨大樹の森",

 type:
 "giant",

 xMeters:
 190000,

 zMeters:
 335000,

 radiusMeters:
 32000,

 density:
 0.68,

 seed:
 5002,

 treeHeightMinMeters:
 55,

 treeHeightMaxMeters:
 100
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
 3500,

 seed:
 6001
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
 500,

 seed:
 6002
 },

 {
 id:
 "ragako",

 name:
 "ラガコ村",

 type:
 "village",

 xMeters:
 -80000,

 zMeters:
 185000,

 radiusMeters:
 900
 },

 {
 id:
 "dauper",

 name:
 "ダウパー村",

 type:
 "village",

 xMeters:
 -130000,

 zMeters:
 80000,

 radiusMeters:
 900
 }
 ]
};
