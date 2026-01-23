//----------------------------------------------
//---SCRIPT POUR LA PAGE DES PHOTOS SOUVENIR---
//----------------------------------------------

// Données initiales de photos
const initialPhotos = [
    {
        id: 1,
        title: "Union éternelle",
        author: "Marie Laurent",
        category: "mariage",
        description: "L'échange des alliances sous les regards émus de nos proches.",
        imageUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        likes: 24,
        date: "2023-06-15",
        liked: false
    },
    {
        id: 2,
        title: "Retrouvailles familiales",
        author: "Jean Martin",
        category: "reunion",
        description: "Célébration des 80 ans de grand-mère avec toute la famille réunie.",
        imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        likes: 18,
        date: "2023-05-22",
        liked: false
    },
    {
        id: 3,
        title: "Hommage respectueux",
        author: "Sophie Leroy",
        category: "obseque",
        description: "Un dernier adieu dans la sérénité et le recueillement.",
        imageUrl: "https://images.unsplash.com/photo-1544568807-e4b01b47e62e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        likes: 32,
        date: "2023-04-10",
        liked: false
    },
    {
        id: 4,
        title: "Soutenance réussie",
        author: "Thomas Bernard",
        category: "soutenance",
        description: "Après des années de recherche, le moment tant attendu est arrivé.",
        imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        likes: 42,
        date: "2023-07-05",
        liked: true
    },
    {
        id: 5,
        title: "Horizons montagneux",
        author: "Lucie Moreau",
        category: "divers",
        description: "Randonnée matinale avec une vue à couper le souffle.",
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        likes: 29,
        date: "2023-08-12",
        liked: false
    },
    {
        id: 6,
        title: "Cérémonie traditionnelle",
        author: "Amadou Diallo",
        category: "mariage",
        description: "Mariage coloré célébrant l'union de deux familles et de deux cultures.",
        imageUrl: "https://images.unsplash.com/photo-1560089000-7433a4ebbd64?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        likes: 37,
        date: "2023-09-03",
        liked: false
    }
];

// Éléments DOM
const photosContainer = document.getElementById('photosContainer');
const categoryTabs = document.querySelectorAll('.category-tab');
const openUploadModalBtn = document.getElementById('openUploadModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const uploadModal = document.getElementById('uploadModal');
const uploadFromDevice = document.getElementById('uploadFromDevice');
const uploadFromUrl = document.getElementById('uploadFromUrl');
const fileInput = document.getElementById('fileInput');
const formSection = document.getElementById('formSection');
const cancelUploadBtn = document.getElementById('cancelUploadBtn');
const submitPhotoBtn = document.getElementById('submitPhotoBtn');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
const backToTopBtn = document.getElementById('backToTopBtn');

// État de l'application
let photos = JSON.parse(localStorage.getItem('albumPhotos')) || initialPhotos;
let currentCategory = 'all';
let nextId = photos.length > 0 ? Math.max(...photos.map(p => p.id)) + 1 : 7;
let currentImageData = null;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    displayPhotos(photos);
    setupEventListeners();
    setupBackToTop();
});

