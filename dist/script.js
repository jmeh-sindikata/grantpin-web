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

  const demo = document.querySelector(".run-demo");
  const stage = document.getElementById("mac-stage");
  const dialog = document.getElementById("demo-dialog");
  const touchSheet = document.getElementById("demo-touchid");
  const stepLabel = document.getElementById("mac-step-label");
  const touchNote = document.getElementById("touch-note");
  const touchNoteDefault = touchNote.textContent;
  const result = document.getElementById("demo-result");
  const reset = document.getElementById("demo-reset");
  const allow = document.getElementById("demo-allow");
  const allowHour = document.getElementById("demo-allow-hour");
  const deny = document.getElementById("demo-deny");
  const touch = document.getElementById("demo-touch");
  const touchCancel = document.getElementById("demo-touch-cancel");
  const touchPassword = document.getElementById("demo-touch-password");
  const announcement = document.getElementById("demo-announcement");
  // "dialog" (macOS alert) -> "touch" (Touch ID sheet) -> "result"
  let step = "dialog";
  function finish(allowed) {
    step = "result";
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
    stage.hidden = true;
    result.hidden = false;
    reset.focus({ preventScroll: true });
  }
  function showTouch(label) {
    step = "touch";
    dialog.hidden = true;
    touchSheet.hidden = false;
    stepLabel.textContent = "2 / 2 · Touch ID";
    touchNote.textContent = touchNoteDefault;
    announcement.textContent = `Example only: you chose ${label}. The system Touch ID sheet is next. Touch the simulated sensor to continue, or choose Cancel.`;
    touch.focus({ preventScroll: true });
  }
  function denyAtDialog() {
    finish(false);
    announcement.textContent =
      "Example only: command denied. Touch ID was never requested, the command did not run, and the decision was audited.";
  }
  function cancelTouch() {
    finish(false);
    announcement.textContent =
      "Example only: Touch ID cancelled. The command did not run, and the decision was audited.";
  }
  allow.addEventListener("click", () => showTouch("Allow once"));
  allowHour.addEventListener("click", () => showTouch("Allow for 1h"));
  deny.addEventListener("click", denyAtDialog);
  touch.addEventListener("click", () => {
    finish(true);
    announcement.textContent =
      "Example only: approval and Touch ID succeeded. The command ran, its output was redacted, and the decision was audited.";
  });
  touchCancel.addEventListener("click", cancelTouch);
  touchPassword.addEventListener("click", () => {
    touchNote.textContent =
      "Simulation: password entry is not part of this example. Click the fingerprint or choose Cancel.";
    announcement.textContent = touchNote.textContent;
    touch.focus({ preventScroll: true });
  });
  // Escape is Deny in the dialog and Cancel in the Touch ID sheet.
  demo.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (step === "dialog") denyAtDialog();
    else if (step === "touch") cancelTouch();
  });
  reset.addEventListener("click", () => {
    step = "dialog";
    result.hidden = true;
    touchSheet.hidden = true;
    dialog.hidden = false;
    stage.hidden = false;
    stepLabel.textContent = "1 / 2 · macOS dialog";
    announcement.textContent =
      "Example reset. A macOS dialog shows the command. Choose Deny, Allow once, or Allow for 1h.";
    deny.focus({ preventScroll: true });
  });
})();
