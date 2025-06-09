<template>
  <div class="flex flex-col h-full " :class="[main.menu_minimize ? 'w-16' : 'w-45']">
    <div class="flex-1 flex flex-col p-2 ">
      <div class="mb-4 mt-2 flex justify-between">
        <button class="btn btn-primary" disabled v-if="!main.menu_minimize">
          <Logo fill="white" :width="16" :height="16" />
        </button>
        <span class="mdi mdi-menu-open text-xl cursor-pointer" @click="main.change_minimize_menu(!main.menu_minimize)"
          v-if="!main.menu_minimize"></span>
        <span class="mdi mdi-menu-close text-xl ml-3 cursor-pointer"
          @click="main.change_minimize_menu(!main.menu_minimize)" v-else></span>
      </div>
      <div class="mb-2 border-b border-base-content/10 w-full">
        <button
          class="btn btn-soft btn-primary flex justify-start w-full mb-2  text-ellipsis overflow-hidden text-nowrap">
          <div>{{ main.menu_minimize ? session.workspace?.name[0].toUpperCase() : session.workspace?.name }}</div>
        </button>
      </div>
      <div class="w-full">
        <button class="btn flex justify-start w-full" v-for="menu in menus" :key="menu.name"
          :class="[menu_active === menu.name ? 'btn-primary' : 'btn-ghost']" @click="menu_select(menu)">
          <span class="mdi text-[18px]" :class="menu.icon"></span>
          <div v-if="!main.menu_minimize">{{ menu.name }}</div>
        </button>
      </div>
    </div>
    <div class="">

      <div class="dropdown dropdown-right dropdown-top w-full">
        <div tabindex="0" role="button"
          class="btn btn-ghost flex justify-start w-full text-ellipsis overflow-hidden text-nowrap">
          <span class="mdi mdi-account-circle text-2xl"></span> {{ main.menu_minimize ? '' : session.user?.alias }}
        </div>
        <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 mt-2">
          <li class="menu-title">{{ session.user?.alias || "Usuario" }}</li>
          <li>
            <a @click="router.push('/settings/users')">
              <span class="mdi mdi-cog"></span> Preferencias
            </a>
          </li>
          <li>
            <a @click="logout">
              <span class="mdi mdi-logout"></span> Cerrar sesión
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { onMounted, ref } from "vue";
import Logo from "../../shared/components/logo.vue";
import { useMain } from "../../stores/main";
import { useSession } from "../../stores/session";

const router = useRouter();
const menu_active = ref("");
const main = useMain();
const session = useSession();

interface MenuInterface {
  name: string;
  description: string;
  color: string;
  icon: string;
  tags: string[];
  url: string;
}

const menus: MenuInterface[] = [
  {
    name: "Inicio",
    description: "Inicio de la aplicación",
    color: "#2980B9",
    icon: "mdi-home",
    tags: [""],
    url: "/",
  },
  {
    name: "Proyectos",
    description: "Grupo de flujos de trabajo",
    color: "#D35400",
    icon: "mdi-folder-multiple",
    tags: ["projects", "workflows"],
    url: "/projects",
  },
  {
    name: "Tests",
    description: "Test de flujos de trabajo",
    color: "#D35400",
    icon: "mdi-list-status",
    tags: ["tests", "workflows"],
    url: "/tests",
  },
  {
    name: "Despliegues",
    description: "Despliegue de flujos de trabajo",
    color: "#D35400",
    icon: "mdi-package-variant",
    tags: ["deployments", "workflows"],
    url: "/deployments",
  },
  {
    name: "Configuración",
    description: "Configuración general",
    color: "#16A085",
    icon: "mdi-cog",
    tags: ["settings"],
    url: "/settings",
  },
];

const menu_select = (menu: MenuInterface) => {
  menu_active.value = menu.name;
  router.push(menu.url);
};

const logout = () => {
  session.removeSession();
  router.replace({ name: "login" });
};

onMounted(() => {
  const module = router.currentRoute.value.path.split("/")[1];
  menu_active.value =
    menus.find((menu) => menu.tags.includes(module))?.name || "";
});
</script>

<style scoped>
.menu-item {
  margin-bottom: 0;
  justify-content: center;
  border-radius: 0;
  background-color: var(--color-background-element);
  cursor: pointer;
}

.menu .menu-item:first-child {
  border-radius: 0 5px 0 0;
}

.menu .menu-item:last-child {
  border-radius: 0 0 5px 0;
}

.menu-active {
  background-color: var(--color-background-active);
  color: var(--color-text-active);
}

.menu .menu-title {
  display: none;
}

@media (max-width: 768px) {
  .menu .menu-item:first-child {
    border-radius: 5px 0 0 5px;
  }

  .menu .menu-item:last-child {
    border-radius: 0 5px 5px 0;
  }
}
</style>
