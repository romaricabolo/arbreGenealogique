// ============================
// SYSTÈME DE VALIDATION PAR QUIZ
// ============================

// Base de questions/réponses
const quizDatabase = [
    {
        question: "Quel était le surnom de Mathieu Eboto ?",
        correctAnswer: "Othios",
        wrongAnswers: ["Mbolo", "Nkoulou", "Essono"],
        hint: "C'est un nom qui commence par 'O'"
    },
    {
        question: "Natou est le surnom de qui ?",
        correctAnswer: "Andje Abollo",
        wrongAnswers: ["Marie Malingo", "Solange Engou'ou", "Thérance Bibana"],
        hint: "C'est une femme de la génération 3"
    },
    {
        question: "Quel est le nom de la source du village ?",
        correctAnswer: "otomekam",
        wrongAnswers: ["ntem", "mvila", "nyong"],
        hint: "Commence par 'o' et finit par 'm'"
    },
    {
        question: "Quel est le surnom de Essiane Regis ?",
        correctAnswer: "siboule",
        wrongAnswers: ["mboma", "ngolo", "bikoun"],
        hint: "Surnom court et percutant"
    }
];

let currentExportAction = null;

// Afficher le quiz de validation
function showValidationQuiz(action) {
    currentExportAction = action;
    
    // Sélectionner 2 questions aléatoires
    const shuffled = [...quizDatabase].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, 2);
    
    let html = `
        <div class="quiz-container">
    
            <div class="quiz-header">
                <i class="fas fa-shield-alt quiz-icon"></i>
                <h2>🔒 Vérification familiale</h2>
                <p>Pour confirmer que vous êtes un membre de la famille, répondez à ces questions :</p>
            </div>
            
            <div class="quiz-progress">
                <div class="quiz-progress-bar" id="quizProgress" style="width: 0%"></div>
            </div>
    `;
    
    // Générer les questions
    selectedQuestions.forEach((q, index) => {
        const allAnswers = shuffleArray([q.correctAnswer, ...q.wrongAnswers]);
        
        html += `
             <button class="mobile-close-btn" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
            </button>
            <div class="quiz-question" id="question-${index}" data-correct="${q.correctAnswer}">
                <h3>Question ${index + 1} : ${q.question}</h3>
                <div class="quiz-answers">
                    ${allAnswers.map(answer => `
                        <label class="quiz-answer">
                            <input type="radio" name="q${index}" value="${answer}">
                            <span class="answer-text">${answer}</span>
                        </label>
                    `).join('')}
                </div>
                <div class="quiz-hint" onclick="showHint('${q.hint}')">
                    <i class="fas fa-lightbulb"></i> Besoin d'un indice ?
                </div>
            </div>
        `;
    });
    
    html += `
            <div class="quiz-actions">
                <button onclick="submitQuizAnswers()" class="btn btn-primary">
                    <i class="fas fa-check-circle"></i> Valider
                </button>
                <button onclick="cancelExport()" class="btn btn-outline">
                    <i class="fas fa-times"></i> Annuler
                </button>
            </div>
            
            <div class="quiz-error" id="quizError" style="display: none;"></div>
        </div>
    `;
    
    showCustomModal("🔒 Vérification requise", html);
}

// Mélanger un tableau
function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}

// Afficher un indice
function showHint(hint) {
    alert(`💡 Indice : ${hint}`);
}

