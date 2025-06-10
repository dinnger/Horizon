<template>
  <div>
    <h2 class="text-xl mb-5">
      <span class="text-xl pl-2 pr-2 mdi mdi-shield-lock-outline"></span>
      Seguridad
    </h2>
    <div class="tabs tabs-border ">
      <label class="tab">
        <input type="radio" name="my_tabs_4" :checked="true" />
        <span class="text-xl pl-2 pr-2 mdi mdi-shield-key-outline"></span> Credenciales
      </label>
      <div class="tab-content p-2 bg-neutral-950/10 ">
        <ListCredentials />
      </div>
      <label class="tab">
        <input type="radio" name="my_tabs_4" />
        <span class="text-xl pl-2 pr-2 mdi mdi-variable"></span> Secretos
      </label>
      <div class="tab-content p-2 bg-neutral-950/10 ">
        <listSecret />
      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import ListCredentials from './components/security/list.credentials.vue'
import listSecret from './components/security/list.secret.vue'
</script>
