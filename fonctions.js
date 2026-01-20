// Variables globales
let familyMembers = [];
let currentSearchResults = [];
let searchTimeout = null;
let selectedMemberId = null;
let zoomLevel = 1;
let panOffset = { x: 0, y: 0 };
let isDragging = false;
let startDragPos = { x: 0, y: 0 };

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Mettre à jour l'année dans le footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // Charger les données depuis le fichier JSON
    loadFamilyData();
    
    // Initialiser les événements
    initEvents();
});

// Charger les données
async function loadFamilyData() {
    showLoading(true);
    
    try {
        const response = await fetch('famille.json');
        
        if (response.ok) {
            const data = await response.json();
            
            if (Array.isArray(data)) {
                familyMembers = data;
            } else {
                throw new Error("Format de fichier non reconnu");
            }
        } else {
            throw new Error("Fichier non trouvé");
        }
    } catch (error) {
        console.error("Erreur de chargement:", error);
        // Ici vous pourriez charger des données d'exemple
    }
    
    // Générer l'arbre généalogique moderne
    generateModernFamilyTree();
    
    showLoading(false);
}

// Générer l'arbre moderne
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
    
    // Calculer les positions des nœuds
    let yPos = 50;
    Object.keys(membersByGeneration).sort().forEach(generation => {
        const members = membersByGeneration[generation];
        const count = members.length;
        const xSpacing = 800 / (count + 1);
        
        members.forEach((member, index) => {
            const xPos = (index + 1) * xSpacing;
            nodePositions[member.ID] = { x: xPos, y: yPos, generation: generation };
            
            // Créer le nœud
            const node = createModernNode(member);
            node.style.left = `${xPos}px`;
            node.style.top = `${yPos}px`;
            treeWrapper.appendChild(node);
        });
        
        yPos += 120;
    });
    
    // Créer les connexions entre les nœuds
    createNodeConnections(nodePositions);
    
    // Mettre à jour les compteurs de génération
    updateGenerationCounts(membersByGeneration);
}

