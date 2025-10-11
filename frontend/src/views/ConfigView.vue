<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import ConfigTabs from '@/components/config/ConfigTabs.vue'

const route = useRoute()
</script>

<template>
  <div class="config-view">
    <div class="config-header">
      <h1 class="text-2xl font-semibold mb-lg">Configuration</h1>
      <ConfigTabs />
    </div>

    <div class="config-content">
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.config-view {
  display: grid;
  gap: var(--space-xl);
}

.config-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.config-content {
  container-type: inline-size;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .config-header {
    gap: var(--space-md);
  }
  
  .config-header h1 {
    font-size: var(--font-size-xl);
  }
}
</style>
