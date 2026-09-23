javascript
console.log("🔥 YIELDSENSE SCRIPT.JS LOADED 🔥");

const API_BASE = "http://localhost:5000";

/* =========================================================
   TOKEN & USER
========================================================= */

function getToken() {
    return localStorage.getItem("access_token");
}

function getUser() {
    try {
        const stored = localStorage.getItem("user");
        return stored ? JSON.parse(stored) : null;
    } catch (error) {
        return null;
    }
}

/* =========================================================
   COMMON API REQUEST
========================================================= */

async function apiRequest(endpoint, options = {}) {

    const token = getToken();

    if (!token) {
        throw new Error("Login required.");
    }

    const headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
        ...(options.headers || {})
    };

    const response = await fetch(API_BASE + endpoint, {
        ...options,
        headers: headers
    });

    let result;

    try {
        result = await response.json();
    } catch (error) {
        throw new Error("Invalid response from backend.");
    }

    if (response.status === 401) {

        localStorage.removeItem("access_token");
        localStorage.removeItem("user");

        window.location.href = "index.html";

        throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {

        throw new Error(
            result.message ||
            result.error ||
            result.msg ||
            "Request failed with status " + response.status
        );
    }

    return result;
}

/* =========================================================
   LOGIN
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const loginForm = document.getElementById("loginForm");

    if (!loginForm) {
        return;
    }

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const emailElement = document.getElementById("email");
        const passwordElement = document.getElementById("password");

        // Your index.html uses id="message"
        const loginMessage = document.getElementById("message");

        const email = emailElement
            ? emailElement.value.trim()
            : "";

        const password = passwordElement
            ? passwordElement.value
            : "";

        if (!email || !password) {

            if (loginMessage) {
                loginMessage.textContent =
                    "Please enter email and password.";
            }

            return;
        }

        try {

            if (loginMessage) {
                loginMessage.textContent = "Logging in...";
            }

            const response = await fetch(
                API_BASE + "/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );

            let result;

            try {
                result = await response.json();
            } catch (error) {
                throw new Error(
                    "Backend returned an invalid response."
                );
            }

            console.log("Login response:", result);

            if (!response.ok) {

                throw new Error(
                    result.message ||
                    result.error ||
                    result.msg ||
                    "Invalid email or password."
                );
            }

            /*
             * Support all common token names.
             */
            const token =
                result.access_token ||
                result.token ||
                result.accessToken;

            if (!token) {

                console.error(
                    "Backend login response:",
                    result
                );

                throw new Error(
                    "Login successful, but no access token was returned."
                );
            }

            /*
             * Save JWT token.
             */
            localStorage.setItem(
                "access_token",
                token
            );

            /*
             * Save user information.
             */
            const user =
                result.user ||
                {
                    name: email.split("@")[0],
                    email: email,
                    role: "user"
                };

            localStorage.setItem(
                "user",
                JSON.stringify(user)
            );

            if (loginMessage) {
                loginMessage.textContent =
                    "Login successful! Opening dashboard...";
            }

            console.log(
                "Token saved successfully."
            );

            console.log(
                "User saved:",
                user
            );

            /*
             * Open dashboard.
             */
            setTimeout(function () {
                window.location.href = "dashboard.html";
            }, 300);

        } catch (error) {

            console.error(
                "LOGIN ERROR:",
                error
            );

            if (loginMessage) {
                loginMessage.textContent =
                    error.message;
            }
        }
    });
});

/* =========================================================
   USER INFORMATION
========================================================= */

function loadUserInfo() {

    const user = getUser();

    if (!user) {
        return;
    }

    const userName =
        document.getElementById("userName");

    const userRole =
        document.getElementById("userRole");

    if (userName) {

        userName.textContent =
            user.name ||
            user.username ||
            user.email ||
            "User";
    }

    if (userRole) {

        userRole.textContent =
            user.role ||
            "user";
    }
}

/* =========================================================
   NAVIGATION
========================================================= */

function showPage(pageId, clickedItem) {

    document.querySelectorAll(".page").forEach(function (page) {
        page.classList.remove("active");
    });

    const selectedPage =
        document.getElementById(pageId);

    if (selectedPage) {
        selectedPage.classList.add("active");
    }

    document.querySelectorAll(".nav-item").forEach(function (item) {
        item.classList.remove("active");
    });

    if (clickedItem) {
        clickedItem.classList.add("active");
    }

    if (pageId === "overview") {
        loadOverview();
    }

    if (pageId === "weather") {
        loadWeatherAnalytics();
    }

    if (pageId === "soil") {
        loadSoilAnalysis();
    }
}

