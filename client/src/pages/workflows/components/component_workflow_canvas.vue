<template>
  <div class="relative w-full h-full box-content overflow-hidden">
    <canvas ref="canvas" :style="{ cursor: select_type === 'move' ? 'move' : 'default' }"
      @contextmenu.prevent="context_menu" />
    <template v-if="canvasInstance">
      <component_canvas_tools :canvasInstance="canvasInstance" :select_type="select_type" :workflow="data_workflow"
        @select_type="(value: 'cursor' | 'move') => select_type = value">
      </component_canvas_tools>
      <component_canvas_new v-if="new_node_start" :new_node_start="new_node_start" :data_nodes="data_nodes"
        :canvasInstance="canvasInstance">
      </component_canvas_new>

      <component_workflow_context v-if="context_menu_show" :canvasInstance="canvasInstance">
      </component_workflow_context>
      <component_workflow_context_connection v-if="connection_properties_context" :canvasInstance="canvasInstance"
        :connection_properties_context="connection_properties_context">
      </component_workflow_context_connection>

      <component_workflow_properties v-if="property_show" :selected="property_show.selected">
      </component_workflow_properties>
    </template>
  </div>
</template>

<script setup lang="ts">
import type {
  INode,
} from "@shared/interface/node.interface.js";
import type { SubscriberType } from '@shared/interfaces/class.interface'
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
import type { INodeCanvasNewClass } from "@shared/interface/node.interface";
import type { INodeCanvasNew } from "@shared/interface/node.interface";
import type { INodeCanvas } from "@shared/interface/node.interface";
const main = useMain();
const socket = useSocket();

const props = defineProps<{
  data_workflow: IWorkflowWorkerEntity;
  data_nodes: INodeCanvas[];
}>();
const emit = defineEmits(["canvasInstance"]);

const canvas_drag = ref(false);
const canvas = ref<HTMLCanvasElement | null>(null);
const theme = ref<string>(main.theme);
const canvasInstance = ref<Canvas>();
const select_type = ref<"cursor" | "move">("cursor");
const property_show = ref<{ selected: INodeCanvasNewClass[] } | null>(null);
const context_menu_show = ref(false);
const connection_properties_context = ref<{
  id: string;
  node_origin: INode;
  node_destiny: INode;
  input: string;
  output: string;
} | null>();
const new_node_start = ref<{
  node: INode;
  output_index: number;
  pos: ICanvasPoint;
  relative_pos: ICanvasPoint;
} | null>();

watch(
  () => main.theme,
  (value) => {
    if (!canvasInstance.value) return;
    theme.value = value;
    canvasInstance.value.change_theme(main.theme);
  }
);

const windowListenerResize = () => {
  if (!canvasInstance.value) return;
  canvasInstance.value.event_resize();
};

const canvas_listener_mouse_down = (e: MouseEvent) => {
  if (!canvasInstance.value) return;
  e.preventDefault();
  canvasInstance.value.event_mouse_init({
    x: e.clientX,
    y: e.clientY,
    button: e.button,
  });
  canvas_drag.value = true;
  // Si se pulsa botón central
  if (e.button === 1) {
    document_listener_mouse_up(e);
    select_type.value = "move";
  }
};

const canvas_listener_mouse_up = (e: MouseEvent) => {
  if (!canvasInstance.value) return;
  e.preventDefault();
  e.stopPropagation();
  canvas_drag.value = false;
  if (e.button === 1) select_type.value = "cursor";
  if (e.button === 0) canvasInstance.value.event_mouse_end();
};

const canvas_listener_mouse_move = (e: MouseEvent) => {
  if (!canvasInstance.value) return;
  canvasInstance.value.event_mouse_relative({ x: e.offsetX, y: e.offsetY });
  if (select_type.value === "cursor" && e.buttons === 1 && canvas_drag.value) {
    canvasInstance.value.event_mouse_cursor();
  }
  if ((select_type.value === "move" && e.buttons === 1) || e.buttons === 4) {
    if (e.buttons === 4) select_type.value = "move";
    canvasInstance.value.event_mouse_move({ x: e.clientX, y: e.clientY });
  }
};

const canvas_listener_double_click = () => {
  if (!canvasInstance.value) return;
  canvasInstance.value.event_mouse_double_click();
};

const canvas_listener_wheel = (e: WheelEvent) => {
  if (!canvasInstance.value) return;
  canvasInstance.value.event_scroll_zoom({ deltaY: e.deltaY });
};

const document_listener_mouse_up = (e: MouseEvent) => {
  if (!canvasInstance.value || property_show.value) return;
  e.preventDefault();
  if (e.button === 1) select_type.value = "cursor";
  canvasInstance.value.event_mouse_end({ all: true });
};

