// Canvas host: TypedArray only (no JSON). DPI/resize-aware.
export function createHost(canvas) {
  if (!canvas) return;
  canvas.__gosper = {
    dpr: window.devicePixelRatio || 1,
    cssWidth: 0,
    cssHeight: 0
  };
  const ro = new ResizeObserver(() => resize(canvas));
  ro.observe(canvas);
  canvas.__gosper.ro = ro;
  resize(canvas);
}

export function disposeHost(canvas) {
  if (!canvas) return;
  if (canvas.__gosper && canvas.__gosper.ro) {
    canvas.__gosper.ro.disconnect();
    canvas.__gosper.ro = null;
  }
}

export function resize(canvas) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const cssW = Math.max(1, Math.floor(rect.width));
  const cssH = Math.max(1, Math.floor(rect.height));
  const w = Math.floor(cssW * dpr);
  const h = Math.floor(cssH * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  canvas.__gosper = canvas.__gosper || {};
  canvas.__gosper.dpr = dpr;
  canvas.__gosper.cssWidth = cssW;
  canvas.__gosper.cssHeight = cssH;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Uint8Array} xyBytes  — float32 little-endian: x0,y0,x1,y1,…
 * @param {object} options { lineColor, lineWidth, background, pad, glow, progress }
 */
export function drawPolyline(canvas, xyBytes, options) {
  if (!canvas) return;
  resize(canvas);
  const ctx = canvas.getContext("2d");
  const dpr = canvas.__gosper.dpr || 1;
  const W = canvas.width;
  const H = canvas.height;

  const opts = options || {};
  const bg = opts.background || "rgba(0,0,0,0)";
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  if (bg && bg !== "transparent") {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
  }

  const count = xyBytes.byteLength / 8; // float32 pairs
  if (count < 1) {
    ctx.restore();
    return;
  }

  const xy = new Float32Array(xyBytes.buffer, xyBytes.byteOffset, count * 2);

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i < count; i++) {
    const x = xy[i * 2], y = xy[i * 2 + 1];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  const padCss = opts.pad != null ? opts.pad : 24;
  const pad = padCss * dpr;
  const bw = Math.max(1e-6, maxX - minX);
  const bh = Math.max(1e-6, maxY - minY);
  const scale = Math.min((W - pad * 2) / bw, (H - pad * 2) / bh);
  const ox = (W - bw * scale) / 2 - minX * scale;
  const oy = (H - bh * scale) / 2 - minY * scale;

  // Y is flipped for canvas (turtle Y grows up in math, down on canvas) — keep math orientation
  const path = new Path2D();
  path.moveTo(ox + xy[0] * scale, oy + (maxY + minY - xy[1]) * scale);
  const limit = opts.progress != null && opts.progress < 1
    ? Math.max(1, Math.floor(count * opts.progress))
    : count;
  for (let i = 1; i < limit; i++) {
    const x = ox + xy[i * 2] * scale;
    const y = oy + (maxY + minY - xy[i * 2 + 1]) * scale;
    path.lineTo(x, y);
  }

  const lw = (opts.lineWidth != null ? opts.lineWidth : 1.5) * dpr;
  if (opts.glow) {
    ctx.strokeStyle = opts.glow;
    ctx.lineWidth = lw * 2.2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.globalAlpha = 0.35;
    ctx.stroke(path);
    ctx.globalAlpha = 1;
  }

  ctx.strokeStyle = opts.lineColor || "#5b8cff";
  ctx.lineWidth = lw;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke(path);

  ctx.restore();
}

export function exportPng(canvas, fileName) {
  if (!canvas) return false;
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || "gosper.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
  return true;
}
