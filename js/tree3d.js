// ======================
// ARBRE GÉNÉALOGIQUE 3D
// ======================

// Variables locales
let threeScene, threeCamera, threeRenderer, threeControls;
let threeNodes = [];
let threeConnections = [];
let threeModeActive = false;
let threeAnimationId = null;

// Éléments UI
let threeContainer = null;
let threeBackButton = null;
let threeInstructions = null;

// Initialiser l'arbre 3D
function toggle3DMode() {
    // Vérifier que familyMembers existe
    if (typeof familyMembers === 'undefined' || !familyMembers.length) {
        alert("Les données familiales ne sont pas encore chargées.");
        return;
    }
    
    threeModeActive = !threeModeActive;
    const normalTree = document.getElementById('treeContainer');
    
    if (threeModeActive) {
        // Cacher l'arbre normal
        if (normalTree) normalTree.style.display = 'none';
        
        // Initialiser la 3D
        initThreeDTree();
    } else {
        // Retour à l'arbre normal
        cleanupThreeD();
        if (normalTree) normalTree.style.display = 'block';
    }
}

// Nettoyer complètement la 3D
function cleanupThreeD() {
    // Supprimer le conteneur 3D
    if (threeContainer) {
        threeContainer.remove();
        threeContainer = null;
    }
    
    // Supprimer le bouton de retour
    if (threeBackButton) {
        threeBackButton.remove();
        threeBackButton = null;
    }
    
    // Supprimer les instructions
    if (threeInstructions) {
        threeInstructions.remove();
        threeInstructions = null;
    }
    
    // Arrêter l'animation
    if (threeAnimationId) {
        cancelAnimationFrame(threeAnimationId);
        threeAnimationId = null;
    }
    
    // Nettoyer les références
    threeScene = null;
    threeCamera = null;
    threeRenderer = null;
    threeControls = null;
    threeNodes = [];
    threeConnections = [];
    
    // Retirer l'écouteur de redimensionnement
    window.removeEventListener('resize', onThreeResize);
}

