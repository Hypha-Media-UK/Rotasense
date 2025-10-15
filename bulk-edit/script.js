// Global state
let staffData = [];
let zeroStartDates = [];
let pendingChanges = new Map();

// API base URL - adjust this to match your backend
const API_BASE = 'http://localhost:3000/api';

// Auto-refresh settings
let autoRefreshInterval;
const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds
let lastZeroStartDatesHash = '';

// DOM elements
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const staffTable = document.getElementById('staffTable');
const staffTableBody = document.getElementById('staffTableBody');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const scheduleFilter = document.getElementById('scheduleFilter');
const saveAllBtn = document.getElementById('saveAllBtn');
const refreshBtn = document.getElementById('refreshBtn');
const checkZeroStartBtn = document.getElementById('checkZeroStartBtn');
const autoRefreshIndicator = document.getElementById('autoRefreshIndicator');
const staffCount = document.getElementById('staffCount');
const changedCount = document.getElementById('changedCount');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadInitialData();
    startAutoRefresh();
});

function initializeEventListeners() {
    // Search and filter
    searchInput.addEventListener('input', debounce(filterStaff, 300));
    scheduleFilter.addEventListener('change', filterStaff);
    
    // Action buttons
    saveAllBtn.addEventListener('click', saveAllChanges);
    refreshBtn.addEventListener('click', loadInitialData);
    checkZeroStartBtn.addEventListener('click', refreshZeroStartDates);
    
    // Message close buttons
    document.querySelector('.error-close').addEventListener('click', () => hideMessage('error'));
    document.querySelector('.success-close').addEventListener('click', () => hideMessage('success'));
}

async function loadInitialData() {
    showLoading(true);
    hideMessages();
    
    try {
        // Load staff data and zero start dates in parallel
        const [staffResponse, zeroStartResponse] = await Promise.all([
            fetch(`${API_BASE}/staff`),
            fetch(`${API_BASE}/zero-start-dates`)
        ]);
        
        if (!staffResponse.ok || !zeroStartResponse.ok) {
            throw new Error('Failed to fetch data from server');
        }
        
        staffData = await staffResponse.json();
        const newZeroStartDates = await zeroStartResponse.json();

        // Check if zero start dates have changed
        const newHash = JSON.stringify(newZeroStartDates);
        const zeroStartDatesChanged = lastZeroStartDatesHash && lastZeroStartDatesHash !== newHash;

        zeroStartDates = newZeroStartDates;
        lastZeroStartDatesHash = newHash;

        // Clear pending changes
        pendingChanges.clear();

        // Show notification if zero start dates changed
        if (zeroStartDatesChanged) {
            showMessage('success', `⚠️ Zero start dates updated! Please review staff calculations.`);
        }
        
        renderStaffTable();
        updateStats();
        
    } catch (error) {
        console.error('Error loading data:', error);
        showMessage('error', 'Failed to load staff data. Please check your connection and try again.');
    } finally {
        showLoading(false);
    }
}

