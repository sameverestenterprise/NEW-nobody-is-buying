/* Nobody Is Buying — Meta browser events (2026-10-29)
   Pixel: 1643741683962753
   Purchase is NOT sent from this file. Stripe webhooks are required for purchases.
   This script requires explicit visitor opt-in, as in the original installation.
*/
(() => {
  "use strict";

  const PIXEL_ID = "1643741683962753";
  const CONSENT_KEY = "nib_meta_tracking_consent_v1";
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

  function getConsent() {
    try { return localStorage.getItem(CONSENT_KEY); }
    catch (_) { return null; }
  }

  function saveConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); }
    catch (_) { /* If blocked, the choice applies only this page load. */ }
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
          content_ids: ["nib_ebook"],
          content_type: "product",
          value: 29,
          currency: "USD"
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
      "May we use optional Meta advertising tracking to measure page visits and checkout clicks? You can decline and still use the website.";
    intro.style.margin = "0 0 12px";
    panel.appendChild(intro);

    for (const [label, decision] of [["No thanks", "denied"], ["Allow tracking", "granted"]]) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      Object.assign(button.style, {
        cursor: "pointer", border: "1px solid #7cff1f",
        borderRadius: "8px", padding: "9px 14px",
        marginRight: "10px", marginBottom: "4px",
        fontWeight: "700",
        background: decision === "granted" ? "#7cff1f" : "transparent",
        color: decision === "granted" ? "#071007" : "white"
      });
      button.addEventListener("click", () => {
        saveConsent(decision);
        panel.remove();
        if (decision === "granted") startPixel();
        else if (enabled) location.reload();
      });
      panel.appendChild(button);
    }

    document.body.appendChild(panel);
  }

  function detectCheckout(event) {
    if (!enabled || typeof window.fbq !== "function") return;

    const target = event.target;
    const anchor = target instanceof Element ? target.closest("a[href]") : null;
    if (!anchor) return;

    let key;
    try {
      const url = new URL(anchor.href, location.href);
      key = url.origin + url.pathname;
    } catch (_) {
      return;
    }

    const product = CHECKOUTS[key];
    if (!product) return;

    // The log lets us verify that the link click handler actually ran in Safari.
    console.info("[NIB Tracking] InitiateCheckout detected:", product.id, "$" + product.value);

    window.fbq("track", "InitiateCheckout", {
      content_type: "product",
      content_ids: [product.id],
      content_name: product.name,
      value: product.value,
      currency: "USD",
      num_items: 1
    });

    // Safari can cancel a network request if the page is unloaded immediately.
    // Give the Pixel 350 ms to dispatch, without opening extra tabs or changing
    // the URL. Preserve Command/Ctrl/Shift-click and middle-click behavior.
    if (
      event.cancelable &&
      event.button === 0 &&
      !event.metaKey && !event.ctrlKey &&
      !event.shiftKey && !event.altKey &&
      (!anchor.target || anchor.target === "_self")
    ) {
      event.preventDefault();
      const destination = anchor.href;
      window.setTimeout(() => { window.location.assign(destination); }, 350);
    }
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
