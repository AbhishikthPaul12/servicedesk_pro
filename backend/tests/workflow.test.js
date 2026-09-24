import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
    isValidTransition,
    isRoleAllowedTransition,
    resolveTechnicianStatus,
    getAllowedTransitionsForRole
} from "../src/utils/ticketWorkflow.js";
import {
    calculateSLADueDate,
    evaluateSLAStatus,
    addBusinessMinutes,
    DEFAULT_BUSINESS_HOURS
} from "../src/services/slaService.js";
import { validateObjectId } from "../src/middleware/validateObjectId.js";
import {
    buildTicketAccessFilter,
    canAccessTicket,
    canCreateWorkLog,
    applyDepartmentScope,
    canManageAssets
} from "../src/utils/authorization.js";
import {
    isValidAssetTransition,
    ASSET_TRANSITIONS
} from "../src/utils/assetLifecycle.js";
import { normalizeRole, canSeeInternalNotes } from "../src/utils/roles.js";

describe("Ticket Workflow Transitions", () => {
    test("allows valid transition from open to assigned", () => {
        assert.equal(isValidTransition("open", "assigned"), true);
    });

    test("allows in_progress to resolved", () => {
        assert.equal(isValidTransition("in_progress", "resolved"), true);
    });

    test("allows resolved to awaiting_manager_approval", () => {
        assert.equal(
            isValidTransition("resolved", "awaiting_manager_approval"),
            true
        );
    });

    test("allows awaiting_manager_approval to closed", () => {
        assert.equal(
            isValidTransition("awaiting_manager_approval", "closed"),
            true
        );
    });

    test("rejects open to resolved", () => {
        assert.equal(isValidTransition("open", "resolved"), false);
    });

    test("rejects closed to in_progress directly", () => {
        assert.equal(isValidTransition("closed", "in_progress"), false);
    });

    test("technician cannot close tickets", () => {
        assert.equal(
            isRoleAllowedTransition("technician", "in_progress", "closed"),
            false
        );
        assert.equal(
            isRoleAllowedTransition("technician", "resolved", "closed"),
            false
        );
    });

    test("technician can resolve from in_progress", () => {
        assert.equal(
            isRoleAllowedTransition("technician", "in_progress", "resolved"),
            true
        );
    });

    test("technician resolve maps to awaiting_manager_approval", () => {
        assert.equal(
            resolveTechnicianStatus("technician", "resolved"),
            "awaiting_manager_approval"
        );
    });

    test("employee can confirm close from awaiting approval", () => {
        assert.equal(
            isRoleAllowedTransition(
                "employee",
                "awaiting_manager_approval",
                "closed"
            ),
            true
        );
    });

    test("employee cannot set in_progress", () => {
        assert.equal(
            isRoleAllowedTransition("employee", "open", "in_progress"),
            false
        );
    });

    test("IT manager can approve close from awaiting", () => {
        assert.equal(
            isRoleAllowedTransition(
                "it_manager",
                "awaiting_manager_approval",
                "closed"
            ),
            true
        );
    });

    test("getAllowedTransitionsForRole returns technician options", () => {
        const opts = getAllowedTransitionsForRole("technician", "in_progress");
        assert.ok(opts.includes("resolved"));
        assert.ok(!opts.includes("closed"));
    });
});

describe("Authorization Helpers", () => {
    const deptA = "aaaaaaaaaaaaaaaaaaaaaaaa";
    const deptB = "bbbbbbbbbbbbbbbbbbbbbbbb";
    const techId = "111111111111111111111111";
    const otherTech = "222222222222222222222222";
    const empId = "333333333333333333333333";

    test("technician filter is assignment-based not department-wide", () => {
        const filter = buildTicketAccessFilter({
            _id: techId,
            role: "technician",
            department: deptA
        });
        assert.ok(filter.$or);
        assert.ok(
            filter.$or.some((c) => c.assignedTo === techId)
        );
        assert.ok(!filter.department);
    });

    test("IT manager filter forces own department", () => {
        const filter = buildTicketAccessFilter({
            _id: "m1",
            role: "it_manager",
            department: deptA
        });
        assert.equal(filter.department, deptA);
    });

    test("IT manager department query override is ignored", () => {
        const filter = { department: deptA };
        applyDepartmentScope(
            { role: "it_manager", department: deptA },
            filter,
            deptB
        );
        assert.equal(filter.department, deptA);
    });

    test("technician cannot access another tech private ticket", () => {
        const ticket = {
            assignedTo: otherTech,
            createdBy: empId,
            department: deptA,
            authorizedTechnicians: []
        };
        assert.equal(
            canAccessTicket(
                { _id: techId, role: "technician", department: deptA },
                ticket
            ),
            false
        );
    });

    test("technician can access assigned ticket", () => {
        const ticket = {
            assignedTo: techId,
            createdBy: empId,
            department: deptA
        };
        assert.equal(
            canAccessTicket(
                { _id: techId, role: "technician", department: deptA },
                ticket
            ),
            true
        );
    });

    test("employee only accesses own tickets", () => {
        assert.equal(
            canAccessTicket(
                { _id: empId, role: "employee", department: deptA },
                { createdBy: empId, department: deptA }
            ),
            true
        );
        assert.equal(
            canAccessTicket(
                { _id: empId, role: "employee", department: deptA },
                { createdBy: otherTech, department: deptA }
            ),
            false
        );
    });

    test("work log only for assigned technician", () => {
        assert.equal(
            canCreateWorkLog(
                { _id: techId, role: "technician" },
                { assignedTo: techId }
            ),
            true
        );
        assert.equal(
            canCreateWorkLog(
                { _id: techId, role: "technician" },
                { assignedTo: otherTech }
            ),
            false
        );
    });

    test("IT manager cannot create work logs via helper", () => {
        assert.equal(
            canCreateWorkLog(
                { _id: "m1", role: "it_manager" },
                { assignedTo: techId }
            ),
            false
        );
    });

    test("employees cannot see internal notes", () => {
        assert.equal(canSeeInternalNotes("employee"), false);
        assert.equal(canSeeInternalNotes("technician"), true);
        assert.equal(canSeeInternalNotes("it_manager"), true);
        assert.equal(canSeeInternalNotes("system_admin"), true);
    });

    test("normalizeRole maps legacy aliases", () => {
        assert.equal(normalizeRole("admin"), "system_admin");
        assert.equal(normalizeRole("manager"), "it_manager");
    });

    test("asset manager has no ticket access", () => {
        assert.equal(
            canAccessTicket(
                { _id: "a1", role: "asset_manager" },
                { createdBy: empId, department: deptA }
            ),
            false
        );
    });
});

