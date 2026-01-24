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
let currentViewMode = 'all'; // 'all', 'descendants', 'family'
let currentDescendantRoot = null;
let descendantIds = new Set();
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
                 // Remplir la liste déroulante après le chargement
                setTimeout(() => {
                    populateMemberSelect();
                }, 100);
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
        // Remplir quand même la liste avec les données d'exemple
        setTimeout(() => {
            populateMemberSelect();
        }, 100);
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
    //Gestion de l'arbre généalogique des descendants
    document.addEventListener('click', function(e) {
    const node = e.target.closest('.family-node');
    if (node) {
        const memberId = node.dataset.id;
        
        // En mode descendant, permettre la sélection d'autres descendants
        if (currentViewMode === 'descendants' && descendantIds.has(memberId)) {
            selectedMemberId = memberId;
            showMemberModal(memberId);
            
            // Mettre en surbrillance uniquement dans le groupe descendant
            document.querySelectorAll('.family-node').forEach(n => {
                n.classList.remove('active');
                if (descendantIds.has(n.dataset.id)) {
                    n.classList.add('descendant-highlight');
                }
            });
            node.classList.add('active');
            node.classList.remove('descendant-highlight');
            
            centerNode(node);
        } else {
            // Comportement normal
            selectedMemberId = memberId;
            showMemberModal(memberId);
            
            document.querySelectorAll('.family-node').forEach(n => {
                n.classList.remove('active');
                n.classList.remove('highlighted');
            });
            node.classList.add('active');
            
            centerNode(node);
        }
    }
    });

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
    // Dans initEvents(), ajoutez ce raccourci clavier
    document.addEventListener('keydown', function(e) {
        // Ctrl+F ou Cmd+F pour focus la recherche
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
        
        // Ctrl+L ou Cmd+L pour focus la liste déroulante
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            e.preventDefault();
            document.getElementById('memberSelect').focus();
        }
    });
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

// Fonction pour remplir la liste déroulante
function populateMemberSelect() {
    const memberSelect = document.getElementById('memberSelect');
    
    // Vider les options existantes (garder la première option)
    while (memberSelect.options.length > 1) {
        memberSelect.remove(1);
    }
    
    // Trier les membres par nom et prénom
    const sortedMembers = [...familyMembers].sort((a, b) => {
        const nameA = `${a.Prennom || ''} ${a.Nom || ''}`.toLowerCase();
        const nameB = `${b.Prennom || ''} ${b.Nom || ''}`.toLowerCase();
        return nameA.localeCompare(nameB);
    });
    
    // Ajouter chaque membre à la liste
    sortedMembers.forEach(member => {
        const fullName = `${member.Prennom || ''} ${member.Nom || ''}`;
        const generation = member.Generation;
        
        const option = document.createElement('option');
        option.value = member.ID;
        option.textContent = `${fullName} (Génération ${generation})`;
        memberSelect.appendChild(option);
    });
    
    // Ajouter l'événement de changement
    memberSelect.addEventListener('change', function() {
        const selectedId = this.value;
        if (selectedId) {
            selectMemberById(selectedId);
            // Réinitialiser la sélection
            this.value = '';
        }
    });
}

// Fonction pour sélectionner un membre depuis la liste
function selectMemberById(memberId) {
    const member = familyMembers.find(m => m.ID === memberId);
    if (!member) {
        showNotification("Membre non trouvé", "error");
        return;
    }
    
    // Mettre à jour le membre sélectionné
    selectedMemberId = memberId;
    
    // Retirer la classe active de tous les nœuds
    document.querySelectorAll('.family-node').forEach(node => {
        node.classList.remove('active');
        node.classList.remove('highlighted');
    });
    
    // Ajouter la classe active au nœud correspondant
    const node = document.querySelector(`.family-node[data-id="${memberId}"]`);
    if (node) {
        node.classList.add('active');
        
        // Centrer le nœud dans la vue
        centerNode(node);
        
        // Afficher les informations du membre
        showMemberModal(memberId);
        
        // Animation de surbrillance
        node.classList.add('highlighted');
        setTimeout(() => node.classList.remove('highlighted'), 2000);
        
        showNotification(`${member.Prennom} ${member.Nom} sélectionné`, "success");
    } else {
        showNotification("Membre sélectionné non visible dans la vue actuelle", "error");
    }
}

