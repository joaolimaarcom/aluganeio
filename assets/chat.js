// ============================================================
// Aluganeio — chat flutuante
// Conversa com o Gemini por um Worker da Cloudflare (pasta worker/).
// A chave do Gemini fica só no Worker, nunca aqui no site.
// Enquanto CHAT_ENDPOINT estiver vazio (ou o Worker falhar), o chat
// responde com as perguntas frequentes da própria página.
// ============================================================

// Depois de publicar o Worker, cole aqui a URL dele
// (ex.: "https://aluganeio-chat.SEU-USUARIO.workers.dev")
const CHAT_ENDPOINT = "https://aluganeio.jlrodrigues6900.workers.dev/";

(() => {
  const $ = (sel) => document.querySelector(sel);
  const panel = $("#chatPanel");
  const toggle = $("#chatToggle");
  const closeBtn = $("#chatClose");
  const log = $("#chatLog");
  const chips = $("#chatChips");
  const chatForm = $("#chatForm");
  const input = $("#chatInput");
  const sendBtn = chatForm.querySelector("button");
  const status = $("#chatStatus");
  const dock = $("#dock");

  const MAX_HISTORY = 12;
  const history = []; // { role: "user" | "assistant", content }
  let busy = false;
  let greeted = false;

  // Perguntas frequentes da página viram base de respostas e atalhos
  const faq = [...document.querySelectorAll("#duvidas details")].map((d) => ({
    q: d.querySelector("summary").textContent.trim(),
    a: d.querySelector("p").textContent.trim(),
  }));

  const addMsg = (role, text) => {
    const el = document.createElement("div");
    el.className = `msg ${role === "user" ? "msg-user" : "msg-bot"}`;
    el.textContent = text;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  };

  const addTyping = () => {
    const el = document.createElement("div");
    el.className = "msg msg-bot";
    el.setAttribute("aria-label", "Digitando");
    el.innerHTML = '<span class="msg-typing"><i></i><i></i><i></i></span>';
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  };

  const renderChips = () => {
    chips.innerHTML = "";
    const questions = ["Quais pacotes vocês têm?", ...faq.slice(0, 4).map((f) => f.q)];
    questions.forEach((q) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = q;
      b.addEventListener("click", () => send(q));
      chips.appendChild(b);
    });
  };

  // Resposta local: pergunta frequente com mais palavras em comum
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const words = (s) => norm(s).match(/[a-z0-9]{4,}/g) || [];
  const localAnswer = (text) => {
    if (/pacote|preco|valor|quanto custa|orcamento/.test(norm(text))) {
      return "Temos três pacotes: Chegada da Noiva (até 2 h), Dia do Casamento (até 6 h) e Ensaio e Produção (até 3 h). Todos valem para a Veraneio, a Boca de Sapo ou os dois juntos. O valor depende da data e do local, então passamos o orçamento pelo WhatsApp.";
    }
    const asked = new Set(words(text));
    let best = null, bestScore = 0;
    faq.forEach((f) => {
      const score = words(f.q).filter((w) => asked.has(w)).length * 2
        + words(f.a).filter((w) => asked.has(w)).length;
      if (score > bestScore) { best = f; bestScore = score; }
    });
    if (best && bestScore >= 2) return best.a;
    return "Essa eu prefiro confirmar com a equipe. Toque em \"Chame no WhatsApp\" aqui embaixo que a gente responde rapidinho.";
  };

  const askServer = async () => {
    const res = await fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history.slice(-MAX_HISTORY) }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.reply) throw new Error("Resposta vazia");
    return data.reply;
  };

  async function send(text) {
    text = text.trim();
    if (!text || busy) return;
    busy = true;
    sendBtn.disabled = true;
    chips.innerHTML = "";
    addMsg("user", text);
    history.push({ role: "user", content: text.slice(0, 500) });
    input.value = "";

    const typing = addTyping();
    let reply;
    try {
      reply = CHAT_ENDPOINT ? await askServer() : localAnswer(text);
      if (!CHAT_ENDPOINT) await new Promise((r) => setTimeout(r, 450));
    } catch (e) {
      reply = localAnswer(text);
    }
    typing.remove();
    addMsg("bot", reply);
    history.push({ role: "assistant", content: reply });
    if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);

    busy = false;
    sendBtn.disabled = false;
    input.focus();
  }

  const open = () => {
    panel.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    dock.classList.remove("is-hidden");
    if (!greeted) {
      greeted = true;
      addMsg("bot", "Oi! Sou o assistente da Aluganeio. Posso te ajudar a escolher entre a Veraneio e a Boca de Sapo, explicar os pacotes ou tirar dúvidas sobre a reserva. O que você quer saber?");
      renderChips();
    }
    input.focus();
  };
  const close = () => {
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    toggle.focus();
  };

  status.textContent = CHAT_ENDPOINT ? "Responde na hora" : "Respostas rápidas";
  toggle.addEventListener("click", () => (panel.hidden ? open() : close()));
  closeBtn.addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) close(); });
  chatForm.addEventListener("submit", (e) => { e.preventDefault(); send(input.value); });
})();
