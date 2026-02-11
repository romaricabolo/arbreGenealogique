// ============================
// GESTIONNAIRE DE MEMBRES
// ============================

// Variable globale pour stocker le membre en cours d'édition
let currentEditingMember = null;

// ----------------------------
// OUVRIR LE FORMULAIRE D'AJOUT
// ----------------------------
function openAddForm() {
    currentEditingMember = null;
    document.getElementById('formPrenom').value = '';
    document.getElementById('formNom').value = '';
    document.getElementById('formSexe').value = 'M';
    document.getElementById('formDateNaissance').value = '';
    document.getElementById('formDateDeces').value = '';
    document.getElementById('formLieuNaissance').value = '';
    document.getElementById('formTelephone').value = '';
    document.getElementById('formWhatsapp').checked = false;
    document.getElementById('formPere').value = '';
    document.getElementById('formMere').value = '';
    document.getElementById('formConjoints').value = '';
    document.getElementById('formGeneration').value = '';
    document.getElementById('formUrlImg').value = '';
    
    document.getElementById('modalFormTitle').textContent = 'Ajouter un membre';
    document.getElementById('formOverlay').classList.add('active');
}

// ----------------------------
// OUVRIR LE FORMULAIRE DE MODIFICATION
// ----------------------------
function openEditForm(memberId) {
    const member = familyMembers.find(m => m.ID === memberId);
    if (!member) return;
    
    currentEditingMember = member;
    
    document.getElementById('formPrenom').value = member.Prennom || '';
    document.getElementById('formNom').value = member.Nom || '';
    document.getElementById('formSexe').value = member.Sexe || 'M';
    document.getElementById('formDateNaissance').value = member.DateNaissance || '';
    document.getElementById('formDateDeces').value = member.anneeDeces || '';
    document.getElementById('formLieuNaissance').value = member.LieuNaissance || '';
    document.getElementById('formTelephone').value = member.telephone || '';
    document.getElementById('formWhatsapp').checked = member.whatsapp || false;
    document.getElementById('formPere').value = member.ID_Pere || '';
    document.getElementById('formMere').value = member.ID_Mere || '';
    document.getElementById('formConjoints').value = member.ConjointID || '';
    document.getElementById('formGeneration').value = member.Generation || '';
    document.getElementById('formUrlImg').value = member.URL_img || '';
    document.getElementById('formEstDecede').checked = member.estDecede || false;
    
    document.getElementById('modalFormTitle').textContent = 'Modifier le membre';
    document.getElementById('formOverlay').classList.add('active');
    
    // Gérer l'affichage conditionnel de la date de décès
    toggleDecesField();
}

// ----------------------------
// SAUVEGARDER LE MEMBRE
// ----------------------------
function saveMember() {
    // Récupérer les valeurs du formulaire
    const prenom = document.getElementById('formPrenom').value.trim();
    const nom = document.getElementById('formNom').value.trim();
    const sexe = document.getElementById('formSexe').value;
    const dateNaissance = document.getElementById('formDateNaissance').value;
    const anneeDeces = document.getElementById('formDateDeces').value;
    const lieuNaissance = document.getElementById('formLieuNaissance').value;
    const telephone = document.getElementById('formTelephone').value;
    const whatsapp = document.getElementById('formWhatsapp').checked;
    const idPere = document.getElementById('formPere').value;
    const idMere = document.getElementById('formMere').value;
    const conjointID = document.getElementById('formConjoints').value;
    const generation = document.getElementById('formGeneration').value;
    const urlImg = document.getElementById('formUrlImg').value;
    const estDecede = document.getElementById('formEstDecede').checked;
    
    // Validation
    if (!prenom || !nom) {
        showNotification("Le prénom et le nom sont obligatoires", "error");
        return;
    }
    
    if (!generation || isNaN(parseInt(generation))) {
        showNotification("La génération est obligatoire et doit être un nombre", "error");
        return;
    }
    
    // Créer l'objet membre
    const member = {
        ID: currentEditingMember ? currentEditingMember.ID : generateNewId(),
        Generation: generation,
        Prennom: prenom,
        Nom: nom,
        Sexe: sexe,
        DateNaissance: dateNaissance || '0000-00-00',
        LieuNaissance: lieuNaissance || '',
        ID_Pere: idPere || '',
        ID_Mere: idMere || '',
        ConjointID: conjointID || '',
        URL_img: urlImg || '',
        telephone: telephone || '',
        whatsapp: whatsapp,
        estDecede: estDecede,
        anneeDeces: anneeDeces || ''
    };
    
    if (currentEditingMember) {
        // MODIFICATION : remplacer l'ancien membre
        const index = familyMembers.findIndex(m => m.ID === currentEditingMember.ID);
        if (index !== -1) {
            familyMembers[index] = member;
            showNotification(`${prenom} ${nom} a été modifié`, "success");
        }
    } else {
        // AJOUT : ajouter le nouveau membre
        familyMembers.push(member);
        showNotification(`${prenom} ${nom} a été ajouté`, "success");
    }
    
    // Fermer le formulaire
    closeForm();
    
    // Régénérer l'arbre
    saveFamilyData();
    generateModernFamilyTree();
    populateMemberSelect();
}

