import express from 'express';
import { prisma } from '../index';

const router = express.Router();

// GET /api/zero-start-dates - Get all zero start dates
router.get('/', async (req, res) => {
  try {
    const settings = await prisma.settings.findFirst();

    if (!settings || !settings.zeroStartDates) {
      return res.json([]);
    }

    const zeroStartDates = JSON.parse(settings.zeroStartDates);

    // Transform the data to include a description field for the bulk edit interface
    const transformedDates = zeroStartDates.map((zsd: any) => ({
      id: zsd.id,
      date: zsd.date,
      description: zsd.name || zsd.description || 'Zero Start Date'
    }));

    res.json(transformedDates);
  } catch (error) {
    console.error('Error fetching zero start dates:', error);
    res.status(500).json({
      error: 'Failed to fetch zero start dates',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
    });
  }
});

export default router;
