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
      <div v-if="show" @click="handleBackdropClick" class="modal-backdrop">
        <dialog open :class="`modal-${size}`" class="modal-dialog">
          <header>
            <h3>{{ title }}</h3>
            <button @click="closeModal" aria-label="Close modal">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </header>

          <main>
            <slot />
          </main>

          <footer v-if="$slots.footer">
            <slot name="footer" />
          </footer>
        </dialog>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  background: rgba(0, 0, 0, 0.5) !important;
  z-index: 9999 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.modal-dialog {
  position: relative !important;
  background: white !important;
  border-radius: 8px !important;
  padding: 0 !important;
  border: none !important;
  max-width: 90vw !important;
  max-height: 90vh !important;
  overflow: auto !important;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
}

.modal-dialog header {
  padding: 1rem !important;
  border-bottom: 1px solid #e5e7eb !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
}

.modal-dialog main {
  padding: 1rem !important;
}

.modal-dialog footer {
  padding: 1rem !important;
  border-top: 1px solid #e5e7eb !important;
  display: flex !important;
  justify-content: flex-end !important;
  gap: 0.5rem !important;
}
</style>


