/**
 * Logical canvas size for the 9:16 portrait playfield. World units = pixels.
 * Picked 540x960 for a comfortable middle-ground; the renderer scales the
 * physical canvas while keeping these world coordinates fixed.
 */
export const LOGICAL_WIDTH = 540;
export const LOGICAL_HEIGHT = 960;
export const LOGICAL_ASPECT = LOGICAL_WIDTH / LOGICAL_HEIGHT;