// ----------------------------
// SUPPRIMER UN MEMBRE
// ----------------------------
function deleteMember(memberId) {
    const member = familyMembers.find(m => m.ID === memberId);
    if (!member) return;
    
    // Vérifier si le membre a des enfants
    const hasChildren = familyMembers.some(m => 
        m.ID_Pere === memberId || m.ID_Mere === memberId
    );
    
    let message = `Êtes-vous sûr de vouloir supprimer ${member.Prennom} ${member.Nom} ?`;
    if (hasChildren) {
        message = `⚠️ ${member.Prennom} ${member.Nom} a des enfants. La suppression va orpheliner ces enfants. Confirmez-vous ?`;
    }
    
    if (confirm(message)) {
        // Supprimer le membre
        const index = familyMembers.findIndex(m => m.ID === memberId);
        if (index !== -1) {
            familyMembers.splice(index, 1);
            
            // Nettoyer les références
            familyMembers.forEach(m => {
                if (m.ID_Pere === memberId) m.ID_Pere = '';
                if (m.ID_Mere === memberId) m.ID_Mere = '';
                
                // Nettoyer les conjoints
                if (m.ConjointID) {
                    const conjoints = m.ConjointID.split(/[, ]+/);
                    const newConjoints = conjoints.filter(id => id !== memberId);
                    m.ConjointID = newConjoints.join(', ');
                }
            });
            
            saveFamilyData();
            generateModernFamilyTree();
            populateMemberSelect();
            closeModal();
            showNotification("Membre supprimé", "success");
        }
    }
}

// ----------------------------
// GÉNÉRER UN NOUVEL ID
// ----------------------------
function generateNewId() {
    // Trouver le plus grand ID numérique
    let maxNum = 0;
    familyMembers.forEach(member => {
        const id = member.ID;
        if (id && id.startsWith('P')) {
            const num = parseInt(id.substring(1));
            if (!isNaN(num) && num > maxNum) {
                maxNum = num;
            }
        }
    });
    
    // Générer le prochain ID (P148, P149...)
    const newNum = maxNum + 1;
    return `P${newNum.toString().padStart(3, '0')}`;
}

// ----------------------------
// SAUVEGARDER DANS LE FICHIER JSON
// ----------------------------
function saveFamilyData() {
    // Convertir en JSON et télécharger
    const dataStr = JSON.stringify(familyMembers, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'famille.json';
    link.click();
    
    URL.revokeObjectURL(url);
}

// ----------------------------
// FERMER LE FORMULAIRE
// ----------------------------
function closeForm() {
    document.getElementById('formOverlay').classList.remove('active');
    currentEditingMember = null;
}

// ----------------------------
// AFFICHER/CACHER LE CHAMP DATE DE DÉCÈS
// ----------------------------
function toggleDecesField() {
    const isDecede = document.getElementById('formEstDecede').checked;
    const decesField = document.getElementById('formDateDecesGroup');
    decesField.style.display = isDecede ? 'block' : 'none';
}

// Initialisation des événements
document.addEventListener('DOMContentLoaded', function() {
    // Ajouter les boutons dans la modal
    const modalActions = document.querySelector('.modal-actions');
    if (modalActions) {
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-edit';
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Modifier';
        editBtn.onclick = function() {
            if (selectedMemberId) {
                openEditForm(selectedMemberId);
                closeModal();
            }
        };
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-delete';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Supprimer';
        deleteBtn.onclick = function() {
            if (selectedMemberId) {
                deleteMember(selectedMemberId);
            }
        };
        
        modalActions.prepend(deleteBtn);
        modalActions.prepend(editBtn);
    }
    
    // Événements du formulaire
    document.getElementById('formCancel').addEventListener('click', closeForm);
    document.getElementById('formSave').addEventListener('click', saveMember);
    document.getElementById('formEstDecede').addEventListener('change', toggleDecesField);
    
    // Overlay click pour fermer
    document.getElementById('formOverlay').addEventListener('click', function(e) {
        if (e.target === this) closeForm();
    });
});