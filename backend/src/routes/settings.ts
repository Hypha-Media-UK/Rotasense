import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';

const router = express.Router();

// Validation schemas
const zeroStartDateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
});

const updateSettingsSchema = z.object({
  timeFormat: z.enum(['12', '24']).optional(),
  zeroStartDates: z.array(zeroStartDateSchema).optional()
});

// GET /api/settings - Get current settings
router.get('/', async (req, res) => {
  try {
    let settings = await prisma.settings.findFirst();
    
    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          timeFormat: '24'
        }
      });
    }

    // Parse zeroStartDates JSON string back to array
    const settingsWithParsedData = {
      ...settings,
      zeroStartDates: JSON.parse(settings.zeroStartDates)
    };

    res.json(settingsWithParsedData);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings - Update settings
router.put('/', async (req, res) => {
  try {
    const validatedData = updateSettingsSchema.parse(req.body);

    let settings = await prisma.settings.findFirst();

    // Prepare update data
    const updateData: any = {};
    if (validatedData.timeFormat) {
      updateData.timeFormat = validatedData.timeFormat;
    }
    if (validatedData.zeroStartDates) {
      updateData.zeroStartDates = JSON.stringify(validatedData.zeroStartDates);
    }

    if (!settings) {
      // Create settings if none exist
      settings = await prisma.settings.create({
        data: {
          timeFormat: validatedData.timeFormat || '24',
          zeroStartDates: validatedData.zeroStartDates ? JSON.stringify(validatedData.zeroStartDates) : JSON.stringify([])
        }
      });
    } else {
      // Update existing settings
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: updateData
      });
    }

    // Parse zeroStartDates JSON string back to array
    const settingsWithParsedData = {
      ...settings,
      zeroStartDates: JSON.parse(settings.zeroStartDates)
    };

    res.json(settingsWithParsedData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.issues 
      });
    }
    
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
