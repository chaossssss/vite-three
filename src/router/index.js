import { createRouter, createWebHistory } from "vue-router";
import Map from "@/components/Map.vue";
import Light from "@/components/Light.vue";
import Building from "@/components/Building.vue";
import Bloom from "@/components/Bloom.vue";
import BloomSelective from "@/components/BloomSelective.vue";
import Layout from "@/components/Layout.vue";
import Father from "@/components/Father.vue";
import Cannon from "@/components/Cannon.vue";
import SvgPage from "@/components/SvgPage.vue";
import Svg from "@/components/SVG.vue";
import CoolEarth from "@/components/CoolEarth.vue";
const routes = [
  {
    path: "/",
    component: Map,
  },
  {
    path: "/coolearth",
    component: CoolEarth,
  },
  {
    path: "/svg",
    component: Svg,
  },
  {
    path: "/light",
    component: Light,
  },
  {
    path: "/building",
    component: Building,
  },
  {
    path: "/bloom",
    component: Bloom,
  },
  {
    path: "/bloom2",
    component: BloomSelective,
  },
  {
    path: "/layout",
    component: Layout,
  },
  {
    path: "/father",
    component: Father,
  },
  {
    path: "/cannon",
    component: Cannon,
  },
  {
    path: "/svgPage",
    component: SvgPage,
  },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
