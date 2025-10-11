<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { useConfigStore } from '@/stores/config'
import AppHeader from '@/components/AppHeader.vue'
import ErrorBoundary from '@/components/ErrorBoundary.vue'

const configStore = useConfigStore()

onMounted(() => {
  // Load initial data when app starts
  configStore.fetchAllData()
})
</script>

<template>
  <div id="app">
    <AppHeader />
    <main class="container">
      <ErrorBoundary>
        <RouterView />
      </ErrorBoundary>
    </main>
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
  padding: var(--space-lg) 0;
  width: 100%;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-md);
  width: 100%;
}

@media (max-width: 768px) {
  main {
    padding: var(--space-md) 0;
  }

  .container {
    padding: 0 var(--space-sm);
  }
}
</style>