// Initialiser la scène 3D
function initThreeDTree() {
    // Créer le conteneur
    threeContainer = document.createElement('div');
    threeContainer.id = 'three-container';
    threeContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        background: #1a1a2e;
    `;
    document.body.appendChild(threeContainer);
    
    // Créer la scène
    threeScene = new THREE.Scene();
    threeScene.background = new THREE.Color(0x1a1a2e);
    
    // Créer la caméra
    threeCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    threeCamera.position.set(20, 15, 30);
    
    // Créer le renderer
    threeRenderer = new THREE.WebGLRenderer({ antialias: true });
    threeRenderer.setSize(window.innerWidth, window.innerHeight);
    threeRenderer.shadowMap.enabled = true;
    threeContainer.appendChild(threeRenderer.domElement);
    
    // Ajouter les lumières
    addThreeLights();
    
    // Ajouter le sol
    addThreeGround();
    
    // Construire l'arbre
    buildThreeTree();
    
    // Ajouter les contrôles
    threeControls = new THREE.OrbitControls(threeCamera, threeRenderer.domElement);
    threeControls.enableDamping = true;
    threeControls.dampingFactor = 0.05;
    threeControls.rotateSpeed = 0.5;
    threeControls.maxPolarAngle = Math.PI / 2;
    
    // Ajouter les éléments UI
    addThreeBackButton();
    addThreeInstructions();
    
    // Démarrer l'animation
    animateThree();
    
    // Redimensionnement
    window.addEventListener('resize', onThreeResize);
}

// Ajouter les lumières
function addThreeLights() {
    // Lumière ambiante
    const ambientLight = new THREE.AmbientLight(0x404060);
    threeScene.add(ambientLight);
    
    // Lumière principale
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.receiveShadow = true;
    threeScene.add(dirLight);
    
    // Lumière d'appoint
    const fillLight = new THREE.PointLight(0x4466aa, 0.5);
    fillLight.position.set(-10, 5, 10);
    threeScene.add(fillLight);
}

// Ajouter le sol
function addThreeGround() {
    // Grille
    const gridHelper = new THREE.GridHelper(50, 20, 0x88aadd, 0x335577);
    gridHelper.position.y = -0.5;
    threeScene.add(gridHelper);
}

// Construire l'arbre 3D
function buildThreeTree() {
    threeNodes = [];
    
    // Trouver les racines (sans parents)
    const roots = familyMembers.filter(m => !m.ID_Pere && !m.ID_Mere);
    if (roots.length === 0) return;
    
    // Positionner les générations
    const membersByGen = {};
    familyMembers.forEach(m => {
        if (!m.Generation) return;
        const gen = parseInt(m.Generation);
        if (!membersByGen[gen]) membersByGen[gen] = [];
        membersByGen[gen].push(m);
    });
    
    const generations = Object.keys(membersByGen).sort((a, b) => a - b);
    
    // Disposition horizontale par génération
    generations.forEach((gen, genIndex) => {
        const members = membersByGen[gen];
        const yPos = (genIndex - generations.length/2) * 4;
        
        // Espacement horizontal
        const spacing = 3;
        const totalWidth = (members.length - 1) * spacing;
        const startX = -totalWidth / 2;
        
        members.forEach((member, index) => {
            const xPos = startX + index * spacing;
            createThreeNode(member, xPos, yPos, 0);
        });
    });
    
    // Créer les connexions
    createThreeConnections();
}

// Créer un nœud individuel
function createThreeNode(member, x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.userData = { member, id: member.ID };
    
    // Couleur selon le sexe
    const color = member.Sexe === 'M' ? 0x3498db : 0xe83e8c;
    
    // Sphère principale
    const sphereGeo = new THREE.SphereGeometry(0.8, 32, 32);
    const sphereMat = new THREE.MeshStandardMaterial({ color: color });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    sphere.position.y = 0.8;
    group.add(sphere);
    
    // Base
    const baseGeo = new THREE.CylinderGeometry(0.3, 0.5, 0.2, 8);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.1;
    base.receiveShadow = true;
    group.add(base);
    
    // Étiquette (toujours face à la caméra)
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = member.Sexe === 'M' ? '#3498db' : '#e83e8c';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, canvas.width-4, canvas.height-4);
    
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#000';
    ctx.fillText(`${member.Prennom || ''} ${member.Nom || ''}`, 10, 25);
    
    ctx.font = '12px Arial';
    ctx.fillStyle = '#666';
    const birth = member.DateNaissance ? member.DateNaissance.substring(0,4) : '?';
    ctx.fillText(`Gén. ${member.Generation || '?'} • ${birth}`, 10, 45);
    
    const texture = new THREE.CanvasTexture(canvas);
    const labelMat = new THREE.SpriteMaterial({ map: texture });
    const label = new THREE.Sprite(labelMat);
    label.scale.set(2, 0.6, 1);
    label.position.y = 1.8;
    group.add(label);
    
    threeScene.add(group);
    threeNodes.push(group);
}

// Créer les connexions
function createThreeConnections() {
    familyMembers.forEach(member => {
        if (member.ID_Pere) {
            const child = threeNodes.find(n => n.userData.id === member.ID);
            const parent = threeNodes.find(n => n.userData.id === member.ID_Pere);
            if (child && parent) {
                createThreeLine(parent.position, child.position, 0x3498db);
            }
        }
        
        if (member.ID_Mere) {
            const child = threeNodes.find(n => n.userData.id === member.ID);
            const parent = threeNodes.find(n => n.userData.id === member.ID_Mere);
            if (child && parent) {
                createThreeLine(parent.position, child.position, 0xe83e8c);
            }
        }
    });
}

// Créer une ligne
function createThreeLine(pos1, pos2, color) {
    const points = [
        new THREE.Vector3(pos1.x, pos1.y + 0.8, pos1.z),
        new THREE.Vector3(pos2.x, pos2.y + 0.8, pos2.z)
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color });
    const line = new THREE.Line(geometry, material);
    threeScene.add(line);
    threeConnections.push(line);
}

// Animation
function animateThree() {
    if (!threeModeActive) return;
    
    threeAnimationId = requestAnimationFrame(animateThree);
    
    // Faire face aux étiquettes
    threeNodes.forEach(node => {
        const label = node.children.find(c => c.isSprite);
        if (label && threeCamera) {
            label.quaternion.copy(threeCamera.quaternion);
        }
    });
    
    if (threeControls) threeControls.update();
    if (threeRenderer && threeScene && threeCamera) {
        threeRenderer.render(threeScene, threeCamera);
    }
}

// Ajouter le bouton de retour
function addThreeBackButton() {
    threeBackButton = document.createElement('button');
    threeBackButton.id = 'three-back-btn';
    threeBackButton.innerHTML = '<i class="fas fa-undo"></i> Retour à l\'arbre normal';
    threeBackButton.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 10001;
        padding: 12px 24px;
        background: #e74c3c;
        color: white;
        border: none;
        border-radius: 40px;
        font-size: 1rem;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        transition: transform 0.2s;
    `;
    threeBackButton.onmouseover = () => {
        threeBackButton.style.transform = 'translateY(-2px)';
        threeBackButton.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
    };
    threeBackButton.onmouseout = () => {
        threeBackButton.style.transform = 'translateY(0)';
        threeBackButton.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
    };
    threeBackButton.onclick = toggle3DMode;
    document.body.appendChild(threeBackButton);
}

// Ajouter des instructions
function addThreeInstructions() {
    threeInstructions = document.createElement('div');
    threeInstructions.id = 'three-instructions';
    threeInstructions.innerHTML = `
        <div style="margin-bottom:5px;">🖱️ Glisser pour tourner</div>
        <div style="margin-bottom:5px;">📌 Molette pour zoomer</div>
        <div>👆 Cliquer sur un membre pour voir ses infos</div>
    `;
    threeInstructions.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 10001;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 12px 18px;
        border-radius: 8px;
        font-size: 0.9rem;
        border-left: 4px solid #18bc9c;
        backdrop-filter: blur(5px);
    `;
    document.body.appendChild(threeInstructions);
}

// Redimensionnement
function onThreeResize() {
    if (!threeModeActive || !threeCamera || !threeRenderer) return;
    threeCamera.aspect = window.innerWidth / window.innerHeight;
    threeCamera.updateProjectionMatrix();
    threeRenderer.setSize(window.innerWidth, window.innerHeight);
}

// Détection des clics
document.addEventListener('click', (event) => {
    if (!threeModeActive || !threeScene || !threeCamera || !threeRenderer) return;
    
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    mouse.x = (event.clientX / threeRenderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / threeRenderer.domElement.clientHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, threeCamera);
    
    const intersects = raycaster.intersectObjects(threeNodes.map(n => n.children[0])); // Les sphères
    
    if (intersects.length > 0) {
        const sphere = intersects[0].object;
        const node = sphere.parent;
        if (node && node.userData && node.userData.id) {
            selectMemberById(node.userData.id);
            
            // Surligner le nœud
            threeNodes.forEach(n => {
                n.children[0].material.emissive?.setHex(0x000000);
            });
            sphere.material.emissive?.setHex(0xf39c12);
        }
    }
});