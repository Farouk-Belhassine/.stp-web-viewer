const width = window.innerWidth;
const height = window.innerHeight;
var scene, renderer, controls, camera, mainObject;

var group;

var loaded = false;

var jsonData;
const meshData = new Map(); // Map to store mesh data

async function Load() {
    cleanup();
    // Initialize Three.js scene, camera, and renderer
    scene = new THREE.Scene();
    // const directionalLight = new THREE.DirectionalLight (0x888888);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // White light with intensity 1
    directionalLight.position.set(1, 1, 1); // Set the position of the light
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0x444444);
    scene.add(ambientLight);

    const backgroundLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1); // Sky color, ground color, intensity
    scene.add(backgroundLight);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x4f4dff); // background color
    document.body.appendChild(renderer.domElement);

    mainObject = new THREE.Object3D();
    await LoadGeometry(mainObject);
    scene.add(mainObject);

    // Calculate the bounding box of the loaded geometry
    const bbox = new THREE.Box3().setFromObject(mainObject);

    // Calculate the center of the bounding box
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    // Calculate the size of the bounding box
    const size = new THREE.Vector3();
    bbox.getSize(size);

    // Calculate the maximum dimension of the bounding box
    const maxDimension = Math.max(size.x, size.y, size.z);

    // Calculate the distance from the camera to the object based on the maximum dimension
    const distance = maxDimension * 2;

    // Calculate the far value based on the distance to the object
    const farValue = distance + maxDimension;

    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, farValue);
    // Set the camera position and look at the center of the bounding box
    camera.position.set(center.x, center.y, center.z + maxDimension);
    camera.lookAt(center);

    // Add OrbitControls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Enable smooth camera movement
    controls.dampingFactor = 0.05; // Set the damping factor for the controls
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.enablePan = true;

    // Render the scene
    function animate() {
        requestAnimationFrame(animate);
        controls.update(); // Update the OrbitControls
        renderer.render(scene, camera);
    }
    animate();
}

async function LoadGeometry(targetObject) {
    // init occt-import-js
    const occt = await occtimportjs();

    // download a step file
    let fileUrl = '1551ABK.stp';
    let response = await fetch(fileUrl);
    let buffer = await response.arrayBuffer();

    // read the imported step file
    let fileBuffer = new Uint8Array(buffer);
    let result = occt.ReadStepFile(fileBuffer, null);

    prepareGroup(targetObject, result);
}

function prepareGroup(targetObject, result) {
    // process the geometries of the result
    group = new THREE.Group();
    var i = 0;
    for (let resultMesh of result.meshes) {
        const { mesh, edges } = BuildMesh(resultMesh, true);

        if(!loaded){
            // Generate a unique name for each mesh
            const uniqueName = resultMesh.name + "_" + i;
            resultMesh.name = uniqueName;
            i++;
            // Store the mesh data
            meshData.set(uniqueName, resultMesh);
        }

        group.add(mesh);
        if (edges) {
            group.add(edges);
        }
    }
    targetObject.add(group);
    if(!loaded){
        jsonData = result;
        updateMeshDataDisplay();
    }
}

