/**
 * rgba顏色正則群組
 */
export const rgbaReg =
  /rgb(a)?\((?<red>\d+),\s+(?<green>\d+),\s+(?<blue>\d+),\s+(?<opacity>\d+(\.\d+)*)\)/;

/**
 * hsla顏色正則群組
 */
export const hslaReg =
  /hsl(a)?\((?<hue>\d+),\s+(?<saturation>\d+),\s+(?<lightness>\d+),\s+(?<opacity>\d+(\.\d+)*)\)/;
