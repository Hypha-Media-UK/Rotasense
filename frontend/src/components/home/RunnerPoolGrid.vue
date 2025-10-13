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
  <template v-if="hasRunnerPools">
    <RunnerPoolCard
      v-for="runnerPoolStatus in runnerPoolStatuses"
      :key="runnerPoolStatus.runnerPool.id"
      :runner-pool-status="runnerPoolStatus"
    />
  </template>
</template>


