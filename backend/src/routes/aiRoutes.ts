import express, { Request, Response } from 'express';
import { parseBookingCommand } from '../services/aiServices';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * Endpoint to parse text command into structured booking parameters.
 */
router.post('/booking/parse', authMiddleware, async (req: Request, res: Response) => {
  const { text, currentServerDate } = req.body;
  if (!text) {
    return res.status(400).json({ success: false, message: 'Text input is required' });
  }

  try {
    const data = await parseBookingCommand(text, currentServerDate);
    res.status(200).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Speech-to-Text transcriber endpoint.
 */
router.post('/transcribe', authMiddleware, async (req: Request, res: Response) => {
  // Placeholder transcription payload, client primarily uses browser-native speech recognition
  res.status(200).json({
    success: true,
    transcript: "Mock voice transcription: Surandai to Tenkasi tomorrow morning 10 AM SUV"
  });
});

export default router;
