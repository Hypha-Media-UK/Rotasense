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
  <div class="settings-view">
    <div class="settings-header">
      <h2 class="text-xl font-semibold">Application Settings</h2>
    </div>

    <div v-if="configStore.loading" class="loading-state">
      <p>Loading settings...</p>
    </div>

    <div v-else-if="configStore.error" class="error-state">
      <p class="text-error">{{ configStore.error }}</p>
    </div>

    <div v-else class="settings-content">
      <div class="settings-card card">
        <h3 class="settings-section-title">Display Preferences</h3>

        <div class="setting-group">
          <label class="setting-label">Time Format</label>
          <p class="setting-description">
            Choose how times are displayed throughout the application.
          </p>

          <div class="radio-group">
            <label class="radio-option">
              <input
                v-model="timeFormat"
                type="radio"
                value="24"
                class="radio-input"
              />
              <span class="radio-label">24-hour format (14:30)</span>
            </label>

            <label class="radio-option">
              <input
                v-model="timeFormat"
                type="radio"
                value="12"
                class="radio-input"
              />
              <span class="radio-label">12-hour format (2:30 PM)</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Zero Start Dates Section -->
      <div class="settings-card card">
        <div class="section-header">
          <h3 class="settings-section-title">Zero Start Dates</h3>
          <button @click="openAddZeroStartDateForm" class="btn btn-primary btn-sm">
            Add Zero Start Date
          </button>
        </div>

        <p class="setting-description">
          Zero start dates are reference points used to calculate shift cycle rotations.
          Each date represents when a particular shift pattern begins.
        </p>

        <div v-if="zeroStartDates.length === 0" class="empty-state">
          <p class="text-muted">No zero start dates configured yet.</p>
        </div>

        <div v-else class="zero-start-dates-list">
          <div
            v-for="zsd in zeroStartDates"
            :key="zsd.id"
            class="zero-start-date-item"
          >
            <div class="zsd-info">
              <h4 class="zsd-name">{{ zsd.name }}</h4>
              <p class="zsd-date">{{ zsd.date }}</p>
            </div>
            <div class="zsd-actions">
              <button @click="openEditZeroStartDateForm(zsd)" class="btn btn-sm">
                Edit
              </button>
              <button @click="deleteZeroStartDate(zsd.id)" class="btn btn-sm btn-danger">
                Delete
              </button>
            </div>
          </div>
        </div>

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
      </div>

      <div class="settings-actions">
        <button
          @click="saveSettings"
          :disabled="saving"
          class="btn btn-primary"
        >
          {{ saving ? 'Saving...' : 'Save Settings' }}
        </button>

        <div v-if="saveMessage" class="save-message">
          <span
            :class="{
              'text-success': saveMessage.includes('success'),
              'text-error': saveMessage.includes('Failed')
            }"
          >
            {{ saveMessage }}
          </span>
        </div>
      </div>

      <!-- System Information -->
      <div class="settings-card card">
        <h3 class="settings-section-title">System Information</h3>

        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Application:</span>
            <span class="info-value">RotaSense v1.0</span>
          </div>

          <div class="info-item">
            <span class="info-label">Total Buildings:</span>
            <span class="info-value">{{ configStore.buildings.length }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">Total Departments:</span>
            <span class="info-value">{{ configStore.departments.length }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">Total Services:</span>
            <span class="info-value">{{ configStore.services.length }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">Total Staff:</span>
            <span class="info-value">{{ configStore.staff.length }}</span>
          </div>


        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-view {
  display: grid;
  gap: var(--space-lg);
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-md);
}

.loading-state,
.error-state {
  text-align: center;
  padding: var(--space-xl);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.settings-content {
  display: grid;
  gap: var(--space-lg);
}

.settings-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.settings-section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--color-border);
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.setting-label {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text);
}

.setting-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: 0;
}

/* Zero Start Dates Section */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-md);
}

.zero-start-dates-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.zero-start-date-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.zsd-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.zsd-name {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.zsd-date {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: 0;
}

.zsd-actions {
  display: flex;
  gap: var(--space-sm);
}

.add-zsd-form {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-top: var(--space-md);
}

.add-zsd-form h4 {
  margin: 0 0 var(--space-md) 0;
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text);
}

.form-actions {
  display: flex;
  gap: var(--space-sm);
  justify-content: flex-end;
  margin-top: var(--space-md);
}

.empty-state {
  text-align: center;
  padding: var(--space-lg);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.radio-option {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
  padding: var(--space-sm);
  border-radius: var(--radius-md);
  transition: background-color 0.2s ease;
}

.radio-option:hover {
  background-color: var(--color-background);
}

.radio-input {
  margin: 0;
}

.radio-label {
  font-size: var(--font-size-sm);
  color: var(--color-text);
}

.settings-actions {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border);
}

.save-message {
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.text-success {
  color: var(--color-success);
}

.text-error {
  color: var(--color-error);
}

.info-grid {
  display: grid;
  gap: var(--space-sm);
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm);
  background-color: var(--color-background);
  border-radius: var(--radius-md);
}

.info-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-weight: 500;
}

.info-value {
  font-size: var(--font-size-sm);
  color: var(--color-text);
  font-weight: 600;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .settings-actions {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-sm);
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
