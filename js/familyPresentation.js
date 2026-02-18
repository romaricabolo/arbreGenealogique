// ============================
// PRÉSENTATION FAMILIALE - STYLE LIGA
// ============================

let presentationActive = false;
let currentSlide = 0;
let presentationInterval = null;
let presentationMembers = [];

// Données des présentateurs (voix off)
const presenters = [
    { name: "🔊 VOIX OFF", style: "Voix masculine profonde" },
    { name: "📢 COMMENTATEUR", style: "Style match de foot" }
];

// Ouvrir la fenêtre de présentation
function showFamilyPresentation() {
    // Récupérer tous les membres avec une génération
    presentationMembers = familyMembers.filter(m => m.Generation && m.Generation !== '');
    
    // Trier par génération (des plus anciens aux plus jeunes)
    presentationMembers.sort((a, b) => parseInt(a.Generation) - parseInt(b.Generation));
    
    if (presentationMembers.length === 0) {
        showNotification("Aucun membre à présenter", "error");
        return;
    }
    
    currentSlide = 0;
    presentationActive = true;
    
    // Créer la fenêtre de présentation
    const presentationWindow = document.createElement('div');
    presentationWindow.id = 'familyPresentation';
    presentationWindow.className = 'presentation-overlay';
    presentationWindow.innerHTML = `
        <div class="presentation-container">
            <div class="presentation-header">
                <h2><i class="fas fa-trophy"></i> PRÉSENTATION DE LA FAMILLE MBOZO'O <i class="fas fa-trophy"></i></h2>
                <div class="presentation-controls">
                    <button onclick="stopPresentation()" class="presentation-btn stop">
                        <i class="fas fa-stop"></i>
                    </button>
                    <button onclick="togglePausePresentation()" class="presentation-btn pause" id="pauseBtn">
                        <i class="fas fa-pause"></i>
                    </button>
                    <button onclick="fullscreenPresentation()" class="presentation-btn fullscreen">
                        <i class="fas fa-expand"></i>
                    </button>
                </div>
            </div>
            
            <div class="presentation-stage">
                <!-- Effets de lumière -->
                <div class="spotlight top-left"></div>
                <div class="spotlight top-right"></div>
                <div class="spotlight bottom-left"></div>
                <div class="spotlight bottom-right"></div>
                
                <!-- Confettis (optionnel) -->
                <div class="confetti-container" id="confettiContainer"></div>
                
                <!-- Écran principal -->
                <div class="presentation-screen" id="presentationScreen">
                    <div class="slide-container" id="slideContainer">
                        ${generateMemberSlide(presentationMembers[0])}
                    </div>
                </div>
                
                <!-- Indicateur de génération -->
                <div class="generation-indicator" id="genIndicator">
                    Génération ${presentationMembers[0].Generation}
                </div>
            </div>
            
            <div class="presentation-footer">
                <div class="progress-bar-container">
                    <div class="progress-bar" id="progressBar" style="width: 0%"></div>
                </div>
                <div class="presentation-stats">
                    <span><i class="fas fa-users"></i> <span id="currentCount">1</span>/${presentationMembers.length}</span>
                    <span><i class="fas fa-calendar"></i> <span id="currentGen">Gén. ${presentationMembers[0].Generation}</span></span>
                </div>
            </div>
            
            <div class="presentation-navigation">
                <button onclick="prevSlide()" class="nav-arrow prev">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button onclick="nextSlide()" class="nav-arrow next">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(presentationWindow);
    
    // Lancer l'animation d'entrée
    setTimeout(() => {
        presentationWindow.classList.add('active');
    }, 10);
    
    // Démarrer le diaporama automatique
    startPresentationAuto();
    
    // Ajouter l'effet de confettis
    startConfetti();
}

// Générer le HTML d'une slide
function generateMemberSlide(member) {
    const fullName = `${member.Prennom || ''} ${member.Nom || ''}`.trim() || 'Inconnu';
    const age = calculateAge(member);
    const birthDate = formatBirthDateForPresentation(member.DateNaissance);
    const deathInfo = member.estDecede ? `✝️ ${member.anneeDeces || ''}` : '';
    
    // Texte de présentation dynamique
    const presentationText = generatePresentationText(member);
    
    // Trouver les parents
    const father = member.ID_Pere ? familyMembers.find(m => m.ID === member.ID_Pere) : null;
    const mother = member.ID_Mere ? familyMembers.find(m => m.ID === member.ID_Mere) : null;
    const parents = father || mother ? `${father?.Prennom || '?'} ${father?.Nom || ''} & ${mother?.Prennom || '?'} ${mother?.Nom || ''}` : 'Fondateur de la lignée';
    
    // Trouver les enfants
    const children = familyMembers.filter(m => m.ID_Pere === member.ID || m.ID_Mere === member.ID);
    const childrenText = children.length > 0 ? `${children.length} enfant${children.length > 1 ? 's' : ''}` : 'Aucun enfant';
    
    return `
        <div class="member-slide" data-id="${member.ID}" data-gen="${member.Generation}">
            <div class="slide-left">
                <div class="member-image-container">
                    ${member.URL_img ? 
                        `<img src="${member.URL_img}" alt="${fullName}" class="member-image">` : 
                        `<div class="member-avatar-large">${fullName.charAt(0)}</div>`
                    }
                    <div class="member-name-large">${fullName}</div>
                </div>
            </div>
            
            <div class="slide-right">
                <div class="member-info">
                    <div class="member-badge generation-badge">
                        <i class="fas fa-layer-group"></i> Génération ${member.Generation}
                    </div>
                    
                    <div class="member-stats">
                        <div class="stat-item">
                            <i class="fas fa-${member.Sexe === 'M' ? 'mars' : 'venus'}"></i>
                            <span>${member.Sexe === 'M' ? 'Homme' : 'Femme'}</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-calendar-alt"></i>
                            <span>${birthDate}</span>
                        </div>
                        ${age ? `
                        <div class="stat-item">
                            <i class="fas fa-hourglass-half"></i>
                            <span>${age} ans</span>
                        </div>
                        ` : ''}
                        ${deathInfo ? `
                        <div class="stat-item">
                            <i class="fas fa-cross"></i>
                            <span>${deathInfo}</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="member-family">
                        <div class="family-relation">
                            <i class="fas fa-users"></i>
                            <strong>Parents :</strong> ${parents}
                        </div>
                        <div class="family-relation">
                            <i class="fas fa-child"></i>
                            <strong>Enfants :</strong> ${childrenText}
                        </div>
                    </div>
                    
                    <div class="member-presentation">
                        <div class="presentation-text">${presentationText}</div>
                    </div>
                    
                    <div class="member-quote">
                        <i class="fas fa-quote-left"></i>
                        <span>"Membre de la grande famille MBOZO'O"</span>
                        <i class="fas fa-quote-right"></i>
                    </div>
                </div>
            </div>
            
            <!-- Effets de bordure style Liga -->
            <div class="slide-border top"></div>
            <div class="slide-border right"></div>
            <div class="slide-border bottom"></div>
            <div class="slide-border left"></div>
        </div>
    `;
}

// Calculer l'âge
function calculateAge(member) {
    if (!member.DateNaissance || member.DateNaissance === '0000-00-00') return null;
    
    const birthYear = parseInt(member.DateNaissance.substring(0, 4));
    if (isNaN(birthYear)) return null;
    
    if (member.estDecede && member.anneeDeces) {
        const deathYear = parseInt(member.anneeDeces);
        return deathYear - birthYear;
    }
    
    const currentYear = new Date().getFullYear();
    return currentYear - birthYear;
}

// Formater la date de naissance
function formatBirthDateForPresentation(dateString) {
    if (!dateString || dateString === '0000-00-00') return 'Date inconnue';
    
    const parts = dateString.split('-');
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    
    if (month === '00' && day === '00') return `Né(e) en ${year}`;
    if (month !== '00' && day === '00') return `Né(e) en ${year}`;
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        return `Né(e) en ${year}`;
    }
}

