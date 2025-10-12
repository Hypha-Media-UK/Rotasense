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
    <main>
      <ErrorBoundary>
        <RouterView />
      </ErrorBoundary>
    </main>
  </div>
</template>


