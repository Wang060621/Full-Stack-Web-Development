<script setup>
defineProps({
  type: { type: String, default: 'info' },
  title: { type: String, required: true },
  message: { type: String, default: '' }
});
</script>

<template>
  <div
    class="status-panel"
    :class="`status-${type}`"
    :role="type === 'error' ? 'alert' : 'status'"
    :aria-live="type === 'error' ? 'assertive' : 'polite'"
  >
    <strong>{{ title }}</strong>
    <span v-if="message">{{ message }}</span>
    <slot />
  </div>
</template>
