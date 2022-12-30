<template>
  <div id="container" class="container"></div>
</template>
<script setup>
import { onMounted } from "vue";
import * as THREE from "three";
import * as CANNON from "cannon-es";
var renderer = null,
  camera = null,
  scene = null,
  sphere = null,
  world = null,
  sphereShape = null,
  sphereBody = null;
function init() {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    antialias: false,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("container").appendChild(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    1,
    200000
  );
  camera.position.set(0, 80, 80);
  camera.lookAt(0, 0, 0);

  const pointLight = new THREE.PointLight(0xffffff);
  pointLight.position.set(8, 80, 8);
  scene.add(pointLight);
  // 平面网格
  let groundGeometry = new THREE.PlaneGeometry(40, 40, 32);
  let groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x7f7f7f,
    side: THREE.DoubleSide,
  });
  let ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // 球网格
  let sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
  let sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
  sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  scene.add(sphere);
}

function setWorld() {
  world = new CANNON.World();
  world.gravity.set(0, -10, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  sphereShape = new CANNON.Sphere(1);
  sphereBody = new CANNON.Body({
    mass: 5,
    position: new CANNON.Vec3(0, 10, 0),
  });
  world.addBody(sphereBody);

  const floorShape = new CANNON.Plane();
  const floorBody = new CANNON.Body();
  floorBody.mass = 0;
  floorBody.addShape(floorShape);
  floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  world.addBody(floorBody);
}

function update() {
  requestAnimationFrame(update);
  world.step(1 / 60);

  // if (sphere) {
  sphere.position.copy(sphereBody.position);
  sphere.quaternion.copy(sphereBody.quaternion);
  // }
  renderer.render(scene, camera);
}

onMounted(() => {
  init();
  setWorld();
  update();
});
</script>
<style lang="less" scoped>
.container {
  width: 100vw;
  height: 100vh;
}
</style>
