const { readFileSync } = require("node:fs");
const path = require("node:path");

const colorsHtml = readFileSync(path.join(__dirname, "../../colors.html"), "utf8");
const colorsScript = readFileSync(path.join(__dirname, "../../js/colors.js"), "utf8");

function flushRequests() {
    return new Promise(resolve => setTimeout(resolve, 0));
}

function respondWith(data) {
    window.fetch.mockResolvedValue({
        json: async () => data
    });
}

describe("color page", () => {
    let addInput;
    let addButton;
    let searchInput;
    let searchButton;
    let colorOutput;
    let originalFetch;

    beforeEach(() => {
        const page = new DOMParser().parseFromString(colorsHtml, "text/html");
        document.body.innerHTML = page.body.innerHTML;
        localStorage.clear();
        localStorage.setItem("userId", "42");
        originalFetch = window.fetch;
        window.fetch = jest.fn();

        const listeners = jest.spyOn(document, "addEventListener");
        let readyListener;
        try {
            window.eval(colorsScript);
            readyListener = listeners.mock.calls.find(([event]) => event === "DOMContentLoaded")[1];
            document.removeEventListener("DOMContentLoaded", readyListener);
        } finally {
            listeners.mockRestore();
        }
        readyListener.call(document, new Event("DOMContentLoaded"));

        addInput = document.getElementById("addInput");
        addButton = document.getElementById("addButton");
        searchInput = document.getElementById("searchInput");
        searchButton = document.getElementById("searchButton");
        colorOutput = document.getElementById("colorOutput");
    });

    afterEach(() => {
        window.fetch = originalFetch;
        localStorage.clear();
        document.body.innerHTML = "";
        jest.restoreAllMocks();
    });

    test("rejects a whitespace-only color without contacting the API", () => {
        addInput.value = " \t ";

        addButton.click();

        expect(window.fetch).not.toHaveBeenCalled();
        expect(colorOutput.textContent).toBe("Enter a color name first.");
    });

    test("adds a trimmed color for the stored user and clears the input on success", async () => {
        respondWith({ error: "" });
        addInput.value = "  cobalt blue  ";

        addButton.click();
        await flushRequests();

        expect(window.fetch).toHaveBeenCalledTimes(1);
        expect(window.fetch).toHaveBeenCalledWith("LAMPAPI/AddColor.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: "42", color: "cobalt blue" })
        });
        expect(colorOutput.textContent).toBe('Added "cobalt blue".');
        expect(addInput.value).toBe("");
    });

    test("displays an API error and preserves the color input for retry", async () => {
        respondWith({ error: "Unable to add color" });
        addInput.value = " coral ";

        addButton.click();
        await flushRequests();

        expect(colorOutput.textContent).toBe("Unable to add color");
        expect(addInput.value).toBe(" coral ");
    });

    test("displays a rejected request and preserves the color input for retry", async () => {
        window.fetch.mockRejectedValue(new Error("Network unavailable"));
        addInput.value = "coral";

        addButton.click();
        await flushRequests();

        expect(colorOutput.textContent).toBe("Request failed: Error: Network unavailable");
        expect(addInput.value).toBe("coral");
    });

    test("searches with trimmed text for the stored user and displays returned names", async () => {
        respondWith({ results: ["royal blue", "sky blue"], error: "" });
        searchInput.value = "  blue  ";

        searchButton.click();
        await flushRequests();

        expect(window.fetch).toHaveBeenCalledTimes(1);
        expect(window.fetch).toHaveBeenCalledWith("LAMPAPI/SearchColors.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: "42", search: "blue" })
        });
        expect(colorOutput.textContent).toBe("royal blue, sky blue");
    });

    test("allows an empty search and reports when no colors match", async () => {
        respondWith({ results: [], error: "" });
        searchInput.value = "   ";

        searchButton.click();
        await flushRequests();

        expect(window.fetch).toHaveBeenCalledTimes(1);
        expect(window.fetch).toHaveBeenCalledWith("LAMPAPI/SearchColors.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: "42", search: "" })
        });
        expect(colorOutput.textContent).toBe("No colors found.");
    });
});