function renderStaffTable() {
    const filteredStaff = getFilteredStaff();
    
    if (filteredStaff.length === 0) {
        staffTable.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    staffTable.style.display = 'table';
    emptyState.style.display = 'none';
    
    staffTableBody.innerHTML = filteredStaff.map(staff => createStaffRow(staff)).join('');
    
    // Add event listeners to inputs
    staffTableBody.querySelectorAll('.table-input').forEach(input => {
        input.addEventListener('input', handleInputChange);
    });
    
    staffTableBody.querySelectorAll('.btn-save').forEach(btn => {
        btn.addEventListener('click', handleSaveRow);
    });
}

function createStaffRow(staff) {
    const hasChanges = pendingChanges.has(staff.id);
    const pendingScheduleType = hasChanges && pendingChanges.get(staff.id).scheduleType;
    const currentScheduleType = pendingScheduleType || staff.scheduleType;
    const isShiftCycle = currentScheduleType === 'SHIFT_CYCLE';

    // Debug: Log staff with missing zero start dates
    if (isShiftCycle && !staff.zeroStartDateId) {
        console.log(`SHIFT_CYCLE staff ${staff.name} (ID: ${staff.id}) has no zeroStartDateId:`, staff.zeroStartDateId);
    }
    
    return `
        <tr data-staff-id="${staff.id}" class="${hasChanges ? 'changed' : ''}">
            <td>
                <strong>${escapeHtml(staff.name)}</strong>
            </td>
            <td>
                <select class="table-input ${hasChanges && pendingChanges.get(staff.id).scheduleType !== undefined ? 'changed' : ''}"
                        data-field="scheduleType"
                        title="Change schedule type">
                    <option value="DAILY" ${staff.scheduleType === 'DAILY' ? 'selected' : ''}>Daily</option>
                    <option value="SHIFT_CYCLE" ${staff.scheduleType === 'SHIFT_CYCLE' ? 'selected' : ''}>Shift Cycle</option>
                </select>
            </td>
            <td>
                <input type="time" 
                       class="table-input" 
                       data-field="defaultStartTime" 
                       value="${staff.defaultStartTime || '08:00'}"
                       ${hasChanges && pendingChanges.get(staff.id).defaultStartTime !== undefined ? 'class="table-input changed"' : ''}>
            </td>
            <td>
                <input type="time" 
                       class="table-input" 
                       data-field="defaultEndTime" 
                       value="${staff.defaultEndTime || '20:00'}"
                       ${hasChanges && pendingChanges.get(staff.id).defaultEndTime !== undefined ? 'class="table-input changed"' : ''}>
            </td>
            <td>
                <input type="number"
                       class="table-input"
                       data-field="shiftOffset"
                       value="${staff.shiftOffset || 0}"
                       ${!isShiftCycle ? 'disabled' : ''}
                       ${hasChanges && pendingChanges.get(staff.id).shiftOffset !== undefined ? 'class="table-input changed"' : ''}>
            </td>
            <td>
                <select class="table-input ${hasChanges && pendingChanges.get(staff.id).zeroStartDateId !== undefined ? 'changed' : ''}"
                        data-field="zeroStartDateId"
                        ${!isShiftCycle ? 'disabled title="Only available for shift cycle staff"' : 'title="Select zero start date for shift calculations"'}>
                    <option value="">${isShiftCycle ? 'Select zero start date...' : 'N/A (Daily schedule)'}</option>
                    ${isShiftCycle ? zeroStartDates.map(date => `
                        <option value="${date.id}" ${staff.zeroStartDateId === date.id ? 'selected' : ''}>
                            ${formatDate(date.date)} - ${escapeHtml(date.description)}
                        </option>
                    `).join('') : ''}
                </select>
            </td>
            <td>
                <button class="btn btn-save" data-staff-id="${staff.id}">Save</button>
            </td>
        </tr>
    `;
}

function handleInputChange(event) {
    const input = event.target;
    const row = input.closest('tr');
    const staffId = parseInt(row.dataset.staffId);
    const field = input.dataset.field;
    let value = input.value;

    // Convert numeric fields to proper types
    if (field === 'shiftOffset') {
        value = value ? parseInt(value) : 0;
    }

    // Get original staff data
    const originalStaff = staffData.find(s => s.id === staffId);
    if (!originalStaff) return;

    // Check if value has changed from original
    const originalValue = originalStaff[field];
    let defaultValue;
    if (field.includes('Time')) {
        defaultValue = field === 'defaultStartTime' ? '08:00' : '20:00';
    } else if (field === 'shiftOffset') {
        defaultValue = 0;
    } else {
        defaultValue = '';
    }

    const hasChanged = value !== (originalValue || defaultValue);

    if (hasChanged) {
        // Add to pending changes
        if (!pendingChanges.has(staffId)) {
            pendingChanges.set(staffId, {});
        }
        pendingChanges.get(staffId)[field] = value;
        input.classList.add('changed');
        row.classList.add('changed');
    } else {
        // Remove from pending changes
        if (pendingChanges.has(staffId)) {
            delete pendingChanges.get(staffId)[field];
            if (Object.keys(pendingChanges.get(staffId)).length === 0) {
                pendingChanges.delete(staffId);
                row.classList.remove('changed');
            }
        }
        input.classList.remove('changed');
    }

    // Special handling for schedule type changes
    if (field === 'scheduleType') {
        updateRowFieldsForScheduleType(row, staffId, value);
    }

    updateStats();
    saveAllBtn.disabled = pendingChanges.size === 0;
}

function updateRowFieldsForScheduleType(row, staffId, newScheduleType) {
    const zeroStartDateSelect = row.querySelector('[data-field="zeroStartDateId"]');
    const shiftOffsetInput = row.querySelector('[data-field="shiftOffset"]');

    if (newScheduleType === 'SHIFT_CYCLE') {
        // Enable zero start date and shift offset fields
        zeroStartDateSelect.disabled = false;
        zeroStartDateSelect.title = 'Select zero start date for shift calculations';
        shiftOffsetInput.disabled = false;
        shiftOffsetInput.title = 'Group offset for shift cycle. Positive values (0, 4, 8...) = Groups A, B, C... Negative values (-4, -8...) = Earlier groups';

        // Update placeholder text
        const firstOption = zeroStartDateSelect.querySelector('option[value=""]');
        if (firstOption) {
            firstOption.textContent = 'Select zero start date...';
        }
    } else {
        // Disable zero start date and shift offset fields for DAILY
        zeroStartDateSelect.disabled = true;
        zeroStartDateSelect.title = 'Only available for shift cycle staff';
        shiftOffsetInput.disabled = true;
        shiftOffsetInput.title = 'Only available for shift cycle staff';

        // Update placeholder text
        const firstOption = zeroStartDateSelect.querySelector('option[value=""]');
        if (firstOption) {
            firstOption.textContent = 'N/A (Daily schedule)';
        }

        // Clear any pending changes for these fields
        if (pendingChanges.has(staffId)) {
            const changes = pendingChanges.get(staffId);
            delete changes.zeroStartDateId;
            delete changes.shiftOffset;

            // Remove visual indicators
            zeroStartDateSelect.classList.remove('changed');
            shiftOffsetInput.classList.remove('changed');

            if (Object.keys(changes).length === 0) {
                pendingChanges.delete(staffId);
                row.classList.remove('changed');
            }
        }
    }
}

async function handleSaveRow(event) {
    const staffId = parseInt(event.target.dataset.staffId);
    const changes = pendingChanges.get(staffId);

    if (!changes) {
        showMessage('error', 'No changes to save for this staff member.');
        return;
    }

    try {
        event.target.disabled = true;
        event.target.textContent = 'Saving...';

        // Get the original staff data to ensure we include all required fields
        const originalStaff = staffData.find(s => s.id === staffId);
        if (!originalStaff) {
            throw new Error('Staff member not found');
        }

        // For SHIFT_CYCLE staff, ensure all required fields are included
        let updateData = { ...changes };
        const newScheduleType = updateData.scheduleType || originalStaff.scheduleType;

        if (newScheduleType === 'SHIFT_CYCLE') {
            updateData = {
                ...updateData,
                scheduleType: 'SHIFT_CYCLE',
                daysOn: updateData.daysOn || originalStaff.daysOn || 4,
                daysOff: updateData.daysOff || originalStaff.daysOff || 4,
                zeroStartDateId: updateData.zeroStartDateId || originalStaff.zeroStartDateId || (zeroStartDates.length > 0 ? zeroStartDates[0].id : null)
            };
        }

        const response = await fetch(`${API_BASE}/staff/${staffId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to save changes');
        }

        const updatedStaff = await response.json();

        // Update local data
        const staffIndex = staffData.findIndex(s => s.id === staffId);
        if (staffIndex !== -1) {
            staffData[staffIndex] = { ...staffData[staffIndex], ...changes };
        }

        // Remove from pending changes
        pendingChanges.delete(staffId);

        // Update UI
        renderStaffTable();
        updateStats();
        showMessage('success', `Successfully updated ${updatedStaff.name}. Changes will appear in the main application when you switch back to it.`);

    } catch (error) {
        console.error('Error saving staff:', error);
        showMessage('error', `Failed to save changes: ${error.message}`);
    } finally {
        event.target.disabled = false;
        event.target.textContent = 'Save';
    }
}

async function saveAllChanges() {
    if (pendingChanges.size === 0) return;

    try {
        saveAllBtn.disabled = true;
        saveAllBtn.textContent = 'Saving All...';

        const savePromises = Array.from(pendingChanges.entries()).map(([staffId, changes]) => {
            // Get the original staff data to ensure we include all required fields
            const originalStaff = staffData.find(s => s.id === staffId);
            if (!originalStaff) {
                return Promise.reject(new Error(`Staff member ${staffId} not found`));
            }

            // For SHIFT_CYCLE staff, ensure all required fields are included
            let updateData = { ...changes };
            const newScheduleType = updateData.scheduleType || originalStaff.scheduleType;

            if (newScheduleType === 'SHIFT_CYCLE') {
                updateData = {
                    ...updateData,
                    scheduleType: 'SHIFT_CYCLE',
                    daysOn: updateData.daysOn || originalStaff.daysOn || 4,
                    daysOff: updateData.daysOff || originalStaff.daysOff || 4,
                    zeroStartDateId: updateData.zeroStartDateId || originalStaff.zeroStartDateId || (zeroStartDates.length > 0 ? zeroStartDates[0].id : null)
                };
            }

            return fetch(`${API_BASE}/staff/${staffId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            });
        });

        const responses = await Promise.all(savePromises);

        // Check if all requests were successful
        const failedRequests = responses.filter(response => !response.ok);
        if (failedRequests.length > 0) {
            throw new Error(`${failedRequests.length} requests failed`);
        }

        // Update local data
        for (const [staffId, changes] of pendingChanges.entries()) {
            const staffIndex = staffData.findIndex(s => s.id === staffId);
            if (staffIndex !== -1) {
                staffData[staffIndex] = { ...staffData[staffIndex], ...changes };
            }
        }

        // Clear pending changes
        pendingChanges.clear();

        // Update UI
        renderStaffTable();
        updateStats();
        showMessage('success', `Successfully saved changes for ${responses.length} staff members. Changes will appear in the main application when you switch back to it.`);

    } catch (error) {
        console.error('Error saving all changes:', error);
        showMessage('error', `Some changes failed to save: ${error.message}`);
    } finally {
        saveAllBtn.disabled = true;
        saveAllBtn.textContent = 'Save All Changes';
    }
}

