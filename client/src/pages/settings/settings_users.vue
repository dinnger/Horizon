<template>
  <h2 class="text-xl mb-5">
    <span class="text-xl pl-2 pr-2 mdi mdi-account-multiple"></span> Usuarios
  </h2>

  <div class="tabs tabs-border w-fuil ">
    <label class="tab">
      <input type="radio" name="my_tabs_4" :checked="true" />
      <span class="mdi mdi-account-box-edit-outline text-lg mr-2"></span> Perfil
    </label>
    <div class="tab-content p-2 bg-neutral-950/10 ">
      <h2 class="text-xl"> Cambio de contraseña</h2>
      <ChangePasswordUsers />
    </div>

    <label class="tab">
      <input type="radio" name="my_tabs_4" />
      <span class="mdi mdi-account-plus text-lg mr-2"></span> Nuevo Usuario
    </label>
    <div class="tab-content p-2 bg-neutral-950/10 ">
      <h2 class="text-xl"> Crear nuevo usuario</h2>
      <!-- <Logs :node="selectedNode" :canvasInstance="canvasInstance" /> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import ChangePasswordUsers from './components/changePassword.users.vue';
</script>
