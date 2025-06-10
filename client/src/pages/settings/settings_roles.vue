<template>
  <div>
    <h2 class="text-xl mb-5">
      <span class="text-xl pl-2 pr-2 mdi mdi-home-lock-open"></span> Roles y Permisos
    </h2>
    <div class="tabs tabs-border ">
      <label class="tab">
        <input type="radio" name="my_tabs_4" :checked="true" />
        <span class="mdi mdi-shield-lock-outline text-lg mr-2"></span> Roles
      </label>
      <div class="tab-content p-2 bg-neutral-950/10 ">
        <listRole />
      </div>

      <label class="tab">
        <input type="radio" name="my_tabs_4" />
        <span class="mdi mdi-lock-open-plus-outline text-lg mr-2"></span> Permisos
      </label>
      <div class="tab-content p-2 bg-neutral-950/10 ">
        <ListPermission />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import listRole from './components/list.roles.vue';
import ListPermission from './components/list.permission.vue';
</script>