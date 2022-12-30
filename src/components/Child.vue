<template>
  <input type="text" v-model="mytext" @input="change" />
</template>
<script setup>
import { ref } from "vue";
const props = defineProps({
  text: String,
});
const mytext = ref("");
const emit = defineEmits(["update:text"]);
const change = () => {
  emit("update:text", mytext.value);
};
</script>
