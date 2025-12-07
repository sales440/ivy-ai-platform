/**
 * Server-Sent Events (SSE) endpoint for real-time notifications
 */

import { Router } from 'express';
import { registerSSEConnection, removeSSEConnection } from '../services/notifications';

const router = Router();

/**
 * SSE endpoint: /api/notifications/stream
 */
router.get('/stream', (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Generate connection ID
  // In production, use user ID from session
  const connectionId = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Register connection
  registerSSEConnection(connectionId, res);

  // Handle client disconnect
  req.on('close', () => {
    removeSSEConnection(connectionId);
  });
});

export default router;
