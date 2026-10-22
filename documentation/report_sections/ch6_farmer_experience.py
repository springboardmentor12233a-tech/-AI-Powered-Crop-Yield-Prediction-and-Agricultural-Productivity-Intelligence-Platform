# -*- coding: utf-8 -*-
"""
AgriYield AI Report Generator - Chapter 6: Farmer Experience & Screen Walkthrough
Contains Figures 1 to 17 with exhaustive visual, backend, and agronomic explanations.
"""

from docx.shared import Inches, Pt
from .common import (
    add_p, add_heading_1, add_heading_2, add_heading_3,
    add_bullet, add_callout, add_table, add_image_with_caption,
    COLOR_PRIMARY, COLOR_SECONDARY, COLOR_ACCENT
)


def write_chapter_6(doc):
    add_heading_1(doc, "6. Farmer Experience & Screen Walkthrough")

    add_p(doc,
          "The Farmer user journey in AgriYield AI has been engineered to provide an intuitive, friction-free experience tailored for agricultural practitioners. From the public portal to role-aware authentication, personalized dashboards, machine-learning yield forecasting, soil nutrient balancing, and specialized farming utilities, each interface is illustrated and analyzed in detail below.",
          size=10.5)

    # ----------------------------------------------------
    # FIGURE 1: MAIN LANDING PAGE
    # ----------------------------------------------------
    add_heading_2(doc, "6.1 Public Landing Page & Unified Agricultural Portal")
    add_image_with_caption(
        doc,
        image_filename="main_page.png",
        figure_number=1,
        title="Public Landing Page & Unified Agricultural Intelligence Portal",
        desc_paragraphs=[
            ("Interface Architecture & Visual Elements: ",
             "The landing page serves as the digital front door to AgriYield AI, presenting a modern, responsive layout designed with Tailwind CSS and glassmorphism styling. The hero section prominently displays the platform's core identity: 'AgriYield AI — AI-Powered Crop Yield Prediction & Decision Support System.' The top navigation header provides persistent access to core public routes, including Home, Features, About, Sign In, and Register. Key value proposition cards showcase the platform's four pillars: Machine Learning Yield Prediction, Agro-Meteorological Weather Insights, Soil Health & Nutrient Analysis, and Intelligent Farming Recommendations. High-contrast call-to-action buttons ('Launch Farmer Platform' and 'Create Free Account') guide users smoothly into authenticated workflows."),
            ("Backend Processing & Microservices Flow: ",
             "The landing page operates as a client-side rendered Single-Page Application (SPA) compiled via Vite. Upon initial mount, the React application checks local storage for active JSON Web Tokens (JWT). If a valid token exists, the user is automatically redirected to `/dashboard` (Farmer) or `/admin` (Administrator) via the `AuthContext` provider. Public informational sections fetch platform statistics and service status asynchronously from the FastAPI root status endpoint, ensuring real-time operational indicators without requiring prior authentication."),
            ("Agronomic Value & Practical Decision Support: ",
             "Agricultural software often suffers from poor adoption due to overly complex, academic user interfaces. AgriYield AI eliminates this friction by communicating direct, tangible benefits immediately upon first arrival. Farmers quickly recognize how the system can assist them with crop planning, weather risk hedging, and soil management, fostering trust and encouraging onboarding.")
        ]
    )

    # ----------------------------------------------------
    # FIGURE 2: SIGN-IN SCREEN
    # ----------------------------------------------------
    add_heading_2(doc, "6.2 Role-Aware Authentication & Sign-In Interface")
    add_image_with_caption(
        doc,
        image_filename="signin_farmer_admin.png",
        figure_number=2,
        title="Role-Aware Sign-In Interface for Farmers and Administrators",
        desc_paragraphs=[
            ("Interface Architecture & Visual Elements: ",
             "Figure 2 illustrates the secure authentication modal. The sign-in card features a distinct role selector toggle enabling users to sign in either as a 'Farmer' or an 'Administrator.' Input fields for Email Address and Password include real-time focus states, floating labels, password visibility toggle icons, and client-side format validation. Clear helper links for 'Forgot Password?' and 'Create an Account' provide seamless navigation paths. Prominent visual badges clarify current login context, preventing accidental cross-role authentication attempts."),
            ("Backend Processing & Microservices Flow: ",
             "Submitting credentials triggers an HTTP POST request to `/api/auth/login`. The FastAPI backend parses the payload into a Pydantic `UserLogin` model, retrieves the corresponding user record from the persistent user store, and performs password verification using `bcrypt.checkpw()`. The backend tracks failed login attempts; five consecutive failures within 15 minutes trigger an automated temporary lockout policy. Upon successful verification, the backend generates an HMAC-SHA256 signed JWT bearer token embedding the user's ID, email, role, and expiration timestamp, which is returned in the response headers and stored securely in client memory."),
            ("Agronomic Value & Practical Decision Support: ",
             "Secure authentication ensures that individual farmers' historical farm data, crop records, and localized predictions remain strictly confidential and protected from unauthorized access. The seamless role differentiation guarantees that farmers immediately access their customized agricultural tools, while administrators are directed to governance controls.")
        ]
    )

    # ----------------------------------------------------
    # FIGURE 3: REGISTRATION SCREEN
    # ----------------------------------------------------
    add_heading_2(doc, "6.3 User Registration & Account Creation System")
    add_image_with_caption(
        doc,
        image_filename="Register_farmer_admin.png",
        figure_number=3,
        title="User Registration Screen with Role Selection and Password Policy",
        desc_paragraphs=[
            ("Interface Architecture & Visual Elements: ",
             "Figure 3 displays the registration form. Prospective users can register as a Farmer or an Administrator. The form collects essential identification data, including Full Name, Email Address, Password, and Confirm Password. A dynamic password strength meter provides immediate visual feedback, checking for minimum length (8 characters), uppercase letters, numbers, and special symbols. Clear validation indicators ensure that users resolve formatting errors before submitting."),
            ("Backend Processing & Microservices Flow: ",
             "Upon submission, an HTTP POST request is dispatched to `/api/auth/register`. The payload is validated against the `UserRegister` schema. The backend verifies that the email is not already registered, enforces a minimum 8-character password constraint, hashes the password using Bcrypt with a cryptographic salt, and initializes the user profile with default status 'Active'. An initial audit record is generated in the administrative audit log, and an immediate JWT token is returned, allowing instant automatic login without cumbersome email confirmation friction during project evaluation."),
            ("Agronomic Value & Practical Decision Support: ",
             "By streamlining the registration process while enforcing strict password security, AgriYield AI ensures low drop-off rates for rural farmers while protecting the integrity of the platform's multi-user dataset.")
        ]
    )

    # ----------------------------------------------------
    # FIGURE 4: FARMER DASHBOARD
    # ----------------------------------------------------
    add_heading_2(doc, "6.4 Farmer Operational Command Center & Overview")
    add_image_with_caption(
        doc,
        image_filename="farmer_dashboard.png",
        figure_number=4,
        title="Farmer Operational Dashboard with Weather Widgets and Action Hub",
        desc_paragraphs=[
            ("Interface Architecture & Visual Elements: ",
             "The Farmer Dashboard serves as the central operational cockpit. The upper section features a personalized greeting ('Welcome, Farmer!') alongside a live meteorological summary card displaying current temperature (32°C), humidity (68%), wind speed (14 km/h), and precipitation forecast. Below the header, four high-impact metric cards summarize: Total Predictions Generated, Average Forecasted Yield (Kg/ha), Active Farm Area (Hectares), and Primary Monitored Crop. A central 'Quick Actions' grid provides direct one-click routing to the Yield Predictor, Soil Health Analyzer, Multi-Crop Comparator, and AI Agronomist."),
            ("Backend Processing & Microservices Flow: ",
             "When the dashboard mounts, the React application issues parallel HTTP GET requests to `/api/auth/me`, `/api/predictions/history`, and the weather aggregation service. The FastAPI backend extracts the user's identity from the JWT Bearer token, queries the prediction store for records associated with the user's UUID, computes aggregate statistics (total count, mean yield), and returns structured JSON in under 50 milliseconds. Real-time broadcast announcements published by administrators are simultaneously fetched from `/api/admin/announcements` and rendered as non-intrusive banner alerts."),
            ("Agronomic Value & Practical Decision Support: ",
             "The dashboard consolidates all critical operational parameters into a single screen, eliminating navigation fatigue. A farmer can inspect seasonal weather risks, review past yield projections, and initiate a new crop planning session in seconds, establishing a routine data-driven farming habit.")
        ]
    )

    # ----------------------------------------------------
    # FIGURE 5: MULTILINGUAL LOCALIZATION
    # ----------------------------------------------------
    add_heading_2(doc, "6.5 Multilingual Localization & Regional Accessibility")
    add_image_with_caption(
        doc,
        image_filename="lanuages.png",
        figure_number=5,
        title="Multilingual Localization Dropdown Supporting Indian Regional Languages",
        desc_paragraphs=[
            ("Interface Architecture & Visual Elements: ",
             "Figure 5 highlights the platform's multilingual localization capabilities. The language selection dropdown is permanently accessible from the primary navigation bar. It supports English alongside major Indian regional languages including Hindi (हिन्दी), Telugu (తెలుగు), Tamil (தமிழ்), Kannada (ಕನ್ನಡ), Marathi (मराठी), Punjabi (ਪੰਜਾਬੀ), Bengali (বাংলা), and Gujarati (ગુજરાતી). Selecting a language instantly translates all UI text, input labels, tooltips, buttons, diagnostic advisories, and output metrics across the entire application without requiring a page refresh."),
            ("Backend Processing & Microservices Flow: ",
             "Localization is managed through a comprehensive frontend dictionary and internationalization (i18n) state management system. Translation mappings are stored in JSON locale files, structured hierarchically by module and component key. When the user switches languages, the selected language code is stored in browser `localStorage`, and the React component tree reactively re-renders translated strings. Furthermore, when requests are sent to the AI advisory service, the user's chosen language is transmitted in the payload, instructing Google Gemini and Groq to synthesize agronomic recommendations natively in the farmer's regional language."),
            ("Agronomic Value & Practical Decision Support: ",
             "Language is the single greatest barrier preventing rural Indian farmers from adopting modern digital agricultural tools. By presenting complex agronomic forecasts, chemical dosages, and pest remedies in their native tongue, AgriYield AI democratizes data science, ensuring that even non-English-literate farmers can confidently interpret and implement precision farming guidance.")
        ]
    )

    # ----------------------------------------------------
    # FIGURE 6: YIELD PREDICTOR INPUTS
    # ----------------------------------------------------
    add_heading_2(doc, "6.6 Machine Learning Yield Predictor: Input Interface")
    add_image_with_caption(
        doc,
        image_filename="yield_predictor_1.png",
        figure_number=6,
        title="Yield Predictor Input Workspace with Crop Parameters and AI Mode Toggle",
        desc_paragraphs=[
            ("Interface Architecture & Visual Elements: ",
             "Figure 6 showcases the primary Machine Learning Yield Predictor interface. The form is structured into three clean input sections: Location Information (Cascading dropdowns for Indian State and District), Farm & Crop Configuration (Target Harvest Year, Crop Variety, and Cultivated Area in Hectares), and Historical Production Context (Previous Year Yield in Kg/ha, Previous Year Area, and Previous Year Total Production). At the top of the form, an 'AI Advisory Provider' selector lets farmers choose between Google Gemini 1.5 Flash, Groq Cloud (LLaMA 3.3), and 'Instant ML Mode' (offline deterministic local inference)."),
            ("Backend Processing & Microservices Flow: ",
             "The dropdown options are populated dynamically from the backend reference routes: `/api/states`, `/api/districts/{state}`, `/api/crops`, and `/api/years`. When a farmer selects a state (e.g., Andhra Pradesh), an asynchronous request retrieves the exact districts available in the ICRISAT dataset for that state. Cascading state management prevents invalid geographic combinations. Form submission triggers an HTTP POST request to `/api/predict` with a typed `PredictionRequest` payload validated by Pydantic."),
            ("Agronomic Value & Practical Decision Support: ",
             "By incorporating previous-season yield and area as explicit input features, the model accounts for soil exhaustion, historical microclimate trends, and farmer management capacity. This produces far more accurate, customized yield forecasts than naive models relying solely on regional averages.")
        ]
    )

    # ----------------------------------------------------
    # FIGURE 7: YIELD PREDICTOR RESULTS & ADVISORY
    # ----------------------------------------------------
    add_heading_2(doc, "6.7 Yield Prediction Results & Agronomic Advisory")
    add_image_with_caption(
        doc,
        image_filename="yield_predictor_2.png",
        figure_number=7,
        title="Prediction Results Card with Projected Yield, Total Harvest, and AI Advisory",
        desc_paragraphs=[
            ("Interface Architecture & Visual Elements: ",
             "Figure 7 displays the comprehensive output card generated upon inference completion. The upper section features a large, color-coded metric displaying the Projected Yield in kilograms per hectare (e.g., 2,845.50 Kg/ha) alongside Estimated Total Production (e.g., 14.23 Metric Tonnes for a 5.0-hectare plot). A visual confidence meter illustrates the expected yield range. Below the metrics, an expandable 'Agronomic Advisory' panel delivers four categorized recommendation sections: Soil & Fertilizer Management, Irrigation Scheduling, Pest & Disease Monitoring, and Optimal Harvesting Window. Action buttons allow farmers to 'Download PDF Report', 'Save to History', or 'Compare Crops'."),
            ("Backend Processing & Microservices Flow: ",
             "The FastAPI prediction pipeline executes the XGBoost regressor pipeline (`agri_yield_xgboost.joblib`) to compute the base yield. Total production is mathematically computed as `Yield * Area / 1000`. If an external AI provider was selected, the advisory text is generated via asynchronous API calls to Gemini or Groq within an 8-second bounded timeout; if the remote service times out or Instant ML mode was chosen, the built-in deterministic rule engine creates the advisory instantly. The complete prediction event is recorded in `data/predictions.json`."),
            ("Agronomic Value & Practical Decision Support: ",
             "A raw numerical yield prediction alone is of limited utility to a farmer. By pairing the machine-learning forecast with concrete, actionable agronomic guidelines, AgriYield AI empowers farmers to take proactive corrective measures—such as adjusting irrigation intervals or applying top-dress fertilizer—to achieve or exceed the projected harvest.")
        ]
    )

    # ----------------------------------------------------
    # FIGURE 8: SOIL NPK NUTRIENT ADVISORY
    # ----------------------------------------------------
    add_heading_2(doc, "6.8 Soil NPK Nutrient Assessment & Fertilizer Guidance")
    add_image_with_caption(
        doc,
        image_filename="soil_npk.png",
        figure_number=8,
        title="Soil NPK Nutrient Balance Analyzer and Crop-Specific Fertilizer Calculator",
        desc_paragraphs=[
            ("Interface Architecture & Visual Elements: ",
             "Figure 8 illustrates the Soil NPK Nutrient Balance Analyzer. The interface allows farmers to input their soil test results: Nitrogen (N in kg/ha), Phosphorus (P in kg/ha), Potassium (K in kg/ha), and Soil pH level, alongside their target crop. The system visualizes the nutrient status using interactive horizontal gauge bars categorized into 'Deficient' (Red), 'Optimal' (Green), and 'Excess' (Amber). Below the gauges, a tailored Fertilizer Recommendation table specifies exact commercial fertilizer dosages (Urea, Diammonium Phosphate [DAP], Muriate of Potash [MOP]) alongside organic compost quantities."),
            ("Backend Processing & Microservices Flow: ",
             "The NPK calculation module compares the farmer's soil test values against scientific crop-specific nutrient requirement benchmarks established by the Indian Council of Agricultural Research (ICAR). The backend algorithm calculates the exact nutrient deficit: `Deficit = Target_Requirement - Available_Soil_Nutrient`. It then converts the elemental N-P-K deficits into commercial fertilizer quantities based on commercial grade percentages (Urea = 46% N, DAP = 18% N & 46% P₂O₅, MOP = 60% K₂O) and generates a structured dosage schedule split into basal, vegetative, and flowering stages."),
            ("Agronomic Value & Practical Decision Support: ",
             "Over-application of urea is one of the most widespread and damaging practices in Indian agriculture, leading to soil salinity, groundwater contamination, and wasted expenditure. This tool enables precision fertilization, reducing chemical input costs by up to 25% while restoring soil vitality and preventing nutrient lockout.")
        ]
    )

    # ----------------------------------------------------
    # FIGURE 9: SOIL HEALTH ANALYSIS
    # ----------------------------------------------------
    add_heading_2(doc, "6.9 Comprehensive Soil Health & Characteristic Analysis")
    add_image_with_caption(
        doc,
        image_filename="soil_analysis.png",
        figure_number=9,
        title="Soil Health Evaluation Card Featuring Soil Type, Moisture, and Deficiencies",
        desc_paragraphs=[
            ("Interface Architecture & Visual Elements: ",
             "Figure 9 depicts the Soil Health Diagnostic tool. Farmers specify their land's soil classification (Alluvial, Black / Regur, Red & Yellow, Laterite, or Sandy Arid) and observable soil traits (drainage rate, compaction level, organic carbon content). The interface generates a comprehensive Soil Health Report card featuring an overall Fertility Index score (0 to 100), Moisture Retention Rating, Organic Matter Status, and highlighted micro-nutrient deficiency warnings (Zinc, Boron, Sulfur, Iron)."),
            ("Backend Processing & Microservices Flow: ",
             "The analysis algorithm utilizes an agronomic decision matrix mapping soil physical properties and texture against regional agro-climatic zones. The backend computes soil organic carbon (SOC) saturation and cation exchange capacity (CEC) approximations to determine structural soil health. If soil pH is outside the optimal 6.0–7.5 window, the system recommends specific soil conditioning amendments (agricultural lime for acidic soils, gypsum for alkaline/sodic soils)."),
            ("Agronomic Value & Practical Decision Support: ",
             "Understanding soil texture and micro-nutrient status is critical for preventing chronic crop deficiencies. For example, zinc deficiency in rice causes 'Khaira disease', resulting in stunted growth. By diagnosing these deficiencies prior to sowing, farmers can incorporate zinc sulfate during field preparation, safeguarding crop health from day one.")
        ]
    )

    # ----------------------------------------------------
    # FIGURE 10: MULTI-CROP COMPARATOR
    # ----------------------------------------------------
    add_heading_2(doc, "6.10 Multi-Crop Comparative Analysis & Economic Planning")
    add_image_with_caption(
        doc,
        image_filename="multi_crop.png",
        figure_number=10,
        title="Multi-Crop Comparative Matrix Comparing Yield, Revenue, and Water Demand",
        desc_paragraphs=[
            ("Interface Architecture & Visual Elements: ",
             "Figure 10 displays the Multi-Crop Comparative Planner. Farmers can select two, three, or four alternative crops (e.g., Rice vs. Maize vs. Groundnut) for identical plot parameters (District, Season, Land Area). The interface generates a side-by-side comparative matrix presenting: Predicted Yield (Kg/ha), Estimated Harvest Volume (Metric Tonnes), Current Minimum Support Price / Market Rate (₹/Quintal), Projected Gross Revenue (₹), Total Cultivation Cost (₹), Estimated Net Profit (₹), Water Requirement Index (Liters/Kg), and Climate Risk Vulnerability rating."),
            ("Backend Processing & Microservices Flow: ",
             "The comparator component triggers parallel batch inference calls across the selected crops. The XGBoost model evaluates the feature vector for each crop under the specified district conditions. The backend combines the predicted yield outputs with government Minimum Support Price (MSP) datasets and crop-budget benchmarks to calculate revenue and profitability projections. A normalized multi-criteria scoring algorithm ranks the crops based on the farmer's chosen priority (Maximum Profit, Minimum Water Usage, or Lowest Weather Risk)."),
            ("Agronomic Value & Practical Decision Support: ",
             "Crop diversification is essential for climate resilience and income stability. Traditional monoculture often traps farmers in water-intensive crops (such as paddy) during drought-prone seasons. This tool gives farmers clear economic and water-use comparisons, enabling them to transition to high-value, climate-smart alternatives like maize or pulses with confidence.")
        ]
    )

    # ----------------------------------------------------
    # FIGURE 11: FARMER PREDICTION LOGS
    # ----------------------------------------------------
    add_heading_2(doc, "6.11 Historical Prediction Telemetry & Farmer Activity Records")
    add_image_with_caption(
        doc,
        image_filename="farmer_logs.png",
        figure_number=11,
        title="Farmer Historical Records Log with Search, Filter, and Export Options",
        desc_paragraphs=[
            ("Interface Architecture & Visual Elements: ",
             "Figure 11 displays the Farmer Historical Prediction Log. The screen provides a complete chronological ledger of every yield forecast generated by the farmer. Each row in the table details: Timestamp, Target Crop, State & District, Cultivation Area (ha), Predicted Yield (Kg/ha), Total Harvest (MT), AI Advisory Mode used, and an 'Action' column with buttons to view the full advisory modal, delete the record, or re-run the forecast with updated parameters. A search bar and crop/year filter dropdowns facilitate rapid log navigation."),
            ("Backend Processing & Microservices Flow: ",
             "The log interface queries `GET /api/predictions/history`. The backend inspects the authenticated farmer's JWT token, filters the global prediction store (`data/predictions.json`) for matching `user_id` records, sorts them in descending chronological order, and returns paginated records. Farmers can also click 'Export CSV' to download their entire personal prediction history as a structured spreadsheet."),
            ("Agronomic Value & Practical Decision Support: ",
             "Maintaining longitudinal records allows farmers to track seasonal progress, evaluate the accuracy of previous forecasts against actual harvested yields, and build a verifiable farm-performance portfolio useful for securing agricultural credit, crop insurance, or government subsidies.")
        ]
    )

    # ----------------------------------------------------
    # FIGURE 12: AI ASSISTANT CHATBOT
    # ----------------------------------------------------
    add_heading_2(doc, "6.12 AI Agronomist Interactive Chat & Contextual Assistant")
    add_image_with_caption(
        doc,
        image_filename="ai_assistant.png",
        figure_number=12,
        title="AI Agronomist Interactive Conversational Interface Powered by LLMs",
        desc_paragraphs=[
            ("Interface Architecture & Visual Elements: ",
             "Figure 12 illustrates the AI Agronomist Chatbot, an interactive conversational assistant. The interface resembles a modern messaging portal with clear speech bubbles distinguishing user inquiries from AI agronomist responses. A row of quick-prompt chips ('How to treat leaf spot in cotton?', 'Best fertilizer schedule for sugarcane?', 'Government subsidies for drip irrigation?') enables fast one-click inquiries. The text input box supports natural language questions in English and regional languages, complete with character counter and send controls."),
            ("Backend Processing & Microservices Flow: ",
             "User messages are sent via HTTP POST to `/api/assistant/chat`. The backend constructs an agronomic prompt template that injects system instructions: 'You are AgriYield AI, an expert agricultural scientist specializing in Indian farming practices, integrated pest management, and soil science.' The prompt is dispatched to Google Gemini 1.5 Flash (or Groq LLaMA 3.3). If the remote LLM API fails or exceeds timeout limits, an intelligent local rule-based agricultural knowledge base resolves common agronomic queries, ensuring uninterrupted chat availability."),
            ("Agronomic Value & Practical Decision Support: ",
             "Farming challenges often arise unpredictably in the middle of a cropping cycle—sudden insect infestations, yellowing leaves, or unexpected frost. Having an on-demand AI agronomist available 24/7 provides instant, scientific advice, preventing crop failure when human extension officers are unavailable.")
        ]
    )

    # ----------------------------------------------------
    # FIGURE 13: FARMER UTILITY TOOLS HUB
    # ----------------------------------------------------
    add_heading_2(doc, "6.13 Farmer Utility Suite & Specialized Agronomic Tools Hub")
    add_image_with_caption(
        doc,
        image_filename="farmer_tools.png",
        figure_number=13,
        title="Farmer Utility Suite Hub Providing Access to Specialized Calculators and Tools",
        desc_paragraphs=[
            ("Interface Architecture & Visual Elements: ",
             "Figure 13 showcases the Farmer Utility Suite Hub, a centralized landing area that aggregates five specialized agricultural decision-support calculators into an attractive visual grid. Each tool card features a custom thematic icon, a concise summary of its functional capability, estimated calculation time, and a 'Launch Tool' button. The tools displayed are: Weather Analysis & Climate Trends, Multi-Season Crop Rotation Planner, Precision Seed Quantity Calculator, Soil Health Diagnostic Card, and Symptom-Based Pest & Disease Diagnosis."),
            ("Backend Processing & Microservices Flow: ",
             "The utility hub is organized as a modular React router container. Each tool operates as an independent sub-component, maintaining its own local state while sharing global farm profile data (e.g., active state, district, and land area) via React Context. This architecture allows farmers to seamlessly transition between tools without re-entering repetitive baseline farm parameters."),
            ("Agronomic Value & Practical Decision Support: ",
             "Rather than forcing farmers to search across disconnected web tools or manual calculation tables, the utility suite consolidates all critical pre-sowing and in-season operational calculators into a single, cohesive workflow, significantly enhancing operational farm efficiency.")
        ]
    )

    # ----------------------------------------------------
    # FIGURE 14: WEATHER ANALYSIS
    # ----------------------------------------------------
    add_heading_2(doc, "6.14 Agro-Meteorological Weather Monitoring & Microclimate Analysis")
    add_image_with_caption(
        doc,
        image_filename="weather_analysis.png",
        figure_number=14,
        title="Agro-Meteorological Weather Monitoring Interface with 7-Day Forecast Trends",
        desc_paragraphs=[
            ("Interface Architecture & Visual Elements: ",
             "Figure 14 displays the Weather Analysis and Microclimate Monitoring module. The screen presents a 7-day weather forecast tailored to the farmer's selected district. Key meteorological parameters tracked include: Daily Maximum/Minimum Temperatures, Expected Rainfall Volume (mm), Probability of Precipitation (%), Relative Humidity (%), Wind Speed & Direction, and UV Index. Graphical line charts display temperature and rainfall trends over the upcoming week, accompanied by clear color-coded agricultural alert badges ('Favorable Sowing Window', 'High Humidity: Fungal Risk', 'Heavy Rain: Delay Spraying')."),
            ("Backend Processing & Microservices Flow: ",
             "The weather service interfaces with open meteorological data providers, querying district-level forecasts cached in memory with a 1-hour Time-to-Live (TTL) to avoid API rate limits. The backend evaluates raw meteorological parameters against agronomic rule thresholds (e.g., humidity > 80% combined with temperatures between 22–28°C triggers fungal infection warnings). These derived agro-weather advisories are appended to the response payload."),
            ("Agronomic Value & Practical Decision Support: ",
             "Applying expensive pesticides immediately before heavy rainfall results in chemical runoff, financial loss, and environmental contamination. By providing accurate 7-day rainfall and humidity forecasts paired with practical spraying advice, this tool helps farmers optimize chemical application timing and protect their crop investments.")
        ]
    )

    # ----------------------------------------------------
    # FIGURE 15: CROP ROTATION PLANNER
    # ----------------------------------------------------
    add_heading_2(doc, "6.15 Multi-Season Crop Rotation & Soil Replenishment Planner")
    add_image_with_caption(
        doc,
        image_filename="crop_rotation.png",
        figure_number=15,
        title="Crop Rotation Planner Designing 3-Season Legume-Cereal Succession Cycles",
        desc_paragraphs=[
            ("Interface Architecture & Visual Elements: ",
             "Figure 15 illustrates the Crop Rotation Planning tool. The interface guides the farmer through a three-season crop succession matrix: Kharif (Monsoon), Rabi (Winter), and Zaid (Summer). The farmer selects their primary crop, and the system automatically generates recommended succession sequences. Each proposed rotation sequence is evaluated across four visual indicators: Soil Nitrogen Replenishment (+N Score), Pest Cycle Disruption Rating, Weed Suppression Index, and Projected Soil Health Improvement."),
            ("Backend Processing & Microservices Flow: ",
             "The crop rotation algorithm is built on scientific agro-ecological succession principles: deep-rooted crops are alternated with shallow-rooted crops to utilize soil nutrients at varying depths; heavy nitrogen feeders (such as Maize or Cotton) are followed by leguminous nitrogen-fixing crops (such as Chickpea, Pigeonpea, or Groundnut); and botanical families are systematically rotated to interrupt pest and pathogen life cycles."),
            ("Agronomic Value & Practical Decision Support: ",
             "Continuous monocropping rapidly exhausts specific soil nutrients and fosters persistent weed and pest colonies. By adopting the scientific crop rotation plans recommended by this module, farmers can naturally replenish soil nitrogen, break pest cycles without heavy chemicals, and sustain long-term soil productivity.")
        ]
    )

    # ----------------------------------------------------
    # FIGURE 16: SEED QUANTITY CALCULATOR
    # ----------------------------------------------------
    add_heading_2(doc, "6.16 Precision Seed Quantity & Sowing Density Calculator")
    add_image_with_caption(
        doc,
        image_filename="seed_quantity_calcultor.png",
        figure_number=16,
        title="Precision Seed Quantity Calculator Based on Spacing and Germination Rates",
        desc_paragraphs=[
            ("Interface Architecture & Visual Elements: ",
             "Figure 16 depicts the Precision Seed Quantity Calculator. The input form captures: Selected Crop Variety, Field Area (in Acres or Hectares), Sowing Method (Broadcasting, Line Sowing, Dibbling, or System of Rice Intensification [SRI]), Row-to-Row Spacing (cm), Plant-to-Plant Spacing (cm), Certified Seed Germination Rate (%), and Seed Purity Rate (%). The tool instantly outputs: Total Seed Required (in Kilograms), Target Plant Population per Acre, Recommended Number of Seeds per Hill, and Estimated Seed Cost based on current market seed prices."),
            ("Backend Processing & Microservices Flow: ",
             "The calculator executes precision agronomic seed rate formulas: `Plant_Population = (Area_m2 * 10,000) / (Row_Spacing_cm * Plant_Spacing_cm)`. The required seed weight is computed as: `Seed_Weight_Kg = (Plant_Population * 1000_Grain_Weight_g) / (Germination_% * Purity_% * 1000)`. A safety buffer of 5–10% is factored in to account for early field emergence mortality."),
            ("Agronomic Value & Practical Decision Support: ",
             "Improper sowing density severely depresses crop yields. Sowing too densely causes intense inter-plant competition for sunlight and nutrients, resulting in weak, lodging-prone stems; sowing too sparsely leaves open canopy space for aggressive weed competition. This tool ensures optimal plant population density while preventing wasteful over-purchasing of expensive certified hybrid seeds.")
        ]
    )

    # ----------------------------------------------------
    # FIGURE 17: PEST & DISEASE DIAGNOSIS
    # ----------------------------------------------------
    add_heading_2(doc, "6.17 Integrated Pest & Disease Diagnostic Decision System")
    add_image_with_caption(
        doc,
        image_filename="pest_disease_diagonsis.png",
        figure_number=17,
        title="Integrated Pest and Disease Diagnostic System with Symptom Checklist and Remedies",
        desc_paragraphs=[
            ("Interface Architecture & Visual Elements: ",
             "Figure 17 presents the Pest & Disease Diagnostic System. Farmers select their affected crop and specify visible crop symptoms across key plant anatomy: Leaf Symptoms (yellowing, curling, holes, powdery spots, mosaic pattern), Stem Symptoms (wilting, lesions, hollow stems), Root Symptoms (galls, root rot), and Fruit/Pod Damage. The system dynamically matches the symptoms against an agricultural pathology knowledge base, presenting the Most Probable Diagnosis, Pathogen Classification (Fungal, Bacterial, Viral, or Insect Pest), Severity Level, and a dual Integrated Pest Management (IPM) treatment plan featuring Organic/Biological Remedies alongside Chemical Controls."),
            ("Backend Processing & Microservices Flow: ",
             "The diagnostic engine utilizes a weighted rule-based expert decision system combined with botanical disease taxonomies. Each selected symptom increments match scores across known regional crop diseases. Diseases exceeding an 80% confidence threshold are returned alongside recommended curative measures: biological controls (e.g., Neem oil spray, Trichoderma viride application) and specific chemical bactericides or fungicides (e.g., Mancozeb, Copper Oxychloride) including precise water-dilution ratios."),
            ("Agronomic Value & Practical Decision Support: ",
             "Misdiagnosing a crop disease leads to ineffective chemical spraying, wasted capital, and unchecked crop destruction. By providing a structured, symptom-based diagnostic checklist, this module helps farmers accurately identify pathogens early and apply targeted, environmentally sound treatments before economic threshold limits are exceeded.")
        ]
    )

    doc.add_page_break()
