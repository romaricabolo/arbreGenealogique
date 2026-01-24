// ============================
// VARIABLES GLOBALES
// ============================
let familyMembers = [];
let currentSearchResults = [];
let searchTimeout = null;
let selectedMemberId = null;
let zoomLevel = 1;
let panOffset = { x: 0, y: 0 };
let isDragging = false;
let startDragPos = { x: 0, y: 0 };
let lastScrollTop = 0;
let isHeaderVisible = true;

// ============================
// INITIALISATION
// ============================
document.addEventListener('DOMContentLoaded', function() {
    // Mettre à jour l'année dans le footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // Initialiser le scroll pour l'en-tête
    initScrollHeader();
    
    // Charger les données depuis le fichier JSON
    loadFamilyData();
    
    // Initialiser les événements
    initEvents();
});

// ============================
// GESTION DU SCROLL DE L'EN-TÊTE
// ============================
function initScrollHeader() {
    const header = document.querySelector('.site-header');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling vers le bas - cacher l'en-tête
            header.style.transform = 'translateY(-100%)';
            header.style.transition = 'transform 0.3s ease';
        } else {
            // Scrolling vers le haut - montrer l'en-tête
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });
}

// ============================
// CHARGEMENT DES DONNÉES
// ============================
async function loadFamilyData() {
    showLoading(true);
    
    try {
        const response = await fetch('famille.json');
        
        if (response.ok) {
            const data = await response.json();
            
            if (Array.isArray(data)) {
                familyMembers = data;
                console.log(`${familyMembers.length} membres chargés`);
            } else {
                throw new Error("Format de fichier non reconnu");
            }
        } else {
            throw new Error("Fichier non trouvé");
        }
    } catch (error) {
        console.error("Erreur de chargement:", error);
        showNotification("Erreur de chargement des données. Utilisation des données d'exemple.", "error");
        loadSampleData();
    }
    
    // Générer l'arbre généalogique moderne
    generateModernFamilyTree();
    
    showLoading(false);
}

// Données d'exemple en cas d'erreur
function loadSampleData() {
    familyMembers = [
        {
            "ID": "P001",
            "Generation": "1",
            "Prennom": "Pierre",
            "Nom": "MBOZO'O",
            "Sexe": "M",
            "DateNaissance": "1920-00-00",
            "ID_Pere": "",
            "ID_Mere": "",
            "ConjointID": "P002",
            "URL_img": "./images/mbozo'o_pierre.jpg"
        },
        {
            "ID": "P002",
            "Generation": "1",
            "Prennom": "Anne",
            "Nom": "MBOLE",
            "Sexe": "F",
            "DateNaissance": "1935-01-01",
            "ID_Pere": "",
            "ID_Mere": "",
            "ConjointID": "P001",
            "URL_img": ""
        }
    ];
}

