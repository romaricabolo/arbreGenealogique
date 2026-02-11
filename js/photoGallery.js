// ============================
// GALERIE PHOTOS
// ============================

let currentPhotoIndex = 0;
let currentPhotoList = [];

// Fonction principale pour ouvrir la galerie
function openPhotoGallery(memberId) {
    const member = familyMembers.find(m => m.ID === memberId);
    if (!member) {
        showNotification("Membre non trouvé", "error");
        return;
    }
    
    // Collection des photos
    currentPhotoList = [];
    
    // Photo principale
    if (member.URL_img && member.URL_img.trim() !== '') {
        currentPhotoList.push({
            url: member.URL_img,
            title: `${member.Prennom} ${member.Nom}`,
            description: 'Photo principale',
            date: member.DateNaissance
        });
    }
    
    // Photos supplémentaires (stockées dans un champ caché ou tableau)
    if (member.photos && Array.isArray(member.photos)) {
        member.photos.forEach(photo => {
            currentPhotoList.push({
                url: photo.url,
                title: photo.title || `${member.Prennom} ${member.Nom}`,
                description: photo.description || '',
                date: photo.date || ''
            });
        });
    }
    
    // Si aucune photo, utiliser un avatar par défaut
    if (currentPhotoList.length === 0) {
        currentPhotoList.push({
            url: createAvatarUrl(member),
            title: `${member.Prennom} ${member.Nom}`,
            description: 'Avatar',
            isAvatar: true
        });
    }
    
    currentPhotoIndex = 0;
    renderGallery();
}

