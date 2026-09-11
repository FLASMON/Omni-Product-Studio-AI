// Grab a single frame of a video as a JPEG data URL, so the filter panel can
// preview every look on the user's own footage instead of a placeholder.
//
// The app's renders are served from our own origin (/api/video/…), so the canvas
// stays untainted; failures are non-fatal — callers fall back to a stock still.

const TIMEOUT_MS = 8000;

export function captureVideoFrame(src: string, atSeconds = 0.6, width = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = src;

    let settled = false;

    const dispose = () => {
      video.removeAttribute('src');
      try {
        video.load();
      } catch {
        /* ignore */
      }
    };

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      fn();
      dispose();
    };

    const draw = () => {
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) throw new Error('Video frame has no dimensions yet');
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(width, w);
      canvas.height = Math.max(1, Math.round((canvas.width / w) * h));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas is unavailable');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.62);
    };

    const timer = window.setTimeout(() => {
      // Metadata decoded but the seek never landed — take whatever we have.
      try {
        const dataUrl = draw();
        finish(() => resolve(dataUrl));
      } catch (e) {
        finish(() => reject(e));
      }
    }, TIMEOUT_MS);

    video.onerror = () => finish(() => reject(new Error('Could not decode the video')));
    video.onloadeddata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const target = duration > 0 ? Math.min(atSeconds, duration / 2) : 0;
      if (target <= 0) {
        try {
          const dataUrl = draw();
          finish(() => resolve(dataUrl));
        } catch (e) {
          finish(() => reject(e));
        }
        return;
      }
      video.currentTime = target;
    };
    video.onseeked = () => {
      try {
        const dataUrl = draw();
        finish(() => resolve(dataUrl));
      } catch (e) {
        finish(() => reject(e));
      }
    };
  });
}
