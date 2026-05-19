document.getElementById("withdrawForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  requireAuth();
  const fd = new FormData(e.target);
  const payload = Object.fromEntries(fd.entries());
  const data = await api("/withdrawals/request", "POST", payload);
  toast(`Withdrawal request created: #${data.request.id}`);
});