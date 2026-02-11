// ============================
// SAUVEGARDE AUTOMATIQUE
// ============================

const STORAGE_KEY = 'familyTree_backup';
const AUTOSAVE_INTERVAL = 30000; // 30 secondes
let autoSaveEnabled = true;
let lastSaveTime = null;

// Initialiser la sauvegarde automatique
function initAutoSave() {
    // Charger la sauvegarde locale au démarrage
    loadLocalBackup();
    
    // Démarrer l'intervalle de sauvegarde
    setInterval(() => {
        if (autoSaveEnabled && familyMembers.length > 0) {
            autoSaveData();
        }
    }, AUTOSAVE_INTERVAL);
    
    // Sauvegarder avant de quitter
    window.addEventListener('beforeunload', function() {
        if (autoSaveEnabled) {
            saveToLocalStorage();
        }
    });
    
    // Ajouter les contrôles dans l'interface
    addAutoSaveControls();
}

// Sauvegarder automatiquement
function autoSaveData() {
    const success = saveToLocalStorage();
    if (success) {
        lastSaveTime = new Date();
        updateAutoSaveIndicator();
        console.log(`Sauvegarde auto: ${new Date().toLocaleTimeString()}`);
    }
}

// Sauvegarder dans localStorage
function saveToLocalStorage() {
    try {
        const backup = {
            timestamp: new Date().toISOString(),
            data: familyMembers,
            version: '1.0'
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(backup));
        
        // Sauvegarder aussi une copie de secours
        localStorage.setItem(`${STORAGE_KEY}_last`, JSON.stringify(backup));
        
        return true;
    } catch (error) {
        console.error('Erreur sauvegarde:', error);
        showNotification('Erreur lors de la sauvegarde automatique', 'error');
        return false;
    }
}

// Charger depuis localStorage
function loadLocalBackup() {
    try {
        const backup = localStorage.getItem(STORAGE_KEY);
        
        if (backup) {
            const parsed = JSON.parse(backup);
            
            // Vérifier si la sauvegarde est récente (moins de 24h)
            const backupTime = new Date(parsed.timestamp);
            const now = new Date();
            const hoursDiff = (now - backupTime) / (1000 * 60 * 60);
            
            if (hoursDiff < 24 && parsed.data && parsed.data.length > 0) {
                // Proposer de restaurer
                showRestoreDialog(parsed);
            }
        }
    } catch (error) {
        console.error('Erreur chargement backup:', error);
    }
}

// Afficher le dialogue de restauration
function showRestoreDialog(backup) {
    const backupDate = new Date(backup.timestamp).toLocaleString();
    const memberCount = backup.data.length;
    
    const html = `
        <div class="restore-dialog">
            <div class="restore-icon">
                <i class="fas fa-history"></i>
            </div>
            <h3>Sauvegarde locale trouvée</h3>
            <p>Date : ${backupDate}</p>
            <p>${memberCount} membres enregistrés</p>
            <p class="restore-warning">
                <i class="fas fa-exclamation-triangle"></i>
                La restauration remplacera les données actuelles.
            </p>
            <div class="restore-actions">
                <button onclick="restoreFromBackup()" class="btn btn-primary">
                    <i class="fas fa-undo"></i> Restaurer
                </button>
                <button onclick="dismissRestore()" class="btn btn-outline">
                    Ignorer
                </button>
                <button onclick="keepBothBackup()" class="btn btn-secondary">
                    <i class="fas fa-clone"></i> Garder les deux
                </button>
            </div>
        </div>
    `;
    
    showCustomModal('Restauration disponible', html);
}

// Restaurer depuis la sauvegarde
function restoreFromBackup() {
    try {
        const backup = localStorage.getItem(STORAGE_KEY);
        if (backup) {
            const parsed = JSON.parse(backup);
            familyMembers = parsed.data;
            
            generateModernFamilyTree();
            populateMemberSelect();
            saveFamilyData();
            
            showNotification('Données restaurées avec succès', 'success');
            closeModal(); // Fermer la modal de restauration
        }
    } catch (error) {
        showNotification('Erreur lors de la restauration', 'error');
    }
}

// Ignorer la restauration
function dismissRestore() {
    closeModal();
    localStorage.setItem(`${STORAGE_KEY}_dismissed`, Date.now().toString());
}

// Garder les deux (fusion)
function keepBothBackup() {
    try {
        const backup = localStorage.getItem(STORAGE_KEY);
        if (backup) {
            const parsed = JSON.parse(backup);
            
            // Ajouter les membres qui n'existent pas déjà
            const existingIds = new Set(familyMembers.map(m => m.ID));
            
            parsed.data.forEach(member => {
                if (!existingIds.has(member.ID)) {
                    familyMembers.push(member);
                }
            });
            
            generateModernFamilyTree();
            populateMemberSelect();
            saveFamilyData();
            
            showNotification(`${parsed.data.length} membres fusionnés`, 'success');
            closeModal();
        }
    } catch (error) {
        showNotification('Erreur lors de la fusion', 'error');
    }
}

// Exporter la sauvegarde
function exportBackup() {
    saveToLocalStorage();
    
    const backup = localStorage.getItem(STORAGE_KEY);
    if (backup) {
        const blob = new Blob([backup], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `family_backup_${new Date().toISOString().slice(0,10)}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        showNotification('Sauvegarde exportée', 'success');
    }
}

// Importer une sauvegarde
function importBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const backup = JSON.parse(event.target.result);
                
                if (backup.data && Array.isArray(backup.data)) {
                    if (confirm(`Importer ${backup.data.length} membres ? Les données actuelles seront remplacées.`)) {
                        familyMembers = backup.data;
                        generateModernFamilyTree();
                        populateMemberSelect();
                        saveFamilyData();
                        saveToLocalStorage();
                        showNotification('Import réussi', 'success');
                    }
                }
            } catch (error) {
                showNotification('Fichier invalide', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// Ajouter les contrôles de sauvegarde
function addAutoSaveControls() {
    const toolbar = document.querySelector('.tree-toolbar');
    if (toolbar) {
        const saveControls = document.createElement('div');
        saveControls.className = 'autosave-controls';
        saveControls.innerHTML = `
            <span id="autosaveIndicator" class="autosave-indicator">
                <i class="fas fa-cloud-upload-alt"></i>
                <span id="autosaveText">Auto</span>
            </span>
            <button onclick="saveToLocalStorage()" class="btn-save" title="Sauvegarder">
                <i class="fas fa-save"></i>
            </button>
            <button onclick="exportBackup()" class="btn-export" title="Exporter">
                <i class="fas fa-download"></i>
            </button>
        `;
        toolbar.appendChild(saveControls);
    }
}

// Mettre à jour l'indicateur
function updateAutoSaveIndicator() {
    const indicator = document.getElementById('autosaveIndicator');
    const text = document.getElementById('autosaveText');
    
    if (indicator && text) {
        if (lastSaveTime) {
            const now = new Date();
            const diff = Math.floor((now - lastSaveTime) / 1000);
            text.textContent = `Sauvegardé il y a ${diff}s`;
        }
        
        indicator.classList.add('saved');
        setTimeout(() => {
            indicator.classList.remove('saved');
        }, 2000);
    }
}