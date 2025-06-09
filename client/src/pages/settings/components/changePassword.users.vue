<template>
  <div class="card  p-4 bg-base-100 shadow-sm">
    <div class="flex gap-2">
      <div class="flex-1">
        <CustomField type="password" v-model:value="oldPassword" name=" Contraseña actual:"
          placeholder="Contraseña actual" class="w-full" />
        <CustomField type="password" v-model:value="newPassword" name="Nueva contraseña:" placeholder="Nueva contraseña"
          class="w-full" />
        <CustomField type="password" v-model:value="confirmPassword" name="Confirmar contraseña:"
          placeholder="Confirmar contraseña" class="w-full" />
      </div>
      <div class="w-72 border-l-2 border-neutral-800 ">
        <div v-for="item in validPassword" :key="item.label" class="flex gap-2 items-center">
          <span class="text-xl pl-2 pr-2 mdi"
            :class="[item.value ? 'mdi-checkbox-marked text-green-600' : 'mdi-checkbox-blank-outline']">
          </span>
          {{ item.label }}
        </div>
      </div>
    </div>
    <div class="flex justify-end mt-4">
      <button class="btn btn-primary btn-sm" @click="changePassword" :loading="showChangePassword"
        :disabled="oldPassword.trim() === '' || validPassword.filter(f => !f.value).length > 0">
        Cambiar contraseña
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { toast } from 'vue-sonner';
import { useSocket } from '../../../stores/socket';
import CustomField from '../../../shared/components/customField.vue';
// ttPsGOBn6w

const socket = useSocket()

const showChangePassword = ref(false)
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const validPassword = computed(() => {
  const arrValid = {
    minLength: {
      label: "Mayor de 10 caracteres",
      value: newPassword.value.length >= 10
    },
    maxLength: {
      label: "Menor de 20 caracteres",
      value: newPassword.value.length <= 20 && newPassword.value.length > 0
    },
    specialCharacters: {
      label: "Contiene caracteres especiales",
      value: newPassword.value.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g)
    },
    numbers: {
      label: "Contiene números",
      value: newPassword.value.match(/\d+/g)
    },
    confirmPassword: {
      label: "Contraseña confirmada",
      value: newPassword.value === confirmPassword.value && confirmPassword.value.length > 0
    }
  }
  return Object.values(arrValid)
})

const changePassword = () => {
  showChangePassword.value = true
  socket.socketEmit('server/security/user/change_password', {
    oldPassword: oldPassword.value,
    newPassword: newPassword.value
  }, (value: { error?: string }) => {
    showChangePassword.value = false
    if (value.error) return toast.error(value.error)
    oldPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    toast.success('Contraseña actualizada exitosamente')
  })
}
</script>