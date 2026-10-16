# BlockToBeat : contexte du projet et règles de travail

Ce fichier est **la référence commune de toute l'équipe** (humains et assistants Claude Code). `CLAUDE.md` l'importe : il est chargé à chaque session. Lis-le en entier avant de toucher au code. Quand une règle ou l'architecture change, mets ce fichier à jour dans la même branche que le changement.

---

## 1. Le projet

BlockToBeat rend le live coding musical accessible avec des blocs qui s'emboîtent, façon Scratch. On compose avec des blocs, le vrai code [Strudel](https://strudel.cc) s'écrit tout seul, et l'inverse marche aussi : on colle du code Strudel, il devient des blocs.

- Ancien nom : Strudy.
- Version publique : https://mtoulliou.github.io/BlockToBeat/
- Version de test (branche `dev`) : https://mtoulliou.github.io/BlockToBeat/dev/
- Dépôt : https://github.com/Mtoulliou/BlockToBeat
- Licence prévue : AGPL (comme Strudel). Voir #31 : la question d'un autre langage musical sans cette licence est ouverte.

## 2. L'équipe et les zones

| Qui | GitHub | Zones |
|---|---|---|
| Mattéo (Matteo) Toulliou, propriétaire du dépôt | `Mtoulliou` | Décide de tout, teste la version dev, **seul à fusionner dans `main`**. Son Claude : **Lab** (blocs, moteur audio, REC, import Strudel), **Library** (#20). |
| Jules | `Addon-cmd` | Son Claude : **Learning**, **Profile**, **Workshop**, et des ajustements ponctuels du Lab. |

L'app a 4 onglets dans la barre du bas : **Learning**, **Lab** (le plan de travail, la page historique), **Library**, **Profile**. Learning, Library et Profile affichent pour l'instant une page « En travaux ». Le Workshop sera accessible depuis la Library.

Toucher la zone de l'autre est permis pour un ajustement, mais **annonce-le d'abord dans l'issue concernée** (voir 5.4).

## 3. Règles de collaboration

- Tout le monde écrit en **français**, ton amical et motivant. L'interface de l'app est en français. Seuls les noms des 4 onglets sont en anglais (choix de Matteo).
- Va droit au but : des consignes concrètes, une recommandation plutôt qu'une liste d'options équilibrées.
- **Jamais de tiret cadratin (—)** dans les textes rédigés : README, messages, interface, issues, PR, commits.
- **Pas de fonctionnalité qui n'est pas demandée.** Tu peux proposer (dans l'issue ou à ton humain), pas implémenter sans accord de Matteo.
- Refusé par Matteo, ne pas reproposer : noms d'app en français, direction artistique néon, le mot « pistes » pour les lignes de la timeline, le message « Ton dernier projet est à un ↶ près » au lancement (#30).
- Les préférences personnelles de chacun (ton, niveau de détail…) vont dans `CLAUDE.local.md`, qui n'est pas versionné. Ce fichier-ci ne contient que ce qui vaut pour toute l'équipe.

## 4. Hébergement et déploiement

- **Pas de build.** L'app est un site statique : `index.html` (HTML + CSS + JS, aucune dépendance sauf Google Fonts), `sw.js`, `manifest.webmanifest`, icônes à la racine (pas de dossier `icons/`).
- **GitHub Pages par GitHub Actions** (`.github/workflows/pages.yml`) : à chaque push sur `main` ou `dev`, le workflow publie `main` à la racine et `dev` sous `/dev/`. Les déploiements passent chacun leur tour (`cancel-in-progress: false`) : deux déploiements du même commit qui s'annulent faisaient échouer la mise en ligne.
- Le workflow renomme l'app dev « BlockToBeat (dev) » dans son manifeste : elle s'installe comme une app à part.
- **Service worker** (`sw.js`) : un cache par dossier (`VERSION@chemin`). La version principale ignore les requêtes vers `dev/`. La page est toujours redemandée au serveur (`cache: 'no-cache'`), sinon GitHub Pages la garde 10 minutes en cache et les mises à jour n'arrivent pas.
- **`VERSION` est remplacée automatiquement au déploiement** par le numéro du commit. Ne l'incrémente jamais à la main.
- Dev et main partagent la même origine, donc le même `localStorage`. La clé du projet prend le suffixe `-dev` sous `/dev/` : tester en dev n'écrase pas le projet de la version publique. Toute nouvelle clé de stockage doit suivre la même règle (voir `KEY` dans `index.html`).
- Si tu ajoutes un fichier servi par l'app (par exemple `learning.js`), ajoute-le à `SHELL` dans `sw.js` pour qu'il marche hors ligne.

