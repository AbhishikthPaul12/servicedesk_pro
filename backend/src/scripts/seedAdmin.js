import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend/.env
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const seedAdmin = async () => {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/resolvedesk";

    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB successfully.");

        // Read optional arguments from CLI: node seedAdmin.js <email> <password> <name>
        const args = process.argv.slice(2);
        const email = args[0] || "admin@servicedesk.com";
        const rawPassword = args[1] || "Admin123!";
        const name = args[2] || "System Administrator";

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            console.log(`\nUser with email "${email}" already exists.`);
            console.log(`Existing Role: ${existingUser.role}`);

            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(rawPassword, salt);

            existingUser.role = "system_admin";
            existingUser.password = hashedPassword;
            existingUser.name = name;
            existingUser.isActive = true;
            await existingUser.save();

            console.log(`Updated user "${email}" with role "system_admin" and updated password.`);
        } else {
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(rawPassword, salt);

            const newAdmin = await User.create({
                name,
                email,
                password: hashedPassword,
                role: "system_admin",
                isActive: true
            });

            console.log(`\nCreated new Administrator account successfully:`);
            console.log(`  ID:    ${newAdmin._id}`);
            console.log(`  Name:  ${newAdmin.name}`);
            console.log(`  Email: ${newAdmin.email}`);
            console.log(`  Role:  ${newAdmin.role}`);
        }

        console.log("\n===============================================");
        console.log(" ADMIN PROVISIONING COMPLETE");
        console.log(" Email:    ", email);
        console.log(" Password: ", rawPassword);
        console.log(" Role:      system_admin");
        console.log("===============================================\n");

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("Error provisioning admin account:", error);
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        process.exit(1);
    }
};

seedAdmin();
