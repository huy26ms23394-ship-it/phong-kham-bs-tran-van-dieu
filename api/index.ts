export default async function handler(req: any, res: any) {
  try {
    const { app } = await import('../src/server/app');
    return app(req, res);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Unknown Serverless Error',
      stack: err?.stack,
      name: err?.name,
    });
  }
}
