// State management
let players = [];
const STORAGE_KEY = 'poker-calculator-data';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  renderPlayers();
  setupEventListeners();
});

// Event listeners
function setupEventListeners() {
  document.getElementById('add-player-btn').addEventListener('click', addPlayer);
  document.getElementById('calculate-btn').addEventListener('click', calculatePayouts);
  document.getElementById('clear-btn').addEventListener('click', clearAllData);
  document.getElementById('export-btn').addEventListener('click', exportData);
}

// Load data from localStorage
function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      players = JSON.parse(stored);
    }
    // Add initial player if none exist
    if (players.length === 0) {
      addPlayer();
    }
  } catch (error) {
    console.error('Error loading data:', error);
    players = [];
    addPlayer();
  }
}

// Save data to localStorage
function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Add new player
function addPlayer() {
  const player = {
    id: Date.now(),
    name: '',
    buyIn: 0,
    cashOut: 0,
    delta: 0
  };
  players.push(player);
  saveToStorage();
  renderPlayers();

  // Add animation class only to the new player
  setTimeout(() => {
    const newPlayerRow = document.querySelector(`[data-id="${player.id}"]`);
    if (newPlayerRow) {
      newPlayerRow.classList.add('new-player');
    }
  }, 0);
}

// Remove player
function removePlayer(id) {
  players = players.filter(p => p.id !== id);
  saveToStorage();
  renderPlayers();
}

// Update player data
function updatePlayer(id, field, value) {
  const player = players.find(p => p.id === id);
  if (player) {
    if (field === 'name') {
      player[field] = value;
    } else {
      const numValue = parseFloat(value) || 0;
      player[field] = numValue;

      // If updating delta manually, zero out buy-in and cash-out
      if (field === 'delta') {
        player.buyIn = 0;
        player.cashOut = 0;
      }
      // If updating buy-in or cash-out, recalculate delta
      else if (field === 'buyIn' || field === 'cashOut') {
        player.delta = (player.cashOut || 0) - (player.buyIn || 0);
      }
    }
    saveToStorage();
    updatePlayerDelta(id);
  }
}

// Render players list
function renderPlayers() {
  const playersList = document.getElementById('players-list');

  if (players.length === 0) {
    playersList.innerHTML = '<div class="empty-state">No players added yet. Click "Add Player" to start.</div>';
    return;
  }

  playersList.innerHTML = players.map((player, index) => {
    const delta = player.delta || 0;
    const deltaClass = delta > 0 ? 'delta-positive' : delta < 0 ? 'delta-negative' : 'delta-zero';

    return `
        <div class="player-row" data-id="${player.id}">
            <input 
                type="text" 
                class="player-input player-name-input"
                id="name-${player.id}" 
                value="${player.name}"
                placeholder="Name"
                onchange="updatePlayer(${player.id}, 'name', this.value)"
            />
            <input 
                type="number" 
                class="player-input player-number-input"
                id="buyin-${player.id}" 
                value="${player.buyIn || ''}"
                placeholder="0"
                step="0.01"
                onchange="updatePlayer(${player.id}, 'buyIn', this.value)"
            />
            <input 
                type="number" 
                class="player-input player-number-input"
                id="cashout-${player.id}" 
                value="${player.cashOut || ''}"
                placeholder="0"
                step="0.01"
                onchange="updatePlayer(${player.id}, 'cashOut', this.value)"
            />
            <input 
                type="number" 
                class="player-input player-number-input ${deltaClass}"
                id="delta-${player.id}" 
                value="${delta || ''}"
                placeholder="0"
                step="0.01"
                onchange="updatePlayer(${player.id}, 'delta', this.value)"
            />
            <button class="remove-player-btn-compact" onclick="removePlayer(${player.id})" title="Remove player">×</button>
        </div>
    `;
  }).join('');
}

// Update only the delta field for a specific player
function updatePlayerDelta(id) {
  const player = players.find(p => p.id === id);
  if (!player) return;

  const delta = player.delta || 0;
  const deltaClass = delta > 0 ? 'delta-positive' : delta < 0 ? 'delta-negative' : 'delta-zero';

  // Update delta field
  const deltaInput = document.getElementById(`delta-${id}`);
  if (deltaInput) {
    deltaInput.value = delta || '';
    deltaInput.className = `player-input player-number-input ${deltaClass}`;
  }

  // Update buy-in field (in case it was zeroed)
  const buyInInput = document.getElementById(`buyin-${id}`);
  if (buyInInput) {
    buyInInput.value = player.buyIn || '';
  }

  // Update cash-out field (in case it was zeroed)
  const cashOutInput = document.getElementById(`cashout-${id}`);
  if (cashOutInput) {
    cashOutInput.value = player.cashOut || '';
  }
}

