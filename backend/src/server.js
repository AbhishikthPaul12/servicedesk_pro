import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";
import { startSLAScheduler } from "./utils/slaScheduler.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(
                `ResolveDesk server running on port ${PORT}`
            );
        });

        startSLAScheduler();
        
    } catch (error) {
        console.error(
            `Server startup failed: ${error.message}`
        );

        process.exit(1);
    }
};

startServer();