/* ============================================
   YieldSense AI — Frontend Application Logic
   ============================================ */

const API_BASE = "http://127.0.0.1:5000";

// -----------------------------------------------
// State
// -----------------------------------------------
let currentPage = "dashboard";
let dashboardData = null;
let reportsData = null;
let lastPrediction = null;
let lastRiskAssessment = null;
let lastInsights = null;
let chartInstances = {};

// -----------------------------------------------
// Navigation
// -----------------------------------------------
function navigateTo(page) {
    currentPage = page;

    // Update page sections
    document.querySelectorAll(".page-section").forEach(sec => sec.classList.remove("active"));
    const target = document.getElementById(`page-${page}`);
    if (target) target.classList.add("active");

    // Update nav links
    document.querySelectorAll(".nav-links a").forEach(link => {
        link.classList.toggle("active", link.dataset.page === page);
    });

    // Close mobile nav
    document.getElementById("navLinks").classList.remove("open");

    // Load data when first visiting
    if (page === "dashboard" && !dashboardData) loadDashboard();
    if (page === "reports" && !reportsData) loadReports();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// Mobile nav toggle
document.getElementById("navToggle").addEventListener("click", () => {
    document.getElementById("navLinks").classList.toggle("open");
});

// -----------------------------------------------
// Dashboard
// -----------------------------------------------
async function loadDashboard() {
    try {
        const res = await fetch(`${API_BASE}/api/dashboard`);
        const data = await res.json();

        if (!data.success) throw new Error(data.error);

        dashboardData = data;
        renderDashboardStats(data);
        renderCropChart(data);
        renderRegionChart(data);
        renderDistributionChart(data);
        renderIrrigationChart(data);

    } catch (err) {
        console.error("Dashboard error:", err);
        document.getElementById("statsGrid").innerHTML = `
            <div class="error-box" style="grid-column: 1/-1;">
                <div class="error-box-icon">❌</div>
                <div>
                    <h4>Failed to load dashboard</h4>
                    <p>${err.message}. Make sure the Flask backend is running on port 5000.</p>
                </div>
            </div>
        `;
    }
}

function renderDashboardStats(data) {
    document.getElementById("statTotal").textContent = data.total_records.toLocaleString();
    document.getElementById("statAvg").textContent = data.average_yield.toLocaleString();
    document.getElementById("statMin").textContent = data.minimum_yield.toLocaleString();
    document.getElementById("statMax").textContent = data.maximum_yield.toLocaleString();
    document.getElementById("dashTotalRecords").textContent = data.total_records.toLocaleString();
}

// Chart color palette
const CHART_COLORS = [
    "rgba(16, 185, 129, 0.85)",
    "rgba(59, 130, 246, 0.85)",
    "rgba(245, 158, 11, 0.85)",
    "rgba(239, 68, 68, 0.85)",
    "rgba(168, 85, 247, 0.85)",
    "rgba(236, 72, 153, 0.85)",
    "rgba(6, 182, 212, 0.85)"
];

const CHART_BORDERS = [
    "rgba(16, 185, 129, 1)",
    "rgba(59, 130, 246, 1)",
    "rgba(245, 158, 11, 1)",
    "rgba(239, 68, 68, 1)",
    "rgba(168, 85, 247, 1)",
    "rgba(236, 72, 153, 1)",
    "rgba(6, 182, 212, 1)"
];

function getChartDefaults() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    font: { family: "'Inter', sans-serif", size: 12 },
                    padding: 16
                }
            }
        },
        scales: {
            x: {
                ticks: { font: { family: "'Inter', sans-serif", size: 11 } },
                grid: { color: "rgba(0,0,0,0.04)" }
            },
            y: {
                ticks: { font: { family: "'Inter', sans-serif", size: 11 } },
                grid: { color: "rgba(0,0,0,0.06)" },
                beginAtZero: false
            }
        }
    };
}

