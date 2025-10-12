<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import ConfigTabs from '@/components/config/ConfigTabs.vue'

const route = useRoute()
</script>

<template>
  <article>
    <header>
      <h1>Configuration</h1>
      <ConfigTabs />
    </header>
    <RouterView />
  </article>
</template>