// Créer un nœud moderne
function createModernNode(member) {
    const node = document.createElement('div');
    node.className = `family-node gen-${member.Generation}`;
    node.dataset.id = member.ID;
    node.dataset.generation = member.Generation;
    
    // Initiales pour l'avatar
    const firstName = member.Prennom || '';
    const lastName = member.Nom || '';
    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    
    // Image ou avatar par défaut
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
                    `<img src="${member.URL_img}" alt="${firstName} ${lastName}" onerror="this.style.display='none'; this.parentElement.textContent='${initials}'">` 
                    : initials}
            </div>
            <div>
                <div class="node-name">${firstName} ${lastName} ${genderIcon}</div>
                <div class="node-details">${yearInfo}</div>
            </div>
        </div>
        <div class="node-relation">${getRelationText(member)}</div>
    `;
    
    return node;
}

// Créer les connexions entre nœuds
function createNodeConnections(nodePositions) {
    const treeWrapper = document.getElementById('treeWrapper');
    
    familyMembers.forEach(member => {
        const childPos = nodePositions[member.ID];
        
        // Connexion avec le père
        if (member.ID_Pere && nodePositions[member.ID_Pere]) {
            const parentPos = nodePositions[member.ID_Pere];
            createConnection(parentPos.x + 100, parentPos.y + 50, childPos.x + 100, childPos.y);
        }
        
        // Connexion avec la mère
        if (member.ID_Mere && nodePositions[member.ID_Mere]) {
            const parentPos = nodePositions[member.ID_Mere];
            createConnection(parentPos.x + 100, parentPos.y + 50, childPos.x + 100, childPos.y);
        }
    });
}

// Créer une connexion visuelle
function createConnection(x1, y1, x2, y2) {
    const treeWrapper = document.getElementById('treeWrapper');
    
    // Créer un div pour la connexion
    const connection = document.createElement('div');
    connection.className = 'tree-connection';
    
    // Calculer la longueur et l'angle
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    connection.style.width = `${length}px`;
    connection.style.height = '2px';
    connection.style.left = `${x1}px`;
    connection.style.top = `${y1}px`;
    connection.style.transform = `rotate(${angle}deg)`;
    connection.style.transformOrigin = '0 0';
    connection.style.background = 'linear-gradient(90deg, #3498db, #2ecc71)';
    
    treeWrapper.appendChild(connection);
}

// Initialiser les événements
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
    
    // Contrôles de zoom
    document.getElementById('zoomIn').addEventListener('click', () => zoomTree(0.2));
    document.getElementById('zoomOut').addEventListener('click', () => zoomTree(-0.2));
    document.getElementById('zoomReset').addEventListener('click', resetZoom);
    
    // Navigation dans l'arbre
    const treeContainer = document.getElementById('treeContainer');
    treeContainer.addEventListener('mousedown', startDrag);
    treeContainer.addEventListener('mousemove', dragTree);
    treeContainer.addEventListener('mouseup', stopDrag);
    treeContainer.addEventListener('wheel', handleWheel, { passive: false });
    
    // Fermer la modal
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    // Afficher un membre au hasard au chargement
    setTimeout(() => {
        if (familyMembers.length > 0) {
            const randomIndex = Math.floor(Math.random() * familyMembers.length);
            const randomMember = familyMembers[randomIndex];
            selectedMemberId = randomMember.ID;
            showMemberModal(randomMember.ID);
            
            const node = document.querySelector(`.family-node[data-id="${randomMember.ID}"]`);
            if (node) {
                node.classList.add('active');
                centerNode(node);
            }
        }
    }, 2000);
}

// Fonctions de zoom et navigation
function zoomTree(delta) {
    const treeWrapper = document.getElementById('treeWrapper');
    zoomLevel = Math.min(Math.max(0.5, zoomLevel + delta), 3);
    treeWrapper.style.transform = `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`;
}

function resetZoom() {
    zoomLevel = 1;
    panOffset = { x: 0, y: 0 };
    const treeWrapper = document.getElementById('treeWrapper');
    treeWrapper.style.transform = `scale(${zoomLevel}) translate(0px, 0px)`;
}

function startDrag(e) {
    if (e.target.closest('.family-node')) return;
    isDragging = true;
    startDragPos = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    document.body.style.cursor = 'grabbing';
}

function dragTree(e) {
    if (!isDragging) return;
    e.preventDefault();
    panOffset.x = e.clientX - startDragPos.x;
    panOffset.y = e.clientY - startDragPos.y;
    const treeWrapper = document.getElementById('treeWrapper');
    treeWrapper.style.transform = `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`;
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
        const treeWrapper = document.getElementById('treeWrapper');
        treeWrapper.style.transform = `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`;
    }
}

// Afficher la modal des informations
function showMemberModal(memberId) {
    const member = familyMembers.find(m => m.ID === memberId);
    if (!member) return;
    
    // Trouver les informations connexes
    const father = member.ID_Pere ? familyMembers.find(m => m.ID === member.ID_Pere) : null;
    const mother = member.ID_Mere ? familyMembers.find(m => m.ID === member.ID_Mere) : null;
    const spouse = member.ConjointID ? familyMembers.find(m => m.ID === member.ConjointID) : null;
    const children = familyMembers.filter(m => m.ID_Pere === memberId || m.ID_Mere === memberId);
    
    // Initiales pour l'avatar
    const firstName = member.Prennom || '';
    const lastName = member.Nom || '';
    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    
    // Remplir la modal
    document.getElementById('modalAvatar').innerHTML = member.URL_img ? 
        `<img src="${member.URL_img}" alt="${firstName} ${lastName}" onerror="this.style.display='none'; this.parentElement.innerHTML='${initials}'">` 
        : initials;
    
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

// Fonctions utilitaires
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
            const span = btn.querySelector('.member-count') || document.createElement('span');
            span.className = 'member-count';
            span.textContent = ` (${count})`;
            if (!btn.querySelector('.member-count')) {
                btn.appendChild(span);
            }
        }
    });
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.toggle('active', show);
}

function centerNode(node) {
    if (!node) return;
    
    const rect = node.getBoundingClientRect();
    const container = document.getElementById('treeContainer');
    const containerRect = container.getBoundingClientRect();
    
    panOffset.x = -(rect.left - containerRect.width/2);
    panOffset.y = -(rect.top - containerRect.height/2);
    
    const treeWrapper = document.getElementById('treeWrapper');
    treeWrapper.style.transform = `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`;
}

// Les autres fonctions (recherche, filtrage, etc.) restent similaires mais adaptées
// pour fonctionner avec la nouvelle structure