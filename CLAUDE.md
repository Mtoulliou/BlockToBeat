# BlockToBeat : notes pour Claude Code

Ce fichier résume tout le travail fait avant le passage sur GitHub (ancien nom : Strudy). Lis-le en entier avant de toucher au code.

## Le projet

BlockToBeat rend le live coding [Strudel](https://strudel.cc) accessible avec des blocs qui s'emboîtent, façon Scratch. L'utilisateur compose avec des blocs, le vrai code Strudel s'écrit tout seul, et l'inverse marche aussi : on colle du code Strudel, il devient des blocs.

Auteur : Mattéo (Matteo) Toulliou, apprenti ingénieur chez Orange. Il écrit en français.

## Règles pour travailler avec Matteo

- Réponds en français, ton amical et motivant.
- Va droit au but : des consignes concrètes, pas une liste d'options équilibrées.
- **Jamais de tiret cadratin (—)** dans les textes rédigés pour lui (README, messages, UI).
- **Demande-lui avant d'ajouter une idée ou une fonctionnalité** qu'il n'a pas demandée. Tu peux proposer, pas implémenter sans accord.
- Il a déjà refusé : les noms d'app en français, une direction artistique néon, le mot « pistes » pour les lignes de la timeline.
- L'interface est en français.

## Hébergement

- GitHub Pages, déployé par GitHub Actions (`.github/workflows/pages.yml`) à chaque push sur `main` ou `dev` :
  - `main` (version publique) : https://mtoulliou.github.io/BlockToBeat/
  - `dev` (version de test) : https://mtoulliou.github.io/BlockToBeat/dev/ (s'installe comme une app à part, « BlockToBeat (dev) »)
- Dev et main partagent le même site : `sw.js` sépare les caches par dossier, et la clé `localStorage` du projet prend le suffixe `-dev` sous `/dev/`. Ne casse pas cette séparation.
- C'est une PWA : `manifest.webmanifest`, `sw.js` (cache), icônes à la racine (pas de dossier `icons/`, Matteo ne pouvait pas importer de dossier depuis le web).
- **À chaque modif de `index.html`, incrémente `VERSION` dans `sw.js`** (`blocktobeat-v1` → `blocktobeat-v2`…), sinon les téléphones gardent l'ancienne version en cache.
- Pas de build : tout est dans un seul fichier `index.html` (HTML + CSS + JS, aucune dépendance sauf Google Fonts).
- Licence prévue : AGPL (comme Strudel).

## Mode de travail Git (obligatoire)

1. **Ne jamais commiter directement sur `main`.** Seul Matteo fusionne dans `main`, depuis GitHub, après avoir testé la version dev.
2. Tout part de la branche `dev`. Pour chaque issue GitHub, crée une branche depuis `dev` à jour : `fix/<numéro>-<mot-clé>` (bug) ou `feat/<numéro>-<mot-clé>` (fonctionnalité demandée). Hors issue : `chore/<mot-clé>`.
3. Une issue = une branche = des commits ciblés. Le message de commit cite l'issue (`Corrige #4 : ...`).
4. Teste (Playwright, voir « Tests »), incrémente `VERSION` dans `sw.js` si `index.html` change, puis fusionne la branche dans `dev` (`git merge --no-ff`) et pousse `dev`. La Pages dev se met à jour toute seule.
5. Quand un lot de corrections est prêt, ouvre (ou mets à jour) **une pull request `dev` → `main`** qui liste les issues avec `Closes #N`, pour que Matteo la teste sur la version dev puis la fusionne lui-même.
6. Ne ferme pas les issues à la main : elles se ferment quand Matteo fusionne la PR dans `main`.
7. Si une issue est floue, fais au plus simple et raisonnable, puis signale-le dans le compte rendu et dans la PR plutôt que d'inventer une fonctionnalité.

## Architecture de `index.html`

Un seul fichier d'environ 4 000 lignes. Repères (cherche le nom de la fonction) :

### Modèle de données
- `P = {bpm, stacks, mode:'loop'|'song', lanes:[[{s:stackId|null, n}]]}`, sauvegardé dans `localStorage` (clé `blocktobeat-poc-1`).
- Un *stack* = un groupe (bloc titre rose) qui contient des blocs.
- Bloc **Son** (`s`, orange) : `steps`, lignes alternatives `alt` optionnelles.
- Bloc **Mélo** (`n`, violet) : `lines` dont chaque case vaut `'~'` (silence), `'_'` (note tenue), un degré de gamme, ou un accord `'0,2,4'`. Racine + gamme réglées par la heatmap grave→aigu.
- Effets attachés à un bloc (vert) : `{v}`, `{sig}`, `{seq}`, `{pat}` par pas, plus jux, late, roomsize. Repliables (`fxFold`). `muted` par bloc.

### Moteur audio (Web Audio, pas le vrai moteur Strudel)
- `scheduleRange` : planificateur à anticipation (lookahead), gère les notes tenues, jux, late.
- `blockOut` / `buildChain` : chaînes d'effets mises en cache (`ctx._outs`).
- `VOICE` : synthèse de chaque instrument (24 au total). KS = Karplus-Strong (guitares, basses, harpe), piano (PeriodicWave + filtre), rhodes (FM), orgue (tirettes), mallet (marimba), cordes frottées / flûte / cuivres / sax / chœur (formants), supersaw 7 voix, 808 avec chute de pitch.
- Percussions lisibles en onomatopées colorées : Boum (bd), Tchak (sd), Clap (cp), Tss (hh), Pshh (oh), Tok (rim), Toum (lt), Crash (cr).
- `renderWav` / `exportWav` : rendu hors ligne **par tranches de ~8 s** (un OfflineAudioContext par tranche, sinon c'est très lent), puis .wav. Dans l'artifact Claude, le .wav était emballé dans un .zip (`zipOne`) car l'extension .wav n'était pas autorisée ; sur GitHub Pages un téléchargement direct suffit.

### Import de code Strudel
- `parseStrudel` → `expandExpr` → `sectionFromExpr` → `exprToBlocks` → `applyMethods`.
- Gère : `const`, fonctions fléchées, `stack`, `arrange` (plusieurs arrange = plusieurs lignes de timeline), `chord()` + voicing, `arp`, `add`, `struct`, `setcps` avec expressions, mini-notation `< >`, `*`, `_`, `@`, jusqu'à 32 pas.
- Objectif : 0 bloc « code brut » et aller-retour identique (code → blocs → code).

### Interface
- Plan de travail infini (pan + zoom), commandes en « îles » flottantes.
- Menu du bas sur 2 lignes (onglets Sons / Notes / Blocs). Onglet Notes : choix de l'instrument + pads façon REC + mode accords.
- REC : simple bouton, le menu du bas devient le pad. Attend la première note, nouvelle ligne à chaque boucle, métronome, appui long = note tenue. Une note suivie par doigt ou touche (`recHolds`), notes simultanées sur un même pas = accord, la boucle ne rejoue pas une note qu'on vient d'entendre en direct (`rec.fresh`), et le son pendant la prise est celui de la relecture.
- Gestes : appui long = solo, double tap = muet, étirer une note pour l'allonger.
- Mode Morceau : timeline multi-lignes (`songLanes`, `songAt`).
- Les groupes ne se chevauchent jamais (`resolveOverlaps`) et se déplacent en entier.
- Mascotte (vague avec des yeux fixés dessus) qui danse au rythme, roulade rare (~10 % des mesures, jamais deux fois de suite).
- Au lancement : une des 10 démos (`DEMOS`, `loadDemo`) au hasard, lecture automatique (`autoStart`, déverrouillage audio au premier geste si le navigateur bloque).

## Tests

Avant, les tests tournaient avec Playwright (Chromium headless) : import des morceaux de test, vérification 0 bloc brut + aller-retour identique, rendu WAV, analyse de hauteur des instruments. Si tu en recrées, mets-les dans `tests/` et ne casse pas la page.

## Points pas encore vérifiés

- Ressenti sur un vrai téléphone : latence des pads, déverrouillage de l'autoplay (surtout iOS), qualité du son.

## Idées proposées mais pas validées (demander avant)

- Disposition en grille des groupes après un import.
- Bouton « autre démo ».