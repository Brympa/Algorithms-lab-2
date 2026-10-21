// Tree, Young diagrams, and recursion visualization helpers (TypedArray and DPI-friendly).

export function createViz(canvas) {
  if (!canvas || canvas.__viz) return;

  const state = {
    mode: null,
    transform: { x: 0, y: 0, scale: 1.0 },
    isPanning: false,
    startX: 0,
    startY: 0,
    sbData: null,
    hudButtons: []
  };

  const getDpr = () => window.devicePixelRatio || 1;

  // Zoom centered around mouse cursor
  const onWheel = (e) => {
    if (state.mode !== "stern-brocot") return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const dpr = getDpr();
    const mx = (e.clientX - rect.left) * dpr;
    const my = (e.clientY - rect.top) * dpr;

    const zoom = e.deltaY < 0 ? 1.15 : 0.87;
    const oldScale = state.transform.scale;
    const minScale = state.minScale || 0.04;
    const maxScale = state.maxScale || 4.0;
    const newScale = Math.min(maxScale, Math.max(minScale, oldScale * zoom));

    const W = canvas.width;
    const H = canvas.height;
    const worldX = (mx - state.transform.x - W / 2) / oldScale;
    const worldY = (my - state.transform.y - H / 2) / oldScale;

    state.transform.scale = newScale;
    state.transform.x = mx - (worldX * newScale + W / 2);
    state.transform.y = my - (worldY * newScale + H / 2);
    state.userHasPanned = true;

    if (canvas.__viz && canvas.__viz.redraw) canvas.__viz.redraw();
  };

  // Pointer events on canvas with PointerCapture (zero global window leaks)
  const onPointerDown = (e) => {
    if (state.mode !== "stern-brocot") return;
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
          if (canvas.__viz && canvas.__viz.redraw) canvas.__viz.redraw();
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
    if (state.mode !== "stern-brocot") return;
    if (state.isPanning) {
      const dpr = getDpr();
      const dx = (e.clientX - state.startX) * dpr;
      const dy = (e.clientY - state.startY) * dpr;
      state.startX = e.clientX;
      state.startY = e.clientY;
      state.transform.x += dx;
      state.transform.y += dy;
      state.userHasPanned = true;
      if (canvas.__viz && canvas.__viz.redraw) canvas.__viz.redraw();
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
    if (state.mode !== "stern-brocot") return;
    state.isPanning = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    canvas.style.cursor = "grab";
  };

  const onDblClick = (e) => {
    if (state.mode !== "stern-brocot") return;
    const rect = canvas.getBoundingClientRect();
    const dpr = getDpr();
    const mx = (e.clientX - rect.left) * dpr;
    const my = (e.clientY - rect.top) * dpr;

    // Ignore double click if it hit any HUD buttons
    if (state.hudButtons && state.hudButtons.some((b) => mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h)) {
      return;
    }

    state.userHasPanned = false;
    state.transform.x = 0;
    state.transform.y = 0;
    state.transform.scale = 1.0;
    if (canvas.__viz && canvas.__viz.redraw) canvas.__viz.redraw();
  };

  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("dblclick", onDblClick);

  const onThemeChange = () => {
    if (!canvas || !canvas.isConnected) {
      window.removeEventListener("themechange", onThemeChange);
      return;
    }
    if (canvas.__viz && canvas.__viz.redraw) canvas.__viz.redraw();
  };
  window.addEventListener("themechange", onThemeChange);

  const ro = new ResizeObserver(() => {
    if (canvas.__viz && canvas.__viz.redraw) canvas.__viz.redraw();
  });
  ro.observe(canvas);

  canvas.__viz = {
    ro,
    onThemeChange,
    state,
    redraw: null
  };
}

export function disposeViz(canvas) {
  if (!canvas || !canvas.__viz) return;
  const s = canvas.__viz;
  if (s.ro) {
    s.ro.disconnect();
    s.ro = null;
  }
  if (s.onThemeChange) {
    window.removeEventListener("themechange", s.onThemeChange);
  }
  canvas.__viz = null;
}

export function drawYoungDiagram(canvas, partsArray, totalN, info) {
  if (!canvas) return;
  if (canvas.__viz) {
    canvas.__viz.state.mode = "young";
    canvas.style.cursor = "default";
    canvas.__viz.redraw = () => drawYoungDiagram(canvas, partsArray, totalN, info);
  }

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
  const padTop = 44 * dpr;
  const padBottom = 34 * dpr;

  const availW = W - padX * 2 - 80 * dpr;
  const availH = H - padTop - padBottom;

  const blockW = Math.min(52 * dpr, Math.max(16 * dpr, Math.floor(availW / maxVal)));
  const blockH = Math.min(38 * dpr, Math.max(14 * dpr, Math.floor(availH / rows)));
  const gap = Math.max(2 * dpr, Math.min(5 * dpr, Math.floor(Math.min(blockW, blockH) * 0.12)));

  const isLight = document.documentElement.getAttribute("data-theme") === "light";

  // Title & Equation
  ctx.font = `600 ${14 * dpr}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = isLight ? "#0f172a" : "#e8eefc";
  ctx.textAlign = "left";
  ctx.fillText(
    `Диаграмма Юнга (Ferrers): ${totalN} = ${parts.join(" + ")}`,
    padX,
    22 * dpr
  );

  ctx.font = `${11 * dpr}px ui-monospace, monospace`;
  ctx.fillStyle = isLight ? "#64748b" : "rgba(154, 168, 192, 0.9)";
  ctx.fillText(
    `Слагаемых (высота): ${rows} · Максимум (ширина): ${maxVal}`,
    padX,
    36 * dpr
  );

  // Draw rows of blocks
  for (let r = 0; r < rows; r++) {
    const count = parts[r];
    const y = padTop + r * blockH;

    for (let c = 0; c < count; c++) {
      const x = padX + c * blockW;
      const bw = blockW - gap;
      const bh = blockH - gap;

      const grad = ctx.createLinearGradient(x, y, x + bw, y + bh);
      grad.addColorStop(0, "rgba(79, 140, 255, 0.85)");
      grad.addColorStop(1, "rgba(0, 229, 163, 0.85)");

      ctx.fillStyle = grad;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 1 * dpr;

      roundRect(ctx, x, y, bw, bh, Math.min(4 * dpr, bw * 0.2));
      ctx.fill();
      ctx.stroke();

      if (bw >= 18 * dpr && bh >= 16 * dpr) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = `${Math.min(11 * dpr, bh * 0.5)}px ui-monospace, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("1", x + bw / 2, y + bh / 2);
      }
    }

    ctx.fillStyle = isLight ? "#1e293b" : "rgba(232, 238, 252, 0.9)";
    ctx.font = `600 ${Math.min(13 * dpr, blockH * 0.65)}px ui-monospace, monospace`;
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
  ctx.fillStyle = isLight ? "#059669" : "rgba(0, 229, 163, 0.95)";
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
  if (!canvas.__viz) createViz(canvas);

  canvas.__viz.state.mode = "stern-brocot";
  canvas.__viz.state.sbData = { nodesBytes, edgesBytes, labels, activeIndices, info };
  canvas.__viz.redraw = () => renderSternBrocotTree(canvas);

  renderSternBrocotTree(canvas);
}

