const form = document.getElementById("farmForm");
const result = document.getElementById("result");

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

    result.innerHTML = `
        <div class="result-icon">🌾</div>
        <h2>Crop Analysis</h2>
        <p class="muted">${crop} | ${region}</p>
        <p>Generating ML Prediction...</p>
        <div class="yield-number">Please wait...</div>
    `;

    try {

        // -------------------------
        // 1. Get ML Prediction
        // -------------------------
        const predictionResponse = await fetch(
            "http://127.0.0.1:5000/api/predict",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    crop: crop,
                    region: region,
                    soil_moisture: moisture,
                    soil_ph: ph,
                    temperature: temperature,
                    rainfall: rainfall,
                    humidity: humidity,
                    sunlight: sunlight,
                    irrigation_type: irrigation
                })
            }
        );

        const predictionData = await predictionResponse.json();

        if (!predictionData.success) {
            throw new Error(predictionData.error);
        }

        const predictedYield = predictionData.predicted_yield;

        // -------------------------
        // 2. Get AI Insights
        // -------------------------
        result.innerHTML = `
            <div class="result-icon">🌾</div>
            <h2>Crop Analysis</h2>
            <p class="muted">${crop} | ${region}</p>
            <p>ML Predicted Yield</p>

            <div class="yield-number">
                ${predictedYield} kg/ha
            </div>

            <div class="placeholder">
                <b>Generating AI Agricultural Insights...</b>
            </div>
        `;

        const insightResponse = await fetch(
            "http://127.0.0.1:5000/api/insights",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    crop: crop,
                    region: region,
                    soil_moisture: moisture,
                    soil_ph: ph,
                    temperature: temperature,
                    rainfall: rainfall,
                    humidity: humidity,
                    sunlight: sunlight,
                    irrigation_type: irrigation,
                    predicted_yield: predictedYield
                })
            }
        );

        const insightData = await insightResponse.json();

        let insightsHTML = "";

        if (insightData.success) {
            insightsHTML = `
                <div class="placeholder">
                    <b>🤖 AI Agricultural Insights</b>
                    <br><br>
                    ${insightData.insights.replace(/\n/g, "<br>")}
                </div>
            `;
        } else {
            insightsHTML = `
                <div class="placeholder">
                    <b>AI Insights Error</b>
                    <br><br>
                    ${insightData.error}
                </div>
            `;
        }

        // -------------------------
        // 3. Final Result
        // -------------------------
        result.innerHTML = `
            <div class="result-icon">🌾</div>

            <h2>Crop Analysis</h2>

            <p class="muted">
                ${crop} | ${region}
            </p>

            <p>ML Predicted Yield</p>

            <div class="yield-number">
                ${predictedYield} kg/ha
            </div>

            <div class="placeholder">

                <b>Farm Details</b>

                <br><br>

                Soil Moisture: ${moisture}%<br>
                Soil pH: ${ph}<br>
                Temperature: ${temperature} °C<br>
                Rainfall: ${rainfall} mm<br>
                Humidity: ${humidity}%<br>
                Sunlight: ${sunlight} hours/day<br>
                Irrigation: ${irrigation}

            </div>

            ${insightsHTML}

            <p class="disclaimer">
                Prediction generated using the trained Random Forest ML pipeline.
                Agricultural insights are generated using the external Groq LLM.
            </p>
        `;

        result.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    } catch (error) {

        result.innerHTML = `
            <div class="placeholder">
                <b>❌ Error</b>
                <br><br>
                ${error.message}
                <br><br>
                Make sure the Flask backend is running on port 5000.
            </div>
        `;
    }
});