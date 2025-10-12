<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <header>
    <h1>RotaSense</h1>
    <nav>
      <RouterLink
        to="/"
        :class="{ active: route.name === 'home' }"
      >
        Home
      </RouterLink>
      <RouterLink
        to="/config"
        :class="{ active: route.path.startsWith('/config') }"
      >
        Config
      </RouterLink>
    </nav>
  </header>
</template>