// Afficher les photos
function displayPhotos(photosToDisplay) {
    if (photosToDisplay.length === 0) {
        photosContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-images"></i>
                <h3>Aucune photo dans cette catégorie</h3>
                <p>Soyez le premier à partager un moment dans cette catégorie.</p>
                <button class="upload-btn" id="emptyStateUploadBtn">
                    <i class="fas fa-cloud-upload-alt"></i> Ajouter une photo
                </button>
            </div>
        `;
        
        // Ajouter l'événement au bouton dans l'empty state
        document.getElementById('emptyStateUploadBtn')?.addEventListener('click', () => {
            uploadModal.classList.add('active');
        });
        
        return;
    }
    
    photosContainer.innerHTML = '';
    
    photosToDisplay.forEach(photo => {
        const photoCard = document.createElement('div');
        photoCard.className = 'photo-card';
        photoCard.dataset.category = photo.category;
        
        // Formatage de la date
        const formattedDate = new Date(photo.date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        // Couleur de catégorie
        const categoryColors = {
            'mariage': 'var(--mariage-color)',
            'reunion': 'var(--reunion-color)',
            'obseque': 'var(--obseque-color)',
            'soutenance': 'var(--soutenance-color)',
            'divers': 'var(--divers-color)'
        };
        
        // Nom de catégorie
        const categoryNames = {
            'mariage': 'Mariage',
            'reunion': 'Réunion',
            'obseque': 'Obsèques',
            'soutenance': 'Soutenance',
            'divers': 'Divers'
        };
        
        photoCard.innerHTML = `
            <div class="photo-image-container">
                <img src="${photo.imageUrl}" alt="${photo.title}" class="photo-image" onerror="this.src='https://images.unsplash.com/photo-1579546929662-711aa81148cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'">
            </div>
            <div class="photo-content">
                <div class="photo-category" style="background-color: ${categoryColors[photo.category]}">
                    ${categoryNames[photo.category]}
                </div>
                <h3 class="photo-title">${photo.title}</h3>
                <p class="photo-description">${photo.description}</p>
                <div class="photo-meta">
                    <div class="photo-author">
                        <i class="fas fa-user-circle"></i> ${photo.author}
                    </div>
                    <div class="photo-actions">
                        <button class="like-btn ${photo.liked ? 'liked' : ''}" data-id="${photo.id}">
                            <i class="fas fa-heart"></i>
                            <span class="like-count">${photo.likes}</span>
                        </button>
                        <div class="photo-date">${formattedDate}</div>
                    </div>
                </div>
            </div>
        `;
        
        photosContainer.appendChild(photoCard);
    });
    
    // Ajouter les événements pour les boutons "like"
    document.querySelectorAll('.like-btn').forEach(button => {
        button.addEventListener('click', function() {
            const photoId = parseInt(this.dataset.id);
            likePhoto(photoId);
        });
    });
}

// Gestion des likes
function likePhoto(photoId) {
    const photoIndex = photos.findIndex(photo => photo.id === photoId);
    
    if (photoIndex !== -1) {
        const photo = photos[photoIndex];
        
        if (photo.liked) {
            photo.likes--;
            photo.liked = false;
        } else {
            photo.likes++;
            photo.liked = true;
        }
        
        // Mettre à jour le stockage local
        localStorage.setItem('albumPhotos', JSON.stringify(photos));
        
        // Re-afficher les photos selon la catégorie actuelle
        if (currentCategory === 'all') {
            displayPhotos(photos);
        } else {
            displayPhotos(photos.filter(photo => photo.category === currentCategory));
        }
    }
}

// Filtrer par catégorie
function filterByCategory(category) {
    currentCategory = category;
    
    // Mettre à jour les onglets actifs
    categoryTabs.forEach(tab => {
        if (tab.dataset.category === category) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Afficher "Toutes les photos" comme actif si category est 'all'
    document.querySelector('[data-category="all"]').classList.toggle('active', category === 'all');
    
    // Filtrer et afficher les photos
    if (category === 'all') {
        displayPhotos(photos);
    } else {
        const filteredPhotos = photos.filter(photo => photo.category === category);
        displayPhotos(filteredPhotos);
    }
}

// Gérer l'upload depuis l'appareil
function handleFileUpload(event) {
    const file = event.target.files[0];
    
    if (file) {
        // Vérifier que c'est bien une image
        if (!file.type.startsWith('image/')) {
            alert('Veuillez sélectionner un fichier image (JPG, PNG, etc.)');
            return;
        }
        
        // Créer un objet URL pour l'image
        const imageUrl = URL.createObjectURL(file);
        currentImageData = { type: 'file', url: imageUrl, file: file };
        
        // Afficher la prévisualisation
        previewImage.src = imageUrl;
        previewContainer.classList.add('active');
        
        // Afficher le formulaire
        formSection.style.display = 'block';
        
        // Faire défiler vers le formulaire
        setTimeout(() => {
            formSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 300);
    }
}

// Gérer l'upload depuis une URL
function handleUrlUpload() {
    const url = prompt('Veuillez entrer l\'URL de l\'image:');
    
    if (url) {
        // Validation simple de l'URL
        if (!url.startsWith('http')) {
            alert('Veuillez entrer une URL valide (commençant par http ou https)');
            return;
        }
        
        currentImageData = { type: 'url', url: url };
        
        // Afficher la prévisualisation
        previewImage.src = url;
        previewContainer.classList.add('active');
        
        // Afficher le formulaire
        formSection.style.display = 'block';
        
        // Faire défiler vers le formulaire
        setTimeout(() => {
            formSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 300);
    }
}

// Ajouter une nouvelle photo
function addPhoto() {
    const name = document.getElementById('photoName').value.trim();
    const title = document.getElementById('photoTitle').value.trim();
    const category = document.getElementById('photoCategory').value;
    const description = document.getElementById('photoDescription').value.trim();
    
    // Validation
    if (!name || !title || !category || !description || !currentImageData) {
        alert('Veuillez remplir tous les champs et sélectionner une image.');
        return;
    }
    
    let imageUrl;
    
    // Si c'est un fichier, nous devrions normalement l'uploader sur un serveur
    // Pour cette démo, nous utilisons l'URL locale créée par createObjectURL
    if (currentImageData.type === 'file') {
        imageUrl = currentImageData.url;
        // Note: En production, il faudrait uploader le fichier sur un serveur
        // et obtenir une URL permanente
    } else {
        imageUrl = currentImageData.url;
    }
    
    const newPhoto = {
        id: nextId++,
        title: title,
        author: name,
        category: category,
        description: description,
        imageUrl: imageUrl,
        likes: 0,
        date: new Date().toISOString().split('T')[0],
        liked: false
    };
    
    photos.unshift(newPhoto);
    
    // Mettre à jour le stockage local
    localStorage.setItem('albumPhotos', JSON.stringify(photos));
    
    // Fermer le modal et réinitialiser
    closeModal();
    resetForm();
    
    // Afficher les photos selon la catégorie actuelle
    if (currentCategory === 'all' || currentCategory === category) {
        filterByCategory(currentCategory);
    } else {
        // Si on est sur une autre catégorie, on revient à "Toutes les photos"
        filterByCategory('all');
        document.querySelector('[data-category="all"]').classList.add('active');
        document.querySelector(`[data-category="${category}"]`).classList.remove('active');
    }
    
    // Notification de succès
    showNotification('Votre photo a été publiée avec succès !');
}

// Fermer le modal
function closeModal() {
    uploadModal.classList.remove('active');
    resetForm();
}

// Réinitialiser le formulaire
function resetForm() {
    document.getElementById('photoName').value = '';
    document.getElementById('photoTitle').value = '';
    document.getElementById('photoCategory').value = '';
    document.getElementById('photoDescription').value = '';
    
    // Réinitialiser la prévisualisation
    previewImage.src = '';
    previewContainer.classList.remove('active');
    
    // Masquer le formulaire
    formSection.style.display = 'none';
    
    // Réinitialiser l'input fichier
    fileInput.value = '';
    
    currentImageData = null;
}

// Configuration du bouton Back to Top
function setupBackToTop() {
    // Afficher/cacher le bouton selon le défilement
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    // Faire défiler vers le haut
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Afficher une notification
function showNotification(message) {
    // Créer une notification temporaire
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: var(--secondary-color);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1001;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Supprimer après 3 secondes
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
    
    // Ajouter les animations CSS si elles n'existent pas déjà
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Configuration des événements
function setupEventListeners() {
    // Onglets de catégorie
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const category = this.dataset.category;
            filterByCategory(category);
        });
    });
    
    // Modal d'upload
    openUploadModalBtn.addEventListener('click', () => {
        uploadModal.classList.add('active');
    });
    
    closeModalBtn.addEventListener('click', closeModal);
    
    // Fermer le modal en cliquant à l'extérieur
    uploadModal.addEventListener('click', (e) => {
        if (e.target === uploadModal) {
            closeModal();
        }
    });
    
    // Upload depuis l'appareil
    uploadFromDevice.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', handleFileUpload);
    
    // Upload depuis une URL
    uploadFromUrl.addEventListener('click', handleUrlUpload);
    
    // Actions du formulaire
    cancelUploadBtn.addEventListener('click', closeModal);
    submitPhotoBtn.addEventListener('click', addPhoto);
    
    // Touche Échap pour fermer le modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && uploadModal.classList.contains('active')) {
            closeModal();
        }
    });
}