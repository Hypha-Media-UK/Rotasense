<script setup lang="ts">
import { computed } from 'vue'
import { useHomeStore } from '@/stores/home'
import RunnerPoolCard from './RunnerPoolCard.vue'

const homeStore = useHomeStore()

// Get runner pool statuses from the store
const runnerPoolStatuses = computed(() => homeStore.runnerPoolStatuses)

// Check if there are any runner pools to display
const hasRunnerPools = computed(() => runnerPoolStatuses.value.length > 0)
</script>

<template>
  <section v-if="hasRunnerPools" class="runner-pool-grid">
    <header class="grid-header">
      <h2 class="grid-title">
        <span class="title-icon">🏃‍♂️</span>
        Shift Staff (Runners)
      </h2>
      <p class="grid-description">
        Hospital-wide staff available for patient transfers, sample delivery, and general support
      </p>
    </header>

    <div class="grid-container">
      <RunnerPoolCard
        v-for="runnerPoolStatus in runnerPoolStatuses"
        :key="runnerPoolStatus.runnerPool.id"
        :runner-pool-status="runnerPoolStatus"
      />
    </div>
  </section>
</template>

<style scoped>
.runner-pool-grid {
  margin-bottom: 2rem;
}

.grid-header {
  margin-bottom: 1.5rem;
  text-align: center;
}

.grid-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.title-icon {
  font-size: 1.5rem;
}

.grid-description {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.5;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  align-items: start;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .grid-container {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .grid-title {
    font-size: 1.5rem;
  }
  
  .grid-description {
    font-size: 0.875rem;
  }
}

@media (max-width: 480px) {
  .runner-pool-grid {
    margin-bottom: 1.5rem;
  }
  
  .grid-header {
    margin-bottom: 1rem;
  }
  
  .grid-title {
    font-size: 1.25rem;
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
