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

async function handleDepositSubmit(e) {
  e.preventDefault();
  requireAuth();

  const form = getDepositForm();
  const screenshotInput = getScreenshotInput();
  const fd = new FormData(form);
  const file = screenshotInput.files?.[0];
  const error = validateScreenshot(file);

  if (error) {
    toast(error, true);
    return;
  }

  const captchaToken = window.hcaptcha ? window.hcaptcha.getResponse() : "";
  if (!captchaToken) {
    toast("Please complete the captcha.", true);
    return;
  }

  fd.append("momoNetwork", APP.momoNetwork);
  fd.append("momoNumber", APP.momoNumber);
  fd.append("currency", APP.currency);
  fd.append("status", "pending");
  fd.append("hcaptchaToken", captchaToken);

  try {
    toast("Submitting deposit...");
    await api("/api/deposits", "POST", fd);
    form.reset();
    resetPreview();
    resetCaptcha();
    await refreshWallet();
    toast("Deposit submitted. It is now pending approval.");
  } catch (err) {
    resetCaptcha();
    toast(err.message, true);
  }
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
});

window.handleDepositSubmit = handleDepositSubmit;

backend/routes/deposits.js
const express = require("express");
const { getUserByToken, addDeposit } = require("../store");

module.exports = (upload) => {
  const router = express.Router();

  async function verifyHcaptcha(token) {
    const secret = process.env.HCAPTCHA_SECRET_KEY;
    if (!secret) return true;
    if (!token) return false;

    const body = new URLSearchParams();
    body.append("response", token);
    body.append("secret", secret);

    const response = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });

    const data = await response.json();
    return !!data.success;
  }

  router.post("/", upload.single("screenshot"), async (req, res) => {
    try {
      const auth = req.headers.authorization || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
      const user = getUserByToken(token);
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const { amount, txId, senderName, senderPhone, note, momoNetwork, momoNumber, currency, hcaptchaToken } = req.body;

      if (!amount || !txId || !senderName || !senderPhone) {
        return res.status(400).json({ error: "All deposit fields are required." });
      }

      const ok = await verifyHcaptcha(hcaptchaToken);
      if (!ok) return res.status(400).json({ error: "Captcha verification failed." });

      if (!req.file) return res.status(400).json({ error: "Screenshot is required." });

      const deposit = {
        id: `dep_${Date.now()}`,
        amount: Number(amount),
        txId,
        senderName,
        senderPhone,
        note: note || "",
        momoNetwork,
        momoNumber,
        currency,
        screenshot: `/uploads/${req.file.filename}`,
        status: "pending",
        createdAt: new Date().toISOString()
      };

      user.pending += Number(amount);
      addDeposit(user, deposit);

      res.json({ ok: true, deposit });
    } catch {
      res.status(500).json({ error: "Deposit submission failed." });
    }
  });

  return router;
};
