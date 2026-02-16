// ============================
// ARBRE GÉNÉALOGIQUE 3D
// ============================

let scene, camera, renderer, controls;
let treeNodes = [];
let treeConnections = [];
let is3DMode = false;
let animationId;

// Initialiser la scène 3D
function init3DTree() {
    // Créer la scène
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111122);
   
    // Ajouter un brouillard pour la profondeur
    scene.fog = new THREE.Fog(0x111122, 10, 50);
   
    // Caméra
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(15, 10, 20);
    camera.lookAt(0, 0, 0);
   
    // Rendu
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio);
   
    // Conteneur
    const container = document.getElementById('tree3d-container');
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
   
    // Lumières
    setupLights();
   
    // Sol avec effet de reflet
    setupGround();
   
    // Étoiles en arrière-plan
    setupStars();
   
    // Créer l'arbre
    create3DTree();
   
    // Contrôles Orbital
    setupControls();
   
    // Animation
    animate();
   
    // Événement resize
    window.addEventListener('resize', onWindowResize);
}

// Configuration des lumières
function setupLights() {
    // Lumière ambiante
    const ambientLight = new THREE.AmbientLight(0x404060);
    scene.add(ambientLight);
   
    // Lumière principale (soleil)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 20, 5);
    dirLight.castShadow = true;
    dirLight.receiveShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    const d = 30;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 50;
    scene.add(dirLight);
   
    // Lumières d'appoint colorées
    const light1 = new THREE.PointLight(0x18bc9c, 0.5);
    light1.position.set(-10, 5, 10);
    scene.add(light1);
   
    const light2 = new THREE.PointLight(0xf39c12, 0.5);
    light2.position.set(10, 5, -10);
    scene.add(light2);
}

// Créer le sol
function setupGround() {
    const geometry = new THREE.CircleGeometry(30, 32);
    const material = new THREE.MeshStandardMaterial({
        color: 0x1a2a3a,
        roughness: 0.4,
        metalness: 0.1,
        emissive: new THREE.Color(0x050510)
    });
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);
   
    // Grille décorative
    const gridHelper = new THREE.GridHelper(60, 20, 0x18bc9c, 0x34495e);
    gridHelper.position.y = -0.49;
    scene.add(gridHelper);
}

// Créer des étoiles
function setupStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 1000;
    const starsPositions = new Float32Array(starsCount * 3);
   
    for (let i = 0; i < starsCount * 3; i += 3) {
        starsPositions[i] = (Math.random() - 0.5) * 200;
        starsPositions[i+1] = (Math.random() - 0.5) * 200;
        starsPositions[i+2] = (Math.random() - 0.5) * 200;
    }
   
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}

// Configuration des contrôles
function setupControls() {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minDistance = 5;
    controls.maxDistance = 40;
}

// Créer l'arbre 3D
function create3DTree() {
    treeNodes = [];
    treeConnections = [];
   
    // Grouper par génération
    const membersByGeneration = {};
    familyMembers.forEach(member => {
        if (!member.Generation) return;
        const gen = parseInt(member.Generation);
        if (!membersByGeneration[gen]) membersByGeneration[gen] = [];
        membersByGeneration[gen].push(member);
    });
   
    // Calculer les positions en cercle concentriques
    const generations = Object.keys(membersByGeneration).sort((a, b) => a - b);
    const centerGen = generations[Math.floor(generations.length / 2)];
   
    generations.forEach(gen => {
        const members = membersByGeneration[gen];
        const radius = Math.abs(parseInt(gen) - parseInt(centerGen)) * 3 + 2;
        const yPos = (parseInt(gen) - parseInt(centerGen)) * 2;
       
        members.forEach((member, index) => {
            const angle = (index / members.length) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
           
            create3DNode(member, x, yPos, z, angle);
        });
    });
   
    // Créer les connexions
    create3DConnections();
}

