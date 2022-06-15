<template>
  <div id="container" class="container"></div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import * as d3geo from "d3-geo";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import NANHU from '@/utils/nanhu.json'
let scene = null
let camera = null
let renderer = null
let map = null
let textureLoader = new THREE.TextureLoader()

onMounted(() => {
  init()
  initMap()
  animate()
})

function init() {
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000)
  map = new THREE.Object3D()
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
  const boxGeometry = new THREE.BoxGeometry(8, 8, 8)
  const geometryMaterial = new THREE.MeshPhongMaterial({ color: 0xffeecc })
  const cube = new THREE.Mesh(boxGeometry, geometryMaterial)
  cube.castShadow = true
  cube.receiveShadow = true
  cube.position.set(0, 0, 30)
  scene.add(cube)
}

function initMap() {
  const projection = d3geo.geoMercator().center([120.782952, 30.747738]).scale(10000).translate([0, 0])
  let texture = textureLoader.load(new URL("../assets/map2.jpg", import.meta.url).href)
  // texture.wrapS = THREE.RepeatWrapping
  // texture.wrapT = THREE.RepeatWrapping
  // uv两个方向纹理重复数量
  // texture.repeat.set(0.002, 0.002)
  // texture.repeat.set(1, 1)
  NANHU.features.forEach(elem => {
    const province = new THREE.Object3D()
    const coordinates = elem.geometry.coordinates
    coordinates.forEach(multiPolygon => {
      multiPolygon.forEach(polygon => {
        const shape = new THREE.Shape()
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff })
        const lineGeometry = new THREE.Geometry()
        for (let i = 0; i < polygon.length; i++) {
          const [x, y] = projection(polygon[i])
          if (i === 0) {
            shape.moveTo(x, -y)
          }
          shape.lineTo(x, -y)
          lineGeometry.vertices.push(new THREE.Vector3(x, -y, 1.01))
        }
        const extrudeSettings = {
          depth: 1,
          bevelEnabled: false
        }
        const faceMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide
        })
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
        assignUVs(geometry)
        const material = new THREE.MeshBasicMaterial({ color: '#d13a34', transparent: true, opacity: 0.6 })
        const mesh = new THREE.Mesh(geometry, [faceMaterial, material])
        const line = new THREE.Line(lineGeometry, lineMaterial)
        province.add(mesh)
        province.add(line)
      })
    })
    province.properties = elem.properties
    if (elem.properties.centroid) {
      const [x, y] = projection(elem.properties.centroid)
      province.properties._centroid = [x, y]
    }
    province.rotation.x = -Math.PI / 2
    province.position.set(-15, 0, -15)
    // province.center()
    map.add(province)
  })
  scene.add(map)
}

function assignUVs(geometry) {
  geometry.computeBoundingBox();
  var max = geometry.boundingBox.max,
    min = geometry.boundingBox.min;
  var offset = new THREE.Vector2(0 - min.x, 0 - min.y);
  var range = new THREE.Vector2(max.x - min.x, max.y - min.y);
  var faces = geometry.faces;
  geometry.faceVertexUvs[0] = [];
  for (var i = 0; i < faces.length; i++) {
    var v1 = geometry.vertices[faces[i].a],
      v2 = geometry.vertices[faces[i].b],
      v3 = geometry.vertices[faces[i].c];
    geometry.faceVertexUvs[0].push([
      new THREE.Vector2((v1.x + offset.x) / range.x, (v1.y + offset.y) / range.y),
      new THREE.Vector2((v2.x + offset.x) / range.x, (v2.y + offset.y) / range.y),
      new THREE.Vector2((v3.x + offset.x) / range.x, (v3.y + offset.y) / range.y)
    ]);
  }
  geometry.uvsNeedUpdate = true;
}



function animate() {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}
</script>
<style lang="less" scoped>
.container {
  width: 100vw;
  height: 100vh;
}
</style>