// Hanoi arena: state in C# (index/speed), frames in JS.
// Moves packed as Uint8Array triples: disk, from, to  (disk 1..n, peg 0..2).

export function createHanoi(canvas) {
  if (!canvas) return;
  const ro = new ResizeObserver(() => draw(canvas));
  ro.observe(canvas);
  canvas.__hanoi = {
    ro,
    disks: 0,
    moves: new Uint8Array(0),
    index: 0,
    colors: defaultColors()
  };
  resizeCanvas(canvas);
  draw(canvas);
}

export function disposeHanoi(canvas) {
  if (!canvas || !canvas.__hanoi) return;
  if (canvas.__hanoi.ro) canvas.__hanoi.ro.disconnect();
  canvas.__hanoi = null;
}

export function loadMoves(canvas, disks, movesU8) {
  if (!canvas) return;
  canvas.__hanoi = canvas.__hanoi || {};
  canvas.__hanoi.disks = disks | 0;
  canvas.__hanoi.moves = movesU8 || new Uint8Array(0);
  canvas.__hanoi.index = 0;
  canvas.__hanoi.colors = defaultColors();
  draw(canvas);
}

export function setIndex(canvas, index) {
  if (!canvas || !canvas.__hanoi) return;
  const n = Math.floor(canvas.__hanoi.moves.length / 3);
  canvas.__hanoi.index = Math.max(0, Math.min(index | 0, n));
  draw(canvas);
}

export function draw(canvas) {
  if (!canvas || !canvas.__hanoi) return;
  resizeCanvas(canvas);
  const ctx = canvas.getContext("2d");
  const dpr = canvas.__hanoi.dpr || 1;
  const W = canvas.width;
  const H = canvas.height;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);

  // soft stage background
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "rgba(91,140,255,0.08)");
  g.addColorStop(1, "rgba(124,255,203,0.04)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const disks = canvas.__hanoi.disks | 0;
  const moves = canvas.__hanoi.moves;
  const index = canvas.__hanoi.index | 0;

  // pegs state: array of stacks (top at end)
  const pegs = [[], [], []];
  for (let d = disks; d >= 1; d--) pegs[0].push(d);

  const count = Math.floor(moves.length / 3);
  const applied = Math.max(0, Math.min(index, count));
  for (let i = 0; i < applied; i++) {
    const disk = moves[i * 3];
    const from = moves[i * 3 + 1];
    const to = moves[i * 3 + 2];
    if (pegs[from] && pegs[to]) {
      pegs[from].pop();
      pegs[to].push(disk);
    }
  }

  const margin = 28 * dpr;
  const baseY = H - margin;
  const pegW = 10 * dpr;
  const pegH = Math.min(H * 0.55, 280 * dpr);
  const areaW = W - margin * 2;
  const pegX = [margin + areaW * 0.16, margin + areaW * 0.5, margin + areaW * 0.84];

  // base
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  roundRect(ctx, margin, baseY, areaW, 12 * dpr, 6 * dpr);
  ctx.fill();

  // pegs
  for (let p = 0; p < 3; p++) {
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    roundRect(ctx, pegX[p] - pegW / 2, baseY - pegH, pegW, pegH, pegW / 2);
    ctx.fill();

    // label
    ctx.fillStyle = "rgba(154,168,192,0.85)";
    ctx.font = `${12 * dpr}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(String.fromCharCode(65 + p), pegX[p], baseY + 28 * dpr);
  }

  // rings
  const maxDisk = Math.max(1, disks);
  const ringH = Math.min(22 * dpr, (pegH - 20 * dpr) / maxDisk);
  const maxRingW = areaW * 0.22;

  for (let p = 0; p < 3; p++) {
    const stack = pegs[p];
    for (let i = 0; i < stack.length; i++) {
      const disk = stack[i];
      const w = maxRingW * (0.35 + 0.65 * (disk / maxDisk));
      const x = pegX[p] - w / 2;
      const y = baseY - 12 * dpr - ringH * (i + 1);
      const color = canvas.__hanoi.colors[(disk - 1) % canvas.__hanoi.colors.length];
      ctx.fillStyle = color;
      roundRect(ctx, x, y, w, ringH * 0.86, ringH * 0.35);
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1 * dpr;
      ctx.stroke();
    }
  }

  // progress text
  ctx.fillStyle = "rgba(154,168,192,0.9)";
  ctx.font = `${11 * dpr}px ui-monospace, monospace`;
  ctx.textAlign = "left";
  ctx.fillText(`ход ${applied} / ${count}`, margin, 20 * dpr);

  ctx.restore();
}

function resizeCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, Math.floor(rect.width * dpr));
  const h = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  canvas.__hanoi = canvas.__hanoi || {};
  canvas.__hanoi.dpr = dpr;
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

function defaultColors() {
  return [
    "#5b8cff", "#7cffcb", "#ffb454", "#ff6b7a",
    "#c792ea", "#82aaff", "#f78c6c", "#89ddff"
  ];
}
