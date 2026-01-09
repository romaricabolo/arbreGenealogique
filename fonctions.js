 // Variables globales
        let familyMembers = [];
        let currentSearchResults = [];
        let searchTimeout = null;

        // Structure attendue du fichier JSON
        // "ID;Generation;Prennom(s);Nom de Famille;Sexe;DateNaissance;ID_Pere;ID_Mere;Conjoint(s)ID;URL_img"

        // Données d'exemple si le fichier JSON n'est pas disponible
        const sampleData = [
            { ID: "1", Generation: "1", Prennom: "Jean", Nom: "Durand", Sexe: "M", DateNaissance: "1925-03-15", ID_Pere: "", ID_Mere: "", ConjointID: "2", URL_img: "" },
            { ID: "2", Generation: "1", Prennom: "Marie", Nom: "Lambert", Sexe: "F", DateNaissance: "1930-07-22", ID_Pere: "", ID_Mere: "", ConjointID: "1", URL_img: "" },
            { ID: "3", Generation: "2", Prennom: "Pierre", Nom: "Durand", Sexe: "M", DateNaissance: "1950-04-12", ID_Pere: "1", ID_Mere: "2", ConjointID: "4", URL_img: "" },
            { ID: "4", Generation: "2", Prennom: "Élise", Nom: "Martin", Sexe: "F", DateNaissance: "1952-06-18", ID_Pere: "", ID_Mere: "", ConjointID: "3", URL_img: "" },
            { ID: "13", Generation: "3", Prennom: "Thomas", Nom: "Durand", Sexe: "M", DateNaissance: "1975-06-18", ID_Pere: "3", ID_Mere: "4", ConjointID: "14", URL_img: "" },
            { ID: "14", Generation: "3", Prennom: "Julie", Nom: "Petit", Sexe: "F", DateNaissance: "1978-09-22", ID_Pere: "", ID_Mere: "", ConjointID: "13", URL_img: "" },
            { ID: "101", Generation: "4", Prennom: "Emma", Nom: "Durand", Sexe: "F", DateNaissance: "2005-09-03", ID_Pere: "13", ID_Mere: "14", ConjointID: "", URL_img: "" },
            { ID: "102", Generation: "4", Prennom: "Lucas", Nom: "Durand", Sexe: "M", DateNaissance: "2008-11-15", ID_Pere: "13", ID_Mere: "14", ConjointID: "", URL_img: "" }
        ];

        // Initialisation lorsque la page est chargée
        document.addEventListener('DOMContentLoaded', function() {
            // Mettre à jour l'année dans le footer
            document.getElementById('currentYear').textContent = new Date().getFullYear();
            
            // Charger les données depuis le fichier JSON
            loadFamilyData();
            
            // Initialiser les événements
            initEvents();
        });

        // Charger les données depuis le fichier JSON
        async function loadFamilyData() {
            showLoading(true);
            
            try {
                // Essayer de charger depuis le fichier famille.json
                const response = await fetch('famille.json');
                
                if (response.ok) {
                    const data = await response.json();
                    
                    // Si le fichier JSON a un format différent, adapter cette partie
                    if (Array.isArray(data)) {
                        familyMembers = data;
                    } else if (data.members) {
                        familyMembers = data.members;
                    } else {
                        // Format inconnu, utiliser les données d'exemple
                        throw new Error("Format de fichier non reconnu");
                    }
                } else {
                    // Si le fichier n'existe pas, utiliser les données d'exemple
                    throw new Error("Fichier non trouvé");
                }
            } catch (error) {
                console.log("Utilisation des données d'exemple : " + error.message);
                familyMembers = sampleData;
                
                // Afficher une notification
                showNotification("Données d'exemple chargées. Pour utiliser vos données, placez un fichier 'famille.json' dans le même dossier.", "error");
            }
            
            // Générer l'arbre généalogique
            generateFamilyTree();
            
            showLoading(false);
        }

        // Générer l'arbre généalogique
        function generateFamilyTree() {
            const treeContainer = document.getElementById('familyTree');
            treeContainer.innerHTML = '';
            
            // Organiser les membres par génération
            const membersByGeneration = {};
            
            familyMembers.forEach(member => {
                const generation = member.Generation || member.generation;
                
                if (!membersByGeneration[generation]) {
                    membersByGeneration[generation] = [];
                }
                
                membersByGeneration[generation].push(member);
            });
            
            // Créer chaque génération
            Object.keys(membersByGeneration).sort().forEach(generation => {
                const generationDiv = document.createElement('div');
                generationDiv.className = `generation generation-${generation}`;
                generationDiv.dataset.gen = generation;
                
                // Ajouter les membres de cette génération
                membersByGeneration[generation].forEach(member => {
                    const memberDiv = createMemberElement(member);
                    generationDiv.appendChild(memberDiv);
                });
                
                treeContainer.appendChild(generationDiv);
            });
            
            // Mettre à jour le compteur dans les boutons de navigation
            updateGenerationCounts(membersByGeneration);
        }

        // Créer un élément membre
        function createMemberElement(member) {
            const memberDiv = document.createElement('div');
            memberDiv.className = `member gen-${member.Generation || member.generation}`;
            memberDiv.dataset.id = member.ID || member.id;
            memberDiv.dataset.generation = member.Generation || member.generation;
            
            // Calculer l'âge ou les années
            const birthDate = member.DateNaissance || member.birthDate;
            let yearsInfo = "";
            
            if (birthDate) {
                const birthYear = birthDate.substring(0, 4);
                yearsInfo = `Né(e) en ${birthYear}`;
                
                // Essayer de calculer l'âge
                try {
                    const birth = new Date(birthDate);
                    const today = new Date();
                    let age = today.getFullYear() - birth.getFullYear();
                    const monthDiff = today.getMonth() - birth.getMonth();
                    
                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                        age--;
                    }
                    
                    yearsInfo = `${age} ans (${birthYear})`;
                } catch (e) {
                    // En cas d'erreur, garder juste l'année
                }
            }
            
            // Créer le contenu du membre
            const fullName = `${member.Prennom || member.firstName} ${member.Nom || member.lastName}`;
            const gender = member.Sexe || member.gender;
            const genderIcon = gender === 'F' ? '♀' : (gender === 'M' ? '♂' : '');
            
            memberDiv.innerHTML = `
                <div class="member-name">${fullName} ${genderIcon}</div>
                <div class="member-dates">${yearsInfo}</div>
                <div class="member-relation">${getRelationText(member)}</div>
            `;
            
            return memberDiv;
        }

        // Obtenir le texte de relation
        function getRelationText(member) {
            const generation = parseInt(member.Generation || member.generation);
            const hasParents = (member.ID_Pere && member.ID_Pere !== "") || (member.ID_Mere && member.ID_Mere !== "");
            const hasChildren = familyMembers.some(m => 
                m.ID_Pere === member.ID || m.ID_Mere === member.ID
            );
            
            if (generation === 1) return "Ancêtre";
            if (!hasParents) return "Marié(e) dans la famille";
            if (hasChildren) return "Parent";
            return "Enfant";
        }

        // Mettre à jour les compteurs de génération
        function updateGenerationCounts(membersByGeneration) {
            // Mettre à jour les boutons de navigation avec les vrais comptes
            document.querySelectorAll('.nav-btn').forEach(btn => {
                const gen = btn.dataset.gen;
                if (gen !== 'all') {
                    const count = membersByGeneration[gen] ? membersByGeneration[gen].length : 0;
                    btn.textContent = `${gen}ère génération (${count} membres)`;
                }
            });
        }

        // Initialiser les événements
        function initEvents() {
            // Navigation entre générations
            const navButtons = document.querySelectorAll('.nav-btn');
            navButtons.forEach(button => {
                button.addEventListener('click', function() {
                    // Retirer la classe active de tous les boutons
                    navButtons.forEach(btn => btn.classList.remove('active'));
                    // Ajouter la classe active au bouton cliqué
                    this.classList.add('active');
                    
                    const generation = this.dataset.gen;
                    filterByGeneration(generation);
                    
                    // Effacer la recherche si on change de génération
                    clearSearch();
                });
            });
            
            // Recherche par bouton
            document.getElementById('searchBtn').addEventListener('click', performSearch);
            
            // Recherche par touche Entrée
            document.getElementById('searchInput').addEventListener('keyup', function(e) {
                if (e.key === 'Enter') {
                    performSearch();
                } else {
                    // Recherche en temps réel après un délai
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        showSearchSuggestions(this.value);
                    }, 300);
                }
            });
            
            // Effacer la recherche
            document.getElementById('clearSearchBtn').addEventListener('click', clearSearch);
            
            // Clic sur un membre
            document.addEventListener('click', function(e) {
                if (e.target.closest('.member')) {
                    const memberElement = e.target.closest('.member');
                    const memberId = memberElement.dataset.id;
                    showMemberInfo(memberId);
                    
                    // Mettre en surbrillance le membre sélectionné
                    document.querySelectorAll('.member').forEach(m => {
                        m.classList.remove('active');
                        m.classList.remove('highlighted');
                    });
                    memberElement.classList.add('active');
                    
                    // Faire défiler jusqu'au panneau d'information
                    document.getElementById('infoPanel').scrollIntoView({ behavior: 'smooth' });
                }
                
                // Clic sur une suggestion
                if (e.target.closest('.suggestion-item')) {
                    const suggestionItem = e.target.closest('.suggestion-item');
                    const memberId = suggestionItem.dataset.id;
                    
                    // Remplir le champ de recherche
                    document.getElementById('searchInput').value = suggestionItem.querySelector('.suggestion-name').textContent;
                    
                    // Fermer les suggestions
                    document.getElementById('searchSuggestions').classList.remove('active');
                    
                    // Effectuer la recherche
                    performSearch();
                    
                    // Afficher les informations du membre
                    showMemberInfo(memberId);
                }
            });
            
            // Fermer les suggestions en cliquant ailleurs
            document.addEventListener('click', function(e) {
                if (!e.target.closest('.search-suggestions') && !e.target.closest('#searchInput')) {
                    document.getElementById('searchSuggestions').classList.remove('active');
                }
            });
            
            // Bouton de retour en haut
            document.getElementById('backToTop').addEventListener('click', function() {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            
            // Afficher le bouton de retour en haut lors du défilement
            window.addEventListener('scroll', function() {
                const backToTopBtn = document.getElementById('backToTop');
                if (window.scrollY > 300) {
                    backToTopBtn.classList.add('visible');
                } else {
                    backToTopBtn.classList.remove('visible');
                }
            });
            
            // Afficher un membre au hasard au chargement
            setTimeout(() => {
                if (familyMembers.length > 0) {
                    const randomIndex = Math.floor(Math.random() * familyMembers.length);
                    const randomMember = familyMembers[randomIndex];
                    showMemberInfo(randomMember.ID || randomMember.id);
                    
                    // Mettre en surbrillance le membre
                    const memberElement = document.querySelector(`.member[data-id="${randomMember.ID || randomMember.id}"]`);
                    if (memberElement) {
                        document.querySelectorAll('.member').forEach(m => m.classList.remove('active'));
                        memberElement.classList.add('active');
                    }
                }
            }, 1500);
        }

        // Filtrer par génération
        function filterByGeneration(generation) {
            const allMembers = document.querySelectorAll('.member');
            
            if (generation === 'all') {
                // Afficher tous les membres
                allMembers.forEach(member => {
                    member.style.display = 'block';
                });
                
                // Afficher toutes les générations
                document.querySelectorAll('.generation').forEach(gen => {
                    gen.style.display = 'flex';
                });
            } else {
                // Masquer tous les membres
                allMembers.forEach(member => {
                    member.style.display = 'none';
                });
                
                // Masquer toutes les générations
                document.querySelectorAll('.generation').forEach(gen => {
                    gen.style.display = 'none';
                });
                
                // Afficher uniquement la génération sélectionnée
                document.querySelectorAll(`.generation-${generation} .member`).forEach(member => {
                    member.style.display = 'block';
                });
                
                document.querySelector(`.generation-${generation}`).style.display = 'flex';
            }
            
            // Mettre à jour le filtre de génération dans la recherche
            document.getElementById('generationFilter').value = generation;
        }

        // Effectuer une recherche
        function performSearch() {
            const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
            const searchFilter = document.getElementById('searchFilter').value;
            const generationFilter = document.getElementById('generationFilter').value;
            
            if (!searchTerm) {
                clearSearch();
                return;
            }
            
            // Réinitialiser les surlignements précédents
            document.querySelectorAll('.member').forEach(member => {
                member.classList.remove('highlighted');
                
                // Retirer l'indicateur de recherche
                const searchIndicator = member.querySelector('.member-search-match');
                if (searchIndicator) {
                    searchIndicator.remove();
                }
            });
            
            // Filtrer les membres selon les critères
            currentSearchResults = familyMembers.filter(member => {
                // Filtrer par génération si spécifié
                if (generationFilter !== 'all') {
                    const memberGeneration = member.Generation || member.generation;
                    if (memberGeneration.toString() !== generationFilter) {
                        return false;
                    }
                }
                
                // Rechercher selon le filtre choisi
                const fullName = `${member.Prennom || member.firstName || ''} ${member.Nom || member.lastName || ''}`.toLowerCase();
                const firstName = (member.Prennom || member.firstName || '').toLowerCase();
                const lastName = (member.Nom || member.lastName || '').toLowerCase();
                const birthDate = (member.DateNaissance || member.birthDate || '').toLowerCase();
                
                switch(searchFilter) {
                    case 'name':
                        return fullName.includes(searchTerm) || 
                               firstName.includes(searchTerm) || 
                               lastName.includes(searchTerm);
                    case 'firstName':
                        return firstName.includes(searchTerm);
                    case 'lastName':
                        return lastName.includes(searchTerm);
                    case 'birthDate':
                        return birthDate.includes(searchTerm);
                    case 'generation':
                        return (member.Generation || member.generation || '').toString() === searchTerm;
                    default: // 'all'
                        return fullName.includes(searchTerm) || 
                               firstName.includes(searchTerm) || 
                               lastName.includes(searchTerm) ||
                               birthDate.includes(searchTerm) ||
                               (member.Generation || member.generation || '').toString() === searchTerm;
                }
            });
            
            // Mettre à jour l'affichage des résultats
            updateSearchResultsDisplay();
            
            // Si un seul résultat, l'afficher directement
            if (currentSearchResults.length === 1) {
                const member = currentSearchResults[0];
                showMemberInfo(member.ID || member.id);
                
                // Mettre en surbrillance le membre
                const memberElement = document.querySelector(`.member[data-id="${member.ID || member.id}"]`);
                if (memberElement) {
                    memberElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
            
            // Fermer les suggestions
            document.getElementById('searchSuggestions').classList.remove('active');
        }

        // Mettre à jour l'affichage des résultats de recherche
        function updateSearchResultsDisplay() {
            const resultsInfo = document.getElementById('searchResultsInfo');
            
            if (currentSearchResults.length === 0) {
                resultsInfo.textContent = `Aucun résultat trouvé pour "${document.getElementById('searchInput').value}"`;
                resultsInfo.classList.remove('highlight');
            } else {
                resultsInfo.textContent = `${currentSearchResults.length} résultat(s) trouvé(s) pour "${document.getElementById('searchInput').value}"`;
                resultsInfo.classList.add('highlight');
                
                // Mettre en surbrillance les résultats dans l'arbre
                currentSearchResults.forEach((member, index) => {
                    const memberId = member.ID || member.id;
                    const memberElement = document.querySelector(`.member[data-id="${memberId}"]`);
                    
                    if (memberElement) {
                        memberElement.classList.add('highlighted');
                        
                        // Ajouter un indicateur de correspondance
                        const searchIndicator = document.createElement('div');
                        searchIndicator.className = 'member-search-match';
                        searchIndicator.textContent = index + 1;
                        memberElement.appendChild(searchIndicator);
                        
                        // Assurer que le membre est visible
                        const generation = member.Generation || member.generation;
                        if (document.getElementById('generationFilter').value !== 'all') {
                            filterByGeneration(generation);
                        }
                    }
                });
            }
        }

        // Afficher les suggestions de recherche
        function showSearchSuggestions(searchTerm) {
            const suggestionsContainer = document.getElementById('searchSuggestions');
            
            if (!searchTerm || searchTerm.length < 2) {
                suggestionsContainer.classList.remove('active');
                return;
            }
            
            // Filtrer les membres pour les suggestions
            const suggestions = familyMembers.filter(member => {
                const fullName = `${member.Prennom || member.firstName || ''} ${member.Nom || member.lastName || ''}`.toLowerCase();
                const firstName = (member.Prennom || member.firstName || '').toLowerCase();
                const lastName = (member.Nom || member.lastName || '').toLowerCase();
                
                return fullName.includes(searchTerm.toLowerCase()) || 
                       firstName.includes(searchTerm.toLowerCase()) || 
                       lastName.includes(searchTerm.toLowerCase());
            }).slice(0, 10); // Limiter à 10 suggestions
            
            if (suggestions.length === 0) {
                suggestionsContainer.classList.remove('active');
                return;
            }
            
            // Afficher les suggestions
            suggestionsContainer.innerHTML = suggestions.map(member => {
                const fullName = `${member.Prennom || member.firstName} ${member.Nom || member.lastName}`;
                const birthDate = member.DateNaissance || member.birthDate;
                const birthYear = birthDate ? birthDate.substring(0, 4) : 'Date inconnue';
                
                return `
                    <div class="suggestion-item" data-id="${member.ID || member.id}">
                        <div class="suggestion-name">${fullName}</div>
                        <div class="suggestion-details">Né(e) en ${birthYear} • Génération ${member.Generation || member.generation}</div>
                    </div>
                `;
            }).join('');
            
            suggestionsContainer.classList.add('active');
        }

        // Effacer la recherche
        function clearSearch() {
            document.getElementById('searchInput').value = '';
            document.getElementById('searchFilter').value = 'all';
            document.getElementById('searchResultsInfo').textContent = 'Tapez un terme de recherche pour trouver des membres de la famille';
            document.getElementById('searchResultsInfo').classList.remove('highlight');
            document.getElementById('searchSuggestions').classList.remove('active');
            
            // Réinitialiser les surlignements
            document.querySelectorAll('.member').forEach(member => {
                member.classList.remove('highlighted');
                
                // Retirer l'indicateur de recherche
                const searchIndicator = member.querySelector('.member-search-match');
                if (searchIndicator) {
                    searchIndicator.remove();
                }
            });
            
            currentSearchResults = [];
        }

        // Afficher les informations d'un membre
        function showMemberInfo(memberId) {
            const infoPanel = document.getElementById('infoPanel');
            const member = familyMembers.find(m => (m.ID || m.id) === memberId);
            
            if (!member) {
                infoPanel.innerHTML = `
                    <div class="info-header">
                        <div class="info-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="info-title">
                            <h2>Membre non trouvé</h2>
                            <p>Les informations pour ce membre ne sont pas encore disponibles</p>
                        </div>
                    </div>
                `;
                infoPanel.classList.add('active');
                return;
            }
            
            // Trouver les informations connexes
            const father = member.ID_Pere ? familyMembers.find(m => (m.ID || m.id) === member.ID_Pere) : null;
            const mother = member.ID_Mere ? familyMembers.find(m => (m.ID || m.id) === member.ID_Mere) : null;
            const spouseId = member.ConjointID || member.spouseId;
            const spouse = spouseId ? familyMembers.find(m => (m.ID || m.id) === spouseId) : null;
            
            // Trouver les enfants
            const children = familyMembers.filter(m => 
                m.ID_Pere === memberId || m.ID_Mere === memberId
            );
            
            // Formater la date de naissance
            let formattedBirthDate = "Date inconnue";
            if (member.DateNaissance || member.birthDate) {
                const date = new Date(member.DateNaissance || member.birthDate);
                if (!isNaN(date)) {
                    formattedBirthDate = date.toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                } else {
                    formattedBirthDate = member.DateNaissance || member.birthDate;
                }
            }
            
            // Générer les initiales pour l'avatar
            const firstName = member.Prennom || member.firstName || '';
            const lastName = member.Nom || member.lastName || '';
            const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
            
            infoPanel.innerHTML = `
                <div class="info-header">
                    <div class="info-avatar">
                        ${member.URL_img ? `<img src="${member.URL_img}" alt="${firstName} ${lastName}">` : initials}
                    </div>
                    <div class="info-title">
                        <h2>${firstName} ${lastName}</h2>
                        <p>${getRelationText(member)} • Génération ${member.Generation || member.generation}</p>
                    </div>
                </div>
                
                <div class="info-content">
                    <div class="info-section">
                        <h3>Informations personnelles</h3>
                        <div class="info-item">
                            <span class="info-label">Nom complet :</span>
                            <span>${firstName} ${lastName}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Sexe :</span>
                            <span>${member.Sexe === 'M' ? 'Masculin' : (member.Sexe === 'F' ? 'Féminin' : 'Non spécifié')}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Date de naissance :</span>
                            <span>${formattedBirthDate}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Génération :</span>
                            <span>${member.Generation || member.generation}</span>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <h3>Connexions familiales</h3>
                        <div class="info-item">
                            <span class="info-label">Père :</span>
                            <span>${father ? `${father.Prennom || father.firstName} ${father.Nom || father.lastName}` : 'Inconnu'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Mère :</span>
                            <span>${mother ? `${mother.Prennom || mother.firstName} ${mother.Nom || mother.lastName}` : 'Inconnue'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Conjoint :</span>
                            <span>${spouse ? `${spouse.Prennom || spouse.firstName} ${spouse.Nom || spouse.lastName}` : 'Aucun'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Enfants :</span>
                            <div>${children.length > 0 ? 
                                `<ul>${children.map(child => `<li>${child.Prennom || child.firstName} ${child.Nom || child.lastName}</li>`).join('')}</ul>` : 
                                'Aucun'}</div>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <h3>Actions</h3>
                        <p>Cliquez sur les membres dans l'arbre pour explorer davantage les connexions familiales.</p>
                        <button class="search-btn" style="margin-top: 10px;" onclick="highlightFamily('${memberId}')">
                            <i class="fas fa-users"></i>
                            <span>Surligner la famille proche</span>
                        </button>
                    </div>
                </div>
            `;
            
            infoPanel.classList.add('active');
        }

        // Surligner la famille proche
        function highlightFamily(memberId) {
            // Réinitialiser les surlignements
            document.querySelectorAll('.member').forEach(member => {
                member.classList.remove('highlighted');
                
                // Retirer l'indicateur de recherche
                const searchIndicator = member.querySelector('.member-search-match');
                if (searchIndicator) {
                    searchIndicator.remove();
                }
            });
            
            // Trouver le membre
            const member = familyMembers.find(m => (m.ID || m.id) === memberId);
            if (!member) return;
            
            // Trouver les membres de la famille proche
            const familyMemberIds = new Set();
            
            // Ajouter le membre lui-même
            familyMemberIds.add(memberId);
            
            // Ajouter les parents
            if (member.ID_Pere) familyMemberIds.add(member.ID_Pere);
            if (member.ID_Mere) familyMemberIds.add(member.ID_Mere);
            
            // Ajouter le conjoint
            if (member.ConjointID) familyMemberIds.add(member.ConjointID);
            
            // Ajouter les enfants
            familyMembers.forEach(m => {
                if (m.ID_Pere === memberId || m.ID_Mere === memberId) {
                    familyMemberIds.add(m.ID || m.id);
                }
            });
            
            // Surligner les membres de la famille
            familyMemberIds.forEach(id => {
                const memberElement = document.querySelector(`.member[data-id="${id}"]`);
                if (memberElement) {
                    memberElement.classList.add('highlighted');
                }
            });
            
            // Afficher un message
            showNotification(`${familyMemberIds.size} membres de la famille proche surlignés`, "success");
        }

        // Afficher/masquer l'overlay de chargement
        function showLoading(show) {
            const overlay = document.getElementById('loadingOverlay');
            if (show) {
                overlay.classList.add('active');
            } else {
                overlay.classList.remove('active');
            }
        }

        // Afficher une notification
        function showNotification(message, type = "success") {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.className = `notification ${type}`;
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }

        // -------------------Script pour la page souvenir---------------------

         // Données des photos
        const photos = [
            {
                id: 1,
                src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
                title: "Mariage Grands-Parents - 1965",
                date: "15 Juin 1965",
                desc: "Cérémonie de mariage de Jean et Marie à la mairie de Lyon",
                categories: ["anciennes", "mariages"],
                uploadedBy: "Marie D.",
                uploadDate: "2023-05-10"
            },
            {
                id: 2,
                src: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
                title: "Réunion Familiale d'Été",
                date: "Août 1990",
                desc: "Toute la famille réunie pour les vacances d'été en Provence",
                categories: ["anciennes", "reunions"],
                uploadedBy: "Pierre L.",
                uploadDate: "2023-04-22"
            },
            {
                id: 3,
                src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
                title: "Naissance de Sophie",
                date: "12 Mars 2005",
                desc: "Première photo de Sophie à la maternité",
                categories: ["recentes", "naissance"],
                uploadedBy: "Sophie M.",
                uploadDate: "2023-06-15"
            },
            {
                id: 4,
                src: "https://images.unsplash.com/photo-1511988617509-a57c8a288659?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
                title: "Noël en Famille",
                date: "25 Décembre 2015",
                desc: "Célébration de Noël avec tous les cousins",
                categories: ["recentes", "reunions"],
                uploadedBy: "Thomas R.",
                uploadDate: "2023-03-18"
            },
            {
                id: 5,
                src: "https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
                title: "Voyage en Bretagne",
                date: "Juillet 2018",
                desc: "Excursion en famille sur les côtes bretonnes",
                categories: ["recentes", "voyage"],
                uploadedBy: "Claire B.",
                uploadDate: "2023-02-05"
            },
            {
                id: 6,
                src: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
                title: "Anniversaire des 80 ans",
                date: "3 Mai 2020",
                desc: "Célébration des 80 ans de Grand-Père Pierre",
                categories: ["recentes", "reunions"],
                uploadedBy: "Jean D.",
                uploadDate: "2023-01-30"
            },
            {
                id: 7,
                src: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
                title: "Mariage de Claire et Marc",
                date: "10 Septembre 2022",
                desc: "Beau mariage au château de la région",
                categories: ["recentes", "mariages"],
                uploadedBy: "Marc T.",
                uploadDate: "2023-07-12"
            },
            {
                id: 8,
                src: "https://images.unsplash.com/photo-1519750783826-ea0b6bdbd5a8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
                title: "Photos d'École - Année 1972",
                date: "1972",
                desc: "Classe de CM2 de l'école du village",
                categories: ["anciennes"],
                uploadedBy: "Anne S.",
                uploadDate: "2023-08-01"
            }
        ];

        // Données des catégories
        const categories = [
            { id: 'anciennes', name: 'Anciennes', icon: 'fas fa-history' },
            { id: 'recentes', name: 'Récentes', icon: 'fas fa-calendar-alt' },
            { id: 'mariages', name: 'Mariages', icon: 'fas fa-ring' },
            { id: 'reunions', name: 'Réunions', icon: 'fas fa-users' },
            { id: 'naissance', name: 'Naissances', icon: 'fas fa-baby' },
            { id: 'voyage', name: 'Voyages', icon: 'fas fa-plane' },
            { id: 'portrait', name: 'Portraits', icon: 'fas fa-user' },
            { id: 'enfance', name: 'Enfance', icon: 'fas fa-child' }
        ];

        // Variables globales
        let currentFilter = 'all';
        let currentPhotoIndex = 0;
        let filteredPhotos = [];
        let userPhotos = JSON.parse(localStorage.getItem('familyPhotos')) || [];
        let selectedCategories = [];
        let selectedFileData = null;

        // Initialisation
        document.addEventListener('DOMContentLoaded', function() {
            // Année courante
            document.getElementById('currentYear').textContent = new Date().getFullYear();
            
            // Initialiser les composants
            updateCounters();
            renderGallery();
            setupEventListeners();
            setupMobileMenu();
            setupAddPhotoForm();
            setupBackToTop();
            setupPhotoModal();
            
            // Cacher l'indicateur après 3 secondes
            setTimeout(() => {
                const indicator = document.querySelector('.current-page-indicator');
                if (indicator) {
                    indicator.style.opacity = '0';
                    indicator.style.transform = 'translateX(-50%) translateY(-30px)';
                    setTimeout(() => {
                        indicator.style.display = 'none';
                    }, 500);
                }
            }, 3000);
            
            // Scroll vers le haut
            window.scrollTo(0, 0);
        });

        // Mettre à jour les compteurs
        function updateCounters() {
            const totalPhotos = photos.length + userPhotos.length;
            document.getElementById('totalPhotos').textContent = totalPhotos;
            
            // Photos ajoutées récemment (moins de 30 jours)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const recentPhotos = userPhotos.filter(photo => {
                const uploadDate = new Date(photo.uploadDate);
                return uploadDate >= thirtyDaysAgo;
            }).length;
            
            document.getElementById('addedPhotos').textContent = recentPhotos;
        }

        // Rendre la galerie
        function renderGallery() {
            const gallery = document.getElementById('photoGallery');
            gallery.innerHTML = '';
            
            const allPhotos = [...photos, ...userPhotos];
            
            filteredPhotos = currentFilter === 'all' 
                ? [...allPhotos] 
                : allPhotos.filter(photo => 
                    photo.categories && photo.categories.includes(currentFilter)
                );
            
            filteredPhotos.forEach((photo, index) => {
                const photoCard = document.createElement('div');
                photoCard.className = 'photo-card';
                photoCard.dataset.index = index;
                photoCard.style.setProperty('--index', index);
                
                // Créer les tags de catégories
                const categoriesHTML = photo.categories 
                    ? photo.categories.map(cat => {
                        const category = categories.find(c => c.id === cat);
                        return category ? `<span class="category-tag">${category.name}</span>` : '';
                      }).join('')
                    : '';
                
                // Info uploader
                const uploadedInfo = photo.uploadedBy 
                    ? `<div class="uploader-info">
                        <i class="fas fa-user-edit"></i>
                        Ajouté par ${photo.uploadedBy}
                       </div>`
                    : '';
                
                photoCard.innerHTML = `
                    <img src="${photo.src}" alt="${photo.title}" class="photo-img">
                    <div class="photo-info">
                        <h3 class="photo-title">${photo.title}</h3>
                        <span class="photo-date">${photo.date}</span>
                        <p class="photo-desc">${photo.desc}</p>
                        <div class="photo-categories">${categoriesHTML}</div>
                        ${uploadedInfo}
                    </div>
                `;
                
                photoCard.addEventListener('click', () => openPhotoModal(index));
                gallery.appendChild(photoCard);
            });
        }

        // Filtrage des photos
        function filterPhotos(filter) {
            currentFilter = filter;
            renderGallery();
            
            // Mettre à jour les boutons actifs
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.filter === filter);
            });
        }

        // Recherche
       

        // Menu mobile
        function setupMobileMenu() {
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
            const navLinks = document.getElementById('navLinks');
            
            mobileMenuBtn.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                const icon = mobileMenuBtn.querySelector('i');
                icon.className = navLinks.classList.contains('active') 
                    ? 'fas fa-times' 
                    : 'fas fa-bars';
                mobileMenuBtn.style.transform = navLinks.classList.contains('active') 
                    ? 'rotate(90deg)' 
                    : 'rotate(0deg)';
            });
            
            // Fermer le menu en cliquant sur un lien
            document.querySelectorAll('.nav-links a').forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('active');
                    const icon = mobileMenuBtn.querySelector('i');
                    icon.className = 'fas fa-bars';
                    mobileMenuBtn.style.transform = 'rotate(0deg)';
                });
            });
        }

        // Formulaire d'ajout de photo
        function setupAddPhotoForm() {
            const openModalBtn = document.getElementById('openAddPhotoModal');
            const closeModalBtn = document.getElementById('closeAddModal');
            const cancelBtn = document.getElementById('cancelBtn');
            const addPhotoModal = document.getElementById('addPhotoModal');
            const fileUploadArea = document.getElementById('fileUploadArea');
            const browseBtn = document.getElementById('browseBtn');
            const photoFileInput = document.getElementById('photoFile');
            const selectedFile = document.getElementById('selectedFile');
            const fileThumbnail = document.getElementById('fileThumbnail');
            const fileNameDisplay = document.getElementById('fileNameDisplay');
            const fileSizeDisplay = document.getElementById('fileSizeDisplay');
            const removeFileBtn = document.getElementById('removeFile');
            const uploadProgress = document.getElementById('uploadProgress');
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            const uploadStatus = document.getElementById('uploadStatus');
            const submitBtn = document.getElementById('submitBtn');
            const uploadForm = document.getElementById('photoUploadForm');
            const categoriesGrid = document.getElementById('categoriesGrid');
            
            // Initialiser les catégories
            function initCategories() {
                categoriesGrid.innerHTML = '';
                selectedCategories = [];
                
                categories.forEach(category => {
                    const categoryEl = document.createElement('div');
                    categoryEl.className = 'category-option';
                    categoryEl.dataset.id = category.id;
                    
                    categoryEl.innerHTML = `
                        <i class="${category.icon} category-icon"></i>
                        <span>${category.name}</span>
                        <i class="fas fa-check checkmark"></i>
                    `;
                    
                    categoryEl.addEventListener('click', () => {
                        categoryEl.classList.toggle('selected');
                        if (categoryEl.classList.contains('selected')) {
                            selectedCategories.push(category.id);
                        } else {
                            selectedCategories = selectedCategories.filter(id => id !== category.id);
                        }
                        validateForm();
                    });
                    
                    categoriesGrid.appendChild(categoryEl);
                });
            }
            
            // Valider le formulaire
            function validateForm() {
                const title = document.getElementById('photoTitle').value.trim();
                const date = document.getElementById('photoDate').value.trim();
                const name = document.getElementById('uploaderName').value.trim();
                const hasFile = selectedFileData !== null;
                
                const isValid = title && date && name && hasFile;
                submitBtn.disabled = !isValid;
                
                return isValid;
            }
            
            // Ouvrir le modal
            openModalBtn.addEventListener('click', () => {
                addPhotoModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                initCategories();
            });
            
            // Fermer le modal
            function closeModal() {
                addPhotoModal.style.display = 'none';
                document.body.style.overflow = 'auto';
                resetForm();
            }
            
            closeModalBtn.addEventListener('click', closeModal);
            cancelBtn.addEventListener('click', closeModal);
            
            // Fermer en cliquant à l'extérieur
            addPhotoModal.addEventListener('click', (e) => {
                if (e.target === addPhotoModal) {
                    closeModal();
                }
            });
            
            // Gestion drag & drop
            ['dragenter', 'dragover'].forEach(eventName => {
                fileUploadArea.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    fileUploadArea.classList.add('drag-over');
                });
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                fileUploadArea.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    fileUploadArea.classList.remove('drag-over');
                });
            });
            
            fileUploadArea.addEventListener('drop', handleDrop);
            
            function handleDrop(e) {
                const dt = e.dataTransfer;
                const files = dt.files;
                if (files.length > 0) {
                    handleFileSelect(files[0]);
                }
            }
            
            // Parcourir les fichiers
            browseBtn.addEventListener('click', () => {
                photoFileInput.click();
            });
            
            photoFileInput.addEventListener('change', function() {
                if (this.files.length > 0) {
                    handleFileSelect(this.files[0]);
                }
            });
            
            // Gestion de la sélection de fichier
            function handleFileSelect(file) {
                if (!file) return;
                
                if (file.size > 5 * 1024 * 1024) {
                    showStatus('error', 'Le fichier est trop volumineux. Maximum 5MB.');
                    return;
                }
                
                if (!file.type.match('image.*')) {
                    showStatus('error', 'Veuillez sélectionner une image (JPG, PNG, GIF).');
                    return;
                }
                
                selectedFileData = file;
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    fileThumbnail.src = e.target.result;
                    fileNameDisplay.textContent = file.name;
                    fileSizeDisplay.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
                    selectedFile.classList.add('active');
                    validateForm();
                };
                reader.readAsDataURL(file);
            }
            
            // Supprimer le fichier
            removeFileBtn.addEventListener('click', () => {
                selectedFileData = null;
                selectedFile.classList.remove('active');
                photoFileInput.value = '';
                validateForm();
            });
            
            // Afficher un message d'état
            function showStatus(type, message) {
                uploadStatus.className = `upload-status ${type}`;
                uploadStatus.innerHTML = `
                    <div class="status-icon">
                        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                    </div>
                    <div style="font-size: 1.2rem;">${message}</div>
                `;
                uploadStatus.style.display = 'block';
                
                if (type === 'success') {
                    setTimeout(() => {
                        uploadStatus.style.display = 'none';
                    }, 5000);
                }
            }
            
            // Simuler l'upload
            function simulateUpload() {
                uploadProgress.style.display = 'block';
                let progress = 0;
                
                const interval = setInterval(() => {
                    progress += 10;
                    progressFill.style.width = `${progress}%`;
                    progressText.textContent = `${progress}%`;
                    
                    if (progress >= 100) {
                        clearInterval(interval);
                        setTimeout(() => {
                            completeUpload();
                        }, 500);
                    }
                }, 150);
            }
            
            // Compléter l'upload
            function completeUpload() {
                const title = document.getElementById('photoTitle').value;
                const date = document.getElementById('photoDate').value;
                const description = document.getElementById('photoDescription').value;
                const uploaderName = document.getElementById('uploaderName').value;
                const uploaderEmail = document.getElementById('uploaderEmail').value;
                
                const newPhoto = {
                    id: Date.now(),
                    src: fileThumbnail.src,
                    title: title,
                    date: date,
                    desc: description,
                    categories: [...selectedCategories],
                    uploadedBy: uploaderName,
                    uploadDate: new Date().toISOString().split('T')[0]
                };
                
                // Sauvegarder
                userPhotos.push(newPhoto);
                localStorage.setItem('familyPhotos', JSON.stringify(userPhotos));
                
                // Mettre à jour l'affichage
                updateCounters();
                renderGallery();
                
                // Message de succès
                showStatus('success', `Félicitations ${uploaderName} !<br>Votre photo a été ajoutée avec succès.`);
                
                // Réinitialiser après un délai
                setTimeout(() => {
                    resetForm();
                    closeModal();
                    showToast(`"${title}" a été ajoutée à l'album familial !`);
                }, 2000);
            }
            
            // Toast de notification
            function showToast(message) {
                const toast = document.createElement('div');
                toast.className = 'toast-notification';
                toast.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    <span>${message}</span>
                `;
                
                document.body.appendChild(toast);
                
                setTimeout(() => {
                    toast.style.animation = 'slideOutRight 0.4s ease forwards';
                    setTimeout(() => {
                        if (toast.parentNode) {
                            document.body.removeChild(toast);
                        }
                    }, 400);
                }, 4000);
            }
            
            // Réinitialiser le formulaire
            function resetForm() {
                uploadForm.reset();
                selectedFileData = null;
                selectedCategories = [];
                selectedFile.classList.remove('active');
                uploadProgress.style.display = 'none';
                progressFill.style.width = '0%';
                progressText.textContent = '0%';
                uploadStatus.style.display = 'none';
                submitBtn.disabled = true;
                
                document.querySelectorAll('.category-option').forEach(option => {
                    option.classList.remove('selected');
                });
            }
            
            // Validation en temps réel
            ['photoTitle', 'photoDate', 'uploaderName'].forEach(id => {
                document.getElementById(id).addEventListener('input', validateForm);
            });
            
            // Soumission
            uploadForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                if (!validateForm()) {
                    showStatus('error', 'Veuillez remplir tous les champs obligatoires.');
                    return;
                }
                
                simulateUpload();
            });
            
            // Initialiser
            initCategories();
        }

        // Modal photo
        function setupPhotoModal() {
            const photoModal = document.getElementById('photoModal');
            const modalClose = document.getElementById('modalClose');
            const prevBtn = document.getElementById('prevBtn');
            const nextBtn = document.getElementById('nextBtn');
            const modalImg = document.getElementById('modalImg');
            const modalTitle = document.getElementById('modalTitle');
            const modalDate = document.getElementById('modalDate');
            const modalDesc = document.getElementById('modalDesc');
            
            function openPhotoModal(index) {
                currentPhotoIndex = index;
                const photo = filteredPhotos[index];
                
                modalImg.src = photo.src;
                modalTitle.textContent = photo.title;
                modalDate.textContent = photo.date;
                modalDesc.textContent = photo.desc;
                
                photoModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
            
            function closePhotoModal() {
                photoModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
            
            function navigatePhoto(direction) {
                currentPhotoIndex += direction;
                
                if (currentPhotoIndex < 0) {
                    currentPhotoIndex = filteredPhotos.length - 1;
                } else if (currentPhotoIndex >= filteredPhotos.length) {
                    currentPhotoIndex = 0;
                }
                
                openPhotoModal(currentPhotoIndex);
            }
            
            // Événements
            modalClose.addEventListener('click', closePhotoModal);
            prevBtn.addEventListener('click', () => navigatePhoto(-1));
            nextBtn.addEventListener('click', () => navigatePhoto(1));
            
            // Fermer avec ESC
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && photoModal.style.display === 'flex') {
                    closePhotoModal();
                }
                if (e.key === 'ArrowLeft' && photoModal.style.display === 'flex') {
                    navigatePhoto(-1);
                }
                if (e.key === 'ArrowRight' && photoModal.style.display === 'flex') {
                    navigatePhoto(1);
                }
            });
            
            // Fermer en cliquant à l'extérieur
            photoModal.addEventListener('click', (e) => {
                if (e.target === photoModal) {
                    closePhotoModal();
                }
            });
            
            // Exporter la fonction
            window.openPhotoModal = openPhotoModal;
        }

        // Back to Top
        function setupBackToTop() {
            const backToTopBtn = document.getElementById('backToTop');
            
            window.addEventListener('scroll', () => {
                if (window.pageYOffset > 500) {
                    backToTopBtn.classList.add('visible');
                } else {
                    backToTopBtn.classList.remove('visible');
                }
            });
            
            backToTopBtn.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }

        // Configuration des événements globaux
        function setupEventListeners() {
            // Filtres
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', () => filterPhotos(btn.dataset.filter));
            });

            // Recherche
            
            // Gestion du scroll pour la navbar
            let lastScroll = 0;
            window.addEventListener('scroll', () => {
                const currentScroll = window.pageYOffset;
                const nav = document.querySelector('.main-nav');
                
                if (currentScroll > lastScroll && currentScroll > 100) {
                    nav.style.transform = 'translateY(-100%)';
                } else {
                    nav.style.transform = 'translateY(0)';
                }
                
                lastScroll = currentScroll;
            });
            
            // Effet parallaxe hero
            window.addEventListener('scroll', () => {
                const scrolled = window.pageYOffset;
                const hero = document.querySelector('.photos-hero');
                if (hero) {
                    const rate = scrolled * 0.5;
                    hero.style.transform = `translate3d(0, ${rate}px, 0)`;
                }
            });
        }