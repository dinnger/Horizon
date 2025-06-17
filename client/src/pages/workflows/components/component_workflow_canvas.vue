<template>
  <div class="relative w-full h-full box-content overflow-hidden">
    <canvas ref="canvas" :style="{ cursor: select_type === 'move' ? 'move' : 'default' }" />
    <template v-if="canvasInstance">
      <component_canvas_tools :canvasInstance="canvasInstance" :select_type="select_type" :workflow="data_workflow"
        @select_type="(value: 'cursor' | 'move') => select_type = value">
      </component_canvas_tools>
      <component_canvas_new v-if="new_node_start" :new_node_start="new_node_start" :data_nodes="data_nodes"
        :canvasInstance="canvasInstance">
      </component_canvas_new>
      <component_workflow_context v-if="selectedContext && selectedContext.length > 0"
        :selectedContext="selectedContext" :selectedCanvasTranslate="selectedCanvasTranslate" :refresh="context_menu">
      </component_workflow_context>
      <component_workflow_context_connection v-if="connection_properties_context" :canvasInstance="canvasInstance"
        :connection_properties_context="connection_properties_context">
      </component_workflow_context_connection>

      <component_workflow_properties v-if="selected" :selected="selected">
      </component_workflow_properties>
    </template>
  </div>
</template>

<script setup lang="ts">
import type {
  INodeCanvas
} from "@shared/interface/node.interface.js";
import type { ICanvasNodeNew } from '../utils/canvasNodes.js'
import { onMounted, onUnmounted, ref, watch } from "vue";
import { Canvas } from "../utils/canvas";
import { useMain } from "../../../stores/main";
import { toast } from "vue-sonner";
import { useSocket } from "../../../stores/socket";
import component_canvas_tools from "./component_workflow_tools.vue";
import component_canvas_new from "./component_workflow_new.vue";
import component_workflow_properties from "./component_workflow_properties.vue";
import component_workflow_context from "./component_workflow_context.vue";
import component_workflow_context_connection from "./component_workflow_context_connection.vue";
import type { IWorkflow } from "@shared/interface/workflow.interface";
import type { ICommunicationTypes } from "@shared/interface/connect.interface";
const main = useMain();
const socket = useSocket();

const props = defineProps<{
  uid: string
  data_workflow: IWorkflow;
  data_nodes: INodeCanvas[];
}>();
const emit = defineEmits(["canvasInstance"]);

const canvas = ref<HTMLCanvasElement | null>(null);
const theme = ref<string>(main.theme);
const canvasInstance = ref<Canvas>();
const select_type = ref<"cursor" | "move">("cursor");
const selected = ref<ICanvasNodeNew[]>();
const selectedContext = ref<ICanvasNodeNew[]>();
const selectedCanvasTranslate = ref<INodeCanvas['design']>();
const connection_properties_context = ref<{
  id: string;
  nodeOrigin: INodeCanvas;
  nodeDestiny: INodeCanvas;
  input: string;
  output: string;
} | null>();
const new_node_start = ref<{
  node: INodeCanvas;
  output_index: number;
  design: INodeCanvas['design'];
  relative_pos: INodeCanvas['design'];
} | null>();

watch(
  () => main.theme,
  (value) => {
    if (!canvasInstance.value) return;
    theme.value = value;
    canvasInstance.value.change_theme(main.theme);
  }
);



