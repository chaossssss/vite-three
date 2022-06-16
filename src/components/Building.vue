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
import TWEEN from "@tweenjs/tween.js"


var scene = null
var camera = null
var renderer = null
const textureLoader = new THREE.TextureLoader()
const stats = new Stats()
let composer, effectFXAA, outlinePass, renderPass, controls;
var raycaster = new THREE.Raycaster()
var mouse = new THREE.Vector2()
const group = new THREE.Group()
var selectedObjectsArr = []


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
  controls = new OrbitControls(camera, renderer.domElement);


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
  const geometryMaterial2 = new THREE.MeshPhongMaterial({ color: 0xffdd00 })
  const cube = new THREE.Mesh(boxGeometry, geometryMaterial)
  cube.castShadow = true
  cube.receiveShadow = true
  cube.position.set(0, 4, 0)
  cube.name = 'first'
  cube.userData.current = false
  cube.userData.defaultColor = 0xffeecc
  cube.userData.currentColor = 0xcceeff
  group.add(cube)
  let boxGeometry2 = boxGeometry.clone()
  const cube2 = new THREE.Mesh(boxGeometry2, geometryMaterial2)
  cube2.position.set(0, 15, 0)
  cube2.userData.current = false
  cube2.userData.defaultColor = 0xffdd00
  cube2.userData.currentColor = 0xccffcc
  cube2.name = 'second'
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

  console.log(intersects)

  return intersects;
}

//鼠标双击触发的方法
function onMouseDblclick(event) {
  //获取raycaster和所有模型相交的数组，其中的元素按照距离排序，越近的越靠前
  let intersects = getIntersects(event);
  // console.log(intersects[0].object);
  intersects[0].object.traverse(function (child) {
    console.log(child)
    if (child.type === 'Mesh' && (child.name === 'first' || child.name === 'second')) {
      if (!child.userData.current) {
        child.material.color.set(child.userData.currentColor);
        selectedObjectsArr.push(child)
        outlinePass.selectedObjects = selectedObjectsArr
        child.userData.current = true
        cameraMove()
      } else {
        let selectedIndex = selectedObjectsArr.findIndex(item => {
          return item.name === child.name
        })
        selectedObjectsArr.splice(selectedIndex, 1)
        child.material.color.set(child.userData.defaultColor);
        outlinePass.selectedObjects = selectedObjectsArr;
        child.userData.current = false
      }
    }
  })
}

// oldP  相机原来的位置
// oldT  target原来的位置
// newP  相机新的位置
// newT  target新的位置
// callBack  动画结束时的回调函数
function animateCamera(oldP, oldT, newP, newT, callBack) {
  var tween = new TWEEN.Tween({
    x1: oldP.x, // 相机x
    y1: oldP.y, // 相机y
    z1: oldP.z, // 相机z
    x2: oldT.x, // 控制点的中心点x
    y2: oldT.y, // 控制点的中心点y
    z2: oldT.z  // 控制点的中心点z
  });
  tween.to({
    x1: newP.x,
    y1: newP.y,
    z1: newP.z,
    x2: newT.x,
    y2: newT.y,
    z2: newT.z
  }, 1000);
  tween.onUpdate(function (object) {
    camera.position.x = object.x1;
    camera.position.y = object.y1;
    camera.position.z = object.z1;
    controls.target.x = object.x2;
    controls.target.y = object.y2;
    controls.target.z = object.z2;
    controls.update();
  })
  tween.onComplete(function () {
    controls.enabled = true;
    callBack && callBack()
  })
  tween.easing(TWEEN.Easing.Cubic.InOut);
  tween.start();
}



function cameraMove() {
  //获取当前camera位置
  let camPosition = camera.position;         //获取摄像机当前位置
  let newPosition = new THREE.Vertex(0, 50, 0);     //设置目标位置
  let curve = addLines(camPosition, newPosition).curve;    //绘制贝塞尔曲线
  scene.add(addLines(camPosition, newPosition).lineMesh)   // 显示轨迹
  //取curve的50个点
  let points = curve.getPoints(50);
  let index = 0;
  //摄像机每50毫秒移动一个点的位置
  let a = setInterval(function () {
    camera.position.set(points[index].x, points[index].y, points[index].z);
    // console.log(index);
    camera.lookAt(new THREE.Vertex(0, 0, 0))
    index++;
    if (index > 50) {
      clearInterval(a);
    }
  }, 50);
}

// 添加线条
function addLines(v0, v3) {
  // 计算向量夹角
  let angle = v0.angleTo(v3) * 180 / Math.PI / 10; // 0 ~ Math.PI
  let aLen = angle * 50,
    hLen = angle * angle * 120;
  let p0 = new THREE.Vector3(0, 0, 0);

  // 开始，结束点
  // let v0 = groupDots.children[0].position;
  // let v3 = groupDots.children[1].position;

  // 法线向量
  let rayLine = new THREE.Ray(p0, getVCenter(v0.clone(), v3.clone()));

  // 顶点坐标
  let vtop = rayLine.at(hLen / rayLine.at(1).distanceTo(p0));

  // 控制点坐标
  let v1 = getLenVcetor(v0.clone(), vtop, aLen);
  let v2 = getLenVcetor(v3.clone(), vtop, aLen);

  // 绘制贝塞尔曲线
  let curve = new THREE.CubicBezierCurve3(v0, v1, v2, v3);
  let geo = new THREE.Geometry();
  geo.vertices = curve.getPoints(50);
  let mat = new THREE.LineBasicMaterial({ color: 0xff0000 });
  // let curveMesh = new THREE.Mesh(geo, mat)
  // scene.add(curveMesh)
  return {
    curve: curve,
    lineMesh: new THREE.Line(geo, mat)
  };
}

// 计算v1,v2 的中点
function getVCenter(v1, v2) {
  let v = v1.add(v2);
  return v.divideScalar(2);
}

// 计算V1，V2向量固定长度的点
function getLenVcetor(v1, v2, len) {
  let v1v2Len = v1.distanceTo(v2);
  return v1.lerp(v2, len / v1v2Len);
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
  TWEEN.update()
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