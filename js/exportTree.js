// ============================
// EXPORT DE L'ARBRE
// ============================

// Exporter en PNG
function exportAsPNG() {
    showNotification("Préparation de l'export...", "success");
    
    const treeWrapper = document.getElementById('treeWrapper');
    
    // Utiliser html2canvas (à inclure dans le HTML)
    html2canvas(treeWrapper, {
        scale: 2,
        backgroundColor: '#f9f9f9',
        allowTaint: true,
        useCORS: true,
        logging: false
    }).then(canvas => {
        // Créer le lien de téléchargement
        const link = document.createElement('a');
        link.download = 'arbre-genealogique.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        showNotification("Export PNG réussi", "success");
    }).catch(error => {
        console.error('Erreur export PNG:', error);
        showNotification("Erreur lors de l'export", "error");
    });
}

// Exporter en PDF
function exportAsPDF() {
    showNotification("Préparation du PDF...", "success");
    
    const treeWrapper = document.getElementById('treeWrapper');
    
    html2canvas(treeWrapper, {
        scale: 2,
        backgroundColor: '#f9f9f9',
        allowTaint: true,
        useCORS: true
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        
        // Utiliser jsPDF (à inclure dans le HTML)
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save('arbre-genealogique.pdf');
        
        showNotification("Export PDF réussi", "success");
    }).catch(error => {
        console.error('Erreur export PDF:', error);
        showNotification("Erreur lors de l'export", "error");
    });
}

// Exporter en CSV (liste des membres)
function exportAsCSV() {
    let csv = "ID,Prénom,Nom,Sexe,Génération,Date naissance,Père,Mère,Conjoint(s),Téléphone,WhatsApp,Décédé,Année décès\n";
    
    familyMembers.forEach(m => {
        const row = [
            m.ID,
            `"${m.Prennom || ''}"`,
            `"${m.Nom || ''}"`,
            m.Sexe || '',
            m.Generation || '',
            m.DateNaissance || '',
            m.ID_Pere || '',
            m.ID_Mere || '',
            `"${m.ConjointID || ''}"`,
            m.telephone || '',
            m.whatsapp ? 'Oui' : 'Non',
            m.estDecede ? 'Oui' : 'Non',
            m.anneeDeces || ''
        ].join(',');
        
        csv += row + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'famille_complete.csv';
    link.click();
    
    showNotification("Export CSV réussi", "success");
}

// Ouvrir le menu d'export
function showExportMenu() {
    const html = `
        <div class="export-menu">
            <h3>Exporter l'arbre généalogique</h3>
            
            <button onclick="exportAsPNG()" class="export-btn export-png">
                <i class="fas fa-image"></i>
                Image PNG
                <small>Capture d'écran de l'arbre visible</small>
            </button>
            
            <button onclick="exportAsPDF()" class="export-btn export-pdf">
                <i class="fas fa-file-pdf"></i>
                Document PDF
                <small>Format imprimable</small>
            </button>
            
            <button onclick="exportAsCSV()" class="export-btn export-csv">
                <i class="fas fa-file-csv"></i>
                Fichier CSV
                <small>Tous les membres (tableau)</small>
            </button>
            
            <p class="export-note">
                <i class="fas fa-info-circle"></i>
                Pour un meilleur rendu, dézoomez avant l'export.
            </p>
        </div>
    `;
    
    showCustomModal('Exporter', html);
}