onMounted(() => {
  if (!canvas.value) return;
  const workflow = props.data_workflow;
  canvasInstance.value = new Canvas({
    canvas: canvas.value,
    theme: theme.value,
  });
  canvasInstance.value.init({
    nodes: workflow?.nodes,
    connections: workflow?.connections
  });


  canvasInstance.value.listener('node_added', ({ node, output_index, design, relative_pos }: any) => {
    if (node && output_index !== null && design && relative_pos) {
      new_node_start.value = {
        node,
        output_index: output_index || 0,
        design,
        relative_pos,
      };
    } else {
      new_node_start.value = null;
    }
  })

  canvasInstance.value.listener('node_properties_context', ({ selected, canvasTranslate }: any) => {
    selected.value = selected
    selectedCanvasTranslate.value = canvasTranslate
  })

  canvasInstance.value.listener('context_menu', (data: any) => {
    if (!data) return

    const { nodes, canvasTranslate } = data
    selectedContext.value = nodes as ICanvasNodeNew[];
    selectedCanvasTranslate.value = canvasTranslate
  })
  canvasInstance.value.listener('node_connection_context', (data) => {
    if (data) {
      const { id, nodeOrigin, nodeDestiny, input, output } = data;
      connection_properties_context.value = {
        id,
        nodeOrigin,
        nodeDestiny,
        input,
        output,
      };
    } else {
      connection_properties_context.value = null;
    }
  })

  const virtualServer = ({ event, data }: { event: ICommunicationTypes, data: any }) => {
    socket.socketEmit("server/workflows/virtual/actions", {
      type: event,
      flow: props.uid,
      node: data.node,
    });
  }

  canvasInstance.value.event_subscriber(["dataNode", 'statsNode', 'virtualAddNode', 'virtualRemoveNode'], ({ event, data }) => {
    virtualServer({ event, data })
  });

  canvasInstance.value.event_subscriber("virtualChangePosition", ({ data }) => {
    socket.socketEmit("server/workflows/virtual/nodeUpdate", {
      flow: props.uid,
      type: "virtualChangePosition",
      data: { idNode: data.node.id, value: { x: data.node.x, y: data.node.y } },
    });
  });

  canvasInstance.value.event_subscriber("virtualChangeMeta", ({ data }) => {
    socket.socketEmit("server/workflows/virtual/nodeUpdate", {
      flow: props.uid,
      type: "virtualChangeMeta",
      data: { idNode: data.id, value: data.meta },
    });
  });

  canvasInstance.value.event_subscriber("virtualChangeProperties", ({ data }) => {
    const flow = props.uid
    const { node, key, value } = data
    const arr = selected.value
    if (!arr || !Array.isArray(arr) || arr.length === 0) return
    const selectedNode = arr[0]
    socket.socketEmit(
      'server/workflows/virtual/nodeProperty',
      { flow, node: { id: node.id, type: node.type }, key, value: value },
      (value: { error?: string } & any[]) => {
        if (value?.error) return console.log(value.error)
        if (!value || typeof value !== 'object' || Object.keys(value).length === 0) return

        selectedNode.isLockedProperty = true
        // inputs/outputs
        // const inputs = value.find((item: any) => item.key === '_inputs_')
        // const outputs = value.find((item: any) => item.key === '_outputs_')
        // if (inputs) {
        //   selectedNode.inputs = inputs.value
        //   selectedNode.update()
        // }
        // if (outputs) {
        //   selectedNode.outputs = outputs.value
        //   selectedNode.update()
        //   selectedNode.updateConnectionsOutput({
        //     before: outputs.before,
        //     after: outputs.value
        //   })
        // }

        for (const item of value) {
          let property: any = selectedNode?.properties || {}
          const keys = item.key.split('.')
          if (keys.length > 1 && keys[0] === '_') keys.shift()
          for (let i = 0; i < keys.length - 1; i++) {
            property = property[keys[i]]
          }
          if (keys.length > 1) {
            property[keys[keys.length - 1]] = item.value
          }
        }
        setTimeout(() => {
          selectedNode.isLockedProperty = false
        }, 100);
      }
    )
  });

  canvasInstance.value.event_subscriber("virtualAddConnection", ({ data }) => {
    socket.socketEmit("server/workflows/virtual/connectionAdd", {
      flow: props.uid,
      data
    });
  });

  canvasInstance.value.event_subscriber("removeConnection", ({ data }) => {
    socket.socketEmit("server/workflows/virtual/connectionRemove", {
      flow: props.uid,
      id: data.id,
    });
  });

  canvasInstance.value.event_subscriber(
    "connectionError",
    ({ data }: { data: { type: "info" | "error"; msg: string } }) => {
      toast[data.type](data.msg);
    }
  );


  console.log({ flow: workflow })
  // Nodes
  if (!workflow?.nodes || Object.entries(workflow.nodes).length === 0) {
    const node: INodeCanvas | null =
      props.data_nodes.find((f) => f.type === "workflow_init") || null;
    if (!node) return;

    if (canvasInstance.value) canvasInstance.value.actionAddNode({
      node: {
        design: { x: 60, y: 60 },
        type: node.type,
        info: node.info,
        properties: node.properties
      }, isManual: true
    });
  }

  emit("canvasInstance", canvasInstance.value);

  // Trace
  socket.socketOn("trace", (value) => {
    const data: {
      [id: string]: {
        inputs: { data: { [key: string]: number }; length: number };
        outputs: { data: { [key: string]: number }; length: number };
      };
    } = value as any;
    canvasInstance?.value?.actionTrace(data);
  });
});

onUnmounted(() => {
  if (canvasInstance.value) {
    canvasInstance.value.event_mouse_end();
    canvasInstance.value.destroy();
  }
  // remove events
  if (!canvas.value) return;
  socket.socketOff("trace");
});

</script>
