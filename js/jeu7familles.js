// ============================
// JEU DES 7 FAMILLES
// ============================

let currentGame = {
    families: [],
    players: [],
    currentPlayer: 0,
    gameStarted: false
};

// Ouvrir le menu du jeu
function showGameMenu() {
    const html = `
        <div class="game-menu">
            <h2><i class="fas fa-gamepad"></i> Jeu des 7 Familles</h2>
            
            <div class="game-options">
                <button onclick="startGame('solo')" class="game-btn solo">
                    <i class="fas fa-user"></i>
                    Jouer seul
                </button>
                
                <button onclick="startGame('multi')" class="game-btn multi">
                    <i class="fas fa-users"></i>
                    Multi-joueurs
                </button>
                
                <button onclick="showGameRules()" class="game-btn rules">
                    <i class="fas fa-question-circle"></i>
                    Règles du jeu
                </button>
            </div>
            
            <div class="game-preview">
                <h3>Familles disponibles</h3>
                <div class="family-preview-grid">
                    ${generateFamilyPreviews()}
                </div>
            </div>
        </div>
    `;
    
    showCustomModal("Jeu des 7 Familles", html);
}

// Générer les aperçus des familles
function generateFamilyPreviews() {
    // Regrouper par nom de famille
    const families = {};
    familyMembers.forEach(member => {
        const familyName = member.Nom;
        if (!families[familyName]) {
            families[familyName] = [];
        }
        families[familyName].push(member);
    });
    
    // Prendre les 7 plus grandes familles
    const topFamilies = Object.entries(families)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 7);
    
    return topFamilies.map(([name, members]) => {
        const oldest = members.reduce((a, b) => 
            (a.Generation < b.Generation) ? a : b
        );
        
        return `
            <div class="family-preview-card">
                <div class="family-preview-header" style="background: ${getFamilyColor(name)}">
                    Famille ${name}
                </div>
                <div class="family-preview-content">
                    <div class="family-preview-count">
                        ${members.length} membres
                    </div>
                    <div class="family-preview-oldest">
                        Aîné: ${oldest.Prennom} ${oldest.Nom}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Démarrer le jeu
function startGame(mode) {
    currentGame = {
        families: generateGameFamilies(),
        players: mode === 'solo' ? ['Joueur'] : ['Joueur 1', 'Joueur 2'],
        currentPlayer: 0,
        gameStarted: true
    };
    
    showGameBoard();
}

// Générer les familles pour le jeu
function generateGameFamilies() {
    const families = [];
    const familyNames = [...new Set(familyMembers.map(m => m.Nom))];
    
    // Prendre 7 familles
    const selectedNames = familyNames.slice(0, 7);
    
    selectedNames.forEach(name => {
        const members = familyMembers.filter(m => m.Nom === name);
        const cards = members.map(member => ({
            id: member.ID,
            name: `${member.Prennom} ${member.Nom}`,
            relation: getRelationForGame(member),
            image: member.URL_img,
            family: name,
            sexe: member.Sexe,
            collected: false
        }));
        
        families.push({
            name: name,
            color: getFamilyColor(name),
            cards: cards,
            completed: false
        });
    });
    
    return families;
}

// Obtenir la relation pour le jeu
function getRelationForGame(member) {
    if (!member.ID_Pere && !member.ID_Mere) return "Fondateur";
    if (!member.ID_Pere) return "Fils/Fille";
    if (!member.ID_Mere) return "Fils/Fille";
    if (member.ConjointID) return "Parent";
    return "Enfant";
}

// Afficher le plateau de jeu
function showGameBoard() {
    if (!currentGame.gameStarted) return;
    
    const player = currentGame.players[currentGame.currentPlayer];
    
    let html = `
        <div class="game-board">
            <div class="game-header">
                <div class="game-turn">
                    <i class="fas fa-user-circle"></i>
                    Tour de: <strong>${player}</strong>
                </div>
                <div class="game-actions">
                    <button onclick="drawCard()" class="btn btn-primary">
                        <i class="fas fa-plus-circle"></i> Piocher
                    </button>
                    <button onclick="showGameMenu()" class="btn btn-outline">
                        <i class="fas fa-undo"></i> Quitter
                    </button>
                </div>
            </div>
            
            <div class="game-families">
                ${renderFamilies()}
            </div>
            
            <div class="game-collection">
                <h3>Ma collection</h3>
                <div class="collection-grid">
                    ${renderPlayerCollection()}
                </div>
            </div>
        </div>
    `;
    
    showCustomModal("Jeu des 7 Familles", html);
}

// Afficher les familles disponibles
function renderFamilies() {
    return currentGame.families.map(family => `
        <div class="family-section" style="border-color: ${family.color}">
            <div class="family-title" style="background: ${family.color}">
                Famille ${family.name}
                ${family.completed ? '<i class="fas fa-check-circle completed-badge"></i>' : ''}
            </div>
            <div class="family-cards">
                ${family.cards.map(card => `
                    <div class="game-card ${card.collected ? 'collected' : ''}" 
                         style="border-left: 4px solid ${family.color}"
                         onclick="askForCard('${family.name}', ${card.id})">
                        <div class="card-avatar">
                            ${card.image ? 
                                `<img src="${card.image}" alt="${card.name}">` : 
                                `<span>${card.name.charAt(0)}</span>`
                            }
                        </div>
                        <div class="card-info">
                            <div class="card-name">${card.name}</div>
                            <div class="card-relation">${card.relation}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Afficher la collection du joueur
function renderPlayerCollection() {
    const collected = [];
    currentGame.families.forEach(family => {
        family.cards.forEach(card => {
            if (card.collected) {
                collected.push({...card, familyName: family.name, familyColor: family.color});
            }
        });
    });
    
    if (collected.length === 0) {
        return '<div class="empty-collection">Aucune carte pour le moment</div>';
    }
    
    return collected.map(card => `
        <div class="collection-card" style="border-color: ${card.familyColor}">
            <div class="collection-card-avatar">
                ${card.image ? 
                    `<img src="${card.image}" alt="${card.name}">` : 
                    `<span>${card.name.charAt(0)}</span>`
                }
            </div>
            <div class="collection-card-info">
                <div class="collection-card-name">${card.name}</div>
                <div class="collection-card-family">${card.familyName}</div>
            </div>
        </div>
    `).join('');
}

// Piocher une carte
function drawCard() {
    // Trouver une carte non collectée
    const availableCards = [];
    currentGame.families.forEach(family => {
        family.cards.forEach(card => {
            if (!card.collected) {
                availableCards.push({...card, familyName: family.name});
            }
        });
    });
    
    if (availableCards.length === 0) {
        showNotification("Toutes les cartes ont été distribuées !", "success");
        checkWinner();
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * availableCards.length);
    const card = availableCards[randomIndex];
    
    // Marquer la carte comme collectée
    currentGame.families.forEach(family => {
        if (family.name === card.familyName) {
            const cardIndex = family.cards.findIndex(c => c.id === card.id);
            if (cardIndex !== -1) {
                family.cards[cardIndex].collected = true;
                
                // Vérifier si la famille est complète
                const allCollected = family.cards.every(c => c.collected);
                family.completed = allCollected;
            }
        }
    });
    
    showNotification(`Vous avez pioché : ${card.name} (Famille ${card.familyName})`, "success");
    
    // Vérifier si le joueur a gagné
    checkWinner();
    
    // Passer au joueur suivant si multi
    if (currentGame.players.length > 1) {
        currentGame.currentPlayer = (currentGame.currentPlayer + 1) % currentGame.players.length;
    }
    
    showGameBoard();
}

// Demander une carte à un autre joueur
function askForCard(familyName, cardId) {
    if (currentGame.players.length === 1) {
        showNotification("Mode solo : piochez plutôt !", "error");
        return;
    }
    
    // Logique pour demander une carte
    const nextPlayer = (currentGame.currentPlayer + 1) % currentGame.players.length;
    showNotification(`Demandez à ${currentGame.players[nextPlayer]} s'il a cette carte`, "info");
}

// Vérifier le gagnant
function checkWinner() {
    const completedFamilies = currentGame.families.filter(f => f.completed);
    
    if (completedFamilies.length >= 4) {
        const winner = currentGame.players[currentGame.currentPlayer];
        showNotification(`🎉 ${winner} a gagné avec ${completedFamilies.length} familles !`, "success");
        currentGame.gameStarted = false;
    }
}

// Afficher les règles
function showGameRules() {
    const html = `
        <div class="game-rules">
            <h3>Règles du Jeu des 7 Familles</h3>
            
            <div class="rules-content">
                <h4>Objectif :</h4>
                <p>Collectionner le maximum de familles complètes (6 cartes par famille).</p>
                
                <h4>Déroulement :</h4>
                <ul>
                    <li>Chaque joueur pioche une carte à son tour</li>
                    <li>Les cartes sont réparties par nom de famille</li>
                    <li>Une famille est complète quand tous ses membres sont collectionnés</li>
                    <li>Le premier à avoir 4 familles complètes gagne</li>
                </ul>
                
                <h4>Les familles :</h4>
                <p>Dans ce jeu, les familles correspondent aux noms de famille réels de votre arbre.</p>
                
                <h4>Astuce :</h4>
                <p>Observez bien les relations entre les membres pour mieux comprendre les liens familiaux !</p>
            </div>
            
            <button onclick="showGameMenu()" class="btn btn-primary">
                <i class="fas fa-arrow-left"></i> Retour
            </button>
        </div>
    `;
    
    showCustomModal("Règles du jeu", html);
}

// Obtenir une couleur pour une famille
function getFamilyColor(name) {
    const colors = [
        '#e74c3c', '#3498db', '#2ecc71', '#f39c12', 
        '#9b59b6', '#1abc9c', '#e67e22', '#95a5a6'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = ((hash << 5) - hash) + name.charCodeAt(i);
        hash |= 0;
    }
    return colors[Math.abs(hash) % colors.length];
}