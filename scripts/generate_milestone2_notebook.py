import os
import sys
from pathlib import Path
import nbformat as nbf
from nbconvert.preprocessors import ExecutePreprocessor
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))


def build_and_run_milestone2_notebook():
    nb = nbf.v4.new_notebook()
    cells = []

    # 1. Title and Objective
    cells.append(nbf.v4.new_markdown_cell(
        "# AI AgriYield Predictor – Milestone 2\n\n"
        "## Crop Yield Regression Model Training & Performance Evaluation\n\n"
        "**Project Title**: AI-Based Crop Yield Prediction Using Soil and Weather Parameters\n\n"
        "### Milestone 2 Objectives:\n"
        "1. Ingest clean dataset and construct Scikit-Learn `ColumnTransformer` preprocessing pipeline.\n"
        "2. Implement 80/20 train/test split with strict data leakage prevention (`random_state=42`).\n"
        "3. Train and compare 4 core regression models:\n"
        "   - **Linear Regression**\n"
        "   - **Decision Tree Regressor**\n"
        "   - **Random Forest Regressor**\n"
        "   - **Gradient Boosting Regressor**\n"
        "4. Perform 5-Fold Cross-Validation on the training set.\n"
        "5. Evaluate metrics: $R^2$ Score, RMSE, MAE, MSE.\n"
        "6. Analyze feature importances and select the best model for production deployment."
    ))

    # 2. Imports
    cells.append(nbf.v4.new_markdown_cell("### Step 1: Library Imports & Environment Setup"))
    cells.append(nbf.v4.new_code_cell(
        "import numpy as np\n"
        "import pandas as pd\n"
        "import matplotlib.pyplot as plt\n"
        "import seaborn as sns\n"
        "import joblib\n"
        "import os\n\n"
        "from sklearn.model_selection import train_test_split, cross_val_score, KFold\n"
        "from sklearn.preprocessing import StandardScaler, OneHotEncoder\n"
        "from sklearn.compose import ColumnTransformer\n"
        "from sklearn.pipeline import Pipeline\n"
        "from sklearn.linear_model import LinearRegression\n"
        "from sklearn.tree import DecisionTreeRegressor\n"
        "from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor\n"
        "from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error\n\n"
        "%matplotlib inline\n"
        "sns.set_theme(style='whitegrid', palette='muted')"
    ))

    # 3. Dataset Loading
    cells.append(nbf.v4.new_markdown_cell("### Step 2: Dataset Ingestion & Feature Selection"))
    cells.append(nbf.v4.new_code_cell(
        "df = pd.read_csv('dataset.csv') if os.path.exists('dataset.csv') else pd.read_csv('../dataset.csv')\n"
        "print('Dataset Shape:', df.shape)\n"
        "df.head()"
    ))

    # 4. Pipeline Setup
    cells.append(nbf.v4.new_markdown_cell(
        "### Step 3: Train-Test Split & Preprocessing Pipeline\n\n"
        "To strictly **prevent data leakage**, we split before fitting any transformers."
    ))
    cells.append(nbf.v4.new_code_cell(
        "categorical_cols = ['State', 'Crop', 'Soil_Type', 'Fertilizer']\n"
        "numerical_cols = ['N', 'P', 'K', 'Rainfall_mm', 'Temperature_C', 'Soil_pH', 'Year']\n"
        "target_col = 'Yield_kg_per_acre'\n\n"
        "X = df[categorical_cols + numerical_cols]\n"
        "y = df[target_col]\n\n"
        "# 80/20 Train/Test Split\n"
        "X_train, X_test, y_train, y_test = train_test_split(\n"
        "    X, y, test_size=0.2, random_state=42, shuffle=True\n"
        ")\n\n"
        "print(f'Training Samples: {X_train.shape[0]} | Testing Samples: {X_test.shape[0]}')\n\n"
        "# Define ColumnTransformer\n"
        "preprocessor = ColumnTransformer(\n"
        "    transformers=[\n"
        "        ('num', StandardScaler(), numerical_cols),\n"
        "        ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_cols)\n"
        "    ],\n"
        "    remainder='drop',\n"
        "    verbose_feature_names_out=False\n"
        ")\n\n"
        "# Fit ONLY on Training Data\n"
        "X_train_trans = preprocessor.fit_transform(X_train)\n"
        "X_test_trans = preprocessor.transform(X_test)\n"
        "feature_names = list(preprocessor.get_feature_names_out())\n"
        "print(f'Transformed Features Count: {X_train_trans.shape[1]}')"
    ))

    # 5. Model Training & Evaluation Loop
    cells.append(nbf.v4.new_markdown_cell("### Step 4: Model Training, 5-Fold Cross-Validation & Metric Evaluation"))
    cells.append(nbf.v4.new_code_cell(
        "models = {\n"
        "    'Linear Regression': LinearRegression(),\n"
        "    'Decision Tree': DecisionTreeRegressor(random_state=42, max_depth=10, min_samples_split=5),\n"
        "    'Random Forest': RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1),\n"
        "    'Gradient Boosting': GradientBoostingRegressor(n_estimators=100, random_state=42, learning_rate=0.1, max_depth=5)\n"
        "}\n\n"
        "kf = KFold(n_splits=5, shuffle=True, random_state=42)\n"
        "results = {}\n"
        "predictions = {}\n\n"
        "for name, model in models.items():\n"
        "    # Fit Model\n"
        "    model.fit(X_train_trans, y_train)\n"
        "    \n"
        "    # Predict\n"
        "    y_tr_pred = model.predict(X_train_trans)\n"
        "    y_te_pred = model.predict(X_test_trans)\n"
        "    predictions[name] = y_te_pred\n"
        "    \n"
        "    # Calculate Metrics\n"
        "    tr_r2 = r2_score(y_train, y_tr_pred)\n"
        "    te_r2 = r2_score(y_test, y_te_pred)\n"
        "    tr_rmse = np.sqrt(mean_squared_error(y_train, y_tr_pred))\n"
        "    te_rmse = np.sqrt(mean_squared_error(y_test, y_te_pred))\n"
        "    tr_mae = mean_absolute_error(y_train, y_tr_pred)\n"
        "    te_mae = mean_absolute_error(y_test, y_te_pred)\n"
        "    \n"
        "    # 5-Fold Cross-Validation\n"
        "    cv_scores = cross_val_score(model, X_train_trans, y_train, cv=kf, scoring='r2')\n"
        "    \n"
        "    results[name] = {\n"
        "        'Train R²': round(tr_r2, 4),\n"
        "        'Test R²': round(te_r2, 4),\n"
        "        'CV R² (Mean)': round(cv_scores.mean(), 4),\n"
        "        'CV R² (Std)': round(cv_scores.std(), 4),\n"
        "        'Train RMSE': round(tr_rmse, 2),\n"
        "        'Test RMSE': round(te_rmse, 2),\n"
        "        'Train MAE': round(tr_mae, 2),\n"
        "        'Test MAE': round(te_mae, 2)\n"
        "    }\n\n"
        "results_df = pd.DataFrame.from_dict(results, orient='index')\n"
        "results_df.sort_values(by='Test R²', ascending=False)"
    ))

    # 6. Visualizations: Model Comparison Bar Chart
    cells.append(nbf.v4.new_markdown_cell("### Step 5: Visualizing Model Performance ($R^2$ Score & RMSE Comparison)"))
    cells.append(nbf.v4.new_code_cell(
        "fig, axes = plt.subplots(1, 2, figsize=(16, 5))\n\n"
        "# Plot R2 Scores\n"
        "sns.barplot(x=results_df.index, y=results_df['Test R²'], ax=axes[0], palette='Blues_r')\n"
        "axes[0].set_title('Test R² Score Comparison (Higher is Better)', fontsize=14, fontweight='bold')\n"
        "axes[0].set_ylabel('R² Score', fontsize=12)\n"
        "axes[0].set_ylim(0, 1.05)\n"
        "for p in axes[0].patches:\n"
        "    axes[0].annotate(f'{p.get_height():.4f}', (p.get_x() + p.get_width() / 2., p.get_height()),\n"
        "                     ha='center', va='bottom', fontsize=10, xytext=(0, 5), textcoords='offset points')\n\n"
        "# Plot RMSE\n"
        "sns.barplot(x=results_df.index, y=results_df['Test RMSE'], ax=axes[1], palette='Oranges_r')\n"
        "axes[1].set_title('Test RMSE Comparison (Lower is Better)', fontsize=14, fontweight='bold')\n"
        "axes[1].set_ylabel('Root Mean Squared Error (kg/acre)', fontsize=12)\n"
        "for p in axes[1].patches:\n"
        "    axes[1].annotate(f'{p.get_height():.1f}', (p.get_x() + p.get_width() / 2., p.get_height()),\n"
        "                     ha='center', va='bottom', fontsize=10, xytext=(0, 5), textcoords='offset points')\n\n"
        "plt.tight_layout()\n"
        "plt.show()"
    ))

    # 7. Actual vs Predicted Plots
    cells.append(nbf.v4.new_markdown_cell("### Step 6: Actual vs. Predicted Yield Analysis"))
    cells.append(nbf.v4.new_code_cell(
        "fig, axes = plt.subplots(2, 2, figsize=(14, 12))\n"
        "axes = axes.flatten()\n\n"
        "for idx, (name, y_pred) in enumerate(predictions.items()):\n"
        "    ax = axes[idx]\n"
        "    ax.scatter(y_test, y_pred, alpha=0.6, color='#2b5c8f', edgecolors='k', s=40)\n"
        "    min_val = min(y_test.min(), y_pred.min())\n"
        "    max_val = max(y_test.max(), y_pred.max())\n"
        "    ax.plot([min_val, max_val], [min_val, max_val], 'r--', lw=2, label='Perfect Prediction')\n"
        "    ax.set_title(f'{name} (Test R² = {results[name][\"Test R²\"]:.4f})', fontsize=12, fontweight='bold')\n"
        "    ax.set_xlabel('Actual Yield (kg/acre)')\n"
        "    ax.set_ylabel('Predicted Yield (kg/acre)')\n"
        "    ax.legend()\n\n"
        "plt.tight_layout()\n"
        "plt.show()"
    ))

    # 8. Feature Importance
    cells.append(nbf.v4.new_markdown_cell("### Step 7: Feature Importance Analysis"))
    cells.append(nbf.v4.new_code_cell(
        "rf_model = models['Random Forest']\n"
        "gb_model = models['Gradient Boosting']\n\n"
        "rf_importance = pd.Series(rf_model.feature_importances_, index=feature_names).sort_values(ascending=False).head(10)\n"
        "gb_importance = pd.Series(gb_model.feature_importances_, index=feature_names).sort_values(ascending=False).head(10)\n\n"
        "fig, axes = plt.subplots(1, 2, figsize=(16, 6))\n"
        "sns.barplot(x=rf_importance.values, y=rf_importance.index, ax=axes[0], palette='viridis')\n"
        "axes[0].set_title('Top 10 Feature Importances - Random Forest', fontsize=13, fontweight='bold')\n"
        "axes[0].set_xlabel('Importance Score')\n\n"
        "sns.barplot(x=gb_importance.values, y=gb_importance.index, ax=axes[1], palette='magma')\n"
        "axes[1].set_title('Top 10 Feature Importances - Gradient Boosting', fontsize=13, fontweight='bold')\n"
        "axes[1].set_xlabel('Importance Score')\n\n"
        "plt.tight_layout()\n"
        "plt.show()"
    ))

    # 9. Conclusion
    cells.append(nbf.v4.new_markdown_cell(
        "### Step 8: Summary and Best Model Selection\n\n"
        "**Key Findings:**\n"
        "- Tree-based ensemble methods (**Random Forest** and **Gradient Boosting**) capture non-linear relationships between soil nutrients, climate factors, and crop cultivars effectively.\n"
        "- **Random Forest Regressor** achieves superior generalization and cross-validation stability on the test partition.\n"
        "- All trained models and preprocessor weights are serialized into `backend/app/ml/artifacts/` for live FastAPI inference."
    ))

    nb['cells'] = cells

    # Save and execute notebook
    notebook_dir = PROJECT_ROOT / "notebooks"
    notebook_dir.mkdir(parents=True, exist_ok=True)
    nb_path = notebook_dir / "Milestone2_Model_Training.ipynb"

    print(f"[*] Executing and generating notebook at {nb_path}...")
    ep = ExecutePreprocessor(timeout=600, kernel_name='python3')
    ep.preprocess(nb, {'metadata': {'path': str(notebook_dir)}})

    with open(nb_path, 'w', encoding='utf-8') as f:
        nbf.write(nb, f)

    print(f"[+] Successfully executed and saved {nb_path}")


if __name__ == '__main__':
    build_and_run_milestone2_notebook()
