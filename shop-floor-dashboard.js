(function () {
  "use strict";

  const SECTIONS = [
    { id: "oxide", name: "Oxide Mill", code: "OX", plan: 490, unit: "kg", lead: true, rework: false, color: "#6366F1", bg: "#EEF2FF" },
    { id: "gr_pos", name: "Grid (+)", code: "GR+", plan: 2200, unit: "pcs", lead: true, rework: false, color: "#0284C7", bg: "#E0F2FE" },
    { id: "gr_neg", name: "Grid (-)", code: "GR-", plan: 2200, unit: "pcs", lead: true, rework: false, color: "#0EA5E9", bg: "#E0F2FE" },
    { id: "ps_pos", name: "Pasting (+)", code: "PS+", plan: 1800, unit: "pcs", lead: false, rework: false, color: "#7C3AED", bg: "#EDE9FE" },
    { id: "ps_neg", name: "Pasting (-)", code: "PS-", plan: 1800, unit: "pcs", lead: false, rework: false, color: "#8B5CF6", bg: "#EDE9FE" },
    { id: "fm_pos", name: "Forming (+)", code: "FM+", plan: 880, unit: "pcs", lead: false, rework: true, color: "#D97706", bg: "#FEF3C7" },
    { id: "fm_neg", name: "Forming (-)", code: "FM-", plan: 880, unit: "pcs", lead: false, rework: true, color: "#F59E0B", bg: "#FEF3C7" },
    { id: "bc_pos", name: "Brushing & Cut (+)", code: "BC+", plan: 1600, unit: "pcs", lead: false, rework: false, color: "#059669", bg: "#D1FAE5" },
    { id: "bc_neg", name: "Brushing & Cut (-)", code: "BC-", plan: 1600, unit: "pcs", lead: false, rework: false, color: "#10B981", bg: "#D1FAE5" },
    { id: "f_asm", name: "First Assembly", code: "FA", plan: 440, unit: "batt", lead: false, rework: false, color: "#EA580C", bg: "#FFEDD5" },
    { id: "fn_asm", name: "Final Assembly", code: "FN", plan: 400, unit: "batt", lead: false, rework: false, color: "#DC2626", bg: "#FEE2E2" }
  ];

  const STATUSES = ["RUNNING", "RUNNING", "RUNNING", "RUNNING", "RUNNING", "IDLE", "SETUP"];
  const ALERT_MSGS = [
    "Reject rate exceeded 3% threshold",
    "Machine speed below baseline",
    "Lead consumption variance +8%",
    "Efficiency drop detected",
    "WIP inventory low",
    "Curing temperature deviation"
  ];
  const STATUS_CFG = {
    RUNNING: { bg: "#DCFCE7", text: "#166534", dot: "#16A34A" },
    IDLE: { bg: "#FEF9C3", text: "#713F12", dot: "#CA8A04" },
    SETUP: { bg: "#DBEAFE", text: "#1E3A8A", dot: "#2563EB" },
    DOWN: { bg: "#FEE2E2", text: "#7F1D1D", dot: "#DC2626" }
  };

  const state = {
    secs: [],
    tick: 0,
    now: new Date(),
    events: [],
    paused: false,
    filter: "ALL",
    selected: null
  };

  let ticketCount = 1042;

  const app = document.getElementById("app");
  const rnd = (a, b) => a + Math.random() * (b - a);
  const ri = (a, b) => Math.floor(rnd(a, b));
  const fmt = (n) => n.toLocaleString();

  function initSection(section) {
    const progress = rnd(0.55, 0.88);
    const actual = Math.floor(section.plan * progress);
    const reject = Math.floor(actual * rnd(0.008, 0.035));
    const status = STATUSES[ri(0, STATUSES.length)];

    return {
      ...section,
      status,
      actual,
      reject,
      rework: section.rework ? Math.floor(reject * rnd(0.2, 0.5)) : 0,
      eff: Math.round(rnd(68, 96) * 10) / 10,
      leadKg: section.lead ? Math.round(rnd(38, 72) * 10) / 10 : null,
      rpm: ri(72, 98),
      wip: ri(80, 420),
      downtime: status === "DOWN" ? ri(8, 55) : 0,
      alert: status === "DOWN" ? { lv: "red", msg: `Machine fault - OpsDesk #${ticketCount++} auto-created` } : null,
      trend: Array.from({ length: 12 }, () => Math.round(rnd(64, 96) * 10) / 10)
    };
  }

  function tickSection(section) {
    const actual = Math.min(section.plan, section.actual + Math.max(0, ri(0, 7)));
    const eff = Math.min(99, Math.max(55, section.eff + rnd(-1.5, 1.8)));
    const reject = Math.floor(actual * rnd(0.005, 0.038));
    const roll = Math.random();
    let status = section.status;
    let alert = section.alert;
    let downtime = section.downtime;

    if (roll > 0.985 && section.status !== "DOWN") {
      status = "DOWN";
      alert = { lv: "red", msg: `Machine fault - OpsDesk #${ticketCount++} auto-created` };
      downtime = 1;
    } else if (roll > 0.97 && section.status === "DOWN") {
      status = "RUNNING";
      alert = { lv: "green", msg: "Resolved - section running" };
      downtime = 0;
    } else if (roll > 0.96 && section.status === "RUNNING") {
      status = "SETUP";
      alert = { lv: "blue", msg: "Batch changeover - setup started" };
    } else if (roll > 0.94 && section.status === "SETUP") {
      status = "RUNNING";
      alert = null;
    } else if (roll > 0.93 && section.status === "IDLE") {
      status = "RUNNING";
      alert = null;
    } else if (eff < 73 && section.status === "RUNNING") {
      alert = { lv: "yellow", msg: ALERT_MSGS[ri(0, ALERT_MSGS.length)] };
    } else if (Math.random() > 0.88) {
      alert = null;
    }

    if (status === "DOWN") {
      downtime = section.downtime + 1;
    }

    return {
      ...section,
      actual,
      eff: Math.round(eff * 10) / 10,
      reject,
      rework: section.rework ? Math.floor(reject * rnd(0.2, 0.5)) : 0,
      leadKg: section.lead ? Math.round((section.leadKg + rnd(-0.3, 0.5)) * 10) / 10 : null,
      rpm: Math.min(100, Math.max(60, section.rpm + ri(-3, 4))),
      wip: Math.min(600, Math.max(20, section.wip + ri(-15, 18))),
      status,
      alert,
      downtime,
      trend: [...section.trend.slice(1), Math.round(eff * 10) / 10]
    };
  }

  function sparkline(values, color, height) {
    const width = 220;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const points = values.map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - 3 - ((value - min) / range) * (height - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");

    return `
      <svg class="sparkline" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
        <polyline points="${points}" fill="none" stroke="${color}" stroke-width="${height > 35 ? 2 : 1.5}" stroke-linecap="round" stroke-linejoin="round"></polyline>
      </svg>
    `;
  }

  function alertStyles(level) {
    const map = {
      red: { bg: "#FEF2F2", text: "#991B1B", border: "#FECACA", prefix: "[!] " },
      yellow: { bg: "#FFFBEB", text: "#78350F", border: "#FDE68A", prefix: "[i] " },
      green: { bg: "#F0FDF4", text: "#14532D", border: "#BBF7D0", prefix: "[ok] " },
      blue: { bg: "#EFF6FF", text: "#1E3A8A", border: "#BFDBFE", prefix: "[info] " }
    };
    return map[level] || map.blue;
  }

  function eventColor(level) {
    if (level === "red") return "#DC2626";
    if (level === "yellow") return "#F59E0B";
    if (level === "green") return "#16A34A";
    return "#2563EB";
  }

  function filterColor(filter) {
    if (filter === "ALL") return "#008D45";
    return STATUS_CFG[filter].dot;
  }

  function cardMarkup(section) {
    const status = STATUS_CFG[section.status] || STATUS_CFG.RUNNING;
    const pct = Math.min(100, Math.round((section.actual / section.plan) * 100));
    const rejectPct = section.actual > 0 ? ((section.reject / section.actual) * 100).toFixed(1) : "0.0";
    const effColor = section.eff >= 85 ? "#16A34A" : section.eff >= 72 ? "#CA8A04" : "#DC2626";
    const rejectColor = parseFloat(rejectPct) > 3 ? "#DC2626" : parseFloat(rejectPct) > 2 ? "#D97706" : "#374151";
    const alert = section.alert ? alertStyles(section.alert.lv) : null;

    return `
      <article class="section-card ${state.selected === section.id ? "selected" : ""}" data-section-id="${section.id}" style="--section-color:${section.color};--section-bg:${section.bg};--status-bg:${status.bg};--status-text:${status.text};--status-dot:${status.dot};">
        <div class="card-stripe"></div>
        <div class="card-head">
          <div class="card-title">
            <span class="code-badge">${section.code}</span>
            <span class="section-name">${section.name}</span>
          </div>
          <div class="status-pill">
            <span class="small-dot ${section.status === "RUNNING" ? "pulse" : ""}"></span>
            <span class="status-text">${section.status}</span>
          </div>
        </div>
        <div class="production">
          <div class="metric-row">
            <span class="planned">${fmt(section.plan)} ${section.unit}</span>
            <span class="actual">${fmt(section.actual)}</span>
          </div>
          <div class="bar"><div class="bar-fill" style="width:${pct}%;--accent:${section.color};"></div></div>
        </div>
        <div class="sparkline-wrap">${sparkline(section.trend, section.color, 30)}</div>
        <div class="card-metrics">
          <div class="card-metric">
            <div class="card-metric-label">Eff</div>
            <div class="card-metric-value" style="--metric-color:${effColor};">${section.eff}%</div>
          </div>
          <div class="card-metric">
            <div class="card-metric-label">Rej</div>
            <div class="card-metric-value" style="--metric-color:${rejectColor};">${rejectPct}%</div>
          </div>
          <div class="card-metric">
            <div class="card-metric-label">RPM</div>
            <div class="card-metric-value" style="--metric-color:#374151;">${section.rpm}</div>
          </div>
        </div>
        <div class="tag-row">
          ${section.leadKg ? `<span class="tag">Pb ${section.leadKg}kg</span>` : ""}
          <span class="tag">WIP ${section.wip}</span>
          ${section.rework > 0 ? `<span class="tag warn">RW ${section.rework}</span>` : ""}
          ${section.downtime > 0 ? `<span class="tag danger">Down ${section.downtime}m</span>` : ""}
        </div>
        ${section.alert ? `<div class="alert" style="--alert-bg:${alert.bg};--alert-text:${alert.text};--alert-border:${alert.border};">${alert.prefix}${section.alert.msg}</div>` : ""}
      </article>
    `;
  }

  function detailMarkup(section) {
    if (!section) {
      return `
        <div class="panel-header">
          <div class="panel-title">LIVE EVENTS</div>
          <div class="panel-subtitle">Click a card to inspect - OpsDesk active</div>
        </div>
      `;
    }

    const rows = [
      ["Planned", `${fmt(section.plan)} ${section.unit}`],
      ["Actual", fmt(section.actual)],
      ["Efficiency", `${section.eff}%`],
      ["Reject", `${section.reject} pcs`],
      ["WIP", `${section.wip} pcs`],
      ["Machine RPM", section.rpm]
    ];

    if (section.leadKg) rows.push(["Lead (Pb)", `${section.leadKg} kg`]);
    if (section.rework > 0) rows.push(["Rework", `${section.rework} pcs`]);
    if (section.downtime > 0) rows.push(["Downtime", `${section.downtime} min`]);

    return `
      <div class="detail-panel" style="--section-color:${section.color};">
        <div class="detail-head">
          <div>
            <div class="detail-title">${section.name}</div>
            <div class="panel-subtitle">Section detail</div>
          </div>
          <button class="close-btn" type="button" data-clear-selection aria-label="Close section detail">x</button>
        </div>
        <div class="detail-grid">
          ${rows.map(([label, value]) => `
            <div class="detail-item">
              <div class="detail-label">${label}</div>
              <div class="detail-value">${value}</div>
            </div>
          `).join("")}
        </div>
        <div class="sparkline-wrap large">${sparkline(section.trend, section.color, 50)}</div>
      </div>
    `;
  }

  function render() {
    const totalPlan = state.secs.reduce((acc, section) => acc + section.plan, 0);
    const totalActual = state.secs.reduce((acc, section) => acc + section.actual, 0);
    const totalReject = state.secs.reduce((acc, section) => acc + section.reject, 0);
    const avgEff = Math.round((state.secs.reduce((acc, section) => acc + section.eff, 0) / state.secs.length) * 10) / 10;
    const running = state.secs.filter((section) => section.status === "RUNNING").length;
    const down = state.secs.filter((section) => section.status === "DOWN").length;
    const filtered = state.filter === "ALL" ? state.secs : state.secs.filter((section) => section.status === state.filter);
    const selectedSection = state.secs.find((section) => section.id === state.selected);
    const shift = state.now.getHours() < 8 ? 3 : state.now.getHours() < 16 ? 1 : 2;
    const shiftPct = Math.round((((state.now.getHours() % 8) * 60) + state.now.getMinutes()) / 480 * 100);
    const rejectRate = totalActual ? ((totalReject / totalActual) * 100).toFixed(2) : "0.00";

    app.innerHTML = `
      <header class="topbar">
        <div class="brand">
          <div class="logo">MF</div>
          <span class="brand-name">Manufacturing ShopFloor Cockpit</span>
          <div class="divider"></div>
          <span class="plant">PTIC - Lead-Acid Battery - Shift ${shift}</span>
        </div>
        <div class="top-actions">
          <div class="clock">
            <div class="time">${state.now.toLocaleTimeString("en-GB", { hour12: false })}</div>
            <div class="date">${state.now.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</div>
          </div>
          <button class="pause-btn" type="button" data-pause>${state.paused ? "RESUME" : "PAUSE"}</button>
          <div class="live-state">
            <span class="dot ${state.paused ? "paused" : "live pulse"}"></span>
            <span>${state.paused ? "PAUSED" : "LIVE"}</span>
          </div>
        </div>
      </header>

      <section class="flow-strip" aria-label="Production flow">
        <div class="flow-inner">
          <span class="flow-label">PRODUCTION FLOW</span>
          ${state.secs.map((section, index) => {
            const status = STATUS_CFG[section.status];
            const percent = Math.round((section.actual / section.plan) * 100);
            return `
              <div class="flow-step">
                <button class="flow-node" type="button" data-section-id="${section.id}" style="--section-color:${section.color};">
                  <span class="flow-box ${state.selected === section.id ? "selected" : ""}" style="background:${state.selected === section.id ? section.color : section.bg};">
                    <span>${section.code}</span>
                    <span class="flow-status-dot" style="background:${status.dot};"></span>
                  </span>
                  <span class="flow-percent">${percent}%</span>
                </button>
                ${index < state.secs.length - 1 ? '<span class="flow-arrow"></span>' : ""}
              </div>
            `;
          }).join("")}
        </div>
      </section>

      <section class="kpi-bar" aria-label="Production KPIs">
        ${[
          { label: "Output", value: fmt(totalActual), sub: `/ ${fmt(totalPlan)}`, color: "#008D45" },
          { label: "Avg Efficiency", value: `${avgEff}%`, sub: "all sections", color: avgEff >= 85 ? "#008D45" : avgEff >= 70 ? "#D97706" : "#DC2626" },
          { label: "Rejects", value: fmt(totalReject), sub: `${rejectRate}%`, color: "#DC2626" },
          { label: "Running / Total", value: `${running} / ${state.secs.length}`, sub: `${down} down`, color: "#0284C7" },
          { label: "Shift Progress", value: `${shiftPct}%`, bar: true, color: "#7C3AED" }
        ].map((kpi) => `
          <div class="kpi" style="--accent:${kpi.color};">
            <div class="kpi-label">${kpi.label}</div>
            <div class="kpi-value">${kpi.value}</div>
            ${kpi.bar ? `<div class="bar"><div class="bar-fill" style="width:${shiftPct}%;"></div></div>` : `<div class="kpi-sub">${kpi.sub}</div>`}
          </div>
        `).join("")}
      </section>

      <section class="main-area">
        <div class="grid-area">
          <div class="section-filter-row">
            ${["ALL", "RUNNING", "IDLE", "SETUP", "DOWN"].map((filter) => {
              const count = filter === "ALL" ? state.secs.length : state.secs.filter((section) => section.status === filter).length;
              return `<button class="filter-btn ${state.filter === filter ? "active" : ""}" type="button" data-filter="${filter}" style="--filter-color:${filterColor(filter)};">${filter} ${count}</button>`;
            }).join("")}
            <span class="tick">tick #${state.tick}</span>
          </div>
          <div class="section-grid">
            ${filtered.map(cardMarkup).join("")}
          </div>
        </div>

        <aside class="right-panel">
          ${detailMarkup(selectedSection)}
          <div class="events-head">
            <span>EVENTS</span>
            <span class="event-count"><span class="dot live pulse"></span>${state.events.length}</span>
          </div>
          <div class="events-list">
            ${state.events.length === 0 ? '<div class="empty-events">Monitoring...</div>' : state.events.map((event) => `
              <div class="event" style="--event-color:${eventColor(event.lv)};--section-color:${event.color};">
                <div class="event-top">
                  <span class="event-code">${event.code}</span>
                  <span class="event-time">${event.time}</span>
                </div>
                <div class="event-msg">${event.msg}</div>
              </div>
            `).join("")}
          </div>
          <footer class="ops-footer">
            <div class="ops-logo">OD</div>
            <div>
              <div class="ops-title">OpsDesk</div>
              <div class="ops-sub">Auto-ticketing active</div>
            </div>
            <span class="ops-live">LIVE</span>
          </footer>
        </aside>
      </section>
    `;
  }

  app.addEventListener("click", (event) => {
    const pauseButton = event.target.closest("[data-pause]");
    const filterButton = event.target.closest("[data-filter]");
    const sectionButton = event.target.closest("[data-section-id]");
    const clearButton = event.target.closest("[data-clear-selection]");

    if (pauseButton) {
      state.paused = !state.paused;
      render();
      return;
    }

    if (filterButton) {
      state.filter = filterButton.dataset.filter;
      render();
      return;
    }

    if (clearButton) {
      state.selected = null;
      render();
      return;
    }

    if (sectionButton) {
      const id = sectionButton.dataset.sectionId;
      state.selected = state.selected === id ? null : id;
      render();
    }
  });

  function updateProduction() {
    if (state.paused) return;

    const previous = state.secs;
    const next = previous.map(tickSection);

    next.forEach((section, index) => {
      const previousSection = previous[index];
      if (section.alert && section.alert.msg !== (previousSection.alert && previousSection.alert.msg)) {
        state.events = [{
          id: Date.now() + Math.random(),
          time: new Date().toLocaleTimeString("en-GB", { hour12: false }),
          code: section.code,
          name: section.name,
          msg: section.alert.msg,
          lv: section.alert.lv,
          color: section.color
        }, ...state.events].slice(0, 25);
      }
    });

    state.secs = next;
    state.tick += 1;
    render();
  }

  function updateClock() {
    state.now = new Date();
    render();
  }

  state.secs = SECTIONS.map(initSection);
  render();
  setInterval(updateClock, 1000);
  setInterval(updateProduction, 2500);
}());
