import * as THREE from "three";

import * as dat from "https://cdn.skypack.dev/dat.gui";
import Stats from "three/addons/libs/stats.module.js";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let camera, scene, renderer, stats;
let treeObj, personObj;
const treeParams = {
  seed: 256,
  segments: 6,
  levels: 5,
  vMultiplier: 2.36,
  twigScale: 0.39,
  initalBranchLength: 0.49,
  lengthFalloffFactor: 0.85,
  lengthFalloffPower: 0.99,
  clumpMax: 0.454,
  clumpMin: 0.404,
  branchFactor: 2.45,
  dropAmount: -0.1,
  growAmount: 0.235,
  sweepAmount: 0.01,
  maxRadius: 0.139,
  climbRate: 0.371,
  trunkKink: 0.093,
  treeSteps: 5,
  taperRate: 0.947,
  radiusFalloffRate: 0.73,
  twistRate: 3.02,
  trunkLength: 2,
  treePersonColor: 0x9d7362,
  leafColor: 0x550f,
  leafTexture: "Option 1",
  rotateY: 103,
};

let treePersonMaterial = new THREE.MeshStandardMaterial({
  color: 0x9d7362,
  roughness: 1.0,
  metalness: 0.0,
});

let texture = new THREE.TextureLoader().load("./assets/twig-1.png");
let twigMaterial = new THREE.MeshStandardMaterial({
  color: 0x550f,
  roughness: 1.0,
  metalness: 0.0,
  map: texture,
  alphaTest: 0.9,
});

init();
animate();

function init() {
  const container = document.createElement("div");
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    2000
  );
  camera.position.set(100, 200, 400);

  scene = new THREE.Scene();
  const bgTexture = new THREE.TextureLoader().load("./assets/bg.jpg");
  scene.background = bgTexture;
  //scene.background = new THREE.Color(0xa0a0a0);
  scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
  hemiLight.position.set(0, 200, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff);
  dirLight.position.set(0, 200, 100);
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 180;
  dirLight.shadow.camera.bottom = -100;
  dirLight.shadow.camera.left = -120;
  dirLight.shadow.camera.right = 120;
  scene.add(dirLight);

  // scene.add( new THREE.CameraHelper( dirLight.shadow.camera ) );

  //treeObj = createTree();

  // model
  const loader = new FBXLoader();
  loader.load("./assets/models/ma.fbx", function (object) {
    object.rotation.set(80, 0, 0);
    object.position.set(0, 0, 0);
    //console.log(object);
    object.children[0].material = treePersonMaterial;
    personObj = object;
    scene.add(personObj);
  });

  //   let model;
  //   const loader = new GLTFLoader();
  //   loader.load("../assets/models/char.glb", function (glb) {
  //     model = glb.scene;
  //     scene.add(model);
  //   });

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 100, 0);
  controls.minDistance = 50;
  controls.maxDistance = 550;
  controls.update();

  //GUI

  const gui = new dat.GUI();
  const treeFolder = gui.addFolder("tree");
  const branchFolder = gui.addFolder("branching");
  const trunkFolder = gui.addFolder("trunk");

  const ctrls = [
    // Tree
    treeFolder.add(treeParams, "seed").min(1).max(1000),
    // treeFolder.add(this.config, 'segments').min(6).max(20), no effect
    treeFolder.add(treeParams, "levels").min(0).max(7),
    // treeFolder.add(this.config, 'vMultiplier').min(0.01).max(10), no textures
    treeFolder.add(treeParams, "twigScale").min(0).max(1),
    treeFolder.add(treeParams, "rotateY").min(0).max(360),

    // Branching
    branchFolder.add(treeParams, "initalBranchLength").min(0.1).max(1),
    branchFolder.add(treeParams, "lengthFalloffFactor").min(0.5).max(1),
    branchFolder.add(treeParams, "lengthFalloffPower").min(0.1).max(1.5),
    branchFolder.add(treeParams, "clumpMax").min(0).max(1),
    branchFolder.add(treeParams, "clumpMin").min(0).max(1),
    branchFolder.add(treeParams, "branchFactor").min(2).max(4),
    branchFolder.add(treeParams, "dropAmount").min(-1).max(1),
    branchFolder.add(treeParams, "growAmount").min(-0.5).max(1),
    branchFolder.add(treeParams, "sweepAmount").min(-1).max(1),

    // Trunk
    trunkFolder.add(treeParams, "maxRadius").min(0.05).max(0.35),
    trunkFolder.add(treeParams, "climbRate").min(0.05).max(1.0),
    trunkFolder.add(treeParams, "trunkKink").min(0.0).max(0.5),
    trunkFolder.add(treeParams, "treeSteps").min(0).max(35).step(1),
    trunkFolder.add(treeParams, "taperRate").min(0.7).max(1.0),
    trunkFolder.add(treeParams, "radiusFalloffRate").min(0.5).max(0.8),
    trunkFolder.add(treeParams, "twistRate").min(0.0).max(10.0),
    trunkFolder.add(treeParams, "trunkLength").min(0.1).max(5.0),
  ];

  ctrls.forEach((ctrl) => {
    ctrl.onChange(() => createTree());
    ctrl.listen();
  });

  // Materials
  const matFolder = gui.addFolder("materials");
  matFolder
    .addColor(treeParams, "treePersonColor")
    .onChange((hex) => treePersonMaterial.color.setHex(hex))
    .listen();
  matFolder
    .addColor(treeParams, "leafColor")
    .onChange((hex) => twigMaterial.color.setHex(hex))
    .listen();
  matFolder
    .add(treeParams, "leafTexture", ["Option 1", "Option 2", "Option 3"])
    .onChange((val) => {
      if ((val = "Option 1"))
        twigMaterial.map = new THREE.TextureLoader().load(
          "./assets/twig-1.png"
        );
      else if ((val = "Option 2"))
        twigMaterial.map = new THREE.TextureLoader().load(
          "./assets/twig-2.png"
        );
      else if ((val = "Option 3"))
        twigMaterial.map = new THREE.TextureLoader().load(
          "./assets/twig-3.png"
        );
    })
    .listen();

  window.addEventListener("resize", onWindowResize);

  // stats
  stats = new Stats();
  container.appendChild(stats.dom);

  createTree();
  //console.log(scene);
}

