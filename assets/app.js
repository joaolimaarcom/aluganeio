// ============================================================
// Aluganeio — configuração e interações
// ============================================================

// TROCAR: número de WhatsApp com DDI + DDD, só dígitos (ex.: 5511987654321)
const WHATSAPP = "5500000000000";
const WHATSAPP_LABEL = "(00) 00000-0000";

const $ = (sel) => document.querySelector(sel);

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

// Botões "Reservar" dos cards já selecionam o carro
document.querySelectorAll("[data-pick]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const radio = document.querySelector(`input[name="car"][value="${btn.dataset.pick}"]`);
    if (radio) { radio.checked = true; updateTicket(); }
  });
});

// Formulário -> resumo ao vivo + mensagem no WhatsApp
const form = $("#reserveForm");
const hours = $("#fHours");
const date = $("#fDate");

const hoursLabel = (h) => `${h} ${Number(h) === 1 ? "hora" : "horas"}`;
const formatDate = (iso) => {
  if (!iso) return "a escolher";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

// Data mínima: hoje
date.min = new Date().toISOString().slice(0, 10);

function updateTicket() {
  const car = form.car.value;
  $("#tkCar").textContent = car;
  $("#tkDate").textContent = formatDate(date.value);
  $("#tkOcc").textContent = $("#fOcc").value;
  $("#tkHours").textContent = hoursLabel(hours.value);
  $("#fHoursOut").textContent = hoursLabel(hours.value);
}
form.addEventListener("input", updateTicket);
form.addEventListener("change", updateTicket);
updateTicket();

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
    `Olá! Meu nome é ${name} e quero reservar um carro na Aluganeio.`,
    "",
    `Carro: ${form.car.value}`,
    `Data: ${formatDate(date.value)}`,
    `Ocasião: ${$("#fOcc").value}`,
    `Duração: ${hoursLabel(hours.value)}`,
  ];
  const city = $("#fCity").value.trim();
  const notes = $("#fNotes").value.trim();
  if (city) lines.push(`Cidade: ${city}`);
  if (notes) lines.push("", `Detalhes: ${notes}`);

  const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join("\n"))}`;
  window.open(url, "_blank", "noopener");
});

$("#footerPhone").textContent = WHATSAPP_LABEL;
$("#year").textContent = new Date().getFullYear();

// Fundo: foto nítida no topo, desfoca conforme rola a página
(() => {
  const root = document.documentElement;
  let ticking = false;
  const update = () => {
    const o = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.6)));
    root.style.setProperty("--blur-o", o.toFixed(3));
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener("resize", update);
  update();
})();
