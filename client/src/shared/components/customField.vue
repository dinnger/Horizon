<template>
  <div class=" w-full  mb-2 " v-if="element && element.show !== false && element.type">
    <div v-if="element.name" class="text-[12px] opacity-80 mt-2 inline-block">
      {{ element.name }} {{ element.required ? '*' : '' }}
    </div>
    <!-- string, password, number -->
    <div v-if="['string', 'password', 'number'].includes(element.type)" class="w-full relative">
      <input ref="fieldInput" v-if="!element.disabled" v-model="element.value" class="w-full input input-sm"
        :type="element.type === 'string' ? 'text' : element.type" :placeholder="element.placeholder"
        :class="(element?.class || '') + ('onValidation' in element && element.onValidation ? ' validator' : '')"
        :pattern="'onValidation' in element ? element.onValidation?.pattern || undefined : undefined"
        :maxlength="element.maxlength" :required="element.required === true || undefined" @focus="emit('focus')"
        @keyup="e => emit('keyup', e)" @keydown="e => emit('keydown', e)" @change="handleChange" />
      <input ref="fieldInput" v-else :value="element.value" :type="element.type === 'string' ? 'text' : element.type"
        class="w-full input input-sm" :class="element.class" disabled>
      <p v-if="'onValidation' in element && element.onValidation" class="validator-hints">
        {{ element.onValidation.hint.join('\n') }}
      </p>
      <div v-if="element.maxlength" class="absolute right-5 bottom-0 text-[10px] z-20">
        {{ (element.value || "").toString().length }} /{{ element.maxlength }}
      </div>
    </div>
    <!-- textarea -->
    <div v-if="element.type === 'textarea'" class="w-full relative ">
      <textarea ref="fieldInput" v-model="element.value" class="w-full textarea"
        :class="(element?.class || '') + ('onValidation' in element && element.onValidation ? ' validator' : '')"
        :maxlength="element.maxlength" @input="handleChange"
        :pattern="'onValidation' in element ? element.onValidation?.pattern || '' : undefined"></textarea>
      <p v-if="'onValidation' in element && element.onValidation" class="validator-hints">
        {{ element.onValidation.hint }}
      </p>
      <div v-if="element.maxlength" class="absolute right-5 bottom-0 text-[10px]">
        {{ element.value.length }} /{{ element.maxlength }}
      </div>
    </div>
    <!-- switch -->
    <template v-if="element.type === 'switch'">
      <input ref="fieldInput" type="checkbox" v-model="element.value" class="toggle" :class="element.class"
        @change="handleChange" />
    </template>
    <!-- options, secret, credential -->
    <div v-if="element.type === 'options' || element.type === 'secret' || element.type === 'credential'">
      <select ref="fieldInput" class="select select-sm" :class="element.class" v-model="element.value"
        @change="handleChange">
        <option v-for="option in element.options" :key="option.value" :value="option.value" :disabled="option.disabled">
          {{ option.label }}
        </option>
      </select>
    </div>
    <!-- button -->
    <template v-if="element.type === 'button'">
      <button class="btn btn-sm w-full" :class="element.buttonClass || 'btn-primary'"
        @click="emit('button:click', element)">
        {{ element.value }}
      </button>
    </template>
    <!-- code -->
    <template v-if="element.type === 'code' && element.lang">
      <CustomCode v-model:value="element.value" :lang="element.lang" :suggestions="element.suggestions"
        :name="element.name" :disabled="element.disabled" @update:value="handleChange" />
    </template>
    <!-- box -->
    <template v-if="element.type === 'box'">
      <div class="card bg-base-100 p-[8px] border-base-300 overflow-auto">
        <div v-for="(value, index) in element.value" :key="index" class="relative">
          <div class="text-xs opacity-80 text-ellipsis overflow-hidden text-nowrap">
            {{ value.label }}
          </div>
          <div v-if="value.isCopy" class="absolute cursor-pointer z-10 top-0 right-0 text-xs"
            @click="copyToClipboard(String(value.value))">
            <span class="mdi mdi-content-copy"></span>
          </div>
          <div class="mb-2 relative" :class="value.isWordWrap
            ? 'break-all'
            : 'text-ellipsis overflow-hidden text-nowrap w-full'
            ">
            {{ value.value }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { IPropertyFieldType } from '@shared/interface/node.properties.interface.js'
import CustomCode from './customCode.vue'
import { ref, watch } from 'vue'
import { toast } from 'vue-sonner'

const emit = defineEmits(['update:value', 'change', 'blur', 'focus', 'keyup', 'keydown', 'button:click'])

const props = withDefaults(defineProps<IPropertyFieldType>(), {
  show: undefined
})
const element = ref<IPropertyFieldType | null>(null)
const fieldInput = ref<HTMLInputElement | null>(null)

element.value = { ...props } as IPropertyFieldType

watch(
  () => (props as IPropertyFieldType).value,
  (value) => {
    if (!element.value) return
    element.value.value = value
  }
)

watch(
  () => (props as IPropertyFieldType).disabled,
  (value) => {
    if (!element.value) return
    element.value.disabled = value
  }
)

watch(element.value, (value) => {
  emit('update:value', value.value)
})

if (props.type === 'options') {
  watch(
    () => props.options,
    (value) => {
      if (element.value?.type !== 'options') return
      element.value.options = value
    }
  )
}

const select = () => {
  if (!fieldInput.value) return
  if (!Array.isArray(fieldInput.value)) return
  fieldInput.value[0].select()
}

const focus = () => {
  if (!fieldInput.value) return
  if (!Array.isArray(fieldInput.value)) return
  fieldInput.value[0].focus()
}

const handleChange = async () => {
  if (!element.value) return
  if ('onTransform' in element.value && typeof element.value.onTransform === 'function') {
    element.value.value = element.value.onTransform(element.value.value)
  }
  emit('change')
}

const copyToClipboard = (value: string) => {
  navigator.clipboard.writeText(value)
  toast.success('Copiado al portapapeles')
}

defineExpose({ select, focus })
</script>

<style scoped>
.validator-hints {
  visibility: hidden;
  display: none;
  color: var(--color-error, #e53e3e);
  font-size: 12px;
  margin-top: 2px;
  white-space: pre-line;
  line-height: 1.2;
}

input:user-invalid~.validator-hints,
input:has(:user-invalid)~.validator-hints,
input[aria-invalid]:not([aria-invalid="false"])~.validator-hints,
textarea:user-invalid~.validator-hints,
textarea:has(:user-invalid)~.validator-hints,
textarea[aria-invalid]:not([aria-invalid="false"])~.validator-hints {
  padding: 2px 4px;
  visibility: visible;
  display: block;
}
</style>