import { cpSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const outputDirectory = "dist";
const files = ["index.html", "styles.css", "app.js"];
const directories = ["assets", "data"];

mkdirSync(outputDirectory, { recursive: true });

for (const file of files) {
  cpSync(file, join(outputDirectory, file));
}

for (const directory of directories) {
  cpSync(directory, join(outputDirectory, directory), { recursive: true });
}
