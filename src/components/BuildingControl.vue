<template>
  <div class="control-box">
    <el-form :model="form">
      <el-form-item label="楼层">
        <el-select v-model="form.floor">
          <el-option label="1楼" :value="1" />
          <el-option label="2楼" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click.stop="onSubmit">确认</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>
<script setup>
import { reactive } from 'vue'
const emit = defineEmits(["onSubmit"])
let form = reactive({
  floor: null
})
const onSubmit = () => {
  emit("onSubmit", form)
}
</script>
<style lang="less" scoped>
.control-box {
  width: 300px;
  height: 80px;
  background: #fff;
  position: absolute;
  top: 0;
  right: 0;
  z-index: 500;
}
</style>