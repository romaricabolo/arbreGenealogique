// ============================
// GESTION DU THÈME SOMBRE/CLAIR
// ============================

// Fonction d'initialisation
function initTheme() {
    console.log("Initialisation du thème..."); // Pour déboguer
    
    const themeToggle = document.getElementById('themeToggle');
    
    // Vérifier si le bouton existe
    if (!themeToggle) {
        console.error("Bouton themeToggle non trouvé !");
        return;
    }
    
    console.log("Bouton trouvé :", themeToggle);
    
    // Vérifier la préférence sauvegardée
    const savedTheme = localStorage.getItem('familyTree_theme');
    console.log("Thème sauvegardé :", savedTheme);
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        updateThemeButton(true);
    } else {
        document.body.classList.remove('dark-theme');
        updateThemeButton(false);
    }
    
    // Ajouter l'événement de clic
    themeToggle.addEventListener('click', toggleTheme);
}

// Basculer entre les thèmes
function toggleTheme() {
    console.log("Basculement du thème...");
    
    const isDark = document.body.classList.contains('dark-theme');
    
    if (isDark) {
        document.body.classList.remove('dark-theme');
        localStorage.setItem('familyTree_theme', 'light');
        updateThemeButton(false);
        showNotification('🌞 Thème clair activé', 'success');
    } else {
        document.body.classList.add('dark-theme');
        localStorage.setItem('familyTree_theme', 'dark');
        updateThemeButton(true);
        showNotification('🌙 Thème sombre activé', 'success');
    }
}

// Mettre à jour le bouton
function updateThemeButton(isDark) {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    const icon = themeToggle.querySelector('i');
    const text = themeToggle.querySelector('.theme-text');
    
    if (isDark) {
        icon.className = 'fas fa-sun';
        if (text) text.textContent = 'Clair';
        themeToggle.title = 'Passer au mode clair';
    } else {
        icon.className = 'fas fa-moon';
        if (text) text.textContent = 'Sombre';
        themeToggle.title = 'Passer au mode sombre';
    }
}

// Attendre que le DOM soit chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
} else {
    // DOM déjà chargé
    initTheme();
}