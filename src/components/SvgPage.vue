<template>
  <svg id="svg" width="1200" height="1200" xmlns="http://www.w3.org/2000/svg" version="1.1">

    <path :d="path" class="ani" stroke="" stroke-width="2" fill="none"></path>
    <path :d="path" class="ani2" stroke="" stroke-width="2" fill="none"></path>
  </svg>
</template>
<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import * as d3geo from "d3-geo";
import NANHU from '@/utils/nanhu.json'

onMounted(() => {
  init()
})

const path = ref('')

function init() {
  const projection = d3geo.geoMercator().center([120.782952, 30.747738]).scale(100000).translate([600, 600])  //div一半
  NANHU.features.forEach(elem => {
    const coordinates = elem.geometry.coordinates
    coordinates.forEach(multiPolygon => {
      multiPolygon.forEach(polygon => {

        for (let i = 0; i < polygon.length; i++) {
          const [x, y] = projection(polygon[i])
          // console.log(x, y)
          if (i == 0) {
            path.value = `M${x},${y}`
          } else {
            path.value += ` L${x},${y}`
          }
        }
      })
    })
  })
  console.log(path.value)
  nextTick(() => {
    var obj = document.querySelector("path");
    var length = obj.getTotalLength();
    // var svg = Snap("#svg");
    // var f = svg.paper.filter(Snap.filter.blur()/* 使用默认的2像素模糊 */),
    //   c = svg.paper.circle(50, 50, 40).attr({
    //     filter: f
    //   });
    console.log(length);
  })

}
</script>
<style scoped>
.ani {
  stroke-dasharray: 2481;
  /* animation: dash 5s linear infinite; */
  stroke: rgb(37, 190, 250);
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