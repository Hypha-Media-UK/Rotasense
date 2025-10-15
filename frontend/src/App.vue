<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted, onUnmounted } from 'vue'
import { useConfigStore } from '@/stores/config'
import AppHeader from '@/components/AppHeader.vue'
import ErrorBoundary from '@/components/ErrorBoundary.vue'

const configStore = useConfigStore()

// Auto-refresh data when window regains focus (useful after bulk edits)
function handleWindowFocus() {
  // Only refresh if we're not currently loading to avoid multiple simultaneous requests
  if (!configStore.loading) {
    configStore.fetchAllData()
  }
}

onMounted(() => {
  // Load initial data when app starts
  configStore.fetchAllData()

  // Add window focus listener for auto-refresh
  window.addEventListener('focus', handleWindowFocus)
})

onUnmounted(() => {
  // Clean up event listener
  window.removeEventListener('focus', handleWindowFocus)
})
</script>

<template>
  <div id="app">
    <AppHeader />
    <main>
      <ErrorBoundary>
        <RouterView />
      </ErrorBoundary>
    </main>
  </div>
</template>


