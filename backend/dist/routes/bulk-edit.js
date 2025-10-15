"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
// Serve the bulk edit page
router.get('/', (req, res) => {
    const bulkEditPath = path_1.default.join(__dirname, '../../../bulk-edit/index.html');
    res.sendFile(bulkEditPath);
});
// Serve static assets for bulk edit page
router.get('/styles.css', (req, res) => {
    const stylesPath = path_1.default.join(__dirname, '../../../bulk-edit/styles.css');
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(stylesPath);
});
router.get('/script.js', (req, res) => {
    const scriptPath = path_1.default.join(__dirname, '../../../bulk-edit/script.js');
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(scriptPath);
});
exports.default = router;
//# sourceMappingURL=bulk-edit.js.map