function BuildMesh(geometryMesh, showEdges) {
    let geometry = new THREE.BufferGeometry();

    geometry.setAttribute("position", new THREE.Float32BufferAttribute(geometryMesh.attributes.position.array, 3));
    if (geometryMesh.attributes.normal) {
        geometry.setAttribute("normal", new THREE.Float32BufferAttribute(geometryMesh.attributes.normal.array, 3));
    }
    geometry.name = geometryMesh.name;
    const index = Uint32Array.from(geometryMesh.index.array);
    geometry.setIndex(new THREE.BufferAttribute(index, 1));

    const outlineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const defaultMaterial = new THREE.MeshPhongMaterial({
        color: geometryMesh.color ? new THREE.Color(geometryMesh.color[0], geometryMesh.color[1], geometryMesh.color[2]) : 0xcccccc,
        specular: 0,
    });
    let materials = [defaultMaterial];
    const edges = showEdges ? new THREE.Group() : null;
    if (geometryMesh.brep_faces && geometryMesh.brep_faces.length > 0) {
        for (let faceColor of geometryMesh.brep_faces) {
            const color = faceColor.color ? new THREE.Color(faceColor.color[0], faceColor.color[1], faceColor.color[2]) : defaultMaterial.color;
            materials.push(new THREE.MeshPhongMaterial({ color: color, specular: 0 }));
        }
        const triangleCount = geometryMesh.index.array.length / 3;
        let triangleIndex = 0;
        let faceColorGroupIndex = 0;
        while (triangleIndex < triangleCount) {
            const firstIndex = triangleIndex;
            let lastIndex = null;
            let materialIndex = null;
            if (faceColorGroupIndex >= geometryMesh.brep_faces.length) {
                lastIndex = triangleCount;
                materialIndex = 0;
            } else if (triangleIndex < geometryMesh.brep_faces[faceColorGroupIndex].first) {
                lastIndex = geometryMesh.brep_faces[faceColorGroupIndex].first;
                materialIndex = 0;
            } else {
                lastIndex = geometryMesh.brep_faces[faceColorGroupIndex].last + 1;
                materialIndex = faceColorGroupIndex + 1;
                faceColorGroupIndex++;
            }
            geometry.addGroup(firstIndex * 3, (lastIndex - firstIndex) * 3, materialIndex);
            triangleIndex = lastIndex;

            if (edges) {
                const innerGeometry = new THREE.BufferGeometry();
                innerGeometry.setAttribute("position", geometry.attributes.position);
                if (geometryMesh.attributes.normal) {
                    innerGeometry.setAttribute("normal", geometry.attributes.normal);
                }
                innerGeometry.setIndex(new THREE.BufferAttribute(index.slice(firstIndex * 3, lastIndex * 3), 1));
                const innerEdgesGeometry = new THREE.EdgesGeometry(innerGeometry, 180);
                const edge = new THREE.LineSegments(innerEdgesGeometry, outlineMaterial);
                edges.add(edge);
            }
        }
    }

    const mesh = new THREE.Mesh(geometry, materials.length > 1 ? materials : materials[0]);
    mesh.name = geometryMesh.name;

    if (edges) {
        edges.renderOrder = mesh.renderOrder + 1;
    }

    return { mesh, geometry, edges };
}

function cleanup() {
    if (renderer && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
        renderer = null;
    }

    if (scene) {
        scene = null;
    }

    if (mainObject) {
        mainObject.traverse(function (object) {
            if (object instanceof THREE.Mesh) {
                object.geometry.dispose();
                if (object.material instanceof Array) {
                    object.material.forEach(function (material) {
                        material.dispose();
                    });
                } else {
                    object.material.dispose();
                }
            }
        });
        mainObject = null;
    }
}

Load();

function updateMeshDataDisplay() {
    const meshDataContainer = document.getElementById("meshDataContainer");
    meshDataContainer.innerHTML = "";

    group.children.forEach((child, index) => {
        if (child instanceof THREE.Mesh) {
            const { name, type, uuid } = child;
            const meshDataItem = document.createElement("div");

            const checkbox = document.createElement("input");
            checkbox.id = uuid;
            checkbox.type = "checkbox";
            checkbox.checked = true; // Set the checkbox as checked by default
            meshDataItem.appendChild(checkbox);
    
            const button = document.createElement("button");
            button.textContent = "Move Down"; // Modify the button text as needed
            meshDataItem.appendChild(button);
    
            const label = document.createElement("label");
            label.textContent = name;
            meshDataItem.appendChild(label);
    
            meshDataContainer.appendChild(meshDataItem);

            checkbox.addEventListener("change", function () {
                if (!checkbox.checked) {
                    // Make mesh invisible
                    child.visible = false;
                    // Check if there is a child after the mesh
                    if (index < group.children.length - 1) {
                        let edge = group.children[index + 1];
                        // Process the edges
                        edge.visible = false;
                    }
                } else {
                    // Make mesh visible
                    child.visible = true;
                    // Check if there is a child after the mesh
                    if (index < group.children.length - 1) {
                        var edge = group.children[index + 1];
                        // Process the edges
                        edge.visible = true;
                    }
                }
                renderer.render(scene, camera);
            });
    
            button.addEventListener("click", function () {
                // Move the mesh down
                child.position.y -= 1; // Adjust the value as needed
                // Check if there is a child after the mesh
                if (index < group.children.length - 1) {
                    var edge = group.children[index + 1];
                    // Process the edges
                    edge.position.y += -1;
                }
                renderer.render(scene, camera);
            });
        }
    });
    loaded = true;
}

