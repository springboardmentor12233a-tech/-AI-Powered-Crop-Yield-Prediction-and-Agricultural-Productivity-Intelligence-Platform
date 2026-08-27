import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Ensure output directory exists
output_dir = r"c:\Users\user\Downloads\AI-Powered-Crop-Yield-Prediction-and-Agricultural-Productivity-Intelligence-Platform\artifacts\eda"
os.makedirs(output_dir, exist_ok=True)

print("Starting Exploratory Data Analysis (EDA)...")

# Define processed paths
rec_path = r"c:\Users\user\Downloads\AI-Powered-Crop-Yield-Prediction-and-Agricultural-Productivity-Intelligence-Platform\data\processed\crop_recommendation_cleaned.csv"
yield_path = r"c:\Users\user\Downloads\AI-Powered-Crop-Yield-Prediction-and-Agricultural-Productivity-Intelligence-Platform\data\processed\smart_crop_yield_cleaned.csv"

# Load datasets
df_rec = pd.read_csv(rec_path)
df_yield = pd.read_csv(yield_path)

# ==========================================
# DATASET A: CROP RECOMMENDATION PLOTS
# ==========================================
print("Generating plots for Dataset A (Crop Recommendation)...")

# 1. Class Distribution (Top 20 and overall check)
plt.figure(figsize=(10, 6))
class_counts = df_rec['Label'].value_counts()
class_counts.head(20).plot(kind='bar', color='#4CAF50')
plt.title("Crop Recommendation - Label Distribution (Top 20 Crops)")
plt.xlabel("Crop Label")
plt.ylabel("Number of Records")
plt.xticks(rotation=45, ha='right')
plt.tight_layout()
plt.savefig(os.path.join(output_dir, "dataset_a_class_distribution.png"), dpi=150)
plt.close()

# 2. Distributions of Environmental Features (pH, Temperature, Humidity, Rainfall)
fig, axes = plt.subplots(2, 2, figsize=(14, 10))
features = ['Temperature', 'Humidity', 'pH', 'Rainfall']
colors = ['#FF9800', '#2196F3', '#9C27B0', '#00BCD4']
titles = ['Temperature (°C)', 'Humidity (%)', 'Soil pH', 'Rainfall (mm)']

for ax, col, color, title in zip(axes.flatten(), features, colors, titles):
    ax.hist(df_rec[col], bins=30, color=color, edgecolor='black', alpha=0.7)
    ax.set_title(f"Distribution of {title}")
    ax.set_xlabel(title)
    ax.set_ylabel("Frequency")
    ax.grid(True, linestyle='--', alpha=0.5)

plt.suptitle("Dataset A - Environmental Features Distributions", fontsize=16, weight='bold')
plt.tight_layout()
plt.savefig(os.path.join(output_dir, "dataset_a_features_distributions.png"), dpi=150)
plt.close()

# 3. Correlation Analysis for Dataset A
plt.figure(figsize=(8, 6))
corr_matrix_a = df_rec[features].corr()
im = plt.imshow(corr_matrix_a, cmap='coolwarm', vmin=-1, vmax=1)
plt.colorbar(im)
plt.xticks(range(len(features)), features, rotation=45)
plt.yticks(range(len(features)), features)
# Add text labels on cells
for i in range(len(features)):
    for j in range(len(features)):
        plt.text(j, i, f"{corr_matrix_a.iloc[i, j]:.2f}", ha="center", va="center", color="black" if abs(corr_matrix_a.iloc[i, j]) < 0.6 else "white")
plt.title("Dataset A - Correlation Matrix Heatmap")
plt.tight_layout()
plt.savefig(os.path.join(output_dir, "dataset_a_correlation.png"), dpi=150)
plt.close()


# ==========================================
# DATASET B: SMART CROP YIELD PLOTS
# ==========================================
print("Generating plots for Dataset B (Smart Crop Yield)...")

# 1. Yield Distribution
plt.figure(figsize=(8, 5))
plt.hist(df_yield['Yield_ton_per_ha'], bins=30, color='#673AB7', edgecolor='black', alpha=0.7)
plt.title("Dataset B - Yield Distribution (ton/ha)")
plt.xlabel("Yield (ton/ha)")
plt.ylabel("Frequency")
plt.grid(True, linestyle='--', alpha=0.5)
plt.tight_layout()
plt.savefig(os.path.join(output_dir, "dataset_b_yield_distribution.png"), dpi=150)
plt.close()

