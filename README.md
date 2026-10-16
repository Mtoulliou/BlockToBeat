# Strudy

Compose de la musique en emboîtant des blocs, façon Scratch : le vrai code [Strudel](https://strudel.cc) s'écrit tout seul, et un code Strudel collé devient des blocs.

**Essayer :** https://mtoulliou.github.io/BlockToBeat/ (version de test : https://mtoulliou.github.io/BlockToBeat/dev/)

## Contenu

| Fichier | Rôle |
| --- | --- |
| `index.html` | Le Lab : interface, moteur audio, import et export de code |
| `library.js`, `library.css` | La Library : projets enregistrés sur l'appareil |
| `manifest.webmanifest` | Nom, icône et couleurs pour l'installer comme une app |
| `sw.js` | Cache pour l'ouvrir sans réseau |
| `icon*.png`, `icon.svg` | Icônes de l'app |
| `tests/` | Les tests (`npm test`) |

## Pour l'équipe

Tout le contexte du projet et les règles de travail sont dans [`CONTEXTE.md`](CONTEXTE.md). Les tests : `npm install`, `npx playwright install chromium firefox`, puis `npm test`. Le site se met à jour tout seul à chaque push sur `main` (et sur `dev` pour la version de test).

Le dépôt et l'adresse du site gardent l'ancien nom, BlockToBeat.
