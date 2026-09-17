import pandas as pd
from catboost import CatBoostRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

df = pd.read_csv("../dataset/soil_weather_yield_train.csv")

# Target
y = df["yield_tpha"]

# Remove ID and farming-input columns
X = df.drop(
    columns=[
        "yield_tpha",
        "id",
        "field_id",
        "harvest_date",
        "fertilizer_amount",
        "pesticide_usage"
    ]
)

categorical_features = ["crop_type", "region", "season"]

cat_indices = [
    X.columns.get_loc(col)
    for col in categorical_features
]

X_train, X_val, y_train, y_val = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42
)

model = CatBoostRegressor(
    iterations=1000,
    depth=7,
    learning_rate=0.05,
    loss_function="RMSE",
    random_seed=42,
    verbose=100
)

model.fit(
    X_train,
    y_train,
    cat_features=cat_indices,
    eval_set=(X_val, y_val),
    early_stopping_rounds=100
)

pred = model.predict(X_val)

mae = mean_absolute_error(y_val, pred)
rmse = mean_squared_error(y_val, pred) ** 0.5
r2 = r2_score(y_val, pred)

print("\n==============================")
print("WITHOUT FERTILIZER & PESTICIDE")
print("==============================")
print(f"MAE  : {mae:.4f}")
print(f"RMSE : {rmse:.4f}")
print(f"R²   : {r2:.4f}")