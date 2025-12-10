# Dubai Business Expedition — Frontend

Application React + TypeScript construite avec Vite, Tailwind CSS, ESLint et Prettier.

Ce README explique comment démarrer le projet localement, quelles commandes utiliser, et donne des conseils de dépannage rapide (page blanche / Tailwind non appliqué).

**Prérequis**
- **Node.js**: version 18+ recommandée (utilisez Volta / nvm si nécessaire).
- **npm** (ou `pnpm` / `yarn`) disponible.

**Installation rapide**

```bash
# depuis le dossier du projet
npm install

# lancer le serveur de développement (Vite)
npm run dev
```

**Scripts utiles** (définis dans `package.json`)
- `npm run dev`: démarre Vite en mode développement.
- `npm run build`: type-check (TS) puis build de production via Vite.
- `npm run preview`: prévisualise la build locale.
- `npm run type-check`: vérifie les types TypeScript (`tsc --noEmit`).
- `npm run lint`: lance ESLint sur le code (`.ts`, `.tsx`).
- `npm run format`: formate le code avec Prettier.
- `npm run test`: lance les tests avec `vitest`.

**Structure principale**
- `index.html` — point d'entrée (module `index.tsx`).
- `index.tsx` — bootstrapping de React et import du CSS global.
- `App.tsx` — composant racine.
- `src/index.css` — directives Tailwind (`@tailwind base; @tailwind components; @tailwind utilities;`).
- `tailwind.config.cjs` — configuration Tailwind (colors, content paths).
- `vite.config.ts` — configuration Vite (+ plugin React).

**Tailwind / Styles**
- Assurez-vous que `src/index.css` est importé dans `index.tsx` (fait dans ce repo).
- Si les classes Tailwind n'apparaissent pas:
	1. Vérifiez que `tailwind.config.cjs` contient les bons chemins dans `content` (ex: `./index.html`, `./**/*.{ts,tsx,js,jsx}`).
	2. Redémarrez le serveur Vite après modification de la config: `npm run dev`.
	3. Inspectez la console du navigateur pour des erreurs JS qui empêcheraient le rendu.

**Dépannage : page blanche**
- Ouvrez la console développeur (Cmd+Option+I) et regardez les erreurs JS/React. Les erreurs communes:
	- `Could not find root element to mount to` : vérifiez que `index.html` contient `<div id="root"></div>`.
	- Erreurs d'import/chemin : vérifiez que `index.tsx` utilise le bon chemin relatif pour `App` et pour `./src/index.css`.
	- Tailwind non chargé : assurez-vous d'avoir importé `src/index.css` et que Vite n'a pas d'erreur lors du build.

**Problème fréquent — Tailwind classes non générées**
- Tailwind génère uniquement les classes détectées dans les fichiers listés dans `content`. Si vous utilisez des templates dynamiques (ex: classes construites en runtime), ajoutez-les explicitement ou utilisez la fonctionnalité `safelist` dans `tailwind.config.cjs`.

**Tests**
- Tests unitaires : `npm run test` (vitest).

**Lint & Format**
- Linter: `npm run lint`.
- Format: `npm run format`.

**Déploiement (rapide)**
- Build production :

```bash
npm run build
```

- Déployez le dossier `dist/` sur Netlify / Vercel / tout hébergeur statique. Sur Vercel, créez un projet et pointez la commande de build sur `npm run build` et le dossier de sortie sur `dist`.

**Variables d'environnement / secrets**
- Pour des clés privées, créez un fichier `.env` et utilisez la convention `VITE_` pour exposer des variables côté client (ex: `VITE_API_URL=https://...`). Ne commitez jamais de secrets.

**Conseils & bonnes pratiques**
- Activez les extensions VSCode: `ESLint`, `Prettier`, `Tailwind CSS IntelliSense`.
- Utilisez `npm run type-check` régulièrement pour attraper les erreurs TS tôt.

**Si vous voulez que j'exécute les commandes pour vous**
- Je peux lancer `npm install` puis `npm run dev` dans ce workspace et partager les logs / erreurs.

---

Si vous voulez, je peux aussi :
- exécuter l'installation et démarrer le serveur pour diagnostiquer la page blanche en direct,
- ajouter une `safelist` pour Tailwind si certaines classes sont construites dynamiquement,
- ou préparer un guide de déploiement détaillé pour Vercel / Netlify.

Dites-moi quelle option vous préférez.

# Dubai Business - Frontend

Projet React + TypeScript minimal configuré avec Vite, Tailwind, ESLint et Prettier.

Commandes:

```bash
# Installer les dépendances
npm install

# Lancer le mode développement (Vite)
npm run dev

# Vérifier les types
npm run type-check

# Lancer la build
npm run build

# Lancer la preview de la build
npm run preview

# Linter
npm run lint

# Formater (Prettier)
npm run format

# Lancer les tests (vitest)
npm run test
```

Remarques:
- Après `npm install` vous pouvez ajouter des extensions VSCode recommandées: ESLint, Prettier.
- Si vous utilisez `pnpm` ou `yarn`, adaptez les commandes d'installation.
