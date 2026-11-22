const { spawn, spawnSync } = require("node:child_process");
const { createHash, randomBytes } = require("node:crypto");
const fs = require("node:fs/promises");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const mysql = require("mysql2/promise");

const databaseName = `colors_test_${randomBytes(12).toString("hex")}`;
const passwordHash = createHash("md5").update("test-password").digest("hex");
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
let connection;
let ownsDatabase = false;
let temporaryRoot;
let phpServer;
let phpStopped;
let serverFailure;
let serverOutput = "";
let baseUrl;

function databaseConfig() {
    const required = ["TEST_DB_HOST", "TEST_DB_USER", "TEST_DB_PASSWORD"];
    for (const name of required) {
        if (process.env[name] === undefined || /[\r\n]/.test(process.env[name])) {
            throw new Error(`Set ${name} explicitly to a value without newlines for integration tests.`);
        }
    }
    const port = Number(process.env.TEST_DB_PORT || "3306");
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error("TEST_DB_PORT must be an integer between 1 and 65535.");
    }
    return {
        host: process.env.TEST_DB_HOST,
        user: process.env.TEST_DB_USER,
        password: process.env.TEST_DB_PASSWORD,
        port,
        connectTimeout: 5000,
        multipleStatements: true
    };
}

async function availablePort() {
    const listener = net.createServer();
    await new Promise((resolve, reject) => {
        listener.once("error", reject);
        listener.listen(0, "127.0.0.1", resolve);
    });
    const port = listener.address().port;
    await new Promise((resolve, reject) => {
        listener.close((error) => error ? reject(error) : resolve());
    });
    return port;
}

async function startPhp(binary) {
    const port = await availablePort();
    baseUrl = `http://127.0.0.1:${port}`;
    const readyToken = randomBytes(16).toString("hex");
    await fs.writeFile(path.join(temporaryRoot, "ready.txt"), readyToken);
    phpServer = spawn(binary, ["-S", `127.0.0.1:${port}`, "-t", temporaryRoot], {
        cwd: temporaryRoot,
        windowsHide: true,
        stdio: ["ignore", "ignore", "pipe"]
    });
    phpServer.stderr.on("data", (chunk) => {
        serverOutput = (serverOutput + chunk.toString()).slice(-4000);
    });
    phpStopped = new Promise((resolve) => {
        phpServer.once("error", (error) => {
            serverFailure = error;
            resolve();
        });
        phpServer.once("exit", (code, signal) => {
            serverFailure = new Error(`PHP exited with code ${code}, signal ${signal}.`);
            resolve();
        });
    });
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
        if (serverFailure) {
            throw new Error(`PHP server failed. ${serverFailure.message}\n${serverOutput}`);
        }
        try {
            const response = await fetch(`${baseUrl}/ready.txt`, { signal: AbortSignal.timeout(1000) });
            if (response.status === 200 && await response.text() === readyToken) {
                return;
            }
        } catch {
            // The server may still be binding its listening socket.
        }
        await wait(100);
    }
    throw new Error(`PHP server did not become ready.\n${serverOutput}`);
}

async function waitForServerExit(milliseconds) {
    let timer;
    try {
        return await Promise.race([
            phpStopped.then(() => true),
            new Promise((resolve) => { timer = setTimeout(() => resolve(false), milliseconds); })
        ]);
    } finally {
        clearTimeout(timer);
    }
}

async function cleanup() {
    const failures = [];
    try {
        if (phpServer && phpServer.exitCode === null && phpServer.signalCode === null) {
            phpServer.kill();
            if (!await waitForServerExit(3000)) {
                phpServer.kill("SIGKILL");
                if (!await waitForServerExit(3000)) {
                    throw new Error("PHP server could not be stopped.");
                }
            }
        }
    } catch (error) {
        failures.push(error);
    }
    try {
        if (connection && ownsDatabase) {
            await connection.query(`DROP DATABASE \`${databaseName}\``);
            ownsDatabase = false;
        }
    } catch (error) {
        failures.push(error);
    }
    try {
        if (connection) {
            await connection.end();
            connection = undefined;
        }
    } catch (error) {
        failures.push(error);
    }
    try {
        if (temporaryRoot) {
            await fs.rm(temporaryRoot, { recursive: true, force: true });
            temporaryRoot = undefined;
        }
    } catch (error) {
        failures.push(error);
    }
    if (failures.length) {
        throw new AggregateError(failures, "Integration test cleanup failed.");
    }
}

