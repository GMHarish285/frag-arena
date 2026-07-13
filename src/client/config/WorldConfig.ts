export const BaseWorldConfig = {
  physics: {
    gravityY: 2400,
  },
  boundaries: {
    minX: -200,
    maxX: 2120,
    killY: 1500, // Falling below this triggers death/respawn
    padding: 150,
  },
};
