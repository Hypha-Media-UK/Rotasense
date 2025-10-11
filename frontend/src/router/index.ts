import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/config',
      component: () => import('../views/ConfigView.vue'),
      children: [
        {
          path: '',
          name: 'config',
          redirect: '/config/locations'
        },
        {
          path: 'locations',
          name: 'config-locations',
          component: () => import('../views/config/LocationsView.vue'),
        },
        {
          path: 'services',
          name: 'config-services',
          component: () => import('../views/config/ServicesView.vue'),
        },
        {
          path: 'staff',
          name: 'config-staff',
          component: () => import('../views/config/StaffView.vue'),
        },

        {
          path: 'settings',
          name: 'config-settings',
          component: () => import('../views/config/SettingsView.vue'),
        },
      ],
    },
  ],
})

export default router