// ============================
// GÉNÉRATION DE L'ARBRE MODERNE
// ============================
function generateModernFamilyTree() {
    const treeWrapper = document.getElementById('treeWrapper');
    treeWrapper.innerHTML = '';
    
    // Organiser les membres par génération
    const membersByGeneration = {};
    const nodePositions = {};
    
    familyMembers.forEach(member => {
        const generation = member.Generation;
        
        if (!membersByGeneration[generation]) {
            membersByGeneration[generation] = [];
        }
        
        membersByGeneration[generation].push(member);
    });
    
    // Calculer les positions des nœuds avec espacement amélioré
    let yPos = 50;
    const generations = Object.keys(membersByGeneration).sort((a, b) => a - b);
    const containerWidth = document.getElementById('treeContainer').clientWidth;
    
    generations.forEach(generation => {
        const members = membersByGeneration[generation];
        const count = members.length;
        
        // Calculer l'espacement optimal pour éviter la superposition
        const minNodeWidth = 220; // Largeur minimale d'un nœud
        const horizontalPadding = 40; // Marge latérale
        const availableWidth = containerWidth - (horizontalPadding * 2);
        
        // Vérifier si on a assez d'espace
        const neededWidth = count * minNodeWidth;
        
        if (neededWidth > availableWidth) {
            // Pas assez d'espace, on utilise le défilement horizontal
            let xPos = horizontalPadding;
            members.forEach((member, index) => {
                nodePositions[member.ID] = { x: xPos, y: yPos, generation: generation };
                
                // Créer le nœud
                const node = createModernNode(member);
                node.style.left = `${xPos}px`;
                node.style.top = `${yPos}px`;
                treeWrapper.appendChild(node);
                
                xPos += minNodeWidth + 20; // Espacement entre les nœuds
            });
            
            // Ajuster la largeur du wrapper pour permettre le défilement
            treeWrapper.style.minWidth = `${xPos + horizontalPadding}px`;
        } else {
            // Assez d'espace, centrer les nœuds
            const xSpacing = availableWidth / (count + 1);
            
            members.forEach((member, index) => {
                const xPos = horizontalPadding + ((index + 1) * xSpacing) - (minNodeWidth / 2);
                nodePositions[member.ID] = { x: xPos, y: yPos, generation: generation };
                
                // Créer le nœud
                const node = createModernNode(member);
                node.style.left = `${xPos}px`;
                node.style.top = `${yPos}px`;
                treeWrapper.appendChild(node);
            });
        }
        
        yPos += 150; // Espacement vertical entre générations (augmenté)
    });
    
    // Créer les connexions entre les nœuds
    createNodeConnections(nodePositions);
    
    // Mettre à jour les compteurs de génération
    updateGenerationCounts(membersByGeneration);
    
    // Mettre à jour la légende
    updateLegendCounts(membersByGeneration);
    
    // Ajuster la hauteur du wrapper
    treeWrapper.style.minHeight = `${yPos + 50}px`;
}
//FONCTION POUR AJUSTER LA TAILLE DE L
function adjustTreeContainerSize() {
    const treeContainer = document.getElementById('treeContainer');
    const treeWrapper = document.getElementById('treeWrapper');
    
    // S'assurer que le container est assez grand
    treeContainer.style.minHeight = '600px';
    treeContainer.style.overflow = 'auto';
    
    // Redimensionner lors du redimensionnement de la fenêtre
    window.addEventListener('resize', function() {
        // Regénérer l'arbre pour réajuster les positions
        generateModernFamilyTree();
    });
}

// ============================
// CRÉATION D'UN NŒUD MODERNE
// ============================
function createModernNode(member) {
    const node = document.createElement('div');
    node.className = `family-node gen-${member.Generation}`;
    node.dataset.id = member.ID;
    node.dataset.generation = member.Generation;
    
    // Initiales pour l'avatar
    const firstName = member.Prennom || '';
    const lastName = member.Nom || '';
    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    
    // Icone de genre
    const gender = member.Sexe;
    const genderIcon = gender === 'F' ? '♀' : (gender === 'M' ? '♂' : '');
    
    // Date de naissance formatée
    const birthDate = member.DateNaissance;
    let yearInfo = '';
    if (birthDate && birthDate !== '0000-00-00') {
        const year = birthDate.substring(0, 4);
        if (year !== '0000') {
            yearInfo = `Né(e) en ${year}`;
        }
    }
    
    node.innerHTML = `
        <div class="node-header">
            <div class="node-avatar">
                ${member.URL_img ? 
                    `<img src="${member.URL_img}" alt="${firstName} ${lastName}" 
                         onerror="this.onerror=null; this.style.display='none'; this.parentElement.innerHTML='${initials}'">` 
                    : `<span>${initials}</span>`}
            </div>
            <div>
                <div class="node-name">${firstName} ${lastName} ${genderIcon}</div>
                <div class="node-details">${yearInfo || 'Date inconnue'}</div>
            </div>
        </div>
        <div class="node-relation">${getRelationText(member)}</div>
    `;
    
    return node;
}

// ============================
// CRÉATION DES CONNEXIONS
// ============================
function createNodeConnections(nodePositions) {
    const treeWrapper = document.getElementById('treeWrapper');
    
    familyMembers.forEach(member => {
        const childPos = nodePositions[member.ID];
        if (!childPos) return;
        
        // Connexion avec le père
        if (member.ID_Pere && nodePositions[member.ID_Pere]) {
            const parentPos = nodePositions[member.ID_Pere];
            createConnection(parentPos.x + 100, parentPos.y + 50, childPos.x + 100, childPos.y, 'parent');
        }
        
        // Connexion avec la mère
        if (member.ID_Mere && nodePositions[member.ID_Mere]) {
            const parentPos = nodePositions[member.ID_Mere];
            createConnection(parentPos.x + 100, parentPos.y + 50, childPos.x + 100, childPos.y, 'parent');
        }
        
        // Connexion avec le conjoint
        if (member.ConjointID && nodePositions[member.ConjointID]) {
            const spousePos = nodePositions[member.ConjointID];
            createConnection(childPos.x + 100, childPos.y + 25, spousePos.x + 100, spousePos.y + 25, 'spouse');
        }
    });
}

