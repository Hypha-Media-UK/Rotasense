<script setup lang="ts">
import { useHomeStore } from '@/stores/home'
import ServiceCard from './ServiceCard.vue'

const homeStore = useHomeStore()
</script>

<template>
  <div class="service-grid">
    <div v-if="homeStore.serviceStatuses.length === 0" class="empty-state">
      <p class="text-muted">No services are operational or have staff assigned for this day.</p>
    </div>
    
    <ServiceCard
      v-for="serviceStatus in homeStore.serviceStatuses"
      :key="serviceStatus.service.id"
      :service-status="serviceStatus"
    />
  </div>
</template>

<style scoped>
.service-grid {
  display: grid;
  gap: var(--space-md);
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: var(--space-xl);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

/* Container queries for responsive grid */
@container (min-width: 768px) {
  .service-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
}

@container (min-width: 1024px) {
  .service-grid {
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .service-grid {
    grid-template-columns: 1fr;
    gap: var(--space-sm);
  }
}
</style>
