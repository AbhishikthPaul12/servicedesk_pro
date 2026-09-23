import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const accounts = [
    {
        name: "IT Operations Manager",
        email: "itmanager@servicedesk.com",
        password: "Manager123!",
        role: "it_manager"
    },
    {
        name: "Asset & Inventory Manager",
        email: "assetmanager@servicedesk.com",
        password: "Asset123!",
        role: "asset_manager"
    }
];

const seedManagers = async () => {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/resolvedesk";

    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB successfully.\n");

        for (const account of accounts) {
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(account.password, salt);

            const existing = await User.findOne({ email: account.email });
            if (existing) {
                existing.name = account.name;
                existing.role = account.role;
                existing.password = hashedPassword;
                existing.isActive = true;
                await existing.save();
                console.log(`[UPDATED] User: ${account.email} (Role: ${account.role})`);
            } else {
                const created = await User.create({
                    name: account.name,
                    email: account.email,
                    password: hashedPassword,
                    role: account.role,
                    isActive: true
                });
                console.log(`[CREATED] User: ${account.email} (Role: ${account.role}, ID: ${created._id})`);
            }
        }

        console.log("\n========================================================");
        console.log(" MANAGER ACCOUNTS PROVISIONED SUCCESSFULLY");
        console.log("--------------------------------------------------------");
        accounts.forEach(a => {
            console.log(`Role:     ${a.role}`);
            console.log(`Email:    ${a.email}`);
            console.log(`Password: ${a.password}`);
            console.log("--------------------------------------------------------");
        });
        console.log("========================================================\n");

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("Error provisioning manager accounts:", err);
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        process.exit(1);
    }
};

seedManagers();
