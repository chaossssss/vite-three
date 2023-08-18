<template>
  <svg
    id="svg"
    width="600"
    height="600"
    xmlns="http://www.w3.org/2000/svg"
    version="1.1"
  >
    <polygon
      v-for="(item, index) in polygonArr"
      :key="index"
      :points="item"
      style="fill: #cccccc; stroke: #000000; stroke-width: 1"
    />
  </svg>
</template>
<script setup>
import { ref, reactive, onMounted, nextTick } from "vue";
import * as d3geo from "d3-geo";
import MapData from "./mapData.json";
import haining from "./haining.json";
const mapData = JSON.parse(MapData);
console.log(mapData);
console.log(haining);

onMounted(() => {
  init();
});

const path = ref("");
const polygonArr = ref([]);

function init() {
  const projection = d3geo
    .geoMercator()
    .center([120.57, 30.48])
    .scale(50000)
    .translate([300, 300]); //div一半
  mapData.features.forEach((elem) => {
    const coordinates = elem.geometry.coordinates;
    coordinates.forEach((multiPolygon) => {
      multiPolygon.forEach((polygon) => {
        for (let i = 0; i < polygon.length; i++) {
          const [x, y] = projection(polygon[i]);
          // console.log(x, y)
          if (i == 0) {
            path.value = `${x},${y}`;
          } else {
            path.value += ` ${x},${y}`;
          }
        }
      });
      polygonArr.value.push(path.value);
    });
  });
  console.log(polygonArr.value);
  console.log(path.value);
  nextTick(() => {
    // var obj = document.querySelector("path");
    // var length = obj.getTotalLength();
    // var svg = Snap("#svg");
    // var f = svg.paper.filter(Snap.filter.blur()/* 使用默认的2像素模糊 */),
    //   c = svg.paper.circle(50, 50, 40).attr({
    //     filter: f
    //   });
    // console.log(length);
  });
}
</script>
<style scoped>
.ani {
  stroke-dasharray: 2481;
  /* animation: dash 5s linear infinite; */
  stroke: #000;
}

.ani2 {
  stroke-dasharray: 1240 100;
  animation: dash 5s linear infinite;
  stroke: red;
}

@keyframes dash {
  0% {
    stroke-dashoffset: 100%;
  }

  100% {
    stroke-dashoffset: -100;
  }
}
</style>