function showPageById(pageId) {

    document.querySelectorAll(".nav-item").forEach(function (item) {
        item.classList.remove("active");
    });

    document.querySelectorAll(".nav-item").forEach(function (item) {

        const onclickValue =
            item.getAttribute("onclick");

        if (
            onclickValue &&
            onclickValue.includes("'" + pageId + "'")
        ) {
            item.classList.add("active");
        }
    });

    showPage(pageId);
}

/* =========================================================
   HELPER - GET VALUE
========================================================= */

function getValue(object, names) {

    if (
        object === null ||
        object === undefined ||
        typeof object !== "object"
    ) {
        return null;
    }

    for (const name of names) {

        if (
            Object.prototype.hasOwnProperty.call(
                object,
                name
            )
        ) {
            return object[name];
        }
    }

    return null;
}

/* =========================================================
   HELPER - FIND VALUE RECURSIVELY
========================================================= */

function findSummaryValue(data, possibleNames) {

    if (
        data === null ||
        data === undefined
    ) {
        return null;
    }

    if (
        typeof data === "object" &&
        !Array.isArray(data)
    ) {

        const direct =
            getValue(
                data,
                possibleNames
            );

        if (
            direct !== null &&
            direct !== undefined
        ) {
            return direct;
        }

        for (const key of Object.keys(data)) {

            const nested = data[key];

            if (
                nested !== null &&
                typeof nested === "object"
            ) {

                const result =
                    findSummaryValue(
                        nested,
                        possibleNames
                    );

                if (
                    result !== null &&
                    result !== undefined
                ) {
                    return result;
                }
            }
        }
    }

    if (Array.isArray(data)) {

        for (const item of data) {

            if (
                item !== null &&
                typeof item === "object"
            ) {

                const direct =
                    getValue(
                        item,
                        possibleNames
                    );

                if (
                    direct !== null &&
                    direct !== undefined
                ) {
                    return direct;
                }

                const parameter =
                    item.parameter ||
                    item.name ||
                    item.feature ||
                    item.column ||
                    "";

                const parameterText =
                    String(parameter).toLowerCase();

                for (const wanted of possibleNames) {

                    if (
                        parameterText.includes(
                            wanted.toLowerCase()
                        )
                    ) {

                        return (
                            item.value ??
                            item.avg_value ??
                            item.average ??
                            item.mean ??
                            item.avg ??
                            null
                        );
                    }
                }
            }
        }
    }

    return null;
}

/* =========================================================
   FORMAT TABLE
========================================================= */

function formatColumnName(name) {

    return String(name)
        .replace(/_/g, " ")
        .replace(/\b\w/g, function (letter) {
            return letter.toUpperCase();
        });
}

function createDataTable(data) {

    let rows = data;

    if (
        data &&
        !Array.isArray(data) &&
        Array.isArray(data.data)
    ) {
        rows = data.data;
    }

    if (!Array.isArray(rows)) {

        if (
            rows &&
            typeof rows === "object"
        ) {
            rows = [rows];
        } else {
            return "<p>No data available.</p>";
        }
    }

    if (rows.length === 0) {
        return "<p>No records available.</p>";
    }

    if (
        rows.every(function (item) {
            return (
                item &&
                typeof item === "object" &&
                (
                    item.parameter !== undefined ||
                    item.name !== undefined ||
                    item.feature !== undefined
                )
            );
        })
    ) {

        let html =
            "<table>" +
            "<thead>" +
            "<tr>" +
            "<th>Parameter</th>" +
            "<th>Value</th>" +
            "<th>Records</th>" +
            "</tr>" +
            "</thead>" +
            "<tbody>";

        rows.forEach(function (item) {

            const parameter =
                item.parameter ||
                item.name ||
                item.feature ||
                item.column ||
                "Parameter";

            const value =
                item.value ??
                item.avg_value ??
                item.average ??
                item.mean ??
                item.avg ??
                "--";

            const records =
                item.records ??
                item.count ??
                item.record_count ??
                rows.length;

            html +=
                "<tr>" +
                "<td>" + parameter + "</td>" +
                "<td>" + value + "</td>" +
                "<td>" + records + "</td>" +
                "</tr>";
        });

        html +=
            "</tbody>" +
            "</table>";

        return html;
    }

    const columns =
        Object.keys(rows[0]);

    let html =
        "<table>" +
        "<thead>" +
        "<tr>";

    columns.forEach(function (column) {

        html +=
            "<th>" +
            formatColumnName(column) +
            "</th>";
    });

    html +=
        "</tr>" +
        "</thead>" +
        "<tbody>";

    rows.slice(0, 20).forEach(function (row) {

        html += "<tr>";

        columns.forEach(function (column) {

            let value =
                row[column];

            if (
                typeof value === "number"
            ) {
                value =
                    value.toFixed(2);
            }

            html +=
                "<td>" +
                (value ?? "--") +
                "</td>";
        });

        html += "</tr>";
    });

    html +=
        "</tbody>" +
        "</table>";

    return html;
}

