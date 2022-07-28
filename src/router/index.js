import { createRouter, createWebHistory } from "vue-router";
import Map from '@/components/Map.vue'
import Light from '@/components/Light.vue'
import Building from '@/components/Building.vue'
import Bloom from '@/components/Bloom.vue'
import BloomSelective from '@/components/BloomSelective.vue'
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
  }, {
    path: '/bloom2',
    component: BloomSelective
  }
]

export default createRouter({
  history: createWebHistory(),
  routes
});