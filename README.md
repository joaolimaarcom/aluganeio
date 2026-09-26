# Aluganeio

Site de aluguel de carros clássicos: **Chevrolet Veraneio** e **Chevrolet 3100 Boca de Sapo**.

Site estático (HTML + CSS + JS puro), pronto para GitHub Pages. O chat usa o Gemini por meio de um Worker da Cloudflare (pasta `worker/`).

## Estrutura

```
index.html                 página única (hero, frota, ocasiões, pacotes, como funciona, reserva, dúvidas)
assets/style.css           identidade visual
assets/app.js              reserva via WhatsApp, botões flutuantes, efeito de desfoque (número do WhatsApp aqui)
assets/chat.js             chat flutuante (URL do Worker aqui, em CHAT_ENDPOINT)
assets/fotos/              fotos dos carros
worker/                    servidor do chat (guarda a chave do Gemini)
worker/src/conhecimento.js tudo o que o assistente sabe (manter igual a Pacotes e Dúvidas do site)
```

## Pendências

- [x] WhatsApp: (34) 99772-9702
- [x] Fotos da Veraneio, da Boca de Sapo e dos dois juntos
- [ ] Ano de cada carro e lotação da Veraneio
- [ ] Confirmar pacotes (duração, itens inclusos, preços ou "sob consulta")
- [ ] Confirmar respostas das Dúvidas (motorista, decoração, cidades, sinal, chuva)
- [ ] Publicar o Worker do chat e colar a URL em `assets/chat.js`
- [ ] Álbuns de fotos para a galeria

## Chat com Gemini

Sem o Worker publicado, o chat já funciona respondendo com as Dúvidas do próprio site.
Para ligar o Gemini:

1. Crie uma conta grátis na [Cloudflare](https://dash.cloudflare.com/sign-up).
2. No terminal, dentro da pasta `worker/`:
   ```bash
   npm install
   npx wrangler login
   npx wrangler secret put GEMINI_API_KEY   # cole a chave do Google AI Studio
   npx wrangler deploy
   ```
3. O deploy mostra uma URL tipo `https://aluganeio-chat.SEU-USUARIO.workers.dev`. Cole em `CHAT_ENDPOINT` no `assets/chat.js`.
4. Se o site ficar em outro endereço (domínio próprio), adicione em `ALLOWED_ORIGINS` no `worker/wrangler.toml` e rode `npx wrangler deploy` de novo.

Proteções: a chave nunca vai para o navegador; o Worker só aceita pedidos do site, limita tamanho das mensagens e o número de mensagens por pessoa.
Recomendado: definir um limite de gastos no Google Cloud para a chave do Gemini.

## Publicar no GitHub Pages

Settings → Pages → Source: *Deploy from a branch* → branch `main`, pasta `/ (root)`.