describe("Asset Lifecycle State Machine", () => {
    test("allows available -> assigned", () => {
        assert.equal(isValidAssetTransition("available", "assigned"), true);
    });

    test("allows assigned -> maintenance", () => {
        assert.equal(isValidAssetTransition("assigned", "maintenance"), true);
    });

    test("allows maintenance -> available", () => {
        assert.equal(isValidAssetTransition("maintenance", "available"), true);
    });

    test("rejects retired -> available as normal transition", () => {
        assert.equal(isValidAssetTransition("retired", "available"), false);
        assert.deepEqual(ASSET_TRANSITIONS.retired, []);
    });

    test("rejects maintenance -> assigned directly", () => {
        assert.equal(isValidAssetTransition("maintenance", "assigned"), false);
    });

    test("procurement can become available", () => {
        assert.equal(isValidAssetTransition("procurement", "available"), true);
    });
});

describe("SLA Calculation and Evaluation", () => {
    test("calculates calendar due date for 240 minutes", () => {
        const baseTime = new Date("2026-01-01T10:00:00.000Z");
        const dueDate = calculateSLADueDate(baseTime, 240);
        assert.equal(
            dueDate.getTime(),
            new Date("2026-01-01T14:00:00.000Z").getTime()
        );
    });

    test("business-hours calculation skips weekend", () => {
        // Friday 16:00 UTC, add 120 business minutes with 9-17 Mon-Fri
        const friday = new Date("2026-01-02T16:00:00.000Z"); // Friday
        const due = addBusinessMinutes(friday, 120, DEFAULT_BUSINESS_HOURS);
        // 60 min left Friday → Mon 10:00
        assert.equal(due.getUTCDay(), 1); // Monday
        assert.equal(due.getUTCHours(), 10);
    });

    test("evaluates met if resolved before due", () => {
        assert.equal(
            evaluateSLAStatus({
                slaDueDate: new Date("2026-01-01T14:00:00.000Z"),
                resolvedAt: new Date("2026-01-01T13:30:00.000Z")
            }),
            "met"
        );
    });

    test("evaluates breached if past due unresolved", () => {
        assert.equal(
            evaluateSLAStatus(
                {
                    slaDueDate: new Date("2026-01-01T14:00:00.000Z"),
                    createdAt: new Date("2026-01-01T10:00:00.000Z")
                },
                { now: new Date("2026-01-01T15:00:00.000Z") }
            ),
            "breached"
        );
    });

    test("evaluates at_risk near threshold", () => {
        assert.equal(
            evaluateSLAStatus(
                {
                    slaDueDate: new Date("2026-01-01T20:00:00.000Z"),
                    createdAt: new Date("2026-01-01T10:00:00.000Z")
                },
                {
                    now: new Date("2026-01-01T18:30:00.000Z"),
                    atRiskThresholdPercent: 80
                }
            ),
            "at_risk"
        );
    });
});

describe("Validate ObjectId Middleware", () => {
    const middleware = validateObjectId("id");

    test("accepts valid ObjectId", () => {
        const req = { params: { id: "507f1f77bcf86cd799439011" } };
        let nextCalled = false;
        const res = { status: () => res, json: () => {} };
        middleware(req, res, () => {
            nextCalled = true;
        });
        assert.equal(nextCalled, true);
    });

    test("rejects invalid ObjectId with 400", () => {
        const req = { params: { id: "invalid-id-123" } };
        let statusCode = null;
        let jsonResponse = null;
        const res = {
            status: (code) => {
                statusCode = code;
                return res;
            },
            json: (data) => {
                jsonResponse = data;
            }
        };
        middleware(req, res, () => {});
        assert.equal(statusCode, 400);
        assert.equal(jsonResponse.success, false);
    });
});

