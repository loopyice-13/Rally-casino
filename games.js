const cards = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const cardValues = { A:11, J:10, Q:10, K:10 };
const wheelSlots = [2, 1.5, 0, 3, 0.5, 5, 1.2, 0, 2.5, 10];
const rouletteNumbers = Array.from({length:37}, (_,i)=>i);

function qp(name){ return new URLSearchParams(location.search).get(name); }
function rnd(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function rand(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function stakeVal(){ return Number(document.getElementById("stake")?.value || 0); }

function cardLabel(c){ return c; }
function shuffle(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function renderBase(title, desc, bodyHtml){
  document.getElementById("gameStage").innerHTML = `
    <div class="card panel">
      <div class="kicker">Casino game</div>
      <h2>${title}</h2>
      <p style="color:var(--muted)">${desc}</p>
    </div>
    <div class="card panel" style="margin-top:14px">
      <div class="two">
        <input class="field" id="stake" type="number" min="10" placeholder="Stake (GHS)">
        <button class="btn btn-primary" id="playBtn">Place bet</button>
      </div>
      <div style="margin-top:16px">${bodyHtml}</div>
      <div id="gameResult" style="margin-top:16px"></div>
    </div>`;
}

function drawResult(text, good=true){
  document.getElementById("gameResult").innerHTML = `<div class="notice" style="background:${good ? "rgba(50,213,131,.08)" : "rgba(255,93,108,.08)"};border-color:${good ? "rgba(50,213,131,.2)" : "rgba(255,93,108,.2)"}">${text}</div>`;
}

async function settleGame(game, stake){
  const data = await api("/games/play", "POST", { game, stake });
  drawResult(data.message, data.won);
  await refreshWallet();
}

function slots() {
  renderBase("Slots", "Spin 3 reels. Match 3 of a kind to win.", `
    <div id="slotLine" class="notice">🎰 🎰 🎰</div>
  `);
  document.getElementById("playBtn").onclick = async ()=>{
    const s = stakeVal(); if (!s || s < 10) return drawResult("Enter a valid stake.", false);
    const reels = [rnd(cards), rnd(cards), rnd(cards)];
    document.getElementById("slotLine").innerHTML = `🎰 ${reels.join(" | ")} 🎰`;
    const win = reels[0] === reels[1] && reels[1] === reels[2];
    const data = await api("/games/play", "POST", { game:"slots", stake:s });
    drawResult(win ? `Jackpot! ${reels[0]} ${reels[1]} ${reels[2]} — ${data.message}` : "No match this spin.", win);
    await refreshWallet();
  };
}

function blackjack() {
  renderBase("Blackjack", "Get as close to 21 as possible.", `
    <div class="two">
      <button class="btn btn-secondary" id="hitBtn">Hit</button>
      <button class="btn btn-secondary" id="standBtn">Stand</button>
    </div>
    <div id="bjTable" class="notice" style="margin-top:12px">Start a round to see cards.</div>
  `);
  let player = [], dealer = [], over = false;

  function score(hand){
    let s = hand.reduce((a,c)=>a+(cardValues[c] || Number(c)),0);
    let aces = hand.filter(c=>c==="A").length;
    while(s > 21 && aces>0){ s -= 10; aces--; }
    return s;
  }
  function show(){
    document.getElementById("bjTable").innerHTML = `Player: ${player.join(", ")} (${score(player)})<br>Dealer: ${dealer.join(", ")} (${score(dealer)})`;
  }
  document.getElementById("playBtn").onclick = async ()=>{
    const s = stakeVal(); if (!s || s < 10) return drawResult("Enter a valid stake.", false);
    const data = await api("/games/play", "POST", { game:"blackjack", stake:s });
    player=[rnd(cards),rnd(cards)]; dealer=[rnd(cards),rnd(cards)]; over=false; show();
    drawResult(data.message + " (round settled by backend)", data.won);
    await refreshWallet();
  };
  document.getElementById("hitBtn").onclick = ()=>{
    if(over) return;
    player.push(rnd(cards)); show();
    if(score(player) > 21){ over=true; drawResult("Bust!", false); }
  };
  document.getElementById("standBtn").onclick = ()=>{ if(!over){ over=true; drawResult("Stand complete.", true); } };
}

function roulette() {
  renderBase("Roulette", "Bet red, black, odd, even, or a number.", `
    <div class="two">
      <select class="field" id="choice">
        <option value="red">Red</option>
        <option value="black">Black</option>
        <option value="odd">Odd</option>
        <option value="even">Even</option>
        <option value="number">Exact number</option>
      </select>
      <input class="field" id="numberPick" type="number" min="0" max="36" placeholder="Number 0-36">
    </div>
    <div id="wheel" class="notice" style="margin-top:12px">Wheel waiting...</div>
  `);
  document.getElementById("playBtn").onclick = async ()=>{
    const s = stakeVal(); if (!s || s < 10) return drawResult("Enter a valid stake.", false);
    const n = rand(0,36);
    const color = n === 0 ? "green" : (n % 2 === 0 ? "black" : "red");
    const choice = document.getElementById("choice").value;
    const np = Number(document.getElementById("numberPick").value);
    document.getElementById("wheel").textContent = `Ball landed on ${n} (${color})`;
    const win = choice==="number" ? n===np : choice===color || (choice==="odd" && n%2===1) || (choice==="even" && n%2===0);
    const data = await api("/games/play", "POST", { game:"roulette", stake:s });
    drawResult(win ? `You guessed right. ${data.message}` : "No luck this round.", win);
    await refreshWallet();
  };
}

function baccarat() {
  renderBase("Baccarat", "Back player or banker.", `
    <div class="two">
      <button class="btn btn-secondary" id="playerPick">Player</button>
      <button class="btn btn-secondary" id="bankerPick">Banker</button>
    </div>
    <div id="bacTable" class="notice" style="margin-top:12px">Waiting for deal...</div>
  `);
  let pick = "player";
  document.getElementById("playerPick").onclick = ()=> pick="player";
  document.getElementById("bankerPick").onclick = ()=> pick="banker";
  document.getElementById("playBtn").onclick = async ()=>{
    const s = stakeVal(); if (!s || s < 10) return drawResult("Enter a valid stake.", false);
    const player = rand(0,9)+rand(0,9);
    const banker = rand(0,9)+rand(0,9);
    const winner = player > banker ? "player" : banker > player ? "banker" : "tie";
    document.getElementById("bacTable").textContent = `Player ${player} vs Banker ${banker}`;
    const data = await api("/games/play", "POST", { game:"baccarat", stake:s, choice: pick });
    const win = pick === winner;
    drawResult(win ? `Correct pick. ${data.message}` : `Winner was ${winner}.`, win);
    await refreshWallet();
  };
}

function dice() {
  renderBase("Dice", "Guess high or low.", `
    <div class="two">
      <button class="btn btn-secondary" id="highPick">High</button>
      <button class="btn btn-secondary" id="lowPick">Low</button>
    </div>
    <div id="diceBox" class="notice" style="margin-top:12px">Roll pending...</div>
  `);
  let pick="high";
  document.getElementById("highPick").onclick = ()=> pick="high";
  document.getElementById("lowPick").onclick = ()=> pick="low";
  document.getElementById("playBtn").onclick = async ()=>{
    const s = stakeVal(); if (!s || s < 10) return drawResult("Enter a valid stake.", false);
    const roll = rand(1,6)+rand(1,6);
    document.getElementById("diceBox").textContent = `Rolled ${roll}`;
    const data = await api("/games/play", "POST", { game:"dice", stake:s, choice: pick });
    const win = pick==="high" ? roll>=7 : roll<=6;
    drawResult(win ? `Nice call. ${data.message}` : "Wrong side.", win);
    await refreshWallet();
  };
}

function crash() {
  renderBase("Crash", "Cash out before the multiplier crashes.", `
    <div id="crashLine" class="notice">Multiplier: x1.00</div>
    <div class="two" style="margin-top:12px">
      <button class="btn btn-secondary" id="cashBtn">Cash Out</button>
      <button class="btn btn-secondary" id="startCrash">Start Round</button>
    </div>
  `);
  let running=false, mult=1, timer=null;
  function stop(){ if(timer) clearInterval(timer); running=false; }
  document.getElementById("startCrash").onclick = async ()=>{
    const s = stakeVal(); if (!s || s < 10) return drawResult("Enter a valid stake.", false);
    stop(); mult=1; running=true;
    document.getElementById("crashLine").textContent = `Multiplier: x${mult.toFixed(2)}`;
    const crashAt = (Math.random()*4)+1.2;
    timer = setInterval(()=>{
      mult += 0.06;
      document.getElementById("crashLine").textContent = `Multiplier: x${mult.toFixed(2)}`;
      if(mult >= crashAt){ stop(); drawResult(`Crashed at x${crashAt.toFixed(2)}.`, false); }
    }, 120);
  };
  document.getElementById("cashBtn").onclick = async ()=>{
    if(!running) return drawResult("Start a round first.", false);
    stop();
    const s = stakeVal();
    const data = await api("/games/play", "POST", { game:"crash", stake:s });
    drawResult(`Cashed at x${mult.toFixed(2)}. ${data.message}`, true);
    await refreshWallet();
  };
  document.getElementById("playBtn").onclick = ()=> drawResult("Use Start Round and Cash Out.", true);
}

function highlow() {
  renderBase("High-Low", "Guess whether the next card is higher or lower.", `
    <div class="two">
      <button class="btn btn-secondary" id="higherPick">Higher</button>
      <button class="btn btn-secondary" id="lowerPick">Lower</button>
    </div>
    <div id="hlBox" class="notice" style="margin-top:12px">Card will appear here.</div>
  `);
  let current = rand(1,13), pick="higher";
  document.getElementById("higherPick").onclick = ()=> pick="higher";
  document.getElementById("lowerPick").onclick = ()=> pick="lower";
  function show(){ document.getElementById("hlBox").textContent = `Current card value: ${current}`; }
  show();
  document.getElementById("playBtn").onclick = async ()=>{
    const s = stakeVal(); if (!s || s < 10) return drawResult("Enter a valid stake.", false);
    const next = rand(1,13);
    const win = pick==="higher" ? next > current : next < current;
    const data = await api("/games/play", "POST", { game:"highlow", stake:s, choice: pick });
    document.getElementById("hlBox").textContent = `Current ${current} → Next ${next}`;
    current = next;
    drawResult(win ? `Correct. ${data.message}` : "Incorrect guess.", win);
    await refreshWallet();
  };
}

function wheel() {
  renderBase("Mystery Wheel", "Spin for a random multiplier.", `
    <div id="wheelBox" class="notice">Press Spin.</div>
  `);
  document.getElementById("playBtn").textContent = "Spin";
  document.getElementById("playBtn").onclick = async ()=>{
    const s = stakeVal(); if (!s || s < 10) return drawResult("Enter a valid stake.", false);
    const m = rnd(wheelSlots);
    document.getElementById("wheelBox").textContent = `Wheel landed on x${m}`;
    const data = await api("/games/play", "POST", { game:"wheel", stake:s });
    drawResult(m > 0 ? `Wheel x${m}. ${data.message}` : "Wheel missed.", m > 0);
    await refreshWallet();
  };
}

window.addEventListener("load", async ()=>{
  requireAuth();
  paintShell();
  await refreshWallet();
  const game = qp("game") || "slots";
  if(game==="slots") slots();
  else if(game==="blackjack") blackjack();
  else if(game==="roulette") roulette();
  else if(game==="baccarat") baccarat();
  else if(game==="dice") dice();
  else if(game==="crash") crash();
  else if(game==="highlow") highlow();
  else if(game==="wheel") wheel();
});