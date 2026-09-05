import os
import nbformat as nbf
from nbconvert.preprocessors import ExecutePreprocessor
import pandas as pd
import numpy as np

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def create_and_run_notebook():
    nb = nbf.v4.new_notebook()
    cells = []
    
    # 1. Header and Title
    cells.append(nbf.v4.new_markdown_cell(
        "# AI AgriYield Predictor\n\n"
        "## Milestone 1 Documentation\n"
        "### Requirements & Dataset Preparation\n\n"
        "**Title**: AI-Based Crop Yield Prediction Using Soil and Weather Parameters.\n\n"
        "**Project Objective**: The objective of this project is to develop a machine learning model to predict crop yield (kg per acre) using soil nutrients, weather conditions, fertilizer usage, and weather-related features.\n\n"
        "Since the target variable (`Yield_kg_per_acre`) is a continuous numerical value, this problem is treated as a regression problem.\n\n"
        "**Data Source**: The dataset was provided by the project mentor as part of the Infosys Springboard Virtual Internship.\n\n"
        "**Dataset details:**\n"
        "- Total records: 1500\n"
        "- Total columns: 12\n"
        "- Categorical features: State, Crop, Soil_Type, Fertilizer\n"
        "- Numerical features: N, P, K, Rainfall_mm, Temperature_C, Soil_pH, Year\n"
        "- Target variable: Yield_kg_per_acre"
    ))
    
    # Step 1: Environment Setup
    cells.append(nbf.v4.new_markdown_cell(
        "## Process Followed\n\n"
        "### Step 1: Environment Setup\n"
        "- Created a virtual environment.\n"
        "- Installed required libraries (`pandas`, `numpy`, `seaborn`, `matplotlib`, `scikit-learn`).\n"
        "- Used Jupyter Notebook for implementation."
    ))
    
    cells.append(nbf.v4.new_code_cell(
        "import pandas as pd\n"
        "import numpy as np\n"
        "import matplotlib.pyplot as plt\n"
        "import seaborn as sns\n"
        "from sklearn.preprocessing import StandardScaler\n\n"
        "%matplotlib inline"
    ))
    
    # Step 2: Data Exploration
    cells.append(nbf.v4.new_markdown_cell(
        "### Step 2: Data Exploration\n"
        "The dataset was loaded using:"
    ))
    
    cells.append(nbf.v4.new_code_cell(
        "df = pd.read_csv('dataset.csv')\n"
        "df.head()"
    ))
    
    cells.append(nbf.v4.new_code_cell("df.info()"))
    cells.append(nbf.v4.new_code_cell("df.describe()"))
    
    cells.append(nbf.v4.new_markdown_cell(
        "**Observations:**\n"
        "- Dataset contains 1500 rows and 12 columns.\n"
        "- No missing values were found.\n"
        "- Data types were appropriate for processing.\n"
        "- Yield variable showed slight skewness due to some high maximum values."
    ))
    
    # Step 3: Data Cleaning
    cells.append(nbf.v4.new_markdown_cell(
        "### Step 3: Data Cleaning\n"
        "Missing values were checked using:"
    ))
    cells.append(nbf.v4.new_code_cell("df.isnull().sum()"))
    
    cells.append(nbf.v4.new_markdown_cell("Duplicate rows were checked using:"))
    cells.append(nbf.v4.new_code_cell("duplicates = df.duplicated().sum()\nprint('Duplicates:', duplicates)"))
    
    cells.append(nbf.v4.new_markdown_cell(
        "**Results:**\n"
        "- No missing values\n"
        "- No duplicate records\n\n"
        "Thus, no additional cleaning was required."
    ))
    
    # Data Analysis (Graphs)
    cells.append(nbf.v4.new_markdown_cell("## Data Analysis (Graphs)"))
    
    # Graph 1
    cells.append(nbf.v4.new_markdown_cell("### Graph 1: Distribution of Crop Yield"))
    cells.append(nbf.v4.new_code_cell(
        "plt.figure(figsize=(8,5))\n"
        "sns.histplot(df['Yield_kg_per_acre'], bins=30, kde=True)\n"
        "plt.title('Distribution of Crop Yield')\n"
        "plt.xlabel('Yield (kg per acre)')\n"
        "plt.ylabel('Frequency')\n"
        "plt.show()"
    ))
    cells.append(nbf.v4.new_markdown_cell(
        "**Observation:**\n"
        "- The yield distribution is slightly right-skewed.\n"
        "- Some crops have significantly higher yield values compared to the majority.\n"
        "- Most yield values fall within a moderate range."
    ))
    
    # Graph 2
    cells.append(nbf.v4.new_markdown_cell("### Graph 2: Correlation Heatmap"))
    cells.append(nbf.v4.new_code_cell(
        "plt.figure(figsize=(10,6))\n"
        "sns.heatmap(df.corr(numeric_only=True), annot=True, cmap='coolwarm')\n"
        "plt.title('Correlation Matrix')\n"
        "plt.show()"
    ))
    cells.append(nbf.v4.new_markdown_cell(
        "**Observation:**\n"
        "- The heatmap shows relationships between numerical features.\n"
        "- Some soil nutrients and rainfall show correlation with yield.\n"
        "- Helps in understanding which features may influence crop productivity."
    ))
    
    # Feature Engineering
    cells.append(nbf.v4.new_markdown_cell(
        "## Feature Engineering\n\n"
        "### One-Hot Encoding\n"
        "Since machine learning models cannot process categorical text data directly, categorical features were converted using one-hot encoding:"
    ))
    cells.append(nbf.v4.new_code_cell(
        "X = df.drop('Yield_kg_per_acre', axis=1)\n"
        "y = df['Yield_kg_per_acre']\n"
        "X_encoded = pd.get_dummies(X, drop_first=True)"
    ))
    cells.append(nbf.v4.new_markdown_cell(
        "The dataset was split into features (X) and target variable (y) before applying encoding.\n\n"
        "**Result:**\n"
        "- Number of features increased from 12 to 39.\n"
        "- All categorical variables were converted into numerical format."
    ))
    
    cells.append(nbf.v4.new_markdown_cell(
        "### Feature Scaling\n"
        "Numerical features had different ranges (e.g., rainfall in hundreds, pH in single digits). To ensure uniform scaling of numerical features, StandardScaler was applied only to the following columns:"
    ))
    cells.append(nbf.v4.new_code_cell(
        "scaler = StandardScaler()\n"
        "numerical_cols = ['N', 'P', 'K', 'Rainfall_mm', 'Temperature_C', 'Soil_pH', 'Year']\n"
        "X_encoded[numerical_cols] = scaler.fit_transform(X_encoded[numerical_cols])\n"
        "print('Final dataset shape after preprocessing:', X_encoded.shape)"
    ))
    cells.append(nbf.v4.new_markdown_cell(
        "**After scaling:**\n"
        "- Numerical features were standardized (mean = 0, std = 1)\n"
        "- Dataset shape became (1500, 39)\n"
        "- No rows were lost during preprocessing"
    ))
    
    # Challenges, Outcome, Conclusion, Submission
    cells.append(nbf.v4.new_markdown_cell(
        "## Challenges Faced\n"
        "1. Initial virtual environment activation issues.\n"
        "2. Execution delay due to kernel configuration.\n"
        "3. Understanding the correct order of preprocessing steps.\n\n"
        "These were resolved through proper environment setup and debugging.\n\n"
        "## Outcome of Milestone 1\n"
        "- Dataset was explored and understood.\n"
        "- No missing or duplicate data.\n"
        "- Categorical features were encoded.\n"
        "- Numerical features were standardized.\n"
        "- 2 important visualizations were generated.\n"
        "- Final dataset prepared for regression model training.\n\n"
        "## Conclusion\n"
        "Milestone 1 successfully completed dataset preparation and preprocessing steps required for machine learning. The data is now clean, structured, encoded, and scaled, making it ready for building regression models in the next milestone.\n\n"
        "---\n\n"
        "### Submitted by:\n"
        "**Bandi Siri**  \n"
        "siribandi17@gmail.com"
    ))
    
    nb['cells'] = cells
    
    notebook_dir = os.path.join(PROJECT_ROOT, "notebooks")
    os.makedirs(notebook_dir, exist_ok=True)
    
    output_path = os.path.join(notebook_dir, "EDA_Crop_Yield.ipynb")
    
    print(f"Writing notebook to {output_path}...")
    with open(output_path, "w", encoding="utf-8") as f:
        nbf.write(nb, f)
        
    print("Executing notebook to embed real data outputs...")
    ep = ExecutePreprocessor(timeout=600, kernel_name="python3")
    try:
        ep.preprocess(nb, {"metadata": {"path": notebook_dir}})
        with open(output_path, "w", encoding="utf-8") as f:
            nbf.write(nb, f)
        print("Notebook executed and outputs saved successfully!")
    except Exception as e:
        print(f"Execution warning: {e}")

if __name__ == "__main__":
    create_and_run_notebook()
