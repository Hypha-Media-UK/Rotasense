// Enums
export type StaffCategory = 'REGULAR' | 'RELIEF' | 'SUPERVISOR';
export type ScheduleType = 'DAILY' | 'SHIFT_CYCLE';
export type OverrideType = 'TEMPORARY_ALLOCATION' | 'ABSENCE';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

// Base interfaces
export interface Building {
  id: number;
  name: string;
  departments: Department[];
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: number;
  name: string;
  buildingId: number;
  building?: Building;
  is24x7: boolean;
  operationalDays: DayOfWeek[];
  startTime: string;
  endTime: string;
  minStaff: number;
  displayOnHome: boolean;
  staffAllocations?: StaffAllocation[];
  dailyOverrides?: DailyOverride[];
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: number;
  name: string;
  is24x7: boolean;
  operationalDays: DayOfWeek[];
  startTime: string;
  endTime: string;
  minStaff: number;
  displayOnHome: boolean;
  staffAllocations?: StaffAllocation[];
  dailyOverrides?: DailyOverride[];
  createdAt: string;
  updatedAt: string;
}

export interface Staff {
  id: number;
  name: string;
  category: StaffCategory;
  isNightStaff: boolean;

  // Schedule configuration
  scheduleType: ScheduleType;
  daysOn?: number;
  daysOff?: number;
  shiftOffset?: number;
  zeroStartDateId?: string;

  // Time configuration
  defaultStartTime: string;
  defaultEndTime: string;
  contractedDays: DayOfWeek[]; // For DAILY schedule type

  // Runner pool assignment
  runnerPoolId?: number;
  runnerPool?: RunnerPool;

  allocations?: StaffAllocation[];
  dailyOverrides?: DailyOverride[];
  runnerAllocations?: RunnerAllocation[];
  createdAt: string;
  updatedAt: string;
}

export interface StaffAllocation {
  id: number;
  staffId: number;
  staff?: Staff;
  departmentId?: number;
  department?: Department;
  serviceId?: number;
  service?: Service;
  createdAt: string;
  updatedAt: string;
}



export interface DailyOverride {
  id: number;
  date: string;
  endDate?: string;
  staffId: number;
  staff?: Staff;
  departmentId?: number;
  department?: Department;
  serviceId?: number;
  service?: Service;
  runnerPoolId?: number;
  runnerPool?: RunnerPool;
  overrideType: OverrideType;
  startTime?: string;
  endTime?: string;
  reason?: string;
  autoExpire: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RunnerPool {
  id: number;
  name: string;
  description?: string;
  displayOnHome: boolean;
  displayOrder: number;
  staff?: Staff[];
  createdAt: string;
  updatedAt: string;
}

export interface RunnerAllocation {
  id: number;
  staffId: number;
  staff?: Staff;
  departmentId?: number;
  department?: Department;
  serviceId?: number;
  service?: Service;
  runnerPoolId?: number;
  runnerPool?: RunnerPool;
  startDate: string;
  endDate?: string;
  createdByOverrideId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ZeroStartDate {
  id: string;
  name: string;
  date: string;
}

export interface Settings {
  id: number;
  timeFormat: '12' | '24';
  zeroStartDates: ZeroStartDate[];
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Form types
export interface CreateBuildingForm {
  name: string;
}

export interface CreateDepartmentForm {
  name: string;
  buildingId: number;
  is24x7?: boolean;
  operationalDays: DayOfWeek[];
  startTime: string;
  endTime: string;
  minStaff: number;
  displayOnHome?: boolean;
}

export interface CreateServiceForm {
  name: string;
  is24x7?: boolean;
  operationalDays: DayOfWeek[];
  startTime: string;
  endTime: string;
  minStaff: number;
  displayOnHome?: boolean;
}

export interface CreateStaffForm {
  name: string;
  category?: StaffCategory;
  isNightStaff?: boolean;
  scheduleType?: ScheduleType;
  daysOn?: number;
  daysOff?: number;
  shiftOffset?: number;
  zeroStartDateId?: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
  contractedDays: DayOfWeek[];
  runnerPoolId?: number;
}

export interface CreateAllocationForm {
  staffId: number;
  departmentId?: number;
  serviceId?: number;
}

export interface CreateOverrideForm {
  date: string;
  endDate?: string;
  staffId: number;
  departmentId?: number;
  serviceId?: number;
  runnerPoolId?: number;
  overrideType: OverrideType;
  startTime?: string;
  endTime?: string;
  reason?: string;
  autoExpire?: boolean;
}

export interface CreateRunnerPoolForm {
  name: string;
  description?: string;
  displayOnHome?: boolean;
  displayOrder?: number;
}

export interface CreateRunnerAllocationForm {
  staffId: number;
  departmentId?: number;
  serviceId?: number;
  runnerPoolId?: number;
  startDate: string;
  endDate?: string;
}



// Home screen computed types
export interface StaffStatus {
  staff: Staff;
  allocation?: StaffAllocation;
  override?: DailyOverride;
  isActive: boolean;
  isAbsent: boolean;
  isScheduled: boolean;
  isOffDuty: boolean;
  currentLocation: string;
}

export interface DepartmentStatus {
  department: Department;
  assignedStaff: StaffStatus[];
  isOperational: boolean;
  isUnderstaffed: boolean;
  requiredStaff: number;
  activeStaff: number;
}

export interface ServiceStatus {
  service: Service;
  assignedStaff: StaffStatus[];
  isOperational: boolean;
  isUnderstaffed: boolean;
  requiredStaff: number;
  activeStaff: number;
}

export interface RunnerPoolStatus {
  runnerPool: RunnerPool;
  assignedStaff: StaffStatus[];
  temporarilyAllocatedStaff: StaffStatus[];
  activeStaff: number;
  totalStaff: number;
}