function getFilteredStaff() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const scheduleType = scheduleFilter.value;
    
    return staffData.filter(staff => {
        const matchesSearch = !searchTerm || staff.name.toLowerCase().includes(searchTerm);
        const matchesSchedule = !scheduleType || staff.scheduleType === scheduleType;
        return matchesSearch && matchesSchedule;
    });
}

function filterStaff() {
    renderStaffTable();
    updateStats();
}

function updateStats() {
    const filteredStaff = getFilteredStaff();
    staffCount.textContent = `${filteredStaff.length} staff member${filteredStaff.length !== 1 ? 's' : ''}`;
    changedCount.textContent = `${pendingChanges.size} pending change${pendingChanges.size !== 1 ? 's' : ''}`;
    updateAutoRefreshIndicator();
}

// Auto-refresh functionality
function startAutoRefresh() {
    // Clear any existing interval
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }

    autoRefreshInterval = setInterval(async () => {
        // Only auto-refresh if there are no pending changes
        if (pendingChanges.size === 0) {
            try {
                await refreshZeroStartDates();
                updateAutoRefreshIndicator();
            } catch (error) {
                console.error('Auto-refresh failed:', error);
            }
        } else {
            updateAutoRefreshIndicator();
        }
    }, AUTO_REFRESH_INTERVAL);

    updateAutoRefreshIndicator();
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
    updateAutoRefreshIndicator();
}

