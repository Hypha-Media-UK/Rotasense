<script setup lang="ts">
import { ref, watch } from 'vue'
import { useConfigStore } from '@/stores/config'
import { apiService } from '@/services/api'
import type { ZeroStartDate } from '@/types'

const configStore = useConfigStore()
const saving = ref(false)
const saveMessage = ref('')

const timeFormat = ref<'12' | '24'>('24')
const zeroStartDates = ref<ZeroStartDate[]>([])

// Form for adding new zero start date
const newZeroStartDate = ref<Omit<ZeroStartDate, 'id'>>({
  name: '',
  date: ''
})
const showAddForm = ref(false)
const editingZeroStartDate = ref<ZeroStartDate | null>(null)

// Initialize settings from store
watch(() => configStore.settings, (settings) => {
  if (settings) {
    timeFormat.value = settings.timeFormat
    zeroStartDates.value = [...(settings.zeroStartDates || [])]
  }
}, { immediate: true })

async function saveSettings() {
  saving.value = true
  saveMessage.value = ''

  try {
    await apiService.updateSettings({
      timeFormat: timeFormat.value,
      zeroStartDates: zeroStartDates.value
    })

    // Refresh settings in store
    await configStore.fetchAllData()

    saveMessage.value = 'Settings saved successfully!'
    setTimeout(() => {
      saveMessage.value = ''
    }, 3000)
  } catch (err) {
    saveMessage.value = err instanceof Error ? err.message : 'Failed to save settings'
    console.error('Error saving settings:', err)
  } finally {
    saving.value = false
  }
}

// Zero start date management functions
function openAddZeroStartDateForm() {
  newZeroStartDate.value = { name: '', date: '' }
  editingZeroStartDate.value = null
  showAddForm.value = true
}

function openEditZeroStartDateForm(zsd: ZeroStartDate) {
  newZeroStartDate.value = { name: zsd.name, date: zsd.date }
  editingZeroStartDate.value = zsd
  showAddForm.value = true
}

function cancelZeroStartDateForm() {
  showAddForm.value = false
  newZeroStartDate.value = { name: '', date: '' }
  editingZeroStartDate.value = null
}

function saveZeroStartDate() {
  if (!newZeroStartDate.value.name.trim() || !newZeroStartDate.value.date) {
    return
  }

  if (editingZeroStartDate.value) {
    // Edit existing
    const index = zeroStartDates.value.findIndex(zsd => zsd.id === editingZeroStartDate.value!.id)
    if (index !== -1) {
      zeroStartDates.value[index] = {
        ...editingZeroStartDate.value,
        name: newZeroStartDate.value.name.trim(),
        date: newZeroStartDate.value.date
      }
    }
  } else {
    // Add new
    const newId = Date.now().toString() // Simple ID generation
    zeroStartDates.value.push({
      id: newId,
      name: newZeroStartDate.value.name.trim(),
      date: newZeroStartDate.value.date
    })
  }

  cancelZeroStartDateForm()
}

function deleteZeroStartDate(id: string) {
  if (confirm('Are you sure you want to delete this zero start date?')) {
    zeroStartDates.value = zeroStartDates.value.filter(zsd => zsd.id !== id)
  }
}
</script>

<template>
  <article class="config-content">
    <header class="content-header">
      <h2>Application Settings</h2>
    </header>

    <div v-if="configStore.loading">
      <p>Loading settings...</p>
    </div>

    <div v-else-if="configStore.error">
      <p>{{ configStore.error }}</p>
    </div>

    <section v-else>
      <section>
        <h3>Display Preferences</h3>

        <fieldset>
          <legend>Time Format</legend>
          <p>Choose how times are displayed throughout the application.</p>

          <label>
            <input
              v-model="timeFormat"
              type="radio"
              value="24"
            />
            24-hour format (14:30)
          </label>

          <label>
            <input
              v-model="timeFormat"
              type="radio"
              value="12"
            />
            12-hour format (2:30 PM)
          </label>
        </fieldset>
      </section>

      <section>
        <header>
          <h3>Zero Start Dates</h3>
          <button @click="openAddZeroStartDateForm">
            Add Zero Start Date
          </button>
        </header>

        <p>
          Zero start dates are reference points used to calculate shift cycle rotations.
          Each date represents when a particular shift pattern begins.
        </p>

        <div v-if="zeroStartDates.length === 0">
          <p>No zero start dates configured yet.</p>
        </div>

        <ul v-else>
          <li
            v-for="zsd in zeroStartDates"
            :key="zsd.id"
          >
            <div>
              <h4>{{ zsd.name }}</h4>
              <time>{{ zsd.date }}</time>
            </div>
            <div>
              <button @click="openEditZeroStartDateForm(zsd)">
                Edit
              </button>
              <button @click="deleteZeroStartDate(zsd.id)">
                Delete
              </button>
            </div>
          </li>
        </ul>

        <!-- Add/Edit Zero Start Date Form -->
        <div v-if="showAddForm" class="add-zsd-form">
          <h4>{{ editingZeroStartDate ? 'Edit' : 'Add' }} Zero Start Date</h4>
          <form @submit.prevent="saveZeroStartDate" class="form">
            <div class="form-group">
              <label class="form-label">Name</label>
              <input
                v-model="newZeroStartDate.name"
                type="text"
                class="form-input"
                placeholder="e.g., Default 2024, Alternative Start"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">Date</label>
              <input
                v-model="newZeroStartDate.date"
                type="date"
                class="form-input"
                required
              />
            </div>
            <div class="form-actions">
              <button type="button" @click="cancelZeroStartDateForm" class="btn">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary">
                {{ editingZeroStartDate ? 'Update' : 'Add' }}
              </button>
            </div>
          </form>
        </div>
      </section>

      <footer>
        <button
          @click="saveSettings"
          :disabled="saving"
        >
          {{ saving ? 'Saving...' : 'Save Settings' }}
        </button>

        <div v-if="saveMessage">
          <span
            :class="{
              'text-success': saveMessage.includes('success'),
              'text-error': saveMessage.includes('Failed')
            }"
          >
            {{ saveMessage }}
          </span>
        </div>
      </footer>

      <section>
        <h3>System Information</h3>

        <dl>
          <dt>Application:</dt>
          <dd>RotaSense v1.0</dd>

          <dt>Total Buildings:</dt>
          <dd>{{ configStore.buildings.length }}</dd>

          <dt>Total Departments:</dt>
          <dd>{{ configStore.departments.length }}</dd>

          <dt>Total Services:</dt>
          <dd>{{ configStore.services.length }}</dd>

          <dt>Total Staff:</dt>
          <dd>{{ configStore.staff.length }}</dd>
        </dl>
      </section>
    </section>
  </article>
</template>

<style scoped>
.content-header h2 {
  text-align: left;
}

/* Override global article hover effects for config content */
.config-content:hover {
  transform: none !important;
  box-shadow: none !important;
  border-color: initial !important;
}
</style>
