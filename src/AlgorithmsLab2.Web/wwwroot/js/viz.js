// Tree, Young diagrams, and recursion visualization helpers (TypedArray and DPI-friendly).

export function createViz(canvas) {
  if (!canvas) return;
  const ro = new ResizeObserver(() => {
    if (canvas.__viz && canvas.__viz.redraw) canvas.__viz.redraw();
  });
  ro.observe(canvas);
  canvas.__viz = { ro, redraw: null };
}

export function drawYoungDiagram(canvas, partsArray, totalN, info) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const W = Math.max(1, Math.floor(rect.width * dpr));
  const H = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, W, H);

  const parts = Array.isArray(partsArray) ? partsArray : Array.from(partsArray || []);
  if (!parts || parts.length === 0) {
    ctx.fillStyle = "rgba(154, 168, 192, 0.7)";
    ctx.font = `${13 * dpr}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("Нажмите «Старт» или выберите N для визуализации", W / 2, H / 2);
    return;
  }

  const maxVal = Math.max(...parts, 1);
  const rows = parts.length;
  const padX = 24 * dpr;
  const padTop = 38 * dpr;
  const padBottom = 34 * dpr;

  const availW = W - padX * 2 - 80 * dpr;
  const availH = H - padTop - padBottom;

  const blockW = Math.min(48 * dpr, Math.max(16 * dpr, Math.floor(availW / maxVal)));
  const blockH = Math.min(36 * dpr, Math.max(14 * dpr, Math.floor(availH / rows)));
  const gap = Math.max(2 * dpr, Math.min(5 * dpr, Math.floor(Math.min(blockW, blockH) * 0.12)));

  // Title & Equation
  ctx.font = `600 ${14 * dpr}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = "#e8eefc";
  ctx.textAlign = "left";
  ctx.fillText(
    `Диаграмма Юнга (Ferrers): ${totalN} = ${parts.join(" + ")}`,
    padX,
    22 * dpr
  );

  ctx.font = `${11 * dpr}px ui-monospace, monospace`;
  ctx.fillStyle = "rgba(154, 168, 192, 0.9)";
  ctx.fillText(
    `Слагаемых (высота): ${rows} · Максимум (ширина): ${maxVal}`,
    padX,
    34 * dpr
  );

  // Draw rows of blocks
  for (let r = 0; r < rows; r++) {
    const count = parts[r];
    const y = padTop + r * blockH;

    for (let c = 0; c < count; c++) {
      const x = padX + c * blockW;
      const bw = blockW - gap;
      const bh = blockH - gap;

      // Color gradient depending on column / row index
      const grad = ctx.createLinearGradient(x, y, x + bw, y + bh);
      grad.addColorStop(0, "rgba(79, 140, 255, 0.8)");
      grad.addColorStop(1, "rgba(0, 229, 163, 0.8)");

      ctx.fillStyle = grad;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 1 * dpr;

      roundRect(ctx, x, y, bw, bh, Math.min(4 * dpr, bw * 0.2));
      ctx.fill();
      ctx.stroke();

      // Show 1 inside block if large enough
      if (bw >= 18 * dpr && bh >= 16 * dpr) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = `${Math.min(11 * dpr, bh * 0.5)}px ui-monospace, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("1", x + bw / 2, y + bh / 2);
      }
    }

    // Row sum label at the end
    ctx.fillStyle = "rgba(232, 238, 252, 0.85)";
    ctx.font = `600 ${Math.min(12 * dpr, blockH * 0.65)}px ui-monospace, monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`= ${count}`, padX + count * blockW + 8 * dpr, y + (blockH - gap) / 2);
  }

  // Conjugate partition info (transpose)
  const conjugate = [];
  for (let c = 0; c < maxVal; c++) {
    let colCount = 0;
    for (let r = 0; r < rows; r++) {
      if (parts[r] > c) colCount++;
    }
    if (colCount > 0) conjugate.push(colCount);
  }

  ctx.font = `${11 * dpr}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = "rgba(0, 229, 163, 0.95)";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(
    `Сопряжённое (транспонированное) разбиение λ': ${conjugate.join(" + ")}`,
    padX,
    H - 12 * dpr
  );
}

