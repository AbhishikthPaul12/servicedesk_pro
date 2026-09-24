import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";
import Department from "../models/Department.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const ensureITDepartment = async () => {
    let department = await Department.findOne({ name: "IT" });
    if (!department) {
        department = await Department.create({
            name: "IT",
            description: "Information Technology",
            isActive: true
        });
        console.log(`[CREATED] Department: IT (${department._id})`);
    } else {
        if (department.isActive === false) {
            department.isActive = true;
            await department.save();
        }
        console.log(`[FOUND] Department: IT (${department._id})`);
    }
    return department;
};

const upsertUser = async ({ name, email, password, role, departmentId }) => {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const existing = await User.findOne({ email });
    if (existing) {
        existing.name = name;
        existing.role = role;
        existing.password = hashedPassword;
        existing.isActive = true;
        if (departmentId) {
            existing.department = departmentId;
        }
        await existing.save();
        console.log(`[UPDATED] ${role}: ${email} (dept: ${departmentId || "none"})`);
        return existing;
    }

    const created = await User.create({
        name,
        email,
        password: hashedPassword,
        role,
        department: departmentId || null,
        isActive: true
    });
    console.log(`[CREATED] ${role}: ${email} (dept: ${departmentId || "none"})`);
    return created;
};

const seedManagers = async () => {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/resolvedesk";

    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB successfully.\n");

        const itDept = await ensureITDepartment();

        const accounts = [
            {
                name: "IT Operations Manager",
                email: "itmanager@servicedesk.com",
                password: "Manager123!",
                role: "it_manager",
                departmentId: itDept._id
            },
            {
                name: "IT Technician",
                email: "tech@servicedesk.com",
                password: "Tech123!",
                role: "technician",
                departmentId: itDept._id
            },
            {
                name: "IT Employee",
                email: "employee@servicedesk.com",
                password: "Emp123!",
                role: "employee",
                departmentId: itDept._id
            },
            {
                name: "Asset & Inventory Manager",
                email: "assetmanager@servicedesk.com",
                password: "Asset123!",
                role: "asset_manager",
                departmentId: null
            }
        ];

        for (const account of accounts) {
            await upsertUser(account);
        }

        console.log("\n========================================================");
        console.log(" TEST ACCOUNTS PROVISIONED (department-scoped where needed)");
        console.log("--------------------------------------------------------");
        console.log(`Department: IT (${itDept._id})`);
        console.log("--------------------------------------------------------");
        accounts.forEach((a) => {
            console.log(`Role:     ${a.role}`);
            console.log(`Email:    ${a.email}`);
            console.log(`Password: ${a.password}`);
            console.log(`Dept:     ${a.departmentId ? "IT" : "n/a"}`);
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
