const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { version } = require("./package.json");

// Output directories
const distCoreDir = path.join(__dirname, "dist/core");
const distConsentDir = path.join(__dirname, "dist/consent-adapters");

fs.mkdirSync(distCoreDir, { recursive: true });
fs.mkdirSync(distConsentDir, { recursive: true });

// Banners
const coreBanner = `/* ViaBill Helper Core | vb-helper v${version} */`;
const shopifyAdapterBanner =
  `/* ViaBill Helper – Consent Adapter (Shopify) | vb-helper v${version} */`;

// --------------------
// CORE – modern build
// --------------------
execSync(
  `npx esbuild src/core/index.js \
    --minify \
    --global-name=vbHelper \
    --outdir=dist/core \
    --entry-names=vb-helper.min \
    --banner:js="${coreBanner}"`,
  { stdio: "inherit" }
);

// --------------------
// CORE – ES2015 build
// --------------------
execSync(
  `npx esbuild src/core/index.js \
    --minify \
    --target=es2015 \
    --global-name=vbHelper \
    --outdir=dist/core \
    --entry-names=vb-helper.min.es2015 \
    --banner:js="${coreBanner}"`,
  { stdio: "inherit" }
);

// ---------------------------------------
// SHOPIFY CONSENT ADAPTER – modern build
// ---------------------------------------
execSync(
  `npx esbuild src/consent-adapters/shopify-consent-adapter.js \
    --minify \
    --outdir=dist/consent-adapters \
    --entry-names=shopify-consent-adapter.min \
    --banner:js="${shopifyAdapterBanner}"`,
  { stdio: "inherit" }
);

// ---------------------------------------
// SHOPIFY CONSENT ADAPTER – ES2015 build
// ---------------------------------------
execSync(
  `npx esbuild src/consent-adapters/shopify-consent-adapter.js \
    --minify \
    --target=es2015 \
    --outdir=dist/consent-adapters \
    --entry-names=shopify-consent-adapter.min.es2015 \
    --banner:js="${shopifyAdapterBanner}"`,
  { stdio: "inherit" }
);

console.log("✔ ViaBill helper build complete");
