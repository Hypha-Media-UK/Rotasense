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

<style scoped>
.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(2px);
  z-index: 1000;
}

.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

.spinner {
  border: 3px solid var(--color-border);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-sm {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

.spinner-md {
  width: 32px;
  height: 32px;
  border-width: 3px;
}

.spinner-lg {
  width: 48px;
  height: 48px;
  border-width: 4px;
}

.loading-text {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  text-align: center;
  margin: 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
    border-top-color: var(--color-primary);
  }
}
</style>
