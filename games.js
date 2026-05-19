async function record(type, amount, status = 'completed', reference = '') {
  await api('/api/wallet/activity', 'POST', {
    type,
    amount,
    status,
    reference,
    note: 'game event'
  });
  await refreshWallet();
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function stakeValue(id) {
  const v = Number(document.getElementById(id)?.value || 0);
  if (!v || v <= 0) throw new Error('Enter a valid stake.');
  return v;
}

async function playCrash() {
  try {
    requireAuth();
    const s = stakeValue('crashStake');
    const result = rand(0, 10).toFixed(2);
    const win = Number(result) >= 3.2;
    document.getElementById('crashResult').textContent = `Crash at x${result}. ${win ? 'Win' : 'Lose'}`;
    await record(win ? 'game_win' : 'game_loss', s * (win ? 1.8 : 1), 'completed', `crash_${result}`);
  } catch (err) {
    toast(err.message, true);
  }
}

async function playHiLo(side) {
  try {
    requireAuth();
    const s = stakeValue('hiloStake');
    const a = Math.floor(Math.random() * 13) + 1;
    const b = Math.floor(Math.random() * 13) + 1;
    const win = side === 'higher' ? b > a : b < a;
    document.getElementById('hiloResult').textContent = `${a} → ${b}. ${win ? 'Win' : 'Lose'}`;
    await record(win ? 'game_win' : 'game_loss', s * (win ? 1.7 : 1), 'completed', `hilo_${side}`);
  } catch (err) {
    toast(err.message, true);
  }
}

async function playDice() {
  try {
    requireAuth();
    const s = stakeValue('diceStake');
    const roll = Math.random() * 100;
    const win = roll > 52;
    document.getElementById('diceResult').textContent = `Roll ${roll.toFixed(2)}. ${win ? 'Win' : 'Lose'}`;
    await record(win ? 'game_win' : 'game_loss', s * (win ? 1.9 : 1), 'completed', 'dice');
  } catch (err) {
    toast(err.message, true);
  }
}

async function playWheel() {
  try {
    requireAuth();
    const s = stakeValue('wheelStake');
    const slice = Math.floor(Math.random() * 8) + 1;
    const win = slice >= 6;
    document.getElementById('wheelResult').textContent = `Slice ${slice}. ${win ? 'Win' : 'Lose'}`;
    await record(win ? 'game_win' : 'game_loss', s * (win ? 2 : 1), 'completed', 'wheel');
  } catch (err) {
    toast(err.message, true);
  }
}

window.playCrash = playCrash;
window.playHiLo = playHiLo;
window.playDice = playDice;
window.playWheel = playWheel;