// Fonction pour centrer un nœud (améliorée)
function centerNode(node) {
    if (!node) return;
    
    const treeContainer = document.getElementById('treeContainer');
    const treeWrapper = document.getElementById('treeWrapper');
    
    // Calculer la position du nœud dans le wrapper
    const nodeRect = node.getBoundingClientRect();
    const wrapperRect = treeWrapper.getBoundingClientRect();
    const containerRect = treeContainer.getBoundingClientRect();
    
    // Position relative du nœud dans le wrapper
    const nodeCenterX = nodeRect.left - wrapperRect.left + nodeRect.width / 2;
    const nodeCenterY = nodeRect.top - wrapperRect.top + nodeRect.height / 2;
    
    // Calculer le déplacement nécessaire pour centrer le nœud
    panOffset.x = (containerRect.width / 2 - nodeCenterX) / zoomLevel;
    panOffset.y = (containerRect.height / 2 - nodeCenterY) / zoomLevel;
    
    // Limiter le déplacement pour éviter de sortir des limites
    const wrapperWidth = treeWrapper.offsetWidth;
    const wrapperHeight = treeWrapper.offsetHeight;
    
    const maxOffsetX = (wrapperWidth * zoomLevel - containerRect.width) / (2 * zoomLevel);
    const maxOffsetY = (wrapperHeight * zoomLevel - containerRect.height) / (2 * zoomLevel);
    
    panOffset.x = Math.max(Math.min(panOffset.x, maxOffsetX), -maxOffsetX);
    panOffset.y = Math.max(Math.min(panOffset.y, maxOffsetY), -maxOffsetY);
    
    // Appliquer la transformation
    applyTreeTransform();
    
    // Ajouter un effet de transition douce
    treeWrapper.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    setTimeout(() => {
        treeWrapper.style.transition = '';
    }, 500);
}

//-------------------------------------
//INDICATEUR DE CHARGEMENT DE LA LISTE
//-------------------------------------
function populateMemberSelect() {
    const memberSelect = document.getElementById('memberSelect');
    const selectIcon = document.querySelector('.select-icon');
    
    // Afficher un indicateur de chargement
    selectIcon.className = 'fas fa-spinner fa-spin select-icon';
    
    // Vider les options
    while (memberSelect.options.length > 1) {
        memberSelect.remove(1);
    }
    
    // Ajouter une option temporaire
    const loadingOption = document.createElement('option');
    loadingOption.value = "";
    loadingOption.textContent = "Chargement des membres...";
    loadingOption.disabled = true;
    memberSelect.appendChild(loadingOption);
    
    // Simuler un délai pour le chargement (ou charger en arrière-plan)
    setTimeout(() => {
        // Retirer l'option de chargement
        memberSelect.remove(memberSelect.options.length - 1);
        
        // Trier et ajouter les membres
        const sortedMembers = [...familyMembers].sort((a, b) => {
            const nameA = `${a.Prennom || ''} ${a.Nom || ''}`.toLowerCase();
            const nameB = `${b.Prennom || ''} ${b.Nom || ''}`.toLowerCase();
            return nameA.localeCompare(nameB);
        });
        
        sortedMembers.forEach(member => {
            const fullName = `${member.Prennom || ''} ${member.Nom || ''}`;
            const generation = member.Generation;
            
            const option = document.createElement('option');
            option.value = member.ID;
            option.textContent = `${fullName} (Génération ${generation})`;
            memberSelect.appendChild(option);
        });
        
        // Restaurer l'icône normale
        selectIcon.className = 'fas fa-chevron-down select-icon';
        
        // Activer le select
        memberSelect.disabled = false;
        
    }, 300);
    
    // Événement de changement
    memberSelect.addEventListener('change', function() {
        const selectedId = this.value;
        if (selectedId) {
            selectMemberById(selectedId);
            this.value = '';
        }
    });
}
//----------------------------------------------
//FONCTION L'ARBRE GENEAL D'UN MEMBRE SPECIFIQUE
//----------------------------------------------
// ============================
// FONCTIONS POUR LES DESCENDANTS
// ============================

