// worldMap.js

export const WORLD_MAP = {
  world: {
    name: "Paradis Island",

    // 暫定値
    widthMeters: 1400000,
    lengthMeters: 2000000
  },

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

  districts: [
    {
      id: "shiganshina",
      name: "シガンシナ区",

      wall: "maria",

      xMeters: 0,
      zMeters: 481500,

      widthMeters: 1800,
      depthMeters: 3000
    },

    {
      id: "trost",
      name: "トロスト区",

      wall: "rose",

      xMeters: 0,
      zMeters: 381300,

      widthMeters: 1700,
      depthMeters: 2600
    }
  ],

  landmarks: [
    {
      id: "utgard",
      name: "ウトガルド城",

      type: "castle",

      xMeters: -145000,
      zMeters: 150000,

      radiusMeters: 500
    }
  ]
};