<script setup lang="ts">
import { onMounted } from 'vue'
import { useHomeStore } from '@/stores/home'
import DateNavigation from '@/components/home/DateNavigation.vue'
import DepartmentGrid from '@/components/home/DepartmentGrid.vue'
import ServiceGrid from '@/components/home/ServiceGrid.vue'

const homeStore = useHomeStore()

onMounted(() => {
  homeStore.fetchOverrides()
})
</script>

<template>
  <div class="home-view">
    <div class="home-header">
      <h1 class="text-2xl font-semibold mb-lg">Staff Schedule</h1>
      <DateNavigation />
    </div>

    <div class="home-content">
      <!-- Departments Section -->
      <section class="departments-section">
        <h2 class="text-xl font-medium mb-md">Departments</h2>
        <DepartmentGrid />
      </section>

      <!-- Services Section -->
      <section class="services-section">
        <h2 class="text-xl font-medium mb-md">Services</h2>
        <ServiceGrid />
      </section>
    </div>
  </div>
</template>

<style scoped>
.home-view {
  display: grid;
  gap: var(--space-xl);
}

.home-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.home-content {
  display: grid;
  gap: var(--space-xl);
}

.departments-section,
.services-section {
  container-type: inline-size;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .home-header {
    gap: var(--space-md);
  }

  .home-content {
    gap: var(--space-lg);
  }

  .home-header h1 {
    font-size: var(--font-size-xl);
  }

  .departments-section h2,
  .services-section h2 {
    font-size: var(--font-size-lg);
  }
}
</style>
