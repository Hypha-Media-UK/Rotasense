<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

interface Props {
  show: boolean
  title: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
})

const emit = defineEmits<{
  close: []
}>()

function closeModal() {
  emit('close')
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.show) {
    closeModal()
  }
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    closeModal()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
  if (props.show) {
    document.body.style.overflow = 'hidden'
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})

// Watch for show prop changes to manage body overflow
import { watch } from 'vue'
watch(() => props.show, (newShow) => {
  if (newShow) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click="handleBackdropClick">
        <div class="modal-container" :class="`modal-${size}`">
          <div class="modal-header">
            <h3 class="modal-title">{{ title }}</h3>
            <button @click="closeModal" class="modal-close" aria-label="Close modal">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div class="modal-body">
            <slot />
          </div>
          
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-md);
}

.modal-container {
  background: var(--color-background);
  border-radius: var(--radius-lg);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-sm {
  width: 100%;
  max-width: 400px;
}

.modal-md {
  width: 100%;
  max-width: 600px;
}

.modal-lg {
  width: 100%;
  max-width: 800px;
}

.modal-xl {
  width: 100%;
  max-width: 1200px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg);
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  color: var(--color-text-muted);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: var(--color-surface);
  color: var(--color-text);
}

.modal-body {
  padding: var(--space-lg);
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: var(--space-lg);
  border-top: 1px solid var(--color-border);
  display: flex;
  gap: var(--space-sm);
  justify-content: flex-end;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9) translateY(-20px);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .modal-overlay {
    padding: var(--space-sm);
  }
  
  .modal-container {
    max-height: 95vh;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: var(--space-md);
  }
  
  .modal-footer {
    flex-direction: column;
  }
}
</style>