function updateAutoRefreshIndicator() {
    if (!autoRefreshIndicator) return;

    if (autoRefreshInterval) {
        if (pendingChanges.size > 0) {
            autoRefreshIndicator.textContent = '🔄 Auto-refresh: PAUSED (pending changes)';
            autoRefreshIndicator.className = 'auto-refresh-indicator paused';
        } else {
            autoRefreshIndicator.textContent = '🔄 Auto-refresh: ON';
            autoRefreshIndicator.className = 'auto-refresh-indicator';
        }
    } else {
        autoRefreshIndicator.textContent = '🔄 Auto-refresh: OFF';
        autoRefreshIndicator.className = 'auto-refresh-indicator paused';
    }
}

// Refresh only zero start dates (lighter than full refresh)
async function refreshZeroStartDates() {
    try {
        const response = await fetch(`${API_BASE}/zero-start-dates`);
        if (!response.ok) return;

        const newZeroStartDates = await response.json();
        const newHash = JSON.stringify(newZeroStartDates);

        if (lastZeroStartDatesHash !== newHash) {
            zeroStartDates = newZeroStartDates;
            lastZeroStartDatesHash = newHash;

            // Re-render the table to update zero start date dropdowns
            renderStaffTable();

            // Show notification
            showMessage('success', `⚠️ Zero start dates updated! Staff calculations refreshed.`);
        }
    } catch (error) {
        console.error('Failed to refresh zero start dates:', error);
    }
}

function showLoading(show) {
    loadingIndicator.style.display = show ? 'flex' : 'none';
}

function showMessage(type, message) {
    hideMessages();
    const messageEl = type === 'error' ? errorMessage : successMessage;
    messageEl.querySelector(`.${type}-text`).textContent = message;
    messageEl.style.display = 'flex';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => hideMessage('success'), 5000);
    }
}

function hideMessage(type) {
    const messageEl = type === 'error' ? errorMessage : successMessage;
    messageEl.style.display = 'none';
}

function hideMessages() {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}
