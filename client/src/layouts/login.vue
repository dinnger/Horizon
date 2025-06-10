<template>
  <div class="content">
    <div
      class="absolute top-0 z-[-2] h-screen w-screen bg-neutral-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
    </div>
    <div class=" flex-1 flex flex-col overflow-auto  items-center justify-center h-full backdrop-blur-md ">
      <LoginComponent></LoginComponent>
    </div>
  </div>
</template>

<script setup lang="ts">
import LoginComponent from './components/login.component.vue';
</script>

<style scoped>
.content {
  height: 100%;
  width: 100%;
  overflow: hidden;
}
</style>