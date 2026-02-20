import cron, { type ScheduledTask } from 'node-cron';
import { ForecastService } from './forecast.service';

export class ForecastScheduler {
  private static job: ScheduledTask | null = null;

  // Start daily forecasting at 6:00 AM
  static start() {
    if (this.job) {
      console.log('Forecast scheduler already running');
      return;
    }

    // Cron: 0 6 * * * = Every day at 6:00 AM
    this.job = cron.schedule('0 6 * * *', async () => {
      console.log(`\n[${new Date().toISOString()}] 🕐 Running daily demand forecasting...`);

      try {
        const results = await ForecastService.generateAllForecasts();
        console.log(`✅ Daily forecast complete: ${results.succeeded}/${results.total} succeeded, ${results.failed} failed`);
      } catch (error) {
        console.error('❌ Daily forecast failed:', error);
      }
    });

    console.log('✅ Forecast scheduler started (daily at 6:00 AM)');
  }

  static stop() {
    if (this.job) {
      this.job.stop();
      this.job = null;
      console.log('Forecast scheduler stopped');
    }
  }

  // Run forecast manually (for testing)
  static async runNow() {
    console.log('\n🔧 Running forecast manually...');
    try {
      const results = await ForecastService.generateAllForecasts();
      console.log(`✅ Manual forecast complete: ${results.succeeded}/${results.total} succeeded, ${results.failed} failed`);
      return results;
    } catch (error) {
      console.error('❌ Manual forecast failed:', error);
      throw error;
    }
  }
}
