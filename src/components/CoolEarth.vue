<template>
  <div ref="container" id="container" class="container"></div>
</template>
<script setup>
import * as THREE from "three";
import axios from "axios";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Line2 } from "three/examples/jsm/lines/Line2";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import {
  CSS2DObject,
  CSS2DRenderer,
} from "three/examples/jsm/renderers/CSS2DRenderer";
import vertexShader from "@/shader/vertexShader";
import fragmentShader from "@/shader/fragmentShader";
import { onMounted, ref } from "vue";
let renderer,
  camera,
  scene,
  light,
  controls,
  radius = 5,
  htmlRenderer,
  containerDom;
var singleUniforms;
const container = ref();
var uniforms2 = {
  u_time: {
    value: 0,
  },
};
let globeTextureLoader = new THREE.TextureLoader(),
  group = new THREE.Group(),
  fontGroup = new THREE.Group(),
  groupHalo = new THREE.Group(),
  groupDots = new THREE.Group(),
  groupLines = new THREE.Group(),
  labelGroup = new THREE.Group(),
  aGroup = new THREE.Group(),
  map = new THREE.Group(),
  planeGeometry = new THREE.PlaneBufferGeometry(14, 14, 40, 40);
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let WaveMeshArr = [];
let lnglat = [
  {
    name: "北京市",
    lng: 116.411161,
    lat: 39.908177,
    code: 110000,
  },
  {
    name: "上海市",
    lng: 121.473667,
    lat: 31.230525,
    code: 310000,
  },
];
var Dom = null;
var width = 0,
  height = 0;
const posArr = [
  { x: 0.5738958419746141, y: -0.44114968930852216, z: 4.9473255920938985 },
  { x: -0.9326350073394328, y: 2.8399222968004114, z: -4.00812091773949 },
  { x: 3.469198597393574, y: 1.2295167303380952, z: -3.3842206934036057 },
  { x: -2.4019084876611916, y: -2.190220428765315, z: 3.7991801866087123 },
  { x: -2.49363689878109, y: -4.099696049856375, z: 1.4050862307450966 },
  { x: -2.3729307780326305, y: 2.840227787960863, z: 3.3618901878497454 },
  { x: -2.0636200279017873, y: 0.7444294629976027, z: -4.493027615657812 },
  { x: 0.47725894517680106, y: 2.4327372143508037, z: -4.34212085796347 },
  { x: -2.4777001955161246, y: -1.2092952460724242, z: 4.171163716394502 },
  { x: -0.03915748918627658, y: -0.008362945319338826, z: 4.999839672648135 },
  { x: 1.5223738738260317, y: -1.032865814102439, z: -4.649254348640267 },
  { x: -0.26640112020426315, y: -4.314854187280748, z: 2.5121830716848077 },
  { x: -4.031470206741836, y: -2.606648761952297, z: -1.3973654511134501 },
  { x: 0.8544382232162094, y: 1.5274953155132989, z: 4.683662390031124 },
  { x: 3.0409624989238546, y: 1.76433738825175, z: -3.555230043268055 },
  { x: -4.721251023266457, y: 1.2354922989397954, z: -1.0878177947459262 },
  { x: 2.1518961827021106, y: 3.891904027152385, z: -2.285262755638206 },
  { x: 0.8501960736517479, y: -2.851729208821255, z: -4.018060123480341 },
  { x: 2.5631840141785176, y: 4.263234820997851, z: -0.5048926326370041 },
  { x: -0.4580143454812531, y: -2.6523265200067385, z: 4.213714144386437 },
];
var T = new THREE.Clock();
/**
 * @description 初始化渲染场景
 */
function initRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  containerDom = document.querySelector("#container");
  containerDom.appendChild(renderer.domElement);
}
/**
 * @description 初始化相机
 */
function initCamera() {
  camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
  camera.position.set(0.5, -2, 20);
  camera.lookAt(0, 3, 0);
  window.camera = camera;
}
/**
 * @description 初始化场景
 */
