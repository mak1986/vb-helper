(function (w) {
    "use strict";

    function ensureViabillOptions() {
        w.viabillOptions = w.viabillOptions || [];
        return w.viabillOptions;
    }

    function vbSetCookiesEnabled(value /* false | true | string[] */) {
        ensureViabillOptions().push({ "pricetag.cookiesEnabled": value });
    }

    function loadViaBillScript(code, {
        gracePeriod = 200,   // ms to wait before injecting
        pollInterval = 50    // ms to check during grace period
    } = {}) {
        return new Promise((resolve, reject) => {
            if (!code) {
                reject(new Error("ViaBill code is required"));
                return;
            }

            // If already available immediately
            if (window.viabillPricetagInternal) {
                resolve();
                return;
            }

            const src = `https://pricetag.viabill.com/script/${code}`;
            const start = Date.now();

            // 1️⃣ Grace-period polling: wait to see if another script loads it
            const gracePoll = setInterval(() => {
                if (window.viabillPricetagInternal) {
                    clearInterval(gracePoll);
                    resolve();
                    return;
                }

                if (Date.now() - start >= gracePeriod) {
                    clearInterval(gracePoll);
                    inject();
                }
            }, pollInterval);

            // 2️⃣ Inject only if still not present
            function inject() {
                // Script already injected but not ready yet
                const existing = document.querySelector(`script[src="${src}"]`);
                if (existing) {
                    const wait = setInterval(() => {
                        if (window.viabillPricetagInternal) {
                            clearInterval(wait);
                            resolve();
                        }
                    }, pollInterval);
                    return;
                }

                const script = document.createElement("script");
                script.type = "text/javascript";
                script.async = true;
                script.src = src;

                script.onload = () => resolve();
                script.onerror = () => reject(new Error("Failed to load ViaBill script"));

                const firstScript = document.getElementsByTagName("script")[0];
                firstScript.parentNode.insertBefore(script, firstScript);
            }
        });
    }

    function waitForElement(selector) {
        return new Promise((resolve) => {
            const targetNode = document.body;

            if (!targetNode) {
                console.warn("document.body not ready yet");
                return;
            }

            const el = document.querySelector(selector);
            if (el) {
                resolve(el);
                return;
            }

            const observer = new MutationObserver(() => {
                const el = document.querySelector(selector);
                if (el) {
                    observer.disconnect();
                    resolve(el);
                }
            });

            observer.observe(targetNode, {
                childList: true,
                subtree: true
            });
        });
    }

    function generateHiddenPrices(configurations = []) {
        const html = `<div id="vb-hidden-prices" style="visibility: hidden;height: 0;margin: 0;padding: 0;overflow: hidden;">
    ${configurations.map(config => {
            const { type } = config;
            return `<div id="vb-${type}-hidden-price"></div>`;
        }).join('')}
</div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    function injectPricetag(params) {

        const {
            containerElement,
            type,
            style = 'display:flex;justify-content:center;align-items:center;margin-top:5px;margin-botttom:5px;',
            currency = 'dkk',
            countryCode = 'dk',
            language = 'da'
        } = params;

        const dataView = type.includes('basket') ? 'basket' : type

        const dynamicPriceId = `#vb-${type}-hidden-price`

        const html = `<div id="viabill-${type}-pricetag-wrapper" style="${style}"><div class="viabill-pricetag" data-view="${dataView}" data-dynamic-price="${dynamicPriceId}" data-dynamic-price-triggers="${dynamicPriceId}" data-language="${language}" data-currency="${currency}" data-country-code="${countryCode}"></div></div>`;

        containerElement.insertAdjacentHTML('afterend', html);
    }

    function updatePrice(priceSelector, hiddenValueSelector) {
        // 🔧 Add more entries here for each pricetag you want to support

        const lastPrices = {};

        function getPrice(selector) {
            const el = document.querySelector(selector);
            if (!el) return null;
            return el.textContent.replace(/[^\d.,]/g, '').trim() || null;
        }

        function updateSource(priceSelector, hiddenValueSelector) {

            const hidden = document.querySelector(hiddenValueSelector);
            if (!hidden) return;

            const price = getPrice(priceSelector);
            if (!price) return;

            const last = lastPrices[hiddenValueSelector];
            if (price !== last) {
                lastPrices[hiddenValueSelector] = price;
                hidden.textContent = price;
                hidden.dispatchEvent(new Event('change', { bubbles: true }));
            }

        }

        function update() {
            updateSource(priceSelector, hiddenValueSelector)
        }

        // Initial run
        update();
        // Then every 1000ms
        setInterval(update, 1000);
    }



    function adjustWidthForTag(iframe, extraWidth = 0, { retries = 20, interval = 300 } = {}) {
        if (!iframe) return Promise.resolve(false);

        const priceTagEl = iframe.parentElement;
        if (!priceTagEl) return Promise.resolve(false);

        return new Promise((resolve) => {
            function tryMeasure(remaining) {
                try {
                    const doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
                    if (!doc) throw new Error('no-doc-yet');

                    const inner = doc.querySelector('body > div');
                    if (!inner) {
                        if (remaining > 0) {
                            setTimeout(() => tryMeasure(remaining - 1), interval);
                        } else {
                            resolve(false);
                        }
                        return;
                    }

                    const width = inner.scrollWidth || inner.offsetWidth || inner.clientWidth;
                    if (!width || width < 20) {
                        if (remaining > 0) {
                            setTimeout(() => tryMeasure(remaining - 1), interval);
                        } else {
                            resolve(false);
                        }
                        return;
                    }

                    setTimeout(() => {
                        const width = (inner.scrollWidth || inner.offsetWidth || inner.clientWidth);
                        priceTagEl.style.width = (width + 5 + extraWidth) + 'px';
                        resolve(true);
                    }, 200);
                } catch (err) {
                    if (err instanceof DOMException && (err.name === 'SecurityError' || err.name === 'TypeError')) {
                        console.warn('Cannot access iframe content (cross-origin).');
                        resolve(false);
                        return;
                    }
                    if (remaining > 0) {
                        setTimeout(() => tryMeasure(remaining - 1), interval);
                    } else {
                        resolve(false);
                    }
                }
            }

            if (!iframe.complete && typeof iframe.addEventListener === 'function') {
                const onLoad = () => {
                    iframe.removeEventListener('load', onLoad);
                    tryMeasure(retries);
                };
                iframe.addEventListener('load', onLoad, { once: true });
            }

            tryMeasure(retries);
        });
    }

    async function init(configurations) {

        const { code, extraWidth, pricetagConfigs, cookiesEnabled, currency, countryCode, language } = configurations;

        // ✅ If caller provided consent, push it BEFORE loading ViaBill
        // cookiesEnabled can be: false | true | ['necessary','functional',...]
        if (cookiesEnabled === false || cookiesEnabled === true || Array.isArray(cookiesEnabled)) {
            vbSetCookiesEnabled(cookiesEnabled);
        }

        // 1️⃣ Ensure ViaBill script is loaded
        await loadViaBillScript(code);

        // 2️⃣ Create hidden price containers
        generateHiddenPrices(pricetagConfigs);

        // Per-type lock to avoid overlapping rebuilds
        const healingLocks = Object.create(null);

        // Small debounce helper (per config)
        function debounce(fn, wait = 150) {
            let t;
            return (...args) => {
                clearTimeout(t);
                t = setTimeout(() => fn(...args), wait);
            };
        }

        // The full pipeline you want to retrigger
        async function runPipeline(config) {
            const { type, priceContainerSelector, style } = config;

            // Only heal if anchor exists
            const anchor = document.querySelector(priceContainerSelector);
            if (!anchor) return false;

            // Avoid concurrent rebuilds for same type
            if (healingLocks[type]) return false;
            healingLocks[type] = true;

            try {
                const wrapperSel = `#viabill-${type}-pricetag-wrapper`;

                // Inject if missing
                if (!document.querySelector(wrapperSel)) {
                    injectPricetag({
                        containerElement: anchor,
                        type,
                        style,
                        currency,
                        countryCode,
                        language
                    });

                    // Re-init after injecting new tags
                    window.viabillPricetagInternal?.init?.(true);
                }

                // Wait for iframe then adjust width
                const iframe = await waitForElement(
                    `#viabill-${type}-pricetag-wrapper > .viabill-pricetag > iframe`
                );

                await adjustWidthForTag(iframe, extraWidth);
                return true;
            } finally {
                healingLocks[type] = false;
            }
        }

        return Promise.allSettled(
            pricetagConfigs.map(async (config) => {
                const {
                    type,
                    priceContainerSelector,
                    primaryPriceSelector,
                    secondaryPriceSelector
                } = config;

                // --- Your existing price update wiring (unchanged) ---
                const containerPromise = waitForElement(priceContainerSelector);

                const primaryPriceElPromise = primaryPriceSelector
                    ? waitForElement(primaryPriceSelector)
                    : Promise.resolve(null);

                const secondaryPriceElPromise = secondaryPriceSelector
                    ? waitForElement(secondaryPriceSelector)
                    : Promise.resolve(null);

                primaryPriceElPromise.then(() => {
                    if (primaryPriceSelector) updatePrice(primaryPriceSelector, `#vb-${type}-hidden-price`);
                });

                secondaryPriceElPromise.then(() => {
                    if (secondaryPriceSelector) updatePrice(secondaryPriceSelector, `#vb-${type}-hidden-price`);
                });

                // --- Initial pipeline run ---
                await containerPromise;
                await runPipeline(config);

                // --- ✅ Per-config self-healing observer ---
                const debouncedHeal = debounce(async () => {
                    // only when viabill is ready
                    if (!window.viabillPricetagInternal) return;

                    const anchor = document.querySelector(priceContainerSelector);
                    if (!anchor) return; // anchor gone => do nothing

                    const wrapper = document.querySelector(`#viabill-${type}-pricetag-wrapper`);
                    if (wrapper) return; // wrapper still there => do nothing

                    // wrapper missing but anchor exists => rebuild whole pipeline
                    runPipeline(config);
                }, 150);

                const observer = new MutationObserver(() => {
                    debouncedHeal();
                });

                observer.observe(document.documentElement, {
                    childList: true,
                    subtree: true
                });

                // (Optional) store observer reference if you want to stop it later
                // w.vbHelper._observers = w.vbHelper._observers || {};
                // w.vbHelper._observers[type] = observer;

                return true;
            })
        );
    }

    // ✅ expose API
    w.vbHelper = w.vbHelper || {};
    w.vbHelper.init = init;
    w.vbHelper.setCookiesEnabled = vbSetCookiesEnabled;

})(window);