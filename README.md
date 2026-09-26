# Aluganeio

Site de aluguel de carros clássicos: **Chevrolet Veraneio** e **Boca de Sapo**.

Site estático (HTML + CSS + JS puro), pronto para GitHub Pages.

## Estrutura

```
index.html          página única (hero, frota, ocasiões, como funciona, reserva)
assets/style.css    identidade visual (cores, tipografia, layout)
assets/app.js       interações e configuração (número do WhatsApp)
assets/fotos/       fotos dos carros
```

## Pendências para completar

- [ ] Número do WhatsApp em `assets/app.js` (`WHATSAPP` e `WHATSAPP_LABEL`)
- [ ] Fotos: `assets/fotos/veraneio.jpg` e `assets/fotos/boca-de-sapo.jpg` (4:3, mín. 1600px de largura)
- [ ] Ano, cor e lugares de cada carro (campos "a definir" no `index.html`)
- [ ] Confirmar o modelo do Boca de Sapo, cidade de atuação e se o aluguel inclui motorista

## Publicar no GitHub Pages

Settings → Pages → Source: *Deploy from a branch* → branch `main`, pasta `/ (root)`.
