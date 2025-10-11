<script setup lang="ts">
import { useHomeStore } from '@/stores/home'
import DepartmentCard from './DepartmentCard.vue'

const homeStore = useHomeStore()
</script>

<template>
  <div class="department-grid">
    <div v-if="homeStore.departmentStatuses.length === 0" class="empty-state">
      <p class="text-muted">No departments are operational or have staff assigned for this day.</p>
    </div>
    
    <DepartmentCard
      v-for="departmentStatus in homeStore.departmentStatuses"
      :key="departmentStatus.department.id"
      :department-status="departmentStatus"
    />
  </div>
</template>

<style scoped>
.department-grid {
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
  .department-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
}

@container (min-width: 1024px) {
  .department-grid {
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .department-grid {
    grid-template-columns: 1fr;
    gap: var(--space-sm);
  }
}
</style>
