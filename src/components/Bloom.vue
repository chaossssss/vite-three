<template>
  <div id="container" class="container"></div>
</template>
<script setup>
import { onMounted } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
let scene, camera, renderer, composer, bloomPass;
const params = {
  exposure: 0,
  bloomStrength: 1.5,
  bloomThreshold: 0,
  bloomRadius: 0
}
onMounted(() => {
  init();
  initComposer();
  main();
  render();
})
function init() {
  // 场景
  scene = new THREE.Scene();
  // 相机
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    1,
    100000
  );
  camera.position.set(50, 50, 50);
  camera.position.y = 50;
  // 渲染器
  renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  // 环境光
  const light = new THREE.AmbientLight(0xffffff, 0.6);
  light.layers.enable(0);
  light.layers.enable(1);
  scene.add(light);
  // 控制器
  const controls = new OrbitControls(camera, renderer.domElement);
  scene.add(new THREE.AxesHelper(100));
  window.onresize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };
  document.getElementById("container").appendChild(renderer.domElement)
  new OrbitControls(camera, renderer.domElement);
}

function initComposer() {
  composer = new EffectComposer(renderer);

  const renderScene = new RenderPass(scene, camera);
  // 光晕
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85
  );
  bloomPass.threshold = params.bloomThreshold;
  bloomPass.strength = params.bloomStrength;
  bloomPass.radius = params.bloomRadius;
  composer.addPass(renderScene);
  composer.addPass(bloomPass);
}

function main() {
  const geometry = new THREE.BoxGeometry(20, 20, 10);
  // 正常方块
  const normalMtl = new THREE.MeshLambertMaterial({ color: 0x00ffff });
  const normalBox = new THREE.Mesh(geometry, normalMtl);
  normalBox.position.z = -5;
  normalBox.layers.set(0);
  scene.add(normalBox);

  // 发光方块
  const bloomMtl = new THREE.MeshLambertMaterial({ color: 0xff5500 });
  const bloomBox = new THREE.Mesh(geometry, bloomMtl);
  bloomBox.position.z = 5;
  bloomBox.layers.set(1);
  scene.add(bloomBox);
}

function render() {
  renderer.autoClear = false;
  renderer.clear();

  camera.layers.set(1);
  composer.render();

  renderer.clearDepth(); // 清除深度缓存

  camera.layers.set(0);
  renderer.render(scene, camera);

  requestAnimationFrame(render);
}

</script>
<style lang="less" scoped>
.container {
  width: 100vw;
  height: 100vh;
}
</style>