function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020924);
  scene.fog = new THREE.Fog(0x020924, 200, 1000);
  window.scene = scene;
}
/**
 * 初始化用户交互
 **/
function initControls() {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enableZoom = true;
  controls.autoRotate = false;
  controls.autoRotateSpeed = 2;
  controls.enablePan = true;
}
/**
 * @description 初始化光
 */
function initLight() {
  const ambientLight = new THREE.AmbientLight(0xcccccc, 1.1);
  scene.add(ambientLight);
  var directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
  directionalLight.position.set(1, 0.1, 0).normalize();
  var directionalLight2 = new THREE.DirectionalLight(0xff2ffff, 0.2);
  directionalLight2.position.set(1, 0.1, 0.1).normalize();
  scene.add(directionalLight);
  scene.add(directionalLight2);
  var hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.2);
  hemiLight.position.set(0, 1, 0);
  scene.add(hemiLight);
  var directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(1, 500, -20);
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.top = 18;
  directionalLight.shadow.camera.bottom = -10;
  directionalLight.shadow.camera.left = -52;
  directionalLight.shadow.camera.right = 12;
  scene.add(directionalLight);
}
/**
 * 窗口变动
 **/
function onWindowResize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  htmlRenderer.setSize(innerWidth, innerHeight);
  renders();
}

/**
 * @description 渲染
 */
function renders() {
  renderer.clear();
  circleAnimate();
  renderer.render(scene, camera);
  htmlRenderer.render(scene, camera);
}

/**
 * 更新
 **/
function animate() {
  var deltaTime = T.getDelta();
  window.requestAnimationFrame(() => {
    if (controls) controls.update();

    uniforms2.u_time.value += 0.07;

    renders();
    animate();
  });
}

/**
 * @description: 添加星空
 */
function addStar() {
  const positions = [];
  const colors = [];
  const geometry = new THREE.BufferGeometry();
  for (var i = 0; i < 10000; i++) {
    var vertex = new THREE.Vector3();
    vertex.x = Math.random() * 2 - 1;
    vertex.y = Math.random() * 2 - 1;
    vertex.z = Math.random() * 2 - 1;
    positions.push(vertex.x, vertex.y, vertex.z);
    var color = new THREE.Color();
    color.setHSL(Math.random() * 0.2 + 0.5, 0.55, Math.random() * 0.25 + 0.55);
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

  let textureLoader = new THREE.TextureLoader();
  let texture = textureLoader.load("/coolearth/star.png");
  var starsMaterial = new THREE.ParticleBasicMaterial({
    map: texture,
    size: 1,
    transparent: true,
    opacity: 1,
    vertexColors: true, //true：且该几何体的colors属性有值，则该粒子会舍弃第一个属性--color，而应用该几何体的colors属性的颜色
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  let stars = new THREE.ParticleSystem(geometry, starsMaterial);
  stars.scale.set(300, 300, 300);
  scene.add(stars);
}

/**
 * @description: 初始化地球
 */
function initEarth() {
  globeTextureLoader.load("/coolearth/earth2.jpg", function (texture) {
    var globeGgeometry = new THREE.SphereGeometry(radius, 100, 100);
    var globeMaterial = new THREE.MeshStandardMaterial({ map: texture });
    var globeMesh = new THREE.Mesh(globeGgeometry, globeMaterial);
    group.rotation.set(0.5, 2.9, 0.1);
    group.add(globeMesh);
    scene.add(group);
  });
}

/**
 * @description: 初始化光圈
 */
function initAperture() {
  var texture = globeTextureLoader.load("/coolearth/earth_apert1.png");
  var spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
  });
  var sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(radius * 2.54, radius * 2.54, 1);
  group.add(sprite);
}

/**
 * @description: 初始化卫星
 */
function initSatellite() {
  globeTextureLoader.load("/coolearth/halo.png", function (texture) {
    var geometry = new THREE.PlaneGeometry(14, 14);
    var material = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    var mesh = new THREE.Mesh(geometry, material);
    groupHalo.add(mesh);
  });
  globeTextureLoader.load("/coolearth/smallEarth.png", function (texture) {
    var p1 = new THREE.Vector3(-7, 0, 0);
    var p2 = new THREE.Vector3(7, 0, 0);
    const points = [p1, p2];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    var material = new THREE.PointsMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      size: 1,
      depthWrite: false,
    });
    var earthPoints = new THREE.Points(geometry, material);
    groupHalo.add(earthPoints);
  });
  groupHalo.rotation.set(1.9, 0.5, 1);
  scene.add(groupHalo);
}

