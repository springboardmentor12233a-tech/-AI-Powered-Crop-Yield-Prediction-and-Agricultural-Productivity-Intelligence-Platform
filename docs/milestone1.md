YieldSenseAI

Milestone 1 Documentation

Project Setup, Dataset Preparation & Backend Foundation

Title

AI-Powered Crop Yield Prediction and Agricultural Productivity
Intelligence Platform

Project Objective

The objective of this project is to develop an AI-based system that can
predict crop yield using agricultural, soil, weather, crop and
farming-related parameters.

The system uses features such as soil moisture, soil pH, temperature,
rainfall, humidity, sunlight, pesticide usage, crop type, irrigation
type, fertilizer type and crop disease status.

Since the target variable (yield_kg_per_hectare) is a continuous
numerical value, the crop yield prediction problem is treated as a
regression problem.

Data Source

The initial dataset prepared for the YieldSenseAI project contains
agricultural observations required for crop yield prediction.

Total records: 500

Total columns: 23

Categorical features: Region, Crop Type, Irrigation Type,
Fertilizer Type, Crop Disease Status

Numerical features: Soil Moisture, Soil pH, Temperature,
Rainfall, Humidity, Sunlight Hours, Pesticide Usage, Total Days,
Latitude, Longitude, NDVI Index, Sowing Month, Sowing Day,
Observation Month, Observation Day, Days Since Sowing, Crop Cycle
Progress

Target variable: Yield (kg per hectare)

Process Followed

Step 1: Environment Setup

Created a Python virtual environment.

Installed the required libraries.

Used VS Code and Jupyter Notebook for implementation.

Main Libraries Used

Pandas

NumPy

Matplotlib

Seaborn

Scikit-learn

FastAPI

SQLAlchemy

PostgreSQL

Step 2: Data Exploration

The dataset was loaded and inspected using Pandas.

df = pd.read_csv("dataset.csv")
df.head()
df.info()

Observations

Dataset contains agricultural records required for prediction.

Both numerical and categorical features are present.

The target variable is yield_kg_per_hectare.

The dataset structure was checked before preprocessing.

Step 3: Data Cleaning

Missing values were checked using:

df.isnull().sum()

Duplicate rows were checked using:

duplicates = df.duplicated().sum()

The data was also checked using:

df.describe()

Results

No missing values were found.

No duplicate records were found.

The data contains both numerical and categorical features.

No additional cleaning was required.

Data Analysis (Graphs)

Graph 1: Feature Distribution

plt.figure(figsize=(10, 5))
sns.histplot(df[TARGET], kde=True)
plt.title("Distribution of Crop Yield")
plt.xlabel("Yield (kg/hectare)")
plt.ylabel("Frequency")
plt.show()

Observation

The graph shows the distribution of crop yield.

The yield values are spread across different ranges.

Understanding the distribution is useful during preprocessing and
model training.

Graph 2: Correlation Heatmap

plt.figure(figsize=(14, 10))
sns.heatmap(
    df.corr(numeric_only=True),
    annot=True,
    fmt=".2f",
    cmap="coolwarm"
)
plt.title("Correlation Matrix")
plt.show()

Observation

The heatmap shows the relationship between numerical features.

It helps identify features that have relationships with crop yield.

This analysis helps in understanding which features can be useful
for prediction.

Feature Engineering

One-Hot Encoding

Since machine learning models cannot process categorical text data
directly, categorical features were converted into numerical values
using One-Hot Encoding.

The categorical features used were:

Region

Crop Type

Irrigation Type

Fertilizer Type

Crop Disease Status

The dataset was split into features (X) and target variable (y) before
applying encoding.

X = df.drop("yield_kg_per_hectare", axis=1)
y = df["yield_kg_per_hectare"]

A preprocessing pipeline was used to process the categorical features.

categorical_features = [
    "region",
    "crop_type",
    "irrigation_type",
    "fertilizer_type",
    "crop_disease_status"
]

The categorical values were converted into separate numerical columns.

Result

5 categorical features were processed.

21 One-Hot encoded features were created.

All categorical variables were converted into numerical format.

No categorical text values were directly given to the machine
learning model.

Numerical Features

The numerical features were processed separately from the categorical
features.

numerical_features = [
    "soil_moisture_%",
    "soil_pH",
    "temperature_C",
    "rainfall_mm",
    "humidity_%",
    "sunlight_hours",
    "pesticide_usage_ml",
    "total_days",
    "latitude",
    "longitude",
    "NDVI_index",
    "sowing_month",
    "sowing_day",
    "observation_month",
    "observation_day",
    "days_since_sowing",
    "crop_cycle_progress"
]

The preprocessing pipeline combined the numerical and encoded
categorical features.

X_processed = preprocessor.fit_transform(X)
feature_names = preprocessor.get_feature_names_out()

print("Number of processed features:", len(feature_names))
print(feature_names)

After Preprocessing

17 numerical features were retained.

21 categorical features were created through One-Hot Encoding.

Total input features became 38.

Final processed dataset contained 39 columns including the
target.

17 Numerical Features + 21 Encoded Features = 38 Input Features

The ID column was not used as a machine learning feature, since it
is only used for identification and does not provide useful information
for crop yield prediction.

Date and Crop Cycle Features

The dataset also contains time-related and crop-cycle features.

These include:

Sowing Month

Sowing Day

Observation Month

Observation Day

Days Since Sowing

Crop Cycle Progress

These features help the model understand the stage of crop growth and
the time between sowing and observation.

Database Setup

A PostgreSQL database named YieldSenseAI was created for storing
project data.

A normalized database structure was designed instead of storing all
categorical values repeatedly.

The database contains 8 tables:

roles

users

regions

crops

irrigation_types

fertilizer_types

disease_statuses

agricultural_observations

FastAPI Backend Setup

FastAPI was connected with the PostgreSQL database using SQLAlchemy.

A database connection was tested successfully.

A database health endpoint was implemented:

GET /health/db

The endpoint returned:

{
    "status": "ok",
    "database": "connected"
}

This confirmed that the FastAPI backend was successfully connected to
PostgreSQL.

Authentication and Authorization

Basic user authentication was implemented for the backend.

The following features were completed:

User registration

User login

User profile authentication

Password hashing using Argon2

JWT-based authentication

Role-based access control

Two roles were created:

Admin

User

The authentication system was tested using the actual PostgreSQL
database.

Authentication Testing

User registration: Passed

User login: Passed

JWT validation: Passed

/auth/me: Passed

User access control: Passed

Admin access control: Passed

JWT secret configuration was also secured using environment variables
instead of a hardcoded secret.

Challenges Faced

Setting up the Python environment and required packages.

Connecting FastAPI with PostgreSQL and designing the database
structure.

Understanding categorical feature encoding and ML preprocessing.

Implementing and testing JWT authentication and role-based access
control.

Outcome of Milestone 1

Dataset was explored, cleaned, and important features were
identified.

Categorical features were converted into numerical form, resulting
in 38 input features.

PostgreSQL database and an 8-table database schema were
successfully created and deployed.

FastAPI was successfully connected with PostgreSQL and database
health checking was implemented.

User authentication, JWT security, and role-based authorization were
implemented and successfully tested.

Conclusion

Milestone 1 successfully completed the initial dataset preparation and
exploratory analysis.

The PostgreSQL database and FastAPI backend were successfully set up and
connected.

Authentication and role-based authorization were also implemented and
tested successfully.

The project is now ready for the next milestone.