export function drawSternBrocotTree(canvas, nodesBytes, edgesBytes, labels, activeIndices, info) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const W = Math.max(1, Math.floor(rect.width * dpr));
  const H = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, W, H);

  const count = nodesBytes ? nodesBytes.byteLength / 8 : 0;
  if (count === 0) {
    ctx.fillStyle = "rgba(154,168,192,0.7)";
    ctx.font = `${12 * dpr}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("нет данных", W / 2, H / 2);
    return;
  }

  const nodes = new Float32Array(nodesBytes.buffer, nodesBytes.byteOffset, count * 2);
  const edgesCount = edgesBytes ? edgesBytes.byteLength / 4 : 0;
  const edges = edgesCount > 0 ? new Int32Array(edgesBytes.buffer, edgesBytes.byteOffset, edgesCount) : [];

  const activeSet = new Set(activeIndices || []);
  const matchedNodeIdx = info && info.matchedNodeIdx !== undefined ? info.matchedNodeIdx : -1;

  const padX = 28 * dpr;
  const padTop = 38 * dpr;
  const padBottom = 26 * dpr;
  const plotW = W - padX * 2;
  const plotH = H - padTop - padBottom;

  // Header info
  if (info) {
    ctx.font = `600 ${13 * dpr}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillStyle = "#e8eefc";
    ctx.textAlign = "left";
    ctx.fillText(info.title || "Дерево Штерна–Броко", padX, 20 * dpr);

    if (info.subtitle) {
      ctx.font = `${11 * dpr}px ui-monospace, monospace`;
      ctx.fillStyle = info.isMatch ? "#00e5a3" : "rgba(79, 140, 255, 0.95)";
      ctx.fillText(info.subtitle, padX, 32 * dpr);
    }
  }

  // Edges
  for (let i = 0; i + 1 < edges.length; i += 2) {
    const a = edges[i];
    const b = edges[i + 1];
    const isActive = activeSet.has(a) && activeSet.has(b);

    const ax = padX + nodes[a * 2] * plotW;
    const ay = padTop + nodes[a * 2 + 1] * plotH;
    const bx = padX + nodes[b * 2] * plotW;
    const by = padTop + nodes[b * 2 + 1] * plotH;

    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);

    if (isActive) {
      ctx.strokeStyle = "#4f8cff";
      ctx.lineWidth = 2.5 * dpr;
      ctx.shadowColor = "rgba(79, 140, 255, 0.6)";
      ctx.shadowBlur = 8 * dpr;
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      ctx.strokeStyle = "rgba(79, 140, 255, 0.25)";
      ctx.lineWidth = 1.2 * dpr;
      ctx.stroke();
    }
  }

  // Nodes
  ctx.font = `600 ${10 * dpr}px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < count; i++) {
    const x = padX + nodes[i * 2] * plotW;
    const y = padTop + nodes[i * 2 + 1] * plotH;
    const isActive = activeSet.has(i);
    const isMatched = i === matchedNodeIdx;
    const r = (count > 40 ? 6 : count > 20 ? 9 : 13) * dpr;

    // Node glow & body
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);

    if (isMatched) {
      // True match: Glowing Emerald Green
      ctx.fillStyle = "#00e5a3";
      ctx.shadowColor = "rgba(0, 229, 163, 0.9)";
      ctx.shadowBlur = 14 * dpr;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5 * dpr;
      ctx.stroke();
    } else if (isActive) {
      // Search path node: Electric Blue
      ctx.fillStyle = "#4f8cff";
      ctx.shadowColor = "rgba(79, 140, 255, 0.7)";
      ctx.shadowBlur = 8 * dpr;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.8 * dpr;
      ctx.stroke();
    } else {
      // Inactive node: Dark glass
      ctx.fillStyle = "rgba(18, 26, 44, 0.9)";
      ctx.fill();
      ctx.strokeStyle = "rgba(79, 140, 255, 0.4)";
      ctx.lineWidth = 1.2 * dpr;
      ctx.stroke();
    }

    // Label inside or below node
    const label = labels && labels[i] ? labels[i] : "";
    if (count <= 64 && label) {
      ctx.fillStyle = (isMatched || isActive) ? "#080c14" : "#e8eefc";
      ctx.fillText(label, x, y);
    }
  }
}

export function drawKaratsubaTree(canvas, model, currentStep) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const W = Math.max(1, Math.floor(rect.width * dpr));
  const H = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, W, H);

  const m = model || {
    x: "1234",
    y: "5678",
    m: 2,
    a: "12",
    b: "34",
    c: "56",
    d: "78",
    ac: "672",
    bd: "2652",
    sumProd: "6164",
    middle: "2840",
    result: "7006652"
  };

  const step = currentStep !== undefined && currentStep !== null ? currentStep : 5;
  const padX = 20 * dpr;
  const cx = W / 2;

  // Header Title & Dynamic Subtitle
  ctx.font = `600 ${14 * dpr}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = "#e8eefc";
  ctx.textAlign = "left";
  ctx.fillText("Умножение Карацубы: Разделяй и Властвуй (3 ветви вместо 4)", padX, 22 * dpr);

  const stepDescriptions = [
    `Шаг 0: Деление X и Y на половины a, b, c, d (базовый сдвиг B = 10^${m.m})`,
    `Шаг 1: 1-й рекурсивный вызов z₂ = a × c = ${m.a} × ${m.c} = ${m.ac}`,
    `Шаг 2: 2-й рекурсивный вызов z₀ = b × d = ${m.b} × ${m.d} = ${m.bd}`,
    `Шаг 3: 3-й рекурсивный вызов z₁ = (a+b)(c+d) = ${m.sumProd} (всего 3 умножения вместо 4!)`,
    `Шаг 4: Вычисление среднего слагаемого middle = z₁ − z₂ − z₀ = ${m.middle}`,
    `Шаг 5: Итоговая сборка XY = z₂·10^${m.m * 2} + middle·10^${m.m} + z₀ = ${m.result}`
  ];

  ctx.font = `600 ${11 * dpr}px ui-monospace, monospace`;
  ctx.fillStyle = step >= 5 ? "#00e5a3" : "#4f8cff";
  ctx.fillText(stepDescriptions[Math.min(step, 5)], padX, 36 * dpr);

  // Layout positions
  const rootW = Math.min(W - 40 * dpr, 380 * dpr);
  const rootH = 50 * dpr;
  const rootX = cx - rootW / 2;
  const rootY = 46 * dpr;

  // 1. Draw Root Box (Split X, Y)
  const isRootActive = step === 0;
  ctx.save();
  if (isRootActive) {
    ctx.shadowColor = "rgba(79, 140, 255, 0.7)";
    ctx.shadowBlur = 12 * dpr;
  }
  drawGlassCard(
    ctx, rootX, rootY, rootW, rootH, 8 * dpr,
    isRootActive ? "rgba(79, 140, 255, 0.25)" : "rgba(255, 255, 255, 0.04)",
    isRootActive ? "#4f8cff" : "rgba(79, 140, 255, 0.45)"
  );
  ctx.restore();

  ctx.font = `600 ${12 * dpr}px ui-monospace, monospace`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText(`X = ${m.x} = ${m.a}·10^${m.m} + ${m.b}   |   Y = ${m.y} = ${m.c}·10^${m.m} + ${m.d}`, cx, rootY + 20 * dpr);
  ctx.font = `${11 * dpr}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = isRootActive ? "#00e5a3" : "rgba(154, 168, 192, 0.9)";
  ctx.fillText(`Половины: a = ${m.a}, b = ${m.b}, c = ${m.c}, d = ${m.d}`, cx, rootY + 38 * dpr);

  // 2. Draw 3 Branch Boxes
  const branchY = 128 * dpr;
  const branchW = Math.min((W - 60 * dpr) / 3, 220 * dpr);
  const branchH = 64 * dpr;
  const gap = 16 * dpr;
  const totalBranchesW = branchW * 3 + gap * 2;
  const branchStartX = cx - totalBranchesW / 2;

  const branchSpecs = [
    { title: "Ветвь 1: z₂ = ac", sub: `${m.a} × ${m.c} = ${m.ac}`, stepReq: 1, color: "#4f8cff" },
    { title: "Ветвь 2: z₀ = bd", sub: `${m.b} × ${m.d} = ${m.bd}`, stepReq: 2, color: "#00e5a3" },
    { title: "Ветвь 3: (a+b)(c+d)", sub: `(${m.a}+${m.b}) × (${m.c}+${m.d}) = ${m.sumProd}`, stepReq: 3, color: "#ffb454" }
  ];

  for (let i = 0; i < 3; i++) {
    const bx = branchStartX + i * (branchW + gap);
    const b = branchSpecs[i];
    const isBranchCurrent = step === b.stepReq;
    const isBranchDone = step >= b.stepReq;

    // Connector line from root
    ctx.beginPath();
    ctx.moveTo(cx, rootY + rootH);
    ctx.lineTo(bx + branchW / 2, branchY);
    if (isBranchCurrent) {
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2.5 * dpr;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8 * dpr;
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (isBranchDone) {
      ctx.strokeStyle = "rgba(79, 140, 255, 0.4)";
      ctx.lineWidth = 1.5 * dpr;
      ctx.stroke();
    } else {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1 * dpr;
      ctx.stroke();
    }

    ctx.save();
    if (!isBranchDone) {
      ctx.globalAlpha = 0.25;
    } else if (isBranchCurrent) {
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 14 * dpr;
    }

    drawGlassCard(
      ctx, bx, branchY, branchW, branchH, 6 * dpr,
      isBranchCurrent ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.03)",
      isBranchCurrent ? b.color : (isBranchDone ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.06)")
    );
    ctx.restore();

    ctx.font = `600 ${11 * dpr}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillStyle = isBranchDone ? b.color : "rgba(154, 168, 192, 0.4)";
    ctx.textAlign = "center";
    ctx.fillText(isBranchDone ? b.title : `${b.title} (ожидание)`, bx + branchW / 2, branchY + 22 * dpr);

    ctx.font = `${11 * dpr}px ui-monospace, monospace`;
    ctx.fillStyle = isBranchDone ? "#ffffff" : "rgba(154, 168, 192, 0.3)";
    ctx.fillText(isBranchDone ? b.sub : "...", bx + branchW / 2, branchY + 44 * dpr);
  }

  // 3. Draw Combine Box
  const combY = 222 * dpr;
  const combW = Math.min(W - 40 * dpr, 480 * dpr);
  const combH = 72 * dpr;
  const combX = cx - combW / 2;

  const isMiddleStep = step === 4;
  const isFinalStep = step >= 5;
  const isCombineVisible = step >= 4;

  for (let i = 0; i < 3; i++) {
    const bx = branchStartX + i * (branchW + gap);
    ctx.beginPath();
    ctx.moveTo(bx + branchW / 2, branchY + branchH);
    ctx.lineTo(cx, combY);
    if (isCombineVisible) {
      ctx.strokeStyle = isFinalStep ? "#00e5a3" : "rgba(79, 140, 255, 0.5)";
      ctx.lineWidth = (isMiddleStep || isFinalStep) ? 2 * dpr : 1 * dpr;
    } else {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1 * dpr;
    }
    ctx.stroke();
  }

  ctx.save();
  if (!isCombineVisible) {
    ctx.globalAlpha = 0.25;
  } else if (isFinalStep) {
    ctx.shadowColor = "rgba(0, 229, 163, 0.7)";
    ctx.shadowBlur = 16 * dpr;
  } else if (isMiddleStep) {
    ctx.shadowColor = "rgba(79, 140, 255, 0.7)";
    ctx.shadowBlur = 12 * dpr;
  }

  drawGlassCard(
    ctx, combX, combY, combW, combH, 8 * dpr,
    isFinalStep ? "rgba(0, 229, 163, 0.15)" : "rgba(255, 255, 255, 0.04)",
    isFinalStep ? "#00e5a3" : (isMiddleStep ? "#4f8cff" : "rgba(255, 255, 255, 0.1)")
  );
  ctx.restore();

  ctx.font = `600 ${12 * dpr}px ui-monospace, monospace`;
  ctx.fillStyle = isCombineVisible ? "#00e5a3" : "rgba(154, 168, 192, 0.4)";
  ctx.textAlign = "center";
  ctx.fillText(
    isCombineVisible ? `Средний член: middle = z₁ − z₂ − z₀ = ${m.middle}` : "Вычисление middle...",
    cx,
    combY + 24 * dpr
  );

  ctx.font = `700 ${13 * dpr}px ui-monospace, monospace`;
  ctx.fillStyle = isFinalStep ? "#ffffff" : "rgba(154, 168, 192, 0.4)";
  ctx.fillText(
    isFinalStep ? `Итоговый ответ: ${m.ac}·10^${m.m * 2} + ${m.middle}·10^${m.m} + ${m.bd} = ${m.result}` : "Итоговая сборка XY = ...",
    cx,
    combY + 48 * dpr
  );
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

// Custom range fill for sliders
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
