# Aluganeio

Site de aluguel de carros clássicos: **Chevrolet Veraneio** e **Chevrolet 3100 Boca de Sapo**.

Site estático (HTML + CSS + JS puro), pronto para GitHub Pages. O chat usa o Gemini por meio de um Worker da Cloudflare (pasta `worker/`).

## Estrutura

```
index.html                 página única (hero, frota, ocasiões, pacotes, como funciona, reserva, dúvidas)
assets/style.css           identidade visual
assets/app.js              reserva via WhatsApp, botões flutuantes, efeito de desfoque (número do WhatsApp aqui)
assets/chat.js             chat flutuante (URL do Worker aqui, em CHAT_ENDPOINT)
assets/fotos/              fotos dos carros (galeria/ = fotos do casamento)
worker/worker.js           servidor do chat (arquivo único para colar na Cloudflare)
                           o bloco CONHECIMENTO é tudo o que o assistente sabe:
                           manter igual a Pacotes e Dúvidas do site
```

## Pendências

- [x] WhatsApp: (34) 99772-9702
- [x] Fotos da Veraneio, da Boca de Sapo e dos dois juntos
- [ ] Ano de cada carro e lotação da Veraneio
- [ ] Confirmar pacotes (duração, itens inclusos, preços ou "sob consulta")
- [ ] Confirmar respostas das Dúvidas (motorista, decoração, cidades, sinal, chuva)
- [x] Worker do chat publicado: https://aluganeio.jlrodrigues6900.workers.dev/
- [x] Chave do Gemini cadastrada no Worker (chat funcionando)
- [x] Galeria com 7 fotos de casamento (confirmar autorização dos noivos e crédito do fotógrafo)

## Chat com Gemini (tudo pelo navegador, sem instalar nada)

Sem o Worker publicado, o chat já funciona respondendo com as Dúvidas do próprio site.
Para ligar o Gemini:

1. Crie uma conta grátis em [dash.cloudflare.com](https://dash.cloudflare.com/sign-up).
2. No menu, vá em **Workers & Pages** → **Create** → **Create Worker** (modelo "Hello World").
   Dê o nome `aluganeio-chat` e clique em **Deploy**.
3. Clique em **Edit code**, apague o código de exemplo, cole todo o conteúdo de
   [`worker/worker.js`](worker/worker.js) e clique em **Deploy**.
4. Volte ao Worker → **Settings** → **Variables and Secrets** → **Add**:
   tipo **Secret**, nome `GEMINI_API_KEY`, valor = sua chave do Google AI Studio → **Deploy**.
5. Copie a URL do Worker (algo como `https://aluganeio-chat.SEU-USUARIO.workers.dev`)
   e cole em `CHAT_ENDPOINT` no `assets/chat.js` (ou mande para o Claude colocar).

Se o site for para um domínio próprio, adicione uma variável de texto `ALLOWED_ORIGINS`
no mesmo lugar do passo 4, com os endereços separados por vírgula
(ex.: `https://joaolimaarcom.github.io,https://aluganeio.com.br`).

Proteções: a chave nunca vai para o navegador; o Worker só aceita pedidos do site,
limita o tamanho das mensagens e o número de mensagens por pessoa.
Recomendado: definir um limite de gastos no Google Cloud para a chave do Gemini.

## Publicar no GitHub Pages

Settings → Pages → Source: *Deploy from a branch* → branch `main`, pasta `/ (root)`.
