import type {
  Building,
  Department,
  Service,
  Staff,
  StaffAllocation,
  DailyOverride,
  Settings,
  RunnerPool,
  RunnerAllocation,
  MinimumStaffPeriod,
  CreateBuildingForm,
  CreateDepartmentForm,
  CreateServiceForm,
  CreateStaffForm,
  CreateAllocationForm,
  CreateOverrideForm,
  CreateRunnerPoolForm,
  CreateRunnerAllocationForm,
  CreateMinimumStaffPeriodForm
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiService {
  // Request deduplication cache
  private pendingRequests = new Map<string, Promise<any>>()

  private getCacheKey(endpoint: string, options: RequestInit = {}): string {
    const method = options.method || 'GET'
    const body = options.body || ''
    return `${method}:${endpoint}:${body}`
  }
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Only deduplicate GET requests to avoid issues with mutations
    const method = options.method || 'GET'
    const shouldDeduplicate = method === 'GET'

    if (shouldDeduplicate) {
      const cacheKey = this.getCacheKey(endpoint, options)

      // Return existing promise if request is already in flight
      if (this.pendingRequests.has(cacheKey)) {
        return this.pendingRequests.get(cacheKey)!
      }
    }

    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const requestPromise = this.executeRequest<T>(url, config)

    if (shouldDeduplicate) {
      const cacheKey = this.getCacheKey(endpoint, options)
      this.pendingRequests.set(cacheKey, requestPromise)

      // Clean up cache when request completes
      requestPromise.finally(() => {
        this.pendingRequests.delete(cacheKey)
      })
    }

    return requestPromise
  }

  private async executeRequest<T>(url: string, config: RequestInit): Promise<T> {
    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return {} as T;
      }

      const data = await response.json();
      return this.parseJsonFields(data);
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  }

  private parseJsonFields<T>(data: T): T {
    if (Array.isArray(data)) {
      return data.map(item => this.parseJsonFields(item)) as T;
    }

    if (data && typeof data === 'object') {
      const parsed = { ...data } as any;

      // Parse JSON string fields that should be arrays
      const jsonArrayFields = ['operationalDays', 'contractedDays', 'daysOfWeek'];

      for (const field of jsonArrayFields) {
        if (parsed[field] && typeof parsed[field] === 'string') {
          try {
            parsed[field] = JSON.parse(parsed[field]);
          } catch (e) {
            console.warn(`Failed to parse JSON field ${field}:`, parsed[field]);
          }
        }
      }

      // Recursively parse nested objects
      for (const key in parsed) {
        if (parsed[key] && typeof parsed[key] === 'object') {
          parsed[key] = this.parseJsonFields(parsed[key]);
        }
      }

      return parsed;
    }

    return data;
  }

  // Buildings
  async getBuildings(): Promise<Building[]> {
    return this.request<Building[]>('/api/buildings');
  }

  async getBuilding(id: number): Promise<Building> {
    return this.request<Building>(`/api/buildings/${id}`);
  }

  async createBuilding(data: CreateBuildingForm): Promise<Building> {
    return this.request<Building>('/api/buildings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBuilding(id: number, data: Partial<CreateBuildingForm>): Promise<Building> {
    return this.request<Building>(`/api/buildings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBuilding(id: number): Promise<void> {
    return this.request<void>(`/api/buildings/${id}`, {
      method: 'DELETE',
    });
  }

  // Departments
  async getDepartments(): Promise<Department[]> {
    return this.request<Department[]>('/api/departments');
  }

  async getDepartment(id: number): Promise<Department> {
    return this.request<Department>(`/api/departments/${id}`);
  }

  async createDepartment(data: CreateDepartmentForm): Promise<Department> {
    return this.request<Department>('/api/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDepartment(id: number, data: Partial<CreateDepartmentForm>): Promise<Department> {
    return this.request<Department>(`/api/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDepartment(id: number): Promise<void> {
    return this.request<void>(`/api/departments/${id}`, {
      method: 'DELETE',
    });
  }

  // Services
  async getServices(): Promise<Service[]> {
    return this.request<Service[]>('/api/services');
  }

  async getService(id: number): Promise<Service> {
    return this.request<Service>(`/api/services/${id}`);
  }

  async createService(data: CreateServiceForm): Promise<Service> {
    return this.request<Service>('/api/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateService(id: number, data: Partial<CreateServiceForm>): Promise<Service> {
    return this.request<Service>(`/api/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteService(id: number): Promise<void> {
    return this.request<void>(`/api/services/${id}`, {
      method: 'DELETE',
    });
  }

  // Staff
  async getStaff(category?: string): Promise<Staff[]> {
    const params = category ? `?category=${category}` : '';
    return this.request<Staff[]>(`/api/staff${params}`);
  }

  async getStaffMember(id: number): Promise<Staff> {
    return this.request<Staff>(`/api/staff/${id}`);
  }

  async createStaff(data: CreateStaffForm): Promise<Staff> {
    return this.request<Staff>('/api/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateStaff(id: number, data: Partial<CreateStaffForm>): Promise<Staff> {
    return this.request<Staff>(`/api/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteStaff(id: number): Promise<void> {
    return this.request<void>(`/api/staff/${id}`, {
      method: 'DELETE',
    });
  }

  // Staff Allocations
  async getAllocations(staffId?: number): Promise<StaffAllocation[]> {
    const params = staffId ? `?staffId=${staffId}` : '';
    return this.request<StaffAllocation[]>(`/api/allocations${params}`);
  }

  async getAllocation(id: number): Promise<StaffAllocation> {
    return this.request<StaffAllocation>(`/api/allocations/${id}`);
  }

  async createAllocation(data: CreateAllocationForm): Promise<StaffAllocation> {
    return this.request<StaffAllocation>('/api/allocations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAllocation(id: number, data: Partial<CreateAllocationForm>): Promise<StaffAllocation> {
    return this.request<StaffAllocation>(`/api/allocations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAllocation(id: number): Promise<void> {
    return this.request<void>(`/api/allocations/${id}`, {
      method: 'DELETE',
    });
  }



  // Daily Overrides
  async getOverrides(date?: string, staffId?: number): Promise<DailyOverride[]> {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (staffId) params.append('staffId', staffId.toString());
    const queryString = params.toString();
    return this.request<DailyOverride[]>(`/api/overrides${queryString ? `?${queryString}` : ''}`);
  }

  async getOverride(id: number): Promise<DailyOverride> {
    return this.request<DailyOverride>(`/api/overrides/${id}`);
  }

  async createOverride(data: CreateOverrideForm): Promise<DailyOverride> {
    return this.request<DailyOverride>('/api/overrides', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOverride(id: number, data: Partial<CreateOverrideForm>): Promise<DailyOverride> {
    return this.request<DailyOverride>(`/api/overrides/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteOverride(id: number): Promise<void> {
    return this.request<void>(`/api/overrides/${id}`, {
      method: 'DELETE',
    });
  }

  // Settings
  async getSettings(): Promise<Settings> {
    return this.request<Settings>('/api/settings');
  }

  async updateSettings(data: Partial<Pick<Settings, 'timeFormat' | 'zeroStartDates'>>): Promise<Settings> {
    return this.request<Settings>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Runner Pools
  async getRunnerPools(): Promise<RunnerPool[]> {
    return this.request<RunnerPool[]>('/api/runner-pools');
  }

  async getRunnerPool(id: number): Promise<RunnerPool> {
    return this.request<RunnerPool>(`/api/runner-pools/${id}`);
  }

  async createRunnerPool(data: CreateRunnerPoolForm): Promise<RunnerPool> {
    return this.request<RunnerPool>('/api/runner-pools', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRunnerPool(id: number, data: Partial<CreateRunnerPoolForm>): Promise<RunnerPool> {
    return this.request<RunnerPool>(`/api/runner-pools/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRunnerPool(id: number): Promise<void> {
    return this.request<void>(`/api/runner-pools/${id}`, {
      method: 'DELETE',
    });
  }

  // Runner Allocations
  async getRunnerAllocations(staffId?: number, active?: boolean): Promise<RunnerAllocation[]> {
    const params = new URLSearchParams();
    if (staffId) params.append('staffId', staffId.toString());
    if (active !== undefined) params.append('active', active.toString());
    const queryString = params.toString();
    return this.request<RunnerAllocation[]>(`/api/runner-allocations${queryString ? `?${queryString}` : ''}`);
  }

  async getRunnerAllocation(id: number): Promise<RunnerAllocation> {
    return this.request<RunnerAllocation>(`/api/runner-allocations/${id}`);
  }

  async createRunnerAllocation(data: CreateRunnerAllocationForm): Promise<RunnerAllocation> {
    return this.request<RunnerAllocation>('/api/runner-allocations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRunnerAllocation(id: number, data: Partial<CreateRunnerAllocationForm>): Promise<RunnerAllocation> {
    return this.request<RunnerAllocation>(`/api/runner-allocations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRunnerAllocation(id: number): Promise<void> {
    return this.request<void>(`/api/runner-allocations/${id}`, {
      method: 'DELETE',
    });
  }

  // Minimum Staff Periods
  async getMinimumStaffPeriods(departmentId?: number, serviceId?: number): Promise<MinimumStaffPeriod[]> {
    const params = new URLSearchParams();
    if (departmentId) params.append('departmentId', departmentId.toString());
    if (serviceId) params.append('serviceId', serviceId.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/api/minimum-staff-periods?${queryString}` : '/api/minimum-staff-periods';

    return this.request<MinimumStaffPeriod[]>(endpoint);
  }

  async getMinimumStaffPeriod(id: number): Promise<MinimumStaffPeriod> {
    return this.request<MinimumStaffPeriod>(`/api/minimum-staff-periods/${id}`);
  }

  async createMinimumStaffPeriod(data: CreateMinimumStaffPeriodForm): Promise<MinimumStaffPeriod> {
    return this.request<MinimumStaffPeriod>('/api/minimum-staff-periods', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMinimumStaffPeriod(id: number, data: Partial<CreateMinimumStaffPeriodForm>): Promise<MinimumStaffPeriod> {
    return this.request<MinimumStaffPeriod>(`/api/minimum-staff-periods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMinimumStaffPeriod(id: number): Promise<void> {
    return this.request<void>(`/api/minimum-staff-periods/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

export const apiService = new ApiService();