// Fonction pour afficher tous les descendants d'un membre
function showDescendants() {
    if (!selectedMemberId) {
        showNotification("Veuillez sélectionner un membre d'abord", "error");
        return;
    }
    
    const rootMember = familyMembers.find(m => m.ID === selectedMemberId);
    if (!rootMember) return;
    
    // Définir le mode de vue
    currentViewMode = 'descendants';
    currentDescendantRoot = selectedMemberId;
    
    // Trouver tous les descendants
    descendantIds = getAllDescendants(selectedMemberId);
    
    // Afficher uniquement les descendants et le parent racine
    filterToDescendants(selectedMemberId, descendantIds);
    
    // Mettre à jour l'indicateur de vue
    updateViewModeIndicator();
    
    // Afficher la légende des descendants
    showDescendantsLegend(rootMember);
    
    // Fermer la modal
    closeModal();
    
    // Afficher une notification
    showNotification(`Affichage des ${descendantIds.size} descendants de ${rootMember.Prennom} ${rootMember.Nom}`, "success");
}

// Fonction récursive pour trouver tous les descendants
function getAllDescendants(memberId, descendants = new Set()) {
    // Ajouter le membre actuel (pour inclure le parent racine)
    descendants.add(memberId);
    
    // Trouver tous les enfants directs
    const children = familyMembers.filter(member => 
        member.ID_Pere === memberId || member.ID_Mere === memberId
    );
    
    // Pour chaque enfant, trouver ses descendants
    children.forEach(child => {
        descendants.add(child.ID);
        getAllDescendants(child.ID, descendants);
    });
    
    return descendants;
}

// Fonction pour filtrer l'affichage aux descendants uniquement
function filterToDescendants(rootId, descendantIds) {
    // Masquer tous les nœuds
    document.querySelectorAll('.family-node').forEach(node => {
        node.style.display = 'none';
        node.classList.remove('descendant-highlight');
        node.classList.remove('descendant-main');
        node.classList.remove('active');
        node.classList.remove('highlighted');
    });
    
    // Masquer toutes les connexions
    document.querySelectorAll('.tree-connection').forEach(conn => {
        conn.style.display = 'none';
    });
    
    // Afficher uniquement les descendants
    descendantIds.forEach(id => {
        const node = document.querySelector(`.family-node[data-id="${id}"]`);
        if (node) {
            node.style.display = 'block';
            
            // Appliquer les styles spéciaux
            if (id === rootId) {
                node.classList.add('descendant-main');
            } else {
                node.classList.add('descendant-highlight');
            }
        }
        
        // Afficher les connexions entre descendants
        const member = familyMembers.find(m => m.ID === id);
        if (member) {
            // Connexion avec le père si le père est aussi un descendant
            if (member.ID_Pere && descendantIds.has(member.ID_Pere)) {
                showConnection(member.ID_Pere, id, 'descendant');
            }
            
            // Connexion avec la mère si la mère est aussi un descendant
            if (member.ID_Mere && descendantIds.has(member.ID_Mere)) {
                showConnection(member.ID_Mere, id, 'descendant');
            }
        }
    });
    
    // Désactiver la navigation par génération
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
    });
}

// Fonction pour afficher une connexion
function showConnection(parentId, childId, type) {
    const connections = document.querySelectorAll('.tree-connection');
    connections.forEach(conn => {
        // Cette logique dépend de comment vos connexions sont identifiées
        // Vous devrez peut-être ajuster cette fonction selon votre implémentation
        conn.style.display = 'block';
        if (type === 'descendant') {
            conn.style.background = 'linear-gradient(90deg, var(--accent-color), var(--gen4-color))';
            conn.style.height = '3px';
        }
    });
}