## 5. Mode de travail Git (obligatoire)

### 5.1 Les branches
- `main` : la version publique. **Personne ne commite dessus.** Seul Matteo fusionne, depuis GitHub, après avoir testé sur la version dev.
- `dev` : la branche de test en ligne. On y fusionne les branches de travail pour les essayer sur https://mtoulliou.github.io/BlockToBeat/dev/. Elle peut contenir du travail en cours : **on n'ouvre jamais de PR depuis `dev`**.
- Branches de travail, toujours créées depuis `origin/main` à jour (`git fetch` d'abord) :
  - `fix/<numéro>-<mot-clé>` pour un bug, `feat/<numéro>-<mot-clé>` pour une fonctionnalité, `chore/<mot-clé>` ou `docs/<mot-clé>` hors issue ;
  - `lot/<numéros>` pour regrouper plusieurs petites issues dans une seule PR (exemple : `lot/30-33`) ;
  - un gros chantier vit dans une branche longue `feat/<numéro>-<mot-clé>` (exemple : `feat/20-bibliotheque`).

### 5.2 Le cycle d'une issue
1. **Avant de commencer**, vérifie que l'issue n'est assignée à personne, puis prends-la : `gh issue edit <N> --add-assignee @me`. Si elle est floue, pose la question dans l'issue ou à ton humain avant de coder.
2. `git fetch && git checkout -b fix/<N>-<mot-clé> origin/main` (ou depuis la branche de lot ou du chantier concerné).
3. Des commits ciblés. Le message cite l'issue : `Corrige #<N> : <ce qui change>`, avec en corps le pourquoi en quelques lignes.
4. **Teste** (voir section 8), y compris les tests existants qui touchent ce que tu as modifié.
5. Fusionne dans la branche de lot ou de chantier si besoin, puis dans `dev` : `git checkout dev && git pull --no-rebase && git merge --no-ff <branche>`, puis `git push`. Vérifie que le déploiement passe (`gh run list --limit 1`).
6. Ouvre la PR vers `main` depuis la branche de travail, de lot ou de chantier (pas depuis `dev`). Pour un chantier long, ouvre-la tôt en brouillon (`gh pr create --draft`) et mets sa description à jour au fil du travail.
7. Pousse aussi les branches de travail : elles servent de trace.

### 5.3 Pull requests et issues
- La description de PR dit : où tester (l'URL dev), ce qui change pour l'utilisateur, comment ça a été testé, ce qui reste ou ce qui n'a pas pu être vérifié, et une ligne `Closes #N` par issue.
- **Ne ferme jamais une issue à la main** : elle se ferme quand Matteo fusionne la PR dans `main`.
- Quand une issue est traitée, laisse un commentaire court : ce qui a été fait, où le tester.
- Un travail fait sans issue (demandé en direct) : crée une issue qui le décrit et relie-la à la PR, pour garder la trace.
- Étiquettes de zone : `zone:lab`, `zone:learning`, `zone:profile`, `zone:library`, `zone:workshop`. Mets la bonne sur chaque issue que tu crées ou prends.

### 5.4 Travailler à deux sur le même code
Tout le Lab tient dans un seul `index.html` d'environ 4 000 lignes : c'est la principale source de conflits.
- **Les nouvelles pages vont dans leurs propres fichiers** (`learning.js`, `profile.js`, `workshop.js`, et leur CSS si besoin), chargés par `index.html`. Dans `index.html`, on ne touche que le point d'accroche de la page (`<section id="pg-learning">`…) et la balise `<script>`.
- Zones partagées, à modifier seulement après l'avoir annoncé dans l'issue : les variables de couleur `:root`, la barre `#nav` et son gestionnaire, le démarrage (`Boot`), `sw.js`, le workflow, ce fichier.
- Pas de reformatage ni de renommage massif : on garde les diffs petits.
- `git pull` souvent sur `dev`. En cas de conflit, résous-le en gardant les deux intentions, puis reteste. **Jamais de `push --force`** sur `main`, `dev` ou une branche de l'autre.
- Après chaque fusion de Matteo dans `main`, remets `dev` à niveau : `git checkout dev && git pull --no-rebase && git merge origin/main && git push`.

## 6. Architecture de `index.html`

Tout le JavaScript du Lab est dans une fonction anonyme `(function(){ ... })();` : ses variables et fonctions **ne sont pas accessibles** depuis un autre fichier. Si une page a besoin de l'état du Lab (projet, lecture…), il faut exposer un petit objet `window.BTB` choisi avec Matteo. Ne le fais pas sans l'annoncer.

Repères (cherche le nom dans le fichier).

### Modèle de données
- `P = {bpm, stacks, mode:'loop'|'song', lanes:[[{s:stackId|null, n}]]}`, sauvegardé dans `localStorage` (clé `KEY` : `blocktobeat-poc-1`, `-dev` en dev).
- Un *stack* = un groupe (titre rose) qui contient des blocs.
- Bloc **Son** (`type:'s'`, orange) : `steps`, lignes alternatives `alt` optionnelles. `sLines(b)` donne toutes les lignes, `blockLines(b)` et `setBlockLines(b, L)` marchent pour les deux types.
- Bloc **Mélo** (`type:'n'`, violet) : `lines`. Chaque case vaut `'~'` (silence), `'_'` (la note d'avant continue), un degré de la gamme ou un accord `'0,2,4'`. `root` + `scale` + `synth`.
- Effets d'un bloc (vert) : `fx:[{type, v}]`, avec `sig`, `seq` ou `pat` pour les valeurs qui bougent. Repliables (`fxFold`). `muted` par bloc et par groupe.
- Sauvegarde : `persist()`. `persist(true)` est une sauvegarde automatique, ignorée tant que la démo du lancement n'a pas été modifiée (`demoFresh`) : le projet précédent reste récupérable avec ↶.
- Annuler / rétablir : `mutate(fn)` enregistre l'état avant chaque modification. Passe toujours par `mutate` pour modifier `P`.

### Notes, accords, notes tenues
- Une note tenue est **une seule note** : `noteHead`, `noteSpan`, `delStep` (supprime toute la note), `setStep` (silence = toute la note). On change sa durée en glissant n'importe quel morceau (`stretchMove`).
- Menus de notes : `degCount`, `degList` (au moins 0 à 12). `chordOn(degré, 3, gamme)` construit un accord. `chordInfo(b, v)` donne son vrai nom (« La m ») et ses notes (« La Do Mi »).
- Palette Notes : les pads suivent la gamme du bloc Mélo sélectionné (`padRef`, `refreshPads`).
- Menu d'un pas : `openCellPicker`, avec le choix Notes / Accords (`cellChord`).
- « Basse 808 » dans le menu Timbre : `is808`, `apply808`, `timbreOptions` (sinus dans le grave + decay, sustain 0, shape).

### Mélodie libre et piano roll (#46, refonte du REC, en cours)
- **Tous les blocs Mélo sont en mélodie libre** : `b.notes = [{t, d, v}]` (début et durée en tours depuis le début de la phrase, `v` = degré ou accord) et `b.len` (phrase de 1 à 16 tours). `isRoll(b)`. Les anciens blocs en cases (`b.lines`) sont convertis par `toRoll` / `rollProject` au chargement, à l'import, pour les démos, à l'ouverture d'un projet de la Library, à la création d'un bloc et pour le REC, qui écrit directement en notes pendant la prise. Un `.slow(k)` entier devient une phrase k fois plus longue.
- **Affichage en lignes, comme avant** : une ligne par tour, numérotée (`rollHTML`, `rollRowSegs`). Toucher le numéro sélectionne la ligne (`sel.k === 'line'`), avec Supprimer, Vider, Dupliquer (`rollRowOp`). Une note qui passe d'un tour à l'autre se dessine en deux morceaux. Les pads de l'onglet Notes ajoutent dans la ligne sélectionnée.
- **REC libre** : chaque note garde l'instant exact de son début et de sa fin (pas de grille), une ligne par tour, une note tenue peut passer sur la ligne suivante (`recHit`, `recRelease`). Deux appuis à moins d'1/64 de tour = un accord. Une note jouée en direct est marquée `_fresh` (son tour) pour que la boucle ne la rejoue pas. À la fin de la prise, la prise brute est gardée (`b.raw`) et l'aimant donne la version calée (`rollSetSnap`, `rollQuantize`), 1/16 par défaut.
- **Aimant** : menu « Aimant » dans l'en-tête (libre, 1/32, 1/16, 1/8, triolets) ; il repart de la prise brute tant que les notes n'ont pas été retouchées à la main (`b.rawOf`), sinon il cale les notes actuelles. `rollSnap(b)` = la grille des gestes d'édition.
- **Zoomer** (menu d'un bloc Mélo) : cadre ses lignes de notes sur toute la largeur libre (`zoomToBlock`).
- Code Strudel : `rollMini` écrit chaque voix en `note@durée` (`~` silence, `[0,2,4]` accord, voix séparées par `,`), plus `.slow(len)`. Import : l'ancien lecteur (cases) d'abord, car il gère `add`, `arp`, `struct`… ; s'il perd quelque chose (voix superposées, durées fines, plus de 32 pas), `rollFromMini` prend le relais. Un `n("… , …")` reste un seul bloc. Aller-retour vérifié par le vrai bouton Importer sur toutes les démos.
- Son : `scheduleRoll`. Tête de lecture et notes qui s'allument : `rollIdx` (construit par `indexCanvas`), mis à jour dans `frame`.
- Piano roll compact (`rollHTML`) : une bande par voix (`rollLanes`, calculées, non stockées) + une bande pointillée pour superposer une voix. Grille : 320 px par tour (`ROLL_CYCLE_PX`), aimant `rollSnap(b)` (1/16 par défaut). Gestes (`startRoll`, `rollMove`, `rollEnd`) : toucher une note = son menu (`openNotePicker` : hauteur en notes ou accords, durée, dupliquer, supprimer), glisser une note = la déplacer, glisser sa poignée = changer sa durée, toucher un vide = ajouter une note d'un pas. Menu « tours » dans l'en-tête = longueur de la phrase. « Ligne » (palette ou glisser) = un tour de plus. Les pads de l'onglet Notes ajoutent les notes à la suite (`rollPaletteTap`).
- Tests : `window.BTB._roll` expose `fromLines`, `toMini`, `parse`, `code`.

### Moteur audio (Web Audio, pas le vrai moteur Strudel)
- `scheduleRange` : planificateur à anticipation, appelé par `tick` toutes les 25 ms. Gère notes tenues, jux, late, mode Morceau.
- `blockOut` / `buildChain` : chaînes d'effets mises en cache par bloc.
- `synth` et `VOICE` : 24 instruments synthétisés (Karplus-Strong pour guitares et basses, piano, rhodes, orgue, marimba, cordes, flûte, cuivres, sax, chœur, supersaw, 808 avec chute de hauteur).
- Percussions en onomatopées : Boum (bd), Tchak (sd), Clap (cp), Tss (hh), Pshh (oh), Tok (rim), Toum (lt), Crash (cr).
- Bus master (`initAudio`) : saturation douce (`tanhCurve`), compression, limiteur, puis écrêteur doux (`softClipCurve`) : le son ne dépasse jamais le niveau maximum.
- Pompage (sidechain) : tout sauf la batterie passe par le bus `duck`, qui baisse à chaque grosse caisse (`duckAt`, appelé par `scheduleRange`). La réverb et l'écho y passent aussi.
- Passe-haut automatique à 150 Hz sur les blocs Mélo à partir de l'octave 3 (`rootOctave`), pour garder le grave net.
- Batterie : le kit (`bank`) change le son (808 = kick long ; charley à 6 oscillateurs carrés, `metal`).
- Voix synthétisées (`VOWELS`, `formants`) : `choir` (Chœur, Voix douce) et `vox` (Voix lead). L'effet Voyelle (`vowel`, comme `.vowel()` de Strudel) change ce que chante une voix, ou fait « parler » n'importe quel autre timbre.
- Mes sons (#55) : sons importés par l'utilisateur (mp3, m4a, wav, 5 Mo au plus), gardés sur l'appareil dans IndexedDB (base `blocktobeat-sounds`, suffixe `-dev` en dev). Le projet ne garde que leur nom (`s("ma_voix")`). Voir `USER_SOUNDS`, `USER_BUF` (sons décodés), `importSoundFile`, `playUser`, `loadUserSounds` (au démarrage). Le code généré les signale par un commentaire, car strudel.cc ne peut pas les charger.
- `renderWav` / `exportWav` : export .wav hors ligne par tranches de ~8 s.
- Son bloqué au lancement : les navigateurs interdisent le son avant un premier toucher. `autoStart` lance la lecture, et si le son est bloqué, l'écran `#soundHint` (fond assombri, encoches aux 4 coins, « Touche l'écran pour lancer la musique ») capte le premier toucher. Voir `audioLockCheck`, `unlockAudio`. Dans le bas de cet écran, hors de l'app installée et sur téléphone seulement, un mini tuto explique comment ajouter l'app à l'écran d'accueil selon le système et le navigateur (`installSteps`, `renderInstallTuto`) ; sur Chrome Android, un bouton « Installer l'app » utilise l'invitation du navigateur (`beforeinstallprompt`, gardée dans `window.btbInstallPrompt`).

### REC
- Bouton REC : le menu du bas devient le pad. La prise attend la première note, ouvre une nouvelle ligne à chaque boucle, avec métronome.
- Une note suivie par doigt ou par touche (`recHolds`). Notes simultanées sur un même pas = accord (`recWrite`). La boucle ne rejoue pas une note qu'on vient d'entendre en direct (`rec.fresh`), et un tour où l'on n'a encore rien joué reste muet (sinon la ligne du tour d'avant se rejouait, #47).
- Timing : quand la prise démarre sur la première note, le premier temps de la boucle est l'instant exact de cette note (`play(at)`). Le moment joué vient de `getOutputTimestamp` (ce qu'on entendait au moment du geste, retard de sortie compris), avec repli sur `outputLatency` (`recPos`).
- Son pendant la prise = son de la relecture (`holdVoice(b, v, true)`) : les instruments qui résonnent (piano, guitares…) résonnent jusqu'au bout comme à la relecture, les autres s'arrêtent au relâchement avec le même relâchement R (#43).

### Import de code Strudel
- `parseStrudel` → `expandExpr` → `sectionFromExpr` → `exprToBlocks` → `applyMethods`.
- Gère : `const`, fonctions fléchées, `stack`, `arrange`, `chord()` + voicing, `arp`, `add`, `struct`, `setcps` avec expressions, mini-notation `< >`, `*`, `_`, `@`, jusqu'à 32 pas.
- Objectif : 0 bloc « code brut » et aller-retour identique (code → blocs → code).

### Interface du Lab
- Plan de travail infini (pan + zoom), commandes dans des « îles » flottantes (`.island`). `fitView` cadre au lancement : centré si tout tient, sinon calé en haut à gauche.
- Barre de navigation `#nav` en bas. Sa hauteur `--navh` est incluse dans `--gb` : tout ce qui se cale en bas avec `--gb` passe au-dessus.
- Bords de l'écran (iPhone) : la barre d'état est **opaque** (`apple-mobile-web-app-status-bar-style` « black », `theme-color` noir) : en app installée, l'app commence sous l'heure, avec une démarcation nette. Si la page passe quand même dessous, `.topband` couvre la zone de noir (`--st`). **Aucun fondu en haut** : pas de lueur intérieure ni de halo sur le liseré de lumière (`.edge-light`), pas de dégradé partant du haut. La barre de navigation du bas garde sa taille d'origine (`--navh` 58 px + zone réservée), avec les icônes seules : le nom de chaque onglet reste pour les lecteurs d'écran et au survol.
- Palette du bas (Blocs, Sons, Notes, Effets). Dans une liste qui défile, un geste horizontal fait défiler, un geste vertical attrape l'élément.
- Barre d'actions : la poubelle rouge est toujours en premier (`trashBtn`). « Vider » existe pour un bloc Son, un bloc Mélo, une ligne de notes et une ligne de bloc Son (on la sélectionne en touchant son numéro).
- Gestes : appui long sur un groupe ou un bloc = solo, double toucher = muet, appui long sur un pas = sélection multiple.
- Mode Morceau : timeline à plusieurs lignes (`songLanes`, `songAt`).
- Les groupes ne se chevauchent jamais (`resolveOverlaps`).
- Mascotte (une vague avec des yeux) qui danse au rythme.
- Au lancement : une des 10 démos (`DEMOS`, `loadDemo`) au hasard.
- Performance : les effets qui changent à chaque image passent par `setFx` sur quelques éléments (`.vbg` grille, `.vglow` lueur, `.strobe`, `.edge-light`, `#play`), **jamais sur la racine** (sinon tout le plan recalcule son style). La tête de lecture utilise l'index `cellIdx` / `lineIdx` / `blockIdx` construit par `indexCanvas` après chaque `renderCanvas`.
- Firefox : la classe `is-firefox` sur `<html>` remplace le flou des îles par un fond opaque (Firefox dessinait mal le flou).

### Style
- Couleurs en variables dans `:root` : `--title` (rose), `--sound` (orange), `--note` (violet), `--fx` (vert), `--bg`, `--fg`, `--muted`, `--dim`, `--line`, `--danger`… Réutilise-les, n'invente pas de nouvelles couleurs sans raison.
- Polices : Bricolage Grotesque (`--f-display`), DM Sans (`--f-body`), une police mono (`--f-mono`).
- Mobile d'abord : tout doit marcher à 380 px de large, au doigt.

## 7. Pièges connus

- Son au lancement : impossible de forcer le son avant un toucher. Une app installée avec Chrome peut avoir le droit : l'écran d'attente ne s'affiche alors pas, c'est normal.
- iOS : le déverrouillage du son n'a pas encore été vérifié sur un vrai iPhone (#25).
- Un bloc fait au plus 16 pas par ligne (32 à l'import) : le REC arrondit à la double croche.
- Avec beaucoup de blocs, la lecture reste lourde : il reste le coût de création des sons (voir #33 et la PR #35).
- Les démos sont tirées au hasard : dans les tests, fixe `Math.random` (voir section 8).

## 8. Tests (obligatoire)

**Chaque ajout ou correction arrive avec son test**, dans la même branche, et tous les tests passent avant de fusionner dans `dev`. Un test qui passe aussi sur l'ancien code ne prouve rien : vérifie qu'il échoue sans ta modification.

- Les tests sont dans `tests/`, un fichier par sujet (`*.test.js`). Ils lancent l'app dans de vrais navigateurs avec Playwright : tests des fonctions (via `window.BTB._roll`) et tests de ce que fait l'utilisateur (toucher, glisser, REC, import, son).
- Lancer : `npm install` puis `npx playwright install chromium firefox` (une seule fois), puis **`npm test`** (tous) ou `node tests/run.js pianoroll` (un seul fichier). `tests/run.js` sert le site en local tout seul.
- Écrire un test : un fichier `tests/<sujet>.test.js` qui exporte `async ({ url, check }) => { … }` ; `check(condition, 'ce qui est vérifié')` affiche OK ou ÉCHEC. Outils communs dans `tests/lib.js` : `openApp(url, {project, seed, viewport, touch, sound, browser, init})` (ouvre l'app, enlève l'écran de lancement, charge un projet), `melo`, `oneBlock`, `notesOf`, `fmtNotes`, `zoomOn`, `drag`.
- Fichiers actuels : `app` (vérification générale, Chromium et Firefox), `roll-modele` (conversion, écriture et relecture Strudel, démos), `import` (aller-retour par le vrai bouton Importer), `son` (instants exacts des notes), `pianoroll` (lignes, gestes, menus, pads, tête de lecture, au doigt), `rec` (prise exacte, pas de notes fantômes, piano roll pendant la prise).
- Pièges : l'écran `#soundHint` capte les clics (`openApp` s'en charge) ; les démos sont tirées au hasard (option `seed`) ; sur la version dev en ligne, la clé du projet finit par `-dev`.
- Dans la PR, dis ce qui a été testé, et ce qui ne peut l'être que sur un vrai téléphone.

## 9. Issues ouvertes (au moment d'écrire ce fichier)

- #20 Library : enregistrer, renommer et ranger ses projets en dossiers (Matteo, chantier long).
- #25 Points à vérifier sur un vrai téléphone.
- #31 Langage de code musical sans licence contraignante (à voir avec Jules).

## 10. Idées proposées mais pas validées (demander avant)

- Disposition en grille des groupes après un import.
- Bouton « autre démo ».