// Créer un nœud 3D
function create3DNode(member, x, y, z, angle) {
    const isMale = member.Sexe === 'M';
    const color = isMale ? 0x3498db : 0xe83e8c;
    const isDeceased = member.estDecede || false;
   
    // Groupe pour le nœud
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.userData = { member, id: member.ID };
   
    // Sphère principale
    const geometry = new THREE.SphereGeometry(0.8, 32, 32);
    const material = new THREE.MeshStandardMaterial({
        color: color,
        emissive: isDeceased ? 0x442222 : 0x000000,
        roughness: 0.2,
        metalness: 0.3,
        emissiveIntensity: isDeceased ? 0.3 : 0
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    group.add(sphere);
   
    // Anneau autour (pour les vivants/défunts)
    const ringGeometry = new THREE.TorusGeometry(1.0, 0.05, 16, 32);
    const ringMaterial = new THREE.MeshStandardMaterial({
        color: isDeceased ? 0xaa4444 : 0x18bc9c,
        emissive: isDeceased ? 0x331111 : 0x0a4a3a,
        transparent: true,
        opacity: 0.6
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.rotation.z = angle;
    group.add(ring);
   
    // Texte avec le nom (en utilisant une texture canvas)
    const textTexture = createTextTexture(member.Prennom, member.Nom);
    const textMaterial = new THREE.SpriteMaterial({ map: textTexture, depthTest: false, depthWrite: false });
    const textSprite = new THREE.Sprite(textMaterial);
    textSprite.scale.set(2, 1, 1);
    textSprite.position.set(0, 1.5, 0);
    group.add(textSprite);
   
    // Icône de genre
    const iconGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.4, 8);
    const iconMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x333333 });
    const icon = new THREE.Mesh(iconGeo, iconMat);
    icon.position.set(0, -1.2, 0);
    icon.rotation.x = Math.PI / 2;
    group.add(icon);
   
    // Particules lumineuses autour
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
        const particleGeo = new THREE.SphereGeometry(0.05, 4, 4);
        const particleMat = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color
        });
        const particle = new THREE.Mesh(particleGeo, particleMat);
        const particleAngle = (i / particleCount) * Math.PI * 2;
        particle.position.set(
            Math.cos(particleAngle) * 1.2,
            Math.sin(particleAngle) * 1.2,
            0
        );
        group.add(particle);
    }
   
    scene.add(group);
    treeNodes.push(group);
   
    // Effet de clic
    group.userData.onClick = () => {
        selectMemberById(member.ID);
        highlightNode(group);
    };
}

// Créer une texture de texte
function createTextTexture(firstName, lastName) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
   
    // Fond transparent
    ctx.clearRect(0, 0, canvas.width, canvas.height);
   
    // Style du texte
    ctx.font = 'Bold 28px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
   
    // Dessiner le texte
    ctx.fillText(firstName, canvas.width/2, 45);
    ctx.font = '24px Arial';
    ctx.fillStyle = '#cccccc';
    ctx.fillText(lastName, canvas.width/2, 85);
   
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

// Créer les connexions entre les nœuds
function create3DConnections() {
    familyMembers.forEach(member => {
        // Connexion avec les parents
        if (member.ID_Pere || member.ID_Mere) {
            const childNode = treeNodes.find(n => n.userData.id === member.ID);
            if (!childNode) return;
           
            if (member.ID_Pere) {
                const parentNode = treeNodes.find(n => n.userData.id === member.ID_Pere);
                if (parentNode) {
                    createConnectionLine(parentNode.position, childNode.position, 0x3498db);
                }
            }
           
            if (member.ID_Mere) {
                const parentNode = treeNodes.find(n => n.userData.id === member.ID_Mere);
                if (parentNode) {
                    createConnectionLine(parentNode.position, childNode.position, 0xe83e8c);
                }
            }
        }
       
        // Connexion avec les conjoints
        if (member.ConjointID) {
            const spouseIds = member.ConjointID.split(/[, ]+/);
            spouseIds.forEach(spouseId => {
                if (!spouseId) return;
                const node1 = treeNodes.find(n => n.userData.id === member.ID);
                const node2 = treeNodes.find(n => n.userData.id === spouseId);
                if (node1 && node2 && node1.position.y === node2.position.y) {
                    createConnectionLine(node1.position, node2.position, 0xf39c12, true);
                }
            });
        }
    });
}

