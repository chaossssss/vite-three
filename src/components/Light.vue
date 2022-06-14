<template>
  <div id="container" class="container"></div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
function init() {

}


var scene = new THREE.Scene();
var axes = new THREE.AxesHelper(50);//添加辅助坐标系
scene.add(axes);
//================================地面（必须是感光材质）================================================//
var plane = new THREE.PlaneGeometry(150, 50);
var materialPlane = new THREE.MeshLambertMaterial({
  color: 0xcccccc
});
var planeMesh = new THREE.Mesh(plane, materialPlane);
planeMesh.rotation.x = -0.5 * Math.PI; //沿x轴翻转90°，即为展平效果
planeMesh.position.set(0, 0, 0);

planeMesh.receiveShadow = true;//物体接受阴影

scene.add(planeMesh);

//=================================物体（必须是感光材质）==================================================//
var ball = new THREE.SphereGeometry(10, 10, 10);
var materialBall = new THREE.MeshLambertMaterial({ color: 0xffff00 });
var ballMesh = new THREE.Mesh(ball, materialBall);
ballMesh.position.set(20, 10, 0);

ballMesh.castShadow = true;//物体投影

scene.add(ballMesh);

var box = new THREE.BoxGeometry(10, 10, 10);
var boxMaterial = new THREE.MeshLambertMaterial({
  color: 0xff0000
});
var boxMesh = new THREE.Mesh(box, boxMaterial);
boxMesh.position.set(-30, 5, 0);

boxMesh.castShadow = true;//物体投影

scene.add(boxMesh);
//=======================================光源===================================================//

var pointLight = new THREE.PointLight(0xffffff);//点光源
pointLight.position.set(20, 30, 20);
pointLight.castShadow = true;    // 让光源产生阴影效果
scene.add(pointLight);
scene.add(new THREE.AmbientLight(0x444444));//环境光，可以看到所有物体

//=============================相机=============================================//
var camera = new THREE.PerspectiveCamera(45, 2, 0.1, 2000);
camera.position.set(100, 150, 100);
camera.lookAt(scene.position);


/**
 * 创建渲染器对象
 */
var renderer = new THREE.WebGLRenderer({
  antialias: true //消除锯齿
});

renderer.shadowMap.enabled = true;    // 告诉渲染器需要阴影

renderer.setSize(1000, 500);
renderer.setClearColor(0xb9d3ff, 1);

renderer.render(scene, camera);
var cont = document.getElementById('webgl');
cont.appendChild(renderer.domElement);


//增加鼠标拾取效果
var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.addEventListener('change', () => {
  renderer.render(scene, camera);
});


</script>
<style lang="less" scoped>
.container {
  width: 100vw;
  height: 100vh;
}
</style>