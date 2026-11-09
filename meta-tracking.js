/*
 * Nobody Is Buying â€” opt-in browser Pixel + live Stripe checkout handoff.
 * Replace LIVE_WORKER_ORIGIN before publishing. Never put secrets in this file.
 * Purchase is sent ONLY by the verified Stripe webhook in the live Worker.
 */
(() => {
  "use strict";
  const PIXEL_ID = "1907948303354997";
  const LIVE_WORKER_ORIGIN = "https://nobody-is-buying.sameerfamily88.workers.dev";
  const CONSENT_KEY = "nib_meta_tracking_consent_v2";
  const LAST_REFERENCES_KEY = "nib_meta_checkout_refs_v2";
  const CONSENT_VERSION = "meta_purchase_v2";
  const CHECKOUTS = {
    "https://buy.stripe.com/5kQ5kFfFEamugJocJC6Na00": {
      id: "nib_ebook", name: "Nobody Is Buying eBook", value: 29
    },
    "https://buy.stripe.com/aFafZjgJIcuC3WC9xq6Na02": {
      id: "nib_diagnosis", name: "Full Diagnosis + Report", value: 49
    },
    "https://buy.stripe.com/14AbJ32SS3Y6dxcbFy6Na01": {
      id: "nib_rebuild", name: "Offer Rebuild", value: 199
    }
  };
  let enabled = false;
  let memoryChoice = null;

  function getConsent() {
    try { return localStorage.getItem(CONSENT_KEY) || memoryChoice; }
    catch (_) { return memoryChoice; }
  }
  function saveConsent(value) {
    memoryChoice = value;
    try { localStorage.setItem(CONSENT_KEY, value); }
    catch (_) { /* The current page still honors the selection. */ }
  }
  function cookie(name) {
    const row = document.cookie.split("; ").find(x => x.startsWith(name + "="));
    if (!row) return "";
    try { return decodeURIComponent(row.slice(name.length + 1)); }
    catch (_) { return ""; }
  }
  function bridgeConfigured() {
    return !LIVE_WORKER_ORIGIN.includes("REPLACE_WITH_");
  }
  function readReferences() {
    try {
      const value = JSON.parse(localStorage.getItem(LAST_REFERENCES_KEY) || "[]");
      return Array.isArray(value) ? value.filter(x => typeof x === "string").slice(-15) : [];
    } catch (_) { return []; }
  }
  function storeReference(reference) {
    if (!/^NIBMETA1_[a-f0-9]{32}$/.test(reference)) return;
    try {
      const refs = [...new Set([...readReferences(), reference])].slice(-15);
      localStorage.setItem(LAST_REFERENCES_KEY, JSON.stringify(refs));
    } catch (_) { /* local storage may be unavailable */ }
  }
  async function withdrawStoredReferences() {
    const refs = readReferences();
    try { localStorage.removeItem(LAST_REFERENCES_KEY); }
    catch (_) { /* ignore */ }
    if (!bridgeConfigured()) return;
    for (const reference of refs) {
      try {
        await fetch(LIVE_WORKER_ORIGIN + "/consent-withdraw", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
          mode: "cors"
        });
      } catch (_) { /* best effort: do not block the visitor */ }
    }
  }

  function startPixel() {
    if (enabled) return;
    enabled = true;
    !function(f,b,e,v,n,t,s) {
      if(f.fbq)return;
      n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];
      t=b.createElement(e);t.async=!0;t.src=v;
      s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s);
    }(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");
    if (typeof window.fbq === "function") {
      window.fbq("init", PIXEL_ID);
      window.fbq("track", "PageView");
      if (location.pathname === "/" || location.pathname.endsWith("/index.html")) {
        window.fbq("track", "ViewContent", {
          content_ids: ["nib_ebook"], content_type: "product",
          value: 29, currency: "USD"
        });
      }
    }
  }

  function showConsent() {
    document.getElementById("nib-consent")?.remove();
    const panel = document.createElement("div");
    panel.id = "nib-consent";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Optional advertising tracking");
    Object.assign(panel.style, {
      position: "fixed", zIndex: 99999, left: "12px", right: "12px",
      bottom: "12px", maxWidth: "640px", margin: "auto",
      border: "1px solid #7cff1f", borderRadius: "12px",
      padding: "17px", background: "#101310", color: "white",
      boxShadow: "0 10px 50px #0009", font: "14px/1.5 system-ui,sans-serif"
    });
    const intro = document.createElement("p");
    intro.textContent =
      "May we use optional Meta advertising tracking to measure website visits, checkout clicks and purchases? If you buy after agreeing, we may share the purchase value, a hashed version of your checkout email, and browser details (such as Meta cookies, IP address and user agent) with Meta. You can decline and still buy.";
    intro.style.margin = "0 0 12px";
    panel.appendChild(intro);
    for (const [label, decision] of [["No thanks", "denied"], ["Allow tracking", "granted"]]) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      Object.assign(button.style, {
        cursor: "pointer", border: "1px solid #7cff1f",
        borderRadius: "8px", padding: "9px 14px", marginRight: "10px",
        marginBottom: "4px", fontWeight: "700",
        background: decision === "granted" ? "#7cff1f" : "transparent",
        color: decision === "granted" ? "#071007" : "white"
      });
      button.addEventListener("click", () => {
        const previous = getConsent();
        saveConsent(decision);
        panel.remove();
        if (decision === "granted") startPixel();
        else if (enabled || previous === "granted") {
          void withdrawStoredReferences().finally(() => location.reload());
        } else {
          void withdrawStoredReferences();
        }
      });
      panel.appendChild(button);
    }
    document.body.appendChild(panel);
  }

  function ordinaryClick(event, anchor) {
    return event.cancelable && event.button === 0 &&
      !event.metaKey && !event.ctrlKey && !event.shiftKey &&
      !event.altKey && (!anchor.target || anchor.target === "_self");
  }

  async function consentedCheckout(product, originalUrl) {
    if (!bridgeConfigured()) return originalUrl;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 2300);
    try {
      const response = await fetch(LIVE_WORKER_ORIGIN + "/checkout-intent", {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: product.id, consent: "granted", consent_version: CONSENT_VERSION,
          fbp: cookie("_fbp"), fbc: cookie("_fbc")
        }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error("Consent handoff unavailable");
      const data = await response.json();
      const redirect = new URL(data.url);
      // Only allow the known Stripe checkout base URL (plus reference query parameter).
      if (redirect.origin + redirect.pathname !== originalUrl ||
          !/^NIBMETA1_[a-f0-9]{32}$/.test(data.reference)) {
        throw new Error("Invalid checkout handoff");
      }
      storeReference(data.reference);
      return redirect.href;
    } catch (_) {
      // A tracking outage must never prevent an eBook sale.
      return originalUrl;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function detectCheckout(event) {
    const target = event.target;
    const anchor = target instanceof Element ? target.closest("a[href]") : null;
    if (!anchor) return;
    let key;
    try {
      const url = new URL(anchor.href, location.href);
      key = url.origin + url.pathname;
    } catch (_) { return; }
    const product = CHECKOUTS[key];
    if (!product) return;

    // A declined / missing choice still goes to Stripe normally.
    if (getConsent() !== "granted") return;

    if (enabled && typeof window.fbq === "function") {
      window.fbq("track", "InitiateCheckout", {
        content_type: "product", content_ids: [product.id],
        content_name: product.name, value: product.value,
        currency: "USD", num_items: 1
      });
    }
    if (!ordinaryClick(event, anchor)) return;
    event.preventDefault();
    void consentedCheckout(product, key).then(destination => {
      window.location.assign(destination);
    });
  }

  function init() {
    const footer = document.querySelector("footer");
    if (footer && !document.getElementById("nib-tracking-preferences")) {
      const button = document.createElement("button");
      button.id = "nib-tracking-preferences";
      button.textContent = "Tracking preferences";
      button.type = "button";
      Object.assign(button.style, {
        background: "transparent", color: "inherit", border: "none",
        textDecoration: "underline", cursor: "pointer",
        margin: "8px", font: "inherit"
      });
      button.addEventListener("click", showConsent);
      footer.appendChild(button);
    }
    document.addEventListener("click", detectCheckout, true);
    const choice = getConsent();
    if (choice === "granted") startPixel();
    else if (choice === null) showConsent();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
