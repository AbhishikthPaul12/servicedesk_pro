/**
 * ResolveDesk — Asset Manager & Assignment Verification Test
 * Run: node tests/assetManager.test.js
 */

const BASE = "http://localhost:5000/api";

const log = (label, ok, detail = "") =>
    console.log(`  ${ok ? "✓" : "✗"} ${label}${detail ? ` (${detail})` : ""}`);

const assert = (cond, msg) => {
    if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
};

async function api(method, path, body, token) {
    const opts = {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${BASE}${path}`, opts);
    const json = await res.json().catch(() => ({}));
    return { status: res.status, body: json };
}

async function login(email, password) {
    const r = await api("POST", "/auth/login", { email, password });
    assert(r.status === 200, `Login failed for ${email}: ${JSON.stringify(r.body)}`);
    return r.body.token;
}

let passed = 0;
let failed = 0;

async function check(label, fn) {
    try {
        await fn();
        log(label, true);
        passed++;
    } catch (e) {
        log(label, false, e.message);
        failed++;
    }
}

async function run() {
    console.log("\n===================================================");
    console.log("  ResolveDesk — Asset Manager Test Suite");
    console.log("===================================================\n");

    console.log("[ Authentication ]");
    let assetMgrToken, adminToken, empToken, techToken;
    let empUserId;

    await check("Asset Manager login", async () => {
        assetMgrToken = await login("assetmanager@servicedesk.com", "Asset123!");
        assert(assetMgrToken, "Asset Manager token missing");
    });

    await check("System Admin login", async () => {
        adminToken = await login("admin@servicedesk.com", "Admin123!");
        assert(adminToken, "Admin token missing");
    });

    await check("Employee login", async () => {
        empToken = await login("employee@servicedesk.com", "Emp123!");
        assert(empToken, "Employee token missing");
    });

    await check("Technician login", async () => {
        techToken = await login("tech@servicedesk.com", "Tech123!");
        assert(techToken, "Technician token missing");
    });

    await check("Resolve Employee profile ID", async () => {
        const r = await api("GET", "/auth/me", null, empToken);
        assert(r.status === 200, JSON.stringify(r.body));
        empUserId = r.body.user.id || r.body.user._id;
        assert(empUserId, "Could not resolve employee user ID");
    });

    console.log("\n[ TEST 1 & 2 ] Assignable Users Endpoint");
    let assignableUsers = [];

    await check("TEST 1: Asset Manager requests assignable users (GET /users/assignable) -> 200", async () => {
        const r = await api("GET", "/users/assignable", null, assetMgrToken);
        assert(r.status === 200, `Expected 200, got ${r.status}: ${JSON.stringify(r.body)}`);
        assert(r.body.success === true, "success should be true");
        assert(Array.isArray(r.body.users), "users should be an array");
        assignableUsers = r.body.users;
    });

    await check("TEST 2: Asset Manager receives eligible active users without sensitive fields", async () => {
        assert(assignableUsers.length > 0, "Expected at least 1 assignable user");
        for (const u of assignableUsers) {
            assert(u._id, "User must have _id");
            assert(u.name, "User must have name");
            assert(u.email, "User must have email");
            assert(u.role, "User must have role");
            assert(!u.password, "User must not expose password");
        }
        // Verify employee is in list
        const hasEmp = assignableUsers.some(u => String(u._id) === String(empUserId));
        assert(hasEmp, "Active employee should be in assignable users list");
    });

    console.log("\n[ TEST 3 ] Asset Manager Restricted User Management");

    await check("TEST 3a: Asset Manager denied full user list (GET /users) -> 403", async () => {
        const r = await api("GET", "/users", null, assetMgrToken);
        assert(r.status === 403, `Expected 403, got ${r.status}`);
    });

    await check("TEST 3b: Asset Manager denied user creation (POST /users) -> 403", async () => {
        const r = await api("POST", "/users", {
            name: "Hacker User",
            email: "hacker@test.com",
            password: "Password123!",
            role: "employee"
        }, assetMgrToken);
        assert(r.status === 403, `Expected 403, got ${r.status}`);
    });

    await check("TEST 3c: Asset Manager denied user modification (PATCH /users/:id) -> 403", async () => {
        const r = await api("PATCH", `/users/${empUserId}`, { name: "Modified Name" }, assetMgrToken);
        assert(r.status === 403, `Expected 403, got ${r.status}`);
    });

    console.log("\n[ TEST 4, 5 & 6 ] Asset Assignment & Validation");
    let testAssetId;
    const testTag = `TAG-${Date.now()}`;

    await check("Asset Manager creates an available test asset", async () => {
        const r = await api("POST", "/assets", {
            assetTag: testTag,
            name: "Dell Latitude 5540",
            type: "laptop",
            brand: "Dell",
            model: "Latitude 5540",
            status: "available"
        }, assetMgrToken);
        assert(r.status === 201, `Expected 201, got ${r.status}: ${JSON.stringify(r.body)}`);
        testAssetId = r.body.asset._id;
        assert(testAssetId, "Created asset has no _id");
    });

    await check("TEST 5a: Asset Manager attempts assignment with invalid user ID format -> 400", async () => {
        const r = await api("PATCH", `/assets/${testAssetId}/assign`, { userId: "invalid-id-xyz" }, assetMgrToken);
        assert(r.status === 400, `Expected 400, got ${r.status}`);
        assert(r.body.success === false, "success should be false");
    });

    await check("TEST 5b: Asset Manager attempts assignment with non-existent user ID -> 404", async () => {
        const r = await api("PATCH", `/assets/${testAssetId}/assign`, { userId: "507f1f77bcf86cd799439011" }, assetMgrToken);
        assert(r.status === 404, `Expected 404, got ${r.status}`);
        assert(r.body.success === false, "success should be false");
    });

    // Create an inactive user for TEST 6
    let inactiveUserId;
    await check("Setup: Admin creates inactive user for test", async () => {
        const inactiveEmail = `inactive-${Date.now()}@servicedesk.com`;
        const r = await api("POST", "/users", {
            name: "Inactive Test User",
            email: inactiveEmail,
            password: "Password123!",
            role: "employee",
            department: "6ab4a4374094c9dcbfc7b009"
        }, adminToken);
        assert(r.status === 201, `Failed to create user: ${JSON.stringify(r.body)}`);
        inactiveUserId = r.body.user._id;

        // Deactivate user
        const rDeactivate = await api("PATCH", `/users/${inactiveUserId}`, { isActive: false }, adminToken);
        assert(rDeactivate.status === 200, `Failed to deactivate user: ${JSON.stringify(rDeactivate.body)}`);
    });

    await check("TEST 6: Asset Manager attempts assignment to inactive user -> 400", async () => {
        const r = await api("PATCH", `/assets/${testAssetId}/assign`, { userId: inactiveUserId }, assetMgrToken);
        assert(r.status === 400, `Expected 400, got ${r.status}: ${JSON.stringify(r.body)}`);
        assert(r.body.message.includes("inactive"), `Expected inactive user message, got: ${r.body.message}`);
    });

    await check("TEST 4: Asset Manager assigns asset to valid active user -> 200 & Persisted", async () => {
        const r = await api("PATCH", `/assets/${testAssetId}/assign`, { userId: empUserId }, assetMgrToken);
        assert(r.status === 200, `Expected 200, got ${r.status}: ${JSON.stringify(r.body)}`);
        assert(r.body.success === true, "success should be true");
        assert(r.body.asset.status === "assigned", `Status should be 'assigned', got: ${r.body.asset.status}`);
        const assignedId = r.body.asset.assignedTo?._id || r.body.asset.assignedTo;
        assert(String(assignedId) === String(empUserId), "assignedTo should match employee ID");

        // Verify database persistence via GET /assets/:id
        const verifyRes = await api("GET", `/assets/${testAssetId}`, null, assetMgrToken);
        assert(verifyRes.status === 200, "Failed to fetch asset");
        assert(verifyRes.body.asset.status === "assigned", "Persisted status should be 'assigned'");
        const persistedAssignedId = verifyRes.body.asset.assignedTo?._id || verifyRes.body.asset.assignedTo;
        assert(String(persistedAssignedId) === String(empUserId), "Persisted assignedTo should match employee ID");
    });

    console.log("\n[ TEST 7 ] Unauthorized Role Access to /users/assignable");

    await check("TEST 7a: Employee denied /users/assignable -> 403", async () => {
        const r = await api("GET", "/users/assignable", null, empToken);
        assert(r.status === 403, `Expected 403, got ${r.status}`);
    });

    await check("TEST 7b: Technician denied /users/assignable -> 403", async () => {
        const r = await api("GET", "/users/assignable", null, techToken);
        assert(r.status === 403, `Expected 403, got ${r.status}`);
    });

    console.log("\n[ TEST 8 ] Asset Manager Ticket Security Intact");

    await check("TEST 8a: Asset Manager denied access to tickets list (GET /tickets) -> 403", async () => {
        const r = await api("GET", "/tickets", null, assetMgrToken);
        assert(r.status === 403, `Expected 403, got ${r.status}`);
    });

    // Create a ticket to test direct ticket access
    let dummyTicketId;
    await check("Setup: Admin creates ticket for ticket security test", async () => {
        const r = await api("POST", "/tickets", {
            title: "Security Isolation Ticket",
            description: "Testing asset manager ticket block",
            category: "other",
            priority: "low"
        }, adminToken);
        assert(r.status === 201, `Failed to create ticket: ${JSON.stringify(r.body)}`);
        dummyTicketId = r.body.ticket._id;
    });

    await check("TEST 8b: Asset Manager denied access to specific ticket (GET /tickets/:id) -> 403", async () => {
        const r = await api("GET", `/tickets/${dummyTicketId}`, null, assetMgrToken);
        assert(r.status === 403, `Expected 403, got ${r.status}`);
    });

    console.log("\n[ Lifecycle Verification ] Unassign / Return");

    await check("Asset Manager returns asset -> status becomes available", async () => {
        const r = await api("PATCH", `/assets/${testAssetId}/return`, null, assetMgrToken);
        assert(r.status === 200, `Expected 200, got ${r.status}: ${JSON.stringify(r.body)}`);
        assert(r.body.asset.status === "available", `Expected status available, got: ${r.body.asset.status}`);
        assert(r.body.asset.assignedTo === null, "assignedTo should be null");
    });

    console.log("\n═══════════════════════════════════════════════════");
    console.log(`  Total: ${passed + failed}  |  Passed: ${passed}  |  Failed: ${failed}`);
    console.log("═══════════════════════════════════════════════════\n");

    process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
    console.error("Fatal:", err.message);
    process.exit(1);
});
