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
  world = new CANNON.World(); //初始化一个CANNON对象
  // 设置CANNON的引力  相当与地球的引力（您可以x轴也可以设置y轴或者z轴 负数则会向下掉，正数则向上）
  world.gravity.set(0, -9.82, 0);

  /**
   * 定义项目需要用到的材质
   */
  const concreteMaterial = new CANNON.Material("concrete"); //创建混凝土材质
  const plasticMaterial = new CANNON.Material("plastic"); //创建塑料材质

  /**
   *创建刚体，刚体就相当于现实生活中的物体（实体）一样 例如：桌子、板凳、大树、乒乓球等
   */
  //
  sphereBody = new CANNON.Body({
    mass: 10, //质量
    position: new CANNON.Vec3(0, 15, 0), //位置
    //刚体的形状。 CANNON.Sphere为圆球体  CANNON.Box为立方体 更多形状查看文档：https://pmndrs.github.io/cannon-es/docs/classes/Shape.html
    shape: new CANNON.Sphere(2),
    //材质  材质决定了物体(刚体)的弹力和摩擦力，默认为null，无弹力无摩擦。 plastic为塑料材质  concrete为混泥土材质。相关文档地址：https://pmndrs.github.io/cannon-es/docs/classes/Material.html
    material: plasticMaterial,
  });
  //添加外力，这有点类似于风力一样，在某个位置向某物吹风
  // 该方法接收两个参数：force：力的大小(Vec3)    relativePoint：相对于质心施加力的点(Vec3)。
  sphereBody.applyForce(new CANNON.Vec3(100, 0, 0), sphereBody.position);

  world.addBody(sphereBody); //向world中添加刚体信息

  /**
   * 创建地板刚体
   */
  const floorBody = new CANNON.Body();
  floorBody.mass = 0; //质量  质量为0时表示该物体是一个固定的物体即不可破坏
  floorBody.addShape(new CANNON.Plane()); //设置刚体的形状为CANNON.Plane 地面形状
  floorBody.material = concreteMaterial; //设置材质
  // 由于平面初始化是是竖立着的，所以需要将其旋转至跟现实中的地板一样 横着
  // 在cannon.js中，我们只能使用四元数(Quaternion)来旋转，可以通过setFromAxisAngle(…)方法，第一个参数是旋转轴，第二个参数是角度
  floorBody.quaternion.setFromAxisAngle(
    new CANNON.Vec3(-1, 0, 0),
    Math.PI * 0.5
  );
  world.addBody(floorBody);

  /**
   * 设置两种材质相交时的效果  相当于设置两种材质碰撞时应该展示什么样的效果 例如：篮球在地板上反弹
   */
  //创建一个接触材质
  const concretePlasticMaterial = new CANNON.ContactMaterial(
    concreteMaterial, //材质1
    plasticMaterial, //材质2
    {
      friction: 0.1, //摩擦力
      restitution: 0.7, //反弹力
    }
  );
  //添加接触材质配置
  world.addContactMaterial(concretePlasticMaterial);
}

function update() {
  requestAnimationFrame(update);
  // world.step(1 / 60);
  world.fixedStep();
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
