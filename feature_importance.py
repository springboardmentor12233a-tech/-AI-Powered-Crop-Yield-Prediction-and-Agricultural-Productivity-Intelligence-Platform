import pandas as pd
import joblib

# Load trained pipeline
model = joblib.load("models/best_xgboost_model.pkl")

# Get preprocessing and trained model
preprocessor = model.named_steps["preprocessor"]
xgb_model = model.named_steps["model"]

# Get feature names after preprocessing
feature_names = preprocessor.get_feature_names_out()

# Get XGBoost feature importance
importance = xgb_model.feature_importances_

# Create feature importance table
importance_df = pd.DataFrame({
    "Feature": feature_names,
    "Importance": importance
})

# Sort from highest to lowest
importance_df = importance_df.sort_values(
    by="Importance",
    ascending=False
)

print("\nTop 15 Features Influencing Crop Yield:\n")
print(importance_df.head(15).to_string(index=False))

# Save results
importance_df.to_csv(
    "feature_importance.csv",
    index=False
)

print("\nFeature importance saved to: feature_importance.csv")