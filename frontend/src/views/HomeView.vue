<script setup lang="ts">
import { onMounted } from 'vue'
import { useHomeStore } from '@/stores/home'
import DateNavigation from '@/components/home/DateNavigation.vue'
import DepartmentGrid from '@/components/home/DepartmentGrid.vue'
import ServiceGrid from '@/components/home/ServiceGrid.vue'
import RunnerPoolGrid from '@/components/home/RunnerPoolGrid.vue'

const homeStore = useHomeStore()

onMounted(() => {
  homeStore.fetchOverrides()
})
</script>

<template>
  <article class="home-view">
    <header class="page-header">
      <DateNavigation />
    </header>

    <section class="content-section">
      <RunnerPoolGrid />
    </section>

    <section class="content-section">
      <h2>Departments</h2>
      <div class="cards-container">
        <DepartmentGrid />
      </div>
    </section>

    <section class="content-section">
      <h2>Services</h2>
      <div class="cards-container">
        <ServiceGrid />
      </div>
    </section>
  </article>
</template>


