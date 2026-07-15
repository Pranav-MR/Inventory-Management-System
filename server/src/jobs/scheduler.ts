import cron from 'node-cron';
import { runDailyProjectionJob } from './dailyProjectionJob.js';

export function startScheduler(): void {
  // Once daily at 06:00 server time.
  cron.schedule('0 6 * * *', () => {
    runDailyProjectionJob().catch((err) => {
      console.error('Daily projection job failed:', err);
    });
  });
}
