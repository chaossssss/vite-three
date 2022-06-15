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

var ratio = {
  value: 0
}

// 雷达扫描的相关配置数据
const radarData = [{
  position: {
    x: -30,
    y: 3,
    z: 0
  },
  radius: 3,
  color: '#ff0062',
  opacity: 0.5,
  angle: Math.PI * 2,
  speed: 2
}, {
  position: {
    x: 100,
    y: 0,
    z: 10
  },
  radius: 50,
  color: '#f000f2',
  opacity: 0.5,
  angle: Math.PI,
  speed: 2
}];





onMounted(() => {
  init()
  // 创建雷达扫描
  radarData.forEach(item => {
    initRadar(item);
  });
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



function updateData() {
  const dt = clock.getDelta()
  ratio.value += dt

}

function initRadar(options) {
  const vertexShader = `
    precision mediump float;
    precision highp int;

    varying vec2 vPosition;

    void main () {
      vPosition = vec2(position.x, position.y);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
  const fragmentShader = `
    precision mediump float;
    precision highp int;

    uniform float uTime;
    uniform float u_radius;
    uniform float u_speed;
    uniform float u_opacity;
    uniform float u_width;
    uniform vec3 u_color;

    varying vec2 vPosition;
    #define PI 3.14159265359

    void main () {
        // 计算当前扫描旋转的弧度值总数
        float currentRadius = u_speed * uTime;

        // 计算当前像素点与原点连线和x轴构成的夹角的弧度值
        // atan 接受两个参数（y,x）时 等同于 atan2,返回的是atan(y/x)；
        // 但比后者更稳定，返回值区间[-PI, PI]
        float angle = atan(vPosition.y, vPosition.x) + PI;

        // 计算当前像素低旋转后的弧度值，值固定在[0, PI * 2]之间
        float angleT = mod(currentRadius + angle, PI * 2.0);

        // 计算当前位置距离中心点距离
        float dist = distance(vec2(0.0, 0.0), vPosition);
        
        float tempOpacity = 0.0;

        // 设置雷达外层圆环的宽度
        float circleWidth = 0.5;
        // 如果当前点在外层圆环上， 设置一个透明度
        if (dist < u_radius && dist > u_radius - circleWidth) {
            // 做一个虚化渐变效果
            float pct = smoothstep(u_radius - circleWidth, u_radius, dist);
            tempOpacity = sin(pct * PI);
        }

        // 设置雷达扫描圈的效果 (-5.0是给外层圆环和内层圆之间设置一点空白间距)
        if (dist < (u_radius - 0.5)) {
            tempOpacity = 1.0 - angleT / u_width;
        }



        gl_FragColor = vec4(u_color, u_opacity * tempOpacity);
    }
  `;

  const {
    position,
    radius,
    color,
    opacity,
    speed,
    angle,
  } = options;

  const size = radius * 2;

  let plane = new THREE.PlaneGeometry(size, size);
  let material_1 = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: ratio,
      u_radius: {
        value: radius
      },
      u_speed: {
        value: speed
      },
      u_opacity: {
        value: opacity
      },
      u_width: {
        value: angle
      },
      u_color: {
        value: new THREE.Color(color)
      },

    },
    vertexShader,
    fragmentShader
  })
  let planeMesh = new THREE.Mesh(plane, material_1);
  scene.add(planeMesh);

  planeMesh.rotation.x = -0.5 * Math.PI
  planeMesh.position.copy(position);
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