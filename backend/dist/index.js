"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const client_1 = require("@prisma/client");
// Import routes
const buildings_1 = __importDefault(require("./routes/buildings"));
const departments_1 = __importDefault(require("./routes/departments"));
const services_1 = __importDefault(require("./routes/services"));
const staff_1 = __importDefault(require("./routes/staff"));
const allocations_1 = __importDefault(require("./routes/allocations"));
const overrides_1 = __importDefault(require("./routes/overrides"));
const settings_1 = __importDefault(require("./routes/settings"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Initialize Prisma Client
exports.prisma = new client_1.PrismaClient();
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://your-domain.com']
        : ['http://localhost:5173'],
    credentials: true
}));
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API Routes
app.use('/api/buildings', buildings_1.default);
app.use('/api/departments', departments_1.default);
app.use('/api/services', services_1.default);
app.use('/api/staff', staff_1.default);
app.use('/api/allocations', allocations_1.default);
app.use('/api/overrides', overrides_1.default);
app.use('/api/settings', settings_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await exports.prisma.$disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await exports.prisma.$disconnect();
    process.exit(0);
});
app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
});
//# sourceMappingURL=index.js.map