// Générer un texte de présentation dynamique
function generatePresentationText(member) {
    const firstName = member.Prennom || '';
    const isMale = member.Sexe === 'M';
    const generation = parseInt(member.Generation);
    
    const adjectives = isMale ? 
        ['exceptionnel', 'remarquable', 'fier', 'courageux', 'bâtisseur', 'légendaire'] :
        ['exceptionnelle', 'remarquable', 'fière', 'courageuse', 'bâtisseuse', 'légendaire'];
    
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const role = generation === 1 ? 'ancêtre fondateur' : 
                 generation === 2 ? 'pilier de la famille' : 
                 generation <= 3 ? 'gardien des traditions' : 'espoir de la famille';
    
    const texts = [
        `⚡ Un membre ${adj} de notre famille !`,
        `⭐ ${firstName} incarne l'esprit ${adj} des MBOZO'O.`,
        `🏆 Véritable ${role}, ${firstName} marque l'histoire familiale.`,
        `🌟 Découvrez ${firstName}, un talent ${adj} de la génération ${generation}.`,
        `🎯 ${firstName} - Une fierté pour toute la famille !`
    ];
    
    return texts[Math.floor(Math.random() * texts.length)];
}

// Démarrer le diaporama automatique
function startPresentationAuto() {
    if (presentationInterval) clearInterval(presentationInterval);
    
    presentationInterval = setInterval(() => {
        if (!presentationActive) return;
        nextSlide();
    }, 5000); // Change toutes les 5 secondes
    
    // Mettre à jour le bouton pause
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        pauseBtn.classList.remove('play');
    }
}

