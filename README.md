# Build

This repository is a tiny frontend helper for embedding **ViaBill Pricetags** into dynamic storefronts.

It handles:
- Safe loading of the ViaBill script
- Async / late-rendered DOM elements
- Dynamic price updates
- Automatic iframe width adjustment

Use the included `esbuild` script to produce a minified file from `index.js`.

## Build steps (PowerShell)

```powershell
cd 'c:\Users\Lenovo\Desktop\Work\libraries\vb-helper'

# Install dev dependency
npm install --save-dev esbuild

# Run the minify build (produces dist files)
npm run build

# Optional: produce ES2015-compatible output
npm run build:es2015
```

## Notes

- The build uses `esbuild` to minify and generate source maps.
- If you need older-browser (IE11) support, add Babel + polyfills (not included).
- The helper exposes a global API on `window.vbHelper`.

---

# Usage

The helper injects ViaBill pricetags into **product pages**, **baskets**, and **mini-baskets**, and keeps prices in sync even on AJAX- or SPA-driven pages.

---

## 1. Include the helper script

Include the built file **before `</body>`**:

```html
<script src="dist/vb-helper.min.es2015.js"></script>
```

---

## 2. Initialize the helper

Call `vbHelper.init()` once the DOM is ready.

```html
<script>
document.addEventListener("DOMContentLoaded", function () {
  const code = "YOUR_VIABILL_CODE";
  const extraWidth = 20; // extra pixels added to calculated pricetag width

  const pricetagConfigs = [
    {
      type: "product",
      priceContainerSelector: ".product__info-wrapper .product__tax",
      primaryPriceSelector: ".product__info-wrapper .price .price-item--regular",
      secondaryPriceSelector: ".product__info-wrapper .price .price-item--sale",
      style: "display:flex;justify-content:flex-start;"
    },
    {
      type: "basket",
      priceContainerSelector: ".cart__footer .totals",
      primaryPriceSelector: ".cart__footer .totals .totals__total-value",
      style: "display:flex;justify-content:flex-end;margin-top:10px;"
    },
    {
      type: "mini-basket",
      priceContainerSelector: ".cart-drawer__footer",
      primaryPriceSelector: ".cart-drawer__footer .totals__total-value",
      style: "display:flex;justify-content:center;padding-bottom:10px;"
    }
  ];

  function waitForVBHelper() {
    if (window.vbHelper?.init) {
      window.vbHelper.init({
        code,
        extraWidth,
        pricetagConfigs
      });
    } else {
      setTimeout(waitForVBHelper, 50);
    }
  }

  waitForVBHelper();
});
</script>
```

---

## 3. Configuration reference

### `vbHelper.init(config)`

```js
vbHelper.init({
  code,
  extraWidth,
  pricetagConfigs
});
```

### Root config options

| Field | Type | Description |
|-----|-----|------------|
| `code` | `string` | ViaBill merchant code |
| `extraWidth` | `number` | Extra pixels added to calculated iframe width |
| `pricetagConfigs` | `Array` | List of pricetag configurations |

---

### Pricetag configuration

Each entry in `pricetagConfigs` represents **one pricetag**.

#### Required fields

| Field | Description |
|-----|------------|
| `type` | Unique identifier (`product`, `basket`, `mini-basket`, etc.) |
| `priceContainerSelector` | Element **after which** the pricetag is injected |
| `primaryPriceSelector` | Selector for the main price |
| `secondaryPriceSelector` | Optional selector for sale/discount price |

#### Optional fields

| Field | Description |
|-----|------------|
| `style` | Inline CSS applied to the pricetag wrapper |

---

## 4. How it works (summary)

1. Loads the ViaBill script if not already present
2. Creates hidden price containers
3. Watches the DOM for price changes
4. Injects pricetags when containers appear
5. Keeps prices synced in real time
6. Measures iframe width and applies `extraWidth` compensation

This makes it suitable for:
- Shopify themes
- WooCommerce blocks
- AJAX carts
- Cart drawers
- SPA-style storefronts

---

## 5. Public API

```js
window.vbHelper.init(config)
```

Returns a `Promise` resolving once all configured pricetags are initialized.

---

## Best practices

- Include the helper **only once**
- Use **unique `type` values**
- Avoid loading ViaBill’s script separately
- Choose stable price selectors that update when prices change
- Use `extraWidth` sparingly (layout fine-tuning only)

---

## Versioning

- `v0.1.x` — initial API
- `v0.2.0` — updated `init(config)` API with `extraWidth`
- `v1.0.0` — planned stable API
