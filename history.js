let cursor = 0;
let current = [];

function badgeColor(status) {
  if (status === 'completed' || status === 'approved') return 'rgba(50,213,131,.16)';
  if (status === 'pending') return 'rgba(247,201,72,.14)';
  return 'rgba(255,93,108,.14)';
}

function row(tx) {
  const sign = tx.type === 'game_loss' || tx.type === 'withdrawal' ? '-' : '+';
  const title = tx.type.replace('_', ' ');
  return `<div class="game" style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center"><div><h3 style="margin:0 0 6px">${title}</h3><div class="small">${new Date(tx.createdAt).toLocaleString()}</div></div><div style="text-align:right"><div style="font-weight:900">${sign}${APP.currency} ${Number(tx.amount).toFixed(2)}</div><div class="tag" style="background:${badgeColor(tx.status)}">${tx.status}</div></div></div><div class="small" style="margin-top:8px">Ref: ${tx.reference || '—'}</div></div>`;
}

async function loadHistory(reset = false) {
  const type = document.getElementById('typeFilter').value;
  const status = document.getElementById('statusFilter').value;

  if (reset) {
    cursor = 0;
    current = [];
    document.getElementById('historyList').innerHTML = '';
  }

  const data = await api(`/api/wallet/transactions?type=${encodeURIComponent(type)}&status=${encodeURIComponent(status)}&limit=10&cursor=${cursor}`);
  current = current.concat(data.items || []);
  cursor = data.nextCursor ? Number(data.nextCursor) : cursor;
  document.getElementById('historyList').innerHTML = current.map(row).join('') || '<div class="small">No transactions yet.</div>';
  document.getElementById('loadMoreBtn').style.display = data.nextCursor ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('typeFilter')?.addEventListener('change', () => loadHistory(true));
  document.getElementById('statusFilter')?.addEventListener('change', () => loadHistory(true));
  document.getElementById('loadMoreBtn')?.addEventListener('click', loadHistory);
  loadHistory(true).catch(err => toast(err.message, true));
});