// Calculate payouts with proportional dampening
function calculatePayouts() {
  const results = players.map(player => ({
    id: player.id,
    name: player.name || 'Unnamed Player',
    netChange: player.delta || 0
  }));

  // Calculate total wins and losses
  const winners = results.filter(r => r.netChange > 0);
  const losers = results.filter(r => r.netChange < 0);
  const totalWins = winners.reduce((sum, w) => sum + w.netChange, 0);
  const totalLosses = Math.abs(losers.reduce((sum, l) => sum + l.netChange, 0));

  // Store original values for display
  const originalTotalWins = totalWins;
  const originalTotalLosses = totalLosses;

  // Apply proportional dampening if wins > losses OR losses > wins
  let adjustedResults = results;
  let isDampened = false;
  let dampeningType = '';
  let dampeningFactor = 1;
  let excessAmount = 0;

  if (totalWins > totalLosses && totalWins > 0) {
    // Dampen winners when wins exceed losses
    dampeningFactor = totalLosses / totalWins;
    excessAmount = totalWins - totalLosses;
    adjustedResults = results.map(r => {
      if (r.netChange > 0) {
        return {
          ...r,
          netChange: r.netChange * dampeningFactor,
          isDampened: true
        };
      }
      return r;
    });
    isDampened = true;
    dampeningType = 'winners';
  } else if (totalLosses > totalWins && totalLosses > 0) {
    // Dampen losers when losses exceed wins
    dampeningFactor = totalWins / totalLosses;
    excessAmount = totalLosses - totalWins;
    adjustedResults = results.map(r => {
      if (r.netChange < 0) {
        return {
          ...r,
          netChange: r.netChange * dampeningFactor,
          isDampened: true
        };
      }
      return r;
    });
    isDampened = true;
    dampeningType = 'losers';
  }

  // Calculate payment transactions
  const transactions = calculateTransactions(adjustedResults);

  // Render results
  renderResults(adjustedResults, isDampened, dampeningType, dampeningFactor, excessAmount, originalTotalWins, originalTotalLosses, transactions);
}

// Calculate who pays who using greedy algorithm
function calculateTransactions(results) {
  // Create mutable copies sorted by net change
  const creditors = results
    .filter(r => r.netChange > 0.01)
    .map(r => ({ ...r, remaining: r.netChange }))
    .sort((a, b) => b.remaining - a.remaining);

  const debtors = results
    .filter(r => r.netChange < -0.01)
    .map(r => ({ ...r, remaining: Math.abs(r.netChange) }))
    .sort((a, b) => b.remaining - a.remaining);

  const transactions = [];
  let i = 0, j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const amount = Math.min(creditor.remaining, debtor.remaining);

    if (amount > 0.01) {
      transactions.push({
        from: debtor.name,
        to: creditor.name,
        amount: amount
      });
    }

    creditor.remaining -= amount;
    debtor.remaining -= amount;

    if (creditor.remaining < 0.01) i++;
    if (debtor.remaining < 0.01) j++;
  }

  return transactions;
}

// Render calculation results
function renderResults(results, isDampened, dampeningType, dampeningFactor, excessAmount, originalTotalWins, originalTotalLosses, transactions) {
  const resultsDiv = document.getElementById('results');

  if (results.length === 0) {
    resultsDiv.innerHTML = '<div class="empty-state">Add players to see results</div>';
    return;
  }

  const adjustedTotalWins = results.filter(r => r.netChange > 0).reduce((sum, r) => sum + r.netChange, 0);
  const adjustedTotalLosses = Math.abs(results.filter(r => r.netChange < 0).reduce((sum, r) => sum + r.netChange, 0));
  const difference = Math.abs(adjustedTotalWins - adjustedTotalLosses);

  let html = '';

  // Add info box if dampening was applied
  if (isDampened) {
    const dampeningPercentage = (dampeningFactor * 100).toFixed(1);
    if (dampeningType === 'winners') {
      html += `
                <div class="info-box">
                    <strong>⚖️ Proportional Dampening Applied (Winners)</strong><br>
                    Original total wins: $${originalTotalWins.toFixed(2)}<br>
                    Original total losses: $${originalTotalLosses.toFixed(2)}<br>
                    Excess wins: $${excessAmount.toFixed(2)}<br>
                    Dampening factor: ${dampeningPercentage}% (${dampeningFactor.toFixed(4)})<br>
                    Winners' gains have been reduced proportionally to match available funds.
                </div>
            `;
    } else if (dampeningType === 'losers') {
      html += `
                <div class="info-box">
                    <strong>⚖️ Proportional Dampening Applied (Losers)</strong><br>
                    Original total wins: $${originalTotalWins.toFixed(2)}<br>
                    Original total losses: $${originalTotalLosses.toFixed(2)}<br>
                    Excess losses: $${excessAmount.toFixed(2)}<br>
                    Dampening factor: ${dampeningPercentage}% (${dampeningFactor.toFixed(4)})<br>
                    Losers' losses have been reduced proportionally to match available funds.
                </div>
            `;
    }
  }

  // Check for imbalance
  if (difference > 0.01 && !isDampened) {
    html += `
            <div class="info-box">
                <strong>⚠️ Imbalance Detected</strong><br>
                Total wins ($${adjustedTotalWins.toFixed(2)}) and losses ($${adjustedTotalLosses.toFixed(2)}) 
                don't match. Difference: $${difference.toFixed(2)}
            </div>
        `;
  }

  // Show payment transactions
  if (transactions.length > 0) {
    html += transactions.map(t => `
            <div class="transaction-item">
                <div class="transaction-text">
                    <strong>${t.from}</strong> pays <strong>${t.to}</strong>
                </div>
                <div class="transaction-amount">$${t.amount.toFixed(2)}</div>
            </div>
        `).join('');
  } else {
    html += '<div class="empty-state">All players are even!</div>';
  }

  resultsDiv.innerHTML = html;
}

// Clear all data
function clearAllData() {
  if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
    players = [];
    localStorage.removeItem(STORAGE_KEY);
    addPlayer(); // Add one empty player
    renderPlayers();
    document.getElementById('results').innerHTML = '';
  }
}

// Export data as JSON
function exportData() {
  const dataStr = JSON.stringify(players, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `poker-payouts-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

// Make functions available globally
window.addPlayer = addPlayer;
window.removePlayer = removePlayer;
window.updatePlayer = updatePlayer;
window.calculatePayouts = calculatePayouts;
window.clearAllData = clearAllData;
window.exportData = exportData;
