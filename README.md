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
- [x] Fotos da Veraneio e da Boca de Sapo (trocar por fotos em alta resolução quando tiver)
- [ ] ano e lugares de cada carro (campos "a definir" no `index.html`)
- [x] Boca de Sapo = Chevrolet 3100
- [ ] Confirmar cidade de atuação e se o aluguel inclui motorista

## Publicar no GitHub Pages

Settings → Pages → Source: *Deploy from a branch* → branch `main`, pasta `/ (root)`.
