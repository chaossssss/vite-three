import { createRouter, createWebHistory } from "vue-router";
import Map from '@/components/Map.vue'
import Light from '@/components/Light.vue'
import Building from '@/components/Building.vue'
const routes = [
  {
    path: '/',
    component: Map
  }, {
    path: '/light',
    component: Light
  }, {
    path: '/building',
    component: Building
  }
]

export default createRouter({
  history: createWebHistory(),
  routes
});