// Fonction pour réinitialiser la vue complète
function resetFamilyView() {
    currentViewMode = 'all';
    currentDescendantRoot = null;
    descendantIds.clear();
    
    // Afficher tous les nœuds
    document.querySelectorAll('.family-node').forEach(node => {
        node.style.display = 'block';
        node.classList.remove('descendant-highlight');
        node.classList.remove('descendant-main');
        node.classList.remove('active');
        node.classList.remove('highlighted');
    });
    
    // Afficher toutes les connexions
    document.querySelectorAll('.tree-connection').forEach(conn => {
        conn.style.display = 'block';
        conn.style.background = '';
        conn.style.height = '2px';
    });
    
    // Réactiver la navigation par génération
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
    });
    
    // Masquer l'indicateur
    document.getElementById('viewModeIndicator').style.display = 'none';
    
    // Masquer la légende
    document.getElementById('descendantsLegend').classList.remove('active');
    
    // Réinitialiser le filtre de génération
    const allBtn = document.querySelector('.nav-btn[data-gen="all"]');
    if (allBtn) {
        allBtn.click();
    }
    
    showNotification("Vue complète restaurée", "success");
}

// Fonction pour mettre à jour l'indicateur de mode de vue
function updateViewModeIndicator() {
    const indicator = document.getElementById('viewModeIndicator');
    const textElement = document.getElementById('currentViewText');
    
    if (currentViewMode === 'descendants' && currentDescendantRoot) {
        const rootMember = familyMembers.find(m => m.ID === currentDescendantRoot);
        if (rootMember) {
            textElement.textContent = `Vue descendants de ${rootMember.Prennom} ${rootMember.Nom} (${descendantIds.size} personnes)`;
            indicator.style.display = 'flex';
        }
    } else {
        indicator.style.display = 'none';
    }
}

// Fonction pour afficher la légende des descendants
function showDescendantsLegend(rootMember) {
    const legend = document.getElementById('descendantsLegend');
    const rootName = `${rootMember.Prennom} ${rootMember.Nom}`;
    
    legend.innerHTML = `
        <h4 style="margin-bottom: 15px; color: var(--primary-color);">Légende - Arbre des descendants</h4>
        <div class="legend-descendant-item">
            <div class="legend-descendant-color legend-descendant-main"></div>
            <span><strong>${rootName}</strong> - Ancêtre racine</span>
        </div>
        <div class="legend-descendant-item">
            <div class="legend-descendant-color legend-descendant-highlight"></div>
            <span>Descendants (${descendantIds.size - 1} personnes)</span>
        </div>
        <div style="margin-top: 10px; font-size: 0.9rem; color: var(--dark-gray);">
            <i class="fas fa-info-circle"></i> Cliquez sur le bouton <i class="fas fa-times"></i> pour revenir à la vue complète
        </div>
    `;
    
    legend.classList.add('active');
}

// Fonction pour générer un rapport des descendants
function generateDescendantsReport(rootId) {
    const rootMember = familyMembers.find(m => m.ID === rootId);
    if (!rootMember) return;
    
    const descendants = getAllDescendants(rootId);
    const report = {
        root: rootMember,
        totalDescendants: descendants.size - 1, // Exclure le parent racine
        byGeneration: {},
        statistics: {
            male: 0,
            female: 0,
            unknown: 0,
            withSpouse: 0,
            withChildren: 0
        }
    };
    
    // Analyser les descendants par génération
    descendants.forEach(id => {
        if (id === rootId) return; // Sauter le parent racine
        
        const member = familyMembers.find(m => m.ID === id);
        if (member) {
            const gen = member.Generation;
            if (!report.byGeneration[gen]) {
                report.byGeneration[gen] = [];
            }
            report.byGeneration[gen].push(member);
            
            // Statistiques
            if (member.Sexe === 'M') report.statistics.male++;
            else if (member.Sexe === 'F') report.statistics.female++;
            else report.statistics.unknown++;
            
            if (member.ConjointID) report.statistics.withSpouse++;
            
            const hasChildren = familyMembers.some(m => m.ID_Pere === id || m.ID_Mere === id);
            if (hasChildren) report.statistics.withChildren++;
        }
    });
    
    return report;
}