function createConnection(x1, y1, x2, y2, type) {
    const treeWrapper = document.getElementById('treeWrapper');
    
    const connection = document.createElement('div');
    connection.className = 'tree-connection';
    connection.classList.add(type);
    
    // Calculer la longueur et l'angle
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    connection.style.width = `${length}px`;
    connection.style.left = `${x1}px`;
    connection.style.top = `${y1}px`;
    connection.style.transform = `rotate(${angle}deg)`;
    connection.style.transformOrigin = '0 0';
    
    // Style selon le type de connexion
    if (type === 'parent') {
        connection.style.background = 'linear-gradient(90deg, #3498db, #2ecc71)';
        connection.style.height = '2px';
    } else if (type === 'spouse') {
        connection.style.background = 'linear-gradient(90deg, #e74c3c, #f39c12)';
        connection.style.height = '1px';
        connection.style.borderBottom = '1px dashed #e74c3c';
    }
    
    treeWrapper.appendChild(connection);
}

// ============================
// GESTION DES ÉVÉNEMENTS
// ============================
function initEvents() {
    // Navigation entre générations
    document.querySelectorAll('.nav-btn').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const generation = this.dataset.gen;
            filterByGeneration(generation);
            clearSearch();
        });
    });
    
    // Recherche
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('searchInput').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        } else {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                showSearchSuggestions(this.value);
            }, 300);
        }
    });
    
    document.getElementById('clearSearchBtn').addEventListener('click', clearSearch);
    
    // Clic sur un nœud
    document.addEventListener('click', function(e) {
        const node = e.target.closest('.family-node');
        if (node) {
            const memberId = node.dataset.id;
            selectedMemberId = memberId;
            showMemberModal(memberId);
            
            // Mettre en surbrillance
            document.querySelectorAll('.family-node').forEach(n => {
                n.classList.remove('active');
            });
            node.classList.add('active');
            
            // Centrer sur le nœud
            centerNode(node);
        }
        
        // Clic sur une suggestion
        const suggestion = e.target.closest('.suggestion-item');
        if (suggestion) {
            const memberId = suggestion.dataset.id;
            document.getElementById('searchInput').value = suggestion.querySelector('.suggestion-name').textContent;
            document.getElementById('searchSuggestions').classList.remove('active');
            performSearch();
            showMemberModal(memberId);
        }
    });
    
    // Fermer la modal
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    // Contrôles de zoom
    document.getElementById('zoomIn').addEventListener('click', () => zoomTree(0.2));
    document.getElementById('zoomOut').addEventListener('click', () => zoomTree(-0.2));
    document.getElementById('zoomReset').addEventListener('click', resetZoom);
    
    // Navigation dans l'arbre
    const treeContainer = document.getElementById('treeContainer');
    treeContainer.addEventListener('mousedown', startDrag);
    treeContainer.addEventListener('mousemove', dragTree);
    treeContainer.addEventListener('mouseup', stopDrag);
    treeContainer.addEventListener('mouseleave', stopDrag);
    treeContainer.addEventListener('wheel', handleWheel, { passive: false });
    
    // Touche Échap pour fermer la modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
    
    // Afficher un membre au hasard au chargement
    setTimeout(() => {
        if (familyMembers.length > 0) {
            const randomIndex = Math.floor(Math.random() * familyMembers.length);
            const randomMember = familyMembers[randomIndex];
            selectedMemberId = randomMember.ID;
            
            const node = document.querySelector(`.family-node[data-id="${randomMember.ID}"]`);
            if (node) {
                node.classList.add('active');
                centerNode(node);
                // Afficher la modal après un délai
                setTimeout(() => showMemberModal(randomMember.ID), 1000);
            }
        }
    }, 1500);
     // Ajuster la taille du container de l'arbre
    setTimeout(adjustTreeContainerSize, 100);
}

// ============================
// FONCTIONS DE ZOOM ET NAVIGATION
// ============================
function zoomTree(delta) {
    const treeWrapper = document.getElementById('treeWrapper');
    zoomLevel = Math.min(Math.max(0.5, zoomLevel + delta), 3);
    applyTreeTransform();
}

function resetZoom() {
    zoomLevel = 1;
    panOffset = { x: 0, y: 0 };
    applyTreeTransform();
}

function applyTreeTransform() {
    const treeWrapper = document.getElementById('treeWrapper');
    treeWrapper.style.transform = `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`;
}

