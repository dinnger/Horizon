<template>
  <div>
    <dialog id="my_modal_1" class="modal" :class="{ 'modal-open': showNew }">
      <div class="modal-box w-11/12 max-w-4xl">
        <h3 class="text-lg font-bold">Nuevo Secreto</h3>
        <div class="border-b border-neutral-600/40 mb-2 mt-2"></div>
        <div class="flex w-full flex-nowrap mt-2 gap-3">
          <div class=" w-52 overflow-hidden">
            <div class="flex flex-col gap-2">
              <div>
                <CustomField v-model:value="info.type" type="options" name="Tipo de Secreto" :options="optionsType" />
              </div>
              <div v-if="optionsType.find(f => f.value === info.type)?.subOptions && info.subType">
                <CustomField v-model:value="info.subType" type="options" name="Subtipo"
                  :options="optionsType.find(f => f.value === info.type).subOptions" />
              </div>
            </div>
          </div>
          <div class="flex-1 " v-if="info.type">
            <div class="flex-1 ">
              <div class="flex-1 mb-2">
                <CustomField v-model:value="info.name" type="string" name="Nombre" placeholder="Nombre del secreto"
                  :maxlength="30" @keyup="() => info.name = info.name.toUpperCase()" class="w-full" />
              </div>
              <span class="text-sm text-neutral-500">Descripción:</span>
              <CustomField v-model:value="info.description" name="description" type="textarea"
                placeholder="Descripción del secreto" :maxlength="200" class="mb-2 w-full" />
              <template v-if="info.type === 'DATABASE'">
                <span class="text-sm text-neutral-500">Valor (json):</span>
                <CustomField v-model:value="info.value" name="valor" type="code" lang="json" class="w-full" />
              </template>
              <template v-if="info.type === 'VARIABLES'">
                <span class="text-sm text-neutral-500">Valor:</span>
                <CustomField v-model:value="info.value" name="valor" type="textarea" placeholder="Variables"
                  :maxlength="200" class="w-full" />
              </template>
            </div>
            <div class="border-l-2 border-red-900 pl-2 mt-4" v-if="valid.length > 0">
              Errores:
              <div v-for="item in valid" :key="item.label" class="text-[12px] pl-2">
                <span class="mdi mdi-alert-circle text-red-900"></span> {{ item.label }}
              </div>
            </div>
          </div>

        </div>
        <div class="flex justify-end mt-4 ">
          <CustomButton v-if="!modelSelected" type="success" :disabled="valid.length > 0" @click="save(false)">
            Crear Secreto
          </CustomButton>
          <CustomButton v-else type="success" :disabled="valid.length > 0" @click="save(true)">
            Guardar Cambios
          </CustomButton>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeModal">close</button>
      </form>
    </dialog>

    <div class="flex justify-end mb-4">
      <CustomButton type="primary" size="sm" @click="newDeploy">Nuevo Secreto</CustomButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useSocket } from '../../../../stores/socket';
import { toast } from 'vue-sonner';
import CustomButton from '../../../../shared/components/customButton.vue';
import CustomField from '../../../../shared/components/customField.vue';

interface IDeploy {
  name: string
  info: { title: string, desc: string, icon: string }
  properties: { [key: string]: any }
}
const socket = useSocket()

const props = defineProps<{
  modelSelected: any | null,
  optionsType: any[]
}>()
const emit = defineEmits(['update:refreshList', 'update:clear'])

const showNew = ref(false)
const typeDeploySelected = ref<IDeploy | null>(null)
const info = ref<{ id?: number, name: string, description: string, value: string, type: string, subType?: string }>({
  name: '',
  description: '',
  value: '',
  type: '',
  subType: '',
})

const isJson = () => {
  try {
    JSON.parse(info.value.value)
    return true
  } catch (error) {
    return false
  }
}

const valid = computed(() => {
  const arrValid = {
    subType: {
      label: "Subtipo: Seleccione un subtipo",
      value: !props.optionsType.find(f => f.value === info.value.type)?.subOptions || info.value.subType
    },
    minLength: {
      label: "Nombre: Menor de 3 caracteres",
      value: info.value.name.length >= 3
    },
    specialCharacters: {
      label: "Nombre: Sin caracteres especiales",
      value: !info.value.name.match(/[!@#$%^&*()+=\_\[\]{};':"\\|\`\~,.<>\/\ ?]/g)
    },
    dialect: {
      label: "Dialecto: Seleccione un dialecto",
      value: info.value.type
    },
    value: {
      label: "Valor: Detalle el valor",
      value: (info.value.type === 'VARIABLES' && info.value.value?.trim().length > 0) || (info.value.type === 'DATABASE' && isJson())
    }
  }
  return Object.values(arrValid).filter(f => !f.value)
})

watch(() => info.value.type, value => {
  if (value === 'DATABASE' && !props.modelSelected) {
    info.value.value = `{
      "host": "localhost",
      "port": 5432,
      "database": "postgres",
      "user": "postgres",
      "password": "postgres"
    }`
  }
})

watch(() => props.modelSelected, (value) => {
  if (value) {
    socket.socketEmit('server/security/secret/get', { id: value.id }, (value: { error?: string, secret?: any }) => {
      if (value.error) return toast.error(value.error)
      info.value = {
        id: value.secret.id,
        name: value.secret.name,
        description: value.secret.description,
        type: value.secret.type,
        subType: value.secret.subType,
        value: value.secret.value,
      }
      showNew.value = true
    })
  }
})

const newDeploy = () => {
  emit('update:clear')
  info.value = {
    name: '',
    description: '',
    value: '',
    type: '',
  }
  showNew.value = true
}

const closeModal = () => {
  emit('update:clear')
  typeDeploySelected.value = null
  showNew.value = false
}

const save = (isEdit = false) => {
  socket.socketEmit(`server/security/secret/${isEdit ? 'edit' : 'new'}`, info.value, (value: { error?: string }) => {
    if (value.error) return toast.error(value.error)
    toast.success('Secreto creado exitosamente')
    showNew.value = false
    info.value = {
      name: '',
      description: '',
      value: '',
      type: '',
    }
    emit('update:refreshList')
  })
}



</script>