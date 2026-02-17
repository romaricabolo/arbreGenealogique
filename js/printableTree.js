// ============================
// GÉNÉRATEUR D'ARBRES IMPRIMABLES CORRIGÉ
// ============================

// Afficher le menu d'export imprimable
function showPrintableMenu() {
    const html = `
        <div class="printable-menu">
            <button class="mobile-close-btn" onclick="this.closest('.modal-overlay').remove()">
                <i class="fas fa-times"></i>
            </button>
            <h2><i class="fas fa-print"></i> Générer un arbre imprimable</h2>
            
            <div class="printable-options">
                <div class="printable-option-group">
                    <h3>Type d'arbre</h3>
                    <div class="option-buttons">
                        <button onclick="selectTreeType('full')" class="option-btn active" id="type-full">
                            <i class="fas fa-sitemap"></i>
                            Arbre complet
                        </button>
                        <button onclick="selectTreeType('descendants')" class="option-btn" id="type-descendants">
                            <i class="fas fa-child"></i>
                            Descendants
                        </button>
                        <button onclick="selectTreeType('ancestors')" class="option-btn" id="type-ancestors">
                            <i class="fas fa-tree"></i>
                            Ancêtres
                        </button>
                    </div>
                </div>
                
                <div class="printable-option-group">
                    <h3>Format</h3>
                    <div class="option-buttons">
                        <button onclick="selectFormat('a4')" class="option-btn active" id="format-a4">
                            <i class="fas fa-file"></i>
                            A4 (21x29.7 cm)
                        </button>
                        <button onclick="selectFormat('a3')" class="option-btn" id="format-a3">
                            <i class="fas fa-file"></i>
                            A3 (29.7x42 cm)
                        </button>
                        <button onclick="selectFormat('poster')" class="option-btn" id="format-poster">
                            <i class="fas fa-image"></i>
                            Poster (50x70 cm)
                        </button>
                    </div>
                </div>
                
                <div class="printable-option-group">
                    <h3>Style</h3>
                    <div class="option-buttons">
                        <button onclick="selectStyle('classic')" class="option-btn active" id="style-classic">
                            <i class="fas fa-tree"></i>
                            Classique
                        </button>
                        <button onclick="selectStyle('modern')" class="option-btn" id="style-modern">
                            <i class="fas fa-paint-brush"></i>
                            Moderne
                        </button>
                        <button onclick="selectStyle('minimal')" class="option-btn" id="style-minimal">
                            <i class="fas fa-circle"></i>
                            Minimaliste
                        </button>
                    </div>
                </div>
                
                <div class="printable-option-group">
                    <h3>Options</h3>
                    <div class="checkbox-options">
                        <label class="checkbox-label">
                            <input type="checkbox" id="show-photos" checked>
                            <span class="checkbox-custom"></span>
                            Inclure les photos
                        </label>
                        
                        <label class="checkbox-label">
                            <input type="checkbox" id="show-dates" checked>
                            <span class="checkbox-custom"></span>
                            Afficher les dates
                        </label>
                        
                        <label class="checkbox-label">
                            <input type="checkbox" id="show-relations" checked>
                            <span class="checkbox-custom"></span>
                            Afficher les relations
                        </label>
                        
                        <label class="checkbox-label">
                            <input type="checkbox" id="color-coded">
                            <span class="checkbox-custom"></span>
                            Code couleur par génération
                        </label>
                        
                        <!-- NOUVELLE OPTION -->
                        <label class="checkbox-label">
                            <input type="checkbox" id="embed-images" checked>
                            <span class="checkbox-custom"></span>
                            Intégrer les images (recommandé)
                        </label>
                    </div>
                </div>
            </div>
            
            <div class="printable-actions">
                <button onclick="generatePrintableTree()" class="btn btn-primary btn-large">
                    <i class="fas fa-print"></i>
                    Générer l'arbre
                </button>
                <button onclick="previewPrintableTree()" class="btn btn-outline btn-large">
                    <i class="fas fa-eye"></i>
                    Aperçu
                </button>
            </div>
        </div>
    `;
    
    showCustomModal("Arbre imprimable", html);
}

