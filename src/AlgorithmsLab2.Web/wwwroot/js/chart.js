// Lightweight line chart — TypedArray only.
export function createChart(canvas) {
  if (!canvas) return;
  const ro = new ResizeObserver(() => {
    if (canvas.__chart) draw(canvas);
  });
  ro.observe(canvas);
  canvas.__chart = { ro, xs: new Float32Array(0), ys: new Float32Array(0), options: null };
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

  const padL = 52 * dpr;
  const padR = 16 * dpr;
  const padT = 28 * dpr;
  const padB = 36 * dpr;

  // background
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.fillRect(0, 0, W, H);

  if (xs.length < 2) {
    ctx.fillStyle = "rgba(154,168,192,0.8)";
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

  // grid
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1 * dpr;
  for (let i = 0; i <= 4; i++) {
    const yy = padT + (plotH * i) / 4;
    ctx.beginPath();
    ctx.moveTo(padL, yy);
    ctx.lineTo(padL + plotW, yy);
    ctx.stroke();
  }

  // axes labels
  ctx.fillStyle = "rgba(154,168,192,0.9)";
  ctx.font = `${11 * dpr}px ui-monospace, monospace`;
  ctx.textAlign = "right";
  for (let i = 0; i <= 4; i++) {
    const val = maxY - ((maxY - minY) * i) / 4;
    const label = yLog ? `1e${val.toFixed(1)}` : val.toPrecision(3);
    ctx.fillText(label, padL - 8 * dpr, padT + (plotH * i) / 4 + 4 * dpr);
  }

  ctx.textAlign = "center";
  ctx.fillText(String(minX), padL, H - 12 * dpr);
  ctx.fillText(String(maxX), padL + plotW, H - 12 * dpr);

  if (opts.title) {
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(232,238,252,0.9)";
    ctx.font = `${12 * dpr}px sans-serif`;
    ctx.fillText(opts.title, padL, 18 * dpr);
  }

  // line
  const path = new Path2D();
  path.moveTo(sx(xs[0]), sy(yv[0]));
  for (let i = 1; i < xs.length; i++) path.lineTo(sx(xs[i]), sy(yv[i]));

  ctx.strokeStyle = opts.lineColor || "#5b8cff";
  ctx.lineWidth = 2 * dpr;
  ctx.lineJoin = "round";
  ctx.stroke(path);

  // points
  ctx.fillStyle = opts.pointColor || "#7cffcb";
  for (let i = 0; i < xs.length; i++) {
    ctx.beginPath();
    ctx.arc(sx(xs[i]), sy(yv[i]), 3 * dpr, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