function renderSternBrocotTree(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const W = Math.max(1, Math.floor(rect.width * dpr));
  const H = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, W, H);

  const state = canvas.__viz.state;
  const data = state.sbData;
  if (!data) return;

  const { nodesBytes, edgesBytes, labels, activeIndices, info } = data;
  const count = nodesBytes ? nodesBytes.byteLength / 8 : 0;
  if (count === 0) {
    ctx.fillStyle = "rgba(154, 168, 192, 0.7)";
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

  const t = state.transform;

  const isLight = document.documentElement.getAttribute("data-theme") === "light";

  // Background subtle grid
  ctx.fillStyle = isLight ? "rgba(241, 245, 249, 0.45)" : "rgba(0, 0, 0, 0.12)";
  ctx.fillRect(0, 0, W, H);

  // Compute Tree Layout in World Space
  const treeDepth = Math.max(1, Math.round(Math.log2(count + 1)));
  // Ensure generous node spacing so leaf circles never collide
  const nodeSpacing = (count > 120 ? 64 : count > 60 ? 56 : count > 30 ? 48 : 42) * dpr;
  const levelH = 82 * dpr;

  const padX = 28 * dpr;
  const padTop = 56 * dpr;
  const padBottom = 34 * dpr;
  const plotW = W - padX * 2;
  const plotH = H - padTop - padBottom;

  const worldW = Math.max(plotW, (count + 1) * nodeSpacing);
  const worldH = Math.max(plotH, (treeDepth + 1.2) * levelH);
  const worldPadX = 40 * dpr;
  const worldPadY = 56 * dpr;
  const innerW = worldW - worldPadX * 2;
  const innerH = worldH - worldPadY * 2;

  // Fit scale calculation for full overview
  const fitScale = Math.min(1.0, (W - 32 * dpr) / worldW);
  state.fitScale = fitScale;
  state.minScale = Math.min(0.35, Math.max(0.04, fitScale * 0.95));
  state.maxScale = 4.0;

  // Check if dataset or count changed
  if (state.lastCount !== count) {
    state.userHasPanned = false;
    state.lastCount = count;
  }

  // Find target focus node (matched node -> active step node -> root)
  let focusIdx = Math.floor(count / 2);
  if (matchedNodeIdx >= 0 && matchedNodeIdx < count) {
    focusIdx = matchedNodeIdx;
  } else if (activeIndices && activeIndices.length > 0) {
    const lastActive = activeIndices[activeIndices.length - 1];
    if (lastActive >= 0 && lastActive < count) focusIdx = lastActive;
  }

  const focusX = worldPadX + nodes[focusIdx * 2] * innerW;
  const focusY = worldPadY + nodes[focusIdx * 2 + 1] * innerH;

  // Auto-center camera if user hasn't panned manually
  if (!state.userHasPanned) {
    t.x = -(focusX - worldW / 2) * t.scale;
    t.y = -(focusY - worldH / 2) * t.scale + 16 * dpr;
  }

  // Setup HUD Buttons (untransformed)
  const hudTop = 14 * dpr;
  const btnH = 26 * dpr;
  const btnW = 28 * dpr;
  const fitW = 68 * dpr;
  const resetW = 68 * dpr;
  const hudRight = W - 16 * dpr;

  const resetBtnX = hudRight - resetW;
  const fitBtnX = resetBtnX - 6 * dpr - fitW;
  const minusBtnX = fitBtnX - 6 * dpr - btnW;
  const plusBtnX = minusBtnX - 4 * dpr - btnW;

  state.hudButtons = [
    {
      x: plusBtnX,
      y: hudTop,
      w: btnW,
      h: btnH,
      action: () => {
        const oldScale = state.transform.scale;
        const newScale = Math.min(state.maxScale || 4.0, oldScale * 1.25);
        state.transform.x *= (newScale / oldScale);
        state.transform.y *= (newScale / oldScale);
        state.transform.scale = newScale;
        state.userHasPanned = true;
      }
    },
    {
      x: minusBtnX,
      y: hudTop,
      w: btnW,
      h: btnH,
      action: () => {
        const oldScale = state.transform.scale;
        const newScale = Math.max(state.minScale || 0.04, oldScale / 1.25);
        state.transform.x *= (newScale / oldScale);
        state.transform.y *= (newScale / oldScale);
        state.transform.scale = newScale;
        state.userHasPanned = true;
      }
    },
    {
      x: fitBtnX,
      y: hudTop,
      w: fitW,
      h: btnH,
      action: () => {
        state.transform.scale = state.fitScale || 0.2;
        state.transform.x = 0;
        state.transform.y = 0;
        state.userHasPanned = true;
      }
    },
    {
      x: resetBtnX,
      y: hudTop,
      w: resetW,
      h: btnH,
      action: () => {
        state.userHasPanned = false;
        state.transform.scale = 1.0;
      }
    }
  ];

  // Draw Scaled & Panned Tree Area
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 46 * dpr, W, H - 46 * dpr);
  ctx.clip();

  // Matrix transform
  ctx.translate(W / 2 + t.x, H / 2 + t.y);
  ctx.scale(t.scale, t.scale);
  ctx.translate(-worldW / 2, -worldH / 2);

  // Edges
  for (let i = 0; i + 1 < edges.length; i += 2) {
    const a = edges[i];
    const b = edges[i + 1];
    const isActive = activeSet.has(a) && activeSet.has(b);

    const ax = worldPadX + nodes[a * 2] * innerW;
    const ay = worldPadY + nodes[a * 2 + 1] * innerH;
    const bx = worldPadX + nodes[b * 2] * innerW;
    const by = worldPadY + nodes[b * 2 + 1] * innerH;

    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);

    if (isActive) {
      ctx.strokeStyle = isLight ? "#2563eb" : "#4f8cff";
      ctx.lineWidth = 2.8 * dpr;
      ctx.shadowColor = isLight ? "rgba(37, 99, 235, 0.6)" : "rgba(79, 140, 255, 0.8)";
      ctx.shadowBlur = 8 * dpr;
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      ctx.strokeStyle = isLight ? "rgba(37, 99, 235, 0.25)" : "rgba(79, 140, 255, 0.24)";
      ctx.lineWidth = 1.2 * dpr;
      ctx.stroke();
    }
  }

  // Nodes
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const nodeR = 14 * dpr;
  const screenSpacing = (innerW / count) * t.scale;
  const showAllLabels = screenSpacing >= 28 * dpr || count <= 32;

  for (let i = 0; i < count; i++) {
    const x = worldPadX + nodes[i * 2] * innerW;
    const y = worldPadY + nodes[i * 2 + 1] * innerH;
    const isActive = activeSet.has(i);
    const isMatched = i === matchedNodeIdx;

    // Viewport cull check
    const screenX = W / 2 + t.x + (x - worldW / 2) * t.scale;
    const screenY = H / 2 + t.y + (y - worldH / 2) * t.scale;
    if (screenX < -80 * dpr || screenX > W + 80 * dpr || screenY < -80 * dpr || screenY > H + 80 * dpr) {
      continue;
    }

    const r = (isMatched || isActive) ? Math.max(nodeR, 8 * dpr / Math.max(0.2, t.scale)) : nodeR;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);

    if (isMatched) {
      ctx.fillStyle = isLight ? "#059669" : "#00e5a3";
      ctx.shadowColor = isLight ? "rgba(5, 150, 105, 0.7)" : "rgba(0, 229, 163, 0.95)";
      ctx.shadowBlur = 16 * dpr;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5 * dpr;
      ctx.stroke();
    } else if (isActive) {
      ctx.fillStyle = isLight ? "#2563eb" : "#4f8cff";
      ctx.shadowColor = isLight ? "rgba(37, 99, 235, 0.65)" : "rgba(79, 140, 255, 0.85)";
      ctx.shadowBlur = 10 * dpr;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.0 * dpr;
      ctx.stroke();
    } else {
      ctx.fillStyle = isLight ? "rgba(255, 255, 255, 0.95)" : "rgba(18, 26, 44, 0.94)";
      ctx.fill();
      ctx.strokeStyle = isLight ? "rgba(37, 99, 235, 0.35)" : "rgba(79, 140, 255, 0.45)";
      ctx.lineWidth = 1.3 * dpr;
      ctx.stroke();
    }

    const label = labels && labels[i] ? labels[i] : "";
    if (label) {
      const isRoot = (i === Math.floor(count / 2));
      const shouldDrawLabel = showAllLabels || isMatched || isActive || isRoot;
      if (shouldDrawLabel) {
        const fontSize = Math.max(7.5 * dpr, Math.min(11 * dpr, label.length > 5 ? 8 * dpr : label.length > 3 ? 9.5 * dpr : 10.5 * dpr));
        ctx.font = `700 ${fontSize}px ui-monospace, monospace`;
        ctx.fillStyle = (isMatched || isActive) ? "#ffffff" : (isLight ? "#0f172a" : "#ffffff");
        ctx.fillText(label, x, y);
      }
    }
  }

  ctx.restore(); // End zoom & pan clip

  // Fixed Header info (untransformed HUD layer)
  const padXHead = 20 * dpr;
  if (info) {
    ctx.font = `600 ${13 * dpr}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillStyle = isLight ? "#0f172a" : "#e8eefc";
    ctx.textAlign = "left";
    ctx.fillText(info.title || "Дерево Штерна–Броко", padXHead, 20 * dpr);

    if (info.subtitle) {
      ctx.font = `${11 * dpr}px ui-monospace, monospace`;
      ctx.fillStyle = info.isMatch
        ? (isLight ? "#059669" : "#00e5a3")
        : (isLight ? "#2563eb" : "rgba(79, 140, 255, 0.95)");
      ctx.fillText(info.subtitle, padXHead, 35 * dpr);
    }
  }

  // Draw HUD Buttons & Zoom Percentage (top right)
  const pillBg = isLight ? "rgba(255, 255, 255, 0.9)" : "rgba(18, 26, 44, 0.8)";
  const pillBorder = isLight ? "rgba(15, 23, 42, 0.12)" : "rgba(255, 255, 255, 0.1)";
  const pillText = isLight ? "#475569" : "#95a3bf";

  const btnBg = isLight ? "rgba(255, 255, 255, 0.95)" : "rgba(26, 38, 64, 0.85)";
  const btnBorder = isLight ? "rgba(37, 99, 235, 0.4)" : "rgba(79, 140, 255, 0.5)";
  const btnText = isLight ? "#1e293b" : "#ffffff";
  const hintColor = isLight ? "rgba(71, 85, 105, 0.9)" : "rgba(149, 163, 191, 0.85)";

  // 1. Zoom info pill
  const zoomText = `${Math.round(t.scale * 100)}%`;
  ctx.font = `600 ${11 * dpr}px ui-monospace, monospace`;
  const zoomW = ctx.measureText(zoomText).width + 16 * dpr;
  const zoomPillX = plusBtnX - zoomW - 8 * dpr;

  drawGlassCard(ctx, zoomPillX, hudTop, zoomW, btnH, 5 * dpr, pillBg, pillBorder);
  ctx.fillStyle = pillText;
  ctx.textAlign = "center";
  ctx.fillText(zoomText, zoomPillX + zoomW / 2, hudTop + btnH / 2 + 4 * dpr);

  // 2. Button [+]
  drawGlassCard(ctx, plusBtnX, hudTop, btnW, btnH, 5 * dpr, btnBg, btnBorder);
  ctx.font = `700 ${14 * dpr}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = btnText;
  ctx.fillText("+", plusBtnX + btnW / 2, hudTop + btnH / 2 + 4 * dpr);

  // 3. Button [-]
  drawGlassCard(ctx, minusBtnX, hudTop, btnW, btnH, 5 * dpr, btnBg, btnBorder);
  ctx.font = `700 ${14 * dpr}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = btnText;
  ctx.fillText("−", minusBtnX + btnW / 2, hudTop + btnH / 2 + 3 * dpr);

  // 4. Button [⊡ Обзор]
  drawGlassCard(ctx, fitBtnX, hudTop, fitW, btnH, 5 * dpr, btnBg, btnBorder);
  ctx.font = `600 ${11 * dpr}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = btnText;
  ctx.fillText("⊡ Обзор", fitBtnX + fitW / 2, hudTop + btnH / 2 + 4 * dpr);

  // 5. Button [⟲ Сброс]
  drawGlassCard(ctx, resetBtnX, hudTop, resetW, btnH, 5 * dpr, btnBg, btnBorder);
  ctx.font = `600 ${11 * dpr}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = btnText;
  ctx.fillText("⟲ Сброс", resetBtnX + resetW / 2, hudTop + btnH / 2 + 4 * dpr);

  // Bottom interactive hint badge
  ctx.font = `${10 * dpr}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = hintColor;
  ctx.textAlign = "right";
  ctx.fillText("✣ Перетаскивание: обзор · Колёсико: масштаб · 2x клик: сброс к цели", W - 18 * dpr, H - 10 * dpr);
}

