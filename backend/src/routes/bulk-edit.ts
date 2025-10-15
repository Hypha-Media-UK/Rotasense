import express from 'express';
import path from 'path';

const router = express.Router();

// Serve the bulk edit page
router.get('/', (req, res) => {
  const bulkEditPath = path.join(__dirname, '../../../bulk-edit/index.html');
  res.sendFile(bulkEditPath);
});

// Serve static assets for bulk edit page
router.get('/styles.css', (req, res) => {
  const stylesPath = path.join(__dirname, '../../../bulk-edit/styles.css');
  res.setHeader('Content-Type', 'text/css');
  res.sendFile(stylesPath);
});

router.get('/script.js', (req, res) => {
  const scriptPath = path.join(__dirname, '../../../bulk-edit/script.js');
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(scriptPath);
});

export default router;
