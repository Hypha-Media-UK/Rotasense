"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const staffNames = [
    'AJ', 'Alan Clark', 'Alan Kelly', 'Allen Butler', 'Andrew Gibson', 'Andrew Hassall',
    'Andrew Trudgeon', 'Andy Clayton', 'Brian Cassidy', 'Carla Barton', 'Charlotte Rimmer',
    'Chris Huckaby', 'Chris Roach', 'Chris Wardle', 'Colin Bromley', 'Craig Butler',
    'Darren Flowers', 'Darren Milhench', 'Darren Mycroft', 'David Sykes', 'Dean Pickering',
    'Duane Kulikowski', 'Edward Collier', 'Eloisa Andrew', 'Gary Booth', 'Gary Bromley',
    'Gavin Marsden', 'Ian Moss', 'Ian Speakes', 'Jake Moran', 'James Bennett',
    'James Mitchell', 'Jason Newton', 'Jeff Robinson', 'Joe Redfearn', 'John Evans',
    'Jordon Fish', 'Julie Greenough', 'Karen Blackett', 'Kevin Gaskell', 'Kevin Tomlinson',
    'Kyle Blackshaw', 'Kyle Sanderson', 'Lee Stafford', 'Lewis Yearsley', 'Lucy Redfearn',
    'Lynne Warner', 'Mark Dickinson', 'Mark Haughton', 'Mark Lloyd', 'Mark Walton',
    'Martin Hobson', 'Martin Kenyon', 'Matthew Bennett', 'Matthew Cope', 'Matthew Rushton',
    'Merv Permalloo', 'Michael Shaw', 'Mike Brennan', 'Nicola Benger', 'Nigel Beesley',
    'Paul Berry', 'Paul Fisher', 'Paul Flowers', 'Peter Moss', 'Phil Hollinshead',
    'Regan Stringer', 'Rob Mcpartland', 'Robert Frost', 'Roy Harris', 'Scott Cartledge',
    'Simon Collins', 'Soloman Offei', 'Stepen Bowater', 'Stephen Burke', 'Stephen Cooper',
    'Stephen Kirk', 'Stephen Scarsbrook', 'Steven Richardson', 'Stuart Ford', 'Stuart Lomas',
    'Tomas Konkol', 'Tony Batters'
];
const buildingsData = [
    {
        name: 'Hartshead Building',
        departments: [
            'AMU', 'IAU', 'SDEC', 'ISGU', 'ITU', 'A+E', 'Discharge Lounge', 'Green Suite',
            'Theatres North', 'Theatres South', 'G/F Xray', 'L/G/F Xray', 'CT Scan', 'MRI',
            'Blue Suite', 'Yellow Suite', 'Clinics A-F', 'Swan Room', 'South Reception',
            'Children\'s Outpatients', 'Pharmacy', 'Children\'s Ward', 'Children\'s O+A',
            'DSEU', 'EOU', 'POU', 'Pathology', 'Mortuary', 'Rose Cottage', 'Walk in Center'
        ]
    },
    {
        name: 'Ladysmith Building',
        departments: [
            'Ward 40', 'Ward 41', 'Ward 42', 'Ward 43', 'Ward 44', 'Ward 45', 'Ward 46', 'Xray 4'
        ]
    },
    {
        name: 'Macmillan Unit',
        departments: ['Macmillan']
    },
    {
        name: 'Charlesworth Building',
        departments: [
            'Ward 31', 'Ward 30', 'Ward 27', 'NICU', 'Acorn Birth Center', 'Labour Ward',
            'Women\'s Health', 'Maternity Triage', 'Labour Theatre One', 'Labour Theatre Two'
        ]
    }
];
async function main() {
    console.log('🌱 Starting database seed...');
    // Create default settings with zero start dates
    await prisma.settings.upsert({
        where: { id: 1 },
        update: {
            zeroStartDates: JSON.stringify([
                {
                    id: 'default',
                    name: 'Default (2024)',
                    date: '2024-01-01'
                },
                {
                    id: 'alt-2024',
                    name: 'Alternative 2024',
                    date: '2024-01-06'
                },
                {
                    id: 'supervisor-2025',
                    name: 'Supervisor Pattern (2025)',
                    date: '2025-10-13'
                }
            ])
        },
        create: {
            timeFormat: '24',
            zeroStartDates: JSON.stringify([
                {
                    id: 'default',
                    name: 'Default (2024)',
                    date: '2024-01-01'
                },
                {
                    id: 'alt-2024',
                    name: 'Alternative 2024',
                    date: '2024-01-06'
                },
                {
                    id: 'supervisor-2025',
                    name: 'Supervisor Pattern (2025)',
                    date: '2025-10-13'
                }
            ])
        }
    });
    console.log('✅ Settings created');
    // Create buildings and departments
    for (const buildingData of buildingsData) {
        const building = await prisma.buildings.upsert({
            where: { name: buildingData.name },
            update: {},
            create: {
                name: buildingData.name
            }
        });
        console.log(`✅ Building created: ${building.name}`);
        // Create departments for this building
        for (let i = 0; i < buildingData.departments.length; i++) {
            const deptName = buildingData.departments[i];
            await prisma.departments.upsert({
                where: {
                    name_buildingId: {
                        name: deptName,
                        buildingId: building.id
                    }
                },
                update: {
                    // Show ITU and A+E on homepage (they have supervisors)
                    displayOnHome: deptName.includes('ITU') || deptName.includes('A+E') || deptName.includes('Emergency') || i % 3 !== 2
                },
                create: {
                    name: deptName,
                    buildingId: building.id,
                    // Make Emergency and ICU departments 24/7
                    is24x7: deptName.includes('Emergency') || deptName.includes('ICU') || deptName.includes('Critical Care'),
                    operationalDays: JSON.stringify(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
                    startTime: '08:00',
                    endTime: '20:00',
                    minStaff: 2,
                    // Show ITU and A+E on homepage (they have supervisors), others default to false
                    displayOnHome: deptName.includes('ITU') || deptName.includes('A+E') || deptName.includes('Emergency')
                }
            });
        }
        console.log(`✅ Departments created for ${building.name}: ${buildingData.departments.length} departments`);
    }
    // Create staff members with different schedule types
    const staffConfigurations = [
        // Regular daily schedule staff (first 8 staff members)
        ...staffNames.slice(0, 8).map(name => ({
            name,
            category: 'REGULAR',
            scheduleType: 'DAILY',
            defaultStartTime: '08:00',
            defaultEndTime: '20:00',
            contractedDays: JSON.stringify(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])
        })),
        // Shift cycle staff (last 2 staff members)
        {
            name: staffNames[8], // Brian Cassidy
            category: 'REGULAR',
            scheduleType: 'SHIFT_CYCLE',
            daysOn: 4,
            daysOff: 4,
            shiftOffset: 0, // Group A
            zeroStartDateId: 'default',
            defaultStartTime: '08:00',
            defaultEndTime: '20:00',
            contractedDays: JSON.stringify([]) // Empty for shift cycles
        },
        {
            name: staffNames[9], // Carla Barton
            category: 'REGULAR',
            scheduleType: 'SHIFT_CYCLE',
            daysOn: 4,
            daysOff: 4,
            shiftOffset: 4, // Group B
            zeroStartDateId: 'default',
            defaultStartTime: '08:00',
            defaultEndTime: '20:00',
            contractedDays: JSON.stringify([]) // Empty for shift cycles
        },
        // Test overnight shift staff member
        {
            name: 'Nicola Benger',
            category: 'REGULAR',
            scheduleType: 'DAILY',
            defaultStartTime: '13:00',
            defaultEndTime: '01:00',
            contractedDays: JSON.stringify(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])
        },
        // Supervisors with 8-day cycle that automatically switches between day and night
        {
            name: 'Martin Smith',
            category: 'SUPERVISOR',
            scheduleType: 'SHIFT_CYCLE',
            shiftPattern: 'FIXED',
            daysOn: 4,
            daysOff: 4,
            shiftOffset: 8, // Offset 8 to start on night shift
            zeroStartDateId: 'default',
            defaultStartTime: '08:00',
            defaultEndTime: '20:00',
            contractedDays: JSON.stringify([]) // Empty for shift cycles
        },
        {
            name: 'Luke Clements',
            category: 'SUPERVISOR',
            scheduleType: 'SHIFT_CYCLE',
            shiftPattern: 'FIXED',
            daysOn: 4,
            daysOff: 4,
            shiftOffset: 0, // Offset 0 to start on day shift
            zeroStartDateId: 'default',
            defaultStartTime: '08:00',
            defaultEndTime: '20:00',
            contractedDays: JSON.stringify([]) // Empty for shift cycles
        },
        {
            name: 'Martin Fearon',
            category: 'SUPERVISOR',
            scheduleType: 'SHIFT_CYCLE',
            shiftPattern: 'FIXED',
            daysOn: 4,
            daysOff: 4,
            shiftOffset: 12, // Offset 12 for different timing
            zeroStartDateId: 'default',
            defaultStartTime: '08:00',
            defaultEndTime: '20:00',
            contractedDays: JSON.stringify([]) // Empty for shift cycles
        },
        {
            name: 'Chris Crombie',
            category: 'SUPERVISOR',
            scheduleType: 'SHIFT_CYCLE',
            shiftPattern: 'FIXED',
            daysOn: 4,
            daysOff: 4,
            shiftOffset: 4, // Offset 4 for different timing
            zeroStartDateId: 'default',
            defaultStartTime: '08:00',
            defaultEndTime: '20:00',
            contractedDays: JSON.stringify([]) // Empty for shift cycles
        }
    ];
    for (const staffConfig of staffConfigurations) {
        await prisma.staff.upsert({
            where: { name: staffConfig.name },
            update: staffConfig, // Update existing staff with new configuration
            create: staffConfig
        });
    }
    console.log(`✅ Staff members created: ${staffConfigurations.length} staff`);
    // Create some example services
    const services = [
        { name: 'Emergency Response', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], display: true },
        { name: 'Patient Transport', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], display: true },
        { name: 'Equipment Maintenance', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], display: false }
    ];
    for (const service of services) {
        await prisma.services.upsert({
            where: { name: service.name },
            update: {
                displayOnHome: false
            },
            create: {
                name: service.name,
                // Make Security service 24/7
                is24x7: service.name.includes('Security'),
                operationalDays: JSON.stringify(service.days),
                startTime: '08:00',
                endTime: '20:00',
                minStaff: 1,
                displayOnHome: false
            }
        });
    }
    console.log(`✅ Services created: ${services.length} services`);
    // Note: Shift types are now configured directly on staff members
    // Create sample staff allocations (now just assignments, schedule is on staff)
    const sampleAllocations = [
        // Allocate some staff to departments (schedule comes from staff configuration)
        { staffId: 1, departmentId: 1 }, // AJ to AMU
        { staffId: 2, departmentId: 2 }, // Alan Clark to IAU
        { staffId: 3, departmentId: 5 }, // Alan Kelly to ITU
        { staffId: 4, departmentId: 6 }, // Allen Butler to A+E
        { staffId: 5, departmentId: 31 }, // Andrew Gibson to Ward 40
        { staffId: 6, departmentId: 32 }, // Andrew Hassall to Ward 41
        // Allocate some staff to services (schedule comes from staff configuration)
        { staffId: 7, serviceId: 1 }, // Andrew Trudgeon to Emergency Response
        { staffId: 8, serviceId: 2 }, // Andy Clayton to Patient Transport
        // Shift cycle staff assignments (schedule configured on staff level)
        { staffId: 9, departmentId: 1 }, // Brian Cassidy (4-on/4-off Group A) to AMU
        { staffId: 10, departmentId: 2 }, // Carla Barton (4-on/4-off Group B) to IAU
    ];
    // Create supervisor allocations using dynamic IDs
    const staffByName = await prisma.staff.findMany({
        select: { id: true, name: true }
    });
    const getStaffId = (name) => staffByName.find(s => s.name === name)?.id;
    const departments = await prisma.departments.findMany({
        select: { id: true, name: true }
    });
    const getDeptId = (name) => departments.find(d => d.name === name)?.id;
    const supervisorAllocations = [
        { staffId: getStaffId('Martin Smith'), departmentId: getDeptId('ITU') },
        { staffId: getStaffId('Luke Clements'), departmentId: getDeptId('ITU') },
        { staffId: getStaffId('Martin Fearon'), departmentId: getDeptId('A+E') },
        { staffId: getStaffId('Chris Crombie'), departmentId: getDeptId('A+E') },
    ].filter(allocation => allocation.staffId && allocation.departmentId);
    // Create regular staff allocations
    for (const allocation of sampleAllocations) {
        try {
            await prisma.staff_allocations.create({
                data: allocation
            });
        }
        catch (error) {
            // Skip if allocation already exists
            console.log(`Skipping existing allocation: ${JSON.stringify(allocation)}`);
        }
    }
    // Create supervisor allocations
    for (const allocation of supervisorAllocations) {
        try {
            await prisma.staff_allocations.create({
                data: {
                    staffId: allocation.staffId,
                    departmentId: allocation.departmentId
                }
            });
        }
        catch (error) {
            // Skip if allocation already exists
            console.log(`Skipping existing supervisor allocation: ${JSON.stringify(allocation)}`);
        }
    }
    console.log(`✅ Sample allocations created: ${sampleAllocations.length} allocations`);
    console.log('🎉 Database seed completed successfully!');
}
main()
    .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map