<script setup lang="ts">
import { useHomeStore } from '@/stores/home'
import ServiceCard from './ServiceCard.vue'

const homeStore = useHomeStore()
</script>

<template>
  <div v-if="homeStore.serviceStatuses.length === 0">
    <p>No services are operational or have staff assigned for this day.</p>
  </div>

  <ServiceCard
    v-for="serviceStatus in homeStore.serviceStatuses"
    :key="serviceStatus.service.id"
    :service-status="serviceStatus"
  />
</template>


