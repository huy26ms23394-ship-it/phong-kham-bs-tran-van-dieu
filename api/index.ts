import { app } from './app';

export default function handler(req: any, res: any) {
  try {
    return app(req, res);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message,
      stack: err?.stack,
    });
  }
}
