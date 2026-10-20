// Lightweight line chart — TypedArray only, with real-time support and hover tooltips.
export function createChart(canvas) {
  if (!canvas || canvas.__chart) return;

  const ro = new ResizeObserver(() => {
    if (canvas.__chart) draw(canvas);
  });
  ro.observe(canvas);

  const onMouseMove = (e) => {
    if (!canvas.__chart || !canvas.__chart.xs || canvas.__chart.xs.length < 2) return;
    const layout = canvas.__chart.layout;
    if (!layout) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const mouseX = (e.clientX - rect.left) * dpr;
    const mouseY = (e.clientY - rect.top) * dpr;

    const { sx, sy, xs, yv, count } = layout;
    let closestIdx = -1;
    let minDistSq = (26 * dpr) * (26 * dpr);

    for (let i = 0; i < count; i++) {
      const px = sx(xs[i]);
      const py = sy(yv[i]);
      const dx = mouseX - px;
      const dy = mouseY - py;
      const distSq = dx * dx + dy * dy;
      if (distSq < minDistSq) {
        minDistSq = distSq;
        closestIdx = i;
      }
    }

    if (canvas.__chart.hoverIndex !== closestIdx) {
      canvas.__chart.hoverIndex = closestIdx;
      draw(canvas);
    }
  };

  const onMouseLeave = () => {
    if (canvas.__chart && canvas.__chart.hoverIndex !== -1) {
      canvas.__chart.hoverIndex = -1;
      draw(canvas);
    }
  };

  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("mouseleave", onMouseLeave);

  canvas.__chart = {
    ro,
    xs: new Float32Array(0),
    ys: new Float32Array(0),
    options: null,
    hoverIndex: -1,
    layout: null
  };
}

export function drawChart(canvas, xBytes, yBytes, options) {
  if (!canvas) return;
  const xs = new Float32Array(xBytes.buffer, xBytes.byteOffset, xBytes.byteLength / 4);
  const ys = new Float32Array(yBytes.buffer, yBytes.byteOffset, yBytes.byteLength / 4);
  canvas.__chart = canvas.__chart || {};
  canvas.__chart.xs = xs;
  canvas.__chart.ys = ys;
  canvas.__chart.options = options || {};
  draw(canvas);
}

