<script setup lang="ts">
import { useHomeStore } from '@/stores/home'
import DepartmentCard from './DepartmentCard.vue'

const homeStore = useHomeStore()
</script>

<template>
  <div v-if="homeStore.departmentStatuses.length === 0">
    <p>No departments are operational or have staff assigned for this day.</p>
  </div>

  <DepartmentCard
    v-for="departmentStatus in homeStore.departmentStatuses"
    :key="departmentStatus.department.id"
    :department-status="departmentStatus"
  />
</template>


