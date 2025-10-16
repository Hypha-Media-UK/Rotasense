// Test the API responses to verify supervisor data
const fetch = require('node-fetch');

async function testAPI() {
    try {
        console.log('=== TESTING API RESPONSES ===\n');
        
        // Test 1: Get supervisors
        console.log('1. Fetching supervisors...');
        const supervisorsResponse = await fetch('http://localhost:3000/api/staff?category=supervisor');
        const supervisors = await supervisorsResponse.json();
        
        console.log(`Found ${supervisors.length} supervisors:`);
        supervisors.forEach(s => {
            console.log(`  - ${s.name}: ${s.shiftPattern}, offset ${s.shiftOffset}, zero date ${s.zeroStartDateId}`);
        });
        
        // Test 2: Get settings
        console.log('\n2. Fetching settings...');
        const settingsResponse = await fetch('http://localhost:3000/api/settings');
        const settings = await settingsResponse.json();
        
        console.log('Zero start dates:');
        settings.zeroStartDates.forEach(zsd => {
            console.log(`  - ${zsd.id}: ${zsd.name} (${zsd.date})`);
        });
        
        // Test 3: Get departments
        console.log('\n3. Fetching departments...');
        const departmentsResponse = await fetch('http://localhost:3000/api/departments');
        const departments = await departmentsResponse.json();
        
        const relevantDepts = departments.filter(d => d.name === 'ITU' || d.name === 'A+E');
        console.log('Relevant departments:');
        relevantDepts.forEach(d => {
            console.log(`  - ${d.name}: displayOnHome=${d.displayOnHome}, operational=${d.operationalDays}`);
        });
        
        // Test 4: Verify supervisor allocations
        console.log('\n4. Supervisor allocations:');
        supervisors.forEach(supervisor => {
            if (supervisor.staff_allocations.length > 0) {
                const allocation = supervisor.staff_allocations[0];
                const location = allocation.departments?.name || allocation.services?.name || 'Unknown';
                console.log(`  - ${supervisor.name} → ${location}`);
            } else {
                console.log(`  - ${supervisor.name} → No allocation`);
            }
        });
        
        // Test 5: Calculate expected shifts for today
        console.log('\n5. Expected shifts for 2025-10-16:');
        const testDate = new Date('2025-10-16');
        const supervisorZeroDate = new Date('2025-10-13');
        
        const daysSinceZero = Math.floor(
            (testDate.getTime() - supervisorZeroDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        supervisors.filter(s => s.shiftPattern === 'ROTATING_DAY_NIGHT').forEach(supervisor => {
            const adjustedDays = daysSinceZero + supervisor.shiftOffset;
            const megaCycleLength = 16;
            const cycleDay = ((adjustedDays % megaCycleLength) + megaCycleLength) % megaCycleLength + 1;
            
            let isOnDuty, shiftType;
            
            if (cycleDay <= 4) {
                isOnDuty = true;
                shiftType = 'day';
            } else if (cycleDay <= 8) {
                isOnDuty = false;
                shiftType = 'day';
            } else if (cycleDay <= 12) {
                isOnDuty = true;
                shiftType = 'night';
            } else {
                isOnDuty = false;
                shiftType = 'night';
            }
            
            const allocation = supervisor.staff_allocations[0];
            const location = allocation?.departments?.name || allocation?.services?.name || 'No allocation';
            
            console.log(`  - ${supervisor.name} (${location}): ${isOnDuty ? 'ON DUTY' : 'OFF DUTY'} (${shiftType})`);
        });
        
        console.log('\n=== EXPECTED HOMEPAGE DISPLAY ===');
        console.log('ITU Department:');
        console.log('  Day Shift: Luke Clements');
        console.log('  Night Shift: Martin Smith');
        console.log('A+E Department:');
        console.log('  Day Shift: (none - Chris Crombie off duty)');
        console.log('  Night Shift: (none - Martin Fearon off duty)');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testAPI();