async function post(endpoint, body) {
    const response = await fetch(`${baseUrl}/LAMPAPI/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000)
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/application\/json/i);
    return response.json();
}

beforeAll(async () => {
    try {
        const config = databaseConfig();
        const binary = process.env.PHP_BINARY || "php";
        const preflight = spawnSync(binary, ["-r", "exit(extension_loaded('mysqli') ? 0 : 1);"], {
            encoding: "utf8",
            windowsHide: true,
            timeout: 5000
        });
        if (preflight.error || preflight.status !== 0) {
            throw new Error(`PHP with mysqli enabled is required. Check PHP_BINARY and php.ini. ${preflight.error?.message || preflight.stderr}`);
        }
        connection = await mysql.createConnection(config);
        await connection.query(`CREATE DATABASE \`${databaseName}\``);
        ownsDatabase = true;
        await connection.query(`USE \`${databaseName}\``);
        const schema = await fs.readFile(path.join(__dirname, "../../LAMPAPI/sql/schema.sql"), "utf8");
        await connection.query(schema.replaceAll("`COP4331`", `\`${databaseName}\``));
        await connection.execute(
            "INSERT INTO Users (ID, FirstName, LastName, Login, Password) VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)",
            [1, "Ada", "Lovelace", "ada", passwordHash, 2, "Grace", "Hopper", "grace", passwordHash]
        );
        temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "colors-api-test-"));
        await fs.cp(path.join(__dirname, "../../LAMPAPI"), path.join(temporaryRoot, "LAMPAPI"), { recursive: true });
        await fs.writeFile(path.join(temporaryRoot, ".env"), [
            `DB_HOST=${config.host}:${config.port}`,
            `DB_USER=${config.user}`,
            `DB_PASS=${config.password}`,
            `DB_NAME=${databaseName}`,
            ""
        ].join("\n"));
        await startPhp(binary);
    } catch (error) {
        try {
            await cleanup();
        } catch (cleanupError) {
            throw new AggregateError([error, cleanupError], "Integration test setup failed.", { cause: cleanupError });
        }
        throw error;
    }
}, 30000);

beforeEach(async () => {
    await connection.query("DELETE FROM Colors");
    await connection.execute("INSERT INTO Colors (Name, UserID) VALUES (?, ?), (?, ?), (?, ?)", [
        "Red", 1, "Blue", 1, "Red for another user", 2
    ]);
});

afterAll(cleanup);

test("valid credentials return the matching user's identity", async () => {
    expect(await post("Login.php", { login: "ada", password: passwordHash })).toEqual({
        id: 1, firstName: "Ada", lastName: "Lovelace", error: ""
    });
});

test.each([
    ["wrong password", "ada", createHash("md5").update("wrong-password").digest("hex")],
    ["unknown login", "missing", passwordHash]
])("login rejects %s", async (_scenario, login, password) => {
    expect(await post("Login.php", { login, password })).toEqual({
        id: 0, firstName: "", lastName: "", error: "No Records Found"
    });
});

test("adding a color persists its owner and makes it searchable", async () => {
    expect(await post("AddColor.php", { userId: 1, color: "Green" })).toEqual({ error: "" });
    const [rows] = await connection.execute("SELECT Name, UserID FROM Colors WHERE Name = ?", ["Green"]);
    expect(rows).toEqual([{ Name: "Green", UserID: 1 }]);
    expect(await post("SearchColors.php", { userId: 1, search: "Green" })).toEqual({ results: ["Green"], error: "" });
});

test("substring searches return only the requested user's colors", async () => {
    expect(await post("SearchColors.php", { userId: 1, search: "Re" })).toEqual({ results: ["Red"], error: "" });
    expect(await post("SearchColors.php", { userId: 2, search: "Re" })).toEqual({ results: ["Red for another user"], error: "" });
});

test("an empty search returns all of the requested user's colors", async () => {
    const response = await post("SearchColors.php", { userId: 1, search: "" });
    expect(response.error).toBe("");
    expect(response.results.sort()).toEqual(["Blue", "Red"]);
});

test("an unmatched search returns an empty results array", async () => {
    expect(await post("SearchColors.php", { userId: 1, search: "Purple" })).toEqual({ results: [], error: "" });
});
