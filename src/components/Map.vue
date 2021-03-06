<template>
  <div id="container" class="container"></div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import * as d3geo from "d3-geo";
import * as THREE from "three";
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

import Stats from 'three/examples/js/libs/stats.min.js'
import NANHU from '@/utils/nanhu.json'

var scene = null
var camera = null
var renderer = null
var map = null
const textureLoader = new THREE.TextureLoader()
const stats = new Stats()
const clock = new THREE.Clock()
var composer = null
var renderPass = null

// 辉光
var bloomComposer = null
var ENTIRE_SCENE = 0, BLOOM_SCENE = 1
var bloomLayer = new THREE.Layers()
bloomLayer.set(BLOOM_SCENE)
var finalComposer = null
const darkMaterial = new THREE.MeshBasicMaterial({ color: "black" });
const materials = {};

var scanConfig = {
  value: 1.0,
  start: 0,
  end: 0,
  during: 3,
}

const bloomParams = {
  exposure: 1,
  bloomThreshold: 0,
  bloomStrength: 1,
  bloomRadius: 0.2,
};

const bloomVertext = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

const bloomFragment = `
uniform sampler2D baseTexture;
uniform sampler2D bloomTexture;
varying vec2 vUv;
void main() {
  gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );
}
`;




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
  scanCar()
  initStats()
  initMap()
  loaderCarModel()
  animate()
})

function loaderCarModel() {
  let fbxLoader = new FBXLoader()
  fbxLoader.load('/model/1.fbx', function (object) {
    let carGroup = new THREE.Group
    object.traverse((obj) => {
      if (obj.isMesh) {
        carGroup.add(_renderFrameMesh(obj))
        let carMaterial = new THREE.MeshPhongMaterial({
          color: 0x009EFF,
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
        })
        let meshed = new THREE.Mesh(obj.geometry, carMaterial)
        meshed.layers.set(BLOOM_SCENE)
        carGroup.add(meshed)
      }
    })
    carGroup.position.set(0, 3, 0)
    carGroup.rotateX(270 * Math.PI / 180)
    scene.add(carGroup)
    // object.position.set(0, 0, 0)
    // object.scale.set(0.1, 0.1, 0.1)
    // scene.add(object)
  })
}

function _renderFrameMesh(obj) {
  const edges = new THREE.EdgesGeometry(obj.geometry)
  let color = new THREE.Color(0.1, 0.3, 1)
  let lineBasicMaterial = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    side: THREE.DoubleSide,
    linecap: 'round',
    linejoin: 'round'
  })
  let line = new THREE.LineSegments(edges, lineBasicMaterial)
  // line.layers.toggle(BLOOM_SCENE)
  return line
}

// 将材质转为黑色材质
function darkenNonBloomed(obj) {
  // if (obj.isMesh && bloomLayer.test(obj.layers) === false) {
  //   materials[obj.uuid] = obj.material;
  //   obj.material = darkMaterial;
  // }


  if (obj instanceof THREE.Scene) { // 此处忽略Scene，否则场景背景会被影响
    materials.scene = obj.background;
    obj.background = null;
    return;
  }
  if (
    obj instanceof THREE.Sprite || // 此处忽略Sprite
    (obj.isMesh && bloomLayer.test(obj.layers) === false) // 判断与辉光是否同层
  ) {
    materials[obj.uuid] = obj.material;
    obj.material = darkMaterial;
  }

}

// 还原材质
function restoreMaterial(obj) {
  // if (materials[obj.uuid]) {
  //   obj.material = materials[obj.uuid];
  //   delete materials[obj.uuid];
  // }


  if (obj instanceof THREE.Scene) {
    obj.background = materials.scene;
    delete materials.scene;
    return;
  }
  if (materials[obj.uuid]) {
    obj.material = materials[obj.uuid];
    delete materials[obj.uuid];
  }


}


