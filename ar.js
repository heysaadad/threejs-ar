import * as THREE from "three";
import { ARButton } from "https://unpkg.com/three@0.149.0/examples/jsm/webxr/ARButton.js"
import { GLTFLoader } from "https://unpkg.com/three@0.149.0/examples/jsm/loaders/GLTFLoader.js";




let hitTestSource = null;
let hitTestSourceRequested = false;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);
scene.add(camera);


const light = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(light);

let renderer = new THREE.WebGLRenderer({ antialise: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.xr.enabled = true;

let reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.15, .2, 32).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: "white" * Math.random() })
)
reticle.visible = false;
reticle.matrixAutoUpdate = false;
scene.add(reticle);


document.body.appendChild(renderer.domElement);
if (navigator.xr) {
    document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: [ 'hit-test' ] }));
}else{
    alert('WebXR not supported');
}

const controls = renderer.xr.getController(0);
controls.addEventListener('select', onSelect);

function onSelect(){
    const loader = new GLTFLoader();
    let position = new THREE.Vector3();
    loader.load('models/koala.glb', (gltf) => {
    reticle.matrix.decompose( gltf.scene.position, gltf.scene.quaternion, gltf.scene.scale );
    scene.add(gltf.scene);
    }, (error) => {
        console.log(error);
    });
}

renderer.setAnimationLoop(render);

function render(timestamp, frame) {
    if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();
        if (hitTestSourceRequested === false) {
            session.requestReferenceSpace('viewer').then(referenceSpace => {
                session.requestHitTestSource({ space: referenceSpace }).then(source =>
                    hitTestSource = source)
            })
            hitTestSourceRequested = true;
            session.addEventListener("end", () => {
                hitTestSourceRequested = false;
                hitTestSource = null;
            })
        }
        if (hitTestSource) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                reticle.visible = true;
                reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix)

            } else {
                reticle.visible = false

            }
        }
    }
    // // console.log(scene.children)
    // scene.children.forEach(object => {
    //     if (object.name === "cube") {
    //         object.rotation.y += 0.01
    //     }
    // })
    renderer.render(scene, camera)
}
