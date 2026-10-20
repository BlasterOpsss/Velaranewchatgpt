# Velara — new GitHub/Vercel deployment

This is your uploaded Velara project with a targeted Nitro config change intended to address the production error `ReferenceError: exports is not defined in ES module scope` originating from `@coral-xyz/anchor`. The change tells Nitro to externalize Anchor rather than bundle it into the problematic ESM chunk.

**Important:** I cannot run a production build in this environment or verify your Vercel deployment, so this is a proposed fix, not a guarantee. If it still errors, check the Vercel function logs and share the new stack trace.

## Deploy from a new GitHub repository

1. Extract this ZIP.
2. Create a new empty repository on https://github.com/new (do not add a README/license if you will upload the extracted files).
3. Upload the extracted project files and folders to the repository root. Keep `package.json`, `package-lock.json`, `vite.config.ts`, `src/`, `server/`, `scripts/`, and `public/`.
4. In Vercel, choose **Add New → Project**, import that new repository, and set the framework preset to **Other** or allow Vercel to detect the existing Vite/TanStack Start setup.
5. Use the repository's default install/build settings. The project build script is `node scripts/with-app-env.mjs vite build && npm run db:migrate`.
6. Configure any environment variables your app needs in Vercel → Project → Settings → Environment Variables. Do not put secrets in source files. The exact variables depend on which auth, database, and wallet features you use.
7. Deploy and test the home page, wallet connection, and private SOL flows separately. Do not transfer real funds until those flows are verified.

## If deployment fails

- Open the failed deployment in Vercel and inspect the build log or runtime logs.
- If the same Anchor error remains, this externalization setting was insufficient for the installed Nitro version; do not keep randomly changing package type settings. Send the new full stack trace and build log.
- Do not delete the lockfile or change dependency versions without a specific reason.
