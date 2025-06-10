<template>
  <div>
    <div id="my_modal_1" class="modal " :class="{ 'modal-open': showNew }">
      <div class="modal-box w-11/12 max-w-5xl  flex flex-col p-0 ">
        <div class=" mb-2 p-5">
          <h3 class="text-lg font-bold">
            {{ isEditing ? editTitle || title : title }}
          </h3>
          <span class="mdi mdi-close-thick absolute right-5 top-5  cursor-pointer" @click="closeModal"></span>
        </div>

        <form @submit.prevent action="#">
          <div class="flex overflow-auto h-full  ">
            <div class="w-60 pl-5 pr-2 pb-5">
              <div v-if="step?.description" class="text-[12px] opacity-80 bg-black/10 rounded-md p-2">
                {{ step.description }}
              </div>
              <div v-for="(item, index) in stepHistory" :key="index" class="bg-black/10 rounded-md p-2 mb-2 text-sm">
                <div class="text-xs opacity-80 text-ellipsis overflow-hidden text-nowrap">
                  {{ item.label }}
                </div>
                <div v-if="typeof item.value === 'string'" class="pl-2">
                  {{ item.value }}
                </div>
                <div v-else>
                  <div v-for="(value, index) in item.value" :key="index">
                    <div class="text-[11px] opacity-80 mt-2 text-secondary">
                      {{ value.label }}
                    </div>
                    <div class="pl-2">
                      {{ value.value }}
                    </div>
                  </div>
                </div>

              </div>
            </div>
            <div class="flex-1 border-l-2 border-black/10  flex flex-col min-h-[200px]" v-if="step">
              <div class="pl-3 pr-3">
                {{ step.label }}
              </div>
              <div class="p-5 pt-0 flex-1">
                <!-- Buttons -->
                <template v-if="step.type === 'buttons'">
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2">
                    <div v-for="(button, key) of step.element" :key="key"
                      class="btn p-5 hover:btn-primary relative overflow-hidden"
                      :class="step.value === String(key) ? 'btn-primary' : ''" @click="stepButtonClick(String(key))">
                      {{ button.label }}
                      <template v-if="button.icon">
                        <span v-if="button.icon.indexOf('mdi') === -1"
                          class="mdi material-icons absolute opacity-20 top-0 right-0 text-5xl">
                          {{ button.icon }}
                        </span>
                        <span v-else class="mdi absolute opacity-20 top-0 right-0 text-5xl" :class="button.icon">
                        </span>
                      </template>

                    </div>
                  </div>
                </template>
                <!-- Fields -->
                <template v-if="step.type === 'fields'">
                  <CustomFields v-model:value="step.element" />
                </template>
              </div>
              <div v-if="stepHistory.length > 0 || step.onActions" class="flex justify-between mt-5 bg-black/30 p-3">
                <button v-if="stepHistory.length > 0" class="btn btn-primary" @click="stepBack">
                  Atrás
                </button>
                <div v-else></div>
                <div class="flex gap-2">
                  <template v-if="step.onActions">
                    <template v-if="Array.isArray(step.onActions)">
                      <div v-for="(action, index) of step.onActions" :key="index">
                        <button v-if="typeof action === 'object' && action?.label" type="button" class="btn btn-success"
                          @click="stepActionClick(action)" :disabled="action.isLoading">
                          <span v-if="action.isLoading" class="loading loading-spinner"></span>
                          {{ action.label }}
                        </button>
                      </div>
                    </template>
                    <button v-else class="btn btn-success" type="button" @click="stepActionClick(step.onActions)">
                      Siguiente
                    </button>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeModal">close</button>
      </form>
    </div>

    <div class="flex justify-end mb-4">
      <CustomButton type="primary" size="sm" @click="openModal">
        {{ buttonTitle }}
      </CustomButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import CustomButton from './customButton.vue'
// import StepHistory from "./StepHistory.vue";
// import StepContent from "./StepContent.vue";
import CustomFields from './customFields.vue'
import type { IClientActionsButtons, IClientStepButtons, IClientStepContent, IClientStepType } from '@shared/interfaces/client.interface'
import { toast } from 'vue-sonner'

const emit = defineEmits(['save'])
const props = defineProps<{
  title: string
  editTitle?: string
  buttonTitle: string
  steps: IClientStepContent
  editData?: any // Datos para edición
}>()
const showNew = ref(false)
const isEditing = ref(false)
const stepData = ref<IClientStepContent>({})
const stepKey = ref<string>('')

watch(
  () => stepKey.value,
  (value) => {
    if (!value || stepData.value[value]) return
    loadSteps()
  }
)

const step = computed(() => {
  return stepData.value[stepKey.value]
})

