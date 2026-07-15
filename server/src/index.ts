import { createApp } from './app.js';
import { env } from './lib/env.js';
import { startScheduler } from './jobs/scheduler.js';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`Server listening on http://localhost:${env.PORT}`);
});

startScheduler();
