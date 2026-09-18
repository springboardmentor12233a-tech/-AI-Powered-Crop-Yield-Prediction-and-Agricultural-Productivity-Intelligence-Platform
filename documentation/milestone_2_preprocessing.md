# Milestone 2 – Data Preprocessing

## 1. Project Overview

### Project Name
AI-Powered Crop Yield Prediction and Agricultural Productivity Intelligence Platform

### Objective
The objective of this milestone is to prepare the agricultural dataset for machine learning by performing data preprocessing, feature transformation, categorical encoding, feature scaling, and train-test splitting.

---

## 2. Dataset

The dataset used for preprocessing is:

`Smart_Farming_Crop_Yield_2024.csv`

### Dataset Information

- Total Records: 500
- Target Variable: `yield_kg_per_hectare`
- Training Samples: 400
- Testing Samples: 100

The dataset contains information related to soil conditions, weather conditions, crop types, irrigation, fertilizer usage, location, and crop yield.

---

## 3. Data Loading

The dataset was loaded using Pandas.

The following libraries were used:

- Pandas
- NumPy
- Scikit-learn

The dataset was checked before preprocessing to understand its structure and features.

---

## 4. Feature and Target Separation

The target variable was separated from the input features.

### Target Variable

`yield_kg_per_hectare`

### Input Features

The remaining relevant agricultural, environmental, categorical, and numerical features were used as input features for the machine learning model.

---

## 5. Handling Categorical Features

Categorical features were identified and converted into numerical form so that machine learning algorithms can process them.

One-Hot Encoding was used for categorical variables.

The preprocessing pipeline used:

`OneHotEncoder(handle_unknown="ignore", sparse_output=False)`

This ensures that unknown categories do not cause errors during prediction.

---

## 6. Numerical Feature Scaling

Numerical features were scaled using:

`StandardScaler`

Standardization helps bring numerical features to a similar scale and prevents features with larger numerical values from dominating the model.

---

## 7. Preprocessing Pipeline

A Scikit-learn preprocessing pipeline was created.

The pipeline performs:

1. Numerical feature scaling using StandardScaler
2. Categorical feature encoding using OneHotEncoder
3. Transformation of training and testing data

This makes the preprocessing process consistent and suitable for machine learning.

---

## 8. Train-Test Split

The dataset was divided into training and testing sets.

### Training Data

- Samples: 400
- Percentage: 80%

### Testing Data

- Samples: 100
- Percentage: 20%

The training data will be used for machine learning model training, while the testing data will be used to evaluate model performance.

---

## 9. Processed Data

After preprocessing, the feature dimensions were:

- Processed Training Shape: `(400, 36)`
- Processed Testing Shape: `(100, 36)`

Therefore, the preprocessing pipeline generated 36 processed features.

---

## 10. Preprocessing Result

The preprocessing process was completed successfully.

The final output confirms:

- Training samples: 400
- Testing samples: 100
- Target training samples: 400
- Target testing samples: 100
- Processed training features: 36
- Processed testing features: 36

---

## 11. Key Findings

1. The agricultural dataset was successfully loaded and prepared.
2. The target variable was separated from the input features.
3. Categorical features were converted using One-Hot Encoding.
4. Numerical features were standardized using StandardScaler.
5. A preprocessing pipeline was created using Scikit-learn.
6. The dataset was divided into 80% training and 20% testing data.
7. The processed training dataset contains 400 samples and 36 features.
8. The processed testing dataset contains 100 samples and 36 features.
9. The preprocessing pipeline completed successfully without errors.

---

## 12. Conclusion

Milestone 2 successfully completes the data preprocessing stage of the project.

The agricultural dataset has been transformed into a machine-learning-ready format using categorical encoding, numerical feature scaling, preprocessing pipelines, and train-test splitting.

The processed data is now ready for the next milestone, which will focus on machine learning model development and evaluation.