const context_menu = () => {
  if (!canvasInstance.value) return;
  canvasInstance.value.event_context_menu();
};

onMounted(() => {
  if (!canvas.value) return;
  const flow = props.data_workflow.flow;
  canvasInstance.value = new Canvas({
    canvas: canvas.value,
    theme: theme.value,
  });
  canvasInstance.value.init({
    nodes: flow?.nodes,
    connections: flow?.connections,
  });

  canvasInstance.value.event_resize();

  canvas.value.addEventListener("mousedown", canvas_listener_mouse_down);
  canvas.value.addEventListener("mouseup", canvas_listener_mouse_up);
  canvas.value.addEventListener("mousemove", canvas_listener_mouse_move);
  canvas.value.addEventListener("wheel", canvas_listener_wheel);
  canvas.value.addEventListener("dblclick", canvas_listener_double_click);
  window.addEventListener("resize", windowListenerResize);
  document.addEventListener("mouseup", document_listener_mouse_up);

  canvasInstance.value.events_new_node_start = ({
    node,
    output_index,
    pos,
    relative_pos,
  }) => {
    if (node && output_index !== null && pos && relative_pos) {
      new_node_start.value = {
        node,
        output_index: output_index || 0,
        pos,
        relative_pos,
      };
    } else {
      new_node_start.value = null;
    }
  };

  canvasInstance.value.events_show_properties = (data: { selected: INodeCanvasNewClass[] } | null) => {
    property_show.value = data;
  };

  canvasInstance.value.events_context_menu = ({ show }) => {
    context_menu_show.value = show;
  };

  canvasInstance.value.events_show_connection_context = (data) => {
    if (data) {
      const { id, node_origin, node_destiny, input, output } = data;
      connection_properties_context.value = {
        id,
        node_origin,
        node_destiny,
        input,
        output,
      };
    } else {
      connection_properties_context.value = null;
    }
  };

  const virtualServer = ({ event, data }: { event: SubscriberType, data: any }) => {
    socket.socketEmit("server/workflows/virtual/actions", {
      type: event,
      flow: props.data_workflow.uid,
      node: data.node,
    });
  }

  canvasInstance.value.event_subscriber(["dataNode", 'statsNode', 'addNode', 'removeNode'], ({ event, data }) => {
    virtualServer({ event, data })
  });

  canvasInstance.value.event_subscriber("changePosition", ({ data }) => {
    socket.socketEmit("server/workflows/virtual/nodeUpdate", {
      flow: props.data_workflow.uid,
      type: "position",
      idNode: data.node.id,
      value: { x: data.node.x, y: data.node.y },
    });
  });

  canvasInstance.value.event_subscriber("changeMeta", ({ data }) => {
    socket.socketEmit("server/workflows/virtual/nodeUpdate", {
      flow: props.data_workflow.uid,
      type: "meta",
      idNode: data.id,
      value: data.meta,
    });
  });

  canvasInstance.value.event_subscriber("addConnection", ({ data }) => {
    socket.socketEmit("server/workflows/virtual/connectionAdd", {
      flow: props.data_workflow.uid,
      id: data.id,
      id_node_origin: data.id_node_origin,
      output: data.output,
      id_node_destiny: data.id_node_destiny,
      input: data.input,
    });
  });

  canvasInstance.value.event_subscriber("removeConnection", ({ data }) => {
    socket.socketEmit("server/workflows/virtual/connectionRemove", {
      flow: props.data_workflow.uid,
      id: data.id,
    });
  });

  canvasInstance.value.event_subscriber(
    "connectionError",
    ({ data }: { data: { type: "info" | "error"; msg: string } }) => {
      toast[data.type](data.msg);
    }
  );

  // Nodes
  if (!flow?.nodes || Object.entries(flow.nodes).length === 0) {
    const node: INodeCanvas | null =
      props.data_nodes.find((f) => f.type === "workflow_init") || null;
    if (!node) return;
    node.design = { x: 60, y: 60, width: 90, height: 90 };
    node.isManual = true;
    console.log({ node })
    if (canvasInstance.value) canvasInstance.value.actionAddNode(node);
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
  canvas.value.removeEventListener("mousedown", canvas_listener_mouse_down);
  canvas.value.removeEventListener("mouseup", canvas_listener_mouse_up);
  canvas.value.removeEventListener("mousemove", canvas_listener_mouse_move);
  canvas.value.removeEventListener("wheel", canvas_listener_wheel);
  canvas.value.removeEventListener("dblclick", canvas_listener_double_click);
  window.removeEventListener("resize", windowListenerResize);
  document.removeEventListener("mouseup", document_listener_mouse_up);
  socket.socketOff("trace");
});

defineExpose({ windowListenerResize });
</script>
