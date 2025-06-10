<template>
  <div :class="`content-monaco h-32 relative mb-1 ${is_expand ? 'expand' : ''}`">
    <div class="expand absolute -top-4 right-0 z-10 cursor-pointer" @click="expand">
      <span class="mdi mdi-arrow-expand-all"></span>
    </div>
    <div v-if="is_expand" class="absolute top-4 right-8 z-10 cursor-pointer" @click="expand">
      <span class="mdi mdi-close"></span>
    </div>
    <div class="label" v-if="is_expand">
      {{ name || label }}
    </div>
    <div ref="editorContainer" id="editor" style="width: 100%; height: 100%;"></div>
    <!-- {{ editor }} -->
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useMain } from '../../stores/main';
// @ts-ignore
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
// @ts-ignore
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
// @ts-ignore
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
// @ts-ignore
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
// @ts-ignore
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'


// import { useMain } from '../../stores/main'

// const main = useMain()
const main = useMain()
let editorInstance: any = null
let completionProvider: any = null

const props = defineProps<{
  lang: 'sql' | 'json' | 'js' | 'string',
  suggestions?: { label: string, value: any }[],
  value: any,
  disabled?: boolean,
  dataProperties?: any,
  name?: string,
  label?: string
}>()
const emit = defineEmits(['update:value'])

const editorContainer = shallowRef(null)
const is_expand = ref(false)

const expand = () => {
  is_expand.value = !is_expand.value

  editorInstance.updateOptions({
    lineNumbers: is_expand.value ? 'on' : 'off' as const,
    minimap: { enabled: is_expand.value },
  })
}

watch(() => props.value, (value) => {
  if (editorInstance) {
    const val = typeof value === 'object' ? JSON.stringify(value, null, 2) : value
    if (val !== editorInstance.getValue()) {
      editorInstance.setValue(val)
    }
  }
})

watch(() => main.theme, (value) => {
  if (editorInstance) {
    editorInstance.updateOptions({
      theme: value === 'dark' ? 'vs-dark' : 'vs-light'
    })
  }
})

watch(() => props.disabled, (value) => {
  if (editorInstance) {
    editorInstance.updateOptions({
      readOnly: value
    })
  }
})

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new JsonWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new CssWorker()
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new HtmlWorker()
    }
    if (label === 'js') {
      return new TsWorker()
    }
    return new EditorWorker()
  }
}

onMounted(async () => {
  const { monaco, suggestion } = await import('./monaco')

  // biome-ignore lint/complexity/useArrowFunction: <explanation>
  nextTick(function () {
    if (editorContainer.value === null) return
    let lang = (Array.isArray(props.lang) ? props.lang[0] : props.lang)
    if (lang === 'js') lang = 'javascript'
    // Crea la instancia del editor dentro del contenedor
    editorInstance = monaco.editor.create(editorContainer.value, {
      value: typeof props.value === 'object' ? JSON.stringify(props.value, null, 2) : props.value,
      language: lang,
      theme: main.theme === 'dark' ? 'vs-dark' : 'vs-light',
      automaticLayout: true,  // Hace que el editor se ajuste automáticamente al tamaño del contenedor
      fontFamily: 'Comfortaa Variable',
      fontSize: 13,
      lineNumbers: 'off' as const,
      formatOnType: true,
      formatOnPaste: true,
      scrollBeyondLastLine: false,
      readOnly: props.disabled,
      minimap: { enabled: false },
    })

    // Registro del CompletionItemProvider para sugerir "test.abc" y "test.123"
    const pSuggestions = props.suggestions
    if (pSuggestions) {
      suggestion(pSuggestions, props.lang)
    }

    editorInstance.onDidChangeModelContent(() => {
      const currentValue = editorInstance.getValue()
      if (currentValue !== props.value) {
        emit('update:value', currentValue)
      }
    })
  })

})

onBeforeUnmount(() => {
  if (editorInstance) {
    editorInstance.dispose();
    editorInstance = null
  }
  if (completionProvider) {
    completionProvider.dispose();
    completionProvider = null
  }
});

</script>

<style scoped>
.content-monaco .label {
  display: none;
}

.content-monaco.expand {
  background-color: rgba(0, 0, 0, .7);
  backdrop-filter: blur(10px);
  position: fixed;
  z-index: 99999;
  top: 0 !important;
  left: 0 !important;
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: 30px;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  box-sizing: border-box;
}

.content-monaco.expand .expand {
  display: none;
}

.content-monaco.expand .label {
  display: block;
}

.content-monaco.expand #editor {
  height: calc(100% - 30px) !important;
}
</style>