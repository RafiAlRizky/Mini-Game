function Pemain(nama, energi){
    let pemain = {};
    pemain.nama = nama;
    pemain.energi = energi;

    pemain.makan = function(porsi){
        this.energi += porsi;
        console.log(`Halo ${this.nama}, selamat makan!`);
    }

    pemain.damage = function(hit){
        this.energi -= hit;
        console.log(`Halo ${this.nama}, Kamu terkena Damage!`);
    }

    return pemain;
}


function createPlayer(nama, energi){
    const p = Pemain(nama, energi);
    if (p.energi < 0) p.energi = 0;
    return p;
}

let pemain1 = createPlayer('Asep', 100);
let pemain2 = createPlayer('Budi', 100);

const MAX_ENERGY = 100;

// DOM shortcuts
const el = id => document.getElementById(id);
const logEl = el('log');

function renderPlayerCard(containerId, pemain, isSelf){
    const container = el(containerId);
    const energyPct = Math.max(0, Math.min(100, Math.round((pemain.energi / MAX_ENERGY) * 100)));
    const isTurn = (containerId === currentTurn); // show turn even when Auto Duel off
    
    // Add/remove current-turn class for styling
    container.classList.toggle('current-turn', isTurn);
    
    container.innerHTML = `
        <h3>${pemain.nama}${isTurn ? ' <small>Giliran</small>' : ''}</h3>
        <div class="energy-info">
            <span>Energi:</span>
            <strong id="${containerId}-energy">${pemain.energi}</strong>
            <span>/ ${MAX_ENERGY}</span>
        </div>
        <div class="bar" aria-hidden="true"><div class="fill" style="width:${energyPct}%;"></div></div>
        <div class="controls">
            <button class="attack" data-player="${containerId}">⚔️ Attack</button>
            <button class="heal" data-player="${containerId}">💚 Heal</button>
        </div>
    `;

    // bind buttons
    const attackBtn = container.querySelector('button.attack');
    const healBtn = container.querySelector('button.heal');

    // disable buttons when it's not this player's turn (for manual play)
    attackBtn.disabled = !isTurn || !!autoInterval;
    healBtn.disabled = !isTurn || !!autoInterval;

    attackBtn.addEventListener('click', () => {
        if (gameOver) return;
        // Block manual actions while Auto Duel is running
        if (autoInterval){
            appendLog(`Auto Duel aktif — matikan untuk aksi manual.`);
            return;
        }
        // enforce turn for manual play
        if (containerId !== currentTurn){
            appendLog(`Bukan giliran ${pemain.nama}.`);
            return;
        }
        if (containerId === 'player1') doAttack(pemain1, pemain2);
        else doAttack(pemain2, pemain1);

        // after a manual action, switch turn if game not ended
        if (!gameOver){
            currentTurn = (currentTurn === 'player1') ? 'player2' : 'player1';
            updateUI();
        }
    });

    healBtn.addEventListener('click', () => {
        if (gameOver) return;
        // Block manual actions while Auto Duel is running
        if (autoInterval){
            appendLog(`Auto Duel aktif — matikan untuk aksi manual.`);
            return;
        }
        // enforce turn for manual play
        if (containerId !== currentTurn){
            appendLog(`Bukan giliran ${pemain.nama}.`);
            return;
        }
        if (containerId === 'player1') doHeal(pemain1);
        else doHeal(pemain2);

        // after a manual action, switch turn if game not ended
        if (!gameOver){
            currentTurn = (currentTurn === 'player1') ? 'player2' : 'player1';
            updateUI();
        }
    });
}

function updateUI(){
    renderPlayerCard('player1', pemain1, true);
    renderPlayerCard('player2', pemain2, false);
    el('maxEnergyLabel').textContent = MAX_ENERGY;
}

function appendLog(text){
    const time = new Date().toLocaleTimeString();
    logEl.innerHTML = `[${time}] ${text}<br>` + logEl.innerHTML;
}

