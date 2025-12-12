# Build

This repository is a tiny frontend snippet for embedding Viabill pricetags. Use the included `esbuild` script to produce a minified file from `index.js`.

Quick steps (PowerShell):

```powershell
cd 'c:\Users\Lenovo\Desktop\Work\libraries\universal-shopify-lib'
# Install dev dependency
npm install --save-dev esbuild

# Run the minify build (produces index.min.js + index.min.js.map)
npm run build

# Optional: produce ES2015-compatible output
npm run build:es2015
```

Notes

- The `build` script uses `esbuild` to minify `index.js` and generate a source map.
- If you need older-browser (IE11) support, add a Babel transpilation step and polyfills (not included).
- The code exposes globals (functions attached to `window`). If you run name mangling during minification, reserve these names or avoid mangling.