function destroyChart(id) {
    if (chartInstances[id]) {
        chartInstances[id].destroy();
        delete chartInstances[id];
    }
}

function renderCropChart(data) {
    destroyChart("cropChart");
    const labels = Object.keys(data.crop_yield);
    const values = Object.values(data.crop_yield);

    chartInstances["cropChart"] = new Chart(
        document.getElementById("cropChart").getContext("2d"),
        {
            type: "bar",
            data: {
                labels,
                datasets: [{
                    label: "Avg Yield (kg/ha)",
                    data: values,
                    backgroundColor: CHART_COLORS.slice(0, labels.length),
                    borderColor: CHART_BORDERS.slice(0, labels.length),
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                ...getChartDefaults(),
                plugins: {
                    ...getChartDefaults().plugins,
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => `${ctx.parsed.y.toLocaleString()} kg/ha`
                        }
                    }
                },
                scales: {
                    ...getChartDefaults().scales,
                    y: {
                        ...getChartDefaults().scales.y,
                        title: { display: true, text: "Yield (kg/ha)", font: { size: 11 } }
                    }
                }
            }
        }
    );
}

function renderRegionChart(data) {
    destroyChart("regionChart");
    const labels = Object.keys(data.region_yield);
    const values = Object.values(data.region_yield);

    chartInstances["regionChart"] = new Chart(
        document.getElementById("regionChart").getContext("2d"),
        {
            type: "doughnut",
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: CHART_COLORS.slice(0, labels.length),
                    borderColor: "#fff",
                    borderWidth: 3,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            font: { family: "'Inter', sans-serif", size: 11 },
                            padding: 12,
                            usePointStyle: true,
                            pointStyleWidth: 10
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: ctx => `${ctx.label}: ${ctx.parsed.toLocaleString()} kg/ha`
                        }
                    }
                }
            }
        }
    );
}

