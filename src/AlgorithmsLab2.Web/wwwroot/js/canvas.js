// Canvas host for Fractals: TypedArray only, DPI-aware, Pan & Zoom, and Step-by-Step scrub.

export function createHost(canvas) {
  if (!canvas) return;

  const state = {
    dpr: window.devicePixelRatio || 1,
    cssWidth: 0,
    cssHeight: 0,
    transform: { x: 0, y: 0, scale: 1.0 },
    isPanning: false,
    startX: 0,
    startY: 0,
    userHasPanned: false,
    hudButtons: [],
    xyBytes: null,
    options: null,
    bounds: null,
    lastByteLength: 0
  };

  const getDpr = () => window.devicePixelRatio || 1;

  // Zoom centered around mouse cursor
  const onWheel = (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const dpr = getDpr();
    const mx = (e.clientX - rect.left) * dpr;
    const my = (e.clientY - rect.top) * dpr;

    const zoom = e.deltaY < 0 ? 1.15 : 0.87;
    const oldScale = state.transform.scale;
    const minScale = 0.05;
    const maxScale = 50.0;
    const newScale = Math.min(maxScale, Math.max(minScale, oldScale * zoom));

    const W = canvas.width;
    const H = canvas.height;
    const worldX = (mx - state.transform.x - W / 2) / oldScale;
    const worldY = (my - state.transform.y - H / 2) / oldScale;

    state.transform.scale = newScale;
    state.transform.x = mx - (worldX * newScale + W / 2);
    state.transform.y = my - (worldY * newScale + H / 2);
    state.userHasPanned = true;

    redraw(canvas);
  };

  // Pointer events with PointerCapture
  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = getDpr();
    const mx = (e.clientX - rect.left) * dpr;
    const my = (e.clientY - rect.top) * dpr;

    // Check HUD Buttons hit
    if (state.hudButtons && state.hudButtons.length > 0) {
      for (const btn of state.hudButtons) {
        if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
          btn.action();
          redraw(canvas);
          return;
        }
      }
    }

    state.isPanning = true;
    state.startX = e.clientX;
    state.startY = e.clientY;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    canvas.style.cursor = "grabbing";
  };

  const onPointerMove = (e) => {
    if (state.isPanning) {
      const dpr = getDpr();
      const dx = (e.clientX - state.startX) * dpr;
      const dy = (e.clientY - state.startY) * dpr;
      state.startX = e.clientX;
      state.startY = e.clientY;
      state.transform.x += dx;
      state.transform.y += dy;
      state.userHasPanned = true;
      redraw(canvas);
    } else {
      const rect = canvas.getBoundingClientRect();
      const dpr = getDpr();
      const mx = (e.clientX - rect.left) * dpr;
      const my = (e.clientY - rect.top) * dpr;

      let isOverBtn = false;
      if (state.hudButtons && state.hudButtons.length > 0) {
        for (const btn of state.hudButtons) {
          if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
            isOverBtn = true;
            break;
          }
        }
      }
      canvas.style.cursor = isOverBtn ? "pointer" : "grab";
    }
  };

  const onPointerUp = (e) => {
    state.isPanning = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    canvas.style.cursor = "grab";
  };

  const onDblClick = (e) => {
    const rect = canvas.getBoundingClientRect();
    const dpr = getDpr();
    const mx = (e.clientX - rect.left) * dpr;
    const my = (e.clientY - rect.top) * dpr;

    if (state.hudButtons && state.hudButtons.some((b) => mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h)) {
      return;
    }

    state.userHasPanned = false;
    state.transform.x = 0;
    state.transform.y = 0;
    state.transform.scale = 1.0;
    redraw(canvas);
  };

  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("dblclick", onDblClick);
  canvas.style.cursor = "grab";

  const ro = new ResizeObserver(() => {
    resize(canvas);
    redraw(canvas);
  });
  ro.observe(canvas);

  state.ro = ro;
  state._listeners = { onWheel, onPointerDown, onPointerMove, onPointerUp, onDblClick };
  canvas.__gosper = state;

  resize(canvas);
}

export function disposeHost(canvas) {
  if (!canvas || !canvas.__gosper) return;
  const s = canvas.__gosper;
  if (s.ro) {
    s.ro.disconnect();
    s.ro = null;
  }
  if (s._listeners) {
    canvas.removeEventListener("wheel", s._listeners.onWheel);
    canvas.removeEventListener("pointerdown", s._listeners.onPointerDown);
    canvas.removeEventListener("pointermove", s._listeners.onPointerMove);
    canvas.removeEventListener("pointerup", s._listeners.onPointerUp);
    canvas.removeEventListener("pointercancel", s._listeners.onPointerUp);
    canvas.removeEventListener("dblclick", s._listeners.onDblClick);
  }
  canvas.__gosper = null;
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
  if (canvas.__gosper) {
    canvas.__gosper.dpr = dpr;
    canvas.__gosper.cssWidth = cssW;
    canvas.__gosper.cssHeight = cssH;
  }
}

