// ============================
// GESTION DU THÈME
// ============================

const THEME_KEY = 'familyTree_theme';

// Initialiser le thème
function initTheme() {
    // Vérifier la préférence sauvegardée
    const savedTheme = localStorage.getItem(THEME_KEY);
    
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        // Vérifier la préférence système
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
    }
    
    // Ajouter le bouton de bascule
    addThemeToggle();
    
    // Écouter les changements de préférence système
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem(THEME_KEY)) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
}

// Changer le thème
function setTheme(theme) {
    const root = document.documentElement;
    
    if (theme === 'dark') {
        // Thème sombre
        root.style.setProperty('--primary-color', '#1e2b3c');
        root.style.setProperty('--secondary-color', '#18bc9c');
        root.style.setProperty('--accent-color', '#f39c12');
        root.style.setProperty('--dark-color', '#ecf0f1');
        root.style.setProperty('--light-color', '#2c3e50');
        root.style.setProperty('--bg-color', '#1a1e24');
        root.style.setProperty('--card-bg', '#2c3e50');
        root.style.setProperty('--text-color', '#ecf0f1');
        root.style.setProperty('--text-light', '#bdc3c7');
        root.style.setProperty('--border-color', '#4a5c6c');
        root.style.setProperty('--shadow-color', 'rgba(0,0,0,0.5)');
        
        // Mettre à jour les classes
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
    } else {
        // Thème clair (défaut)
        root.style.setProperty('--primary-color', '#2c3e50');
        root.style.setProperty('--secondary-color', '#18bc9c');
        root.style.setProperty('--accent-color', '#f39c12');
        root.style.setProperty('--dark-color', '#2c3e50');
        root.style.setProperty('--light-color', '#f8f9fa');
        root.style.setProperty('--bg-color', '#ffffff');
        root.style.setProperty('--card-bg', '#ffffff');
        root.style.setProperty('--text-color', '#2c3e50');
        root.style.setProperty('--text-light', '#7f8c8d');
        root.style.setProperty('--border-color', '#ecf0f1');
        root.style.setProperty('--shadow-color', 'rgba(0,0,0,0.1)');
        
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
    }
    
    // Sauvegarder la préférence
    localStorage.setItem(THEME_KEY, theme);
    
    // Mettre à jour l'icône du bouton
    updateThemeToggleIcon(theme);
}

// Basculer entre les thèmes
function toggleTheme() {
    const currentTheme = localStorage.getItem(THEME_KEY) || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    showNotification(`Thème ${newTheme === 'dark' ? 'sombre' : 'clair'} activé`, 'success');
}

// Ajouter le bouton de bascule
function addThemeToggle() {
    const header = document.querySelector('.site-header .header-controls');
    
    if (header) {
        const themeBtn = document.createElement('button');
        themeBtn.id = 'themeToggle';
        themeBtn.className = 'theme-toggle';
        themeBtn.onclick = toggleTheme;
        
        const currentTheme = localStorage.getItem(THEME_KEY) || 'light';
        updateThemeToggleIcon(currentTheme, themeBtn);
        
        header.appendChild(themeBtn);
    }
}

// Mettre à jour l'icône
function updateThemeToggleIcon(theme, btn = null) {
    const toggleBtn = btn || document.getElementById('themeToggle');
    if (toggleBtn) {
        toggleBtn.innerHTML = theme === 'light' 
            ? '<i class="fas fa-moon"></i>' 
            : '<i class="fas fa-sun"></i>';
        toggleBtn.title = theme === 'light' 
            ? 'Passer au thème sombre' 
            : 'Passer au thème clair';
    }
}

// CSS dynamique pour le thème sombre
function injectDarkThemeCSS() {
    const style = document.createElement('style');
    style.id = 'dark-theme-overrides';
    style.textContent = `
        body.dark-theme {
            background-color: #1a1e24;
            color: #cbd9ddff;
        }
        
        body.dark-theme .family-node {
            background: linear-gradient(135deg, #2c3e50, #34495e);
            color: #ecf0f1;
            border-color: #4a5c6c;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        
        body.dark-theme .node-avatar {
            background: linear-gradient(135deg, #18bc9c, #16a085);
        }
        
        body.dark-theme .modal-content,
        body.dark-theme .member-modal {
            background: #2c3e50;
            color: #ecf0f1;
        }
        
        body.dark-theme .tree-connection {
            opacity: 0.7;
        }
        
        body.dark-theme input,
        body.dark-theme select,
        body.dark-theme textarea {
            background: #34495e;
            color: #ecf0f1;
            border-color: #4a5c6c;
        }
        
        body.dark-theme .search-container input {
            background: #34495e;
            color: #ecf0f1;
        }
        
        body.dark-theme .search-container input::placeholder {
            color: #bdc3c7;
        }
        
        body.dark-theme .stats-card,
        body.dark-theme .stat-card,
        body.dark-theme .ancestor-card {
            background: #34495e;
            color: #ecf0f1;
            border-color: #4a5c6c;
        }
        
        body.dark-theme .site-header {
            background: linear-gradient(135deg, #1e2b3c, #2c3e50);
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        
        body.dark-theme .btn-outline {
            border-color: #18bc9c;
            color: #18bc9c;
        }
        
        body.dark-theme .btn-outline:hover {
            background: #18bc9c;
            color: white;
        }
        
        body.dark-theme .tree-toolbar {
            background: #2c3e50;
            border-color: #4a5c6c;
        }
        
        body.dark-theme .generation-legend {
            background: #2c3e50;
            color: #ecf0f1;
        }
    `;
    
    document.head.appendChild(style);
}

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', function() {
    injectDarkThemeCSS();
    initTheme();
});