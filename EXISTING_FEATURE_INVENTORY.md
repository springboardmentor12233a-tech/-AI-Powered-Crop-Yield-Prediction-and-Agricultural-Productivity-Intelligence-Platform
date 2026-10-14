# Existing Feature Inventory

1. **Authentication:**
   - User Signup
   - User Login
   - Admin user creation on startup

2. **Yield Prediction:**
   - Input forms for state, crop, soil, weather, fertilizer.
   - Preprocessing using saved `scaler.pkl` and `model_columns.pkl`.
   - Prediction using `champion_agri_model.pkl`.
   - Stores prediction in database.

3. **Agronomic Advisory (Gemini API):**
   - Uses `gemini-3.5-flash-lite` to generate risk assessment, yield benchmarking, soil health remediation, and field actions based on prediction inputs and output.

4. **User & Admin Dashboards:**
   - User views past predictions.
   - User can submit queries.
   - Admin can view all users, delete users, edit users.
   - Admin can reply to queries.
