<template>
    <div ref="consoleRef" class="bg-black/10 flex-1 p-2 rounded-md overflow-auto">
        <NCode :code="consoleData" word-wrap language="javascript" />
    </div>

</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { NCode } from 'naive-ui';
import { useSocket } from '../../../../stores/socket';
const store = useSocket()

const consoleData = ref<string>('')
const consoleRef = ref<HTMLDivElement>()
onMounted(() => {

    store.socketOn('getLogs', (value: any) => {
        for (const item of value) {
            consoleData.value += `${item.date} ${item?.node || ''} ${item.level} ${JSON.stringify(item.message)}\n`
        }

        setTimeout(() => {
            if (consoleRef.value) consoleRef.value.scrollTop = consoleRef.value.scrollHeight
        }, 100)

    })
})
</script>