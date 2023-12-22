const CronJob = require('cron').CronJob;
const { log } = require("../lib/utils/utils");

module.exports = {
    async startCronJob() {
        //every 12 hours
        var job = new CronJob("0 */12 * * *", async function () {
            log("Cron triggered!");
            // write whatever you perform.
        });
        job.start();
        log("Cron job scheduled successfully.");
    }
}