<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import ConfigTabs from '@/components/config/ConfigTabs.vue'

const route = useRoute()
</script>

<template>
  <article class="config-view">
    <header class="page-header">
      <div class="page-title-section">
        <h1>Configuration</h1>
        <p class="page-subtitle">Manage locations, services, staff, and system settings</p>
      </div>
      <ConfigTabs />
    </header>
    <RouterView />
  </article>
</template>


