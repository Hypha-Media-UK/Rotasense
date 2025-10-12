<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  overlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  text: '',
  overlay: false
})

const sizeClasses = {
  sm: 'spinner-sm',
  md: 'spinner-md',
  lg: 'spinner-lg'
}
</script>

<template>
  <div
    class="loading-spinner"
    :class="{ 'loading-overlay': props.overlay }"
  >
    <div class="spinner-container">
      <div
        class="spinner"
        :class="sizeClasses[props.size]"
      ></div>
      <p v-if="props.text" class="loading-text">{{ props.text }}</p>
    </div>
  </div>
</template>


