import { createRouter, createWebHistory } from "vue-router";
import Map from '@/components/Map.vue'
import Light from '@/components/Light.vue'
const routes = [
  {
    path: '/',
    component: Map
  }, {
    path: '/light',
    component: Light
  }
]

export default createRouter({
  history: createWebHistory(),
  routes
});