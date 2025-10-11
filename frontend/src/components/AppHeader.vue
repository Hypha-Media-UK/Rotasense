<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <header class="app-header">
    <div class="container">
      <div class="header-content">
        <div class="logo">
          <h1>RotaSense</h1>
        </div>

        <nav class="main-nav">
          <RouterLink
            to="/"
            class="nav-link"
            :class="{ active: route.name === 'home' }"
          >
            Home
          </RouterLink>
          <RouterLink
            to="/config"
            class="nav-link"
            :class="{ active: route.path.startsWith('/config') }"
          >
            Config
          </RouterLink>
        </nav>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-md);
  width: 100%;
  box-sizing: border-box;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) 0;
  min-height: 60px;
}

.logo h1 {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.main-nav {
  display: flex;
  gap: var(--space-lg);
}

.nav-link {
  padding: var(--space-sm) var(--space-md);
  color: var(--color-text-muted);
  text-decoration: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-link:hover,
.nav-link.active {
  color: var(--color-text);
  background-color: var(--color-background);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .container {
    padding: 0 var(--space-sm);
  }

  .header-content {
    padding: var(--space-sm) 0;
  }

  .logo h1 {
    font-size: var(--font-size-lg);
  }

  .main-nav {
    gap: var(--space-md);
  }

  .nav-link {
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--font-size-sm);
  }
}
</style>
