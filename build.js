const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { version } = require("./package.json");

const distDir = path.join(__dirname, "dist");
fs.mkdirSync(distDir, { recursive: true });

const banner = `/* ViaBill Helper | vb-helper v${version} */`;

// Modern build
execSync(
  `npx esbuild index.js --minify --outdir=dist --entry-names=vb-helper.min --banner:js="${banner}"`,
  { stdio: "inherit" }
);

// ES2015 build
execSync(
  `npx esbuild index.js --minify --target=es2015 --outdir=dist --entry-names=vb-helper.min.es2015 --banner:js="${banner}"`,
  { stdio: "inherit" }
);
