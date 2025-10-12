import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { positiveIntSchema } from '../validation/schemas';

const router = express.Router();

// Validation schemas
const createAllocationSchema = z.object({
  staffId: positiveIntSchema.describe('Staff ID is required'),
  departmentId: positiveIntSchema.optional(),
  serviceId: positiveIntSchema.optional()
}).refine(
  (data) => {
    // Exactly one of departmentId or serviceId must be provided
    const allocations = [data.departmentId, data.serviceId].filter(Boolean);
    return allocations.length === 1;
  },
  {
    message: "Exactly one of departmentId or serviceId must be provided"
  }
);

const updateAllocationSchema = createAllocationSchema.partial();

// GET /api/allocations - Get all staff allocations
router.get('/', async (req, res) => {
  try {
    const { staffId } = req.query;
    
    const whereClause: any = {};
    if (staffId) {
      whereClause.staffId = parseInt(staffId as string);
    }

    const allocations = await prisma.staff_allocations.findMany({
      where: whereClause,
      include: {
        staff: true,
        departments: {
          include: {
            buildings: true
          }
        },
        services: true
      },
      orderBy: [
        { staff: { name: 'asc' } },
        { createdAt: 'asc' }
      ]
    });

    res.json(allocations);
  } catch (error) {
    console.error('Error fetching allocations:', error);
    res.status(500).json({ error: 'Failed to fetch allocations' });
  }
});

// GET /api/allocations/:id - Get a specific allocation
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid allocation ID' });
    }

    const allocation = await prisma.staff_allocations.findUnique({
      where: { id },
      include: {
        staff: true,
        departments: {
          include: {
            buildings: true
          }
        },
        services: true
      }
    });

    if (!allocation) {
      return res.status(404).json({ error: 'Allocation not found' });
    }

    res.json(allocation);
  } catch (error) {
    console.error('Error fetching allocation:', error);
    res.status(500).json({ error: 'Failed to fetch allocation' });
  }
});

// POST /api/allocations - Create a new allocation
router.post('/', async (req, res) => {
  try {
    const validatedData = createAllocationSchema.parse(req.body);
    
    const allocation = await prisma.staff_allocations.create({
      data: validatedData,
      include: {
        staff: true,
        departments: {
          include: {
            buildings: true
          }
        },
        services: true
      }
    });

    res.status(201).json(allocation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.issues 
      });
    }
    
    console.error('Error creating allocation:', error);
    res.status(500).json({ error: 'Failed to create allocation' });
  }
});

// PUT /api/allocations/:id - Update an allocation
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid allocation ID' });
    }

    const validatedData = updateAllocationSchema.parse(req.body);
    
    const updateData = validatedData;
    
    const allocation = await prisma.staff_allocations.update({
      where: { id },
      data: updateData,
      include: {
        staff: true,
        departments: {
          include: {
            buildings: true
          }
        },
        services: true
      }
    });

    res.json(allocation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.issues 
      });
    }
    
    console.error('Error updating allocation:', error);
    res.status(500).json({ error: 'Failed to update allocation' });
  }
});

// DELETE /api/allocations/:id - Delete an allocation
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid allocation ID' });
    }

    await prisma.staff_allocations.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting allocation:', error);
    res.status(500).json({ error: 'Failed to delete allocation' });
  }
});

export default router;
