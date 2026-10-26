(() => {
  "use strict";
  const config = window.GRANTPIN_CONFIG || {};
  const downloadDialog = document.getElementById("download-dialog");
  document.querySelectorAll("[data-download]").forEach((link) => {
    if (config.downloadUrl) {
      try {
        const url = new URL(config.downloadUrl, window.location.href);
        if (!["https:", "http:"].includes(url.protocol))
          throw new Error("Invalid download protocol");
        link.href = url.href;
        return;
      } catch (_) {
        /* Keep the clearly labelled placeholder for an invalid URL. */
      }
    }
    link.addEventListener("click", (event) => {
      if (typeof downloadDialog.showModal !== "function") return;
      event.preventDefault();
      downloadDialog.showModal();
    });
  });
  if (config.downloadNote) {
    document.querySelectorAll("[data-download-note]").forEach((el) => {
      el.textContent = config.downloadNote;
    });
  }

  const request = document.getElementById("approval-card");
  const result = document.getElementById("demo-result");
  const reset = document.getElementById("demo-reset");
  const allow = document.getElementById("demo-allow");
  const allowHour = document.getElementById("demo-allow-hour");
  const deny = document.getElementById("demo-deny");
  const announcement = document.getElementById("demo-announcement");
  function choose(allowed) {
    document.getElementById("result-title").textContent = allowed
      ? "Permission granted."
      : "Your no means no.";
    document.getElementById("result-icon").textContent = allowed ? "✓" : "×";
    const description = document.getElementById("result-description");
    description.replaceChildren();
    description.append(
      allowed ? "The command gets the secret." : "The command doesn’t run.",
      document.createElement("br"),
      allowed
        ? "The agent gets redacted output."
        : "The secret stays in your vault.",
    );
    document.getElementById("result-output").textContent = allowed
      ? "API_KEY=[REDACTED:API_KEY]"
      : "denied: user_denied";
    request.hidden = true;
    result.hidden = false;
    announcement.textContent = allowed
      ? "Example only: approval and authentication succeeded. The command ran, its output was redacted, and the decision was audited."
      : "Example only: command denied. The command did not run, and the decision was audited.";
    reset.focus({ preventScroll: true });
  }
  allow.addEventListener("click", () => choose(true));
  allowHour.addEventListener("click", () => choose(true));
  deny.addEventListener("click", () => choose(false));
  reset.addEventListener("click", () => {
    result.hidden = true;
    request.hidden = false;
    announcement.textContent =
      "Example reset. Review the command and choose Allow once, Allow for 1h, or Deny.";
    allow.focus({ preventScroll: true });
  });
})();
