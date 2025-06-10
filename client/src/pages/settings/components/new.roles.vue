<template>
  <div>
    <dialog id="my_modal_1" class="modal" :class="{ 'modal-open': showNew }">
      <div class="modal-box w-11/12 max-w-4xl">
        <h3 class="text-lg font-bold">Nuevo Role</h3>
        <div class="border-b border-neutral-600/40 mb-2 mt-2"></div>
        <div class="flex gap-2 ">
          <div class="flex-1">
            <CustomField v-model:value="name" name="Nombre" type="string" placeholder="Nombre del Rol"
              class="mb-2 w-full" />
            <CustomField type="textarea" name="Descripción" v-model:value="description"
              placeholder="Descripción del Rol" class="mb-2 w-full" :maxlength="200" />
          </div>
          <div class="w-72 border-l-2 border-neutral-800 ">
            <div v-for="item in validName" :key="item.label" class="flex gap-2 items-center">
              <span class="text-xl pl-2 pr-2 mdi"
                :class="[item.value ? 'mdi-checkbox-marked text-green-600' : 'mdi-checkbox-blank-outline']">
              </span>
              {{ item.label }}
            </div>
          </div>
        </div>
        <div class="flex justify-between mt-4">
          <CustomButton type="default" @click="showNew = false">Cerrar</CustomButton>
          <CustomButton permission="new_role" type="success" @click="changePassword" :loading="showChangePassword"
            :disabled="name.trim() === '' || validName.filter(f => !f.value).length > 0">
            Crear Rol
          </CustomButton>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showNew = false">close</button>
      </form>
    </dialog>

    <div class="flex justify-end mb-4">
      <button class="btn btn-primary btn-sm" @click="showNew = true">Nuevo Rol</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { toast } from 'vue-sonner';
import { useSocket } from '../../../stores/socket';
import CustomButton from '../../../shared/components/customButton.vue';
import CustomField from '../../../shared/components/customField.vue';
// ttPsGOBn6w

const socket = useSocket()

const showNew = ref(false)
const showChangePassword = ref(false)
const name = ref('')
const description = ref('')
const tags = ref([])

const validName = computed(() => {
  const arrValid = {
    minLength: {
      label: "Nombre: Mayor de 3 caracteres",
      value: name.value.length >= 3
    },
    maxLength: {
      label: "Nombre: Menor de 20 caracteres",
      value: name.value.length <= 20 && name.value.length > 0
    },
    specialCharacters: {
      label: "Nombre: Sin caracteres especiales",
      value: !name.value.match(/[!@#$%^&*()_+=\[\]{};':"\\|\ \`\~,.<>\/?]/g)
    },
    description: {
      label: "Descripción: Mayor de 10 caracteres",
      value: description.value.length >= 10
    },

  }
  return Object.values(arrValid)
})

const changePassword = () => {
  showChangePassword.value = true
  socket.socketEmit('server/security/role/new', {
    name: name.value,
    description: description.value,
    tags: tags.value
  }, (value: { error?: string }) => {
    showChangePassword.value = false
    if (value.error) return toast.error(value.error)
    name.value = ''
    description.value = ''
    tags.value = []
    toast.success('Rol creado exitosamente')
  })
}
</script>