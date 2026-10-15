# BlockToBeat (POC web)

Compose de la musique en emboîtant des blocs : le vrai code [Strudel](https://strudel.cc) s'écrit tout seul.

**Essayer :** https://TON-PSEUDO.github.io/blocktobeat/

## Contenu

| Fichier | Rôle |
| --- | --- |
| `index.html` | Toute l'app (interface, moteur audio, import/export de code) |
| `manifest.webmanifest` | Nom, icône et couleurs pour l'installer comme une app |
| `sw.js` | Cache pour l'ouvrir sans réseau |
| `icon*.png`, `icon.svg` | Icônes de l app |

## Mettre à jour

1. Remplace `index.html` par la nouvelle version.
2. Dans `sw.js`, passe `VERSION` à la valeur suivante (`blocktobeat-v2`, `blocktobeat-v3`…).
3. Commit et push : GitHub Pages republie en une minute environ.
