"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const index_1 = require("../index");
const router = express_1.default.Router();
// GET /api/zero-start-dates - Get all zero start dates
router.get('/', async (req, res) => {
    try {
        const settings = await index_1.prisma.settings.findFirst();
        if (!settings || !settings.zeroStartDates) {
            return res.json([]);
        }
        const zeroStartDates = JSON.parse(settings.zeroStartDates);
        // Transform the data to include a description field for the bulk edit interface
        const transformedDates = zeroStartDates.map((zsd) => ({
            id: zsd.id,
            date: zsd.date,
            description: zsd.name || zsd.description || 'Zero Start Date'
        }));
        res.json(transformedDates);
    }
    catch (error) {
        console.error('Error fetching zero start dates:', error);
        res.status(500).json({
            error: 'Failed to fetch zero start dates',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=zero-start-dates.js.map