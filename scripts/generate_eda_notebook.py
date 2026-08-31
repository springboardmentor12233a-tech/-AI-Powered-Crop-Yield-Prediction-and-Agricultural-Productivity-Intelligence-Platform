import os
import nbformat as nbf
from nbconvert.preprocessors import ExecutePreprocessor

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def create_and_run_notebook():
    nb = nbf.v4.new_notebook()
    
    cells = []
    
    # 1. Title and Objective
    cells.append(nbf.v4.new_markdown_cell(
        "# Exploratory Data Analysis (EDA) - Crop Yield & Telemetry\n\n"
        "**Project**: YieldSense AI: Crop Yield Prediction & Agricultural Productivity Forecasting System\n\n"
        "**Objective**: Perform comprehensive Exploratory Data Analysis (EDA) on the crop yield dataset "
        "to understand feature distributions, identify anomalies, analyze correlation, and evaluate "
        "feature interactions. This serves as the data intelligence baseline for model development in Week 2."
    ))
    
    # 2. Import libraries
    cells.append(nbf.v4.new_markdown_cell("## 1. Import Libraries\nWe import pandas, numpy, matplotlib, and seaborn for data processing and visualization."))
    cells.append(nbf.v4.new_code_cell(
        "import pandas as pd\n"
        "import numpy as np\n"
        "import matplotlib.pyplot as plt\n"
        "import seaborn as sns\n"
        "import os\n\n"
        "# Set plotting preferences\n"
        "sns.set_theme(style='whitegrid')\n"
        "plt.rcParams['figure.figsize'] = (10, 6)"
    ))
    
    # 3. Load dataset
    cells.append(nbf.v4.new_markdown_cell("## 2. Load Dataset\nWe read the crop yield dataset downloaded from Explore-AI's repository mirror."))
    cells.append(nbf.v4.new_code_cell(
        "# Adjust paths relative to the notebooks/ directory\n"
        "dataset_path = os.path.join('..', 'dataset', 'raw', 'kaggle_crop_yield', 'crop_yield.csv')\n"
        "df = pd.read_csv(dataset_path)\n"
        "print('Dataset successfully loaded!')"
    ))
    
    # 4. Display first rows
    cells.append(nbf.v4.new_markdown_cell("## 3. First Rows\nLet's inspect the first 5 records of the dataset."))
    cells.append(nbf.v4.new_code_cell("df.head()"))
    
    # 5. Dataset shape
    cells.append(nbf.v4.new_markdown_cell("## 4. Dataset Shape\nInspect dimensions of the data."))
    cells.append(nbf.v4.new_code_cell("print(f'Rows: {df.shape[0]} | Columns: {df.shape[1]}')"))
    
    # 6. Dataset information
    cells.append(nbf.v4.new_markdown_cell("## 5. Dataset Information\nCheck column data types and non-null counts."))
    cells.append(nbf.v4.new_code_cell("df.info()"))
    
    # 7. Descriptive statistics
    cells.append(nbf.v4.new_markdown_cell("## 6. Descriptive Statistics\nEvaluate numerical properties, means, std, and percentiles."))
    cells.append(nbf.v4.new_code_cell("df.describe()"))
    
    # 8. Missing-value analysis
    cells.append(nbf.v4.new_markdown_cell("## 7. Missing Value Analysis\nCheck if there are null values that need imputation."))
    cells.append(nbf.v4.new_code_cell("df.isnull().sum()"))
    
    # 9. Duplicate analysis
    cells.append(nbf.v4.new_markdown_cell("## 8. Duplicate Analysis\nCheck for duplicate observations."))
    cells.append(nbf.v4.new_code_cell("print(f'Number of duplicates: {df.duplicated().sum()}')"))
    
    # 10. Data-type analysis
    cells.append(nbf.v4.new_markdown_cell("## 9. Data Type Analysis\nSeparate numerical and categorical variables."))
    cells.append(nbf.v4.new_code_cell(
        "num_cols = df.select_dtypes(include=[np.number]).columns.tolist()\n"
        "cat_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()\n"
        "print(f'Numerical Columns: {num_cols}')\n"
        "print(f'Categorical Columns: {cat_cols}')"
    ))
    
    # 11. Numerical feature analysis
    cells.append(nbf.v4.new_markdown_cell("## 10. Numerical Feature Distributions\nPlot histograms to visualize features distribution."))
    cells.append(nbf.v4.new_code_cell(
        "fig, axes = plt.subplots(2, 3, figsize=(15, 10))\n"
        "axes = axes.flatten()\n\n"
        "for i, col in enumerate(num_cols):\n"
        "    sns.histplot(df[col], kde=True, ax=axes[i], color='forestgreen')\n"
        "    axes[i].set_title(f'Distribution of {col}')\n\n"
        "plt.tight_layout()\n"
        "plt.show()"
    ))
    
    # 12. Categorical feature analysis
    cells.append(nbf.v4.new_markdown_cell("## 11. Categorical Feature Distributions\nCheck values count for categorical variables."))
    cells.append(nbf.v4.new_code_cell(
        "fig, axes = plt.subplots(1, 3, figsize=(18, 5))\n"
        "for i, col in enumerate(cat_cols):\n"
        "    sns.countplot(x=col, data=df, ax=axes[i], palette='viridis')\n"
        "    axes[i].set_title(f'Count of {col}')\n"
        "    axes[i].tick_params(axis='x', rotation=45)\n"
        "plt.tight_layout()\n"
        "plt.show()"
    ))
    
    # 13. Target/yield analysis
    cells.append(nbf.v4.new_markdown_cell("## 12. Target (Yield) Distribution\nAnalyze the target variable to see if there is skewness."))
    cells.append(nbf.v4.new_code_cell(
        "sns.kdeplot(df['Yield'], fill=True, color='darkgreen')\n"
        "plt.title('Yield Kernel Density Estimation')\n"
        "plt.show()"
    ))
    
    # 14. Outlier analysis
    cells.append(nbf.v4.new_markdown_cell("## 13. Outlier and Anomaly Analysis\nWe look for statistical outliers and non-physical values (like negative values for attributes that must be positive)."))
    cells.append(nbf.v4.new_code_cell(
        "fig, axes = plt.subplots(1, 2, figsize=(12, 5))\n"
        "sns.boxplot(y='Rainfall', data=df, ax=axes[0], color='skyblue')\n"
        "axes[0].set_title('Boxplot of Rainfall')\n\n"
        "sns.boxplot(y='Yield', data=df, ax=axes[1], color='lightgreen')\n"
        "axes[1].set_title('Boxplot of Yield')\n\n"
        "plt.show()"
    ))
    cells.append(nbf.v4.new_code_cell(
        "# Identify anomalous rows\n"
        "negative_rainfall = df[df['Rainfall'] < 0]\n"
        "negative_yield = df[df['Yield'] < 0]\n"
        "print(f'Rows with negative Rainfall: {len(negative_rainfall)}')\n"
        "print(f'Rows with negative Yield: {len(negative_yield)}')\n"
        "if len(negative_rainfall) > 0:\n"
        "    print('\\nSample negative rainfall records:')\n"
        "    print(negative_rainfall.head(3))"
    ))
    
    # 15. Correlation analysis
    cells.append(nbf.v4.new_markdown_cell("## 14. Correlation Analysis\nCompute pairwise correlation for numerical features."))
    cells.append(nbf.v4.new_code_cell("df[num_cols].corr()"))
    
    # 16. Correlation heatmap
    cells.append(nbf.v4.new_markdown_cell("## 15. Correlation Heatmap\nPlot a heatmap to identify multi-collinearity and feature-to-target relationships."))
    cells.append(nbf.v4.new_code_cell(
        "sns.heatmap(df[num_cols].corr(), annot=True, cmap='YlGnBu', fmt='.2f', vmin=-1, vmax=1)\n"
        "plt.title('Numerical Features Correlation Matrix')\n"
        "plt.show()"
    ))
    
    # 17. Yield distribution
    cells.append(nbf.v4.new_markdown_cell("## 16. Yield Distribution by Region and Soil Type\nCheck target values partitioned by categorical parameters."))
    cells.append(nbf.v4.new_code_cell(
        "fig, axes = plt.subplots(1, 2, figsize=(15, 5))\n"
        "sns.boxplot(x='Region', y='Yield', data=df, ax=axes[0], palette='Set2')\n"
        "axes[0].set_title('Yield Distribution by Region')\n\n"
        "sns.boxplot(x='Soil_Type', y='Yield', data=df, ax=axes[1], palette='Set3')\n"
        "axes[1].set_title('Yield Distribution by Soil Type')\n"
        "plt.show()"
    ))
    
    # 18. Feature vs Yield plots
    cells.append(nbf.v4.new_markdown_cell("## 17. Feature vs Yield Scatter Plots\nEvaluate numerical variables relation against the target Yield."))
    cells.append(nbf.v4.new_code_cell(
        "fig, axes = plt.subplots(2, 2, figsize=(14, 10))\n"
        "axes = axes.flatten()\n\n"
        "features_to_plot = ['Temperature', 'Rainfall', 'Fertilizer_Usage', 'Pesticide_Usage']\n"
        "for i, col in enumerate(features_to_plot):\n"
        "    sns.scatterplot(x=col, y='Yield', data=df, alpha=0.6, color='darkgreen', ax=axes[i])\n"
        "    axes[i].set_title(f'{col} vs Yield')\n\n"
        "plt.tight_layout()\n"
        "plt.show()"
    ))
    
    # 19. Important Observations
    cells.append(nbf.v4.new_markdown_cell(
        "## 18. Important Observations\n"
        "1. **Rainfall Anomaly**: There are multiple records where `Rainfall` is negative (min value of around -9.0). Since rainfall cannot be negative, this is a data collection error or missing value indicator.\n"
        "2. **Yield Anomaly**: Similarly, `Yield` has negative outlier values (min of around -0.3). These must be corrected as negative yields are physically impossible.\n"
        "3. **Data Completeness**: No missing values (`NaN`) were found, but the negative numbers function as semantic null values.\n"
        "4. **Correlations**: `Fertilizer_Usage` and `Pesticide_Usage` show a positive relationship with `Yield`. `Rainfall` and `Temperature` show mild relationships but need cleaning to reflect the true interaction."
    ))
    
    # 20. EDA Conclusions
    cells.append(nbf.v4.new_markdown_cell(
        "## 19. EDA Conclusions\n"
        "- The dataset forms a robust basis for crop yield forecasting.\n"
        "- The features are continuous weather and input variables combined with discrete regions/soil classifications.\n"
        "- Standard regression/tree-based algorithms will benefit from cleaning features anomalies first."
    ))
    
    # 21. Recommended preprocessing steps for Week 2
    cells.append(nbf.v4.new_markdown_cell(
        "## 20. Recommended Preprocessing Steps (Milestone 2 Prep)\n"
        "1. **Clamping**: Set negative `Rainfall` and negative `Yield` values to a minimum threshold of `0.0` or replace them with column means.\n"
        "2. **One-Hot Encoding**: Convert categorical variables (`Region`, `Soil_Type`, `Crop_Variety`) into binary dummy columns.\n"
        "3. **Scaling**: Standardize continuous features (`Temperature`, `Rainfall`, `Fertilizer_Usage`, `Pesticide_Usage`) using Standard or MinMax scaling for algorithms like neural networks."
    ))
    
    nb['cells'] = cells
    
    # Save notebook file
    nb_dir = os.path.join(PROJECT_ROOT, "notebooks")
    os.makedirs(nb_dir, exist_ok=True)
    nb_path = os.path.join(nb_dir, "EDA_Crop_Yield.ipynb")
    
    with open(nb_path, 'w', encoding='utf-8') as f:
        nbf.write(nb, f)
    print(f"Notebook successfully written to {nb_path}")
    
    # Execute notebook programmatically
    print("Executing notebook programmatically...")
    try:
        # Run notebook with resource directory
        ep = ExecutePreprocessor(timeout=600, kernel_name='python3')
        # Execute relative to 'notebooks' folder so paths in code resolve correctly
        with open(nb_path, encoding='utf-8') as f:
            nb_obj = nbf.read(f, as_version=4)
        
        ep.preprocess(nb_obj, {'metadata': {'path': nb_dir}})
        
        # Save output
        with open(nb_path, 'w', encoding='utf-8') as f:
            nbf.write(nb_obj, f)
        print("Notebook executed successfully and cell outputs are saved!")
    except Exception as e:
        print(f"Error executing notebook: {e}")

if __name__ == "__main__":
    create_and_run_notebook()
