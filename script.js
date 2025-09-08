

// Main application logic - now uses modular components

// Global variable to store the last conversion result
let lastConversionResult = null;

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', function() {
    init();
});

async function init() {
    await loadMonsterData();
    populateMonsterDropdown();
    clearMessages();
}

async function loadMonsterData() {
    try {
        showLoading('Loading monster database...');
        const results = await bestiaryLoader.loadAllBestiaries();
        
        if (results.totalMonsters === 0) {
            throw new Error('No monsters loaded from bestiary files');
        }
        
        console.log(`Successfully loaded ${results.totalMonsters} monsters from ${results.loadedFiles} bestiary files`);
        
        if (results.errors.length > 0) {
            console.warn('Some files failed to load:', results.errors);
        }
        
        hideLoading();
        
    } catch (error) {
        console.error('Failed to load monster data:', error);
        hideLoading();
        showError(`Failed to load monster database: ${error.message}. Please check that the bestiary folder contains the JSON files.`);
        
        // Fallback: show message in dropdown
        const select = document.getElementById('monster-select');
        select.innerHTML = '<option value="">Error loading bestiary files</option>';
    }
}

function populateMonsterDropdown() {
    const select = document.getElementById('monster-select');
    select.innerHTML = '<option value="">Choose a monster...</option>';
    
    const monsters = bestiaryLoader.getAllMonsters();
    
    if (monsters.length === 0) {
        select.innerHTML = '<option value="">No monsters loaded</option>';
        return;
    }
    
    // Sort monsters alphabetically
    const sortedMonsters = monsters.sort((a, b) => a.name.localeCompare(b.name));
    
    sortedMonsters.forEach((monster, index) => {
        const option = document.createElement('option');
        option.value = index.toString(); // Use index as value
        const source = monster.source ? ` (${monster.source})` : '';
        option.textContent = `${monster.name} (CR ${monster.cr})${source}`;
        select.appendChild(option);
    });
    
    console.log(`Populated dropdown with ${monsters.length} monsters`);
}

function selectMethod(method) {
    // Update radio buttons
    document.querySelectorAll('input[name="method"]').forEach(radio => {
        radio.checked = radio.value === method;
    });

    // Update active states
    document.querySelectorAll('.input-method').forEach(div => {
        div.classList.remove('active');
    });
    document.querySelectorAll('.method-content').forEach(div => {
        div.classList.remove('active');
    });

    document.getElementById(`${method}-method`).classList.add('active');
    document.querySelector(`#${method}-method .method-content`).classList.add('active');
    
    clearMessages();
}

function convertSRDMonster() {
    const selectedIndex = document.getElementById('monster-select').value;
    if (!selectedIndex) {
        showError('Please select a monster first.');
        return;
    }

    clearMessages();
    const monsters = bestiaryLoader.getAllMonsters();
    const sortedMonsters = monsters.sort((a, b) => a.name.localeCompare(b.name));
    const monster = sortedMonsters[parseInt(selectedIndex)];
    
    if (!monster) {
        showError('Selected monster not found.');
        return;
    }

    const daggerheartAdversary = converter.convertToDaggerheart(monster);
    displayOutput(daggerheartAdversary);
    showSuccess(`Successfully converted ${monster.name} to Daggerheart!`);
}

function convertCustomCreature() {
    clearMessages();
    
    // Parse actions from textarea
    const actionsText = document.getElementById('custom-actions').value;
    const actions = parseActionsFromText(actionsText);
    
    const creature = {
        name: document.getElementById('custom-name').value || 'Unnamed Creature',
        cr: document.getElementById('custom-cr').value || '1',
        hp: parseInt(document.getElementById('custom-hp').value) || 10,
        ac: parseInt(document.getElementById('custom-ac').value) || 10,
        str: parseInt(document.getElementById('custom-str').value) || 10,
        dex: parseInt(document.getElementById('custom-dex').value) || 10,
        con: parseInt(document.getElementById('custom-con').value) || 10,
        int: parseInt(document.getElementById('custom-int').value) || 10,
        wis: parseInt(document.getElementById('custom-wis').value) || 10,
        cha: parseInt(document.getElementById('custom-cha').value) || 10,
        type: document.getElementById('custom-type').value || 'humanoid',
        speed: document.getElementById('custom-speed').value || '30 ft.',
        actions: actions.length > 0 ? actions : [
            {"name": "Basic Attack", "desc": "A standard attack."}
        ]
    };

    const daggerheartAdversary = converter.convertToDaggerheart(creature);
    displayOutput(daggerheartAdversary);
    showSuccess(`Successfully created custom creature: ${creature.name}!`);
}

function parseActionsFromText(text) {
    if (!text.trim()) return [];
    
    const lines = text.split('\n').filter(line => line.trim());
    const actions = [];
    
    lines.forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const name = line.substring(0, colonIndex).trim();
            const desc = line.substring(colonIndex + 1).trim();
            actions.push({ name, desc });
        } else {
            actions.push({ name: line.trim(), desc: "A basic attack." });
        }
    });
    
    return actions;
}

function parseAndConvert() {
    const rawText = document.getElementById('raw-text').value;
    if (!rawText.trim()) {
        showError('Please paste some statblock text first.');
        return;
    }

    clearMessages();
    
    try {
        const parsedCreature = parseStatblockText(rawText);
        const daggerheartAdversary = converter.convertToDaggerheart(parsedCreature);
        displayOutput(daggerheartAdversary);
        showSuccess(`Successfully parsed and converted: ${parsedCreature.name}!`);
    } catch (error) {
        console.error('Parsing error:', error);
        showError('Failed to parse statblock text. Please check the format and try again.');
    }
}

