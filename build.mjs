import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { createRequire } from "node:module";

const outputDirectory = "dist";
const files = ["styles.css", "app.js"];
const directories = ["assets", "data", "landing"];

mkdirSync(outputDirectory, { recursive: true });

for (const file of files) {
  cpSync(file, join(outputDirectory, file));
}

for (const directory of directories) {
  cpSync(directory, join(outputDirectory, directory), { recursive: true });
}

// Keep the existing application source and its relative asset/data URLs unchanged.
cpSync("index.html", join(outputDirectory, "app.html"));
const require = createRequire(import.meta.url);
const threeBuild = dirname(require.resolve("three"));
for (const file of ["three.module.js", "three.core.js"]) {
  cpSync(join(threeBuild, file), join(outputDirectory, "landing/vendor/three", file));
}
const legacyRoutes = `<script>if (/^#\\/?(?:start|catalog|connections)(?:[?&/]|$)/.test(location.hash) || /^(start|catalog)$/.test(new URLSearchParams(location.search).get('view') || '')) location.replace('/app.html'+location.search+location.hash);</script>`;
let landing = readFileSync("landing/index.html", "utf8")
  .replace("<head>", `<head>\n${legacyRoutes}\n<base href="/landing/">`)
  .replaceAll("{BASE}", "https://treg-design.vercel.app")
  .replaceAll('href="https://treg.to/catalog"', 'href="/app.html#catalog"')
  .replace('<a onclick="openSignin()">Sign in</a>', '<a href="/app.html#start">Sign in</a>')
  .replaceAll('href="#top"', 'href="/#top"')
  .replaceAll('href="#why"', 'href="/#why"');
landing = landing.replace("</body>", `<script>window.openSignin=()=>{location.href='/app.html#start';};</script>\n</body>`);
writeFileSync(join(outputDirectory, "index.html"), landing);
