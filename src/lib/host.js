// Site identity: every decision is stored per hostname, "www." folded into the bare domain.
(function (root) {
  "use strict";

  /** Lower-cases and strips "www.". Example: normalizeHost("WWW.GitHub.com") -> "github.com" */
  function normalizeHost(hostname) {
    if (typeof hostname !== "string" || hostname === "") {
      throw new Error(`normalizeHost: expected a non-empty hostname string, got ${JSON.stringify(hostname)}`);
    }
    return hostname.toLowerCase().replace(/^www\./, "");
  }

  /** Storage key of a site record. Example: siteKey("github.com") -> "site:github.com" */
  function siteKey(hostname) {
    return "site:" + normalizeHost(hostname);
  }

  /**
   * Hostname of the top page, so embedded iframes follow the page's decision instead of their own.
   * ancestorOrigins is Chromium-only, which is the only target. Returns "" for file:/about: pages.
   * Example: topHostname(location) -> "github.com"
   */
  function topHostname(loc) {
    const origins = loc.ancestorOrigins;
    if (!origins || origins.length === 0) return loc.hostname || "";
    try {
      return new URL(origins[origins.length - 1]).hostname;
    } catch {
      return "";
    }
  }

  root.DarkSwitch = Object.assign(root.DarkSwitch || {}, { normalizeHost, siteKey, topHostname });
})(globalThis);