export function drawKaratsubaTree(canvas, model, currentStep) {
  if (!canvas) return;
  if (canvas.__viz) {
    canvas.__viz.state.mode = "karatsuba";
    canvas.style.cursor = "default";
    canvas.__viz.redraw = () => drawKaratsubaTree(canvas, model, currentStep);
  }

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
  const isLight = document.documentElement.getAttribute("data-theme") === "light";

  // Header Title & Dynamic Subtitle
  ctx.font = `600 ${14 * dpr}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = isLight ? "#0f172a" : "#e8eefc";
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
  ctx.fillStyle = isLight ? (step >= 5 ? "#059669" : "#2563eb") : (step >= 5 ? "#00e5a3" : "#4f8cff");
  ctx.fillText(stepDescriptions[Math.min(step, 5)], padX, 38 * dpr);

  // 1. Root Box (Split X, Y)
  const rootW = Math.min(W - 32 * dpr, 620 * dpr);
  const rootH = 58 * dpr;
  const rootX = cx - rootW / 2;
  const rootY = 48 * dpr;

  const isRootActive = step === 0;
  ctx.save();
  if (isRootActive) {
    ctx.shadowColor = isLight ? "rgba(37, 99, 235, 0.5)" : "rgba(79, 140, 255, 0.7)";
    ctx.shadowBlur = 12 * dpr;
  }
  drawGlassCard(
    ctx, rootX, rootY, rootW, rootH, 8 * dpr,
    isLight
      ? (isRootActive ? "rgba(37, 99, 235, 0.1)" : "rgba(255, 255, 255, 0.9)")
      : (isRootActive ? "rgba(79, 140, 255, 0.25)" : "rgba(255, 255, 255, 0.04)"),
    isLight
      ? (isRootActive ? "#2563eb" : "rgba(37, 99, 235, 0.35)")
      : (isRootActive ? "#4f8cff" : "rgba(79, 140, 255, 0.45)")
  );
  ctx.restore();

  // Root box content (adaptive font scaling)
  const rootLine1 = `X = ${m.x} = ${m.a}·10^${m.m} + ${m.b}   |   Y = ${m.y} = ${m.c}·10^${m.m} + ${m.d}`;
  const fSizeRoot1 = fitText(ctx, rootLine1, rootW - 20 * dpr, 12 * dpr, 9 * dpr, 600);
  ctx.font = `600 ${fSizeRoot1}px ui-monospace, monospace`;
  ctx.fillStyle = isLight ? "#0f172a" : "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText(rootLine1, cx, rootY + 23 * dpr);

  const rootLine2 = `Половины: a = ${m.a}, b = ${m.b}, c = ${m.c}, d = ${m.d}`;
  ctx.font = `${11 * dpr}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = isRootActive ? (isLight ? "#059669" : "#00e5a3") : (isLight ? "#475569" : "rgba(154, 168, 192, 0.95)");
  ctx.fillText(rootLine2, cx, rootY + 44 * dpr);

  // 2. Three Branch Boxes (Expanded & multi-line to guarantee zero overflow)
  const branchY = 142 * dpr;
  const branchW = Math.min((W - 48 * dpr) / 3, 270 * dpr);
  const branchH = 80 * dpr;
  const gap = 14 * dpr;
  const totalBranchesW = branchW * 3 + gap * 2;
  const branchStartX = cx - totalBranchesW / 2;

  const branchSpecs = [
    {
      title: "Ветвь 1: z₂ = ac",
      calc: `${m.a} × ${m.c}`,
      res: `= ${m.ac}`,
      stepReq: 1,
      color: isLight ? "#2563eb" : "#4f8cff"
    },
    {
      title: "Ветвь 2: z₀ = bd",
      calc: `${m.b} × ${m.d}`,
      res: `= ${m.bd}`,
      stepReq: 2,
      color: isLight ? "#059669" : "#00e5a3"
    },
    {
      title: "Ветвь 3: (a+b)(c+d)",
      calc: `(${m.a}+${m.b}) × (${m.c}+${m.d})`,
      res: `= ${m.sumProd}`,
      stepReq: 3,
      color: isLight ? "#d97706" : "#ffb454"
    }
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
      ctx.strokeStyle = isLight ? "rgba(37, 99, 235, 0.35)" : "rgba(79, 140, 255, 0.4)";
      ctx.lineWidth = 1.5 * dpr;
      ctx.stroke();
    } else {
      ctx.strokeStyle = isLight ? "rgba(15, 23, 42, 0.08)" : "rgba(255, 255, 255, 0.08)";
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
      isLight
        ? (isBranchCurrent ? "rgba(37, 99, 235, 0.08)" : "rgba(255, 255, 255, 0.88)")
        : (isBranchCurrent ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.03)"),
      isBranchCurrent ? b.color : (isBranchDone ? (isLight ? "rgba(37, 99, 235, 0.3)" : "rgba(255, 255, 255, 0.15)") : (isLight ? "rgba(15, 23, 42, 0.1)" : "rgba(255, 255, 255, 0.06)"))
    );
    ctx.restore();

    // Line 1: Title (with adaptive font scaling)
    const branchTitle = isBranchDone ? b.title : `${b.title} (ожидание)`;
    const fSizeTitle = fitText(ctx, branchTitle, branchW - 10 * dpr, 11 * dpr, 8 * dpr, 600, "ui-sans-serif, system-ui, sans-serif");
    ctx.font = `600 ${fSizeTitle}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillStyle = isBranchDone ? b.color : (isLight ? "rgba(100, 116, 139, 0.4)" : "rgba(154, 168, 192, 0.4)");
    ctx.textAlign = "center";
    ctx.fillText(branchTitle, bx + branchW / 2, branchY + 20 * dpr);

    // Line 2: Calculation formula
    const fSizeCalc = fitText(ctx, b.calc, branchW - 14 * dpr, 11 * dpr, 8.5 * dpr, 500);
    ctx.font = `500 ${fSizeCalc}px ui-monospace, monospace`;
    ctx.fillStyle = isBranchDone ? (isLight ? "#0f172a" : "#e8eefc") : (isLight ? "rgba(100, 116, 139, 0.3)" : "rgba(154, 168, 192, 0.3)");
    ctx.fillText(isBranchDone ? b.calc : "...", bx + branchW / 2, branchY + 42 * dpr);

    // Line 3: Result (bold accent)
    const fSizeRes = fitText(ctx, b.res, branchW - 14 * dpr, 12 * dpr, 9 * dpr, 700);
    ctx.font = `700 ${fSizeRes}px ui-monospace, monospace`;
    ctx.fillStyle = isBranchDone ? b.color : (isLight ? "rgba(100, 116, 139, 0.25)" : "rgba(154, 168, 192, 0.25)");
    ctx.fillText(isBranchDone ? b.res : "", bx + branchW / 2, branchY + 64 * dpr);
  }

  // 3. Combine Box (XY formula, middle term, and final product)
  const combY = 258 * dpr;
  const combW = Math.min(W - 32 * dpr, 640 * dpr);
  const combH = 92 * dpr;
  const combX = cx - combW / 2;

  const isMiddleStep = step === 4;
  const isFinalStep = step >= 5;
  const isCombineVisible = step >= 4;

  // Connectors from 3 branches to Combine Box
  for (let i = 0; i < 3; i++) {
    const bx = branchStartX + i * (branchW + gap);
    ctx.beginPath();
    ctx.moveTo(bx + branchW / 2, branchY + branchH);
    ctx.lineTo(cx, combY);
    if (isCombineVisible) {
      ctx.strokeStyle = isFinalStep ? (isLight ? "#059669" : "#00e5a3") : (isLight ? "#2563eb" : "rgba(79, 140, 255, 0.5)");
      ctx.lineWidth = (isMiddleStep || isFinalStep) ? 2 * dpr : 1 * dpr;
    } else {
      ctx.strokeStyle = isLight ? "rgba(15, 23, 42, 0.08)" : "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1 * dpr;
    }
    ctx.stroke();
  }

  ctx.save();
  if (!isCombineVisible) {
    ctx.globalAlpha = 0.25;
  } else if (isFinalStep) {
    ctx.shadowColor = isLight ? "rgba(5, 150, 105, 0.5)" : "rgba(0, 229, 163, 0.7)";
    ctx.shadowBlur = 16 * dpr;
  } else if (isMiddleStep) {
    ctx.shadowColor = isLight ? "rgba(37, 99, 235, 0.5)" : "rgba(79, 140, 255, 0.7)";
    ctx.shadowBlur = 12 * dpr;
  }

  drawGlassCard(
    ctx, combX, combY, combW, combH, 8 * dpr,
    isLight
      ? (isFinalStep ? "rgba(5, 150, 105, 0.1)" : "rgba(255, 255, 255, 0.9)")
      : (isFinalStep ? "rgba(0, 229, 163, 0.15)" : "rgba(255, 255, 255, 0.04)"),
    isLight
      ? (isFinalStep ? "#059669" : (isMiddleStep ? "#2563eb" : "rgba(15, 23, 42, 0.12)"))
      : (isFinalStep ? "#00e5a3" : (isMiddleStep ? "#4f8cff" : "rgba(255, 255, 255, 0.1)"))
  );
  ctx.restore();

  // Combine line 1: Middle calculation
  const middleText = isCombineVisible
    ? `Средний член: middle = z₁ − z₂ − z₀ = ${m.sumProd} − ${m.ac} − ${m.bd} = ${m.middle}`
    : "Вычисление среднего члена middle...";
  const fSizeMid = fitText(ctx, middleText, combW - 20 * dpr, 11.5 * dpr, 8.5 * dpr, 600);
  ctx.font = `600 ${fSizeMid}px ui-monospace, monospace`;
  ctx.fillStyle = isCombineVisible ? (isLight ? "#059669" : "#00e5a3") : (isLight ? "#64748b" : "rgba(154, 168, 192, 0.4)");
  ctx.textAlign = "center";
  ctx.fillText(middleText, cx, combY + 24 * dpr);

  // Combine line 2: Formula
  const formText = `Сборка XY: z₂·10^${m.m * 2} + middle·10^${m.m} + z₀`;
  ctx.font = `500 ${11 * dpr}px ui-monospace, monospace`;
  ctx.fillStyle = isFinalStep ? (isLight ? "#475569" : "#95a3bf") : (isLight ? "#94a3b8" : "rgba(154, 168, 192, 0.4)");
  ctx.fillText(formText, cx, combY + 48 * dpr);

  // Combine line 3: Final arithmetic result
  const finalAns = isFinalStep
    ? `= ${m.ac}·10^${m.m * 2} + ${m.middle}·10^${m.m} + ${m.bd} = ${m.result}`
    : "Итоговый ответ: ...";
  const fSizeFinal = fitText(ctx, finalAns, combW - 24 * dpr, 13 * dpr, 9 * dpr, 700);
  ctx.font = `700 ${fSizeFinal}px ui-monospace, monospace`;
  ctx.fillStyle = isFinalStep ? (isLight ? "#0f172a" : "#ffffff") : (isLight ? "#94a3b8" : "rgba(154, 168, 192, 0.35)");
  ctx.fillText(finalAns, cx, combY + 74 * dpr);

  // Bottom note
  ctx.font = `${11 * dpr}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = isLight ? "#059669" : "rgba(0, 229, 163, 0.9)";
  ctx.textAlign = "center";
  ctx.fillText(`Карацуба: 3 умножения вместо 4 · Сложность O(n^log₂3) ≈ O(n^1.585) против O(n²)`, cx, combY + combH + 24 * dpr);
}

function fitText(ctx, text, maxW, basePx, minPx, weight = 600, font = "ui-monospace, monospace") {
  let size = basePx;
  ctx.font = `${weight} ${size}px ${font}`;
  while (ctx.measureText(text).width > maxW && size > minPx) {
    size -= 0.5;
    ctx.font = `${weight} ${size}px ${font}`;
  }
  return size;
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

// Custom range fill helper (used by Fractals and Hanoi)
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
