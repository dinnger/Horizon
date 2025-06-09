<template>
    <div class="download">

    </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useSocket } from '../../stores/socket';

const socket = useSocket()

const file = ref<Blob | null>(null)

onMounted(() => {
    socket.socketEmit('event:file', {}, (value: { error?: string, file?: Blob }) => {
        if (value.error) return console.log(value.error)
        console.log(value)
    })
})
</script>

<style scoped>
.download {
    position: fixed;
    bottom: 0;
    right: 0;
    width: 100px;
    height: 100px;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>