function scanCar() {
  const uperVertext = `
    varying vec3 vPosition;
    void main()
    {
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1 );
    }`;

  const uperFragment = `
    varying vec3 vPosition;
      uniform float height;
      uniform vec4 uFlowColor;
      uniform vec4 uModelColor;
    void main()
    {
      //模型的基础颜色
      vec4 distColor=uModelColor;
      // 流动范围当前点z的高度加上流动线的高度
      float topY = vPosition.y +0.04;
      if (height > vPosition.y && height < topY) {
      // 颜色渐变 
        distColor = uFlowColor; 
    }
      gl_FragColor = distColor;
    }`;

  const boxGeometry = new THREE.BoxGeometry(10, 10, 10)
  let shaderMaterial = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: {
      height: scanConfig,
      uFlowColor: {
        value: new THREE.Vector4(0.0, 1.0, 1.0, 1.0)
      },
      uModelColor: {
        value: new THREE.Vector4(0.0, 0.0, 0.0, 0.0)
      }
    },
    vertexShader: uperVertext,
    fragmentShader: uperFragment,
  })
  let cube = new THREE.Mesh(boxGeometry, shaderMaterial)
  cube.geometry.computeBoundingBox()
  let boundingBox = cube.geometry.boundingBox
  scanConfig.start = boundingBox.min.y + 0.1 || 0
  scanConfig.end = boundingBox.max.y - 0.1 || 0
  scanConfig.value = scanConfig.start
  cube.position.set(5, 10, 5)
  scene.add(cube)

}

function calcHeight() {
  let length = scanConfig.end - scanConfig.start;
  // 扫描动态效果实现
  scanConfig.value += length / scanConfig.during / 60;
  if (scanConfig.value >= scanConfig.end) {
    scanConfig.value = scanConfig.start;
  }
}

function renderBloom() {
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight)
  )
  bloomPass.threshold = bloomParams.bloomThreshold;
  bloomPass.strength = bloomParams.bloomStrength;
  bloomPass.radius = bloomParams.bloomRadius;
  composer.addPass(renderPass);
  // 把通道加入到组合器
  composer.addPass(bloomPass);
  const finalPass = new ShaderPass(
    new THREE.ShaderMaterial({
      uniforms: {
        baseTexture: { value: null },
        bloomTexture: { value: composer.renderTarget2.texture },
      },
      vertexShader: bloomVertext,
      fragmentShader: bloomFragment,
      defines: {},
    }),
    'baseTexture'
  );
  finalPass.needsSwap = true;
  // 初始化实际效果合成器
  finalComposer = new EffectComposer(renderer);

  finalComposer.addPass(renderPass);
  finalComposer.addPass(finalPass);
}



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
  // renderer.gammaInput = true
  // renderer.gammaOutput = true
  composer = new EffectComposer(renderer)
  renderPass = new RenderPass(scene, camera)


  // 辉光效果
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85
  );
  bloomPass.threshold = bloomParams.bloomThreshold;
  bloomPass.strength = bloomParams.bloomStrength;
  bloomPass.radius = bloomParams.bloomRadius;
  composer.addPass(renderPass)
  // composer.renderToScreen = true
  composer.addPass(bloomPass);

  finalComposer = new EffectComposer(renderer);

  const finalPass = new ShaderPass(
    new THREE.ShaderMaterial({
      uniforms: {
        baseTexture: { value: null },
        bloomTexture: { value: composer.renderTarget2.texture },
      },
      vertexShader: bloomVertext,
      fragmentShader: bloomFragment,
      defines: {},
    }),
    'baseTexture'
  );

  finalPass.needsSwap = true;
  finalComposer.addPass(renderPass);
  finalComposer.addPass(finalPass);





  // renderBloom()

  // let fxaaShaderPass = new ShaderPass(FXAAShader)
  // const pixelRatio = renderer.getPixelRatio();
  // fxaaShaderPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight)
  // fxaaShaderPass.renderToScreen = true
  // composer.addPass(fxaaShaderPass)
  document.getElementById("container").appendChild(renderer.domElement)
  new OrbitControls(camera, renderer.domElement);


  // 光源
  const ambientLight = new THREE.AmbientLight(0x444444)
  ambientLight.layers.enable(0);
  ambientLight.layers.enable(1);
  scene.add(ambientLight)
  const pointLight = new THREE.PointLight(0xeeeeee)
  // const pointLight = new THREE.PointLight(0xffffff)
  pointLight.castShadow = true
  pointLight.position.set(100, 100, 100)
  pointLight.layers.enable(0);
  pointLight.layers.enable(1);
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
          opacity: .4,
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
  let delta = clock.getDelta()
  stats.update()
  updateData()
  calcHeight()
  renderer.autoClear = false;
  renderer.clear();
  // scene.traverse(darkenNonBloomed); // 隐藏不需要辉光的物体
  camera.layers.set(BLOOM_SCENE);
  composer.render(delta);

  renderer.clearDepth(); // 清除深度缓存
  // scene.traverse(restoreMaterial); // 还原
  camera.layers.set(0);
  renderer.render(scene, camera);
  // composer.render(delta)
  requestAnimationFrame(animate)

}
</script>
<style lang="less" scoped>
.container {
  width: 100vw;
  height: 100vh;
}
</style>