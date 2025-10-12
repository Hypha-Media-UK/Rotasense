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
  <article class="home-view">
    <header class="page-header">
      <div class="page-title-section">
        <h1>Staff Schedule</h1>
        <p class="page-subtitle">Monitor department and service staffing levels in real-time</p>
      </div>
      <DateNavigation />
    </header>

    <section class="content-section">
      <h2>Departments</h2>
      <DepartmentGrid />
    </section>

    <section class="content-section">
      <h2>Services</h2>
      <ServiceGrid />
    </section>
  </article>
</template>


