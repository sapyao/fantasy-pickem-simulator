// Global variables
const picks = [];
let isFlexMode = false;
const MAX_PICKS = 8;

// Function to calculate powerplay payout based on number of picks
function calculatePowerPlayPayout(n) {
    const payouts = [0, 1.5, 3, 6, 10, 20, 35, 65, 120];
    return n > 0 && n <= 8 ? payouts[n] : 0;
}

// Function to calculate flex payout based on number of picks and losses
function calculateFlexPayout(n, losses) {
    if (losses === 0) {
        if (n === 8) return 80;
        if (n === 7) return 40;
        if (n === 6) return 25;
        if (n === 5) return 10;
        if (n === 4) return 6;
        if (n === 3) return 3;
    } else if (losses === 1) {
        if (n === 8) return 3;
        if (n === 7) return 2.75;
        if (n === 6) return 2.6;
        if (n === 5) return 2.5;
        if (n === 4) return 1.5;
        if (n === 3) return 1;
    } else if (losses === 2) {
        if (n === 8) return 1;
        if (n === 7) return 0.5;
        if (n === 6) return 0.25;
    }
    return 0;
}

// Fetch player props from the backend API
async function fetchProps() {
    const propsList = document.getElementById('props-list');
    propsList.textContent = 'Loading...';
    try {
        // Change this URL if your backend runs elsewhere
        console.log('Fetching props from API...');
        const res = await fetch('http://localhost:5000/api/props/formatted');
        console.log('API Response:', res);
        const data = await res.json();
        console.log('API Data:', data);
        propsList.innerHTML = '';
        
        if (data.length === 0) {
            propsList.textContent = 'No props available.';
            return;
        }
        
        data.forEach(prop => {
            const card = document.createElement('div');
            card.className = 'prop-card';
            card.innerHTML = `
                <strong>${prop.player}</strong><br>
                <span>${prop.stat}: ${prop.value}</span>
                <div>
                    <button data-pick="over">Over</button>
                    <button data-pick="under">Under</button>
                </div>
            `;
            
            card.querySelector('button[data-pick="over"]').onclick = () => 
                addPick({...prop, pick: 'over'});
                
            card.querySelector('button[data-pick="under"]').onclick = () => 
                addPick({...prop, pick: 'under'});
                
            propsList.appendChild(card);
        });
    } catch (err) {
        propsList.textContent = 'Failed to load props. Please check if the backend server is running.';
        console.error('Error fetching props:', err);
        
        // Additional debugging info
        propsList.innerHTML += `<div class="error-details">
            <p>Error details:</p>
            <pre>${err.toString()}</pre>
            <p>Please make sure:</p>
            <ul>
                <li>Backend server is running at http://localhost:5000</li>
                <li>CORS is properly configured</li>
                <li>The underdog_props.csv file exists and is valid</li>
            </ul>
            <p>Try refreshing after fixing these issues.</p>
        </div>`;
    }
}

// Add a pick to the list
function addPick(prop) {
    // Check if we already have max picks
    if (picks.length >= MAX_PICKS) {
        alert(`You can only select a maximum of ${MAX_PICKS} picks.`);
        return;
    }
    
    // Check if this pick already exists
    if (!picks.find(p => p.player === prop.player && p.stat === prop.stat)) {
        picks.push(prop);
        renderPicks();
        updatePayoutInfo();
        updateSaveButton();
    } else {
        alert('You already have a pick for this player prop.');
    }
}

// Remove a pick from the list
function removePick(index) {
    picks.splice(index, 1);
    renderPicks();
    updatePayoutInfo();
    updateSaveButton();
}

