<template>
  <template v-for="(item, key) in elementValue" :key="key">
    <template v-if="item.show !== false">
      <!-- list -->
      <template v-if="item.type === 'list'">
        <div v-if="item.name" class="text-[12px] opacity-80 mt-2">
          {{ item.name }} {{ item.required ? '*' : '' }}
        </div>
        <div class="p-3 pt-1 border-l-2 border-gray-300 mb-2 relative bg-black/30 rounded-sm"
          v-for="(value, index) in item.value" :key="index">
          <div class="absolute top-0 right-1 cursor-pointer z-10" @click="deleteItemList(item, index)">
            <span class="mdi mdi-close"></span>
          </div>
          <CustomFields :value="value" @change="(fields) => updateList(item, fields)" />
        </div>
        <button class="btn btn-sm" @click="addListItem(item)">+ Agregar</button>
      </template>
      <!-- All other field types -->
      <template v-else>
        <CustomField v-bind="item" @change="() => emit('change', { key, value: item.value })" @focus="emit('focus')"
          @keyup="(e) => emit('keyup', e)" @keydown="(e) => emit('keydown', e)"
          @update:value="(value) => item.value = value"
          @button:click="(buttonItem) => handleButtonClick(String(key), buttonItem)" />
      </template>
    </template>
  </template>
</template>

<script setup lang="ts">
import type { IPropertiesType } from '@shared/interface/node.properties.interface';
import CustomField from './customField.vue'
import { ref, watch } from 'vue'

const emit = defineEmits(['update:value', 'change', 'blur', 'focus', 'keyup', 'keydown', 'button:click'])
const props = defineProps<{
  value: { [key: string]: IPropertiesType }
}>()
const elementValue = ref<{ [key: string]: IPropertiesType } | null>(null)
const fieldInput = ref<HTMLInputElement | null>(null)

watch(
  () => props.value,
  () => {
    elementValue.value = props.value as { [key: string]: IPropertiesType }
  },
  {
    immediate: true
  }
)

const handleButtonClick = (key: string, item: Extract<IPropertiesType, { type: 'button' }>) => {
  emit('button:click', { key, action: item.action.click, item })
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

const updateList = (value: IPropertiesType, fields: any) => {
  emit('change', { key: fields.key, value })
}

const addListItem = (item: Extract<IPropertiesType, { type: 'list' }>) => {
  item.value.push(JSON.parse(JSON.stringify(item.object || {})))
}

const deleteItemList = (item: Extract<IPropertiesType, { type: 'list' }>, index: number) => {
  item.value.splice(index, 1)
}

defineExpose({ select, focus })
</script>
