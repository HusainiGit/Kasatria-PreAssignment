let camera, scene, renderer;
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

    createLayoutButtons();
}

// Load Google Sheet CSV
document.getElementById('load-sheet').addEventListener('click', () => {
    const sheetURL = "https://docs.google.com/spreadsheets/d/13VCqZ24v847ROei4yRJVfP9-7YH1U67OVNo2ql_3qyM/edit?usp=sharing"; 
    fetch(sheetURL)
        .then(res => res.text())
        .then(csv => {
            const rows = csv.split("\n").slice(1);
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

function populateTiles(data) {
    const tableCols = 20;
    const tableRows = 10;
    const spacing = 140;

    objects = [];
    targets = { table: [], sphere: [], helix: [], grid: [] };

    for (let i = 0; i < data.length; i++) {
        const element = document.createElement('div');
        element.className = 'element';
        element.textContent = data[i].name;
        element.style.background = getColorByNetWorth(data[i].netWorth);

        const obj = new THREE.CSS3DObject(element);
        scene.add(obj);
        objects.push(obj);

        // Table layout
        const row = Math.floor(i / tableCols);
        const col = i % tableCols;
        targets.table.push(new THREE.Vector3(
            (col - tableCols/2) * spacing,
            (tableRows/2 - row) * spacing,
            0
        ));
    }

    createSphereTargets();
    createHelixTargets();
    createGridTargets();

    transform(targets.table, 2000);
}

function getColorByNetWorth(netWorth) {
    if (netWorth < 100000) return 'red';
    if (netWorth < 200000) return 'orange';
    return 'green';
}

function createSphereTargets() {
    const l = objects.length;
    const radius = 800;
    for (let i = 0; i < l; i++) {
        const phi = Math.acos(-1 + (2 * i)/l);
        const theta = Math.sqrt(l * Math.PI) * phi;
        const obj = new THREE.Vector3();
        obj.setFromSphericalCoords(radius, phi, theta);
        targets.sphere.push(obj);
    }
}

function createHelixTargets() {
    const l = objects.length;
    const radius = 800;
    const spacing = 5;
    for (let i = 0; i < l; i++) {
        const theta = i * 0.175 + (i % 2 === 0 ? 0 : Math.PI);
        const y = -(i * spacing) + 450;
        targets.helix.push(new THREE.Vector3(radius*Math.sin(theta), y, radius*Math.cos(theta)));
    }
}

function createGridTargets() {
    const spacing = 300;
    const cols = 5, rows = 4, layers = 10;
    for (let i = 0; i < objects.length; i++) {
        const col = i % cols;
        const row = Math.floor(i/cols) % rows;
        const layer = Math.floor(i/(cols*rows));
        targets.grid.push(new THREE.Vector3(
            (col - cols/2) * spacing,
            (rows/2 - row) * spacing,
            (layer - layers/2) * spacing
        ));
    }
}

function transform(targetPositions, duration) {
    for (let i = 0; i < objects.length; i++) {
        new TWEEN.Tween(objects[i].position)
            .to({ x: targetPositions[i].x, y: targetPositions[i].y, z: targetPositions[i].z }, duration)
            .easing(TWEEN.Easing.Exponential.InOut)
            .start();
    }
}

function createLayoutButtons() {
    const layouts = ['table', 'sphere', 'helix', 'grid'];
    layouts.forEach((layout, idx) => {
        const btn = document.createElement('button');
        btn.textContent = layout.charAt(0).toUpperCase() + layout.slice(1);
        btn.style.position = 'absolute';
        btn.style.top = `${100 + idx*40}px`;
        btn.style.left = '10px';
        btn.style.zIndex = 10;
        btn.addEventListener('click', () => transform(targets[layout], 2000));
        document.body.appendChild(btn);
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    renderer.render(scene, camera);
}