// Render all current picks
function renderPicks() {
    const picksList = document.getElementById('picks-list');
    const picksCount = document.getElementById('picks-count');
    
    picksList.innerHTML = '';
    picksCount.textContent = picks.length;
    
    picks.forEach((pick, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${pick.player} - ${pick.stat}: ${pick.value} 
            <strong>${pick.pick.toUpperCase()}</strong>
            <button class="remove-pick">Remove</button>
        `;
        li.querySelector('.remove-pick').onclick = () => removePick(index);
        picksList.appendChild(li);
    });
}

// Update the payout information based on current picks
function updatePayoutInfo() {
    const n = picks.length;
    const powerPlayElem = document.getElementById('powerplay-payout');
    const flexPerfectElem = document.getElementById('flex-perfect');
    const flexOneMissElem = document.getElementById('flex-one-miss');
    const flexTwoMissElem = document.getElementById('flex-two-miss');
    
    // Update PowerPlay payout
    powerPlayElem.textContent = `PowerPlay payout: ${calculatePowerPlayPayout(n)}x`;
    
    // Update Flex payouts
    flexPerfectElem.textContent = `${calculateFlexPayout(n, 0)}x`;
    flexOneMissElem.textContent = `${calculateFlexPayout(n, 1)}x`;
    flexTwoMissElem.textContent = `${calculateFlexPayout(n, 2)}x`;
    
    // Show or hide flex two miss based on number of picks
    flexTwoMissElem.parentElement.style.display = n >= 6 ? 'list-item' : 'none';
}

// Enable/disable the save button based on picks count
function updateSaveButton() {
    const saveButton = document.getElementById('save-picks');
    saveButton.disabled = picks.length === 0;
}

// Toggle between PowerPlay and Flex mode
function toggleMode() {
    const toggleButton = document.getElementById('toggle-mode');
    const flexInfo = document.getElementById('flex-mode-info');
    const picksCount = picks.length;
    
    if (picksCount < 3 && !isFlexMode) {
        alert('You need at least 3 picks to enable Flex mode.');
        return;
    }
    
    isFlexMode = !isFlexMode;
    toggleButton.textContent = isFlexMode ? 'Switch to PowerPlay Mode' : 'Switch to Flex Mode';
    flexInfo.classList.toggle('hidden', !isFlexMode);
    document.getElementById('payout-info').classList.toggle('flex-mode-active', isFlexMode);
}

// Save current picks
async function savePicksToServer() {
    const betAmount = parseFloat(document.getElementById('bet-amount').value);
    if (isNaN(betAmount) || betAmount <= 0) {
        alert('Please enter a valid bet amount.');
        return;
    }
    
    const saveResult = document.getElementById('save-result');
    saveResult.classList.remove('hidden', 'success', 'error');
    
    try {
        // This is where we would save to the backend in a real implementation
        // For now, let's simulate it with a random win/loss
        const n = picks.length;
        const isWin = Math.random() > 0.5;
        const multiplier = isFlexMode ? calculateFlexPayout(n, 0) : calculatePowerPlayPayout(n);
        const winnings = betAmount * multiplier;
        
        // Format the date for display
        const now = new Date();
        const formattedDate = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
        
        // Show the result
        saveResult.classList.add(isWin ? 'success' : 'error');
        saveResult.innerHTML = `
            <h3>Pick Slip - ${formattedDate}</h3>
            <p>${isWin ? 'WIN!' : 'LOSS'}</p>
            <p>Bet: $${betAmount.toFixed(2)}</p>
            <p>Mode: ${isFlexMode ? 'Flex' : 'PowerPlay'}</p>
            <p>Multiplier: ${multiplier}x</p>
            <p>${isWin ? `Payout: $${winnings.toFixed(2)}` : 'Better luck next time!'}</p>
        `;
        saveResult.classList.remove('hidden');
        
        // Also add to the past picks list
        const pastPicksList = document.getElementById('past-picks-list');
        const pastPickCard = document.createElement('div');
        pastPickCard.className = 'past-pick-card';
        
        let picksHTML = '<ul>';
        picks.forEach(pick => {
            picksHTML += `<li>${pick.player} - ${pick.stat}: ${pick.value} <strong>${pick.pick.toUpperCase()}</strong></li>`;
        });
        picksHTML += '</ul>';
        
        pastPickCard.innerHTML = `
            <h3>Pick Slip - ${formattedDate}</h3>
            ${picksHTML}
            <p>Bet: $${betAmount.toFixed(2)} | Mode: ${isFlexMode ? 'Flex' : 'PowerPlay'}</p>
            <p>Result: ${isWin ? `WIN! Payout: $${winnings.toFixed(2)}` : 'LOSS'}</p>
        `;
        
        pastPicksList.prepend(pastPickCard);
        
    } catch (error) {
        saveResult.classList.add('error');
        saveResult.textContent = 'Error saving picks. Please try again.';
        saveResult.classList.remove('hidden');
        console.error('Error saving picks:', error);
    }
}

// Load past picks from the server
async function loadPastPicks() {
    const pastPicksList = document.getElementById('past-picks-list');
    pastPicksList.innerHTML = 'Loading past picks...';
    
    try {
        // Here we would fetch from backend in a real implementation
        // For now, let's check if there are any already displayed
        if (pastPicksList.children.length <= 1) {
            // If not, load from the sample data file
            const response = await fetch('http://localhost:5000/api/past-picks');
            if (response.ok) {
                const pastPicks = await response.json();
                renderPastPicks(pastPicks);
            } else {
                // Fallback if API doesn't exist yet
                pastPicksList.innerHTML = 'No past picks available.';
            }
        } else {
            // Already loaded, just show a message
            pastPicksList.innerHTML += '<p>All past picks loaded.</p>';
        }
    } catch (error) {
        console.error('Error loading past picks:', error);
        pastPicksList.innerHTML = 'Failed to load past picks. Try again later.';
    }
}

// Render past picks from data
function renderPastPicks(pastPicks) {
    const pastPicksList = document.getElementById('past-picks-list');
    pastPicksList.innerHTML = '';
    
    if (!pastPicks || pastPicks.length === 0) {
        pastPicksList.textContent = 'No past picks available.';
        return;
    }
    
    pastPicks.forEach(pickSlip => {
        const pastPickCard = document.createElement('div');
        pastPickCard.className = 'past-pick-card';
        
        let picksHTML = '<ul>';
        pickSlip.picks.forEach(pick => {
            picksHTML += `<li>${pick.player} - ${pick.stat}: ${pick.line} <strong>${pick.pick.toUpperCase()}</strong></li>`;
        });
        picksHTML += '</ul>';
        
        pastPickCard.innerHTML = `
            <h3>Pick Slip - ${pickSlip.date}</h3>
            ${picksHTML}
            <p>Bet: $${pickSlip.bet.toFixed(2)} | Mode: ${pickSlip.mode}</p>
            <p>Result: ${pickSlip.won ? `WIN! Payout: $${pickSlip.payout.toFixed(2)}` : 'LOSS'}</p>
        `;
        
        pastPicksList.appendChild(pastPickCard);
    });
}

// Initialize the app
function initApp() {
    fetchProps();
    
    // Add event listeners
    document.getElementById('toggle-mode').addEventListener('click', toggleMode);
    document.getElementById('save-picks').addEventListener('click', savePicksToServer);
    document.getElementById('load-past-picks').addEventListener('click', loadPastPicks);
    
    // Initial UI updates
    updatePayoutInfo();
    updateSaveButton();
}

// Start the application when the page loads
window.onload = initApp;
