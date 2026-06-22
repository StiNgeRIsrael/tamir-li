// Plesk Node.js startup entry — Plesk runs this file directly (not npm start).
// Root package.json is ESM ("type": "module"); backend/dist is CommonJS from tsc.
import './backend/dist/index.js';