function renderDistributionChart(data) {
    destroyChart("distributionChart");

    if (!data.yield_distribution) return;

    chartInstances["distributionChart"] = new Chart(
        document.getElementById("distributionChart").getContext("2d"),
        {
            type: "bar",
            data: {
                labels: data.yield_distribution.bins,
                datasets: [{
                    label: "Number of Records",
                    data: data.yield_distribution.counts,
                    backgroundColor: "rgba(16, 185, 129, 0.3)",
                    borderColor: "rgba(16, 185, 129, 0.8)",
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                ...getChartDefaults(),
                plugins: {
                    ...getChartDefaults().plugins,
                    legend: { display: false }
                },
                scales: {
                    ...getChartDefaults().scales,
                    x: {
                        ...getChartDefaults().scales.x,
                        title: { display: true, text: "Yield Range (kg/ha)", font: { size: 11 } }
                    },
                    y: {
                        ...getChartDefaults().scales.y,
                        title: { display: true, text: "Count", font: { size: 11 } },
                        beginAtZero: true
                    }
                }
            }
        }
    );
}

function renderIrrigationChart(data) {
    destroyChart("irrigationChart");

    if (!data.irrigation_stats) return;

    const labels = Object.keys(data.irrigation_stats);
    const values = labels.map(k => data.irrigation_stats[k].mean);
    const counts = labels.map(k => data.irrigation_stats[k].count);

    chartInstances["irrigationChart"] = new Chart(
        document.getElementById("irrigationChart").getContext("2d"),
        {
            type: "bar",
            data: {
                labels,
                datasets: [{
                    label: "Avg Yield (kg/ha)",
                    data: values,
                    backgroundColor: [
                        "rgba(59, 130, 246, 0.7)",
                        "rgba(16, 185, 129, 0.7)",
                        "rgba(245, 158, 11, 0.7)"
                    ],
                    borderColor: [
                        "rgba(59, 130, 246, 1)",
                        "rgba(16, 185, 129, 1)",
                        "rgba(245, 158, 11, 1)"
                    ],
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                ...getChartDefaults(),
                indexAxis: "y",
                plugins: {
                    ...getChartDefaults().plugins,
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const idx = ctx.dataIndex;
                                return `Avg: ${ctx.parsed.x.toLocaleString()} kg/ha (${counts[idx]} records)`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ...getChartDefaults().scales.x,
                        title: { display: true, text: "Yield (kg/ha)", font: { size: 11 } }
                    },
                    y: {
                        ...getChartDefaults().scales.y,
                        beginAtZero: false
                    }
                }
            }
        }
    );
}

// -----------------------------------------------
// Prediction Form
// -----------------------------------------------
const form = document.getElementById("farmForm");
const resultPanel = document.getElementById("resultPanel");

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const crop = document.getElementById("crop").value;
    const region = document.getElementById("region").value;
    const moisture = Number(document.getElementById("moisture").value);
    const ph = Number(document.getElementById("ph").value);
    const temperature = Number(document.getElementById("temperature").value);
    const rainfall = Number(document.getElementById("rainfall").value);
    const humidity = Number(document.getElementById("humidity").value);
    const sunlight = Number(document.getElementById("sunlight").value);
    const irrigation = document.getElementById("irrigation").value;

    // Client-side validation
    let validationErrors = [];
    if (!crop) validationErrors.push("Please select a crop type.");
    if (!region) validationErrors.push("Please select a region.");
    if (!irrigation) validationErrors.push("Please select an irrigation type.");
    if (moisture < 0 || moisture > 100) validationErrors.push("Soil moisture must be 0–100%.");
    if (ph < 0 || ph > 14) validationErrors.push("Soil pH must be 0–14.");
    if (temperature < -20 || temperature > 60) validationErrors.push("Temperature must be −20 to 60°C.");
    if (humidity < 0 || humidity > 100) validationErrors.push("Humidity must be 0–100%.");
    if (sunlight < 0 || sunlight > 24) validationErrors.push("Sunlight must be 0–24 hours.");

    if (validationErrors.length > 0) {
        resultPanel.innerHTML = `
            <div class="error-box">
                <div class="error-box-icon">⚠️</div>
                <div>
                    <h4>Validation Error</h4>
                    <p>${validationErrors.join("<br>")}</p>
                </div>
            </div>
        `;
        return;
    }

    // Show loading
    const predictBtn = document.getElementById("predictBtn");
    predictBtn.disabled = true;
    predictBtn.innerHTML = `<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Predicting…`;

    resultPanel.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <div class="loading-text">Running ML model prediction…</div>
        </div>
    `;

    const farmPayload = {
        crop, region,
        soil_moisture: moisture,
        soil_ph: ph,
        temperature, rainfall,
        humidity, sunlight,
        irrigation_type: irrigation
    };

    try {
        // 1. Get ML Prediction
        const predRes = await fetch(`${API_BASE}/api/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(farmPayload)
        });

        const predData = await predRes.json();

        if (!predData.success) throw new Error(predData.error);

        const predictedYield = predData.predicted_yield;
        lastPrediction = { ...farmPayload, predicted_yield: predictedYield };
        lastRiskAssessment = predData.risk_assessment;

        // Show yield with loading for AI insights
        renderResultPanel(predictedYield, farmPayload, predData.risk_assessment, null, true);
        updateRiskSection(predData.risk_assessment);

        // 2. Get AI Insights
        resultPanel.querySelector("#insightsContainer").innerHTML = `
            <div class="loading-spinner">
                <div class="spinner" style="width:24px;height:24px;border-width:2px;"></div>
                <div class="loading-text">Generating AI insights…</div>
            </div>
        `;

        try {
            const insRes = await fetch(`${API_BASE}/api/insights`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...farmPayload, predicted_yield: predictedYield })
            });

            const insData = await insRes.json();

            if (insData.success) {
                lastInsights = insData.insights;
                renderResultPanel(predictedYield, farmPayload, predData.risk_assessment, insData.insights, false);
                updateRecommendationsSection(insData.insights, farmPayload);
            } else {
                document.getElementById("insightsContainer").innerHTML = `
                    <div class="error-box">
                        <div class="error-box-icon">⚠️</div>
                        <div>
                            <h4>AI Insights Unavailable</h4>
                            <p>${insData.error}</p>
                        </div>
                    </div>
                `;
            }
        } catch (insErr) {
            document.getElementById("insightsContainer").innerHTML = `
                <div class="error-box">
                    <div class="error-box-icon">⚠️</div>
                    <div>
                        <h4>AI Insights Unavailable</h4>
                        <p>${insErr.message}. GROQ_API_KEY may not be configured.</p>
                    </div>
                </div>
            `;
        }

        resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });

    } catch (error) {
        resultPanel.innerHTML = `
            <div class="error-box">
                <div class="error-box-icon">❌</div>
                <div>
                    <h4>Prediction Failed</h4>
                    <p>${error.message}</p>
                    <p style="margin-top:8px; font-size:12px; color:var(--slate-400);">
                        Make sure the Flask backend is running on port 5000.
                    </p>
                </div>
            </div>
        `;
    } finally {
        predictBtn.disabled = false;
        predictBtn.innerHTML = `<span>🔬</span> Predict Crop Yield`;
    }
});

