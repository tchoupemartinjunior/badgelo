import { DEFAULT_FRAME, coverScale, frameSize, isRoundFrame } from './image-geometry';

describe('image-geometry', () => {
  const photo = { width: 4000, height: 3000 };

  it('treats circle shape and avatar format as round frames', () => {
    expect(isRoundFrame({ ...DEFAULT_FRAME, shape: 'circle' })).toBe(true);
    expect(isRoundFrame({ format: 'avatar', shape: 'square' })).toBe(true);
    expect(isRoundFrame(DEFAULT_FRAME)).toBe(false);
  });

  it('computes output sizes per format', () => {
    expect(frameSize(photo, { format: 'square', shape: 'square' }, 0)).toEqual({ width: 1080, height: 1080 });
    expect(frameSize(photo, { format: 'story', shape: 'square' }, 0)).toEqual({ width: 1080, height: 1920 });
    expect(frameSize(photo, { format: 'avatar', shape: 'circle' }, 0)).toEqual({ width: 512, height: 512 });
  });

  it('keeps the original size in free format and swaps it after a quarter turn', () => {
    expect(frameSize(photo, { format: 'free', shape: 'square' }, 0)).toEqual(photo);
    expect(frameSize(photo, { format: 'free', shape: 'square' }, 1)).toEqual({ width: 3000, height: 4000 });
  });

  it('forces a square output for a round free frame', () => {
    expect(frameSize(photo, { format: 'free', shape: 'circle' }, 0)).toEqual({ width: 3000, height: 3000 });
  });

  it('needs a larger scale to cover the frame once the image is rotated', () => {
    const frame = { width: 1080, height: 1080 };
    expect(coverScale(photo, frame, Math.PI / 6)).toBeGreaterThan(coverScale(photo, frame, 0));
  });
});
