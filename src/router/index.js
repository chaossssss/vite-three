import { createRouter, createWebHistory } from "vue-router";
import Map from '@/components/Map.vue'
import Light from '@/components/Light.vue'
import Building from '@/components/Building.vue'
import Bloom from '@/components/Bloom.vue'
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
  }, {
    path: '/bloom',
    component: Bloom
  }
]

export default createRouter({
  history: createWebHistory(),
  routes
});