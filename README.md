# Build

This repository is a tiny frontend helper for embedding **ViaBill Pricetags** into dynamic storefronts.

It handles:
- Safe loading of the ViaBill script
- Async / late-rendered DOM elements
- Dynamic price updates
- Automatic iframe width adjustment
- Optional cookie-consent handling (via adapters)
- Optional localization (currency, country, language)

Use the included `esbuild` script to produce minified files.

---

## Build steps (PowerShell)

```powershell
cd 'c:\Users\Lenovo\Desktop\Work\libraries\vb-helper'

# Install dev dependency
npm install --save-dev esbuild

# Run build (produces dist files)
npm run build
```

Build output:

```
dist/
├─ core/
│  ├─ vb-helper.min.js
│  └─ vb-helper.min.es2015.js
└─ consent-adapters/
   └─ shopify-consent-adapter.min.es2015.js
```

---

## Notes

- The build uses `esbuild` to minify and generate source maps.
- The core helper is CMS-agnostic.
- Cookie consent support is provided via separate adapters.
- The helper exposes a global API on `window.vbHelper`.

---

# Usage

The helper injects ViaBill pricetags into **product pages**, **baskets**, and **mini-baskets**, and keeps prices in sync even on AJAX- or SPA-driven pages.

---

## 1. Include the helper script

Include the core helper **before `</body>`**:

```html
<script src="dist/core/vb-helper.min.es2015.js"></script>
```

### Optional: Shopify cookie consent adapter

```html
<script src="dist/consent-adapters/shopify-consent-adapter.min.es2015.js"></script>
```

---

## 2. Initialize the helper

Call `vbHelper.init()` once the DOM is ready.

```html
<script>
document.addEventListener("DOMContentLoaded", function () {
  const code = "YOUR_VIABILL_CODE";
  const extraWidth = 20;

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

## 3. Localization (optional)

You can explicitly set the currency, country code, and language used by all pricetags.

```js
vbHelper.init({
  code: "YOUR_VIABILL_CODE",
  currency: "eur",
  countryCode: "es",
  language: "es",
  pricetagConfigs
});
```

If not provided:
- ViaBill defaults are used
- or values are derived from the merchant configuration

---

## 4. Cookie consent (optional)

### Shopify (recommended on Shopify stores)

Bind the Shopify consent adapter **before** calling `init()`:

```js
vbHelper.bindShopifyConsent({
  mode: "categories",
  debug: true
});
```

- `categories` (recommended): granular consent  
  (`necessary`, `functional`, `statistical`, `marketing`)
- `boolean`: legacy on/off mode
- `debug`: logs consent flow to the console

The helper will:
- default to cookies disabled
- update ViaBill when consent changes
- respect GDPR regions automatically via Shopify

---

### Generic / manual consent

If you manage cookies yourself (WordPress, custom CMP, etc.):

```js
vbHelper.setCookiesEnabled(false); // before consent

vbHelper.setCookiesEnabled([
  "necessary",
  "functional",
  "statistical"
]); // after consent
```

This must be called **before** the ViaBill script is loaded.

---

## 5. Configuration reference

### `vbHelper.init(config)`

```js
vbHelper.init({
  code,
  extraWidth,
  pricetagConfigs,
  currency,
  countryCode,
  language
});
```

### Root config options

| Field | Type | Description |
|-----|-----|------------|
| `code` | `string` | ViaBill merchant code |
| `extraWidth` | `number` | Extra pixels added to calculated iframe width |
| `pricetagConfigs` | `Array` | List of pricetag configurations |
| `currency` | `string` | Currency code (e.g. `dkk`, `eur`) |
| `countryCode` | `string` | Country code (e.g. `dk`, `es`) |
| `language` | `string` | Language code (e.g. `da`, `es`) |

---

### Pricetag configuration

Each entry in `pricetagConfigs` represents **one pricetag**.

#### Required fields

| Field | Description |
|-----|------------|
| `type` | Unique identifier (`product`, `basket`, `mini-basket`, etc.) |
| `priceContainerSelector` | Element after which the pricetag is injected |
| `primaryPriceSelector` | Selector for the main price |
| `secondaryPriceSelector` | Optional selector for sale/discount price |

#### Optional fields

| Field | Description |
|-----|------------|
| `style` | Inline CSS applied to the pricetag wrapper |

---

## 6. How it works (summary)

1. Loads the ViaBill script if not already present  
2. Applies cookie-consent configuration (if provided)  
3. Creates hidden price containers  
4. Watches the DOM for price changes  
5. Injects pricetags when containers appear  
6. Keeps prices synced in real time  
7. Measures iframe width and applies `extraWidth` compensation  

This makes it suitable for:
- Shopify themes
- WooCommerce blocks
- AJAX carts
- Cart drawers
- SPA-style storefronts

---

## 7. Public API

```js
window.vbHelper.init(config)
window.vbHelper.setCookiesEnabled(value)
window.vbHelper.bindShopifyConsent(options)
```

`init()` returns a Promise resolving once all configured pricetags are initialized.

---

## Best practices

- Include the helper only once  
- Use unique `type` values  
- Avoid loading ViaBill’s script separately  
- Choose stable price selectors  
- Bind cookie consent before calling `init()`  
- Use `extraWidth` sparingly  

---

## Versioning

- `v0.1.x` — initial API  
- `v0.2.0` — added `extraWidth`  
- `v0.3.0` — consent adapters and debug support  
- `v0.4.0` — localization (`currency`, `countryCode`, `language`)  
- `v1.0.0` — planned stable API  
