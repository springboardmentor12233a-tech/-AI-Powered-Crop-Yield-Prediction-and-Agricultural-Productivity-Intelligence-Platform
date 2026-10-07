import os
import sys
import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import cross_validate, KFold
import joblib

# Setup paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(BASE_DIR)

from backend import prediction

def main():
    print("=== LOADING DATA & MODEL ===")
    prediction.load_pipeline()
    
    train_path = os.path.join(BASE_DIR, 'data', 'processed', 'train_processed.csv')
    test_path = os.path.join(BASE_DIR, 'data', 'processed', 'test_processed.csv')
    
    df_train = pd.read_csv(train_path)
    df_test = pd.read_csv(test_path)
    
    target_col = 'yield_kg_per_hectare'
    y_train = df_train[target_col]
    X_train = df_train.drop(columns=[target_col])
    
    y_test = df_test[target_col]
    X_test = df_test.drop(columns=[target_col])
    
    print("\n=== PHASE 1: VERIFY THE CURRENT DATA ===")
    print(f"Total records: {len(df_train) + len(df_test)}")
    print(f"Training records: {len(df_train)}")
    print(f"Test records: {len(df_test)}")
    print(f"Number of features: {X_train.shape[1]}")
    
    overall_y = pd.concat([y_train, y_test])
    print(f"Target Mean: {overall_y.mean():.2f}")
    print(f"Target Std Dev: {overall_y.std():.2f}")
    print(f"Target Min/Max: {overall_y.min():.2f} / {overall_y.max():.2f}")
    
    print("\n=== PHASE 2: TRAIN/TEST DISTRIBUTION ===")
    print("Training Target:")
    print(f"Mean: {y_train.mean():.2f}, Median: {y_train.median():.2f}, Std: {y_train.std():.2f}, Min/Max: {y_train.min():.2f}/{y_train.max():.2f}")
    print("Testing Target:")
    print(f"Mean: {y_test.mean():.2f}, Median: {y_test.median():.2f}, Std: {y_test.std():.2f}, Min/Max: {y_test.min():.2f}/{y_test.max():.2f}")
    
    print("\nFeature Distributions (Sample):")
    cols_to_check = ['rainfall_mm', 'temperature_C', 'soil_pH', 'soil_moisture_%', 'NDVI_index']
    for col in cols_to_check:
        if col in X_train.columns:
            tr_m, te_m = X_train[col].mean(), X_test[col].mean()
            tr_s, te_s = X_train[col].std(), X_test[col].std()
            print(f"{col} -> Train Mean: {tr_m:.2f} (Std: {tr_s:.2f}) | Test Mean: {te_m:.2f} (Std: {te_s:.2f})")
        else:
            # Maybe it's one-hot encoded or scaled? 
            # In processed dataset, it should be there if not fully transformed, 
            # wait, test_processed is already transformed by sklearn preprocessor? 
            # Let's check if 'rainfall_mm' exists. If not, the dataset is the output of preprocessor.
            pass
            
    print("\nChecking columns in X_train:")
    print(X_train.columns.tolist()[:10])
    
    print("\n=== PHASE 3: BASELINE MODEL ===")
    # Predict training mean for all test samples
    baseline_pred = np.full(shape=len(y_test), fill_value=y_train.mean())
    base_mae = mean_absolute_error(y_test, baseline_pred)
    base_rmse = np.sqrt(mean_squared_error(y_test, baseline_pred))
    base_r2 = r2_score(y_test, baseline_pred)
    print(f"Baseline MAE: {base_mae:.2f}")
    print(f"Baseline RMSE: {base_rmse:.2f}")
    print(f"Baseline R²: {base_r2:.4f}")
    
    print("\n=== PHASE 4: CROSS-VALIDATION R² ===")
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    cv_results = cross_validate(prediction._model, X_train, y_train, cv=kf, scoring=['r2', 'neg_mean_absolute_error', 'neg_root_mean_squared_error'])
    print(f"CV R² Mean: {cv_results['test_r2'].mean():.4f} (Std: {cv_results['test_r2'].std():.4f})")
    print(f"CV MAE Mean: {-cv_results['test_neg_mean_absolute_error'].mean():.2f}")
    print(f"CV RMSE Mean: {-cv_results['test_neg_root_mean_squared_error'].mean():.2f}")
    
    print("\n=== PHASE 5: FEATURE/TARGET RELATIONSHIP ===")
    # Correlation with target
    corrs = df_train.corr()[target_col].drop(target_col).sort_values(key=abs, ascending=False)
    print("Top 10 strongest correlations:")
    print(corrs.head(10))
    print("Top 10 weakest correlations:")
    print(corrs.tail(10))
    
    print("\n=== PHASE 6: FEATURE IMPORTANCE ===")
    importances = prediction._model.feature_importances_
    features = X_train.columns
    feat_imp = pd.Series(importances, index=features).sort_values(ascending=False)
    print("Top 15 features by RF importance:")
    print(feat_imp.head(15))
    
    print("\n=== PHASE 7 & 8: PREDICTION RESIDUAL AND RANGE ANALYSIS ===")
    preds = prediction._model.predict(X_test)
    residuals = y_test - preds
    
    print("Residuals:")
    print(f"Mean: {residuals.mean():.2f}")
    print(f"Std Dev: {residuals.std():.2f}")
    print(f"Min: {residuals.min():.2f}")
    print(f"Max: {residuals.max():.2f}")
    print(f"MAE: {mean_absolute_error(y_test, preds):.2f}")
    print(f"RMSE: {np.sqrt(mean_squared_error(y_test, preds)):.2f}")
    
    print("\nActual vs Predicted Ranges:")
    print(f"Actual Test Yield -> Min: {y_test.min():.2f}, Max: {y_test.max():.2f}, Mean: {y_test.mean():.2f}, Std: {y_test.std():.2f}")
    print(f"Predicted Yield   -> Min: {preds.min():.2f}, Max: {preds.max():.2f}, Mean: {preds.mean():.2f}, Std: {preds.std():.2f}")

if __name__ == '__main__':
    main()