function startDrag(e) {
    if (e.target.closest('.family-node')) return;
    e.preventDefault();
    isDragging = true;
    startDragPos = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    document.body.style.cursor = 'grabbing';
}

function dragTree(e) {
    if (!isDragging) return;
    e.preventDefault();
    panOffset.x = e.clientX - startDragPos.x;
    panOffset.y = e.clientY - startDragPos.y;
    applyTreeTransform();
}

function stopDrag() {
    isDragging = false;
    document.body.style.cursor = '';
}

function handleWheel(e) {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
        zoomTree(e.deltaY > 0 ? -0.1 : 0.1);
    } else {
        panOffset.x -= e.deltaX * 0.5;
        panOffset.y -= e.deltaY * 0.5;
        applyTreeTransform();
    }
}

function centerNode(node) {
    if (!node) return;
    
    const treeContainer = document.getElementById('treeContainer');
    const containerWidth = treeContainer.clientWidth;
    const containerHeight = treeContainer.clientHeight;
    
    const rect = node.getBoundingClientRect();
    const treeRect = treeContainer.getBoundingClientRect();
    
    const nodeCenterX = rect.left - treeRect.left + rect.width / 2;
    const nodeCenterY = rect.top - treeRect.top + rect.height / 2;
    
    panOffset.x = (containerWidth / 2 - nodeCenterX) / zoomLevel;
    panOffset.y = (containerHeight / 2 - nodeCenterY) / zoomLevel;
    
    applyTreeTransform();
}

// ============================
// MODAL D'INFORMATIONS
// ============================
function showMemberModal(memberId) {
    const member = familyMembers.find(m => m.ID === memberId);
    if (!member) {
        showNotification("Membre non trouvé", "error");
        return;
    }
    
    // Trouver les informations connexes
    const father = member.ID_Pere ? familyMembers.find(m => m.ID === member.ID_Pere) : null;
    const mother = member.ID_Mere ? familyMembers.find(m => m.ID === member.ID_Mere) : null;
    const spouse = member.ConjointID ? familyMembers.find(m => m.ID === member.ConjointID) : null;
    const children = familyMembers.filter(m => m.ID_Pere === memberId || m.ID_Mere === memberId);
    
    // Initiales pour l'avatar
    const firstName = member.Prennom || '';
    const lastName = member.Nom || '';
    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || '?';
    
    // Remplir la modal
    const modalAvatar = document.getElementById('modalAvatar');
    modalAvatar.innerHTML = '';
    
    if (member.URL_img) {
        const img = document.createElement('img');
        img.src = member.URL_img;
        img.alt = `${firstName} ${lastName}`;
        img.onerror = function() {
            this.style.display = 'none';
            const span = document.createElement('span');
            span.textContent = initials;
            modalAvatar.appendChild(span);
        };
        modalAvatar.appendChild(img);
    } else {
        const span = document.createElement('span');
        span.textContent = initials;
        modalAvatar.appendChild(span);
    }
    
    document.getElementById('modalName').textContent = `${firstName} ${lastName}`;
    document.getElementById('modalTitle').textContent = `${getRelationText(member)} • Génération ${member.Generation}`;
    
    // Informations personnelles
    document.getElementById('modalGender').textContent = member.Sexe === 'M' ? 'Masculin' : (member.Sexe === 'F' ? 'Féminin' : 'Non spécifié');
    document.getElementById('modalBirth').textContent = formatBirthDate(member.DateNaissance);
    document.getElementById('modalGeneration').textContent = member.Generation;
    
    // Connexions familiales
    document.getElementById('modalFather').textContent = father ? `${father.Prennom} ${father.Nom}` : 'Inconnu';
    document.getElementById('modalMother').textContent = mother ? `${mother.Prennom} ${mother.Nom}` : 'Inconnue';
    document.getElementById('modalSpouse').textContent = spouse ? `${spouse.Prennom} ${spouse.Nom}` : 'Aucun';
    
    const childrenList = document.getElementById('modalChildren');
    childrenList.innerHTML = children.length > 0 ? 
        children.map(child => `<li>${child.Prennom} ${child.Nom}</li>`).join('') 
        : '<li>Aucun enfant</li>';
    
    // Afficher la modal
    document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

// ============================
// RECHERCHE ET FILTRAGE
// ============================
function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    const searchFilter = document.getElementById('searchFilter').value;
    const generationFilter = document.getElementById('generationFilter').value;
    
    if (!searchTerm) {
        clearSearch();
        return;
    }
    
    // Réinitialiser les surlignements
    document.querySelectorAll('.family-node').forEach(node => {
        node.classList.remove('highlighted');
    });
    
    // Filtrer les membres
    currentSearchResults = familyMembers.filter(member => {
        // Filtrer par génération si spécifié
        if (generationFilter !== 'all') {
            if (member.Generation.toString() !== generationFilter) {
                return false;
            }
        }
        
        // Rechercher selon le filtre
        const fullName = `${member.Prennom || ''} ${member.Nom || ''}`.toLowerCase();
        const firstName = (member.Prennom || '').toLowerCase();
        const lastName = (member.Nom || '').toLowerCase();
        const birthDate = (member.DateNaissance || '').toLowerCase();
        
        switch(searchFilter) {
            case 'name':
                return fullName.includes(searchTerm);
            case 'firstName':
                return firstName.includes(searchTerm);
            case 'lastName':
                return lastName.includes(searchTerm);
            case 'all':
            default:
                return fullName.includes(searchTerm) || 
                       firstName.includes(searchTerm) || 
                       lastName.includes(searchTerm) ||
                       birthDate.includes(searchTerm) ||
                       member.Generation.toString().includes(searchTerm);
        }
    });
    
    // Mettre à jour l'affichage des résultats
    updateSearchResultsDisplay();
    
    // Si un seul résultat, l'afficher
    if (currentSearchResults.length === 1) {
        const member = currentSearchResults[0];
        showMemberModal(member.ID);
        
        // Mettre en surbrillance et centrer
        const node = document.querySelector(`.family-node[data-id="${member.ID}"]`);
        if (node) {
            node.classList.add('highlighted');
            centerNode(node);
        }
    }
    
    // Fermer les suggestions
    document.getElementById('searchSuggestions').classList.remove('active');
}

