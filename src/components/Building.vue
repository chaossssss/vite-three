<template>
  <div id="container" class="container"></div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from 'three/examples/js/libs/stats.min.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass'



var scene = null
var camera = null
var renderer = null
const textureLoader = new THREE.TextureLoader()
const stats = new Stats()
let composer, effectFXAA, outlinePass, renderPass;
var raycaster = new THREE.Raycaster()
var mouse = new THREE.Vector2()
const group = new THREE.Group()

var firstCube = false

onMounted(() => {
  init()
  initEffectComposer()
  document.addEventListener('click', onMouseDblclick);
  animate()
})

function init() {
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000)
  camera.position.x = 10
  camera.position.y = 83
  camera.position.z = 54
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.gammaInput = true
  renderer.gammaOutput = true
  document.getElementById("container").appendChild(renderer.domElement)
  new OrbitControls(camera, renderer.domElement);


  // 光源
  const ambientLight = new THREE.AmbientLight(0x444444)
  scene.add(ambientLight)
  const pointLight = new THREE.PointLight(0xffffff)
  pointLight.castShadow = true
  pointLight.position.set(100, 100, 100)
  scene.add(pointLight)

  // 平面
  const planeGeometry = new THREE.PlaneGeometry(150, 150)
  const planeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  const plane = new THREE.Mesh(planeGeometry, planeMaterial)
  plane.rotation.x = Math.PI / 2
  plane.receiveShadow = true

  // 网格
  const gridHelper = new THREE.GridHelper(150, 150)

  // 辅助线
  const axex = new THREE.AxesHelper(20)

  // 组
  const group1 = new THREE.Group()
  group1.add(plane)
  group1.add(axex)
  group1.add(gridHelper)
  group1.position.z = -14
  scene.add(group1)


  // 立方体
  const boxGeometry = new THREE.BoxGeometry(8, 8, 20)
  const geometryMaterial = new THREE.MeshPhongMaterial({ color: 0xffeecc })
  const geometryMaterial2 = new THREE.MeshPhongMaterial({ color: 0xffff00 })
  const cube = new THREE.Mesh(boxGeometry, geometryMaterial)
  cube.castShadow = true
  cube.receiveShadow = true
  cube.position.set(0, 4, 0)
  cube.name = 'first'
  group.add(cube)
  let boxGeometry2 = boxGeometry.clone()
  const cube2 = new THREE.Mesh(boxGeometry2, geometryMaterial2)
  cube2.position.set(0, 15, 0)
  // cube2.name = 'second'
  group.add(cube2)
  group.name = 'buildingsGroup'
  scene.add(group)
}

//获取与射线相交的对象数组
function getIntersects(event) {
  event.preventDefault(); // 阻止默认的点击事件执行, https://developer.mozilla.org/zh-CN/docs/Web/API/Event/preventDefault
  //console.log("event.clientX:" + event.clientX);
  //console.log("event.clientY:" + event.clientY);

  //声明 rayCaster 和 mouse 变量
  let rayCaster = new THREE.Raycaster();
  let mouse = new THREE.Vector2();

  //通过鼠标点击位置，计算出raycaster所需点的位置，以屏幕为中心点，范围-1到1
  mouse.x = ((event.clientX - document.body.getBoundingClientRect().left) / document.body.offsetWidth) * 2 - 1;
  mouse.y = -((event.clientY - document.body.getBoundingClientRect().top) / document.body.offsetHeight) * 2 + 1; //这里为什么是-号，没有就无法点中

  //通过鼠标点击的位置(二维坐标)和当前相机的矩阵计算出射线位置
  rayCaster.setFromCamera(mouse, camera);

  //获取与射线相交的对象数组， 其中的元素按照距离排序，越近的越靠前。
  //+true，是对其后代进行查找，这个在这里必须加，因为模型是由很多部分组成的，后代非常多。
  // console.log(group)
  let intersects = rayCaster.intersectObjects(scene.children, true);

  //返回选中的对象

  // console.log(intersects)

  return intersects;
}

//鼠标双击触发的方法
function onMouseDblclick(event) {
  //获取raycaster和所有模型相交的数组，其中的元素按照距离排序，越近的越靠前
  let intersects = getIntersects(event);
  // console.log(intersects[0].object);

  //获取选中最近的Mesh对象
  //instance坐标是对象，右边是类，判断对象是不是属于这个类的
  if (intersects.length !== 0) {
    console.log(intersects)
    for (var i = 0; i < intersects.length; i++) {
      if (intersects[i].object.name === 'first') {
        if (!firstCube) {
          intersects[i].object.material.color.set(0xcceeff);
          outlinePass.selectedObjects = [intersects[i].object];
          firstCube = true
        } else {
          intersects[i].object.material.color.set(0xffeecc);
          outlinePass.selectedObjects = [];
          firstCube = false
        }
      }
    }
  } else {
    console.log('未选中 Mesh!');
  }
}

function initEffectComposer() {
  composer = new EffectComposer(renderer);
  renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
  composer.addPass(outlinePass);
  outlinePass.edgeStrength = Number(5);//边缘长度
  outlinePass.edgeGlow = Number(1);//边缘辉光
  outlinePass.edgeThickness = Number(3.6);//边缘厚度 值越小越明显
  outlinePass.pulsePeriod = Number(2.9); //一闪一闪周期
  outlinePass.visibleEdgeColor.set(0xffff00);//没有被遮挡的outline的颜色
  outlinePass.hiddenEdgeColor.set(0xff0000);//被遮挡的outline的颜色
}

function animate() {
  requestAnimationFrame(animate)
  stats.update()
  // if (composer) {
  composer.render()
  // }
  // renderer.render(scene, camera)
}

</script>
<style lang="less" scoped>
.container {
  width: 100vw;
  height: 100vh;
}
</style>