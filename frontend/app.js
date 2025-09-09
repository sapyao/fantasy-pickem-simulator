async function fetchProps() {
    const propsList = document.getElementById('props-list');
    propsList.textContent = 'Loading...';
    try {
        // Change this URL if your backend runs elsewhere
        const res = await fetch('http://localhost:5000/props');
        const data = await res.json();
        propsList.innerHTML = '';
        data.forEach(prop => {
            const card = document.createElement('div');
            card.className = 'prop-card';
            card.innerHTML = `
                <strong>${prop.player}</strong><br>
                <span>${prop.stat}: ${prop.value}</span>
                <button>Add Pick</button>
            `;
            card.querySelector('button').onclick = () => addPick(prop);
            propsList.appendChild(card);
        });
    } catch (err) {
        propsList.textContent = 'Failed to load props.';
    }
}

const picks = [];
function addPick(prop) {
    if (!picks.find(p => p.player === prop.player && p.stat === prop.stat)) {
        picks.push(prop);
        renderPicks();
    }
}
function renderPicks() {
    const picksList = document.getElementById('picks-list');
    picksList.innerHTML = '';
    picks.forEach(pick => {
        const li = document.createElement('li');
        li.textContent = `${pick.player} - ${pick.stat}: ${pick.value}`;
        picksList.appendChild(li);
    });
}

window.onload = fetchProps;
