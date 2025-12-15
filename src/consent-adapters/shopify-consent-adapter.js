(function (w) {
  "use strict";

  // ---- internal debug helpers ----
  function makeLogger(enabled) {
    function ts() {
      try { return new Date().toISOString(); } catch (_) { return ""; }
    }
    return {
      log: function () {
        if (!enabled) return;
        console.log.apply(console, ["[ViaBill][ShopifyConsent]", ts()].concat([].slice.call(arguments)));
      },
      warn: function () {
        if (!enabled) return;
        console.warn.apply(console, ["[ViaBill][ShopifyConsent]", ts()].concat([].slice.call(arguments)));
      },
      error: function () {
        if (!enabled) return;
        console.error.apply(console, ["[ViaBill][ShopifyConsent]", ts()].concat([].slice.call(arguments)));
      }
    };
  }

  if (!w.vbHelper || typeof w.vbHelper.setCookiesEnabled !== "function") {
    console.warn("[ViaBill] vbHelper core missing. Load vb-helper-core first.");
    return;
  }

  function setFromShopifyDetail(detail, mode, dbg) {
    if (!detail) {
      dbg && dbg.warn("No detail to apply (null/undefined)");
      return;
    }

    dbg && dbg.log("Applying Shopify detail:", detail, "mode:", mode);

    if (mode === "boolean") {
      const any =
        !!detail.preferencesAllowed ||
        !!detail.analyticsAllowed ||
        !!detail.marketingAllowed;

      dbg && dbg.log("Computed cookiesEnabled (boolean):", any);
      w.vbHelper.setCookiesEnabled(any);
      return;
    }

    const enabled = ["necessary"];
    if (detail.preferencesAllowed) enabled.push("functional");
    if (detail.analyticsAllowed) enabled.push("statistical");
    if (detail.marketingAllowed) enabled.push("marketing");

    dbg && dbg.log("Computed cookiesEnabled (categories):", enabled);
    w.vbHelper.setCookiesEnabled(enabled);
  }

  function readAllowed(dbg) {
    if (!w.Shopify) {
      dbg && dbg.warn("window.Shopify is missing");
      return null;
    }
    if (!w.Shopify.customerPrivacy) {
      dbg && dbg.warn("Shopify.customerPrivacy is missing");
      return null;
    }

    const allowed = {
      preferencesAllowed: !!w.Shopify.customerPrivacy.preferencesProcessingAllowed(),
      analyticsAllowed: !!w.Shopify.customerPrivacy.analyticsProcessingAllowed(),
      marketingAllowed: !!w.Shopify.customerPrivacy.marketingAllowed(),
    };

    dbg && dbg.log("Read allowed from Shopify.customerPrivacy:", allowed);
    return allowed;
  }

  function ensureApi(cb, dbg) {
    if (w.Shopify && w.Shopify.customerPrivacy) {
      dbg && dbg.log("Consent API already available (Shopify.customerPrivacy present)");
      return cb();
    }

    if (!w.Shopify || !w.Shopify.loadFeatures) {
      dbg && dbg.warn("Shopify.loadFeatures missing (wrong surface or too early)");
      return cb(new Error("Shopify.loadFeatures missing"));
    }

    dbg && dbg.log("Loading Shopify consent-tracking-api via Shopify.loadFeatures...");

    w.Shopify.loadFeatures(
      [{ name: "consent-tracking-api", version: "0.1" }],
      function (error) {
        if (error) {
          dbg && dbg.error("Shopify.loadFeatures returned error:", error);
          return cb(error);
        }
        if (!w.Shopify.customerPrivacy) {
          dbg && dbg.error("Shopify.customerPrivacy still missing after loadFeatures");
          return cb(new Error("Shopify.customerPrivacy missing"));
        }
        dbg && dbg.log("Consent API loaded OK (Shopify.customerPrivacy ready)");
        cb();
      }
    );
  }

  function bindShopifyConsent(opts) {
    opts = opts || {};
    const mode = opts.mode || "categories"; // recommended
    const dbg = makeLogger(!!opts.debug);

    // Expose debug toggles/info (optional)
    w.vbHelper._shopifyConsentDebug = {
      enabled: !!opts.debug,
      mode,
      lastDetail: null
    };

    dbg.log("bindShopifyConsent called with opts:", opts);

    // strict default until we know (important for GDPR regions)
    dbg.log("Setting initial cookiesEnabled to false (strict default)");
    w.vbHelper.setCookiesEnabled(false);

    document.addEventListener("visitorConsentCollected", function (event) {
      dbg.log("visitorConsentCollected fired:", event);

      const detail = event && event.detail ? event.detail : readAllowed(dbg);
      w.vbHelper._shopifyConsentDebug.lastDetail = detail;

      setFromShopifyDetail(detail, mode, dbg);
    });

    ensureApi(function (err) {
      if (err) {
        dbg.warn("ensureApi failed:", err.message || err);
        // stay strict false
        return;
      }

      const initial = readAllowed(dbg);
      w.vbHelper._shopifyConsentDebug.lastDetail = initial;

      dbg.log("Applying initial consent state...");
      setFromShopifyDetail(initial, mode, dbg);
    }, dbg);
  }

  // expose
  w.vbHelper = w.vbHelper || {};
  w.vbHelper.bindShopifyConsent = bindShopifyConsent;

})(window);
