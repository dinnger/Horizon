<template>
  <div class="json-node">
    <span 
      v-if="isExpandable" 
      @click="toggle" 
      class="toggler"
      role="button"
      tabindex="0"
      @keydown.enter="toggle"
      @keydown.space="toggle"
    >
      {{ expanded ? '[-]' : '[+]' }}
    </span>
    <span v-else class="toggler-placeholder"></span>

    <span v-if="nodeKey !== undefined && parentType !== 'array'" class="key ml-2">
      <span v-if="searchTerm && nodeKey.toLowerCase().includes(searchTerm.toLowerCase())" v-html="highlightText(nodeKey, searchTerm)"></span>
      <span v-else>{{ nodeKey }}</span>:
    </span>

    <template v-if="isObjectOrArray(nodeData)">
      <span v-if="!expanded" @click="toggle" class="preview-collapsed" role="button">
        {{ Array.isArray(nodeData) ? `Array[${nodeData.length}]` : 'Object{...}' }}
      </span>
      <div v-if="expanded" class="children">
        <JsonNode
          v-for="(value, keyOrIndex) in nodeData"
          :key="String(keyOrIndex)"
          :node-data="value"
          :node-key="Array.isArray(nodeData) ? undefined : String(keyOrIndex)"
          :parent-type="Array.isArray(nodeData) ? 'array' : 'object'"
          :path="`${path}${Array.isArray(nodeData) ? '['+keyOrIndex+']' : '.'+String(keyOrIndex)}`"
          :expanded-state="expandedState"
          :search-term="searchTerm"
          @toggle-expand="emitToggle"
          @copy-node="emitCopy"
        />
      </div>
    </template>
    <template v-else>
      <span :class="getValueType(nodeData)" @dblclick="copyCurrentNode">
        <span v-if="searchTerm && rawStringValue.toLowerCase().includes(searchTerm.toLowerCase())" v-html="highlightText(displayedValue, searchTerm)"></span>
        <span v-else>{{ displayedValue }}</span>
      </span>
    </template>
    <button @click="copyCurrentNode" class="copy-button" title="Copiar valor">📋</button>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps, defineEmits, toRefs } from 'vue';

const props = defineProps<{
  nodeData: any;
  nodeKey?: string;
  parentType?: 'object' | 'array';
  path: string;
  expandedState: Record<string, boolean>;
  searchTerm?: string; // Nueva prop
}>();

const { nodeData, searchTerm } = toRefs(props);

const emit = defineEmits(['toggle-expand', 'copy-node']);

const expanded = computed(() => !!props.expandedState[props.path]);

const rawStringValue = computed(() => String(nodeData.value));
const displayedValue = computed(() => displayValue(nodeData.value));

const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const highlightText = (text: string, term: string | undefined): string => {
  if (!term || term.trim() === '') return text;
  try {
    const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
  } catch (e) {
    // Si el término de búsqueda es una expresión regular inválida
    return text;
  }
};

const isObject = (value: any) => typeof value === 'object' && value !== null && !Array.isArray(value);
const isArray = (value: any) => Array.isArray(value);
const isObjectOrArray = (value: any) => isObject(value) || isArray(value);

const isExpandable = computed(() => {
  return (isObject(props.nodeData) && Object.keys(props.nodeData).length > 0) || 
         (isArray(props.nodeData) && props.nodeData.length > 0);
});

const toggle = () => {
  if (isExpandable.value) {
    emit('toggle-expand', props.path);
  }
};

const emitToggle = (path: string) => {
  emit('toggle-expand', path);
}

const emitCopy = (value: any) => {
  emit('copy-node', value);
}

const copyCurrentNode = () => {
  emit('copy-node', props.nodeData);
};

const displayValue = (value: any) => {
  if (typeof value === 'string') return `"${value}"`;
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  return String(value);
};

const getValueType = (value: any) => {
  if (typeof value === 'string') return 'json-string';
  if (typeof value === 'number') return 'json-number';
  if (typeof value === 'boolean') return 'json-boolean';
  if (value === null) return 'json-null';
  if (value === undefined) return 'json-undefined';
  return 'json-other';
};
</script>

<style scoped>
.json-node {
  margin-left: 5px;
  padding-left: 15px;
  border-left: 1px dashed #ccc;
  font-family: Menlo, Monaco, 'Courier New', monospace;
  /* font-size: 0.9em; */ /* Comentado en el original */
  position: relative;
}
.json-node:first-child {
  /* border-left: none; */ /* Consider if needed for root */
}
.toggler, .toggler-placeholder {
  cursor: pointer;
  margin-right: 5px;
  width: 15px; /* Ensure alignment */
  display: inline-block;
  user-select: none;
}
.toggler-placeholder {
  cursor: default;
}
.key {
  font-weight: bold;
  color: #994500; /* Brownish for keys */
}
.preview-collapsed {
  color: #777;
  font-style: italic;
  cursor: pointer;
}
.children {
  /* padding-left: 10px; */ /* Handled by .json-node margin-left */
}
.copy-button {
  margin-left: 8px;
  font-size: 0.8em;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0 3px;
  visibility: hidden; /* Hidden by default */
  opacity: 0.7;
}
.json-node:hover .copy-button {
  visibility: visible; /* Show on hover */
}
.copy-button:hover {
  opacity: 1;
}
.json-string { color: #008000; } /* Green */
.json-number { color: #0000ff; } /* Blue */
.json-boolean { color: #ff00ff; } /* Magenta */
.json-null { color: #808080; } /* Gray */
.json-undefined { color: #aaaaaa; font-style: italic; }
</style>
<style>
/* Estilo global o en un bloque <style> no scoped si es necesario, o duplicar en dataNode.vue */
.search-highlight {
  background-color: yellow;
  color: black;
  font-weight: bold;
}
</style>