function renderResultPanel(yieldValue, farmData, riskData, insights, loadingInsights) {
    const riskLevel = riskData ? riskData.overall_risk : "—";
    const riskClass = riskLevel.toLowerCase();

    let insightsHTML = "";
    if (loadingInsights) {
        insightsHTML = `<div id="insightsContainer">
            <div class="loading-spinner">
                <div class="spinner" style="width:24px;height:24px;border-width:2px;"></div>
                <div class="loading-text">Generating AI insights…</div>
            </div>
        </div>`;
    } else if (insights) {
        insightsHTML = `<div id="insightsContainer">
            <div class="ai-insights-box">
                <h4>🤖 AI Agricultural Insights</h4>
                <div class="ai-insights-content">${formatInsights(insights)}</div>
            </div>
        </div>`;
    } else {
        insightsHTML = `<div id="insightsContainer"></div>`;
    }

    // Build mini risk summary
    let miniRiskHTML = "";
    if (riskData && riskData.risks) {
        const highRisks = riskData.risks.filter(r => r.level === "High");
        const modRisks = riskData.risks.filter(r => r.level === "Moderate");
        miniRiskHTML = `
            <div class="overall-risk-banner ${riskClass}" style="margin-top:16px;">
                <span class="overall-risk-label">Overall Risk: ${riskLevel}</span>
                <span class="risk-badge ${riskClass}">${riskLevel}</span>
            </div>
            ${highRisks.length > 0 ? `<p style="font-size:12px;color:var(--risk-high);margin-bottom:4px;">⚠️ ${highRisks.length} high risk factor(s) detected</p>` : ""}
            ${modRisks.length > 0 ? `<p style="font-size:12px;color:var(--risk-moderate);">⚡ ${modRisks.length} moderate risk factor(s)</p>` : ""}
        `;
    }

    resultPanel.innerHTML = `
        <div class="yield-display">
            <div class="yield-crop-tag">🌾 ${farmData.crop} — ${farmData.region}</div>
            <div class="yield-value">${yieldValue.toLocaleString()}<span class="yield-unit">kg/ha</span></div>
            <div class="yield-label">ML Predicted Yield (Estimate)</div>
        </div>

        <div class="farm-details-summary">
            <h4>📋 Farm Parameters</h4>
            <div class="farm-detail-row"><span class="label">Soil Moisture</span><span class="value">${farmData.soil_moisture}%</span></div>
            <div class="farm-detail-row"><span class="label">Soil pH</span><span class="value">${farmData.soil_ph}</span></div>
            <div class="farm-detail-row"><span class="label">Temperature</span><span class="value">${farmData.temperature}°C</span></div>
            <div class="farm-detail-row"><span class="label">Rainfall</span><span class="value">${farmData.rainfall} mm</span></div>
            <div class="farm-detail-row"><span class="label">Humidity</span><span class="value">${farmData.humidity}%</span></div>
            <div class="farm-detail-row"><span class="label">Sunlight</span><span class="value">${farmData.sunlight} hrs/day</span></div>
            <div class="farm-detail-row"><span class="label">Irrigation</span><span class="value">${farmData.irrigation_type}</span></div>
        </div>

        ${miniRiskHTML}

        ${insightsHTML}

        <div class="disclaimer">
            ⚠️ This prediction is generated by the trained Random Forest ML pipeline. The current model has
            limited predictive accuracy (negative R² in evaluation) and should be used for indicative purposes only.
            AI insights are generated by an external Groq LLM.
        </div>
    `;
}

