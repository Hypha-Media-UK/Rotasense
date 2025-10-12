<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { name: 'Locations', path: '/config/locations' },
  { name: 'Services', path: '/config/services' },
  { name: 'Staff', path: '/config/staff' },
  { name: 'Settings', path: '/config/settings' }
]
</script>

<template>
  <nav>
    <RouterLink
      v-for="tab in tabs"
      :key="tab.path"
      :to="tab.path"
      :class="{ active: route.path === tab.path }"
    >
      {{ tab.name }}
    </RouterLink>
  </nav>
</template>


