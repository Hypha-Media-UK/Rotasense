import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { apiService } from '@/services/api'
import type {
  Building,
  Department,
  Service,
  Staff,
  StaffAllocation,
  Settings,
  RunnerPool,
  RunnerAllocation,
  CreateBuildingForm,
  CreateDepartmentForm,
  CreateServiceForm,
  CreateStaffForm,
  CreateAllocationForm,
  CreateRunnerPoolForm,
  CreateRunnerAllocationForm
} from '@/types'

export const useConfigStore = defineStore('config', () => {
  // State
  const buildings = ref<Building[]>([])
  const departments = ref<Department[]>([])
  const services = ref<Service[]>([])
  const staff = ref<Staff[]>([])
  const allocations = ref<StaffAllocation[]>([])
  const runnerPools = ref<RunnerPool[]>([])
  const runnerAllocations = ref<RunnerAllocation[]>([])

  const settings = ref<Settings | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const regularStaff = computed(() => staff.value.filter(s => s.category === 'REGULAR'))
  const reliefStaff = computed(() => staff.value.filter(s => s.category === 'RELIEF'))
  const supervisorStaff = computed(() => staff.value.filter(s => s.category === 'SUPERVISOR'))

  const departmentsByBuilding = computed(() => {
    return buildings.value.map(building => ({
      ...building,
      departments: departments.value.filter(dept => dept.buildingId === building.id)
    }))
  })

  const runnerStaff = computed(() => staff.value.filter(s => s.runnerPoolId !== null && s.runnerPoolId !== undefined))
  const unallocatedStaff = computed(() => staff.value.filter(s => !s.runnerPoolId && !allocations.value.find(a => a.staffId === s.id)))

  // Actions
  async function fetchAllData() {
    loading.value = true
    error.value = null

    try {
      const [
        buildingsData,
        departmentsData,
        servicesData,
        staffData,
        allocationsData,
        runnerPoolsData,
        runnerAllocationsData,
        settingsData
      ] = await Promise.all([
        apiService.getBuildings(),
        apiService.getDepartments(),
        apiService.getServices(),
        apiService.getStaff(),
        apiService.getAllocations(),
        apiService.getRunnerPools(),
        apiService.getRunnerAllocations(),
        apiService.getSettings()
      ])

      buildings.value = buildingsData
      departments.value = departmentsData
      services.value = servicesData
      staff.value = staffData
      allocations.value = allocationsData
      runnerPools.value = runnerPoolsData
      runnerAllocations.value = runnerAllocationsData
      settings.value = settingsData
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch data'
      console.error('Error fetching config data:', err)
    } finally {
      loading.value = false
    }
  }

  // Building actions
  async function createBuilding(data: CreateBuildingForm) {
    try {
      const newBuilding = await apiService.createBuilding(data)
      buildings.value.push(newBuilding)
      return newBuilding
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create building'
      throw err
    }
  }

  async function updateBuilding(id: number, data: Partial<CreateBuildingForm>) {
    try {
      const updatedBuilding = await apiService.updateBuilding(id, data)
      const index = buildings.value.findIndex(b => b.id === id)
      if (index !== -1) {
        buildings.value[index] = updatedBuilding
      }
      return updatedBuilding
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update building'
      throw err
    }
  }

  async function deleteBuilding(id: number) {
    try {
      await apiService.deleteBuilding(id)
      buildings.value = buildings.value.filter(b => b.id !== id)
      // Also remove associated departments
      departments.value = departments.value.filter(d => d.buildingId !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete building'
      throw err
    }
  }

  // Department actions
  async function createDepartment(data: CreateDepartmentForm) {
    try {
      const newDepartment = await apiService.createDepartment(data)
      departments.value.push(newDepartment)
      return newDepartment
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create department'
      throw err
    }
  }

  async function updateDepartment(id: number, data: Partial<CreateDepartmentForm>) {
    try {
      const updatedDepartment = await apiService.updateDepartment(id, data)
      const index = departments.value.findIndex(d => d.id === id)
      if (index !== -1) {
        departments.value[index] = updatedDepartment
      }
      return updatedDepartment
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update department'
      throw err
    }
  }

  async function deleteDepartment(id: number) {
    try {
      await apiService.deleteDepartment(id)
      departments.value = departments.value.filter(d => d.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete department'
      throw err
    }
  }

  // Service actions
  async function createService(data: CreateServiceForm) {
    try {
      const newService = await apiService.createService(data)
      services.value.push(newService)
      return newService
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create service'
      throw err
    }
  }

  async function updateService(id: number, data: Partial<CreateServiceForm>) {
    try {
      const updatedService = await apiService.updateService(id, data)
      const index = services.value.findIndex(s => s.id === id)
      if (index !== -1) {
        services.value[index] = updatedService
      }
      return updatedService
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update service'
      throw err
    }
  }

  async function deleteService(id: number) {
    try {
      await apiService.deleteService(id)
      services.value = services.value.filter(s => s.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete service'
      throw err
    }
  }

  // Staff management
  async function createStaff(data: CreateStaffForm) {
    try {
      const newStaff = await apiService.createStaff(data)
      staff.value.push(newStaff)
      return newStaff
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create staff member'
      throw err
    }
  }

  async function updateStaff(id: number, data: Partial<CreateStaffForm>) {
    try {
      const updatedStaff = await apiService.updateStaff(id, data)
      const index = staff.value.findIndex(s => s.id === id)
      if (index !== -1) {
        staff.value[index] = updatedStaff
      }
      return updatedStaff
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update staff member'
      throw err
    }
  }

  async function deleteStaff(id: number) {
    try {
      await apiService.deleteStaff(id)
      staff.value = staff.value.filter(s => s.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete staff member'
      throw err
    }
  }

  // Allocation management
  async function createAllocation(data: CreateAllocationForm) {
    try {
      const newAllocation = await apiService.createAllocation(data)
      allocations.value.push(newAllocation)
      return newAllocation
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create allocation'
      throw err
    }
  }

  async function updateAllocation(id: number, data: Partial<CreateAllocationForm>) {
    try {
      const updatedAllocation = await apiService.updateAllocation(id, data)
      const index = allocations.value.findIndex(a => a.id === id)
      if (index !== -1) {
        allocations.value[index] = updatedAllocation
      }
      return updatedAllocation
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update allocation'
      throw err
    }
  }

  async function deleteAllocation(id: number) {
    try {
      await apiService.deleteAllocation(id)
      allocations.value = allocations.value.filter(a => a.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete allocation'
      throw err
    }
  }

  // Runner Pool actions
  async function createRunnerPool(data: CreateRunnerPoolForm) {
    try {
      const newRunnerPool = await apiService.createRunnerPool(data)
      runnerPools.value.push(newRunnerPool)
      return newRunnerPool
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create runner pool'
      throw err
    }
  }

  async function updateRunnerPool(id: number, data: Partial<CreateRunnerPoolForm>) {
    try {
      const updatedRunnerPool = await apiService.updateRunnerPool(id, data)
      const index = runnerPools.value.findIndex(rp => rp.id === id)
      if (index !== -1) {
        runnerPools.value[index] = updatedRunnerPool
      }
      return updatedRunnerPool
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update runner pool'
      throw err
    }
  }

  async function deleteRunnerPool(id: number) {
    try {
      await apiService.deleteRunnerPool(id)
      runnerPools.value = runnerPools.value.filter(rp => rp.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete runner pool'
      throw err
    }
  }

  // Runner Allocation actions
  async function createRunnerAllocation(data: CreateRunnerAllocationForm) {
    try {
      const newAllocation = await apiService.createRunnerAllocation(data)
      runnerAllocations.value.push(newAllocation)
      return newAllocation
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create runner allocation'
      throw err
    }
  }

  async function updateRunnerAllocation(id: number, data: Partial<CreateRunnerAllocationForm>) {
    try {
      const updatedAllocation = await apiService.updateRunnerAllocation(id, data)
      const index = runnerAllocations.value.findIndex(ra => ra.id === id)
      if (index !== -1) {
        runnerAllocations.value[index] = updatedAllocation
      }
      return updatedAllocation
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update runner allocation'
      throw err
    }
  }

  async function deleteRunnerAllocation(id: number) {
    try {
      await apiService.deleteRunnerAllocation(id)
      runnerAllocations.value = runnerAllocations.value.filter(ra => ra.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete runner allocation'
      throw err
    }
  }



  return {
    // State
    buildings,
    departments,
    services,
    staff,
    allocations,
    runnerPools,
    runnerAllocations,

    settings,
    loading,
    error,

    // Computed
    regularStaff,
    reliefStaff,
    supervisorStaff,
    departmentsByBuilding,
    runnerStaff,
    unallocatedStaff,

    // Actions
    fetchAllData,
    createBuilding,
    updateBuilding,
    deleteBuilding,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    createService,
    updateService,
    deleteService,
    createStaff,
    updateStaff,
    deleteStaff,
    createAllocation,
    updateAllocation,
    deleteAllocation,
    createRunnerPool,
    updateRunnerPool,
    deleteRunnerPool,
    createRunnerAllocation,
    updateRunnerAllocation,
    deleteRunnerAllocation
  }
})
