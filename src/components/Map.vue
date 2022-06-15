<template>
  <div id="container" class="container"></div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import * as d3geo from "d3-geo";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from 'three/examples/js/libs/stats.min.js'
import NANHU from '@/utils/nanhu.json'
var scene = null
var camera = null
var renderer = null
var map = null
const textureLoader = new THREE.TextureLoader()
const stats = new Stats()
const clock = new THREE.Clock()
var time = { value: 0 }
var startTime = { value: 0 }
var startLength = { value: 2 }
onMounted(() => {
  init()
  createRadar()
  initStats()
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
  let texture = textureLoader.load(new URL("../assets/map.jpg", import.meta.url).href)
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
        const mesh = new THREE.Mesh(geometry, [faceMaterial, material, material])
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
    map.add(province)
  })
  scene.add(map)
}

function initStats() {
  document.body.appendChild(stats.dom)
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

function createRadar() {
  // 定义雷达参数  
  const radarData = {
    position: {
      x: 0,
      y: 20,
      z: 0
    },
    radius: 240,
    color: '#f005f0',
    opacity: 0.5,
    speed: 300,
    followWidth: 220,
  }

  // 创建几何体
  const circleGeometry = new THREE.CircleGeometry(radarData.radius, 1000)
  const rotateMatrix = new THREE.Matrix4().makeRotationX(-Math.PI / 180 * 90)
  circleGeometry.applyMatrix4(rotateMatrix)

  // 创建材质
  const material = new THREE.MeshPhongMaterial({
    color: radarData.color,
    opacity: radarData.opacity,
    transparent: true,
  })
  const radar = new THREE.Mesh(circleGeometry, material)
  radar.name = 'radar'
  const { x, y, z } = radarData.position
  radar.position.set(x, y, z)
  radar.updateMatrix()
  // const cityGroup = this.group.children[0]
  // cityGroup.add(radar)
  scene.add(radar)
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, {
      uSpeed: {
        value: radarData.speed,
      },
      uRadius: {
        value: radarData.radius
      },
      uTime: time,
      uFollowWidth: {
        value: radarData.followWidth
      }
    })
    const vertex = `
        varying vec3 vPosition;
        void main() {
          vPosition = position;
      `
    shader.vertexShader = shader.vertexShader.replace('void main() {', vertex)
    const fragment = `
        uniform float uRadius;     
        uniform float uTime;            
        uniform float uSpeed; 
        uniform float uFollowWidth; 
        varying vec3 vPosition;
        float calcAngle(vec3 oFrag){
          float fragAngle;
          const vec3 ox = vec3(1,0,0);
          float dianji = oFrag.x * ox.x + oFrag.z*ox.z;
          float oFrag_length = length(oFrag); // length是内置函数
          float ox_length = length(ox); // length是内置函数
          float yuxian = dianji / (oFrag_length * ox_length);
          fragAngle = acos(yuxian);
          fragAngle = degrees(fragAngle);
          if(oFrag.z > 0.0) {
            fragAngle = -fragAngle + 360.0;
          }
          float scanAngle = uTime * uSpeed - floor(uTime * uSpeed / 360.0) * 360.0;
          float angle = scanAngle - fragAngle;
          if(angle < 0.0){
            angle = angle + 360.0;
          }
          return angle;
        }
        void main() {
      `
    const fragementColor = `
        // length内置函数，取向量的长度
        if(length(vPosition) == 0.0 || length(vPosition) > uRadius-2.0){
          gl_FragColor = vec4( outgoingLight, diffuseColor.a );
        } else {
          float angle = calcAngle(vPosition);
          if(angle < uFollowWidth){
            // 尾焰区域
            float opacity =  1.0 - angle / uFollowWidth; 
            gl_FragColor = vec4( outgoingLight, diffuseColor.a * opacity );  
          } else {
            // 其他位置的像素均为透明
            gl_FragColor = vec4( outgoingLight, 0.0 ); 
          }
        }
      `
    shader.fragmentShader = shader.fragmentShader.replace('void main() {', fragment)
    shader.fragmentShader = shader.fragmentShader.replace('gl_FragColor = vec4( outgoingLight, diffuseColor.a );', fragementColor)
  }
}

function updateData() {
  const dt = clock.getDelta()
  time.value += dt
  startTime.value += dt
  if (startTime.value > startLength.value) {
    startTime.value = startLength.value
  }
}


function animate() {
  requestAnimationFrame(animate)
  stats.update()
  updateData()
  renderer.render(scene, camera)
}
</script>
<style lang="less" scoped>
.container {
  width: 100vw;
  height: 100vh;
}
</style>