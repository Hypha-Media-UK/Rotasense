import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { daysOfWeekSchema, timeSchema, positiveIntSchema, nonEmptyStringSchema, validateShiftTimes } from '../validation/schemas';

const router = express.Router();

// Validation schemas
const createDepartmentSchema = z.object({
  name: nonEmptyStringSchema.describe('Department name is required'),
  buildingId: positiveIntSchema.describe('Building ID is required'),
  is24x7: z.boolean().optional(),
  operationalDays: daysOfWeekSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  minStaff: z.number().int().min(1, 'Minimum staff must be at least 1'),
  displayOnHome: z.boolean().optional()
}).refine(
  (data) => {
    // Validate operational times
    const validation = validateShiftTimes(data.startTime, data.endTime);
    return validation.isValid;
  },
  {
    message: "Invalid operational times: duration must be between 1-12 hours and start/end times cannot be the same"
  }
);

const updateDepartmentSchema = z.object({
  name: nonEmptyStringSchema.optional(),
  buildingId: positiveIntSchema.optional(),
  is24x7: z.boolean().optional(),
  operationalDays: daysOfWeekSchema.optional(),
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
  minStaff: z.number().int().min(1, 'Minimum staff must be at least 1').optional(),
  displayOnHome: z.boolean().optional()
}).refine(
  (data) => {
    // Validate operational times if both are provided
    if (data.startTime && data.endTime) {
      const validation = validateShiftTimes(data.startTime, data.endTime);
      return validation.isValid;
    }
    return true;
  },
  {
    message: "Invalid operational times: duration must be between 1-12 hours and start/end times cannot be the same"
  }
);

// GET /api/departments - Get all departments
router.get('/', async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        building: true,
        staffAllocations: {
          include: {
            staff: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Parse JSON strings back to arrays
    const departmentsWithParsedData = departments.map(dept => ({
      ...dept,
      operationalDays: JSON.parse(dept.operationalDays)
    }));

    res.json(departmentsWithParsedData);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// GET /api/departments/:id - Get a specific department
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid department ID' });
    }

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        building: true,
        staffAllocations: {
          include: {
            staff: true
          }
        }
      }
    });

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const departmentWithParsedData = {
      ...department,
      operationalDays: JSON.parse(department.operationalDays)
    };

    res.json(departmentWithParsedData);
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({ error: 'Failed to fetch department' });
  }
});

// POST /api/departments - Create a new department
router.post('/', async (req, res) => {
  try {
    const validatedData = createDepartmentSchema.parse(req.body);
    
    const department = await prisma.department.create({
      data: {
        ...validatedData,
        operationalDays: JSON.stringify(validatedData.operationalDays)
      },
      include: {
        building: true,
        staffAllocations: {
          include: {
            staff: true
          }
        }
      }
    });

    const departmentWithParsedData = {
      ...department,
      operationalDays: JSON.parse(department.operationalDays)
    };

    res.status(201).json(departmentWithParsedData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.issues 
      });
    }
    
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// PUT /api/departments/:id - Update a department
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid department ID' });
    }

    const validatedData = updateDepartmentSchema.parse(req.body);
    
    const updateData: any = { ...validatedData };
    if (validatedData.operationalDays) {
      updateData.operationalDays = JSON.stringify(validatedData.operationalDays);
    }
    
    const department = await prisma.department.update({
      where: { id },
      data: updateData,
      include: {
        building: true,
        staffAllocations: {
          include: {
            staff: true
          }
        }
      }
    });

    const departmentWithParsedData = {
      ...department,
      operationalDays: JSON.parse(department.operationalDays)
    };

    res.json(departmentWithParsedData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.issues 
      });
    }
    
    console.error('Error updating department:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
});

// DELETE /api/departments/:id - Delete a department
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid department ID' });
    }

    await prisma.department.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

export default router;
