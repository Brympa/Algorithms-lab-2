// Tree / recursion visualization helpers (TypedArray-friendly).

export function createViz(canvas) {
  if (!canvas) return;
  const ro = new ResizeObserver(() => {
    if (canvas.__viz && canvas.__viz.redraw) canvas.__viz.redraw();
  });
  ro.observe(canvas);
  canvas.__viz = { ro, redraw: null };
}

export function drawTree(canvas, nodes, edges, labels) {
  // nodes: Float32Array of x,y in 0..1; edges: Int32Array pairs; labels: string[]
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const W = Math.max(1, Math.floor(rect.width * dpr));
  const H = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, W, H);

  const pad = 28 * dpr;
  const n = nodes.length / 2;
  if (n === 0) {
    ctx.fillStyle = "rgba(154,168,192,0.7)";
    ctx.font = `${12 * dpr}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("нет данных", W / 2, H / 2);
    return;
  }

  // edges
  ctx.strokeStyle = "rgba(91,140,255,0.45)";
  ctx.lineWidth = 1.2 * dpr;
  for (let i = 0; i + 1 < edges.length; i += 2) {
    const a = edges[i] * 2;
    const b = edges[i + 1] * 2;
    ctx.beginPath();
    ctx.moveTo(pad + nodes[a] * (W - pad * 2), pad + nodes[a + 1] * (H - pad * 2));
    ctx.lineTo(pad + nodes[b] * (W - pad * 2), pad + nodes[b + 1] * (H - pad * 2));
    ctx.stroke();
  }

  // nodes + labels
  ctx.font = `${10 * dpr}px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const showEvery = n > 40 ? Math.ceil(n / 40) : 1;
  for (let i = 0; i < n; i++) {
    const x = pad + nodes[i * 2] * (W - pad * 2);
    const y = pad + nodes[i * 2 + 1] * (H - pad * 2);
    const r = (n > 60 ? 3 : n > 20 ? 5 : 7) * dpr;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = i % showEvery === 0 ? "#5b8cff" : "rgba(91,140,255,0.45)";
    ctx.fill();
    ctx.strokeStyle = "rgba(124,255,203,0.55)";
    ctx.lineWidth = 1 * dpr;
    ctx.stroke();

    if (labels && i % showEvery === 0 && n <= 32) {
      ctx.fillStyle = "rgba(232,238,252,0.9)";
      ctx.fillText(labels[i] || "", x, y + r + 10 * dpr);
    }
  }
}

export function drawBars(canvas, values, title) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const W = Math.max(1, Math.floor(rect.width * dpr));
  const H = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, W, H);

  const xs = values || new Float32Array(0);
  if (xs.length === 0) {
    ctx.fillStyle = "rgba(154,168,192,0.7)";
    ctx.font = `${12 * dpr}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("нет данных", W / 2, H / 2);
    return;
  }

  let maxV = 0;
  for (let i = 0; i < xs.length; i++) if (xs[i] > maxV) maxV = xs[i];
  if (maxV <= 0) maxV = 1;

  const padL = 36 * dpr;
  const padR = 12 * dpr;
  const padT = 24 * dpr;
  const padB = 20 * dpr;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const bw = plotW / xs.length;

  if (title) {
    ctx.fillStyle = "rgba(232,238,252,0.85)";
    ctx.font = `${12 * dpr}px sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(title, padL, 16 * dpr);
  }

  for (let i = 0; i < xs.length; i++) {
    const h = (xs[i] / maxV) * plotH;
    const x = padL + i * bw + bw * 0.15;
    const y = padT + plotH - h;
    const w = bw * 0.7;

    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, "#7cffcb");
    g.addColorStop(1, "rgba(91,140,255,0.85)");
    ctx.fillStyle = g;
    roundRect(ctx, x, y, w, Math.max(h, 2 * dpr), 4 * dpr);
    ctx.fill();
  }
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

// custom range fill (webkit)
export function bindRangeFills(root) {
  const doc = root || document;
  doc.querySelectorAll('input[type="range"]').forEach((el) => {
    const sync = () => {
      const min = parseFloat(el.min || "0");
      const max = parseFloat(el.max || "100");
      const val = parseFloat(el.value || "0");
      const pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
      el.style.setProperty("--fill", pct + "%");
    };
    el.addEventListener("input", sync);
    sync();
  });
}
