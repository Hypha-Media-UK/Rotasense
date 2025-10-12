<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

interface Props {
  fallback?: string
}

const props = withDefaults(defineProps<Props>(), {
  fallback: 'Something went wrong. Please try refreshing the page.'
})

const error = ref<Error | null>(null)
const hasError = ref(false)

onErrorCaptured((err: Error) => {
  console.error('Error caught by boundary:', err)
  error.value = err
  hasError.value = true
  return false // Prevent the error from propagating further
})

function retry() {
  hasError.value = false
  error.value = null
}

function refreshPage() {
  window.location.reload()
}
</script>

<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-content">
      <div class="error-icon">⚠️</div>
      <h2 class="error-title">Oops! Something went wrong</h2>
      <p class="error-message">{{ props.fallback }}</p>
      <div v-if="error" class="error-details">
        <details>
          <summary>Technical Details</summary>
          <pre class="error-stack">{{ error.message }}</pre>
        </details>
      </div>
      <div class="error-actions">
        <button @click="retry" class="btn btn-primary">Try Again</button>
        <button @click="refreshPage" class="btn">Refresh Page</button>
      </div>
    </div>
  </div>
  <slot v-else />
</template>


