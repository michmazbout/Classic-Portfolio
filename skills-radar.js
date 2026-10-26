/* Skills radar — drop-in component
   Usage: <div class="skills-radar" data-skills-radar></div> + this script (defer) */
(() => {
  "use strict";

  /* ---------- Your data: edit values (0–100) here ---------- */
  const SKILLS = [
    {
      id: "data",
      label: "Data Science",
      icon: "uil-chart-line",
      skills: [
        { name: "Python", short: "Python", value: 95 },
        { name: "R", short: "R", value: 88 },
        { name: "Bayesian Modeling", tools: "Stan, PyMC, Turing.jl", short: "Bayesian", value: 90 },
        { name: "Machine Learning", tools: "scikit-learn, XGBoost, AutoGluon", short: "Machine learning", value: 87 },
        { name: "Spatial Statistics & Cross-Validation", short: "Spatial stats", value: 85 },
        { name: "Uncertainty Quantification", short: "Uncertainty", value: 84 },
        { name: "Dev Tools", tools: "Flask, Docker, Git, Linux", short: "Dev tools", value: 80 },
        { name: "Other Languages", tools: "Julia, Rust, JavaScript", short: "Julia/Rust/JS", value: 70 },
      ],
    },
    {
      id: "geospatial",
      label: "Geospatial",
      icon: "uil-map",
      skills: [
        { name: "QGIS & ArcGIS", short: "QGIS/ArcGIS", value: 95 },
        { name: "Google Earth Engine", tools: "JS & Python", short: "Earth Engine", value: 92 },
        { name: "Satellite Data", tools: "Sentinel, Landsat, GEDI", short: "Satellite data", value: 90 },
        { name: "DEM Analysis", tools: "xDEM, lidR", short: "DEM analysis", value: 86 },
        { name: "LiDAR & UAV/SfM Processing", short: "LiDAR & UAV", value: 82 },
        { name: "Photogrammetry & 3D Modeling", short: "Photogrammetry", value: 80 },
      ],
    },
    {
      id: "environment",
      label: "Environment",
      icon: "uil-globe",
      skills: [
        { name: "Natural Hazards & Risk", short: "Hazards", value: 92 },
        { name: "Above-Ground Biomass Estimation", short: "Biomass", value: 88 },
        { name: "Environmental Impact Assessment", short: "EIA", value: 88 },
        { name: "Carbon MRV & Standards", tools: "Verra, Gold Standard, Isometric", short: "Carbon MRV", value: 85 },
        { name: "Sustainability Assessment", short: "Sustainability", value: 85 },
        { name: "GHG Accounting", short: "GHG", value: 80 },
        { name: "Life Cycle Assessment", short: "LCA", value: 75 },
      ],
    },
    {
      id: "engineering",
      label: "Engineering",
      icon: "uil-cog",
      skills: [
        { name: "CAD", tools: "SolidWorks, AutoCAD", short: "CAD", value: 92 },
        { name: "Thermodynamics & Mechanics", short: "Thermo & mech.", value: 85 },
        { name: "Finite Element Analysis", short: "FEA", value: 82 },
        { name: "Fluid Mechanics", short: "Fluids", value: 80 },
        { name: "Materials Science", short: "Materials", value: 80 },
        { name: "Computational Fluid Dynamics", tools: "Ansys", short: "CFD", value: 75 },
      ],
    },
  ];

  /* Level thresholds shown next to each percentage */
  const levelOf = (v) => (v >= 90 ? "Expert" : v >= 75 ? "Advanced" : "Intermediate");

  /* ---------- Setup ---------- */
  const root = document.querySelector("[data-skills-radar]");
  if (!root) return;

  const NS = "http://www.w3.org/2000/svg";
  const W = 460, H = 380, CX = 230, CY = 190, R = 120, RINGS = 5, DUR = 900;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const point = (i, n, r, cx = CX, cy = CY) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const toPoints = (pts) => pts.map((p) => p.map((v) => v.toFixed(2)).join(",")).join(" ");
  const svgEl = (tag, attrs = {}) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  };
  const easeOutBack = (p) => 1 + 2.2 * Math.pow(p - 1, 3) + 1.2 * Math.pow(p - 1, 2);
  const easeOutCubic = (p) => 1 - Math.pow(1 - p, 3);

  root.innerHTML = `
    <div class="sr-tabs" role="tablist" aria-label="Skill categories"></div>
    <div class="sr-body">
      <div class="sr-chart">
        <svg class="sr-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Skills radar chart">
          <defs>
            <linearGradient id="sr-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" class="sr-stop-1"></stop>
              <stop offset="1" class="sr-stop-2"></stop>
            </linearGradient>
          </defs>
          <g class="sr-grid"></g>
          <polygon class="sr-shape"></polygon>
          <g class="sr-points"></g>
          <g class="sr-labels"></g>
        </svg>
        <div class="sr-tip" aria-hidden="true"></div>
      </div>
      <ul class="sr-list" role="tabpanel"></ul>
    </div>`;

  const tabsEl = root.querySelector(".sr-tabs");
  const gridEl = root.querySelector(".sr-grid");
  const shapeEl = root.querySelector(".sr-shape");
  const pointsEl = root.querySelector(".sr-points");
  const labelsEl = root.querySelector(".sr-labels");
  const listEl = root.querySelector(".sr-list");
  const tipEl = root.querySelector(".sr-tip");

  let current = -1;
  let values = [];
  let frame = 0;
  let active = -1;

  /* ---------- Tabs with mini radars ---------- */
  const miniRadar = (cat) => {
    const n = cat.skills.length, c = 26, r = 22;
    const ring = cat.skills.map((_, i) => point(i, n, r, c, c));
    const shape = cat.skills.map((s, i) => point(i, n, (r * s.value) / 100, c, c));
    return `<svg class="sr-mini" viewBox="0 0 52 52" aria-hidden="true">
      <polygon class="sr-mini-ring" points="${toPoints(ring)}"></polygon>
      <polygon class="sr-mini-shape" points="${toPoints(shape)}"></polygon></svg>`;
  };

  tabsEl.innerHTML = SKILLS.map((cat, idx) => {
    const avg = Math.round(cat.skills.reduce((s, k) => s + k.value, 0) / cat.skills.length);
    return `<button class="sr-tab" role="tab" type="button" id="sr-tab-${cat.id}"
        aria-selected="false" tabindex="-1" data-index="${idx}">
        ${miniRadar(cat)}
        <span class="sr-tab-text">
          <span class="sr-tab-title"><i class="uil ${cat.icon}" aria-hidden="true"></i> ${cat.label}</span>
          <span class="sr-tab-meta">${cat.skills.length} skills · avg ${avg}%</span>
        </span>
      </button>`;
  }).join("");
  const tabs = [...tabsEl.querySelectorAll(".sr-tab")];

  const updateTabs = (idx) => {
    tabs.forEach((t, i) => {
      t.setAttribute("aria-selected", String(i === idx));
      t.tabIndex = i === idx ? 0 : -1;
    });
    listEl.setAttribute("aria-labelledby", tabs[idx].id);
  };

  /* ---------- Build chart + list for a category ---------- */
  function build(cat) {
    const n = cat.skills.length;
    gridEl.replaceChildren();
    pointsEl.replaceChildren();
    labelsEl.replaceChildren();

    for (let r = 1; r <= RINGS; r++) {
      const ring = cat.skills.map((_, i) => point(i, n, (R * r) / RINGS));
      gridEl.appendChild(svgEl("polygon", {
        class: r === RINGS ? "sr-ring sr-ring--outer" : "sr-ring",
        points: toPoints(ring),
      }));
    }

    cat.skills.forEach((s, i) => {
      const [ax, ay] = point(i, n, R);
      gridEl.appendChild(svgEl("line", { class: "sr-axis", x1: CX, y1: CY, x2: ax, y2: ay }));

      const [lx, ly] = point(i, n, R + 18);
      const anchor = Math.abs(lx - CX) < 8 ? "middle" : lx > CX ? "start" : "end";
      const dy = ly < CY - R + 10 ? -2 : ly > CY + R - 10 ? 12 : 4;
      const label = svgEl("text", { class: "sr-label", x: lx, y: ly + dy, "text-anchor": anchor });
      label.textContent = s.short;
      labelsEl.appendChild(label);

      const g = svgEl("g", { class: "sr-pt" });
      const hit = svgEl("circle", { class: "sr-hit", r: 14 });
      const dot = svgEl("circle", { class: "sr-dot", r: 5 });
      g.append(hit, dot);
      g.addEventListener("pointerenter", () => highlight(i));
      g.addEventListener("pointerleave", () => highlight(-1));
      g.addEventListener("click", () => highlight(active === i ? -1 : i));
      pointsEl.appendChild(g);
    });

    listEl.innerHTML = cat.skills.map((s, i) => `
      <li class="sr-item" tabindex="0" data-i="${i}">
        <div class="sr-row">
          <span class="sr-name">${s.name}${s.tools ? `<span class="sr-tools">${s.tools}</span>` : ""}</span>
          <span class="sr-meta">
            <span class="sr-level">${levelOf(s.value)}</span>
            <span class="sr-value">0%</span>
          </span>
        </div>
        <span class="sr-bar"><span class="sr-fill" style="--d:${i * 60}ms"></span></span>
      </li>`).join("");

    listEl.querySelectorAll(".sr-item").forEach((li) => {
      const i = Number(li.dataset.i);
      li.addEventListener("pointerenter", () => highlight(i));
      li.addEventListener("pointerleave", () => highlight(-1));
      li.addEventListener("focus", () => highlight(i));
      li.addEventListener("blur", () => highlight(-1));
    });
  }

  function render(vals) {
    const n = vals.length;
    const pts = vals.map((v, i) => point(i, n, R * v));
    shapeEl.setAttribute("points", toPoints(pts));
    pointsEl.querySelectorAll(".sr-pt").forEach((g, i) => {
      g.querySelectorAll("circle").forEach((c) => {
        c.setAttribute("cx", pts[i][0]);
        c.setAttribute("cy", pts[i][1]);
      });
    });
    if (active >= 0) placeTip(active);
  }

  /* ---------- Highlight + tooltip ---------- */
  function placeTip(i) {
    const cat = SKILLS[current] || SKILLS[0];
    const [x, y] = point(i, cat.skills.length, R * (values[i] || 0));
    tipEl.style.left = `${(x / W) * 100}%`;
    tipEl.style.top = `${(y / H) * 100}%`;
  }

  function highlight(i) {
    active = i;
    listEl.querySelectorAll(".sr-item").forEach((el, j) => el.classList.toggle("is-active", j === i));
    pointsEl.querySelectorAll(".sr-pt").forEach((el, j) => el.classList.toggle("is-active", j === i));
    labelsEl.querySelectorAll(".sr-label").forEach((el, j) => el.classList.toggle("is-active", j === i));
    if (i >= 0 && current >= 0) {
      const s = SKILLS[current].skills[i];
      tipEl.textContent = `${s.name} · ${s.value}%`;
      placeTip(i);
      tipEl.classList.add("is-visible");
    } else {
      tipEl.classList.remove("is-visible");
    }
  }

  /* ---------- Switch category with morph animation ---------- */
  function show(idx) {
    if (idx === current) return;
    const cat = SKILLS[idx];
    const n = cat.skills.length;
    const sameShape = current >= 0 && SKILLS[current].skills.length === n;
    const from = sameShape ? values.slice() : new Array(n).fill(0);
    const to = cat.skills.map((s) => s.value / 100);

    current = idx;
    active = -1;
    tipEl.classList.remove("is-visible");
    updateTabs(idx);
    build(cat);
    values = from;
    render(from);
    animate(from, to, cat);
  }

  function animate(from, to, cat) {
    cancelAnimationFrame(frame);
    const valueEls = [...listEl.querySelectorAll(".sr-value")];
    const fills = [...listEl.querySelectorAll(".sr-fill")];

    void listEl.offsetWidth; // restart bar transitions
    fills.forEach((f, i) => { f.style.width = `${cat.skills[i].value}%`; });

    if (reduceMotion) {
      values = to;
      render(values);
      valueEls.forEach((el, i) => { el.textContent = `${cat.skills[i].value}%`; });
      return;
    }

    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / DUR);
      const e = Math.min(easeOutBack(p), 1.06);
      values = from.map((a, i) => a + (to[i] - a) * e);
      render(values);
      const c = easeOutCubic(p);
      valueEls.forEach((el, i) => { el.textContent = `${Math.round(cat.skills[i].value * c)}%`; });
      if (p < 1) frame = requestAnimationFrame(step);
      else { values = to; render(values); }
    };
    frame = requestAnimationFrame(step);
  }

  /* ---------- Events ---------- */
  tabs.forEach((t) => t.addEventListener("click", () => show(Number(t.dataset.index))));
  tabsEl.addEventListener("keydown", (e) => {
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next = null;
    if (e.key in keys) next = (Math.max(current, 0) + keys[e.key] + tabs.length) % tabs.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = tabs.length - 1;
    if (next === null) return;
    e.preventDefault();
    tabs[next].focus();
    show(next);
  });

  /* ---------- Start when the section scrolls into view ---------- */
  updateTabs(0);
  build(SKILLS[0]);
  render(new Array(SKILLS[0].skills.length).fill(0));

  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((en) => en.isIntersecting)) {
        io.disconnect();
        show(0);
      }
    }, { threshold: 0.3 });
    io.observe(root);
  } else {
    show(0);
  }
})();
