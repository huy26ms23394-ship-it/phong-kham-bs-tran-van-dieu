export default async function handler(req: any, res: any) {
  const diagnostics: Record<string, any> = {};

  try {
    await import('dotenv');
    diagnostics.dotenv = 'OK';
  } catch (e: any) {
    diagnostics.dotenv = e.message;
  }

  try {
    await import('express');
    diagnostics.express = 'OK';
  } catch (e: any) {
    diagnostics.express = e.message;
  }

  try {
    await import('@google/genai');
    diagnostics.genai = 'OK';
  } catch (e: any) {
    diagnostics.genai = e.message;
  }

  try {
    await import('./databaseService.js');
    diagnostics.databaseService = 'OK';
  } catch (e: any) {
    diagnostics.databaseService = e.message;
  }

  try {
    await import('./crawlerService.js');
    diagnostics.crawlerService = 'OK';
  } catch (e: any) {
    diagnostics.crawlerService = e.message;
  }

  try {
    const appModule = await import('./app.js');
    diagnostics.app = 'OK';
    return appModule.app(req, res);
  } catch (e: any) {
    diagnostics.app = e.message;
    return res.status(200).json({ status: 'DIAGNOSTIC', diagnostics });
  }
}
