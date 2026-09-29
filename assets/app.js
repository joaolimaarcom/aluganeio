// ============================================================
// Aluganeio — configuração e interações
// ============================================================

// WhatsApp com DDI + DDD, só dígitos
const WHATSAPP = "5534997729702";
const WHATSAPP_LABEL = "(34) 99772-9702";
const waLink = (text) => `https://wa.me/${WHATSAPP}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

const $ = (sel) => document.querySelector(sel);

// Contagem de acessos para o painel (painel.html).
// Sem cookies e sem dados pessoais: só tipo do evento, origem e aparelho.
const API_URL = "https://aluganeio.jlrodrigues6900.workers.dev/";
function track(type, extra) {
  if (location.protocol !== "https:") return; // não conta testes locais
  try { if (localStorage.getItem("aluganeio:nao-contar")) return; } catch (e) { /* sem storage: conta normal */ }
  const w = window.innerWidth;
  const body = JSON.stringify({
    t: type,
    p: location.pathname,
    r: document.referrer,
    u: new URLSearchParams(location.search).get("utm_source") || "",
    d: w < 768 ? "celular" : w < 1100 && matchMedia("(pointer: coarse)").matches ? "tablet" : "computador",
    x: extra,
  });
  const blob = new Blob([body], { type: "text/plain" });
  if (!(navigator.sendBeacon && navigator.sendBeacon(`${API_URL}e`, blob))) {
    fetch(`${API_URL}e`, { method: "POST", body, keepalive: true, headers: { "Content-Type": "text/plain" } }).catch(() => {});
  }
}
track("pageview");

// Cliques nos links de WhatsApp (botão flutuante, rodapé, chat)
document.addEventListener("click", (e) => {
  const a = e.target.closest && e.target.closest('a[href^="https://wa.me"]');
  if (!a) return;
  const where = { dockWa: "botao-flutuante", footerPhone: "rodape", chatWa: "chat" }[a.id] || "outro";
  track("whatsapp", { where });
});

// Título do hero alterna entre os dois carros
(() => {
  const el = $("#heroSwap");
  if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const names = ["Veraneio", "Boca de Sapo"];
  let i = 0;
  setInterval(() => {
    el.classList.add("out");
    setTimeout(() => {
      i = (i + 1) % names.length;
      el.textContent = names[i];
      el.classList.remove("out");
    }, 350);
  }, 3200);
})();

// Formulário -> resumo ao vivo + mensagem no WhatsApp
const form = $("#reserveForm");
const hours = $("#fHours");
const date = $("#fDate");
const pkg = $("#fPkg");
const occ = $("#fOcc");

const hoursLabel = (h) => `${h} ${Number(h) === 1 ? "hora" : "horas"}`;
const formatDate = (iso) => {
  if (!iso) return "a escolher";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

// Data mínima: hoje (no fuso de quem está usando, não em UTC)
const today = new Date();
date.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

function updateTicket() {
  $("#tkCar").textContent = form.car.value;
  $("#tkPkg").textContent = pkg.value;
  $("#tkDate").textContent = formatDate(date.value);
  $("#tkOcc").textContent = occ.value;
  $("#tkHours").textContent = hoursLabel(hours.value);
  $("#fHoursOut").textContent = hoursLabel(hours.value);
}
form.addEventListener("input", updateTicket);
form.addEventListener("change", updateTicket);
updateTicket();

// Botões "Reservar" dos cards já selecionam o carro
document.querySelectorAll("[data-pick]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const radio = document.querySelector(`input[name="car"][value="${btn.dataset.pick}"]`);
    if (radio) { radio.checked = true; updateTicket(); }
  });
});

// Botões "Quero este pacote" preenchem pacote, ocasião e duração
document.querySelectorAll("[data-package]").forEach((btn) => {
  btn.addEventListener("click", () => {
    pkg.value = btn.dataset.package;
    if (btn.dataset.occ) occ.value = btn.dataset.occ;
    if (btn.dataset.hours) hours.value = btn.dataset.hours;
    updateTicket();
  });
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const err = $("#formError");
  const name = $("#fName").value.trim();
  if (!date.value || !name) {
    err.textContent = !date.value ? "Escolha a data do evento." : "Diga seu nome para a gente te chamar.";
    err.hidden = false;
    (!date.value ? date : $("#fName")).focus();
    return;
  }
  err.hidden = true;

  const lines = [
    `Olá! Meu nome é ${name} e quero reservar na Aluganeio.`,
    "",
    `Carro: ${form.car.value}`,
    `Pacote: ${pkg.value}`,
    `Data: ${formatDate(date.value)}`,
    `Ocasião: ${occ.value}`,
    `Duração: ${hoursLabel(hours.value)}`,
  ];
  const city = $("#fCity").value.trim();
  const notes = $("#fNotes").value.trim();
  if (city) lines.push(`Cidade: ${city}`);
  if (notes) lines.push("", `Detalhes: ${notes}`);

  track("reserva", {
    car: form.car.value, package: pkg.value, occasion: occ.value,
    eventDate: date.value, hours: hours.value, city,
  });
  window.open(waLink(lines.join("\n")), "_blank", "noopener");
});

// Links de WhatsApp da página usam o número da configuração
const footerPhone = $("#footerPhone");
footerPhone.textContent = WHATSAPP_LABEL;
footerPhone.href = waLink();
$("#dockWa").href = waLink("Olá! Vim pelo site da Aluganeio e queria saber mais.");
$("#chatWa").href = waLink("Olá! Vim pelo chat do site da Aluganeio.");
$("#year").textContent = new Date().getFullYear();

// Fundo desfoca ao rolar; botões flutuantes aparecem depois do topo
(() => {
  const root = document.documentElement;
  const dock = $("#dock");
  const chatPanel = $("#chatPanel");
  let ticking = false;
  const update = () => {
    const o = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.6)));
    root.style.setProperty("--blur-o", o.toFixed(3));
    const pastHero = window.scrollY > window.innerHeight * 0.5;
    dock.classList.toggle("is-hidden", !pastHero && chatPanel.hidden);
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener("resize", update);
  update();
})();

// Galeria: foto em tela cheia com setas, teclado e arrastar no celular
(() => {
  const items = [...document.querySelectorAll(".g-item")];
  const lb = $("#lightbox");
  if (!items.length || !lb || typeof lb.showModal !== "function") return;
  const img = $("#lbImg");
  const cap = $("#lbCap");
  const count = $("#lbCount");
  let current = 0;

  const show = (i) => {
    current = (i + items.length) % items.length;
    const item = items[current];
    const alt = item.querySelector("img").alt;
    img.classList.add("is-loading");
    img.onload = () => img.classList.remove("is-loading");
    img.src = item.dataset.full;
    img.alt = alt;
    cap.textContent = alt;
    count.textContent = `${current + 1} / ${items.length}`;
    // já baixa a próxima para a troca ser instantânea
    new Image().src = items[(current + 1) % items.length].dataset.full;
  };
  const open = (i) => {
    show(i);
    lb.showModal();
    document.documentElement.style.overflow = "hidden";
  };
  const close = () => lb.close();

  items.forEach((item, i) => item.addEventListener("click", () => open(i)));
  $("#lbPrev").addEventListener("click", () => show(current - 1));
  $("#lbNext").addEventListener("click", () => show(current + 1));
  $("#lbClose").addEventListener("click", close);
  lb.addEventListener("close", () => {
    document.documentElement.style.overflow = "";
    items[current].focus();
  });
  // clique fora da foto fecha
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
  lb.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
  });
  let startX = null;
  lb.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    startX = null;
  });
})();