function draw(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const W = Math.max(1, Math.floor(rect.width * dpr));
  const H = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;

  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);

  const opts = (canvas.__chart && canvas.__chart.options) || {};
  const xs = canvas.__chart?.xs || new Float32Array(0);
  const ys = canvas.__chart?.ys || new Float32Array(0);

  const padL = 72 * dpr;
  const padR = 24 * dpr;
  const padT = 32 * dpr;
  const padB = 36 * dpr;

  // Background
  ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
  ctx.fillRect(0, 0, W, H);

  if (xs.length < 2) {
    ctx.fillStyle = "rgba(154, 168, 192, 0.8)";
    ctx.font = `${12 * dpr}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("нет данных", W / 2, H / 2);
    ctx.restore();
    return;
  }

  const yLog = !!opts.yLogScale;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const yv = new Float64Array(ys.length);
  for (let i = 0; i < xs.length; i++) {
    const y = yLog ? Math.log10(Math.max(ys[i], 1e-12)) : ys[i];
    yv[i] = y;
    if (xs[i] < minX) minX = xs[i];
    if (xs[i] > maxX) maxX = xs[i];
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (maxX - minX < 1e-9) maxX = minX + 1;
  if (maxY - minY < 1e-9) maxY = minY + 1;

  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const sx = (x) => padL + ((x - minX) / (maxX - minX)) * plotW;
  const sy = (y) => padT + plotH - ((y - minY) / (maxY - minY)) * plotH;

  // Store layout for mouse hit-testing
  if (canvas.__chart) {
    canvas.__chart.layout = { sx, sy, xs, ys, yv, count: xs.length };
  }

  // Grid
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1 * dpr;
  for (let i = 0; i <= 4; i++) {
    const yy = padT + (plotH * i) / 4;
    ctx.beginPath();
    ctx.moveTo(padL, yy);
    ctx.lineTo(padL + plotW, yy);
    ctx.stroke();
  }

  // Unit of Y-axis: milliseconds or seconds
  const useSeconds = !yLog && maxY >= 1000;
  const yUnit = useSeconds ? "с" : "мс";

  // Y-axis tick labels with explicit units (мс / с)
  ctx.fillStyle = "rgba(154, 168, 192, 0.9)";
  ctx.font = `${11 * dpr}px ui-monospace, monospace`;
  ctx.textAlign = "right";
  for (let i = 0; i <= 4; i++) {
    const val = maxY - ((maxY - minY) * i) / 4;
    let label;
    if (yLog) {
      label = `1e${val.toFixed(1)} мс`;
    } else if (useSeconds) {
      const s = val / 1000;
      label = `${s.toFixed(s < 10 ? 2 : 1)} с`;
    } else {
      label = `${val.toFixed(val < 0.02 ? 4 : val < 0.1 ? 3 : val < 1 ? 2 : 1)} мс`;
    }
    ctx.fillText(label, padL - 8 * dpr, padT + (plotH * i) / 4 + 4 * dpr);
  }

  // Y-axis unit caption (right-aligned above tick column to guarantee zero overlap with title)
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(0, 229, 163, 0.9)";
  ctx.font = `600 ${10 * dpr}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillText(`Время (${yUnit})`, padL - 8 * dpr, padT - 10 * dpr);

  // X-axis min and max with parameter N
  ctx.fillStyle = "rgba(154, 168, 192, 0.95)";
  ctx.font = `600 ${11 * dpr}px ui-monospace, monospace`;
  ctx.textAlign = "left";
  ctx.fillText(`N = ${minX}`, padL, H - 12 * dpr);

  ctx.textAlign = "right";
  ctx.fillText(`N = ${maxX}`, padL + plotW, H - 12 * dpr);

  // X-axis center label (only if width permits no collision)
  if (plotW >= 170 * dpr) {
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(154, 168, 192, 0.75)";
    ctx.font = `600 ${10 * dpr}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillText("Параметр N", padL + plotW / 2, H - 12 * dpr);
  }

  if (opts.title) {
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(232, 238, 252, 0.92)";
    ctx.font = `600 ${12 * dpr}px ui-sans-serif, system-ui, sans-serif`;
    let titleStr = opts.title;
    const maxTitleW = W - padL - padR;
    if (ctx.measureText(titleStr).width > maxTitleW) {
      while (titleStr.length > 3 && ctx.measureText(titleStr + "…").width > maxTitleW) {
        titleStr = titleStr.slice(0, -1);
      }
      titleStr += "…";
    }
    ctx.fillText(titleStr, padL, 18 * dpr);
  }

  // Area under line (subtle gradient glow)
  const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
  grad.addColorStop(0, "rgba(79, 140, 255, 0.16)");
  grad.addColorStop(1, "rgba(79, 140, 255, 0.0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(sx(xs[0]), padT + plotH);
  for (let i = 0; i < xs.length; i++) ctx.lineTo(sx(xs[i]), sy(yv[i]));
  ctx.lineTo(sx(xs[xs.length - 1]), padT + plotH);
  ctx.closePath();
  ctx.fill();

  // Line
  const path = new Path2D();
  path.moveTo(sx(xs[0]), sy(yv[0]));
  for (let i = 1; i < xs.length; i++) path.lineTo(sx(xs[i]), sy(yv[i]));

  ctx.strokeStyle = opts.lineColor || "#4f8cff";
  ctx.lineWidth = 2 * dpr;
  ctx.lineJoin = "round";
  ctx.stroke(path);

  // Points
  const pointColor = opts.pointColor || "#00e5a3";
  ctx.fillStyle = pointColor;
  for (let i = 0; i < xs.length; i++) {
    ctx.beginPath();
    ctx.arc(sx(xs[i]), sy(yv[i]), 3 * dpr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Interactive Hover Highlight & Glass Tooltip
  const hoverIdx = canvas.__chart ? canvas.__chart.hoverIndex : -1;
  if (hoverIdx >= 0 && hoverIdx < xs.length) {
    const hx = sx(xs[hoverIdx]);
    const hy = sy(yv[hoverIdx]);
    const origN = xs[hoverIdx];
    const origMs = ys[hoverIdx];

    // Dashed crosshair guidelines
    ctx.save();
    ctx.setLineDash([4 * dpr, 4 * dpr]);
    ctx.strokeStyle = "rgba(79, 140, 255, 0.45)";
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(hx, padT);
    ctx.lineTo(hx, padT + plotH);
    ctx.moveTo(padL, hy);
    ctx.lineTo(padL + plotW, hy);
    ctx.stroke();
    ctx.restore();

    // Glow ring
    ctx.beginPath();
    ctx.arc(hx, hy, 7 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 229, 163, 0.35)";
    ctx.fill();

    // Center point
    ctx.beginPath();
    ctx.arc(hx, hy, 4 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#00e5a3";
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();

    // Floating liquid glass tooltip
    const titleText = `Точка #${hoverIdx + 1}`;
    const nText = `N: ${origN}`;
    const msText = origMs >= 1000
      ? `Время: ${(origMs / 1000).toFixed(3)} с`
      : `Время: ${origMs.toFixed(origMs < 0.01 ? 4 : 3)} мс`;

    ctx.font = `600 ${11 * dpr}px ui-sans-serif, system-ui, sans-serif`;
    const wTitle = ctx.measureText(titleText).width;
    ctx.font = `${11 * dpr}px ui-monospace, monospace`;
    const wN = ctx.measureText(nText).width;
    const wMs = ctx.measureText(msText).width;
    const tipW = Math.max(wTitle, wN, wMs) + 20 * dpr;
    const tipH = 58 * dpr;

    let tipX = hx - tipW / 2;
    if (tipX < padL + 4 * dpr) tipX = padL + 4 * dpr;
    if (tipX + tipW > W - padR) tipX = W - padR - tipW;

    let tipY = hy - tipH - 10 * dpr;
    if (tipY < padT) tipY = hy + 12 * dpr;

    // Glass card background
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
    ctx.shadowBlur = 12 * dpr;
    roundRect(ctx, tipX, tipY, tipW, tipH, 6 * dpr);
    ctx.fillStyle = "rgba(10, 16, 28, 0.94)";
    ctx.fill();
    ctx.strokeStyle = "rgba(79, 140, 255, 0.65)";
    ctx.lineWidth = 1.2 * dpr;
    ctx.stroke();
    ctx.restore();

    // Tooltip texts
    ctx.textAlign = "left";
    ctx.font = `700 ${11 * dpr}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillStyle = "#7ab2ff";
    ctx.fillText(titleText, tipX + 10 * dpr, tipY + 16 * dpr);

    ctx.font = `${11 * dpr}px ui-monospace, monospace`;
    ctx.fillStyle = "#e8eefc";
    ctx.fillText(nText, tipX + 10 * dpr, tipY + 33 * dpr);

    ctx.fillStyle = "#00e5a3";
    ctx.fillText(msText, tipX + 10 * dpr, tipY + 49 * dpr);
  }

  ctx.restore();
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
