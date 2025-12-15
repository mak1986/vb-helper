# Build

This repository is a tiny frontend snippet for embedding ViaBill pricetags. Use the included `esbuild` script to produce a minified file from `index.js`.

Quick steps (PowerShell):

```powershell
cd 'c:\Users\Lenovo\Desktop\Work\libraries\vb-helper'

# Install dev dependency
npm install --save-dev esbuild

# Run the minify build (produces index.min.js + index.min.js.map)
npm run build

# Optional: produce ES2015-compatible output
npm run build:es2015
```

## Notes

- The `build` script uses `esbuild` to minify `index.js` and generate a source map.
- If you need older-browser (IE11) support, add a Babel transpilation step and polyfills (not included).
- The code exposes globals (functions attached to `window`). If you run name mangling during minification, reserve these names or avoid mangling.

---

# Usage

This helper dynamically injects **ViaBill Pricetags** into product pages, baskets, and mini-carts while keeping prices in sync on dynamic or AJAX-driven pages.

It handles:
- Safe loading of the ViaBill script (no double loads)
- Late-rendered DOM elements (cart drawers, SPAs)
- Automatic price updates
- Automatic iframe width adjustment

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

  const configurations = [
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
      const viaBillCode = "YOUR_VIABILL_CODE";
      window.vbHelper.init(viaBillCode, configurations);
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

Each configuration object represents **one pricetag**.

### Required fields

| Field | Description |
|------|------------|
| `type` | Unique identifier (e.g. `product`, `basket`, `mini-basket`) |
| `priceContainerSelector` | Element **after which** the pricetag will be injected |
| `primaryPriceSelector` | Selector for the main price |
| `secondaryPriceSelector` | Optional selector (sale / discounted price) |

### Optional fields

| Field | Description |
|------|------------|
| `style` | Inline CSS applied to the pricetag wrapper |

---

## 4. How it works (summary)

1. Loads the ViaBill script if not already present  
2. Creates hidden price containers  
3. Watches the DOM for price and layout changes  
4. Injects pricetags when target containers appear  
5. Keeps prices synced in real time  
6. Adjusts iframe width automatically  

This makes it suitable for:
- Shopify themes
- WooCommerce blocks
- AJAX carts
- Cart drawers
- SPA-style storefronts

---

## 5. Public API

```js
window.vbHelper.init(viaBillCode, configurations)
```

Returns a `Promise` that resolves once all configured pricetags are initialized.

---

## Best practices

- Include the helper **only once**
- Use **unique `type` values**
- Avoid loading ViaBill’s script separately
- Choose stable price selectors that update when prices change
