<template>
  <div class="login rounded-3xl w-[340px] flex flex-col p-10">
    <div class="flex flex-col items-center mb-10">
      <Logo fill="white" :width="60" :height="60" />
      <div class="text-2xl font-bold text-white mt-2">Horizon</div>
    </div>

    <input
      type="text"
      class="input mb-2"
      v-model="username"
      placeholder="Usuario"
      @keyup.enter="login"
      :disabled="loading"
    />
    <input
      type="password"
      class="input"
      v-model="password"
      placeholder="Contraseña"
      @keyup.enter="login"
      :disabled="loading"
    />
    <div
      class="flex flex-col gap-2 items-center border-t border-neutral-700 pt-6 mt-2"
      v-if="!loading"
    >
      <!-- loading -->

      <div
        type="primary"
        tertiary
        class="w-full cursor-pointer hover:bg-black/30 text-center bg-black/20 p-2 rounded-lg mb-1"
        size="large"
        @click="login"
      >
        <span class="mdi mdi-login mr-2"></span>
        Login
      </div>

      <div
        type="info"
        class="w-full cursor-pointer hover:bg-black/30 text-center bg-black/20 p-2 rounded-lg"
        size="large"
        tertiary
      >
        <span class="mdi mdi-google mr-2"></span>Google
      </div>
    </div>
    <div
      v-else
      role="status"
      class="flex flex-col items-center justify-center mt-10"
    >
      <svg
        aria-hidden="true"
        class="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
          fill="currentFill"
        />
      </svg>
      <span class="sr-only">Loading...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { request } from "../../helpers/request";
import { toast } from "vue-sonner";
import { useSession } from "../../stores/session";
import Logo from "../../shared/components/logo.vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();
const session = useSession();
const username = ref("");
const password = ref("");
const loading = ref(false);

const login = async () => {
  loading.value = true;
  const data = {
    username: username.value,
    password: password.value,
  };
  try {
    const res = await request.post("/api/security/login", data);
    if (res.status === 200) {
      session.setSession(res.data.token);
      // window.location.href = '/'
      // Redirección inteligente
      const redirect = route.query.redirect as string;
      // setTimeout(() => {
      console.log({ redirect });
      if (redirect) {
        window.location.href = `.${redirect}`;
      } else {
        window.location.href = "/";
      }
      // }, 100);
    }
  } catch (error: any) {
    loading.value = false;
    toast.error(error?.response?.data || error.toString());
    password.value = "";
  }
};
</script>

<style scoped>
.login {
  background-color: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 100px rgba(255, 255, 255, 0.15);
}
</style>