function setTree(tree) {
  if (treeObj) {
    scene.remove(treeObj);
  }
  tree.position.set(0, 90, -14.5);
  tree.rotation.set(0, THREE.Math.degToRad(treeParams.rotateY), 0);
  tree.scale.set(30, 30, 30);
  treeObj = tree;
  scene.add(treeObj);
}

function createTree() {
  const tree = new Tree(treeParams);

  const treeGeometry = new THREE.BufferGeometry();
  treeGeometry.setAttribute("position", createFloatAttribute(tree.verts, 3));
  treeGeometry.setAttribute(
    "normal",
    normalizeAttribute(createFloatAttribute(tree.normals, 3))
  );
  treeGeometry.setAttribute("uv", createFloatAttribute(tree.UV, 2));
  treeGeometry.setIndex(createIntAttribute(tree.faces, 1));

  const twigGeometry = new THREE.BufferGeometry();
  twigGeometry.setAttribute(
    "position",
    createFloatAttribute(tree.vertsTwig, 3)
  );
  twigGeometry.setAttribute(
    "normal",
    normalizeAttribute(createFloatAttribute(tree.normalsTwig, 3))
  );
  twigGeometry.setAttribute("uv", createFloatAttribute(tree.uvsTwig, 2));
  twigGeometry.setIndex(createIntAttribute(tree.facesTwig, 1));

  const treeGroup = new THREE.Group();
  treeGroup.add(new THREE.Mesh(treeGeometry, treePersonMaterial));
  treeGroup.add(new THREE.Mesh(twigGeometry, twigMaterial));

  setTree(treeGroup);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

//

function animate() {
  requestAnimationFrame(animate);

  renderer.render(scene, camera);
  if (personObj) {
    personObj.rotation.z += 0.003;
  }
  if (treeObj) {
    treeObj.rotation.y += 0.003;
  }

  stats.update();
}

function createFloatAttribute(array, itemSize) {
  const typedArray = new Float32Array(Tree.flattenArray(array));
  return new THREE.BufferAttribute(typedArray, itemSize);
}

function createIntAttribute(array, itemSize) {
  const typedArray = new Uint16Array(Tree.flattenArray(array));
  return new THREE.BufferAttribute(typedArray, itemSize);
}

function normalizeAttribute(attribute) {
  var v = new THREE.Vector3();
  for (var i = 0; i < attribute.count; i++) {
    v.set(attribute.getX(i), attribute.getY(i), attribute.getZ(i));
    v.normalize();
    attribute.setXYZ(i, v.x, v.y, v.z);
  }
  return attribute;
}
