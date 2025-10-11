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

  allocations?: StaffAllocation[];
  dailyOverrides?: DailyOverride[];
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
  staffId: number;
  staff?: Staff;
  departmentId?: number;
  department?: Department;
  serviceId?: number;
  service?: Service;
  overrideType: OverrideType;
  startTime?: string;
  endTime?: string;
  reason?: string;
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
  scheduleType?: ScheduleType;
  daysOn?: number;
  daysOff?: number;
  shiftOffset?: number;
  zeroStartDateId?: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
  contractedDays: DayOfWeek[];
}

export interface CreateAllocationForm {
  staffId: number;
  departmentId?: number;
  serviceId?: number;
}

export interface CreateOverrideForm {
  date: string;
  staffId: number;
  departmentId?: number;
  serviceId?: number;
  overrideType: OverrideType;
  startTime?: string;
  endTime?: string;
  reason?: string;
}



// Home screen computed types
export interface StaffStatus {
  staff: Staff;
  allocation?: StaffAllocation;
  override?: DailyOverride;
  isActive: boolean;
  isAbsent: boolean;
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
