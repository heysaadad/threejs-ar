import * as THREE from "three";
import { ARButton } from "https://unpkg.com/three@0.149.0/examples/jsm/webxr/ARButton.js"
import { GLTFLoader } from "https://unpkg.com/three@0.149.0/examples/jsm/loaders/GLTFLoader.js";


const renderer = new THREE.WebGLRenderer({ antialise: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.xr.enabled = true;
    renderer.setAnimationLoop(render);
    document.body.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight.position.set(10, 15, 10);
    scene.add(directionalLight);

function onRender() {
    render();
    // init renderer
    if (navigator.xr.requestSession('immersive-ar')) {
        document.body.appendChild( ARButton.createButton( renderer, { requiredFeatures: [ 'hit-test' ] } ) );
      } else {
        alert('WebXR not supported');
      }
    //make camera
    camera.position.set(5, 5, 2.5);
    //make light
    const light = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(light);

    let reticle = new THREE.Mesh(
        new THREE.RingGeometry(0.15, .2, 32).rotateX(-Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0xffffff * Math.random() })
    )
    scene.add(reticle);

    const controls = renderer.xr.getController(0);
    controls.addEventListener('select', onSelect);

    function onSelect(){
        const loader = new GLTFLoader();
        loader.load('models/koala.glb', (gltf) => {
        scene.add(gltf.scene);
        console.log(scene.position);
        }, (error) => {
            console.log(error);
        });
    }
}

function render( timestamp, frame ) {
    let hitTestSource = null;
	let hitTestSourceRequested = false;
    if ( frame ) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();
        if ( hitTestSourceRequested === false ) {
            session.requestReferenceSpace( 'viewer' ).then( function ( referenceSpace ) {
                session.requestHitTestSource( { space: referenceSpace } ).then( function ( source ) {
                    hitTestSource = source;
                } );
            } );
            session.addEventListener( 'end', function () {
                hitTestSourceRequested = false;
                hitTestSource = null;
            } );
            hitTestSourceRequested = true;
        }
        if ( hitTestSource ) {
            const hitTestResults = frame.getHitTestResults( hitTestSource );
            if ( hitTestResults.length ) {
                const hit = hitTestResults[ 0 ];
                reticle.visible = true;
                reticle.matrix.fromArray( hit.getPose( referenceSpace ).transform.matrix );
            } else {
                reticle.visible = false;
            }
        }
    }

    renderer.render( scene, camera );

}


let activate = document.querySelector('#activate');
activate.addEventListener('click', onRender);
// document.querySelector('activate').addEventListener('click', onRender);