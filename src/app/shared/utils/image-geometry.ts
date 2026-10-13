export type FrameFormat = 'free' | 'square' | 'story' | 'avatar';
export type FrameShape = 'square' | 'rounded' | 'circle';
export type FilterName = 'none' | 'bw' | 'sepia';

export interface Size {
  width: number;
  height: number;
}

export interface Transform {
  /** Zoom en % (100 = l'image remplit tout juste le cadre). */
  zoom: number;
  /** Rotation fine en degrés. */
  rotation: number;
  /** Nombre de quarts de tour (peut être négatif). */
  turns: number;
  flipX: boolean;
  /** Décalage de l'image, en fraction de la largeur / hauteur du cadre. */
  offsetX: number;
  offsetY: number;
}

export interface FrameSettings {
  format: FrameFormat;
  shape: FrameShape;
}

export const ZOOM_MIN = 100;
export const ZOOM_MAX = 300;
export const ROTATION_MIN = -45;
export const ROTATION_MAX = 45;

export const DEFAULT_TRANSFORM: Transform = {
  zoom: 100,
  rotation: 0,
  turns: 0,
  flipX: false,
  offsetX: 0,
  offsetY: 0,
};

export const DEFAULT_FRAME: FrameSettings = { format: 'free', shape: 'square' };

/** Dimensions d'export des formats prédéfinis. */
const SQUARE_SIZE = 1080;
const STORY_SIZE: Size = { width: 1080, height: 1920 };
const AVATAR_SIZE = 512;

export function isRoundFrame(frame: FrameSettings): boolean {
  return frame.shape === 'circle' || frame.format === 'avatar';
}

/** Taille du canvas exporté. Un cadre rond est toujours carré. */
export function frameSize(image: Size, frame: FrameSettings, turns: number): Size {
  const swapped = Math.abs(turns) % 2 === 1;
  const width = swapped ? image.height : image.width;
  const height = swapped ? image.width : image.height;
  const round = isRoundFrame(frame);

  switch (frame.format) {
    case 'square':
      return { width: SQUARE_SIZE, height: SQUARE_SIZE };
    case 'story':
      return round ? { width: SQUARE_SIZE, height: SQUARE_SIZE } : { ...STORY_SIZE };
    case 'avatar':
      return { width: AVATAR_SIZE, height: AVATAR_SIZE };
    default: {
      const side = Math.min(width, height);
      return round ? { width: side, height: side } : { width, height };
    }
  }
}

/** Échelle minimale pour que l'image (tournée de `angle` radians) recouvre tout le cadre. */
export function coverScale(image: Size, frame: Size, angle: number): number {
  const cos = Math.abs(Math.cos(angle));
  const sin = Math.abs(Math.sin(angle));
  return Math.max(
    (frame.width * cos + frame.height * sin) / image.width,
    (frame.width * sin + frame.height * cos) / image.height,
  );
}

export interface Placement {
  frame: Size;
  /** Échelle appliquée à l'image source. */
  scale: number;
  /** Angle total en radians (rotation fine + quarts de tour). */
  angle: number;
  /** Décalage du centre de l'image par rapport au centre du cadre, en pixels du cadre. */
  translateX: number;
  translateY: number;
}

/**
 * Réduit le décalage (tx, ty) pour que l'image continue de recouvrir tout le cadre.
 * Le décalage est ramené vers 0 par un facteur λ commun aux deux axes.
 */
export function clampPan(
  image: Size,
  frame: Size,
  scale: number,
  angle: number,
  tx: number,
  ty: number,
): { x: number; y: number } {
  const halfWidth = (image.width * scale) / 2;
  const halfHeight = (image.height * scale) / 2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // translation exprimée dans le repère de l'image
  const qu = tx * cos + ty * sin;
  const qv = -tx * sin + ty * cos;

  let lambda = 1;
  for (const cx of [-frame.width / 2, frame.width / 2]) {
    for (const cy of [-frame.height / 2, frame.height / 2]) {
      const pu = cx * cos + cy * sin;
      const pv = -cx * sin + cy * cos;
      lambda = Math.min(lambda, maxFactor(pu, qu, halfWidth), maxFactor(pv, qv, halfHeight));
    }
  }
  lambda = Math.max(0, lambda);
  return { x: tx * lambda, y: ty * lambda };
}

/** Plus grand λ tel que |p - λ·q| ≤ limit. */
function maxFactor(p: number, q: number, limit: number): number {
  if (Math.abs(q) < 1e-9) return Infinity;
  const bound = q > 0 ? (p + limit) / q : (p - limit) / q;
  return bound;
}

export function computePlacement(image: Size, frame: FrameSettings, transform: Transform): Placement {
  const size = frameSize(image, frame, transform.turns);
  const angle = ((transform.rotation + transform.turns * 90) * Math.PI) / 180;
  const scale = coverScale(image, size, angle) * (transform.zoom / 100);
  const pan = clampPan(image, size, scale, angle, transform.offsetX * size.width, transform.offsetY * size.height);
  return { frame: size, scale, angle, translateX: pan.x, translateY: pan.y };
}

/** Ramène les décalages (en fractions du cadre) dans les limites autorisées. */
export function clampOffsets(
  image: Size,
  frame: FrameSettings,
  transform: Transform,
): { offsetX: number; offsetY: number } {
  const placement = computePlacement(image, frame, transform);
  return {
    offsetX: placement.translateX / placement.frame.width,
    offsetY: placement.translateY / placement.frame.height,
  };
}
