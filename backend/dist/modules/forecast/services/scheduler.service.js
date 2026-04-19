"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForecastScheduler = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const forecast_service_1 = require("./forecast.service");
class ForecastScheduler {
    // Start daily forecasting at 6:00 AM
    static start() {
        if (this.job) {
            console.log('Forecast scheduler already running');
            return;
        }
        // Cron: 0 6 * * * = Every day at 6:00 AM
        this.job = node_cron_1.default.schedule('0 6 * * *', async () => {
            console.log(`\n[${new Date().toISOString()}] 🕐 Running daily demand forecasting...`);
            try {
                const results = await forecast_service_1.ForecastService.generateAllForecasts();
                console.log(`✅ Daily forecast complete: ${results.succeeded}/${results.total} succeeded, ${results.failed} failed`);
            }
            catch (error) {
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
            const results = await forecast_service_1.ForecastService.generateAllForecasts();
            console.log(`✅ Manual forecast complete: ${results.succeeded}/${results.total} succeeded, ${results.failed} failed`);
            return results;
        }
        catch (error) {
            console.error('❌ Manual forecast failed:', error);
            throw error;
        }
    }
}
exports.ForecastScheduler = ForecastScheduler;
ForecastScheduler.job = null;