const stepHistory = computed(() => {
  const list: {
    type: string
    key: string
    label: string
    value: string | { label: string; value: any }[]
  }[] = []
  for (const [key, value] of Object.entries(stepData.value)) {
    if (key === stepKey.value) break
    const step = value as IClientStepType
    if (step.type === 'buttons') {
      list.push({
        type: 'buttons',
        key,
        label: step.label,
        value: step.value ? step.element[step.value].label : 'Sin definir'
      })
    } else {
      list.push({
        type: step.type,
        label: step.label,
        key,
        value: Object.entries(step.element).map(([_, value]) => ({
          label: value.name,
          value: value.value
        }))
      })
    }
  }
  return list
})

const stepButtonClick = async (buttonKey: string) => {
  if (step.value.type !== 'buttons') return
  const button = (step.value.element as IClientStepButtons)[buttonKey]
  step.value.value = buttonKey

  if (button?.onActions) {
    if (typeof button.onActions === 'function') {
      const response = await button.onActions({
        steps: stepData.value,
        step: step.value
      })
      if (typeof response === 'string') stepKey.value = response
    } else if (typeof button.onActions === 'string') {
      console.log(buttonKey)
      stepKey.value = button.onActions
    }
  }
}

function extractValues(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj

  if ('value' in obj && Object.keys(obj).length === 1) {
    return extractValues(obj.value)
  }

  if ('value' in obj) {
    return extractValues(obj.value)
  }

  if (Array.isArray(obj)) {
    return obj.map(extractValues)
  }

  const result: any = {}
  for (const key in obj) {
    const val = extractValues(obj[key])
    if (val !== undefined) {
      try {
        result[key] = typeof val === 'string' ? JSON.parse(val) : val
      } catch (error) {
        result[key] = val
      }
    }
  }
  return result
}

const stepActionClick = async (action: IClientActionsButtons) => {
  // Validar el formulario antes de proceder
  if (!validateCurrentStep()) {
    return
  }

  let nextStepKey: any

  try {
    const steps = extractValues(stepData.value)
    const step = extractValues(stepData.value[stepKey.value])

    if (typeof action === 'object' && 'onActions' in action && typeof action.onActions === 'function') {
      action.isLoading = true
      nextStepKey = await action.onActions({ steps, step })
      action.isLoading = false
      if (nextStepKey.alert) {
        const toastType = nextStepKey.type as keyof typeof toast
        return toast[toastType](nextStepKey.alert)
      }
      if (nextStepKey.save) {
        toast.success(nextStepKey.save)
        closeModal()
      }
    } else if (typeof action === 'string') {
      nextStepKey = action
    }
  } catch (error: any) {
    if (typeof action === 'object' && 'isLoading' in action) action.isLoading = false
    toast.error(error?.message || error)
  }

  // Si se retorna un string, navegar al siguiente paso
  if (nextStepKey && typeof nextStepKey === 'string') {
    stepKey.value = nextStepKey
  } else if (nextStepKey === null || nextStepKey === undefined) {
    // Si no hay próximo paso definido, buscar el siguiente en el orden
    const currentStepIndex = Object.keys(props.steps).indexOf(stepKey.value)
    const nextStep = Object.keys(props.steps)[currentStepIndex + 1]
    if (nextStep) {
      stepKey.value = nextStep
    }
  }
}

const validateCurrentStep = (): boolean => {
  // Obtener el formulario
  const form = document.querySelector('form')
  if (!form) return true

  // Verificar validez del formulario
  const isValid = form.checkValidity()

  // Si no es válido, mostrar los mensajes de validación
  if (!isValid) {
    form.reportValidity()
    return false
  }

  return true
}

const stepBack = () => {
  delete stepData.value[stepKey.value]
  stepKey.value = stepHistory.value[stepHistory.value.length - 1].key
}

const closeModal = () => {
  isEditing.value = false
  showNew.value = false
  stepKey.value = ''
  stepData.value = {}
}

const loadSteps = () => {
  stepData.value[stepKey.value] = JSON.parse(JSON.stringify(props.steps[stepKey.value]))
  for (const [keyElement, fields] of Object.entries(props.steps[stepKey.value].element)) {
    for (const [key] of Object.entries(fields)) {
      // Busca opciones que empiezan por on como por ejemplo onActions, onTransform, etc.
      if (key && /^on[A-Z]/.test(key)) {
        ; (stepData.value[stepKey.value].element[keyElement] as Record<string, any>)[key] = (fields as Record<string, any>)[key]
      }
    }
  }
  for (const [keyElement] of Object.entries(props.steps[stepKey.value])) {
    if (keyElement && /^on[A-Z]/.test(keyElement)) {
      ; (stepData.value[stepKey.value] as Record<string, any>)[keyElement] = (props.steps[stepKey.value] as Record<string, any>)[keyElement]
    }
  }
}

const openModal = () => {
  stepKey.value = Object.keys(props.steps)[0]
  loadSteps()

  // nextStep(stepKey.value);

  showNew.value = true
}

defineExpose({ closeModal })
</script>