/**
 * @description: 经纬度坐标转成3D空间坐标
 * @param {*} lng 经度
 * @param {*} lat 维度
 * @param {*} radius 地球半径
 * @return {*} { x, y, z } 空间坐标
 */
function lglt2xyz(lng, lat, radius) {
  const theta = (90 + lng) * (Math.PI / 180);
  const phi = (90 - lat) * (Math.PI / 180);
  return new THREE.Vector3().setFromSpherical(
    new THREE.Spherical(radius, phi, theta)
  );
}

/**
 * @description: 创建点
 * @param {*} pos
 * @param {*} texture
 * @return {*}
 */
function createPointMesh(pos, texture) {
  var material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true, //使用背景透明的png贴图，注意开启透明计算
    // side: THREE.DoubleSide, //双面可见
    depthWrite: false, //禁止写入深度缓冲区数据
  });
  var mesh = new THREE.Mesh(planeGeometry, material);
  var size = radius * 0.007; //矩形平面Mesh的尺寸
  mesh.scale.set(size, size, size); //设置mesh大小
  //设置mesh位置
  mesh.position.set(pos.x, pos.y, pos.z);
  // mesh在球面上的法线方向(球心和球面坐标构成的方向向量)
  var coordVec3 = new THREE.Vector3(pos.x, pos.y, pos.z).normalize();
  // mesh默认在XOY平面上，法线方向沿着z轴new THREE.Vector3(0, 0, 1)
  var meshNormal = new THREE.Vector3(0, 0, 1);
  // 四元数属性.quaternion表示mesh的角度状态
  //.setFromUnitVectors();计算两个向量之间构成的四元数值
  mesh.quaternion.setFromUnitVectors(meshNormal, coordVec3);
  return mesh;
}

/**
 * @description: 光圈
 */
function initCircleMarker() {
  let texture = globeTextureLoader.load("/coolearth/circle.png");
  let pointArr = lnglat.map((item) => {
    return lglt2xyz(item.lng, item.lat, radius);
  });
  WaveMeshArr = pointArr.map((item) => {
    return createPointMesh(item, texture);
  });
  WaveMeshArr.forEach((item) => {
    item._s = 0;
    item.size = 0.02;
    group.add(item);
  });
  // scene.add(group)
}

/**
 * @description: 光圈扩散
 */
function circleAnimate() {
  if (WaveMeshArr.length) {
    WaveMeshArr.forEach(function (mesh) {
      mesh._s += 0.007;
      mesh.scale.set(
        mesh.size * mesh._s,
        mesh.size * mesh._s,
        mesh.size * mesh._s
      );
      if (mesh._s <= 1.5) {
        //mesh._s=1，透明度=0 mesh._s=1.5，透明度=1
        mesh.material.opacity = (mesh._s - 1) * 2;
      } else if (mesh._s > 1.5 && mesh._s <= 2) {
        //mesh._s=1.5，透明度=1 mesh._s=2，透明度=0
        mesh.material.opacity = 1 - (mesh._s - 1.5) * 2;
      } else {
        mesh._s = 1.0;
      }
    });
  }
}

/**
 * @description: 光柱
 */
