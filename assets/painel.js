// ============================================================
// Aluganeio — painel de acessos
// Busca os números no Worker (/stats) com a senha do painel.
// ============================================================

const API_DEFAULT = "https://aluganeio.jlrodrigues6900.workers.dev/";
// para testes locais: ?api=http://localhost:8787/ (só vale em localhost)
const API_URL = (["localhost", "127.0.0.1"].includes(location.hostname) && new URLSearchParams(location.search).get("api")) || API_DEFAULT;
const TOKEN_KEY = "aluganeio:painel";
const NO_COUNT_KEY = "aluganeio:nao-contar";
const DAY_MS = 86400000;

const $ = (sel) => document.querySelector(sel);
const store = {
  get(k) { try { return sessionStorage.getItem(k) || localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v, remember) { try { (remember ? localStorage : sessionStorage).setItem(k, v); } catch (e) { /* segue sem guardar */ } },
  del(k) { try { sessionStorage.removeItem(k); localStorage.removeItem(k); } catch (e) { /* nada */ } },
};

let token = store.get(TOKEN_KEY);
let days = 30;
let lastData = null;
const showAll = { res: false, chats: false };

// ---------- formatação ----------
const nf = new Intl.NumberFormat("pt-BR");
const fmt = (n) => nf.format(n || 0);
const pct = (n) => `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(n)}%`;
const tz = { timeZone: "America/Sao_Paulo" };
const dayLabel = (iso) => { const [, m, d] = iso.split("-"); return `${d}/${m}`; };
const dayLong = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" });
const when = (ts) => new Date(ts).toLocaleString("pt-BR", { ...tz, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const isoToBr = (iso) => (iso ? iso.split("-").reverse().join("/") : "–");
const LABELS = {
  "botao-flutuante": "Botão flutuante", rodape: "Rodapé", chat: "Chat", outro: "Outro link",
  celular: "Celular", computador: "Computador", tablet: "Tablet",
};
const label = (k) => LABELS[k] || k || "Não informado";

// ---------- entrar / sair ----------
function showLogin(message) {
  $("#appView").hidden = true;
  $("#loginView").hidden = false;
  const err = $("#loginError");
  err.hidden = !message;
  err.textContent = message || "";
  $("#pwd").focus();
}
function showApp() {
  $("#loginView").hidden = true;
  $("#appView").hidden = false;
}

$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const pwd = $("#pwd").value;
  if (!pwd) return;
  $("#loginBtn").disabled = true;
  token = pwd;
  const ok = await load();
  $("#loginBtn").disabled = false;
  if (ok) {
    store.set(TOKEN_KEY, pwd, $("#remember").checked);
    // quem entra no painel é da equipe: para de contar as próprias visitas
    try { localStorage.setItem(NO_COUNT_KEY, "1"); } catch (err) { /* nada */ }
    syncNoCount();
    $("#pwd").value = "";
  }
});
$("#logoutBtn").addEventListener("click", () => {
  store.del(TOKEN_KEY);
  token = null;
  showLogin();
});
$("#refreshBtn").addEventListener("click", () => load());
document.querySelectorAll(".seg button").forEach((b) => b.addEventListener("click", () => {
  days = Number(b.dataset.days);
  document.querySelectorAll(".seg button").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
  load();
}));

function syncNoCount() {
  let on = false;
  try { on = Boolean(localStorage.getItem(NO_COUNT_KEY)); } catch (e) { /* nada */ }
  $("#noCount").checked = on;
}
$("#noCount").addEventListener("change", (e) => {
  try { e.target.checked ? localStorage.setItem(NO_COUNT_KEY, "1") : localStorage.removeItem(NO_COUNT_KEY); } catch (err) { /* nada */ }
});

// ---------- dados ----------
async function load() {
  const content = $("#content");
  content.classList.add("is-loading");
  const appErr = $("#appError");
  try {
    const res = await fetch(`${API_URL}stats?days=${days}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) { store.del(TOKEN_KEY); showLogin("Senha incorreta."); return false; }
    if (!res.ok) {
      if ($("#appView").hidden) { showLogin(data.error || `Erro ${res.status}`); return false; }
      appErr.hidden = false; appErr.textContent = data.error || `Erro ${res.status}`;
      return false;
    }
    appErr.hidden = true;
    showApp();
    lastData = data;
    render(data);
    return true;
  } catch (e) {
    const msg = "Não consegui falar com o servidor. Confira a internet e tente de novo.";
    if ($("#appView").hidden) showLogin(msg); else { appErr.hidden = false; appErr.textContent = msg; }
    return false;
  } finally {
    content.classList.remove("is-loading");
  }
}

// ---------- desenho ----------
function render(d) {
  const t = (k, f = "n") => (d.totals[k] ? d.totals[k][f] : 0);
  const p = (k, f = "n") => (d.prevTotals[k] ? d.prevTotals[k][f] : 0);

  // série diária completa (dias sem acesso entram como zero)
  const byDay = Object.fromEntries(d.daily.map((r) => [r.day, r]));
  const series = [];
  for (let i = 0; i < d.days; i++) {
    const iso = new Date(d.start + i * DAY_MS).toISOString().slice(0, 10);
    const r = byDay[iso] || {};
    series.push({ day: iso, visits: r.visits || 0, views: r.views || 0, whatsapp: r.whatsapp || 0, reservas: r.reservas || 0, chat: r.chat || 0 });
  }
  const visits = series.reduce((a, r) => a + r.visits, 0);
  const prevVisits = p("pageview", "v");

  setKpi("kVisits", "dVisits", visits, prevVisits);
  setKpi("kViews", "dViews", t("pageview"), p("pageview"));
  setKpi("kWa", "dWa", t("whatsapp"), p("whatsapp"));
  setKpi("kRes", "dRes", t("reserva"), p("reserva"));
  setKpi("kChat", "dChat", t("chat"), p("chat"));
  const contacts = t("whatsapp") + t("reserva");
  $("#kRate").textContent = visits ? pct((contacts / visits) * 100) : "–";

  columnChart($("#chartVisits"), series, [{ key: "visits", cls: "m1", name: "Visitas", color: "var(--s1)" }], true);
  columnChart($("#chartContacts"), series, [
    { key: "whatsapp", cls: "m1", name: "Cliques no WhatsApp", color: "var(--s1)" },
    { key: "reservas", cls: "m2", name: "Reservas enviadas", color: "var(--s2)" },
  ], false);
  tableView($("#tvVisits"), series, [["Visitas", "visits"], ["Páginas vistas", "views"]]);
  tableView($("#tvContacts"), series, [["WhatsApp", "whatsapp"], ["Reservas", "reservas"], ["Chat", "chat"]]);

  barList($("#bSources"), d.sources, "Nenhuma visita no período.");
  barList($("#bDevices"), d.devices, "Nenhuma visita no período.");
  barList($("#bCities"), d.cities, "Nenhuma visita no período.");
  barList($("#bCars"), d.cars, "Nenhuma reserva no período.");
  barList($("#bPackages"), d.packages, "Nenhuma reserva no período.");
  barList($("#bWa"), d.waWhere, "Nenhum clique no período.");

  reservasTable($("#tReservas"), showAll.res ? d.reservas : d.reservas.slice(0, 10));
  chatList($("#lChats"), showAll.chats ? d.chats : d.chats.slice(0, 10));
  $("#moreRes").hidden = showAll.res || d.reservas.length <= 10;
  $("#moreChats").hidden = showAll.chats || d.chats.length <= 10;
  $("#updatedAt").textContent = `Atualizado em ${when(d.generatedAt)}. Comparação com os ${d.days} dias anteriores.`;
}

function setKpi(valueId, deltaId, now, before) {
  $(`#${valueId}`).textContent = fmt(now);
  const el = $(`#${deltaId}`);
  el.className = "delta";
  if (!before && !now) { el.textContent = ""; return; }
  if (!before) { el.textContent = "Sem dados no período anterior"; return; }
  const change = ((now - before) / before) * 100;
  const sign = change > 0 ? "+" : change < 0 ? "−" : "";
  el.textContent = `${sign}${pct(Math.abs(change))} vs. período anterior`;
  if (change > 0) el.classList.add("up");
  if (change < 0) el.classList.add("down");
}

const SVG = "http://www.w3.org/2000/svg";
const svgEl = (name, attrs, parent) => {
  const el = document.createElementNS(SVG, name);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (parent) parent.appendChild(el);
  return el;
};
function niceStep(max) {
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(raw || 1));
  const norm = raw / mag;
  return (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
}
// coluna com topo arredondado (4px) e base reta
function colPath(x, y, w, h, r) {
  r = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

function columnChart(el, rows, keys, labelMax) {
  el.innerHTML = "";
  const totals = rows.map((r) => keys.reduce((a, k) => a + r[k.key], 0));
  const max = Math.max(...totals);
  if (!max) {
    const e = document.createElement("div");
    e.className = "empty";
    e.textContent = "Ainda não há dados neste período. Os números aparecem assim que o site receber visitas.";
    el.appendChild(e);
    return;
  }
  const W = Math.max(280, el.clientWidth), H = 220;
  const padL = 34, padR = 6, padT = 18, padB = 26;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const y = (v) => padT + plotH - (v / top) * plotH;
  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": keys.map((k) => k.name).join(" e ") + " por dia" }, el);

  for (let v = 0; v <= top; v += step) {
    svgEl("line", { x1: padL, x2: W - padR, y1: y(v), y2: y(v), class: v === 0 ? "base" : "grid" }, svg);
    svgEl("text", { x: padL - 8, y: y(v) + 4, "text-anchor": "end", class: "tick" }, svg).textContent = fmt(v);
  }
  const band = plotW / rows.length;
  const barW = Math.max(2, Math.min(24, band * 0.68));
  const labelEvery = Math.ceil(rows.length / Math.max(2, Math.floor(plotW / 64)));
  let maxIdx = totals.indexOf(max);

  rows.forEach((r, i) => {
    const cx = padL + band * i + band / 2;
    const x = cx - barW / 2;
    let base = 0;
    const segs = keys.filter((k) => r[k.key] > 0);
    segs.forEach((k, si) => {
      const v = r[k.key];
      const yTop = y(base + v);
      let h = y(base) - yTop;
      const gap = si > 0 ? 2 : 0; // 2px de respiro entre segmentos empilhados
      h = Math.max(0, h - gap);
      const isTop = si === segs.length - 1;
      svgEl("path", { d: isTop ? colPath(x, yTop, barW, h, 4) : `M${x},${yTop}h${barW}v${h}h${-barW}Z`, class: k.cls }, svg);
      base += v;
    });
    // rótulos do eixo X espaçados, sempre com o último dia
    if (i % labelEvery === 0 || i === rows.length - 1) {
      if (i === rows.length - 1 || rows.length - 1 - i >= Math.max(2, labelEvery * 0.75)) {
        svgEl("text", { x: cx, y: H - 8, "text-anchor": "middle", class: "tick" }, svg).textContent = dayLabel(r.day);
      }
    }
    const hit = svgEl("rect", { x: padL + band * i, y: padT, width: band, height: plotH, class: "hit" }, svg);
    hit.addEventListener("pointermove", (e) => showTip(e, r, keys));
    hit.addEventListener("pointerleave", hideTip);
  });

  // rótulo só no maior valor
  if (labelMax) {
    const cx = padL + band * maxIdx + band / 2;
    svgEl("text", { x: cx, y: y(max) - 6, "text-anchor": "middle", class: "tick" }, svg).textContent = fmt(max);
  }
}

const tip = $("#tooltip");
function showTip(e, r, keys) {
  tip.innerHTML = "";
  const date = document.createElement("div");
  date.className = "tt-date";
  date.textContent = dayLong(r.day);
  tip.appendChild(date);
  keys.forEach((k) => {
    const row = document.createElement("div");
    row.className = "tt-row";
    const key = document.createElement("i");
    key.className = "tt-key";
    key.style.background = k.color;
    const val = document.createElement("b");
    val.textContent = fmt(r[k.key]);
    const name = document.createElement("span");
    name.textContent = k.name;
    row.append(key, val, name);
    tip.appendChild(row);
  });
  tip.hidden = false;
  const pad = 14;
  const w = tip.offsetWidth, h = tip.offsetHeight;
  let x = e.clientX + pad, yy = e.clientY - h - pad;
  if (x + w > window.innerWidth - 8) x = e.clientX - w - pad;
  if (yy < 8) yy = e.clientY + pad;
  tip.style.left = `${x}px`;
  tip.style.top = `${yy}px`;
}
function hideTip() { tip.hidden = true; }
window.addEventListener("scroll", hideTip, { passive: true });

function tableView(el, rows, cols) {
  const table = document.createElement("table");
  table.className = "table";
  const head = table.createTHead().insertRow();
  const th = (text, num) => { const c = document.createElement("th"); c.textContent = text; if (num) c.className = "num"; head.appendChild(c); };
  th("Dia");
  cols.forEach(([n]) => th(n, true));
  const body = table.createTBody();
  [...rows].reverse().forEach((r) => {
    const tr = body.insertRow();
    tr.insertCell().textContent = dayLong(r.day);
    cols.forEach(([, k]) => { const c = tr.insertCell(); c.className = "num"; c.textContent = fmt(r[k]); });
  });
  el.innerHTML = "";
  el.appendChild(table);
}

function barList(el, rows, emptyText) {
  el.innerHTML = "";
  const list = (rows || []).filter((r) => r.n > 0);
  if (!list.length) {
    const p = document.createElement("p");
    p.className = "none";
    p.textContent = emptyText;
    el.appendChild(p);
    return;
  }
  const total = list.reduce((a, r) => a + r.n, 0);
  const max = Math.max(...list.map((r) => r.n));
  list.forEach((r) => {
    const row = document.createElement("div");
    row.className = "bar-row";
    const topRow = document.createElement("div");
    topRow.className = "bar-top";
    const name = document.createElement("span");
    name.textContent = label(r.k);
    const val = document.createElement("b");
    val.textContent = `${fmt(r.n)} · ${pct((r.n / total) * 100)}`;
    topRow.append(name, val);
    const track = document.createElement("div");
    track.className = "bar-track";
    const fill = document.createElement("div");
    fill.className = "bar-fill";
    fill.style.width = `${(r.n / max) * 100}%`;
    track.appendChild(fill);
    row.append(topRow, track);
    el.appendChild(row);
  });
}

function reservasTable(el, rows) {
  el.innerHTML = "";
  if (!rows.length) {
    const tr = el.insertRow();
    const c = tr.insertCell();
    c.textContent = "Nenhuma reserva enviada no período.";
    c.className = "muted";
    return;
  }
  const head = el.createTHead().insertRow();
  ["Pedido em", "Carro", "Pacote", "Data do evento", "Ocasião", "Duração", "Cidade"].forEach((h) => {
    const th = document.createElement("th"); th.textContent = h; head.appendChild(th);
  });
  const body = el.createTBody();
  rows.forEach((r) => {
    const tr = body.insertRow();
    [when(r.ts), r.car, r.package, isoToBr(r.eventDate), r.occasion, r.hours ? `${r.hours} h` : "–", r.city || "–"]
      .forEach((v) => { tr.insertCell().textContent = v || "–"; });
  });
}

function chatList(el, rows) {
  el.innerHTML = "";
  if (!rows.length) {
    const li = document.createElement("li");
    li.className = "muted";
    li.textContent = "Ninguém usou o chat no período.";
    el.appendChild(li);
    return;
  }
  rows.forEach((r) => {
    const li = document.createElement("li");
    const q = document.createElement("span");
    q.textContent = r.q;
    const t = document.createElement("time");
    t.textContent = when(r.ts);
    li.append(q, t);
    el.appendChild(li);
  });
}

// redesenha os gráficos quando a tela muda de tamanho
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => lastData && render(lastData), 150);
});

$("#moreRes").addEventListener("click", () => { showAll.res = true; render(lastData); });
$("#moreChats").addEventListener("click", () => { showAll.chats = true; render(lastData); });

syncNoCount();
if (token) load(); else showLogin();
