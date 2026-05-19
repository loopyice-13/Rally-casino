async function submitWithdrawal(e) {
  e.preventDefault();
  requireAuth();

  const fd = new FormData(e.target);
  const payload = Object.fromEntries(fd.entries());

  try {
    toast('Submitting withdrawal...');
    await api('/api/withdrawals', 'POST', payload);
    e.target.reset();
    await refreshWallet();
    toast('Withdrawal request sent.');
  } catch (err) {
    toast(err.message, true);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('withdrawForm')?.addEventListener('submit', submitWithdrawal);
});