function initLightBar() {
  var Cylinder = new THREE.CylinderGeometry(0.05, 0.1, 1, 60, 120, false);
  let pointArr = lnglat.map((item) => {
    return lglt2xyz(item.lng, item.lat, radius);
  });
  var material = new THREE.MeshPhongMaterial({
    //设置矩形网格模型的纹理贴图(光柱特效)
    map: globeTextureLoader.load("/coolearth/light.png"),
    // 双面显示
    side: THREE.DoubleSide,
    // 开启透明效果，否则颜色贴图map的透明不起作用
    transparent: true,
  });
  pointArr.forEach((item) => {
    // 矩形网格1
    var mesh1 = new THREE.Mesh(Cylinder, [material]);
    // 克隆网格模型mesh1，并旋转90度
    mesh1.position.set(item.x, item.y, item.z);
    var coordVec3 = new THREE.Vector3(item.x, item.y, item.z).normalize();
    // mesh默认在XOY平面上，法线方向沿着z轴new THREE.Vector3(0, 0, 1)
    var meshNormal = new THREE.Vector3(0, 1, 0);
    // 四元数属性.quaternion表示mesh的角度状态
    //.setFromUnitVectors();计算两个向量之间构成的四元数值
    mesh1.quaternion.setFromUnitVectors(meshNormal, coordVec3);
    // var mesh2 = mesh1.clone().rotateY(Math.PI / 2)
    // mesh2.position.set(item.x, item.y, item.z);
    // mesh2.quaternion.setFromUnitVectors(meshNormal, coordVec3);
    group.add(mesh1);
  });
  // scene.add(group)
}

/**
 * @description: 随机设置点
 * @param <Group> group ...
 * @param <number> radius ...
 */
function setRandomDot() {
  const arr = posArr.map((pos) => {
    var dotGeo = new THREE.SphereGeometry(0.1, 0.2, 0.2);
    var dotMater = new THREE.MeshPhongMaterial({ color: "tomato" });
    var dotMesh = new THREE.Mesh(dotGeo, dotMater);
    // var pos = getPos(radius, Math.PI * 2 * Math.random(), Math.PI * 2 * Math.random());
    dotMesh.position.set(pos.x, pos.y, pos.z);
    groupDots.add(dotMesh);
  });
  scene.add(groupDots);
}

/**
 * @description: 飞线
 */
