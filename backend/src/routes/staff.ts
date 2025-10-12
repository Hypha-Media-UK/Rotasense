import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { daysOfWeekSchema, timeSchema, staffCategorySchema, scheduleTypeSchema, nonEmptyStringSchema, optionalPositiveIntSchema, optionalNonNegativeIntSchema, zeroStartDateIdSchema, validateShiftTimes } from '../validation/schemas';

const router = express.Router();

// Validation schemas
const createStaffSchema = z.object({
  name: nonEmptyStringSchema.describe('Staff name is required'),
  category: staffCategorySchema.optional(),
  isNightStaff: z.boolean().optional(),
  scheduleType: scheduleTypeSchema.optional(),
  daysOn: optionalPositiveIntSchema,
  daysOff: optionalPositiveIntSchema,
  shiftOffset: optionalNonNegativeIntSchema,
  zeroStartDateId: zeroStartDateIdSchema.optional(),
  defaultStartTime: timeSchema.optional(),
  defaultEndTime: timeSchema.optional(),
  contractedDays: daysOfWeekSchema,
  runnerPoolId: optionalPositiveIntSchema
}).refine(
  (data) => {
    // If scheduleType is SHIFT_CYCLE, require shift cycle fields
    if (data.scheduleType === 'SHIFT_CYCLE') {
      return data.daysOn && data.daysOff !== undefined && data.zeroStartDateId;
    }
    return true;
  },
  {
    message: "For shift cycle schedules, daysOn, daysOff, and zeroStartDateId are required"
  }
).refine(
  (data) => {
    // Validate shift times if both are provided
    if (data.defaultStartTime && data.defaultEndTime) {
      const validation = validateShiftTimes(data.defaultStartTime, data.defaultEndTime);
      return validation.isValid;
    }
    return true;
  },
  {
    message: "Invalid shift times: shift duration must be between 1-12 hours and start/end times cannot be the same"
  }
);

const updateStaffSchema = z.object({
  name: nonEmptyStringSchema.optional(),
  category: staffCategorySchema.optional(),
  scheduleType: scheduleTypeSchema.optional(),
  daysOn: optionalPositiveIntSchema,
  daysOff: optionalPositiveIntSchema,
  shiftOffset: optionalNonNegativeIntSchema,
  zeroStartDateId: zeroStartDateIdSchema.optional(),
  defaultStartTime: timeSchema.optional(),
  defaultEndTime: timeSchema.optional(),
  contractedDays: daysOfWeekSchema.optional()
}).refine(
  (data) => {
    // If scheduleType is SHIFT_CYCLE, require shift cycle fields
    if (data.scheduleType === 'SHIFT_CYCLE') {
      return data.daysOn && data.daysOff && data.zeroStartDateId;
    }
    return true;
  },
  {
    message: "For shift cycle schedules, daysOn, daysOff, and zeroStartDateId are required"
  }
).refine(
  (data) => {
    // Validate shift times if both are provided
    if (data.defaultStartTime && data.defaultEndTime) {
      const validation = validateShiftTimes(data.defaultStartTime, data.defaultEndTime);
      return validation.isValid;
    }
    return true;
  },
  {
    message: "Invalid shift times: shift duration must be between 1-12 hours and start/end times cannot be the same"
  }
);

// GET /api/staff - Get all staff members
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    
    const whereClause: any = {};
    if (category && typeof category === 'string') {
      whereClause.category = category.toUpperCase();
    }

    const staff = await prisma.staff.findMany({
      where: whereClause,
      include: {
        staff_allocations: {
          include: {
            departments: {
              include: {
                buildings: true
              }
            },
            services: true
          }
        },
        runner_pools: true,
        runner_allocations: {
          include: {
            departments: {
              include: {
                buildings: true
              }
            },
            services: true,
            runner_pools: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Parse JSON strings back to arrays
    const staffWithParsedData = staff.map(member => ({
      ...member,
      contractedDays: JSON.parse(member.contractedDays)
    }));

    res.json(staffWithParsedData);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// GET /api/staff/:id - Get a specific staff member
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid staff ID' });
    }

    const staff = await prisma.staff.findUnique({
      where: { id },
      include: {
        staff_allocations: {
          include: {
            departments: {
              include: {
                buildings: true
              }
            },
            services: true
          }
        }
      }
    });

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const staffWithParsedData = {
      ...staff,
      contractedDays: JSON.parse(staff.contractedDays)
    };

    res.json(staffWithParsedData);
  } catch (error) {
    console.error('Error fetching staff member:', error);
    res.status(500).json({ error: 'Failed to fetch staff member' });
  }
});

// POST /api/staff - Create a new staff member
router.post('/', async (req, res) => {
  try {
    const validatedData = createStaffSchema.parse(req.body);
    
    const staff = await prisma.staff.create({
      data: {
        ...validatedData,
        contractedDays: JSON.stringify(validatedData.contractedDays)
      },
      include: {
        staff_allocations: {
          include: {
            departments: {
              include: {
                buildings: true
              }
            },
            services: true
          }
        }
      }
    });

    const staffWithParsedData = {
      ...staff,
      contractedDays: JSON.parse(staff.contractedDays)
    };

    res.status(201).json(staffWithParsedData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.issues 
      });
    }
    
    console.error('Error creating staff member:', error);
    res.status(500).json({ error: 'Failed to create staff member' });
  }
});

// PUT /api/staff/:id - Update a staff member
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid staff ID' });
    }

    const validatedData = updateStaffSchema.parse(req.body);
    
    const updateData: any = { ...validatedData };
    if (validatedData.contractedDays) {
      updateData.contractedDays = JSON.stringify(validatedData.contractedDays);
    }
    
    const staff = await prisma.staff.update({
      where: { id },
      data: updateData,
      include: {
        staff_allocations: {
          include: {
            departments: {
              include: {
                buildings: true
              }
            },
            services: true
          }
        }
      }
    });

    const staffWithParsedData = {
      ...staff,
      contractedDays: JSON.parse(staff.contractedDays)
    };

    res.json(staffWithParsedData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.issues
      });
    }
    
    console.error('Error updating staff member:', error);
    res.status(500).json({ error: 'Failed to update staff member' });
  }
});

// DELETE /api/staff/:id - Delete a staff member
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid staff ID' });
    }

    await prisma.staff.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting staff member:', error);
    res.status(500).json({ error: 'Failed to delete staff member' });
  }
});

export default router;