function redraw(canvas) {
  if (!canvas || !canvas.__gosper) return;
  const s = canvas.__gosper;
  if (s.xyBytes) {
    renderGosper(canvas, s.xyBytes, s.options);
  }
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Uint8Array} xyBytes  — float32 little-endian: x0,y0,x1,y1,…
 * @param {object} options { lineColor, lineWidth, background, pad, glow, progress }
 */
export function drawPolyline(canvas, xyBytes, options) {
  if (!canvas) return;
  if (!canvas.__gosper) createHost(canvas);

  const s = canvas.__gosper;
  if (xyBytes != null) {
    s.xyBytes = xyBytes;
    if (xyBytes.byteLength === 0) {
      s.bounds = null;
      s.lastByteLength = 0;
    }
  }
  if (options) {
    s.options = options;
  }

  renderGosper(canvas, s.xyBytes, s.options);
}

export function setProgress(canvas, progress) {
  if (!canvas || !canvas.__gosper) return;
  canvas.__gosper.options = canvas.__gosper.options || {};
  canvas.__gosper.options.progress = progress;
  redraw(canvas);
}

export function resetView(canvas) {
  if (!canvas || !canvas.__gosper) return;
  const s = canvas.__gosper;
  s.transform.x = 0;
  s.transform.y = 0;
  s.transform.scale = 1.0;
  s.userHasPanned = false;
  redraw(canvas);
}