function addFlyLines() {
  var animateDots = [];
  groupDots.children.forEach((elem) => {
    var line = addLines(groupDots.children[0].position, elem.position);
    groupLines.add(line.lineMesh);
    animateDots.push(line.curve.getPoints(100));
  });
  scene.add(groupLines);
  // 动画
  for (let i = 0; i < animateDots.length; i++) {
    const aGeo = new THREE.SphereGeometry(0.03, 0.03, 0.03);
    const aMater = new THREE.MeshPhongMaterial({ color: "#F8D764" });
    const aMesh = new THREE.Mesh(aGeo, aMater);
    aGroup.add(aMesh);
  }
  var vIndex = 0;
  function animateLine() {
    aGroup.children.forEach((elem, index) => {
      const v = animateDots[index][vIndex];
      elem.position.set(v.x, v.y, v.z);
    });
    vIndex++;
    if (vIndex > 100) {
      vIndex = 0;
    }
    setTimeout(animateLine, 20);
  }
  scene.add(aGroup);
  animateLine();
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
/**
 * @description: 生成曲线
 * @param {*} v0
 * @param {*} v3
 * @return {*}
 */
function addLines(v0, v3) {
  // 夹角
  var angle = (v0.angleTo(v3) * 1.8) / Math.PI / 0.1; // 0 ~ Math.PI
  var aLen = angle * 0.4,
    hLen = angle * angle * 12;
  var p0 = new THREE.Vector3(0, 0, 0);
  // 法线向量
  var rayLine = new THREE.Ray(p0, getVCenter(v0.clone(), v3.clone()));
  // 顶点坐标
  var vtop = rayLine.at(hLen / rayLine.at(1).distanceTo(p0));
  // 控制点坐标
  var v1 = getLenVcetor(v0.clone(), vtop, aLen);
  var v2 = getLenVcetor(v3.clone(), vtop, aLen);
  // 绘制三维三次贝赛尔曲线
  var curve = new THREE.CubicBezierCurve3(v0, v1, v2, v3);
  var geometry = new LineGeometry();
  var points = curve.getPoints(50);
  var positions = [];
  var colors = [];
  var color = new THREE.Color();

  /**
   * HSL中使用渐变
   * h — hue value between 0.0 and 1.0
   * s — 饱和度 between 0.0 and 1.0
   * l — 亮度 between 0.0 and 1.0
   */
  for (var j = 0; j < points.length; j++) {
    // color.setHSL( .31666+j*0.005,0.7, 0.7); //绿色
    color.setHSL(0.81666 + j, 0.88, 0.715 + j * 0.0025); //粉色
    colors.push(color.r, color.g, color.b);
    positions.push(points[j].x, points[j].y, points[j].z);
  }
  geometry.setPositions(positions);
  geometry.setColors(colors);
  var matLine = new LineMaterial({
    linewidth: 0.0006,
    vertexColors: true,
    dashed: false,
  });

  return {
    curve: curve,
    lineMesh: new Line2(geometry, matLine),
  };
}
/**
 * @description: 获取数据
 */
async function getChinaJson() {
  await axios.get("china.json").then((res) => {
    initMap(res.data);
  });
  await axios.get("china_outline.json").then((res) => {
    initChinaOutLine(res.data);
  });
}
/**
 * @description: 中国地图
 * @param {*} chinaJson
 */
function initMap(chinaJson) {
  // 遍历省份构建模型
  chinaJson.features.forEach((elem) => {
    // 新建一个省份容器：用来存放省份对应的模型和轮廓线
    const province = new THREE.Object3D();
    const coordinates = elem.geometry.coordinates;
    coordinates.forEach((multiPolygon) => {
      multiPolygon.forEach((polygon) => {
        // const lineMaterial = new THREE.LineBasicMaterial({ color: 0XFFFFFF }); //0x3BFA9E
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xf19553 }); //0x3BFA9E
        const positions = [];
        const linGeometry = new THREE.BufferGeometry();
        for (let i = 0; i < polygon.length; i++) {
          var pos = lglt2xyz(polygon[i][0], polygon[i][1], radius);
          positions.push(pos.x, pos.y, pos.z);
        }
        linGeometry.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(positions, 3)
        );
        const line = new THREE.Line(linGeometry, lineMaterial);
        province.add(line);
      });
    });
    // console.log("province", province)
    group.add(province);
    // scene.add(group);
  });
}

/**
 * @description: 创建中国轮廓-岛屿的经纬度删除
 * @param {*} chinaJson
 * @return {*}
 */
function initChinaOutLine(chinaJson) {
  chinaJson.features.forEach((elem) => {
    const coordinates = elem.geometry.coordinates;
    let dot = [];
    coordinates.forEach((multiPolygon) => {
      multiPolygon.forEach((polygon) => {
        for (let i = 0; i < polygon.length; i++) {
          var dotPost = lglt2xyz(polygon[i][0], polygon[i][1], 5.01);
          dot.push(dotPost);
        }
        var curve = new THREE.CatmullRomCurve3(dot);
        let flyLines = initFlyLine(
          curve,
          {
            speed: 0.02,
            color: new THREE.Color(0x47e2f1),
            number: 4,
            length: 0.2,
            size: 3,
          },
          5000
        );
      });
    });
  });
}

/**
 * @description: 创建飞线
 * @param {*} curve 路径
 * @param {*} matSetting 材料配置
 * @param {*} pointsNumber 点的个数
 * @return {*}
 */
function initFlyLine(curve, matSetting, pointsNumber) {
  var points = curve.getPoints(pointsNumber);
  var geometry = new THREE.BufferGeometry().setFromPoints(points);
  let length = points.length;
  var percents = new Float32Array(length);
  for (let i = 0; i < points.length; i += 1) {
    percents[i] = i / length;
  }
  geometry.setAttribute("percent", new THREE.BufferAttribute(percents, 1));
  let lineMaterial = initLineMaterial(matSetting);
  var flyLine = new THREE.Points(geometry, lineMaterial);
  flyLine.rotation.set(0.5, 2.9, 0.1);
  scene.add(flyLine);
}

