import pandas as pd
import numpy as np
import joblib
import json
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

def main():
    # 1. Read dataset
    df = pd.read_csv('d:/data_practice/agri_yield_dataset.csv')

    # 2. Target variable
    df['Yield_kg_per_acre'] = df['Yield_kg_per_acre'].clip(lower=0)
    df = df.dropna(subset=['Yield_kg_per_acre'])
    y = np.log1p(df['Yield_kg_per_acre'])
    X = df.drop('Yield_kg_per_acre', axis=1)

    # 3. Preprocess features
    numerical_cols = ['N', 'P', 'K', 'Rainfall_mm', 'Temperature_C', 'Soil_pH', 'Year']
    categorical_cols = [col for col in X.columns if col not in numerical_cols]

    X_cat = pd.get_dummies(X[categorical_cols], drop_first=True)
    X_num = X[numerical_cols]

    scaler = StandardScaler()
    X_num_scaled = pd.DataFrame(scaler.fit_transform(X_num), columns=X_num.columns, index=X_num.index)

    X_processed = pd.concat([X_num_scaled, X_cat], axis=1)

    # 4. Split data
    X_train, X_test, y_train, y_test = train_test_split(X_processed, y, test_size=0.2, random_state=42)

    # 5. GridSearchCV models
    models_params = {
        'Ridge': {
            'model': Ridge(),
            'params': {'alpha': [0.01, 0.1, 1.0, 10.0, 100.0]}
        },
        'RandomForest': {
            'model': RandomForestRegressor(random_state=42),
            'params': {
                'n_estimators': [100, 200],
                'max_depth': [10, 20, None],
                'min_samples_split': [2, 5]
            }
        },
        'GradientBoosting': {
            'model': GradientBoostingRegressor(random_state=42),
            'params': {
                'n_estimators': [100, 150],
                'learning_rate': [0.05, 0.1],
                'max_depth': [3, 5]
            }
        }
    }

    results = []
    best_overall_model = None
    best_overall_score = -float('inf')

    for model_name, mp in models_params.items():
        clf = GridSearchCV(mp['model'], mp['params'], cv=5, scoring='r2', n_jobs=-1)
        clf.fit(X_train, y_train)
        
        # 6. Evaluate test predictions
        y_pred_log = clf.predict(X_test)
        y_pred = np.expm1(y_pred_log)
        y_test_real = np.expm1(y_test)
        
        rmse = np.sqrt(mean_squared_error(y_test_real, y_pred))
        mae = mean_absolute_error(y_test_real, y_pred)
        r2 = r2_score(y_test_real, y_pred)
        
        results.append({
            'Model': model_name,
            'Best Params': str(clf.best_params_),
            'RMSE': rmse,
            'MAE': mae,
            'R2': r2
        })
        
        if r2 > best_overall_score:
            best_overall_score = r2
            best_overall_model = clf.best_estimator_

    # 7. Persist best model, scaler, and columns
    joblib.dump(best_overall_model, 'd:/data_practice/champion_agri_model.pkl')
    joblib.dump(scaler, 'd:/data_practice/scaler.pkl')
    joblib.dump(X_processed.columns.tolist(), 'd:/data_practice/model_columns.pkl')

    print(json.dumps(results))

if __name__ == '__main__':
    main()
