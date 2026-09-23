import cron from "node-cron";
import { checkSLABreaches } from "../services/slaMonitorService.js";

export const startSLAScheduler = () => {
    cron.schedule("* * * * *", async () => {
        console.log("Running SLA monitor...");

        await checkSLABreaches();
    });

    console.log("SLA scheduler started");
};