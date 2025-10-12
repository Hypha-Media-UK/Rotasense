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
  <article>
    <header>
      <h1>Staff Schedule</h1>
      <DateNavigation />
    </header>

    <section>
      <h2>Departments</h2>
      <DepartmentGrid />
    </section>

    <section>
      <h2>Services</h2>
      <ServiceGrid />
    </section>
  </article>
</template>


