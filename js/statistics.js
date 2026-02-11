// ============================
// STATISTIQUES DE LA FAMILLE
// ============================

function showFamilyStatistics() {
    const stats = calculateStatistics();
    
    let html = `
        <div class="statistics-container">
            <div class="stats-header">
                <h3>Statistiques de la famille MBOZO'O</h3>
                <p>${familyMembers.length} membres enregistrés</p>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">👨</div>
                    <div class="stat-value">${stats.men}</div>
                    <div class="stat-label">Hommes</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">👩</div>
                    <div class="stat-value">${stats.women}</div>
                    <div class="stat-label">Femmes</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">👶</div>
                    <div class="stat-value">${stats.averageChildren.toFixed(1)}</div>
                    <div class="stat-label">Enfants/parent</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">💍</div>
                    <div class="stat-value">${stats.married}</div>
                    <div class="stat-label">Marié(e)s</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⚰️</div>
                    <div class="stat-value">${stats.deceased}</div>
                    <div class="stat-label">Décédé(e)s</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📊</div>
                    <div class="stat-value">${stats.generations}</div>
                    <div class="stat-label">Générations</div>
                </div>
            </div>
            
            <div class="stats-charts">
                <div class="chart-container">
                    <h4>Répartition par génération</h4>
                    <canvas id="genChart"></canvas>
                </div>
                <div class="chart-container">
                    <h4>Naissances par décennie</h4>
                    <canvas id="birthChart"></canvas>
                </div>
            </div>
            
            <div class="stats-tables">
                ${generateTopParentsTable(stats.topParents)}
                ${generateLargestGenerationsTable(stats.largestGenerations)}
            </div>
        </div>
    `;
    
    showCustomModal('Statistiques familiales', html);
    
    // Initialiser les graphiques après l'affichage
    setTimeout(() => {
        initCharts(stats);
    }, 100);
}

function calculateStatistics() {
    const stats = {
        men: 0,
        women: 0,
        unknown: 0,
        married: 0,
        deceased: 0,
        generations: new Set(),
        byGeneration: {},
        byDecade: {},
        childrenCount: {},
        parents: new Set()
    };
    
    familyMembers.forEach(member => {
        // Sexe
        if (member.Sexe === 'M') stats.men++;
        else if (member.Sexe === 'F') stats.women++;
        else stats.unknown++;
        
        // Mariage
        if (member.ConjointID && member.ConjointID.trim() !== '') {
            stats.married++;
        }
        
        // Décès
        if (member.estDecede) {
            stats.deceased++;
        }
        
        // Génération
        if (member.Generation) {
            stats.generations.add(member.Generation);
            stats.byGeneration[member.Generation] = (stats.byGeneration[member.Generation] || 0) + 1;
        }
        
        // Décennie de naissance
        if (member.DateNaissance && member.DateNaissance !== '0000-00-00') {
            const year = parseInt(member.DateNaissance.substring(0, 4));
            if (!isNaN(year) && year > 1800) {
                const decade = Math.floor(year / 10) * 10;
                stats.byDecade[decade] = (stats.byDecade[decade] || 0) + 1;
            }
        }
        
        // Parents (pour le nombre d'enfants)
        if (member.ID_Pere) stats.parents.add(member.ID_Pere);
        if (member.ID_Mere) stats.parents.add(member.ID_Mere);
        
        // Compter les enfants par parent
        if (member.ID_Pere) {
            stats.childrenCount[member.ID_Pere] = (stats.childrenCount[member.ID_Pere] || 0) + 1;
        }
        if (member.ID_Mere) {
            stats.childrenCount[member.ID_Mere] = (stats.childrenCount[member.ID_Mere] || 0) + 1;
        }
    });
    
    // Calculer la moyenne d'enfants
    const totalParents = stats.parents.size;
    const totalChildren = Object.values(stats.childrenCount).reduce((a, b) => a + b, 0);
    stats.averageChildren = totalParents > 0 ? totalChildren / totalParents : 0;
    
    stats.generations = stats.generations.size;
    
    // Top parents (ceux qui ont le plus d'enfants)
    stats.topParents = Object.entries(stats.childrenCount)
        .map(([id, count]) => {
            const parent = familyMembers.find(m => m.ID === id);
            return {
                id,
                name: parent ? `${parent.Prennom} ${parent.Nom}` : 'Inconnu',
                count
            };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    
    // Plus grandes générations
    stats.largestGenerations = Object.entries(stats.byGeneration)
        .map(([gen, count]) => ({ generation: gen, count }))
        .sort((a, b) => b.count - a.count);
    
    return stats;
}

function generateTopParentsTable(topParents) {
    if (topParents.length === 0) return '';
    
    let html = `
        <div class="stats-table-container">
            <h4>🏆 Parents avec le plus d'enfants</h4>
            <table class="stats-table">
                <thead>
                    <tr>
                        <th>Parent</th>
                        <th>Nombre d'enfants</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    topParents.forEach((parent, index) => {
        html += `
            <tr onclick="selectMemberById('${parent.id}')">
                <td>
                    <span class="rank">#${index + 1}</span>
                    ${parent.name}
                </td>
                <td><strong>${parent.count}</strong></td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    return html;
}

function generateLargestGenerationsTable(generations) {
    if (generations.length === 0) return '';
    
    let html = `
        <div class="stats-table-container">
            <h4>📈 Répartition par génération</h4>
            <table class="stats-table">
                <thead>
                    <tr>
                        <th>Génération</th>
                        <th>Nombre</th>
                        <th>Pourcentage</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    const total = familyMembers.length;
    generations.forEach(gen => {
        const percentage = ((gen.count / total) * 100).toFixed(1);
        html += `
            <tr>
                <td>Génération ${gen.generation}</td>
                <td>${gen.count}</td>
                <td>${percentage}%</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    return html;
}

function initCharts(stats) {
    // Vérifier si Chart.js est chargé
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js non chargé');
        return;
    }
    
    // Graphique des générations
    const genCtx = document.getElementById('genChart')?.getContext('2d');
    if (genCtx) {
        new Chart(genCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(stats.byGeneration).sort(),
                datasets: [{
                    label: 'Nombre de membres',
                    data: Object.keys(stats.byGeneration).sort().map(g => stats.byGeneration[g]),
                    backgroundColor: 'rgba(24, 188, 156, 0.7)',
                    borderColor: 'rgba(24, 188, 156, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
    
    // Graphique des naissances par décennie
    const birthCtx = document.getElementById('birthChart')?.getContext('2d');
    if (birthCtx) {
        const decades = Object.keys(stats.byDecade).sort();
        new Chart(birthCtx, {
            type: 'line',
            data: {
                labels: decades,
                datasets: [{
                    label: 'Naissances',
                    data: decades.map(d => stats.byDecade[d]),
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
}