function formatInsights(text) {
    // Convert markdown-like formatting to HTML
    return text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n\n/g, "<br><br>")
        .replace(/\n- /g, "<br>• ")
        .replace(/\n\d+\.\s/g, (match) => "<br>" + match.trim() + " ")
        .replace(/\n/g, "<br>");
}

// -----------------------------------------------
// Risk Assessment Section
// -----------------------------------------------
function updateRiskSection(riskData) {
    const container = document.getElementById("riskContent");

    if (!riskData || !riskData.risks) {
        container.innerHTML = `
            <div class="recommendations-empty">
                <div class="recommendations-empty-icon">🛡️</div>
                <h3>Risk Assessment Unavailable</h3>
                <p>Could not generate risk assessment.</p>
            </div>
        `;
        return;
    }

    const overall = riskData.overall_risk;
    const overallClass = overall.toLowerCase();

    let risksHTML = riskData.risks.map(r => {
        const levelClass = r.level.toLowerCase();
        return `
            <div class="risk-item">
                <span class="risk-badge ${levelClass}">${r.level}</span>
                <div class="risk-details">
                    <h4>${r.factor}: ${r.value}</h4>
                    <p>${r.message}</p>
                    <p class="recommendation">💡 ${r.recommendation}</p>
                </div>
            </div>
        `;
    }).join("");

    container.innerHTML = `
        <div class="overall-risk-banner ${overallClass}">
            <span class="overall-risk-label">Overall Agricultural Risk Level</span>
            <span class="risk-badge ${overallClass}">${overall}</span>
        </div>
        <div class="risk-grid">${risksHTML}</div>
        <p style="font-size:11px; color:var(--slate-400); margin-top:16px; line-height:1.5;">
            ${riskData.note || "These risk levels are indicative. Local verification is recommended."}
        </p>
    `;
}

// -----------------------------------------------
// Recommendations Section
// -----------------------------------------------
function updateRecommendationsSection(insights, farmData) {
    const container = document.getElementById("recommendationsContent");

    // Parse the AI insights into structured recommendations
    const sections = parseInsightsIntoSections(insights);

    let cardsHTML = "";

    const cardConfigs = [
        { key: "soil", icon: "🌍", title: "Soil Management", cls: "soil", fallback: "Submit a prediction to receive soil management advice based on your specific conditions." },
        { key: "irrigation", icon: "💧", title: "Irrigation Recommendations", cls: "water", fallback: "Submit a prediction to receive irrigation recommendations." },
        { key: "crop", icon: "🌾", title: "Crop Condition Observations", cls: "crop", fallback: "Submit a prediction to receive crop condition insights." },
        { key: "nutrient", icon: "🧪", title: "Nutrient Management", cls: "nutrient", fallback: "Submit a prediction to receive nutrient management suggestions." },
        { key: "action", icon: "📋", title: "Practical Next Steps", cls: "action", fallback: "Submit a prediction to receive practical farming recommendations." }
    ];

    cardConfigs.forEach(cfg => {
        const content = sections[cfg.key] || cfg.fallback;
        cardsHTML += `
            <div class="rec-card ${cfg.cls}">
                <div class="rec-card-icon">${cfg.icon}</div>
                <h4>${cfg.title}</h4>
                <p>${content}</p>
            </div>
        `;
    });

    container.innerHTML = `
        <p style="font-size:13px; color:var(--slate-500); margin-bottom:16px;">
            Recommendations for <strong>${farmData.crop}</strong> in <strong>${farmData.region}</strong>
            based on submitted conditions and AI analysis.
        </p>
        <div class="recommendations-grid">${cardsHTML}</div>
        <div class="disclaimer mt-2">
            ⚠️ These recommendations are generated by an AI model and should be verified with local agricultural
            experts before implementation. They are specific to the supplied data and conditions.
        </div>
    `;
}