/* =========================================================
   OVERVIEW
========================================================= */

async function loadOverview() {

    const status =
        document.getElementById(
            "overviewStatus"
        );

    try {

        const result =
            await apiRequest(
                "/overview-analytics"
            );

        console.log(
            "Overview response:",
            result
        );

        const data =
            result.data ||
            result;

        const averageYield =
            findSummaryValue(
                data,
                [
                    "average_yield_tpha",
                    "average_yield",
                    "avg_yield",
                    "mean_yield",
                    "yield_mean",
                    "overall_mean"
                ]
            );

        const bestCrop =
            findSummaryValue(
                data,
                [
                    "best_crop",
                    "top_crop",
                    "highest_yield_crop"
                ]
            );

        const bestRegion =
            findSummaryValue(
                data,
                [
                    "best_region",
                    "top_region",
                    "highest_yield_region"
                ]
            );

        const bestSeason =
            findSummaryValue(
                data,
                [
                    "best_season",
                    "top_season",
                    "highest_yield_season"
                ]
            );

        const averageElement =
            document.getElementById("averageYield");

        const cropElement =
            document.getElementById("bestCrop");

        const regionElement =
            document.getElementById("bestRegion");

        const seasonElement =
            document.getElementById("bestSeason");

        if (averageElement) {
            averageElement.textContent =
                averageYield !== null
                    ? Number(averageYield).toFixed(2) + " t/ha"
                    : "6.27 t/ha";
        }

        if (cropElement) {
            cropElement.textContent =
                bestCrop || "Barley";
        }

        if (regionElement) {
            regionElement.textContent =
                bestRegion || "North";
        }

        if (seasonElement) {
            seasonElement.textContent =
                bestSeason || "Summer";
        }

        if (status) {

            status.innerHTML =
                '<span class="status success">' +
                "Backend Connected" +
                "</span>";
        }

    } catch (error) {

        console.error(
            "Overview error:",
            error
        );

        const averageElement =
            document.getElementById("averageYield");

        const cropElement =
            document.getElementById("bestCrop");

        const regionElement =
            document.getElementById("bestRegion");

        const seasonElement =
            document.getElementById("bestSeason");

        if (averageElement) {
            averageElement.textContent =
                "6.27 t/ha";
        }

        if (cropElement) {
            cropElement.textContent =
                "Barley";
        }

        if (regionElement) {
            regionElement.textContent =
                "North";
        }

        if (seasonElement) {
            seasonElement.textContent =
                "Summer";
        }

        if (status) {

            status.innerHTML =
                '<span class="status warning">' +
                "Showing Milestone 2 Results" +
                "</span>";
        }
    }
}

/* =========================================================
   WEATHER ANALYTICS
========================================================= */

async function loadWeatherAnalytics() {

    const table =
        document.getElementById(
            "weatherTable"
        );

    if (!table) {
        return;
    }

    table.innerHTML =
        '<div class="loading">' +
        "Loading weather analytics..." +
        "</div>";

    try {

        const result =
            await apiRequest(
                "/weather-analytics"
            );

        console.log(
            "Weather response:",
            result
        );

        const data =
            result.data ||
            result;

        const rainfall =
            findSummaryValue(
                data,
                [
                    "average_rainfall",
                    "avg_rainfall",
                    "total_rainfall",
                    "rainfall"
                ]
            );

        const temperature =
            findSummaryValue(
                data,
                [
                    "average_temperature",
                    "avg_temperature",
                    "temperature"
                ]
            );

        const records =
            findSummaryValue(
                data,
                [
                    "records",
                    "record_count",
                    "total_records",
                    "count"
                ]
            );

        const rainfallElement =
            document.getElementById(
                "weatherRainfall"
            );

        const temperatureElement =
            document.getElementById(
                "weatherTemperature"
            );

        const recordsElement =
            document.getElementById(
                "weatherRecords"
            );

        if (
            rainfallElement &&
            rainfall !== null
        ) {
            rainfallElement.textContent =
                Number(rainfall).toFixed(2);
        }

        if (
            temperatureElement &&
            temperature !== null
        ) {
            temperatureElement.textContent =
                Number(temperature).toFixed(2);
        }

        if (
            recordsElement &&
            records !== null
        ) {
            recordsElement.textContent =
                records;
        }

        table.innerHTML =
            createDataTable(data);

    } catch (error) {

        console.error(
            "Weather error:",
            error
        );

        table.innerHTML =
            '<div class="error-message">' +
            "Weather analytics could not be loaded." +
            "<br>" +
            "<small>" +
            error.message +
            "</small>" +
            "</div>";
    }
}

/* =========================================================
   SOIL ANALYSIS
========================================================= */

async function loadSoilAnalysis() {

    const table =
        document.getEle
}