// Variables globales pour les options
let selectedTreeType = 'full';
let selectedFormat = 'a4';
let selectedStyle = 'classic';

// Sélectionner le type d'arbre
function selectTreeType(type) {
    selectedTreeType = type;
    document.querySelectorAll('[id^="type-"]').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`type-${type}`).classList.add('active');
}

// Sélectionner le format
function selectFormat(format) {
    selectedFormat = format;
    document.querySelectorAll('[id^="format-"]').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`format-${format}`).classList.add('active');
}

// Sélectionner le style
function selectStyle(style) {
    selectedStyle = style;
    document.querySelectorAll('[id^="style-"]').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`style-${style}`).classList.add('active');
}

// Aperçu de l'arbre imprimable
function previewPrintableTree() {
    const html = generatePrintableHTML();
    const embedImages = document.getElementById('embed-images')?.checked ?? true;
    
    const previewWindow = window.open('', '_blank');
    previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Aperçu - Arbre généalogique</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    background: #f5f5f5;
                    padding: 20px;
                    font-family: Arial, sans-serif;
                    margin: 0;
                }
                .preview-container {
                    max-width: 1000px;
                    margin: 0 auto;
                    background: white;
                    padding: 40px;
                    box-shadow: 0 0 20px rgba(0,0,0,0.1);
                }
                .preview-header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #18bc9c;
                }
                .preview-header h1 {
                    margin: 0;
                    color: #2c3e50;
                }
                .preview-header p {
                    color: #7f8c8d;
                    margin-top: 5px;
                }
                ${getPrintableStyles()}
                @media print {
                    body { background: white; padding: 0; }
                    .preview-container { box-shadow: none; padding: 20px; }
                }
            </style>
        </head>
        <body>
            <div class="preview-container">
                
                <div class="preview-header">
                    <h1>Arbre généalogique - Famille MBOZO'O</h1>
                    <p>Généré le ${new Date().toLocaleDateString('fr-FR')}</p>
                </div>
                ${html}
            </div>
        </body>
        </html>
    `);
}

// Générer et télécharger l'arbre imprimable
function generatePrintableTree() {
    const html = generatePrintableHTML();
    const styles = getPrintableStyles();
    const embedImages = document.getElementById('embed-images')?.checked ?? true;
    
    // Résoudre les chemins d'images si nécessaire
    const finalHTML = embedImages ? resolveImagePaths(html) : html;
    
    const fullHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Arbre généalogique - Famille MBOZO'O</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: ${selectedFormat === 'poster' ? '0' : '20px'};
                    background: white;
                }
                .print-container {
                    max-width: ${getFormatWidth()};
                    margin: 0 auto;
                    background: white;
                    padding: 20px;
                }
                .print-header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 3px solid #18bc9c;
                }
                .print-header h1 {
                    color: #2c3e50;
                    font-size: ${selectedFormat === 'poster' ? '32px' : '24px'};
                    margin: 0;
                }
                .print-header p {
                    color: #7f8c8d;
                    margin-top: 5px;
                }
                .print-footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    text-align: center;
                    font-size: 12px;
                    color: #95a5a6;
                }
                ${styles}
                @media print {
                    body { padding: 0; }
                    .print-container { max-width: 100%; }
                }
            </style>
        </head>
        <body>
            <div class="print-container">
                <div class="print-header">
                    <h1>🌳 Arbre généalogique de la Famille MBOZO'O</h1>
                    <p>Document généré le ${new Date().toLocaleDateString('fr-FR')}</p>
                </div>
                
                ${finalHTML}
                
                <div class="print-footer">
                    <p>© ${new Date().getFullYear()} - Arbre généalogique MBOZO'O - Tous droits réservés</p>
                    <p>Document imprimable - ${getFormatLabel()}</p>
                </div>
            </div>
        </body>
        </html>
    `;
    
    // Télécharger le fichier
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `arbre_genealogique_${selectedTreeType}_${new Date().toISOString().slice(0,10)}.html`;
    link.click();
    URL.revokeObjectURL(url);
    
    showNotification("Arbre généré avec succès ! Ouvrez le fichier et imprimez-le.", "success");
}