describe("Department Scoping and Report Security", () => {
    test("rolesRequiringDepartment enforces operational roles", async () => {
        const { rolesRequiringDepartment } = await import(
            "../src/utils/departmentValidation.js"
        );
        assert.equal(rolesRequiringDepartment("employee"), true);
        assert.equal(rolesRequiringDepartment("technician"), true);
        assert.equal(rolesRequiringDepartment("it_manager"), true);
        assert.equal(rolesRequiringDepartment("manager"), true);
        assert.equal(rolesRequiringDepartment("system_admin"), false);
        assert.equal(rolesRequiringDepartment("asset_manager"), false);
    });

    test("buildDeptMatch strictly scopes IT Manager and ignores query overrides", async () => {
        const { buildDeptMatch } = await import("../src/services/reportService.js");
        const managerDeptId = "6ab4a4374094c9dcbfc7b009";
        const foreignDeptId = "6ab4a4374094c9dcbfc7b099";
        const itManager = { role: "it_manager", department: managerDeptId };

        const scopedMatch = buildDeptMatch(itManager, {}, foreignDeptId);
        assert.equal(scopedMatch.department, managerDeptId);
    });

    test("buildDeptMatch isolates null-department IT Manager", async () => {
        const { buildDeptMatch } = await import("../src/services/reportService.js");
        const nullDeptManager = { role: "it_manager", department: null };
        const match = buildDeptMatch(nullDeptManager);
        assert.equal(match._id, null);
    });

    test("buildDeptMatch allows System Admin to query specific departments", async () => {
        const { buildDeptMatch } = await import("../src/services/reportService.js");
        const admin = { role: "system_admin" };
        const targetDeptId = "6ab4a4374094c9dcbfc7b009";
        const match = buildDeptMatch(admin, {}, targetDeptId);
        assert.equal(match.department, targetDeptId);
    });

    test("canAccessTicket denies IT manager access to tickets in other departments", () => {
        const itManager = { role: "it_manager", department: "dept-1" };
        const otherDeptTicket = { department: "dept-2" };
        assert.equal(canAccessTicket(itManager, otherDeptTicket), false);
    });

    test("canAccessTicket denies IT manager without department", () => {
        const itManager = { role: "it_manager", department: null };
        const ticket = { department: "dept-1" };
        assert.equal(canAccessTicket(itManager, ticket), false);
    });
});

describe("Asset Manager & Assignment Security", () => {
    test("canManageAssets authorizes asset_manager and system_admin only", () => {
        assert.equal(canManageAssets({ role: "asset_manager" }), true);
        assert.equal(canManageAssets({ role: "system_admin" }), true);
        assert.equal(canManageAssets({ role: "admin" }), true);
        assert.equal(canManageAssets({ role: "it_manager" }), false);
        assert.equal(canManageAssets({ role: "manager" }), false);
        assert.equal(canManageAssets({ role: "technician" }), false);
        assert.equal(canManageAssets({ role: "employee" }), false);
    });

    test("Asset Manager has no ticket access via canAccessTicket", () => {
        const assetMgr = { role: "asset_manager", _id: "6ab4a4374094c9dcbfc7b001" };
        const ticket = { createdBy: "6ab4a4374094c9dcbfc7b002", department: "dept-1" };
        assert.equal(canAccessTicket(assetMgr, ticket), false);
    });

    test("Asset Manager ticket access filter returns null isolation", () => {
        const assetMgr = { role: "asset_manager", _id: "6ab4a4374094c9dcbfc7b001" };
        const filter = buildTicketAccessFilter(assetMgr);
        assert.deepEqual(filter, { _id: null });
    });

    test("assignAssetValidator rejects invalid or missing userId", async () => {
        const { assignAssetValidator } = await import(
            "../src/validators/assetValidators.js"
        );
        const { validationResult } = await import("express-validator");

        // Missing userId
        const reqMissing = { body: {} };
        await Promise.all(assignAssetValidator.map((v) => v.run(reqMissing)));
        const errorsMissing = validationResult(reqMissing);
        assert.equal(errorsMissing.isEmpty(), false);

        // Invalid ObjectId
        const reqInvalid = { body: { userId: "not-a-mongo-id" } };
        await Promise.all(assignAssetValidator.map((v) => v.run(reqInvalid)));
        const errorsInvalid = validationResult(reqInvalid);
        assert.equal(errorsInvalid.isEmpty(), false);

        // Valid ObjectId
        const reqValid = { body: { userId: "507f1f77bcf86cd799439011" } };
        await Promise.all(assignAssetValidator.map((v) => v.run(reqValid)));
        const errorsValid = validationResult(reqValid);
        assert.equal(errorsValid.isEmpty(), true);
    });
});