// Mettre en pause/lecture
function togglePausePresentation() {
    const pauseBtn = document.getElementById('pauseBtn');
    
    if (presentationInterval) {
        clearInterval(presentationInterval);
        presentationInterval = null;
        pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        pauseBtn.classList.add('play');
    } else {
        startPresentationAuto();
    }
}

// Slide suivante
function nextSlide() {
    if (!presentationActive) return;
    
    currentSlide = (currentSlide + 1) % presentationMembers.length;
    updateSlide();
}

// Slide précédente
function prevSlide() {
    if (!presentationActive) return;
    
    currentSlide = (currentSlide - 1 + presentationMembers.length) % presentationMembers.length;
    updateSlide();
}

// Mettre à jour la slide avec animation
function updateSlide() {
    const slideContainer = document.getElementById('slideContainer');
    const genIndicator = document.getElementById('genIndicator');
    const currentCount = document.getElementById('currentCount');
    const currentGen = document.getElementById('currentGen');
    const progressBar = document.getElementById('progressBar');
    
    if (!slideContainer) return;
    
    const member = presentationMembers[currentSlide];
    
    // Animation de sortie
    slideContainer.style.animation = 'slideOut 0.3s ease forwards';
    
    setTimeout(() => {
        // Changer le contenu
        slideContainer.innerHTML = generateMemberSlide(member);
        
        // Animation d'entrée
        slideContainer.style.animation = 'slideInLiga 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
        
        // Mettre à jour les indicateurs
        if (genIndicator) genIndicator.textContent = `Génération ${member.Generation}`;
        if (currentCount) currentCount.textContent = currentSlide + 1;
        if (currentGen) currentGen.textContent = `Gén. ${member.Generation}`;
        if (progressBar) progressBar.style.width = `${((currentSlide + 1) / presentationMembers.length) * 100}%`;
        
        // Effet de flash
        const screen = document.querySelector('.presentation-screen');
        screen.style.boxShadow = '0 0 50px var(--secondary-color)';
        setTimeout(() => {
            screen.style.boxShadow = '';
        }, 300);
    }, 300);
}

// Arrêter la présentation
function stopPresentation() {
    presentationActive = false;
    if (presentationInterval) {
        clearInterval(presentationInterval);
        presentationInterval = null;
    }
    
    const presentation = document.getElementById('familyPresentation');
    if (presentation) {
        presentation.classList.remove('active');
        setTimeout(() => {
            presentation.remove();
        }, 500);
    }
}

// Mode plein écran
function fullscreenPresentation() {
    const container = document.querySelector('.presentation-container');
    if (container.requestFullscreen) {
        container.requestFullscreen();
    }
}

// Effet de confettis
function startConfetti() {
    const container = document.getElementById('confettiContainer');
    if (!container) return;
    
    const colors = ['#18bc9c', '#f39c12', '#e74c3c', '#3498db', '#9b59b6'];
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animation = `confettiFall ${3 + Math.random() * 2}s linear forwards`;
            container.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 5000);
        }, i * 100);
    }
}

// Ajouter le bouton dans la barre d'outils
function addPresentationButton() {
    const toolbar = document.querySelector('.tree-toolbar');
    if (toolbar) {
        const btn = document.createElement('button');
        btn.className = 'toolbar-btn btn-presentation';
        btn.onclick = showFamilyPresentation;
        btn.innerHTML = '<i class="fas fa-film"></i> Présentation';
        btn.title = 'Lancer la présentation familiale';
        
        // Insérer avant le dernier bouton
        const lastBtn = toolbar.lastElementChild;
        if (lastBtn) {
            toolbar.insertBefore(btn, lastBtn);
        } else {
            toolbar.appendChild(btn);
        }
    }
}