// Fonction pour afficher un rapport détaillé
function showDescendantsReport() {
    if (!currentDescendantRoot) return;
    
    const report = generateDescendantsReport(currentDescendantRoot);
    const rootMember = report.root;
    
    let reportHTML = `
        <div style="max-height: 400px; overflow-y: auto; padding: 20px;">
            <h3 style="color: var(--primary-color); margin-bottom: 20px;">
                Rapport des descendants - ${rootMember.Prennom} ${rootMember.Nom}
            </h3>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                <div style="background: var(--light-color); padding: 15px; border-radius: var(--border-radius-sm);">
                    <div style="font-size: 2rem; font-weight: bold; color: var(--secondary-color);">
                        ${report.totalDescendants}
                    </div>
                    <div style="font-size: 0.9rem; color: var(--dark-gray);">Total descendants</div>
                </div>
                
                <div style="background: var(--light-color); padding: 15px; border-radius: var(--border-radius-sm);">
                    <div style="font-size: 2rem; font-weight: bold; color: var(--gen2-color);">
                        ${report.statistics.male}
                    </div>
                    <div style="font-size: 0.9rem; color: var(--dark-gray);">Hommes</div>
                </div>
                
                <div style="background: var(--light-color); padding: 15px; border-radius: var(--border-radius-sm);">
                    <div style="font-size: 2rem; font-weight: bold; color: var(--gen1-color);">
                        ${report.statistics.female}
                    </div>
                    <div style="font-size: 0.9rem; color: var(--dark-gray);">Femmes</div>
                </div>
            </div>
            
            <h4 style="color: var(--primary-color); margin-bottom: 15px;">Répartition par génération</h4>
    `;
    
    Object.keys(report.byGeneration).sort().forEach(gen => {
        const members = report.byGeneration[gen];
        reportHTML += `
            <div style="margin-bottom: 15px; padding: 10px; background: var(--light-color); border-radius: var(--border-radius-sm);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-weight: bold; color: var(--dark-color);">
                        Génération ${gen}
                    </span>
                    <span style="background: var(--secondary-color); color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem;">
                        ${members.length} personne${members.length > 1 ? 's' : ''}
                    </span>
                </div>
                <div style="font-size: 0.9rem; color: var(--dark-gray);">
                    ${members.map(m => `${m.Prennom} ${m.Nom}`).join(', ')}
                </div>
            </div>
        `;
    });
    
    reportHTML += `
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--medium-gray);">
                <button class="btn btn-primary" onclick="exportDescendantsReport()" style="width: 100%;">
                    <i class="fas fa-download"></i> Exporter le rapport
                </button>
            </div>
        </div>
    `;
    
    // Afficher dans une modal
    showCustomModal('Rapport des descendants', reportHTML);
}

// Fonction pour afficher une modal personnalisée
function showCustomModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="member-modal" style="max-width: 600px;">
            <div class="modal-header">
                <div class="modal-title">
                    <h2>${title}</h2>
                </div>
            </div>
            <div class="modal-content">
                ${content}
            </div>
            <div class="modal-actions">
                <button class="btn modal-close" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                    Fermer
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.classList.add('active');
}

// Fonction pour exporter le rapport
function exportDescendantsReport() {
    if (!currentDescendantRoot) return;
    
    const report = generateDescendantsReport(currentDescendantRoot);
    const rootMember = report.root;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Rapport des descendants - " + rootMember.Prennom + " " + rootMember.Nom + "\n";
    csvContent += "ID,Prénom,Nom,Génération,Sexe,Date de naissance,Père,Mère,Conjoint\n";
    
    descendantIds.forEach(id => {
        const member = familyMembers.find(m => m.ID === id);
        if (member) {
            const father = member.ID_Pere ? familyMembers.find(m => m.ID === member.ID_Pere) : null;
            const mother = member.ID_Mere ? familyMembers.find(m => m.ID === member.ID_Mere) : null;
            const spouse = member.ConjointID ? familyMembers.find(m => m.ID === member.ConjointID) : null;
            
            csvContent += [
                member.ID,
                `"${member.Prennom || ''}"`,
                `"${member.Nom || ''}"`,
                member.Generation,
                member.Sexe,
                member.DateNaissance,
                father ? `"${father.Prennom} ${father.Nom}"` : '',
                mother ? `"${mother.Prennom} ${mother.Nom}"` : '',
                spouse ? `"${spouse.Prennom} ${spouse.Nom}"` : ''
            ].join(',') + "\n";
        }
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `descendants_${rootMember.Prennom}_${rootMember.Nom}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification("Rapport exporté avec succès", "success");
}