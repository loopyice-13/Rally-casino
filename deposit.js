document.getElementById("depositForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  requireAuth();
  const fd = new FormData(e.target);
  const payload = Object.fromEntries(fd.entries());
  const data = await api("/payments/deposit", "POST", payload);
  location.href = data.checkout_url;
});