# 2. Yield by Crop (Boxplot)
plt.figure(figsize=(8, 5))
crops = df_yield['Crop'].unique()
data_to_plot = [df_yield[df_yield['Crop'] == crop]['Yield_ton_per_ha'] for crop in crops]
plt.boxplot(data_to_plot, labels=crops, patch_artist=True, 
            boxprops=dict(facecolor='#E91E63', color='black'),
            medianprops=dict(color='white', linewidth=2))
plt.title("Dataset B - Yield Distribution by Crop Type")
plt.xlabel("Crop Type")
plt.ylabel("Yield (ton/ha)")
plt.grid(True, linestyle='--', alpha=0.3)
plt.tight_layout()
plt.savefig(os.path.join(output_dir, "dataset_b_yield_by_crop.png"), dpi=150)
plt.close()

# 3. Yield vs Environment (Rainfall, Temperature, Humidity, Soil pH)
fig, axes = plt.subplots(2, 2, figsize=(14, 10))
env_cols = ['Rainfall_mm', 'Temperature_C', 'Humidity_pct', 'Soil_pH']
env_labels = ['Rainfall (mm)', 'Temperature (°C)', 'Humidity (%)', 'Soil pH']
env_colors = ['#03A9F4', '#FF5722', '#4CAF50', '#9C27B0']

for ax, col, label, color in zip(axes.flatten(), env_cols, env_labels, env_colors):
    ax.scatter(df_yield[col], df_yield['Yield_ton_per_ha'], color=color, alpha=0.15, edgecolors='none')
    ax.set_title(f"Yield vs {label}")
    ax.set_xlabel(label)
    ax.set_ylabel("Yield (ton/ha)")
    ax.grid(True, linestyle='--', alpha=0.5)

plt.suptitle("Dataset B - Yield vs Environmental Features", fontsize=16, weight='bold')
plt.tight_layout()
plt.savefig(os.path.join(output_dir, "dataset_b_yield_vs_environment.png"), dpi=150)
plt.close()

# 4. Yield vs Agricultural Management (Fertilizer, Pesticides, Planting Density)
fig, axes = plt.subplots(1, 3, figsize=(18, 5))
mgt_cols = ['Fertilizer_Used_kg', 'Pesticides_Used_kg', 'Planting_Density']
mgt_labels = ['Fertilizer Used (kg)', 'Pesticides Used (kg)', 'Planting Density (plants/m²)']
mgt_colors = ['#8BC34A', '#795548', '#FFEB3B']

for ax, col, label, color in zip(axes.flatten(), mgt_cols, mgt_labels, mgt_colors):
    ax.scatter(df_yield[col], df_yield['Yield_ton_per_ha'], color=color, alpha=0.15, edgecolors='none')
    ax.set_title(f"Yield vs {label}")
    ax.set_xlabel(label)
    ax.set_ylabel("Yield (ton/ha)")
    ax.grid(True, linestyle='--', alpha=0.5)

plt.suptitle("Dataset B - Yield vs Agricultural Management Features", fontsize=14, weight='bold')
plt.tight_layout()
plt.savefig(os.path.join(output_dir, "dataset_b_yield_vs_management.png"), dpi=150)
plt.close()

# 5. Correlation Heatmap for Dataset B
plt.figure(figsize=(10, 8))
num_cols_b = df_yield.select_dtypes(include=[np.number]).columns.tolist()
corr_matrix_b = df_yield[num_cols_b].corr()
im = plt.imshow(corr_matrix_b, cmap='coolwarm', vmin=-1, vmax=1)
plt.colorbar(im)
plt.xticks(range(len(num_cols_b)), num_cols_b, rotation=90)
plt.yticks(range(len(num_cols_b)), num_cols_b)

# Add text labels on cells
for i in range(len(num_cols_b)):
    for j in range(len(num_cols_b)):
        plt.text(j, i, f"{corr_matrix_b.iloc[i, j]:.2f}", ha="center", va="center", 
                 color="black" if abs(corr_matrix_b.iloc[i, j]) < 0.6 else "white", fontsize=8)
                 
plt.title("Dataset B - Numerical Features Correlation Matrix")
plt.tight_layout()
plt.savefig(os.path.join(output_dir, "dataset_b_correlation.png"), dpi=150)
plt.close()

print("EDA plots generated successfully and saved in artifacts/eda/")
