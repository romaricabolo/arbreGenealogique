// ============================
// PARTAGE DE PROFIL
// ============================

// Générer un lien unique vers un membre
function shareMemberProfile(memberId) {
    const member = familyMembers.find(m => m.ID === memberId);
    if (!member) return;
    
    // Créer l'URL avec le paramètre id
    const url = new URL(window.location.href);
    url.searchParams.set('id', memberId);
    
    // Copier dans le presse-papier
    navigator.clipboard.writeText(url.toString()).then(() => {
        showNotification("Lien copié dans le presse-papier !", "success");
    }).catch(() => {
        // Fallback pour les navigateurs qui ne supportent pas clipboard
        const textarea = document.createElement('textarea');
        textarea.value = url.toString();
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showNotification("Lien copié dans le presse-papier !", "success");
    });
    
    // Afficher le dialogue de partage
    showShareDialog(member, url.toString());
}

// Afficher le dialogue de partage
function showShareDialog(member, url) {
    const fullName = `${member.Prennom} ${member.Nom}`;
    
    const html = `
        <div class="share-dialog">
            <button class="mobile-close-btn" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
            </button>

            <div class="share-header">
                <div class="share-avatar">
                    ${member.URL_img ? 
                        `<img src="${member.URL_img}" alt="${fullName}">` : 
                        `<span>${fullName.charAt(0)}</span>`
                    }
                </div>
                <div class="share-title">
                    <h3>Partager ${fullName}</h3>
                    <p>Génération ${member.Generation} • ${member.Sexe === 'M' ? 'Homme' : 'Femme'}</p>
                </div>
            </div>
            
            <div class="share-url-container">
                <input type="text" id="shareUrlInput" value="${url}" readonly>
                <button onclick="copyShareUrl()" class="btn btn-primary">
                    <i class="fas fa-copy"></i> Copier
                </button>
            </div>
            
            <div class="share-buttons">
                <h4>Partager sur :</h4>
                <div class="share-social">
                    <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" 
                       target="_blank" class="share-btn facebook">
                        <i class="fab fa-facebook-f"></i> Facebook
                    </a>
                    <a href="https://wa.me/?text=${encodeURIComponent(`Découvrez le profil de ${fullName} dans notre arbre généalogique : ${url}`)}" 
                       target="_blank" class="share-btn whatsapp">
                        <i class="fab fa-whatsapp"></i> WhatsApp
                    </a>
                    <a href="mailto:?subject=Arbre généalogique - ${fullName}&body=Voici le profil de ${fullName} : ${url}" 
                       class="share-btn email">
                        <i class="fas fa-envelope"></i> Email
                    </a>
                    <a href="https://twitter.com/intent/tweet?text=Découvrez ${fullName} dans notre arbre généalogique&url=${encodeURIComponent(url)}" 
                       target="_blank" class="share-btn twitter">
                        <i class="fab fa-twitter"></i> Twitter
                    </a>
                </div>
            </div>
            
            <div class="share-qrcode">
                <h4>Scanner le QR code :</h4>
                <div id="qrcode"></div>
            </div>
        </div>
    `;
    
    showCustomModal('Partager le profil', html);
    
    // Générer le QR code
    setTimeout(() => {
        if (typeof QRCode !== 'undefined') {
            new QRCode(document.getElementById('qrcode'), {
                text: url,
                width: 150,
                height: 150
            });
        }
    }, 100);
}

// Copier l'URL depuis le dialogue
function copyShareUrl() {
    const input = document.getElementById('shareUrlInput');
    input.select();
    input.setSelectionRange(0, 99999);
    document.execCommand('copy');
    showNotification("Lien copié !", "success");
}

// Charger un membre depuis l'URL au démarrage
function loadMemberFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const memberId = urlParams.get('id');
    
    if (memberId) {
        // Attendre que l'arbre soit chargé
        setTimeout(() => {
            selectMemberById(memberId);
        }, 1000);
    }
}

// Modifier l'URL sans recharger la page
function updateUrlWithMember(memberId) {
    const url = new URL(window.location.href);
    url.searchParams.set('id', memberId);
    window.history.pushState({}, '', url);
}

// Modifier selectMemberById pour mettre à jour l'URL
const originalSelectMemberById = selectMemberById;
selectMemberById = function(memberId) {
    originalSelectMemberById(memberId);
    updateUrlWithMember(memberId);
};