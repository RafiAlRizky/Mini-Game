function Pemain(nama, energi) {
    let pemain = {};
    pemain.nama = nama;
    pemain.energi = energi;
    pemain.weaponBonus = 0;
    pemain.inventory = { senjata: [], makanan: [] };

    pemain.makan = function(porsi) {
        this.energi += porsi;
        console.log(`Halo ${this.nama}, selamat makan!`);
    }

    pemain.damage = function(hit) {
        this.energi -= hit;
        console.log(`Halo ${this.nama}, Kamu terkena Damage!`);
    }

    pemain.useItem = function(type, index) {
        if (type === 'senjata') {
            const item = this.inventory.senjata[index];
            if (!item) return;
            this.weaponBonus = item.damage;
            appendLog(`${this.nama} menggunakan ${item.nama}, damage bertambah ${item.damage}!`);
            this.inventory.senjata.splice(index, 1);
        } 
        else if (type === 'makanan') {
            const item = this.inventory.makanan[index];
            if (!item) return;
            this.makan(item.heal);
            appendLog(`${this.nama} memakan ${item.nama}, energi +${item.heal}!`);
            this.inventory.makanan.splice(index, 1);
            if (this.energi > MAX_ENERGY) this.energi = MAX_ENERGY;
        }
    }

    return pemain;
}

function createPlayer(nama, energi) {
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

function renderPlayerCard(containerId, pemain, isSelf) {
    const container = el(containerId);
    const energyPct = Math.max(0, Math.min(100, Math.round((pemain.energi / MAX_ENERGY) * 100)));
    const isTurn = (containerId === currentTurn);

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
        <div class="inventory">
            <h4>🎒 Inventory</h4>
            <div class="items">
                <strong>Senjata:</strong><br>
                ${pemain.inventory.senjata.length ? pemain.inventory.senjata.map((item,i)=>
                    `<button class="use-item" data-type="senjata" data-index="${i}">${item.nama}</button>`
                ).join(' ') : '<em>kosong</em>'}
                <br><strong>Makanan:</strong><br>
                ${pemain.inventory.makanan.length ? pemain.inventory.makanan.map((item,i)=>
                    `<button class="use-item" data-type="makanan" data-index="${i}">${item.nama}</button>`
                ).join(' ') : '<em>kosong</em>'}
            </div>
        </div>
    `;

    const attackBtn = container.querySelector('button.attack');
    const healBtn = container.querySelector('button.heal');

    attackBtn.disabled = !isTurn || !!autoInterval;
    healBtn.disabled = !isTurn || !!autoInterval;

    attackBtn.addEventListener('click', () => {
        if (gameOver) return;
        if (autoInterval){ appendLog(`Auto Duel aktif — matikan untuk aksi manual.`); return; }
        if (containerId !== currentTurn){ appendLog(`Bukan giliran ${pemain.nama}.`); return; }
        if (containerId === 'player1') doAttack(pemain1, pemain2);
        else doAttack(pemain2, pemain1);
        if (!gameOver){ currentTurn = (currentTurn === 'player1') ? 'player2' : 'player1'; updateUI(); }
    });

    healBtn.addEventListener('click', () => {
        if (gameOver) return;
        if (autoInterval){ appendLog(`Auto Duel aktif — matikan untuk aksi manual.`); return; }
        if (containerId !== currentTurn){ appendLog(`Bukan giliran ${pemain.nama}.`); return; }
        if (containerId === 'player1') doHeal(pemain1);
        else doHeal(pemain2);
        if (!gameOver){ currentTurn = (currentTurn === 'player1') ? 'player2' : 'player1'; updateUI(); }
    });

    // Tombol inventory
    container.querySelectorAll('.use-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            const index = parseInt(btn.dataset.index);
            pemain.useItem(type, index);
            updateUI();
        });
    });
}

function updateUI() {
    renderPlayerCard('player1', pemain1, true);
    renderPlayerCard('player2', pemain2, false);
    el('maxEnergyLabel').textContent = MAX_ENERGY;
}

function appendLog(text) {
    const time = new Date().toLocaleTimeString();
    logEl.innerHTML = `[${time}] ${text}<br>` + logEl.innerHTML;
}

function doAttack(attacker, defender) {
    const baseHit = Math.floor(Math.random() * 20) + 5; // 5..24
    const bonus = attacker.weaponBonus || 0;
    const totalHit = baseHit + bonus;
    defender.damage(totalHit);

    // Add damage animation
    const defenderEl = el(defender === pemain1 ? 'player1' : 'player2');
    defenderEl.classList.add('damage');
    setTimeout(() => defenderEl.classList.remove('damage'), 600);

    appendLog(`⚔️ ${attacker.nama} menyerang ${defender.nama} dengan damage ${totalHit} (${baseHit}+${bonus})!`);
    clampAndCheck();
    updateUI();
}

function doHeal(pemain) {
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

function clampAndCheck() {
    if (pemain1.energi <= 0 && pemain2.energi <= 0) {
        appendLog('Skor seri! Keduanya jatuh pada saat yang sama.');
        endGame();
    } else if (pemain1.energi <= 0) {
        appendLog(`${pemain2.nama} menang! ${pemain1.nama} kalah.`);
        endGame();
    } else if (pemain2.energi <= 0) {
        appendLog(`${pemain1.nama} menang! ${pemain2.nama} kalah.`);
        endGame();
    }
}

let gameOver = false;
let autoInterval = null;
let currentTurn = 'player1';

function endGame() {
    gameOver = true;
    if (autoInterval) { clearInterval(autoInterval); autoInterval = null; }
}

function resetGame() {
    if (autoInterval) { clearInterval(autoInterval); autoInterval = null; }
    pemain1 = createPlayer('Asep', 100);
    pemain2 = createPlayer('Budi', 100);
    pemain1.inventory.senjata = [{ nama: 'Pedang Baja', damage: 10 }];
    pemain1.inventory.makanan = [{ nama: 'Roti', heal: 10 }];
    pemain2.inventory.senjata = [{ nama: 'Pistol', damage: 15 }];
    pemain2.inventory.makanan = [{ nama: 'Nasi Goreng', heal: 20 }];
    gameOver = false;
    currentTurn = 'player1';
    appendLog('Game di-reset. Siap bertanding!');
    updateUI();
}

function startAutoDuel() {
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
    updateUI();
    autoInterval = setInterval(() => {
        if (gameOver) { clearInterval(autoInterval); autoInterval = null; updateUI(); return; }
        const actor = (currentTurn === 'player1') ? pemain1 : pemain2;
        const defender = (currentTurn === 'player1') ? pemain2 : pemain1;
        const doHealing = (Math.random() < 0.2);
        if (doHealing) doHeal(actor);
        else doAttack(actor, defender);
        if (gameOver) { clearInterval(autoInterval); autoInterval = null; updateUI(); return; }
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