function parseInsightsIntoSections(text) {
    const sections = {};
    const lower = text.toLowerCase();

    // Try to extract sections by headers
    const sectionMap = {
        soil: ["soil management", "soil", "soil health"],
        irrigation: ["irrigation", "water management", "irrigation advice"],
        crop: ["key observations", "observations", "crop condition", "crop"],
        nutrient: ["nutrient", "fertilizer", "nutrient management"],
        action: ["practical next steps", "next steps", "recommendations", "practical"]
    };

    // Split by bold headers or numbered sections
    const parts = text.split(/(?=\*\*[^*]+\*\*)|(?=\d+\.\s+\*\*)/);

    parts.forEach(part => {
        const partLower = part.toLowerCase();
        for (const [key, keywords] of Object.entries(sectionMap)) {
            if (keywords.some(kw => partLower.includes(kw))) {
                // Clean up the text
                let clean = part
                    .replace(/\*\*[^*]+\*\*\s*:?\s*/g, "")
                    .replace(/^\d+\.\s*/, "")
                    .replace(/\n- /g, " • ")
                    .replace(/\n\d+\.\s/g, " • ")
                    .replace(/\n/g, " ")
                    .trim();

                if (clean.length > 10) {
                    sections[key] = clean;
                }
            }
        }
    });

    // If parsing didn't produce good results, create a fallback
    if (Object.keys(sections).length === 0) {
        const lines = text.split("\n").filter(l => l.trim().length > 0);
        const chunk = Math.ceil(lines.length / 5);
        const keys = ["crop", "soil", "irrigation", "nutrient", "action"];
        keys.forEach((key, i) => {
            const slice = lines.slice(i * chunk, (i + 1) * chunk).join(" ");
            if (slice.trim()) {
                sections[key] = slice
                    .replace(/\*\*/g, "")
                    .replace(/\n/g, " ")
                    .trim();
            }
        });
    }

    return sections;
}

// -----------------------------------------------
// Reports
// -----------------------------------------------
async function loadReports() {
    try {
        const [dashRes, repRes] = await Promise.all([
            dashboardData ? Promise.resolve({ json: () => dashboardData }) : fetch(`${API_BASE}/api/dashboard`),
            fetch(`${API_BASE}/api/reports`)
        ]);

        const dashData = dashboardData || await dashRes.json();
        const repData = await repRes.json();

        if (!repData.success) throw new Error(repData.error);

        reportsData = repData;

        renderSummaryTable(repData.summary_table);
        renderCropRegionChart(repData.crop_region);
        renderSowingCharts(repData);
        renderCorrelations(repData.correlations);

    } catch (err) {
        console.error("Reports error:", err);
        document.getElementById("summaryTableContainer").innerHTML = `
            <div class="error-box">
                <div class="error-box-icon">❌</div>
                <div>
                    <h4>Failed to load reports</h4>
                    <p>${err.message}. Make sure the Flask backend is running.</p>
                </div>
            </div>
        `;
    }
}