/**
 * @description: 飞线材质
 * @param {*} setting
 * @return {*}
 */
function initLineMaterial(setting) {
  let number = setting ? Number(setting.number) || 1.0 : 1.0; // 在一个路径中同时存在的个数
  let speed = setting ? Number(setting.speed) || 1.0 : 1.0; // 速度约大越快
  let length = setting ? Number(setting.length) || 0.5 : 0.5; // 单根线的长度0-1之间1代表全满
  let size = setting ? Number(setting.size) || 3.0 : 3.0; // 在最大的地方的大小 默认为3像素
  let color = setting
    ? setting.color || new THREE.Vector3(0, 1, 1)
    : new THREE.Vector3(0, 1, 1); // 颜色此处以Vector3的方式传入分别为RBG值 都是0-1的范围
  let singleUniforms = {
    u_time: uniforms2.u_time,
    number: { type: "f", value: number },
    speed: { type: "f", value: speed },
    length: { type: "f", value: length },
    size: { type: "f", value: size },
    color: { type: "v3", value: color },
  };
  let lineMaterial = new THREE.ShaderMaterial({
    uniforms: singleUniforms,
    vertexShader: vertexShader, //顶点着色器部分
    fragmentShader: fragmentShader, // 片元着色器部分
    transparent: true,
    //blending:THREE.AdditiveBlending,
  });
  return lineMaterial;
}

/**
 * @description: 加载文字
 * @param {*}
 * @return {*}
 */
function loadTextFamily() {
  var textLoader = new THREE.FontLoader();
  textLoader.load("/fonts/YouSheBiaoTiHei_Regular.json", function (font) {
    let options = {
      size: 0.1,
      height: 0,
      font: font,
      bevelThickness: 1,
      bevelSize: 1,
      bevelSegments: 1,
      curveSegments: 50,
      steps: 1,
    };
    let pointArr = lnglat.map((item) => {
      return lglt2xyz(item.lng, item.lat, 5.2);
    });
    pointArr.forEach((item, index) => {
      let textGeo = new THREE.TextGeometry(lnglat[index].name, options);
      let textMesh = new THREE.Mesh(textGeo, new THREE.MeshBasicMaterial());
      textMesh.position.set(item.x, item.y, item.z + 0.2);
      var coordVec3 = new THREE.Vector3(item.x, item.y, item.z).normalize();
      var meshNormal = new THREE.Vector3(0, 0, 1);
      textMesh.quaternion.setFromUnitVectors(meshNormal, coordVec3);
      textMesh.rotation.x = Math.PI;
      textMesh.name = "font";
      textMesh.addrName = lnglat[index].name;
      textMesh.code = lnglat[index].code;
      textMesh.rotation.z = Math.PI;
      fontGroup.add(textMesh);
      console.log("fontGroup", fontGroup);
      fontGroup.rotation.set(0.5, 2.9, 0.1);
    });
    scene.add(fontGroup);
  });
}

/**
 * @description: 点击事件
 * @param {*} event
 * @return {*}
 */
function getIntersects(event) {
  event.preventDefault();
  console.log("event.clientX:" + event.clientX);
  console.log("event.clientY:" + event.clientY);

  // 声明 raycaster 和 mouse 变量
  var raycaster = new THREE.Raycaster();
  var mouse = new THREE.Vector2();

  // 通过鼠标点击位置,计算出 raycaster 所需点的位置,以屏幕为中心点,范围 -1 到 1
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  //通过鼠标点击的位置(二维坐标)和当前相机的矩阵计算出射线位置
  raycaster.setFromCamera(mouse, camera);

  // 获取与raycaster射线相交的数组集合，其中的元素按照距离排序，越近的越靠前
  var intersects = raycaster.intersectObjects(scene.children, true);
  // var intersects = raycaster.intersectObjects(fontGroup.children,true);
  console.log("intersects", intersects);
  if (intersects.length > 0) {
    let x = intersects[0].point.x;
    let y = intersects[0].point.y;
    let z = intersects[0].point.z;
    for (let i = 0; i < intersects.length; i++) {
      intersects[i].object.traverse(function (obj) {
        if (obj.type === "Mesh" && obj.name === "font") {
          console.log(obj.addrName);
          cityLabel(obj.addrName, obj.code, x, y, z);
        }
      });
    }
  }
  //返回选中的对象数组
  // return intersects;
}