// Soumettre les réponses
function submitQuizAnswers() {
    const questions = document.querySelectorAll('.quiz-question');
    let correctCount = 0;
    
    questions.forEach((q, index) => {
        const selected = q.querySelector('input[type="radio"]:checked');
        if (selected) {
            const correctAnswer = q.dataset.correct;
            if (selected.value === correctAnswer) {
                correctCount++;
                q.style.backgroundColor = 'rgba(46, 204, 113, 0.1)';
                q.style.borderColor = '#2ecc71';
            } else {
                q.style.backgroundColor = 'rgba(231, 76, 60, 0.1)';
                q.style.borderColor = '#e74c3c';
            }
        } else {
            q.style.backgroundColor = 'rgba(241, 196, 15, 0.1)';
            q.style.borderColor = '#f39c12';
        }
    });
    
    // Mettre à jour la barre de progression
    const progress = (correctCount / questions.length) * 100;
    const progressBar = document.getElementById('quizProgress');
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
    
    // Vérifier si toutes les réponses sont correctes
    if (correctCount === questions.length) {
        // Succès - exécuter l'action
        showNotification("✅ Vérification réussie !", "success");
        
        // Exécuter l'action
        //executeExportAction();
        showPrintableMenu();
        
        // Fermer la modal après 1 seconde
        setTimeout(() => {
            const modal = document.querySelector('.modal-overlay.active');
            if (modal) modal.remove();
        }, 1000);
    } else {
        // Échec
        document.getElementById('quizError').style.display = 'block';
        document.getElementById('quizError').innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            ${correctCount} bonne(s) réponse(s) sur ${questions.length}. Veuillez réessayer.
        `;
    }
}

// Exécuter l'action d'export
function executeExportAction() {
    if (!currentExportAction) return;
    
    switch(currentExportAction) {
        case 'png':
            if (typeof exportAsPNG === 'function') exportAsPNG();
            break;
        case 'pdf':
            if (typeof exportAsPDF === 'function') exportAsPDF();
            break;
        case 'csv':
            if (typeof exportAsCSV === 'function') exportAsCSV();
            break;
        case 'printable':
            if (typeof generatePrintableTree === 'function') generatePrintableTree();
            break;
        default:
            console.log('Action non reconnue:', currentExportAction);
    }
    
    currentExportAction = null;
}

// Annuler l'export
function cancelExport() {
    currentExportAction = null;
    const modal = document.querySelector('.modal-overlay.active');
    if (modal) modal.remove();
    showNotification("Action annulée", "error");
}

// ============================
// FONCTIONS PROTÉGÉES PAR LE QUIZ
// ============================

// Export PNG avec validation
function exportPNGWithValidation() {
    showValidationQuiz('png');
}

// Export PDF avec validation
function exportPDFWithValidation() {
    showValidationQuiz('pdf');
}

// Export CSV avec validation
function exportCSVWithValidation() {
    showValidationQuiz('csv');
}

// Générer arbre imprimable avec validation
function generatePrintableWithValidation() {
    showValidationQuiz('printable');
}

// ============================
// MODIFICATION DU MENU EXPORT
// ============================

function showExportMenu() {
    const html = `
        <div class="export-menu">
             <button class="mobile-close-btn" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
            </button>
            <h3><i class="fas fa-download"></i> Exporter l'arbre généalogique</h3>
            <p class="export-warning">
                <i class="fas fa-shield-alt"></i>
                Une vérification sera demandée pour confirmer que vous êtes un membre de la famille.
            </p>
            
            <button onclick="exportPNGWithValidation()" class="export-btn export-png">
                <i class="fas fa-image"></i>
                Image PNG
                <small>Capture d'écran de l'arbre visible</small>
            </button>
            
            <button onclick="exportPDFWithValidation()" class="export-btn export-pdf">
                <i class="fas fa-file-pdf"></i>
                Document PDF
                <small>Format imprimable</small>
            </button>
            
            <button onclick="exportCSVWithValidation()" class="export-btn export-csv">
                <i class="fas fa-file-csv"></i>
                Fichier CSV
                <small>Tous les membres (tableau)</small>
            </button>
            
            <div class="export-divider"></div>
            
            <button onclick="generatePrintableWithValidation()" class="export-btn export-print">
                <i class="fas fa-print"></i>
                Générer arbre imprimable
                <small>Fichier HTML à imprimer</small>
            </button>
        </div>
    `;
    
    showCustomModal('📥 Exporter / Imprimer', html);
}
