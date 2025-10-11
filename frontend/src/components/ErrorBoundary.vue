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

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: var(--space-xl);
}

.error-content {
  text-align: center;
  max-width: 500px;
  padding: var(--space-xl);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.error-icon {
  font-size: 3rem;
  margin-bottom: var(--space-md);
}

.error-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-sm);
}

.error-message {
  color: var(--color-text-muted);
  margin-bottom: var(--space-lg);
  line-height: 1.6;
}

.error-details {
  margin-bottom: var(--space-lg);
  text-align: left;
}

.error-details summary {
  cursor: pointer;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-sm);
}

.error-stack {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-sm);
  font-size: var(--font-size-xs);
  color: var(--color-error);
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.error-actions {
  display: flex;
  gap: var(--space-sm);
  justify-content: center;
  flex-wrap: wrap;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .error-boundary {
    padding: var(--space-lg);
    min-height: 300px;
  }

  .error-content {
    padding: var(--space-lg);
  }

  .error-actions {
    flex-direction: column;
  }
}
</style>
