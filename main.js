let camera, scene, renderer;
let controls;
let objects = [];
let targets = { table: [], sphere: [], helix: [], grid: [] };

init();
animate();

function init() {
    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 3000;

    scene = new THREE.Scene();

    renderer = new THREE.CSS3DRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize);

    // Buttons to switch layout
    createLayoutButtons();
}

// Load Google Sheet
document.getElementById('load-sheet').addEventListener('click', () => {
    const sheetURL = "https://docs.google.com/spreadsheets/d/13VCqZ24v847ROei4yRJVfP9-7YH1U67OVNo2ql_3qyM/edit?usp=sharing";
    fetch(sheetURL)
        .then(res => res.text())
        .then(csv => {
            const rows = csv.split("\n").slice(1); // skip header
            const data = rows.map(row => {
                const cols = row.split(",");
                return {
                    name: cols[0],
                    netWorth: parseFloat(cols[1].replace(/\$/g,'')) || 0
                };
            });
            populateTiles(data);
        });
});

// Populate tiles
function populateTiles(data) {
    const tableCols = 20;
    const tableRows = 10;
    const spacing = 140;

    for (let i = 0; i < data.length; i++) {
        const element = document.createElement('div');
        element.className = 'element';
        element.textContent = data[i].name;
        element.style.width = '120px';
        element.style.height = '160px';
        element.style.lineHeight = '160px';
        element.style.textAlign = 'center';
        element.style.fontSize = '16px';
        element.style.color = '#fff';
        element.style.borderRadius = '10px';
        element.style.background = getColorByNetWorth(data[i].netWorth);

        const obj = new THREE.CSS3DObject(element);
        scene.add(obj);
        objects.push(obj);

        // Table layout
        const row = Math.floor(i / tableCols);
        const col = i % tableCols;
        const tablePos = new THREE.Vector3(
            (col - tableCols / 2) * spacing,
            (tableRows / 2 - row) * spacing,
            0
        );
        targets.table.push(tablePos);
    }

    createSphereTargets();
    createHelixTargets();
    createGridTargets();

    transform(targets.table, 2000); // default layout
}

// Helper: color based on Net Worth
function getColorByNetWorth(netWorth) {
    if (netWorth < 100000) return 'red';
    if (netWorth < 200000) return 'orange';
    return 'green';
}

// Sphere layout
function createSphereTargets() {
    const vector = new THREE.Vector3();
    const spherical = new THREE.Spherical();
    const radius = 800;
    const l = objects.length;
    for (let i = 0; i < l; i++) {
        const phi = Math.acos(-1 + (2 * i) / l);
        const theta = Math.sqrt(l * Math.PI) * phi;

        const obj = new THREE.Vector3();
        spherical.set(radius, phi, theta);
        obj.setFromSpherical(spherical);
        targets.sphere.push(obj);
    }
}

// Double Helix layout
function createHelixTargets() {
    const vector = new THREE.Vector3();
    const helixSpacing = 5;
    const radius = 800;
    const l = objects.length;
    for (let i = 0; i < l; i++) {
        const theta = i * 0.175 + (i % 2 === 0 ? 0 : Math.PI); // double helix
        const y = -(i * helixSpacing) + 450;
        const obj = new THREE.Vector3(radius * Math.sin(theta), y, radius * Math.cos(theta));
        targets.helix.push(obj);
    }
}

// Grid layout 5x4x10
function createGridTargets() {
    const spacing = 300;
    const cols = 5, rows = 4, layers = 10;
    for (let i = 0; i < objects.length; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols) % rows;
        const layer = Math.floor(i / (cols * rows));
        const obj = new THREE.Vector3(
            (col - cols / 2) * spacing,
            (rows / 2 - row) * spacing,
            (layer - layers / 2) * spacing
        );
        targets.grid.push(obj);
    }
}

// Animate transform
function transform(targetPositions, duration) {
    for (let i = 0; i < objects.length; i++) {
        new TWEEN.Tween(objects[i].position)
            .to({
                x: targetPositions[i].x,
                y: targetPositions[i].y,
                z: targetPositions[i].z
            }, duration)
            .easing(TWEEN.Easing.Exponential.InOut)
            .start();
    }
}

// Layout buttons
function createLayoutButtons() {
    const layouts = ['table', 'sphere', 'helix', 'grid'];
    layouts.forEach((layout, idx) => {
        const btn = document.createElement('button');
        btn.textContent = layout.charAt(0).toUpperCase() + layout.slice(1);
        btn.style.position = 'absolute';
        btn.style.top = `${100 + idx * 40}px`;
        btn.style.left = '10px';
        btn.style.zIndex = 10;
        btn.addEventListener('click', () => {
            transform(targets[layout], 2000);
        });
        document.body.appendChild(btn);
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    renderer.render(scene, camera);
}