function renderGosper(canvas, xyBytes, options) {
  if (!canvas) return;
  resize(canvas);
  const ctx = canvas.getContext("2d");
  const s = canvas.__gosper;
  const dpr = s ? s.dpr : (window.devicePixelRatio || 1);
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

  if (!xyBytes || xyBytes.byteLength < 8) {
    ctx.restore();
    return;
  }

  const count = xyBytes.byteLength / 8; // float32 pairs
  const xy = new Float32Array(xyBytes.buffer, xyBytes.byteOffset, count * 2);

  // Cache bounding box for fast 60fps pan/zoom/scrub
  let bounds = s.bounds;
  if (!bounds || s.lastByteLength !== xyBytes.byteLength) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < count; i++) {
      const x = xy[i * 2], y = xy[i * 2 + 1];
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
    bounds = {
      minX, minY, maxX, maxY,
      bw: Math.max(1e-6, maxX - minX),
      bh: Math.max(1e-6, maxY - minY)
    };
    s.bounds = bounds;
    s.lastByteLength = xyBytes.byteLength;
  }

  const padCss = opts.pad != null ? opts.pad : 28;
  const pad = padCss * dpr;
  const baseScale = Math.min((W - pad * 2) / bounds.bw, (H - pad * 2) / bounds.bh);
  const ox = (W - bounds.bw * baseScale) / 2 - bounds.minX * baseScale;
  const oy = (H - bounds.bh * baseScale) / 2 - bounds.minY * baseScale;

  const t = s.transform;

  // Render transformed polyline
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.clip();

  ctx.translate(W / 2 + t.x, H / 2 + t.y);
  ctx.scale(t.scale, t.scale);
  ctx.translate(-W / 2, -H / 2);

  const path = new Path2D();
  path.moveTo(ox + xy[0] * baseScale, oy + (bounds.maxY + bounds.minY - xy[1]) * baseScale);
  const limit = opts.progress != null && opts.progress < 1
    ? Math.max(1, Math.floor(count * opts.progress))
    : count;
  for (let i = 1; i < limit; i++) {
    const x = ox + xy[i * 2] * baseScale;
    const y = oy + (bounds.maxY + bounds.minY - xy[i * 2 + 1]) * baseScale;
    path.lineTo(x, y);
  }

  const isHighDensity = count > 40000;
  const lw = (opts.lineWidth != null ? opts.lineWidth : 1.5) * dpr;
  const join = isHighDensity ? "miter" : "round";
  const cap = isHighDensity ? "butt" : "round";

  if (opts.glow && !isHighDensity) {
    ctx.strokeStyle = opts.glow;
    ctx.lineWidth = lw * 2.2;
    ctx.lineJoin = join;
    ctx.lineCap = cap;
    ctx.globalAlpha = 0.35;
    ctx.stroke(path);
    ctx.globalAlpha = 1;
  }

  ctx.strokeStyle = opts.lineColor || "#5b8cff";
  ctx.lineWidth = lw;
  ctx.lineJoin = join;
  ctx.lineCap = cap;
  ctx.stroke(path);

  ctx.restore(); // End transformed geometry clip

  // Render fixed HUD controls layer in screen space
  const hudTop = 14 * dpr;
  const btnH = 26 * dpr;
  const btnW = 30 * dpr;
  const fitW = 74 * dpr;
  const resetW = 74 * dpr;
  const gap = 6 * dpr;

  const resetBtnX = W - resetW - 14 * dpr;
  const fitBtnX = resetBtnX - fitW - gap;
  const minusBtnX = fitBtnX - btnW - gap;
  const plusBtnX = minusBtnX - btnW - gap;

  s.hudButtons = [
    {
      x: plusBtnX,
      y: hudTop,
      w: btnW,
      h: btnH,
      action: () => {
        s.transform.scale = Math.min(50.0, s.transform.scale * 1.25);
        s.userHasPanned = true;
      }
    },
    {
      x: minusBtnX,
      y: hudTop,
      w: btnW,
      h: btnH,
      action: () => {
        s.transform.scale = Math.max(0.05, s.transform.scale * 0.8);
        s.userHasPanned = true;
      }
    },
    {
      x: fitBtnX,
      y: hudTop,
      w: fitW,
      h: btnH,
      action: () => {
        s.transform.scale = 1.0;
        s.transform.x = 0;
        s.transform.y = 0;
        s.userHasPanned = false;
      }
    },
    {
      x: resetBtnX,
      y: hudTop,
      w: resetW,
      h: btnH,
      action: () => {
        s.transform.scale = 1.0;
        s.transform.x = 0;
        s.transform.y = 0;
        s.userHasPanned = false;
      }
    }
  ];

  // 1. Zoom info pill
  const zoomText = `${Math.round(t.scale * 100)}%`;
  ctx.font = `600 ${11 * dpr}px ui-monospace, monospace`;
  const zoomW = ctx.measureText(zoomText).width + 16 * dpr;
  const zoomPillX = plusBtnX - zoomW - 8 * dpr;

  drawGlassCard(ctx, zoomPillX, hudTop, zoomW, btnH, 5 * dpr, "rgba(18, 26, 44, 0.8)", "rgba(255, 255, 255, 0.1)");
  ctx.fillStyle = "#95a3bf";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(zoomText, zoomPillX + zoomW / 2, hudTop + btnH / 2);

  // 2. Button [+]
  drawGlassCard(ctx, plusBtnX, hudTop, btnW, btnH, 5 * dpr, "rgba(26, 38, 64, 0.85)", "rgba(79, 140, 255, 0.5)");
  ctx.font = `700 ${14 * dpr}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("+", plusBtnX + btnW / 2, hudTop + btnH / 2);

  // 3. Button [−]
  drawGlassCard(ctx, minusBtnX, hudTop, btnW, btnH, 5 * dpr, "rgba(26, 38, 64, 0.85)", "rgba(79, 140, 255, 0.5)");
  ctx.font = `700 ${14 * dpr}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("−", minusBtnX + btnW / 2, hudTop + btnH / 2);

  // 4. Button [⊡ Обзор]
  drawGlassCard(ctx, fitBtnX, hudTop, fitW, btnH, 5 * dpr, "rgba(26, 38, 64, 0.85)", "rgba(79, 140, 255, 0.5)");
  ctx.font = `600 ${11 * dpr}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = "#e8eefc";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("⊡ Обзор", fitBtnX + fitW / 2, hudTop + btnH / 2);

  // 5. Button [⟲ Сброс]
  drawGlassCard(ctx, resetBtnX, hudTop, resetW, btnH, 5 * dpr, "rgba(26, 38, 64, 0.85)", "rgba(79, 140, 255, 0.5)");
  ctx.font = `600 ${11 * dpr}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = "#e8eefc";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("⟲ Сброс", resetBtnX + resetW / 2, hudTop + btnH / 2);

  // Bottom interactive navigation hint
  ctx.font = `${10 * dpr}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = "rgba(149, 163, 191, 0.85)";
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("🔍 Перетаскивание мышью · Колёсико: зум · Двойной клик: сброс", W - 18 * dpr, H - 10 * dpr);

  ctx.restore();
}

function drawGlassCard(ctx, x, y, w, h, r, bg, border) {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
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
