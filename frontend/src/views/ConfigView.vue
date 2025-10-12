<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import ConfigTabs from '@/components/config/ConfigTabs.vue'

const route = useRoute()
</script>

<template>
  <article class="config-view">
    <header class="page-header">
      <ConfigTabs />
    </header>
    <RouterView />
  </article>
</template>