function parseStatblockText(text) {
    // Enhanced parsing with better regex patterns
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    // Parse name (first non-empty line)
    const nameMatch = lines[0];
    
    // Parse AC, HP, CR with more flexible patterns
    const acMatch = text.match(/Armor Class[:\s]+(\d+)/i);
    const hpMatch = text.match(/Hit Points[:\s]+(\d+)/i);
    const crMatch = text.match(/Challenge[:\s]+(\d+(?:\/\d+)?)/i);
    const speedMatch = text.match(/Speed[:\s]+([^\n]+)/i);
    
    // Parse ability scores with more flexible patterns
    const strMatch = text.match(/STR[:\s]*(\d+)/i);
    const dexMatch = text.match(/DEX[:\s]*(\d+)/i);
    const conMatch = text.match(/CON[:\s]*(\d+)/i);
    const intMatch = text.match(/INT[:\s]*(\d+)/i);
    const wisMatch = text.match(/WIS[:\s]*(\d+)/i);
    const chaMatch = text.match(/CHA[:\s]*(\d+)/i);

    // Guess creature type from text
    let type = 'humanoid';
    const typeGuesses = ['dragon', 'fiend', 'celestial', 'undead', 'beast', 'fey', 'elemental', 'giant', 'construct', 'aberration', 'monstrosity', 'ooze', 'plant'];
    const lowerText = text.toLowerCase();
    for (let t of typeGuesses) {
        if (lowerText.includes(t)) {
            type = t;
            break;
        }
    }
    
    // Parse actions (look for action blocks)
    const actions = parseActionsFromStatblock(text);

    return {
        name: nameMatch ? nameMatch.replace(/^[*_\s]+|[*_\s]+$/g, '') : 'Parsed Creature',
        ac: acMatch ? parseInt(acMatch[1]) : 10,
        hp: hpMatch ? parseInt(hpMatch[1]) : 10,
        cr: crMatch ? crMatch[1] : '1',
        str: strMatch ? parseInt(strMatch[1]) : 10,
        dex: dexMatch ? parseInt(dexMatch[1]) : 10,
        con: conMatch ? parseInt(conMatch[1]) : 10,
        int: intMatch ? parseInt(intMatch[1]) : 10,
        wis: wisMatch ? parseInt(wisMatch[1]) : 10,
        cha: chaMatch ? parseInt(chaMatch[1]) : 10,
        type: type,
        speed: speedMatch ? speedMatch[1].trim() : '30 ft.',
        actions: actions.length > 0 ? actions : [
            {"name": "Parsed Attack", "desc": "Attack parsed from statblock text."}
        ]
    };
}

function parseActionsFromStatblock(text) {
    const actions = [];
    
    // Look for action patterns
    const actionMatches = text.match(/([A-Z][^.]*?):\s*([^.]*(?:\.[^A-Z]*)*)/g);
    
    if (actionMatches) {
        actionMatches.forEach(match => {
            const colonIndex = match.indexOf(':');
            if (colonIndex > 0) {
                const name = match.substring(0, colonIndex).trim();
                const desc = match.substring(colonIndex + 1).trim();
                
                // Filter out non-action entries
                if (!name.match(/^(STR|DEX|CON|INT|WIS|CHA|Armor Class|Hit Points|Speed|Challenge|Saving Throws|Skills|Damage|Condition|Senses|Languages)/i)) {
                    actions.push({ name, desc });
                }
            }
        });
    }
    
    return actions.slice(0, 4); // Limit to 4 actions
}

// Legacy conversion functions removed - now using modular converter

function displayOutput(adversary) {
    const output = converter.generateMarkdown(adversary);
    document.getElementById('output-content').textContent = output;
    
    // Store for clipboard/download functionality
    lastConversionResult = output;
    
    // Show action buttons
    document.getElementById('copy-btn').style.display = 'inline-block';
    document.getElementById('download-btn').style.display = 'inline-block';
}

// Utility functions for messages
function showError(message) {
    const messageArea = document.getElementById('message-area');
    messageArea.innerHTML = `<div class="error">${message}</div>`;
}

function showSuccess(message) {
    const messageArea = document.getElementById('message-area');
    messageArea.innerHTML = `<div class="success">${message}</div>`;
}

function clearMessages() {
    const messageArea = document.getElementById('message-area');
    messageArea.innerHTML = '';
}

function showLoading(message = 'Loading...') {
    const messageArea = document.getElementById('message-area');
    messageArea.innerHTML = `<div class="loading">${message}</div>`;
}

function hideLoading() {
    clearMessages();
}

// Clipboard and download functionality
function copyToClipboard() {
    if (!lastConversionResult) {
        showError('No conversion result to copy.');
        return;
    }
    
    navigator.clipboard.writeText(lastConversionResult).then(() => {
        showSuccess('Copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        showError('Failed to copy to clipboard.');
    });
}

function downloadMarkdown() {
    if (!lastConversionResult) {
        showError('No conversion result to download.');
        return;
    }
    
    // Extract creature name for filename
    const nameMatch = lastConversionResult.match(/^#\s*(.+)$/m);
    const filename = nameMatch ? 
        `${nameMatch[1].replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}.md` : 
        'daggerheart_adversary.md';
    
    const blob = new Blob([lastConversionResult], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccess(`Downloaded as ${filename}!`);
}