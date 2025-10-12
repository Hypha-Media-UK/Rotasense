<script setup lang="ts">
import { ref, computed } from 'vue'
import { useConfigStore } from '@/stores/config'
import Modal from '@/components/Modal.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import type { CreateRunnerPoolForm, RunnerPool } from '@/types'

const configStore = useConfigStore()
const showCreateForm = ref(false)
const editingPool = ref<RunnerPool | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// Form data
const newPool = ref<CreateRunnerPoolForm>({
  name: '',
  description: '',
  displayOnHome: true,
  displayOrder: 0
})

const isEditing = computed(() => editingPool.value !== null)
const formTitle = computed(() => isEditing.value ? 'Edit Runner Pool' : 'Add Runner Pool')

// Methods
function resetFormData() {
  newPool.value = {
    name: '',
    description: '',
    displayOnHome: true,
    displayOrder: 0
  }
  editingPool.value = null
  error.value = null
}

function resetForm() {
  resetFormData()
  showCreateForm.value = false
}

function openCreateForm() {
  resetFormData()
  showCreateForm.value = true
}

function openEditForm(pool: RunnerPool) {
  editingPool.value = pool
  newPool.value = {
    name: pool.name,
    description: pool.description || '',
    displayOnHome: pool.displayOnHome,
    displayOrder: pool.displayOrder
  }
  showCreateForm.value = true
}

async function savePool() {
  if (!newPool.value.name.trim()) {
    error.value = 'Pool name is required'
    return
  }

  loading.value = true
  error.value = null

  try {
    if (isEditing.value && editingPool.value) {
      await configStore.updateRunnerPool(editingPool.value.id, newPool.value)
    } else {
      await configStore.createRunnerPool(newPool.value)
    }
    resetForm()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save runner pool'
  } finally {
    loading.value = false
  }
}

async function deletePool(pool: RunnerPool) {
  if (!confirm(`Are you sure you want to delete "${pool.name}"? This action cannot be undone.`)) {
    return
  }

  try {
    await configStore.deleteRunnerPool(pool.id)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete runner pool'
  }
}
</script>

<template>
  <article class="config-content">
    <header class="content-header">
      <div class="header-content">
        <h1 class="page-title">Runner Pools</h1>
        <p class="page-description">
          Manage runner pools for hospital-wide staff assignments
        </p>
      </div>
      <button @click="openCreateForm" class="btn btn-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Add Runner Pool
      </button>
    </header>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <section class="pools-section">
      <div v-if="configStore.runnerPools.length === 0" class="empty-state">
        <div class="empty-icon">🏃‍♂️</div>
        <h3>No Runner Pools</h3>
        <p>Create your first runner pool to organize hospital-wide staff</p>
        <button @click="openCreateForm" class="btn btn-primary">Add Runner Pool</button>
      </div>

      <div v-else class="pools-grid">
        <div v-for="pool in configStore.runnerPools" :key="pool.id" class="pool-card">
          <div class="pool-header">
            <h3 class="pool-name">{{ pool.name }}</h3>
            <div class="pool-actions">
              <button @click="openEditForm(pool)" class="icon-btn edit-btn" title="Edit Pool">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button @click="deletePool(pool)" class="icon-btn delete-btn" title="Delete Pool">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="pool-content">
            <p v-if="pool.description" class="pool-description">{{ pool.description }}</p>
            <div class="pool-meta">
              <div class="meta-item">
                <span class="meta-label">Display on Home:</span>
                <span class="meta-value" :class="{ 'status-yes': pool.displayOnHome, 'status-no': !pool.displayOnHome }">
                  {{ pool.displayOnHome ? 'Yes' : 'No' }}
                </span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Display Order:</span>
                <span class="meta-value">{{ pool.displayOrder }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Assigned Staff:</span>
                <span class="meta-value">{{ pool.staff?.length || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Create/Edit Modal -->
    <Modal v-if="showCreateForm" @close="resetForm">
      <template #header>
        <h2>{{ formTitle }}</h2>
      </template>

      <form @submit.prevent="savePool" class="pool-form">
        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div class="form-section">
          <h3 class="section-title">Basic Information</h3>
          
          <div class="form-group">
            <label class="form-label">Pool Name</label>
            <input v-model="newPool.name" type="text" class="form-input" required placeholder="e.g., General Runners">
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea v-model="newPool.description" class="form-textarea" rows="3" 
              placeholder="Optional description of this runner pool's purpose"></textarea>
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-title">Display Settings</h3>
          
          <div class="form-group">
            <label class="checkbox-label">
              <input v-model="newPool.displayOnHome" type="checkbox" class="checkbox">
              <span class="checkbox-text">Display on Homepage</span>
            </label>
            <p class="form-help">Show this runner pool on the main dashboard</p>
          </div>

          <div class="form-group">
            <label class="form-label">Display Order</label>
            <input v-model.number="newPool.displayOrder" type="number" class="form-input" min="0" 
              placeholder="0 = first, higher numbers appear later">
            <p class="form-help">Controls the order in which runner pools appear on the homepage</p>
          </div>
        </div>
      </form>

      <template #footer>
        <button type="button" @click="resetForm" class="btn">Cancel</button>
        <button @click="savePool" :disabled="loading" class="btn btn-primary">
          <LoadingSpinner v-if="loading" size="sm" />
          {{ loading ? 'Saving...' : (isEditing ? 'Update Pool' : 'Create Pool') }}
        </button>
      </template>
    </Modal>
  </article>
</template>

<style scoped>
.config-content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 2rem;
}

.header-content h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
}

.page-description {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
}

.error-message {
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: #f9fafb;
  border-radius: 12px;
  border: 2px dashed #d1d5db;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  color: #374151;
}

.empty-state p {
  margin: 0 0 2rem 0;
  color: #6b7280;
}

.pools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.pool-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.pool-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.pool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.pool-name {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.pool-actions {
  display: flex;
  gap: 0.5rem;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.edit-btn:hover {
  color: #3b82f6;
  border-color: #3b82f6;
}

.delete-btn:hover {
  color: #ef4444;
  border-color: #ef4444;
}

.pool-content {
  padding: 1.5rem;
}

.pool-description {
  margin: 0 0 1rem 0;
  color: #6b7280;
  line-height: 1.5;
}

.pool-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-label {
  font-weight: 500;
  color: #374151;
}

.meta-value {
  color: #6b7280;
}

.status-yes {
  color: #059669;
  font-weight: 500;
}

.status-no {
  color: #dc2626;
  font-weight: 500;
}

.pool-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  background: #fafbfc;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 2rem;
}

.section-title {
  margin: 0 0 1.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 1.5rem;
  background: #3b82f6;
  border-radius: 2px;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.5rem 0;
  border-radius: 6px;
  transition: background-color 0.2s;
  justify-content: flex-start;
  width: fit-content;
  flex-direction: row;
}

.checkbox {
  width: 1rem;
  height: 1rem;
  accent-color: #3b82f6;
  margin: 0;
  flex-shrink: 0;
  order: 1;
}

.checkbox-text {
  font-size: 0.875rem;
  color: #374151;
  margin: 0;
  order: 2;
  white-space: nowrap;
}

.form-help {
  margin: 0.5rem 0 0 0;
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.4;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.btn-primary {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
  border-color: #2563eb;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Override global article hover effects for config content */
.config-content:hover {
  transform: none !important;
  box-shadow: none !important;
  border-color: initial !important;
}

@media (max-width: 768px) {
  .config-content {
    padding: 1rem;
  }
  
  .content-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .pools-grid {
    grid-template-columns: 1fr;
  }
}
</style>
