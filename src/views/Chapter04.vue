<template>
  <div class="view chapter-04">
    <h1>Chapter 04</h1>
    <d3-sandbox-ch04-lissajous></d3-sandbox-ch04-lissajous>
    <d3-sandbox-ch04-transition></d3-sandbox-ch04-transition>
    <d3-sandbox-ch04-drag-and-drop></d3-sandbox-ch04-drag-and-drop>
    <d3-sandbox-ch04></d3-sandbox-ch04>
  </div>
</template>

<script>
import D3SandboxCh04 from "@/components/D3Sandbox-Ch04";
import D3SandboxCh04DragAndDrop from "@/components/D3Sandbox-Ch04-DragAndDrop";
import D3SandboxCh04Transition from "@/components/D3Sandbox-Ch04-Transition";
import D3SandboxCh04Lissajous from "@/components/D3Sandbox-Ch04-Lissajous";

export default {
  name: "Chapter03",
  components: {
    D3SandboxCh04,
    D3SandboxCh04DragAndDrop,
    D3SandboxCh04Transition,
    D3SandboxCh04Lissajous
  }
}
</script>

<style scoped>

</style>