/**
 * @description: 删除模型
 * @param {*}
 * @return {*}
 */
function disposeObj(group) {
  group.traverse(function (obj) {
    if (obj.type === "Mesh") {
      obj.geometry.dispose();
      obj.material.dispose();
    } else if (obj.type === "Object3D") {
    }
  });
}

/**
 * @description: 弹框
 * @param {*} addrName
 * @param {*} x
 * @param {*} y
 * @param {*} z
 * @return {*}
 */
function cityLabel(addrName, code, x, y, z) {
  console.log("labelGroup", labelGroup);
  // disposeObj(labelGroup)
  removeLabel(code);
  const div = document.createElement("div");
  div.innerHTML = `${addrName}<div class="label-close" data-code="${code}" data-addr="${addrName}">×</div>`;
  div.className = "city-label";
  // div元素包装成为css2模型对象CSS2DObject
  let label = new CSS2DObject(div);
  label.name = code;
  div.style.pointerEvents = "none"; //避免HTML标签遮挡三维场景的鼠标事件
  div.addEventListener("click", function (e) {
    console.log("e", e.target.dataset.code);
    removeLabel(parseInt(e.target.dataset.code));
  });
  // 设置HTML元素标签在three.js世界坐标中位置
  label.position.set(x, y, z);
  labelGroup.add(label);
  scene.add(labelGroup);
}
function setHtmlRenderer() {
  htmlRenderer = new CSS2DRenderer();
  htmlRenderer.setSize(window.innerWidth, window.innerHeight);
  htmlRenderer.domElement.style.position = "absolute";
  htmlRenderer.domElement.style.top = "0px";
  htmlRenderer.domElement.style.left = "0px";
  // //设置.pointerEvents=none，以免模型标签HTML元素遮挡鼠标选择场景模型
  htmlRenderer.domElement.style.pointerEvents = "none";
  containerDom.appendChild(htmlRenderer.domElement);
}

/**
 * @description: 删除css2DObject
 * @param {*} code
 * @return {*}
 */
function removeLabel(code) {
  let self = scene.getObjectByName(code);
  if (self) self.parent.remove(self);
}

onMounted(async () => {
  Dom = document.querySelector("#container");
  width = Dom.clientWidth;
  height = Dom.clientHeight;
  initRenderer();
  initCamera();
  initScene();
  initLight();
  addStar();
  initSatellite();
  initEarth();
  initControls();
  setHtmlRenderer();
  initAperture();
  initCircleMarker();
  initLightBar();
  setRandomDot();
  loadTextFamily();
  addFlyLines();
  await getChinaJson();
  window.addEventListener("click", getIntersects, false);

  // console.log("CHINA",CHINA)
  // initMap(CHINA);
  animate();
  window.addEventListener("resize", onWindowResize, false);
});

window.onload = async () => {};
</script>
<style lang="less" scoped>
.container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
}
:deep(.city-label) {
  width: 150px;
  height: 30px;
  line-height: 30px;
  background: rgba(0, 0, 0, 0.5);
  position: absolute;
  margin-top: -80px;
  padding: 0px 6px;
  color: #fff;
}

:deep(.label-close) {
  font-size: 20px;
  position: absolute;
  top: 0px;
  right: 3px;
  cursor: pointer;
  z-index: 10;
  pointer-events: auto;
}
</style>