// Créer une ligne de connexion
function createConnectionLine(pos1, pos2, color, isDashed = false) {
    const points = [];
    points.push(new THREE.Vector3(pos1.x, pos1.y + 0.5, pos1.z));
    points.push(new THREE.Vector3(pos2.x, pos2.y + 0.5, pos2.z));
   
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
   
    let material;
    if (isDashed) {
        material = new THREE.LineDashedMaterial({
            color: color,
            dashSize: 0.2,
            gapSize: 0.1,
            linewidth: 2
        });
    } else {
        material = new THREE.LineBasicMaterial({ color: color });
    }
   
    const line = new THREE.Line(geometry, material);
    if (isDashed) line.computeLineDistances();
   
    scene.add(line);
    treeConnections.push(line);
}

// Mettre en surbrillance un nœud
function highlightNode(node) {
    treeNodes.forEach(n => {
        n.children[0].material.emissive.setHex(0x000000);
        n.children[0].material.emissiveIntensity = 0;
    });
   
    node.children[0].material.emissive.setHex(0xf39c12);
    node.children[0].material.emissiveIntensity = 0.5;
}

// Animation
function animate() {
    if (!is3DMode) return;
   
    animationId = requestAnimationFrame(animate);
   
    // Animation légère des nœuds
    treeNodes.forEach((node, index) => {
        node.rotation.y += 0.002;
    });
   
    controls.update();
    renderer.render(scene, camera);
}

// Basculer en mode 3D
function toggle3DMode() {
    is3DMode = !is3DMode;
    const container = document.getElementById('tree3d-container');
    const normalTree = document.getElementById('treeContainer');
   
    if (is3DMode) {
        // Passer en mode 3D
        if (!container) {
            const newContainer = document.createElement('div');
            newContainer.id = 'tree3d-container';
            newContainer.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 9999;
                background: #000;
            `;
            document.body.appendChild(newContainer);
        }
       
        document.getElementById('tree3d-container').style.display = 'block';
        normalTree.style.display = 'none';
       
        // Initialiser la 3D
        init3DTree();
       
        // Ajouter le bouton de retour
        addBackButton();
    } else {
        // Retour en mode normal
        const container = document.getElementById('tree3d-container');
        if (container) container.style.display = 'none';
        normalTree.style.display = 'block';
       
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
       
        removeBackButton();
    }
}

// Ajouter le bouton de retour
function addBackButton() {
    const btn = document.createElement('button');
    btn.id = 'backFrom3D';
    btn.innerHTML = '<i class="fas fa-undo"></i> Retour à l\'arbre normal';
    btn.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 10000;
        padding: 12px 24px;
        background: linear-gradient(135deg, #18bc9c, #16a085);
        color: white;
        border: none;
        border-radius: 40px;
        font-size: 1rem;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    `;
    btn.onclick = toggle3DMode;
    document.body.appendChild(btn);
}

function removeBackButton() {
    const btn = document.getElementById('backFrom3D');
    if (btn) btn.remove();
}

// Redimensionnement
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Détection des clics sur les nœuds
document.addEventListener('click', (event) => {
    if (!is3DMode) return;
   
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
   
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
   
    raycaster.setFromCamera(mouse, camera);
   
    const intersects = raycaster.intersectObjects(treeNodes.map(n => n.children[0]));
   
    if (intersects.length > 0) {
        const node = intersects[0].object.parent;
        if (node.userData.onClick) {
            node.userData.onClick();
        }
    }
});