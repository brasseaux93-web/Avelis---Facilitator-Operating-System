import express from 'express';
import { db } from '../db/index'; // I need to create src/db/index.ts
import { sessions, parties, ledgerLines } from '../db/schema';
import crypto from 'node:crypto';
import { computePayloadDigest, computeLineHash } from '../lib/ledger';

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3001;

// Basic auth mockup for facilitator routes (in a real app, use sessions/JWT)
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Mock authentication - assume facilitator is logged in for Phase 3 API scaffolding
  req.headers['x-facilitator-id'] = 'mock-fac-id';
  next();
};

import rateLimit from 'express-rate-limit';

const contactRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/api/contact', contactRateLimiter, async (req, res) => {
  const { email, useCase, bot_field } = req.body;

  // Honeypot check (hidden field in the frontend should remain empty)
  if (bot_field) {
    // Silently reject to avoid signaling the bot
    return res.status(200).json({ success: true, message: 'Request received' });
  }

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  try {
    // In production, integrate with SendGrid, Postmark, etc. here.
    console.log(`[Contact API] Received access request from: ${email}, Use case: ${useCase?.substring(0, 50)}`);
    
    // Simulate transactional delay
    await new Promise(resolve => setTimeout(resolve, 800));

    res.status(200).json({ success: true, message: 'Request received' });
  } catch (error) {
    console.error('[Contact API] Failed to process request', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/sessions', requireAuth, async (req, res) => {
  const { title, retentionHours } = req.body;
  if (!title || retentionHours == null) {
    return res.status(400).json({ error: 'title and retentionHours are required' });
  }

  const facilitatorId = req.headers['x-facilitator-id'] as string;
  const organizationId = 'mock-org-id'; // typically fetched from auth
  const retentionExpiresAt = new Date(Date.now() + retentionHours * 60 * 60 * 1000);

  try {
    const [newSession] = await db.insert(sessions).values({
      organizationId,
      facilitatorId,
      title,
      retentionExpiresAt,
      status: 'draft',
    }).returning();

    res.status(201).json(newSession);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

app.post('/api/sessions/:id/parties', requireAuth, async (req, res) => {
  const sessionId = req.params.id;
  const { identityClass, tokenHash } = req.body; // identityClass: 'named', 'role_only', etc.

  try {
    const [newParty] = await db.insert(parties).values({
      sessionId,
      identityClass,
      tokenHash, // in reality, a hashed one-time code
    }).returning();

    res.status(201).json(newParty);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create party' });
  }
});

// A route to write a ledger line (demonstrating the hash chain requirement)
app.post('/api/sessions/:id/ledger', requireAuth, async (req, res) => {
  const sessionId = req.params.id;
  const { lineType, payload } = req.body; // e.g., 'SESSION OPENED'
  
  try {
    // In a real implementation, you'd fetch the previous ledger line inside a transaction
    // to get its sequence number and hash, ensuring no race conditions.
    const payloadDigest = computePayloadDigest(payload);
    const sequenceNumber = 1; // Mock for now
    const previousLineHash = null; // Mock for now (would be genesis for seq 1)
    
    const lineHash = computeLineHash(sessionId, sequenceNumber, lineType, payloadDigest, previousLineHash);
    
    const [newLine] = await db.insert(ledgerLines).values({
      sessionId,
      sequenceNumber,
      lineType,
      payloadEncrypted: Buffer.from('mock_encrypted'),
      payloadDigest,
      previousLineHash,
      lineHash
    }).returning();

    res.status(201).json(newLine);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to append to ledger' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
