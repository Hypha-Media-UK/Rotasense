"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const index_1 = require("../index");
const router = express_1.default.Router();
// Validation schemas
const zeroStartDateSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
});
const updateSettingsSchema = zod_1.z.object({
    timeFormat: zod_1.z.enum(['12', '24']).optional(),
    zeroStartDates: zod_1.z.array(zeroStartDateSchema).optional()
});
// GET /api/settings - Get current settings
router.get('/', async (req, res) => {
    try {
        let settings = await index_1.prisma.settings.findFirst();
        // Create default settings if none exist
        if (!settings) {
            settings = await index_1.prisma.settings.create({
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
    }
    catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});
// PUT /api/settings - Update settings
router.put('/', async (req, res) => {
    try {
        const validatedData = updateSettingsSchema.parse(req.body);
        let settings = await index_1.prisma.settings.findFirst();
        // Prepare update data
        const updateData = {};
        if (validatedData.timeFormat) {
            updateData.timeFormat = validatedData.timeFormat;
        }
        if (validatedData.zeroStartDates) {
            updateData.zeroStartDates = JSON.stringify(validatedData.zeroStartDates);
        }
        if (!settings) {
            // Create settings if none exist
            settings = await index_1.prisma.settings.create({
                data: {
                    timeFormat: validatedData.timeFormat || '24',
                    zeroStartDates: validatedData.zeroStartDates ? JSON.stringify(validatedData.zeroStartDates) : JSON.stringify([])
                }
            });
        }
        else {
            // Update existing settings
            settings = await index_1.prisma.settings.update({
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.issues
            });
        }
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});
exports.default = router;
//# sourceMappingURL=settings.js.map