function renderSummaryTable(table) {
    if (!table || table.length === 0) {
        document.getElementById("summaryTableContainer").innerHTML = `
            <p style="padding:20px; color:var(--slate-500);">No summary data available.</p>
        `;
        return;
    }

    let html = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Crop</th>
                    <th>Region</th>
                    <th>Records</th>
                    <th>Avg Yield</th>
                    <th>Min Yield</th>
                    <th>Max Yield</th>
                    <th>Avg Moisture</th>
                    <th>Avg pH</th>
                    <th>Avg Temp</th>
                    <th>Avg Rainfall</th>
                </tr>
            </thead>
            <tbody>
    `;

    table.forEach(row => {
        html += `
            <tr>
                <td><strong>${row.crop}</strong></td>
                <td>${row.region}</td>
                <td>${row.count}</td>
                <td>${row.avg_yield.toLocaleString()} kg/ha</td>
                <td>${row.min_yield.toLocaleString()}</td>
                <td>${row.max_yield.toLocaleString()}</td>
                <td>${row.avg_moisture}%</td>
                <td>${row.avg_ph}</td>
                <td>${row.avg_temp}°C</td>
                <td>${row.avg_rainfall} mm</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    document.getElementById("summaryTableContainer").innerHTML = html;
}

function renderCropRegionChart(cropRegion) {
    destroyChart("cropRegionChart");

    if (!cropRegion) return;

    const crops = Object.keys(cropRegion);
    const allRegions = new Set();
    crops.forEach(crop => {
        Object.keys(cropRegion[crop]).forEach(r => allRegions.add(r));
    });
    const regions = Array.from(allRegions);

    const datasets = crops.map((crop, i) => ({
        label: crop,
        data: regions.map(r => cropRegion[crop][r] ? cropRegion[crop][r].mean : 0),
        backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
        borderColor: CHART_BORDERS[i % CHART_BORDERS.length],
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false
    }));

    chartInstances["cropRegionChart"] = new Chart(
        document.getElementById("cropRegionChart").getContext("2d"),
        {
            type: "bar",
            data: { labels: regions, datasets },
            options: {
                ...getChartDefaults(),
                plugins: {
                    ...getChartDefaults().plugins,
                    tooltip: {
                        callbacks: {
                            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()} kg/ha`
                        }
                    }
                },
                scales: {
                    ...getChartDefaults().scales,
                    y: {
                        ...getChartDefaults().scales.y,
                        title: { display: true, text: "Avg Yield (kg/ha)", font: { size: 11 } }
                    }
                }
            }
        }
    );
}

function renderSowingCharts(data) {
    destroyChart("sowingCountChart");
    destroyChart("sowingYieldChart");

    const sowingMonthly = data.sowing_monthly || {};
    const sowingYield = data.sowing_monthly_yield || {};

    if (Object.keys(sowingMonthly).length === 0) {
        document.getElementById("sowingCountChart").parentElement.innerHTML =
            `<p style="padding:40px; text-align:center; color:var(--slate-400);">No sowing date data available in the dataset.</p>`;
        document.getElementById("sowingYieldChart").parentElement.innerHTML =
            `<p style="padding:40px; text-align:center; color:var(--slate-400);">No sowing yield data available.</p>`;
        return;
    }

    const months = Object.keys(sowingMonthly);
    const counts = Object.values(sowingMonthly);

    chartInstances["sowingCountChart"] = new Chart(
        document.getElementById("sowingCountChart").getContext("2d"),
        {
            type: "line",
            data: {
                labels: months,
                datasets: [{
                    label: "Sowing Count",
                    data: counts,
                    borderColor: "rgba(16, 185, 129, 1)",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: "rgba(16, 185, 129, 1)",
                    pointBorderColor: "#fff",
                    pointBorderWidth: 2,
                    pointRadius: 5
                }]
            },
            options: {
                ...getChartDefaults(),
                plugins: {
                    ...getChartDefaults().plugins,
                    legend: { display: false }
                },
                scales: {
                    ...getChartDefaults().scales,
                    y: {
                        ...getChartDefaults().scales.y,
                        beginAtZero: true,
                        title: { display: true, text: "Count", font: { size: 11 } }
                    }
                }
            }
        }
    );

    const yieldMonths = Object.keys(sowingYield);
    const yieldValues = Object.values(sowingYield);

    chartInstances["sowingYieldChart"] = new Chart(
        document.getElementById("sowingYieldChart").getContext("2d"),
        {
            type: "line",
            data: {
                labels: yieldMonths,
                datasets: [{
                    label: "Avg Yield (kg/ha)",
                    data: yieldValues,
                    borderColor: "rgba(59, 130, 246, 1)",
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: "rgba(59, 130, 246, 1)",
                    pointBorderColor: "#fff",
                    pointBorderWidth: 2,
                    pointRadius: 5
                }]
            },
            options: {
                ...getChartDefaults(),
                plugins: {
                    ...getChartDefaults().plugins,
                    legend: { display: false }
                },
                scales: {
                    ...getChartDefaults().scales,
                    y: {
                        ...getChartDefaults().scales.y,
                        title: { display: true, text: "Yield (kg/ha)", font: { size: 11 } }
                    }
                }
            }
        }
    );
}

function renderCorrelations(correlations) {
    const container = document.getElementById("correlationsContainer");

    if (!correlations || Object.keys(correlations).length === 0) {
        container.innerHTML = `<p style="padding:20px; color:var(--slate-500);">No correlation data available.</p>`;
        return;
    }

    const labels = {
        "soil_moisture_%": "Soil Moisture",
        "soil_pH": "Soil pH",
        "temperature_C": "Temperature",
        "rainfall_mm": "Rainfall",
        "humidity_%": "Humidity",
        "sunlight_hours": "Sunlight"
    };

    let html = `<div class="correlation-grid">`;

    for (const [key, value] of Object.entries(correlations)) {
        if (value === null) continue;

        const label = labels[key] || key;
        const absVal = Math.abs(value);
        let colorClass = "neutral";
        let barColor = "var(--slate-400)";

        if (value > 0.1) { colorClass = "positive"; barColor = "var(--green-500)"; }
        else if (value < -0.1) { colorClass = "negative"; barColor = "var(--risk-high)"; }

        html += `
            <div class="correlation-item">
                <div class="correlation-label">${label}</div>
                <div class="correlation-value ${colorClass}">${value > 0 ? "+" : ""}${value.toFixed(4)}</div>
                <div class="correlation-bar">
                    <div class="correlation-bar-fill" style="width: ${absVal * 100}%; background: ${barColor};"></div>
                </div>
            </div>
        `;
    }

    html += `</div>`;
    container.innerHTML = html;
}

// -----------------------------------------------
// Report Tabs
// -----------------------------------------------
function switchTab(tabId) {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.tab === tabId);
    });
    document.querySelectorAll(".tab-content").forEach(content => {
        content.classList.toggle("active", content.id === tabId);
    });
}

// -----------------------------------------------
// CSV Download
// -----------------------------------------------
function downloadCSV() {
    if (!reportsData || !reportsData.summary_table) {
        alert("Report data is not loaded yet. Please wait for it to load.");
        return;
    }

    const table = reportsData.summary_table;
    const headers = ["Crop", "Region", "Records", "Avg Yield (kg/ha)", "Min Yield", "Max Yield",
        "Avg Moisture (%)", "Avg pH", "Avg Temp (°C)", "Avg Rainfall (mm)"];

    let csv = headers.join(",") + "\n";

    table.forEach(row => {
        csv += [
            row.crop, row.region, row.count,
            row.avg_yield, row.min_yield, row.max_yield,
            row.avg_moisture, row.avg_ph, row.avg_temp, row.avg_rainfall
        ].join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `YieldSense_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

// -----------------------------------------------
// Initialize
// -----------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    loadDashboard();
});