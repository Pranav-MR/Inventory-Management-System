import cron from 'node-cron';
import { runDailyProjectionJob } from './dailyProjectionJob.js';
import { runScheduledReportsJob } from './reportSchedulerJob.js';

export function startScheduler(): void {
  // Once daily at 06:00 server time.
  cron.schedule('0 6 * * *', () => {
    runDailyProjectionJob().catch((err) => {
      console.error('Daily projection job failed:', err);
    });
  });

  // Once daily at 07:00 server time, after batches have rolled forward.
  cron.schedule('0 7 * * *', () => {
    runScheduledReportsJob().catch((err) => {
      console.error('Scheduled reports job failed:', err);
    });
  });
}
