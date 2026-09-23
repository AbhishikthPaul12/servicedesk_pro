import "dotenv/config";
import connectDB from "../config/db.js";
import SLA from "../models/SLA.js";

const seedSLA = async () => {
    try {
        await connectDB();

        await SLA.deleteMany({});

        await SLA.insertMany([
            {
                name: "Low Priority SLA",
                priority: "low",
                responseTime: 480,
                resolutionTime: 2880
            },
            {
                name: "Medium Priority SLA",
                priority: "medium",
                responseTime: 240,
                resolutionTime: 1440
            },
            {
                name: "High Priority SLA",
                priority: "high",
                responseTime: 60,
                resolutionTime: 480
            },
            {
                name: "Critical Priority SLA",
                priority: "critical",
                responseTime: 15,
                resolutionTime: 240
            }
        ]);

        console.log("SLA records seeded successfully");

        process.exit(0);
    } catch (error) {
        console.error(`SLA seed failed: ${error.message}`);
        process.exit(1);
    }
};

seedSLA();