function updateSearchResultsDisplay() {
    const resultsInfo = document.getElementById('searchResultsInfo');
    const searchTerm = document.getElementById('searchInput').value;
    
    if (currentSearchResults.length === 0) {
        resultsInfo.textContent = `Aucun résultat trouvé pour "${searchTerm}"`;
        resultsInfo.classList.remove('highlight');
        showNotification("Aucun membre trouvé", "error");
    } else {
        resultsInfo.textContent = `${currentSearchResults.length} résultat(s) trouvé(s) pour "${searchTerm}"`;
        resultsInfo.classList.add('highlight');
        
        // Mettre en surbrillance les résultats
        currentSearchResults.forEach((member, index) => {
            const node = document.querySelector(`.family-node[data-id="${member.ID}"]`);
            if (node) {
                node.classList.add('highlighted');
            }
        });
        
        showNotification(`${currentSearchResults.length} membres trouvés`, "success");
    }
}

function showSearchSuggestions(searchTerm) {
    const suggestionsContainer = document.getElementById('searchSuggestions');
    
    if (!searchTerm || searchTerm.length < 2) {
        suggestionsContainer.classList.remove('active');
        suggestionsContainer.innerHTML = '';
        return;
    }
    
    // Filtrer les suggestions
    const suggestions = familyMembers.filter(member => {
        const fullName = `${member.Prennom || ''} ${member.Nom || ''}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
    }).slice(0, 5); // Limiter à 5 suggestions
    
    if (suggestions.length === 0) {
        suggestionsContainer.classList.remove('active');
        suggestionsContainer.innerHTML = '';
        return;
    }
    
    // Afficher les suggestions
    suggestionsContainer.innerHTML = suggestions.map(member => {
        const fullName = `${member.Prennom} ${member.Nom}`;
        const birthDate = member.DateNaissance;
        const birthYear = birthDate && birthDate !== '0000-00-00' ? 
            birthDate.substring(0, 4) : 'Date inconnue';
        
        return `
            <div class="suggestion-item" data-id="${member.ID}">
                <div class="suggestion-name">${fullName}</div>
                <div class="suggestion-details">Génération ${member.Generation} • ${birthYear}</div>
            </div>
        `;
    }).join('');
    
    suggestionsContainer.classList.add('active');
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchFilter').value = 'all';
    document.getElementById('generationFilter').value = 'all';
    document.getElementById('searchResultsInfo').textContent = 'Tapez un nom pour rechercher un membre de la famille';
    document.getElementById('searchResultsInfo').classList.remove('highlight');
    document.getElementById('searchSuggestions').classList.remove('active');
    document.getElementById('searchSuggestions').innerHTML = '';
    
    // Réinitialiser les surlignements
    document.querySelectorAll('.family-node').forEach(node => {
        node.classList.remove('highlighted');
    });
    
    currentSearchResults = [];
}

function filterByGeneration(generation) {
    const allNodes = document.querySelectorAll('.family-node');
    
    if (generation === 'all') {
        // Afficher tous les nœuds
        allNodes.forEach(node => {
            node.style.display = 'block';
        });
        
        // Afficher toutes les connexions
        document.querySelectorAll('.tree-connection').forEach(conn => {
            conn.style.display = 'block';
        });
    } else {
        // Masquer tous les nœuds
        allNodes.forEach(node => {
            node.style.display = 'none';
        });
        
        // Masquer toutes les connexions
        document.querySelectorAll('.tree-connection').forEach(conn => {
            conn.style.display = 'none';
        });
        
        // Afficher uniquement la génération sélectionnée
        document.querySelectorAll(`.family-node[data-generation="${generation}"]`).forEach(node => {
            node.style.display = 'block';
        });
    }
}

// ============================
// FONCTIONS UTILITAIRES
// ============================
function getRelationText(member) {
    const generation = parseInt(member.Generation);
    const hasParents = member.ID_Pere || member.ID_Mere;
    const hasChildren = familyMembers.some(m => m.ID_Pere === member.ID || m.ID_Mere === member.ID);
    
    if (generation === 1) return "Ancêtre fondateur";
    if (!hasParents) return "Marié(e) dans la famille";
    if (hasChildren) return "Parent";
    return "Enfant";
}

function formatBirthDate(dateString) {
    if (!dateString || dateString === '0000-00-00') return 'Date inconnue';
    
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    
    const year = date.getFullYear();
    if (year === 0) return 'Date inconnue';
    
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function updateGenerationCounts(membersByGeneration) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        const gen = btn.dataset.gen;
        if (gen !== 'all') {
            const count = membersByGeneration[gen] ? membersByGeneration[gen].length : 0;
            let countSpan = btn.querySelector('.member-count');
            
            if (!countSpan) {
                countSpan = document.createElement('span');
                countSpan.className = 'member-count';
                btn.appendChild(countSpan);
            }
            
            countSpan.textContent = ` (${count})`;
        }
    });
}

function updateLegendCounts(membersByGeneration) {
    const legendItems = document.querySelectorAll('.legend-item');
    
    legendItems.forEach((item, index) => {
        const gen = index + 1; // Les légendes sont dans l'ordre
        const count = membersByGeneration[gen] ? membersByGeneration[gen].length : 0;
        const textSpan = item.querySelector('.legend-text');
        
        if (textSpan) {
            const baseText = textSpan.textContent.split('(')[0].trim();
            textSpan.textContent = `${baseText} (${count} membres)`;
        }
    });
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

function showNotification(message, type = "success") {
    // Créer une notification temporaire
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        background: ${type === 'success' ? '#2ecc71' : '#e74c3c'};
        color: white;
        border-radius: 8px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Ajouter les styles d'animation pour les notifications
const style = document.createElement('style');
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

// ============================
// SURVOL DE LA FAMILLE
// ============================
function highlightFamily() {
    if (!selectedMemberId) return;
    
    // Réinitialiser les surlignements
    document.querySelectorAll('.family-node').forEach(node => {
        node.classList.remove('highlighted');
    });
    
    // Trouver le membre
    const member = familyMembers.find(m => m.ID === selectedMemberId);
    if (!member) return;
    
    // Trouver les membres de la famille proche
    const familyMemberIds = new Set();
    
    // Ajouter le membre lui-même
    familyMemberIds.add(member.ID);
    
    // Ajouter les parents
    if (member.ID_Pere) familyMemberIds.add(member.ID_Pere);
    if (member.ID_Mere) familyMemberIds.add(member.ID_Mere);
    
    // Ajouter le conjoint
    if (member.ConjointID) familyMemberIds.add(member.ConjointID);
    
    // Ajouter les enfants
    familyMembers.forEach(m => {
        if (m.ID_Pere === member.ID || m.ID_Mere === member.ID) {
            familyMemberIds.add(m.ID);
        }
    });
    
    // Surligner les membres de la famille
    familyMemberIds.forEach(id => {
        const node = document.querySelector(`.family-node[data-id="${id}"]`);
        if (node) {
            node.classList.add('highlighted');
        }
    });
    
    showNotification(`${familyMemberIds.size} membres de la famille surlignés`, "success");
}