import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { isValidTransition } from "../src/utils/ticketWorkflow.js";
import { calculateSLADueDate, evaluateSLAStatus } from "../src/services/slaService.js";
import { validateObjectId } from "../src/middleware/validateObjectId.js";

describe("Ticket Workflow Transitions", () => {
    test("allows valid transition from open to assigned", () => {
        assert.equal(isValidTransition("open", "assigned"), true);
    });

    test("allows valid transition from in_progress to resolved", () => {
        assert.equal(isValidTransition("in_progress", "resolved"), true);
    });

    test("allows valid transition from resolved to closed", () => {
        assert.equal(isValidTransition("resolved", "closed"), true);
    });

    test("allows valid transition from resolved to reopened", () => {
        assert.equal(isValidTransition("resolved", "reopened"), true);
    });

    test("rejects invalid direct transition from open to resolved", () => {
        assert.equal(isValidTransition("open", "resolved"), false);
    });

    test("rejects invalid transition from closed to in_progress directly", () => {
        assert.equal(isValidTransition("closed", "in_progress"), false);
    });

    test("returns true for identical status (no-op)", () => {
        assert.equal(isValidTransition("open", "open"), true);
    });
});

describe("Asset Lifecycle State Machine", () => {
    const VALID_ASSET_TRANSITIONS = {
        available: ["assigned", "maintenance", "retired"],
        assigned: ["available", "maintenance", "retired"],
        maintenance: ["available", "retired"],
        retired: ["available"]
    };

    const isValidAssetTransition = (current, next) => {
        if (current === next) return true;
        return VALID_ASSET_TRANSITIONS[current]?.includes(next) || false;
    };

    test("allows available -> assigned transition", () => {
        assert.equal(isValidAssetTransition("available", "assigned"), true);
    });

    test("allows assigned -> maintenance transition", () => {
        assert.equal(isValidAssetTransition("assigned", "maintenance"), true);
    });

    test("allows maintenance -> available transition", () => {
        assert.equal(isValidAssetTransition("maintenance", "available"), true);
    });

    test("allows retired -> available (reactivation)", () => {
        assert.equal(isValidAssetTransition("retired", "available"), true);
    });

    test("rejects maintenance -> assigned directly", () => {
        assert.equal(isValidAssetTransition("maintenance", "assigned"), false);
    });

    test("rejects retired -> maintenance directly", () => {
        assert.equal(isValidAssetTransition("retired", "maintenance"), false);
    });
});

describe("SLA Calculation and Evaluation", () => {
    test("calculates due date correctly for 240 minutes (4 hours) resolution time", () => {
        const baseTime = new Date("2026-01-01T10:00:00.000Z");
        const dueDate = calculateSLADueDate(baseTime, 240); // 240 minutes = 4 hours
        const expected = new Date("2026-01-01T14:00:00.000Z");
        assert.equal(dueDate.getTime(), expected.getTime());
    });

    test("calculates due date correctly across date boundary (360 minutes = 6 hours)", () => {
        const baseTime = new Date("2026-01-01T22:00:00.000Z");
        const dueDate = calculateSLADueDate(baseTime, 360);
        const expected = new Date("2026-01-02T04:00:00.000Z");
        assert.equal(dueDate.getTime(), expected.getTime());
    });

    test("evaluates SLA status as met if resolved before due date", () => {
        const ticket = {
            slaDueDate: new Date("2026-01-01T14:00:00.000Z"),
            resolvedAt: new Date("2026-01-01T13:30:00.000Z")
        };
        assert.equal(evaluateSLAStatus(ticket), "met");
    });

    test("evaluates SLA status as breached if resolved after due date", () => {
        const ticket = {
            slaDueDate: new Date("2026-01-01T14:00:00.000Z"),
            resolvedAt: new Date("2026-01-01T15:00:00.000Z")
        };
        assert.equal(evaluateSLAStatus(ticket), "breached");
    });
});

describe("Validate ObjectId Middleware", () => {
    const middleware = validateObjectId("id");

    test("accepts valid 24-character hexadecimal ObjectId", () => {
        const req = { params: { id: "507f1f77bcf86cd799439011" } };
        let nextCalled = false;
        const res = {
            status: () => res,
            json: () => {}
        };
        middleware(req, res, () => { nextCalled = true; });
        assert.equal(nextCalled, true);
    });

    test("rejects invalid ObjectId and returns 400", () => {
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