// Créer une URL d'avatar basée sur les initiales
function createAvatarUrl(member) {
    const initials = (member.Prennom?.charAt(0) || '') + (member.Nom?.charAt(0) || '');
    const colors = ['2c3e50', '18bc9c', 'f39c12', 'e74c3c', '3498db', '9b59b6'];
    const color = colors[member.ID ? parseInt(member.ID.replace(/\D/g, '')) % colors.length : 0];
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${color}&color=fff&size=200`;
}

// Afficher la galerie
function renderGallery() {
    if (currentPhotoList.length === 0) {
        showNotification("Aucune photo disponible", "error");
        return;
    }
    
    const photo = currentPhotoList[currentPhotoIndex];
    
    // Générer les miniatures
    let thumbnails = '';
    currentPhotoList.forEach((p, idx) => {
        thumbnails += `
            <div class="gallery-thumb ${idx === currentPhotoIndex ? 'active' : ''}" 
                 onclick="setPhotoIndex(${idx})">
                <img src="${p.url}" alt="${p.title}" 
                     onerror="this.src='${createAvatarUrl({Prennom: '?', Nom: '?'})}'">
            </div>
        `;
    });
    
    // Navigation
    const prevBtn = currentPhotoIndex > 0 ? 
        '<button class="gallery-nav prev" onclick="prevPhoto()"><i class="fas fa-chevron-left"></i></button>' : '';
    const nextBtn = currentPhotoIndex < currentPhotoList.length - 1 ? 
        '<button class="gallery-nav next" onclick="nextPhoto()"><i class="fas fa-chevron-right"></i></button>' : '';
    
    const html = `
        <div class="gallery-container">
            <div class="gallery-main">
                <img src="${photo.url}" alt="${photo.title}" 
                     onerror="this.src='${createAvatarUrl({Prennom: '?', Nom: '?'})}'">
                ${prevBtn}
                ${nextBtn}
                <div class="gallery-caption">
                    <h4>${photo.title}</h4>
                    ${photo.description ? `<p>${photo.description}</p>` : ''}
                    ${photo.date ? `<small>${photo.date}</small>` : ''}
                </div>
            </div>
            
            ${currentPhotoList.length > 1 ? `
                <div class="gallery-thumbnails">
                    ${thumbnails}
                </div>
                <div class="gallery-counter">
                    ${currentPhotoIndex + 1} / ${currentPhotoList.length}
                </div>
            ` : ''}
            
            <div class="gallery-actions">
                <button onclick="uploadPhoto()" class="btn btn-primary">
                    <i class="fas fa-upload"></i> Ajouter une photo
                </button>
                <button onclick="closeGallery()" class="btn btn-outline">
                    <i class="fas fa-times"></i> Fermer
                </button>
            </div>
        </div>
    `;
    
    showCustomModal('Galerie photos', html);
}

// Navigation
function nextPhoto() {
    if (currentPhotoIndex < currentPhotoList.length - 1) {
        currentPhotoIndex++;
        renderGallery();
    }
}

function prevPhoto() {
    if (currentPhotoIndex > 0) {
        currentPhotoIndex--;
        renderGallery();
    }
}

function setPhotoIndex(index) {
    if (index >= 0 && index < currentPhotoList.length) {
        currentPhotoIndex = index;
        renderGallery();
    }
}

// Upload de photo
function uploadPhoto() {
    if (!selectedMemberId) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const member = familyMembers.find(m => m.ID === selectedMemberId);
                if (member) {
                    // Ajouter la photo
                    if (!member.photos) member.photos = [];
                    member.photos.push({
                        url: event.target.result,
                        title: `${member.Prennom} ${member.Nom}`,
                        description: 'Photo ajoutée',
                        date: new Date().toISOString().split('T')[0]
                    });
                    
                    // Sauvegarder
                    if (typeof saveFamilyData === 'function') {
                        saveFamilyData();
                    }
                    
                    showNotification("Photo ajoutée avec succès", "success");
                    
                    // Réafficher la galerie
                    openPhotoGallery(selectedMemberId);
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    input.click();
}

// Fermer la galerie
function closeGallery() {
    const modal = document.querySelector('.modal-overlay.active');
    if (modal) modal.remove();
}

// Style CSS à injecter
function injectGalleryCSS() {
    const style = document.createElement('style');
    style.textContent = `
        .gallery-container {
            max-width: 800px;
            padding: 20px;
        }
        
        .gallery-main {
            position: relative;
            width: 100%;
            height: 400px;
            background: #f8f9fa;
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 20px;
        }
        
        .gallery-main img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        
        .gallery-nav {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 40px;
            height: 40px;
            border: none;
            border-radius: 50%;
            background: rgba(0,0,0,0.5);
            color: white;
            font-size: 1.2rem;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .gallery-nav:hover {
            background: rgba(0,0,0,0.8);
            transform: translateY(-50%) scale(1.1);
        }
        
        .gallery-nav.prev { left: 15px; }
        .gallery-nav.next { right: 15px; }
        
        .gallery-caption {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(transparent, rgba(0,0,0,0.8));
            color: white;
            padding: 20px;
        }
        
        .gallery-caption h4 {
            margin: 0 0 5px 0;
            font-size: 1.2rem;
        }
        
        .gallery-caption p {
            margin: 0;
            font-size: 0.9rem;
            opacity: 0.9;
        }
        
        .gallery-thumbnails {
            display: flex;
            gap: 10px;
            overflow-x: auto;
            padding: 10px 0;
            margin-bottom: 15px;
        }
        
        .gallery-thumb {
            width: 70px;
            height: 70px;
            flex-shrink: 0;
            border-radius: 8px;
            overflow: hidden;
            cursor: pointer;
            border: 3px solid transparent;
            transition: all 0.2s;
        }
        
        .gallery-thumb img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .gallery-thumb.active {
            border-color: var(--secondary-color);
            transform: scale(1.05);
        }
        
        .gallery-counter {
            text-align: center;
            color: var(--dark-gray);
            font-size: 0.9rem;
            margin-bottom: 15px;
        }
        
        .gallery-actions {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-top: 20px;
        }
        
        .btn-gallery {
            background: linear-gradient(135deg, #9b59b6, #8e44ad);
            color: white;
        }
        
        .btn-gallery i {
            margin-right: 5px;
        }
    `;
    
    document.head.appendChild(style);
}

// Initialiser
injectGalleryCSS();