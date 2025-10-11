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
  <div class="config-tabs">
    <div class="tabs">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.path"
        :to="tab.path"
        class="tab"
        :class="{ active: route.path === tab.path }"
      >
        {{ tab.name }}
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.config-tabs {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.tabs {
  display: flex;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tabs::-webkit-scrollbar {
  display: none;
}

.tab {
  flex: 1;
  min-width: max-content;
  padding: var(--space-md) var(--space-lg);
  background: none;
  border: none;
  color: var(--color-text-muted);
  text-decoration: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
}

.tab:hover {
  color: var(--color-text);
  background-color: var(--color-background);
}

.tab.active {
  color: var(--color-text);
  border-bottom-color: var(--color-primary);
  background-color: var(--color-background);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .tab {
    padding: var(--space-sm) var(--space-md);
    font-size: var(--font-size-sm);
  }
}

@media (max-width: 480px) {
  .tabs {
    justify-content: flex-start;
  }

  .tab {
    flex: none;
    min-width: 80px;
    padding: var(--space-sm);
    font-size: var(--font-size-xs);
  }
}
</style>
