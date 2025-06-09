<template>
  <div class="flex flex-col h-full">
    <div class="flex justify-between">
      <h2 class="text-xl mb-2">Test</h2>
    </div>
    <div
      class="flex flex-col md:flex-row h-full overflow-auto dark:bg-black/30 bg-neutral-200 rounded-md"
    >
      <div class="bg-black/5 dark:bg-white/4 p-2 rounded-md">
        <div class="flex md:flex-col flex-wrap overflow-auto gap-1 w-40">
          <CustomButton
            v-for="option in options"
            :key="option.key"
            ghost
            :active="activeRouter(option)"
            @click="$router.push(`/tests/${option.key}`)"
          >
            <span class="mdi" :class="option.icon"></span>
            <div>{{ option.label }}</div>
          </CustomButton>
        </div>
      </div>
      <div class="flex-1 overflow-auto p-2">
        <div v-if="route.name === 'settings'">
          <CustomEmpty description="Seleccione una opción" class="mt-24">
          </CustomEmpty>
        </div>
        <div v-else class="overflow-auto flex-1 h-full">
          <router-view></router-view>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import CustomButton from "../../shared/components/customButton.vue";
import CustomEmpty from "../../shared/components/customEmpty.vue";

const route = useRoute();

const options = [
  {
    label: "API",
    key: "api",
    icon: "mdi-api",
    description: "Gestiona los tests",
  },
];

const activeRouter = (item: any) => {
  return !!(route.name?.toString() || "").includes(item.key);
};
</script>
