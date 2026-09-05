import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
IMG_DIR = PROJECT_ROOT / "docs" / "images"
IMG_DIR.mkdir(parents=True, exist_ok=True)

csv_path = PROJECT_ROOT / "dataset" / "processed" / "models_comparison.csv"
df = pd.read_csv(csv_path).set_index("Model")

# 1. Bar plot of R2 and RMSE
fig, axes = plt.subplots(1, 2, figsize=(14, 5))
sns.set_theme(style="whitegrid")

# R2 Score
sns.barplot(x=df.index, y=df['test_r2'], ax=axes[0], palette='Blues_r')
axes[0].set_title('Test R² Score Comparison', fontsize=13, fontweight='bold')
axes[0].set_ylabel('Test R² Score')
for p in axes[0].patches:
    h = p.get_height()
    axes[0].annotate(f'{h:.4f}', (p.get_x() + p.get_width() / 2., h),
                     ha='center', va='bottom' if h >= 0 else 'top', fontsize=10, xytext=(0, 3 if h >= 0 else -10), textcoords='offset points')

# RMSE
sns.barplot(x=df.index, y=df['test_rmse'], ax=axes[1], palette='Oranges_r')
axes[1].set_title('Test RMSE Comparison (kg/acre)', fontsize=13, fontweight='bold')
axes[1].set_ylabel('Root Mean Squared Error')
for p in axes[1].patches:
    h = p.get_height()
    axes[1].annotate(f'{h:.1f}', (p.get_x() + p.get_width() / 2., h),
                     ha='center', va='bottom', fontsize=10, xytext=(0, 3), textcoords='offset points')

plt.tight_layout()
plt.savefig(IMG_DIR / "milestone2_models_comparison.png", dpi=300)
plt.close()

print(f"[+] Saved comparison charts to {IMG_DIR / 'milestone2_models_comparison.png'}")