// ============================
// NOUVELLE FONCTION : Résoudre les chemins d'images
// ============================
function resolveImagePaths(html) {
    // Convertir les chemins relatifs en chemins absolus
    const baseUrl = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    
    // Remplacer src="./images/" par le chemin absolu
    return html.replace(/src="\.\/images\//g, `src="${baseUrl}images/`);
}

// ============================
// NOUVELLE FONCTION : Convertir une image en base64
// ============================
function imageToBase64(imgPath) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/png');
            resolve(dataURL);
        };
        img.onerror = reject;
        img.src = imgPath;
    });
}

// ============================
// NOUVELLE FONCTION : Générer un avatar de secours
// ============================
function generateAvatarHTML(initial) {
    return `
        <div style="
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, #2c3e50, #18bc9c);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 1.5rem;
        ">${initial}</div>
    `;
}

// Générer le HTML de l'arbre
function generatePrintableHTML() {
    const showPhotos = document.getElementById('show-photos')?.checked ?? true;
    const showDates = document.getElementById('show-dates')?.checked ?? true;
    const showRelations = document.getElementById('show-relations')?.checked ?? true;
    const colorCoded = document.getElementById('color-coded')?.checked ?? false;
    
    switch(selectedTreeType) {
        case 'full':
            return generateFullTreeHTML(showPhotos, showDates, showRelations, colorCoded);
        case 'descendants':
            return generateDescendantsTreeHTML(showPhotos, showDates, showRelations, colorCoded);
        case 'ancestors':
            return generateAncestorsTreeHTML(showPhotos, showDates, showRelations, colorCoded);
        default:
            return generateFullTreeHTML(showPhotos, showDates, showRelations, colorCoded);
    }
}

// Générer l'arbre complet
function generateFullTreeHTML(showPhotos, showDates, showRelations, colorCoded) {
    const membersByGeneration = {};
    familyMembers.forEach(member => {
        if (!member.Generation) return;
        const gen = member.Generation;
        if (!membersByGeneration[gen]) membersByGeneration[gen] = [];
        membersByGeneration[gen].push(member);
    });
    
    const generations = Object.keys(membersByGeneration).sort((a, b) => a - b);
    
    let html = '<div class="printable-tree">';
    
    generations.forEach(gen => {
        html += `
            <div class="print-generation">
                <div class="print-gen-label">Génération ${gen}</div>
                <div class="print-members">
        `;
        
        membersByGeneration[gen].forEach(member => {
            html += generateMemberCard(member, showPhotos, showDates, showRelations, colorCoded);
        });
        
        html += '</div></div>';
    });
    
    html += '</div>';
    return html;
}

// Générer l'arbre des descendants
function generateDescendantsTreeHTML(showPhotos, showDates, showRelations, colorCoded) {
    if (!selectedMemberId) {
        return '<p class="error-message">Veuillez sélectionner un membre d\'abord</p>';
    }
    
    const descendants = getAllDescendants(selectedMemberId);
    const rootMember = familyMembers.find(m => m.ID === selectedMemberId);
    
    let html = `
        <div class="printable-tree descendants-tree">
            <div class="print-root">
                <div class="print-gen-label">Racine</div>
                <div class="print-members">
                    ${generateMemberCard(rootMember, showPhotos, showDates, showRelations, colorCoded, true)}
                </div>
            </div>
    `;
    
    // Organiser par génération
    const byGeneration = {};
    descendants.forEach(id => {
        if (id === selectedMemberId) return;
        const member = familyMembers.find(m => m.ID === id);
        if (member && member.Generation) {
            if (!byGeneration[member.Generation]) byGeneration[member.Generation] = [];
            byGeneration[member.Generation].push(member);
        }
    });
    
    Object.keys(byGeneration).sort().forEach(gen => {
        html += `
            <div class="print-generation">
                <div class="print-gen-label">Génération ${gen}</div>
                <div class="print-members">
                    ${byGeneration[gen].map(m => generateMemberCard(m, showPhotos, showDates, showRelations, colorCoded)).join('')}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// Générer l'arbre des ancêtres
function generateAncestorsTreeHTML(showPhotos, showDates, showRelations, colorCoded) {
    if (!selectedMemberId) {
        return '<p class="error-message">Veuillez sélectionner un membre d\'abord</p>';
    }
    
    const ancestors = findAncestors(selectedMemberId, 5);
    const rootMember = familyMembers.find(m => m.ID === selectedMemberId);
    
    let html = `
        <div class="printable-tree ancestors-tree">
            <div class="print-root">
                <div class="print-gen-label">Membre</div>
                <div class="print-members">
                    ${generateMemberCard(rootMember, showPhotos, showDates, showRelations, colorCoded, true)}
                </div>
            </div>
    `;
    
    // Organiser par niveau
    const byLevel = {};
    ancestors.forEach(a => {
        if (!byLevel[a.genLevel]) byLevel[a.genLevel] = [];
        byLevel[a.genLevel].push(a);
    });
    
    for (let level = 1; level <= 5; level++) {
        if (byLevel[level]) {
            html += `
                <div class="print-generation">
                    <div class="print-gen-label">${getLevelLabel(level)}</div>
                    <div class="print-members">
                        ${byLevel[level].map(m => generateMemberCard(m, showPhotos, showDates, showRelations, colorCoded)).join('')}
                    </div>
                </div>
            `;
        }
    }
    
    html += '</div>';
    return html;
}

// Générer une carte membre (VERSION CORRIGÉE AVEC IMAGES)
function generateMemberCard(member, showPhotos, showDates, showRelations, colorCoded, isRoot = false) {
    const fullName = `${member.Prennom || ''} ${member.Nom || ''}`.trim() || 'Inconnu';
    const gender = member.Sexe === 'M' ? '♂' : (member.Sexe === 'F' ? '♀' : '');
    const birthDate = member.DateNaissance && member.DateNaissance !== '0000-00-00' 
        ? member.DateNaissance.substring(0, 4) 
        : '';
    const deathInfo = member.estDecede && member.anneeDeces ? `- ${member.anneeDeces}` : '';
    const relation = getRelationText(member);
    const initial = fullName.charAt(0).toUpperCase();
    
    // Vérifier si l'image existe
    let avatarHTML = '';
    if (showPhotos) {
        if (member.URL_img && member.URL_img.trim() !== '') {
            // Essayer de charger l'image, avec fallback
            avatarHTML = `
                <div class="print-avatar">
                    <img src="${member.URL_img}" 
                         alt="${fullName}"
                         onerror="this.style.display='none'; this.parentElement.innerHTML='${initial}'; this.parentElement.style.background='linear-gradient(135deg, #2c3e50, #18bc9c)';">
                </div>
            `;
        } else {
            // Pas d'image : utiliser l'initiale
            avatarHTML = `
                <div class="print-avatar" style="background: linear-gradient(135deg, #2c3e50, #18bc9c);">
                    <span>${initial}</span>
                </div>
            `;
        }
    }
    
    return `
        <div class="print-card ${isRoot ? 'root-card' : ''} ${colorCoded ? `gen-${member.Generation}` : ''}">
            ${showPhotos ? avatarHTML : ''}
            
            <div class="print-info">
                <div class="print-name">
                    <strong>${fullName}</strong> ${gender}
                </div>
                
                ${showDates && (birthDate || deathInfo) ? `
                    <div class="print-dates">
                        ${birthDate} ${deathInfo}
                    </div>
                ` : ''}
                
                ${showRelations ? `
                    <div class="print-relation">
                        ${relation}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Obtenir le libellé du niveau
function getLevelLabel(level) {
    switch(level) {
        case 1: return 'Parents';
        case 2: return 'Grands-parents';
        case 3: return 'Arrière-grands-parents';
        case 4: return 'Arrière-arrière-grands-parents';
        case 5: return 'Arrière-arrière-arrière-grands-parents';
        default: return `Génération +${level}`;
    }
}

// Obtenir la largeur du format
function getFormatWidth() {
    switch(selectedFormat) {
        case 'a4': return '800px';
        case 'a3': return '1000px';
        case 'poster': return '1200px';
        default: return '800px';
    }
}

// Obtenir le libellé du format
function getFormatLabel() {
    switch(selectedFormat) {
        case 'a4': return 'Format A4 (21 x 29.7 cm)';
        case 'a3': return 'Format A3 (29.7 x 42 cm)';
        case 'poster': return 'Format Poster (50 x 70 cm)';
        default: return 'Format standard';
    }
}

// Obtenir les styles pour l'impression (VERSION CORRIGÉE)
function getPrintableStyles() {
    return `
        .printable-tree {
            display: flex;
            flex-direction: column;
            gap: 40px;
        }
        
        .print-generation {
            page-break-inside: avoid;
        }
        
        .print-gen-label {
            font-size: 1.2rem;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 2px solid #18bc9c;
        }
        
        .print-members {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 20px;
        }
        
        .print-card {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 10px;
            border-left: 4px solid #18bc9c;
            page-break-inside: avoid;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        
        .print-card.root-card {
            background: linear-gradient(135deg, #2c3e50, #34495e);
            color: white;
            border-left-color: #f39c12;
        }
        
        .print-card.root-card .print-relation {
            color: rgba(255,255,255,0.9);
        }
        
        .print-avatar {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, #2c3e50, #18bc9c);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 1.2rem;
            flex-shrink: 0;
            overflow: hidden;
        }
        
        .print-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .print-avatar span {
            font-size: 1.5rem;
        }
        
        .print-info {
            flex: 1;
            min-width: 0;
        }
        
        .print-name {
            font-size: 0.95rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-bottom: 3px;
        }
        
        .print-dates {
            font-size: 0.8rem;
            color: #7f8c8d;
            margin-top: 2px;
        }
        
        .print-relation {
            font-size: 0.7rem;
            color: #95a5a6;
            margin-top: 2px;
            display: inline-block;
            padding: 2px 8px;
            background: rgba(0,0,0,0.03);
            border-radius: 12px;
        }
        
        .print-card.root-card .print-dates,
        .print-card.root-card .print-relation {
            color: rgba(255,255,255,0.7);
        }
        
        .print-card.root-card .print-relation {
            background: rgba(255,255,255,0.1);
        }
        
        /* Code couleur par génération */
        .gen-1 { border-left-color: #3498db; }
        .gen-2 { border-left-color: #2ecc71; }
        .gen-3 { border-left-color: #f39c12; }
        .gen-4 { border-left-color: #e74c3c; }
        .gen-5 { border-left-color: #9b59b6; }
        
        .error-message {
            padding: 20px;
            background: #f8d7da;
            color: #721c24;
            border-radius: 5px;
            text-align: center;
        }
        
        @media print {
            .print-card {
                break-inside: avoid;
                box-shadow: none;
                border: 1px solid #ddd;
            }
            
            .print-generation {
                break-inside: avoid;
            }
            
            .print-gen-label {
                color: black;
            }
            
            .print-dates, .print-relation {
                color: #555 !important;
            }
            
            .print-avatar {
                border: 1px solid #ddd;
            }
        }
    `;
}