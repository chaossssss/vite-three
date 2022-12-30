<template>
  <div>text: {{ text }}</div>
  <ChildText v-model:text="text" />
</template>
<script setup>
import { ref } from "vue";
import ChildText from "./Child.vue";
const text = ref("");
</script>
