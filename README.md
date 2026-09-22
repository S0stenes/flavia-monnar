# Landing Page — Flávia Monnar

Astro + GSAP (ScrollTrigger, SplitText) + Lenis.

## Rodar
```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # gera /dist para publicar
```

## Onde editar
- `src/config.ts` — links (Instagram/contato/podcast) e textos dos serviços
- `src/pages/index.astro` — estrutura e textos das seções
- `src/styles/global.css` — paleta (variáveis no topo) e layout
- `src/scripts/main.ts` — todas as animações
- `public/video/hero.mp4` — vídeo do hero (sem cortes do "gire o celular", abrindo na Flávia)
- `public/video/film.mp4` — filme completo com som (modal "Assistir ao filme")