function doAttack(attacker, defender){
    const hit = Math.floor(Math.random() * 20) + 5; // 5..24
    defender.damage(hit);
    
    // Add damage animation
    const defenderEl = el(defender === pemain1 ? 'player1' : 'player2');
    defenderEl.classList.add('damage');
    setTimeout(() => defenderEl.classList.remove('damage'), 600);
    
    appendLog(`⚔️ ${attacker.nama} menyerang ${defender.nama} dan memberikan ${hit} damage!`);
    clampAndCheck();
    updateUI();
}

function doHeal(pemain){
    const heal = Math.floor(Math.random() * 15) + 5; // 5..19
    pemain.makan(heal);
    if (pemain.energi > MAX_ENERGY) pemain.energi = MAX_ENERGY;
    
    // Add heal animation
    const pemainEl = el(pemain === pemain1 ? 'player1' : 'player2');
    pemainEl.classList.add('heal');
    setTimeout(() => pemainEl.classList.remove('heal'), 600);
    
    appendLog(`💚 ${pemain.nama} memulihkan ${heal} energi!`);
    updateUI();
}

function clampAndCheck(){
    if (pemain1.energi <= 0 && pemain2.energi <= 0){
        appendLog('Skor seri! Keduanya jatuh pada saat yang sama.');
        endGame();
    } else if (pemain1.energi <= 0){
        appendLog(`${pemain2.nama} menang! ${pemain1.nama} kalah.`);
        endGame();
    } else if (pemain2.energi <= 0){
        appendLog(`${pemain1.nama} menang! ${pemain2.nama} kalah.`);
        endGame();
    }
}

let gameOver = false;
let autoInterval = null;
// track whose turn it is during Auto Duel: 'player1' or 'player2'
let currentTurn = 'player1';

function endGame(){
    gameOver = true;
    if (autoInterval) { clearInterval(autoInterval); autoInterval = null; }
}

function resetGame(){
    if (autoInterval) { clearInterval(autoInterval); autoInterval = null; }
    pemain1 = createPlayer('Asep', 100);
    pemain2 = createPlayer('Budi', 100);
    gameOver = false;
    currentTurn = 'player1';
    appendLog('Game di-reset. Siap bertanding!');
    updateUI();
}

function startAutoDuel(){
    const btn = el('autoBtn');
    if (autoInterval) { 
        clearInterval(autoInterval); 
        autoInterval = null; 
        appendLog('🎮 Auto Duel dimatikan.'); 
        btn.classList.remove('active');
        updateUI(); 
        return; 
    }
    appendLog('🎲 Auto Duel dimulai.');
    btn.classList.add('active');
    // Ensure turn starts from currentTurn (could be left from previous run)
    updateUI();
    autoInterval = setInterval(() => {
        if (gameOver) { clearInterval(autoInterval); autoInterval = null; updateUI(); return; }

        // Determine actor and defender based on currentTurn
        const actor = (currentTurn === 'player1') ? pemain1 : pemain2;
        const defender = (currentTurn === 'player1') ? pemain2 : pemain1;

        // Decide action: small chance to heal instead of attacking
        const doHealing = (Math.random() < 0.2); // 20% chance to heal on your turn

        if (doHealing){
            doHeal(actor);
        } else {
            doAttack(actor, defender);
        }

        // After the action, check if game ended
        if (gameOver){
            clearInterval(autoInterval); autoInterval = null; updateUI(); return;
        }

        // Switch turn for next tick and refresh UI so turn label updates
        currentTurn = (currentTurn === 'player1') ? 'player2' : 'player1';
        updateUI();
    }, 800);
}

document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    appendLog('Game siap. Tekan Attack atau Heal untuk bermain.');
    el('resetBtn').addEventListener('click', resetGame);
    el('autoBtn').addEventListener('click', startAutoDuel);
});
