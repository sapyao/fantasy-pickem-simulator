// Global variables
const picks = [];
let isFlexMode = false;
const MAX_PICKS = 8;
// Global variables
let allProps = [];
let myPicks = [];
let darkMode = true;
let allPlayerProps = []; // Store the original props data

let currentSportTab = 'all';
let sportsData = {};

let currentUiTab = 'props'; // 'props' or 'picks'

// Update the switchUiTab function to hide/show picks section
function switchUiTab(tabName) {
    currentUiTab = tabName;
    
    // Get the tab elements
    const propsTab = document.getElementById('props-tab');
    const picksTab = document.getElementById('picks-tab');
    
    // Get the content elements
    const propsContent = document.getElementById('props-content');
    const picksContent = document.getElementById('picks-content');
    
    // Update active tab styling
    if (propsTab) propsTab.classList.toggle('active', tabName === 'props');
    if (picksTab) picksTab.classList.toggle('active', tabName === 'picks');
    
    // Show/hide appropriate content
    if (propsContent) propsContent.style.display = tabName === 'props' ? 'block' : 'none';
    if (picksContent) picksContent.style.display = tabName === 'picks' ? 'block' : 'none';
    
    // If switching to picks tab, update the picks display
    if (tabName === 'picks') {
        renderMyPicks();
        updateMyPayoutInfo();
    }
}


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
async function fetchProps(limit = null) {
    const propsList = document.getElementById('props-list');
    propsList.textContent = 'Loading...';
    try {
        // Change this URL if your backend runs elsewhere
        let apiUrl = 'http://localhost:5000/api/props/formatted';
        
        // Add limit parameter if specified
        if (limit !== null && limit > 0) {
            apiUrl += `?limit=${limit}`;
        }
        
        console.log(`Fetching props from API (${limit === null ? 'all props' : limit + ' props'})...`);
        const res = await fetch(apiUrl);
        console.log('API Response:', res);
        const data = await res.json();
        console.log('API Data:', data);
        propsList.innerHTML = '';
        
        if (data.length === 0) {
            propsList.textContent = 'No props available.';
            return;
        }
        
        // Store all props globally for filtering
        allProps = data;
        allPlayerProps = [...data]; // Create a copy for resetting
        
        // Display all props initially
        displayProps(allProps);
    
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

// Update the displayProps function to handle the new data structure
function displayProps(props) {
    const propsList = document.getElementById('props-list');
    propsList.innerHTML = '';
    
    // Clear existing tabs
    const existingTabs = document.getElementById('sports-tabs');
    if (existingTabs) {
        existingTabs.remove();
    }
    
    // Create sports tabs container
    const sportsTabsContainer = document.createElement('div');
    sportsTabsContainer.id = 'sports-tabs';
    
    // Insert sports tabs after the search container
    const searchContainer = document.getElementById('search-container');
    if (searchContainer) {
        searchContainer.insertAdjacentElement('afterend', sportsTabsContainer);
    } else {
        // Fallback if search container doesn't exist
        const container = document.querySelector('.container');
        const propsContent = document.getElementById('props-content');
        if (propsContent) {
            propsContent.appendChild(sportsTabsContainer);
        } else if (container) {
            container.appendChild(sportsTabsContainer);
        } else {
            document.body.appendChild(sportsTabsContainer);
        }
    }
    
    // Check if props is grouped by sport or is a flat array
    if (!Array.isArray(props)) {
        // Store the grouped sports data globally
        sportsData = props;
        
        // Create "All Sports" tab
        createSportTab('all', 'All Sports', sportsTabsContainer, true);
        
        // Create tabs for each sport
        for (const sport in props) {
            if (Array.isArray(props[sport])) {
                createSportTab(sport, sport, sportsTabsContainer);
            }
        }
        
        // Display initial props based on the current tab
        displaySportProps();
    } else {
        // It's a flat array (from search results)
        // Group props by sport first
        const sportGroups = {};
        props.forEach(prop => {
            const sport = prop.sport || 'Unknown Sport';
            if (!sportGroups[sport]) {
                sportGroups[sport] = [];
            }
            sportGroups[sport].push(prop);
        });
        
        // Store the grouped sports data globally
        sportsData = sportGroups;
        
        // Create "All Sports" tab
        createSportTab('all', 'All Sports', sportsTabsContainer, true);
        
        // Create tabs for each sport
        for (const sport in sportGroups) {
            createSportTab(sport, sport, sportsTabsContainer);
        }
        
        // Display initial props based on the current tab
        displaySportProps();
    }
}

// Helper function to display player cards
function displayPlayerCards(playerProps, container) {
    // For each player, create a card with a dropdown of their props
    for (const player in playerProps) {
        const card = document.createElement('div');
        card.className = 'prop-card player-card';
        
        // Add player name
        const playerName = document.createElement('h3');
        playerName.textContent = player;
        card.appendChild(playerName);
        
        // Add select dropdown for props
        const propSelect = document.createElement('select');
        propSelect.className = 'prop-select';
        
        // Add a default option
        const defaultOption = document.createElement('option');
        defaultOption.textContent = 'Select a prop';
        defaultOption.value = '';
        propSelect.appendChild(defaultOption);
        
        // Add each prop as an option
        playerProps[player].forEach((prop, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${prop.stat} ${prop.value}`;
            propSelect.appendChild(option);
        });
        
        card.appendChild(propSelect);
        
        // Add bet buttons container (initially hidden)
        const betButtons = document.createElement('div');
        betButtons.className = 'bet-buttons hidden';
        
        const overButton = document.createElement('button');
        overButton.textContent = 'OVER';
        overButton.className = 'over-button';
        
        const underButton = document.createElement('button');
        underButton.textContent = 'UNDER';
        underButton.className = 'under-button';
        
        betButtons.appendChild(overButton);
        betButtons.appendChild(underButton);
        card.appendChild(betButtons);
        
        // Event listener for prop selection
        propSelect.addEventListener('change', function() {
            if (this.value !== '') {
                betButtons.classList.remove('hidden');
                
                // Update the button event listeners with the new selected prop
                const selectedProp = playerProps[player][parseInt(this.value)];
                
                overButton.onclick = function() {
                    const propWithPick = {...selectedProp, pick: 'OVER'};
                    addPick(propWithPick);
                };
                
                underButton.onclick = function() {
                    const propWithPick = {...selectedProp, pick: 'UNDER'};
                    addPick(propWithPick);
                };
            } else {
                betButtons.classList.add('hidden');
            }
        });
        
        container.appendChild(card);
    }
}

// Function to create a sport tab
function createSportTab(id, name, container, isActive = false) {
    const tab = document.createElement('div');
    tab.className = `sport-tab${isActive ? ' active' : ''}`;
    if (id === 'all') {
        tab.classList.add('all-sports');
    }
    tab.dataset.sport = id;
    tab.textContent = name;
    
    tab.addEventListener('click', () => {
        // Remove active class from all tabs
        document.querySelectorAll('.sport-tab').forEach(t => t.classList.remove('active'));
        // Add active class to clicked tab
        tab.classList.add('active');
        // Update current sport tab
        currentSportTab = id;
        // Display props for selected sport
        displaySportProps();
    });
    
    container.appendChild(tab);
}

// Function to display props for the selected sport
function displaySportProps() {
    const propsList = document.getElementById('props-list');
    propsList.innerHTML = '';
    
    if (currentSportTab === 'all') {
        // Display all sports
        for (const sport in sportsData) {
            if (Array.isArray(sportsData[sport])) {
                // Group props by player within each sport
                const playerProps = {};
                
                // Group the props by player name
                sportsData[sport].forEach(prop => {
                    if (!playerProps[prop.player]) {
                        playerProps[prop.player] = [];
                    }
                    playerProps[prop.player].push(prop);
                });
                
                // Display player cards for this sport
                displayPlayerCards(playerProps, propsList);
            }
        }
    } else {
        // Display specific sport
        if (sportsData[currentSportTab] && Array.isArray(sportsData[currentSportTab])) {
            // Group props by player within this sport
            const playerProps = {};
            
            // Group the props by player name
            sportsData[currentSportTab].forEach(prop => {
                if (!playerProps[prop.player]) {
                    playerProps[prop.player] = [];
                }
                playerProps[prop.player].push(prop);
            });
            
            // Display player cards for this sport
            displayPlayerCards(playerProps, propsList);
        } else {
            propsList.innerHTML = '<p>No props available for this sport.</p>';
        }
    }
}

// Update the search function to work with the tabbed interface
function searchPlayers() {
    const searchTerm = document.getElementById('player-search').value.toLowerCase();
    
    if (searchTerm.trim() === '') {
        // If search is empty, just display props based on the current tab
        displayProps(allProps);
        return;
    }
    
    // Search across all sports
    let results = [];
    
    for (const sport in allProps) {
        if (Array.isArray(allProps[sport])) {
            const sportResults = allProps[sport].filter(prop => 
                prop.player.toLowerCase().includes(searchTerm)
            );
            results = results.concat(sportResults);
        }
    }
    
    if (results.length > 0) {
        // Group search results by sport and display with tabs
        const groupedResults = {};
        results.forEach(prop => {
            const sport = prop.sport || 'Unknown Sport';
            if (!groupedResults[sport]) {
                groupedResults[sport] = [];
            }
            groupedResults[sport].push(prop);
        });
        displayProps(groupedResults);
    } else {
        // No results
        const propsList = document.getElementById('props-list');
        propsList.innerHTML = '<p>No players found matching your search.</p>';
        
        // Clear existing tabs
        const existingTabs = document.getElementById('sports-tabs');
        if (existingTabs) {
            existingTabs.remove();
        }
    }
}

// Modify addPick to update both tabs
function addPick(prop) {
    // Check if we already have max picks
    if (picks.length >= MAX_PICKS) {
        alert(`You can only select a maximum of ${MAX_PICKS} picks.`);
        return;
    }
    
    // Check if this pick already exists
    const existingPickIndex = picks.findIndex(p => p.player === prop.player);
    if (existingPickIndex !== -1) {
        // Replace the existing pick
        picks[existingPickIndex] = prop;
    } else {
        // Add new pick
        picks.push(prop);
    }
    
    renderMyPicks();
    updateMyPayoutInfo();
    updateSaveButton();
}

// Modify removePick to update picks
function removePick(index) {
    picks.splice(index, 1);
    renderMyPicks();
    updateMyPayoutInfo();
    updateSaveButton();
}

// Add function to render picks in the My Picks tab
function renderMyPicks() {
    const picksList = document.getElementById('my-picks-list');
    const picksCount = document.getElementById('my-picks-count');
    
    if (!picksList || !picksCount) return;
    
    picksList.innerHTML = '';
    picksCount.textContent = picks.length;
    
    picks.forEach((pick, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${pick.player} - ${pick.stat}: ${pick.value} 
            <strong>${pick.pick}</strong>
            <button class="remove-pick">Remove</button>
        `;
        li.querySelector('.remove-pick').onclick = () => removePick(index);
        picksList.appendChild(li);
    });
}

// Render all current picks (now only used by My Picks tab)
function renderPicks() {
    // This function is now just a fallback
    // All picks rendering should use renderMyPicks instead
    renderMyPicks();
}

// Add function to update payout info in My Picks tab
function updateMyPayoutInfo() {
    const powerPlayElem = document.getElementById('my-powerplay-payout');
    const flexPerfectElem = document.getElementById('my-flex-perfect');
    const flexOneMissElem = document.getElementById('my-flex-one-miss');
    const flexTwoMissElem = document.getElementById('my-flex-two-miss');
    
    if (!powerPlayElem) return;
    
    const n = picks.length;
    
    // Update PowerPlay payout
    const powerPlayPayout = calculatePowerPlayPayout(n);
    powerPlayElem.textContent = `PowerPlay payout: ${powerPlayPayout}x`;
    
    // Update Flex payouts if those elements exist
    if (flexPerfectElem) flexPerfectElem.textContent = `${calculateFlexPayout(n, 0)}x`;
    if (flexOneMissElem) flexOneMissElem.textContent = `${calculateFlexPayout(n, 1)}x`;
    if (flexTwoMissElem) {
        flexTwoMissElem.textContent = `${calculateFlexPayout(n, 2)}x`;
        const liElement = flexTwoMissElem.parentElement;
        if (liElement) {
            liElement.style.display = n >= 5 ? 'list-item' : 'none';
        }
    }
}

// Update the payout information based on current picks
function updatePayoutInfo() {
    // This function is now just a fallback
    // All payout info updates should use updateMyPayoutInfo instead
    updateMyPayoutInfo();
}

// Update the saveButton function to work with both tabs
function updateSaveButton() {
    const mySaveButton = document.getElementById('my-save-picks');
    
    if (mySaveButton) {
        mySaveButton.disabled = picks.length === 0;
    }
}

// Toggle between PowerPlay and Flex mode (legacy function)
function toggleMode() {
    toggleMyMode();
}

// Save current picks
async function savePicksToServer() {
    const betAmount = parseFloat(document.getElementById('my-bet-amount').value);
    if (isNaN(betAmount) || betAmount <= 0) {
        alert('Please enter a valid bet amount.');
        return;
    }
    
    const saveResult = document.getElementById('my-save-result');
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

// Modify the initApp function to ensure proper element ordering
function initApp() {
    // Add UI tabs if they don't exist yet
    if (!document.getElementById('ui-tabs')) {
        const container = document.querySelector('.container');
        const h1 = container.querySelector('h1');
        
        // Create UI tabs container
        const uiTabs = document.createElement('div');
        uiTabs.id = 'ui-tabs';
        
        // Create Props tab
        const propsTab = document.createElement('div');
        propsTab.id = 'props-tab';
        propsTab.className = 'ui-tab active';
        propsTab.textContent = 'Props';
        propsTab.addEventListener('click', () => switchUiTab('props'));
        
        // Create My Picks tab
        const picksTab = document.createElement('div');
        picksTab.id = 'picks-tab';
        picksTab.className = 'ui-tab';
        picksTab.textContent = 'My Picks';
        picksTab.addEventListener('click', () => switchUiTab('picks'));
        
        // Add tabs to container
        uiTabs.appendChild(propsTab);
        uiTabs.appendChild(picksTab);
        
        // Insert tabs after heading
        h1.insertAdjacentElement('afterend', uiTabs);
        
        // Create content containers
        const propsContent = document.createElement('div');
        propsContent.id = 'props-content';
        
        // Create picks content
        const picksContent = document.createElement('div');
        picksContent.id = 'picks-content';
        picksContent.style.display = 'none';
        
        // Add the content containers to main container
        container.appendChild(propsContent);
        container.appendChild(picksContent);
        
        // Move elements to their appropriate tabs
        
        // Get the props section and move its contents to propsContent
        const propsSection = document.getElementById('props-section');
        if (propsSection) {
            // Create a heading for props content
            const propsHeading = document.createElement('h2');
            propsHeading.textContent = 'Player Props';
            propsContent.appendChild(propsHeading);
            
            // Move search container to props content
            const searchContainer = propsSection.querySelector('#search-container');
            if (searchContainer) {
                propsContent.appendChild(searchContainer);
            }
            
            // Move props list to props content
            const propsList = propsSection.querySelector('#props-list');
            if (propsList) {
                propsContent.appendChild(propsList);
            }
            
            // Remove the original props section
            propsSection.remove();
        } else {
            // Create search container if it doesn't exist
            const newSearchContainer = document.createElement('div');
            newSearchContainer.id = 'search-container';
            newSearchContainer.innerHTML = `
                <input type="text" id="player-search" placeholder="Search for a player...">
                <button id="search-button">Search</button>
                <button id="reset-search">Show All</button>
            `;
            propsContent.appendChild(newSearchContainer);
        }
        
        // 2. Create props list if it doesn't exist yet
        let propsList = document.getElementById('props-list');
        if (!propsList) {
            propsList = document.createElement('div');
            propsList.id = 'props-list';
            propsList.textContent = 'Loading props...';
            propsContent.appendChild(propsList);
        }
        
        // 3. Create picks view elements in the picks tab
        picksContent.innerHTML = `
            <div id="my-picks-container">
                <h2>My Selected Picks</h2>
                <div class="picks-wrapper">
                    <div class="picks-list-container">
                        <ul id="my-picks-list"></ul>
                        <div class="picks-controls">
                            <p><span id="my-picks-count">0</span>/${MAX_PICKS} picks selected</p>
                            <button id="clear-all-picks" class="btn-danger">Clear All</button>
                        </div>
                    </div>
                    <div class="picks-info">
                        <div id="my-payout-info">
                            <h3>Potential Payouts</h3>
                            <p id="my-powerplay-payout">PowerPlay payout: 0x</p>
                            <div id="my-flex-mode-info" class="hidden">
                                <ul>
                                    <li>Perfect: <span id="my-flex-perfect">0x</span></li>
                                    <li>1 miss: <span id="my-flex-one-miss">0x</span></li>
                                    <li>2 misses: <span id="my-flex-two-miss">0x</span></li>
                                </ul>
                            </div>
                        </div>
                        <div id="bet-section">
                            <label for="my-bet-amount">Bet Amount: $</label>
                            <input type="number" id="my-bet-amount" min="1" value="10" step="1">
                            <button id="my-toggle-mode">Switch to Flex Mode</button>
                            <button id="my-save-picks" disabled>Save Picks</button>
                        </div>
                        <div id="my-save-result" class="hidden"></div>
                    </div>
                </div>
            </div>
            
            <!-- Past picks section moved to My Picks tab -->
            <div id="past-picks-section">
                <h2>Past Picks</h2>
                <button id="load-past-picks">Load Past Picks</button>
                <div id="past-picks-list"></div>
            </div>
        `;
        
        // 4. Move any existing picks container to the Picks tab
        const existingPicksInfo = document.getElementById('picks-info');
        if (existingPicksInfo) {
            existingPicksInfo.remove(); // Remove from current location
        }
        
        // 5. Set up event listeners for Props tab
        const searchButton = document.getElementById('search-button');
        if (searchButton) {
            searchButton.addEventListener('click', searchPlayers);
        }
        
        const resetSearch = document.getElementById('reset-search');
        if (resetSearch) {
            resetSearch.addEventListener('click', () => {
                const playerSearch = document.getElementById('player-search');
                if (playerSearch) playerSearch.value = '';
                displayProps(allProps);
            });
        }
        
        const playerSearch = document.getElementById('player-search');
        if (playerSearch) {
            playerSearch.addEventListener('keyup', (event) => {
                if (event.key === 'Enter') {
                    searchPlayers();
                }
            });
        }
        
        // 6. Set up event listeners for Picks tab
        const myToggleMode = document.getElementById('my-toggle-mode');
        if (myToggleMode) {
            myToggleMode.addEventListener('click', toggleMyMode);
        }
        
        const mySavePicks = document.getElementById('my-save-picks');
        if (mySavePicks) {
            mySavePicks.addEventListener('click', savePicksToServer);
        }
        
        const clearAllPicks = document.getElementById('clear-all-picks');
        if (clearAllPicks) {
            clearAllPicks.addEventListener('click', clearAllMyPicks);
        }
        
        const loadPastPicks = document.getElementById('load-past-picks');
        if (loadPastPicks) {
            loadPastPicks.addEventListener('click', loadPastPicksFromServer);
        }
    }
    
    // Fetch props after UI setup
    fetchProps();
    
    // Initial UI updates
    updateMyPayoutInfo();
    updateSaveButton();
}

// Add function to toggle mode in My Picks tab
function toggleMyMode() {
    const toggleButton = document.getElementById('my-toggle-mode');
    const flexInfo = document.getElementById('my-flex-mode-info');
    const picksCount = picks.length;
    
    if (picksCount < 3 && !isFlexMode) {
        alert('You need at least 3 picks to enable Flex mode.');
        return;
    }
    
    isFlexMode = !isFlexMode;
    if (toggleButton) {
        toggleButton.textContent = isFlexMode ? 'Switch to PowerPlay Mode' : 'Switch to Flex Mode';
    }
    
    if (flexInfo) {
        flexInfo.classList.toggle('hidden', !isFlexMode);
    }
    
    const myPayoutInfo = document.getElementById('my-payout-info');
    if (myPayoutInfo) {
        myPayoutInfo.classList.toggle('flex-mode-active', isFlexMode);
    }
    
    updateMyPayoutInfo();
}

// Function to clear all picks (legacy function)
function clearAllPicks() {
    clearAllMyPicks();
}

// Function to clear all picks
function clearAllMyPicks() {
    if (confirm('Are you sure you want to clear all your picks?')) {
        picks.length = 0;
        renderMyPicks();
        updateMyPayoutInfo();
        updateSaveButton();
    }
}

// Function to load past picks
function loadPastPicksFromServer() {
    const pastPicksList = document.getElementById('past-picks-list');
    if (!pastPicksList) return;
    
    pastPicksList.innerHTML = '<p>Loading past picks...</p>';
    
    fetch('http://localhost:5000/api/past-picks')
        .then(response => response.json())
        .then(data => {
            pastPicksList.innerHTML = '';
            
            if (data.length === 0) {
                pastPicksList.innerHTML = '<p>No past picks found.</p>';
                return;
            }
            
            data.forEach(pickSet => {
                const card = document.createElement('div');
                card.className = 'past-pick-card';
                
                const date = new Date(pickSet.date);
                const dateStr = date.toLocaleDateString();
                
                card.innerHTML = `
                    <h3>${dateStr} - $${pickSet.bet_amount}</h3>
                    <p>Mode: ${pickSet.mode}</p>
                    <p>Potential Payout: $${pickSet.potential_payout}</p>
                    <ul>
                        ${pickSet.picks.map(pick => `
                            <li>${pick.player} - ${pick.stat} ${pick.value} ${pick.pick}</li>
                        `).join('')}
                    </ul>
                `;
                
                pastPicksList.appendChild(card);
            });
        })
        .catch(err => {
            pastPicksList.innerHTML = '<p>Failed to load past picks. Please try again later.</p>';
            console.error('Error loading past picks:', err);
        });
}

// Start the application when the page loads
window.onload = initApp;
