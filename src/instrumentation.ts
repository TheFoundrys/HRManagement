export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { setupDatabase } = await import('./lib/db/setup');
    await setupDatabase();
    
    const { initSyncWorker } = await import('./lib/workers/sync-worker');
    initSyncWorker();
  }
}
