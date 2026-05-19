const MAX_FILE_SIZE = APP.maxUploadMB * 1024 * 1024;

function humanMB(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getDepositForm() {
  return document.getElementById("depositForm");
}

function getScreenshotInput() {
  return document.getElementById("screenshot");
}

function getPreviewImage() {
  return document.getElementById("preview");
}

function resetPreview() {
  const preview = getPreviewImage();
  if (preview) {
    preview.src = "";
    preview.style.display = "none";
  }
}

function showPreview(file) {
  const preview = getPreviewImage();
  if (!preview) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    preview.src = reader.result;
    preview.style.display = "block";
  });
  reader.readAsDataURL(file);
}

function validateScreenshot(file) {
  if (!file) return "Please select a screenshot.";

  const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  if (!allowed.includes(file.type)) {
    return "Only JPG, PNG, or WEBP images are allowed.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return `Screenshot must be under ${APP.maxUploadMB} MB. Your file is ${humanMB(file.size)}.`;
  }

  return null;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = getDepositForm();
  const screenshotInput = getScreenshotInput();

  if (!form || !screenshotInput) return;

  screenshotInput.addEventListener("change", () => {
    const file = screenshotInput.files?.[0];
    const error = validateScreenshot(file);

    if (error) {
      screenshotInput.value = "";
      resetPreview();
      toast(error, true);
      return;
    }

    if (file) showPreview(file);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    requireAuth();

    const fd = new FormData(form);
    const file = screenshotInput.files?.[0];
    const error = validateScreenshot(file);

    if (error) {
      toast(error, true);
      return;
    }

    fd.append("momoNetwork", APP.momoNetwork);
    fd.append("momoNumber", APP.momoNumber);
    fd.append("currency", APP.currency);
    fd.append("status", "pending");

    try {
      toast("Submitting deposit...");
      await api("/api/deposits", "POST", fd);
      form.reset();
      resetPreview();
      await refreshWallet();
      toast("Deposit submitted. It is now pending approval.");
    } catch (err) {
      toast(err.message, true);
    }
  });
});
