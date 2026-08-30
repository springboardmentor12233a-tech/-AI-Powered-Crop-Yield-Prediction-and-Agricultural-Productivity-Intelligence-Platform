import os
import json
import pandas as pd
import numpy as np
import matplotlib  # type: ignore
matplotlib.use("Agg")  # Non-interactive background renderer
import matplotlib.pyplot as plt  # type: ignore
import seaborn as sns  # type: ignore

def run_eda():
    print("=" * 60)
    print("YieldSense AI - Automated Exploratory Data Analysis (EDA)")
    print("=" * 60)

    cleaned_csv_path = os.path.join("datasets", "processed", "cleaned_crop_yield.csv")
    plots_dir = "eda_plots"
    metrics_json_path = os.path.join("datasets", "processed", "eda_summary_metrics.json")

    os.makedirs(plots_dir, exist_ok=True)
    os.makedirs(os.path.dirname(metrics_json_path), exist_ok=True)

    print(f"[1/4] Loading cleaned dataset from: {cleaned_csv_path}")
    df = pd.read_csv(cleaned_csv_path)
    total_records = len(df)
    print(f"      Loaded {total_records} records.")

    # Configure plot styling
    sns.set_theme(style="darkgrid")
    plt.rcParams.update({
        "figure.facecolor": "#0d1117",
        "axes.facecolor": "#161b22",
        "axes.edgecolor": "#30363d",
        "axes.labelcolor": "#c9d1d9",
        "xtick.color": "#8b949e",
        "ytick.color": "#8b949e",
        "text.color": "#f0f6fc",
        "grid.color": "#21262d",
        "font.family": "sans-serif"
    })

    print("[2/4] Computing statistical metrics & summary JSON...")
    numeric_cols = ["yield_kg_per_hectare", "rainfall_mm", "soil_pH", "temperature_C", "soil_moisture_%", "NDVI_index", "sunlight_hours", "total_days"]
    stats_dict = {}
    
    for col in numeric_cols:
        if col in df.columns:
            stats_dict[col] = {
                "mean": round(float(df[col].mean()), 2),
                "std": round(float(df[col].std()), 2),
                "min": round(float(df[col].min()), 2),
                "25%": round(float(df[col].quantile(0.25)), 2),
                "median": round(float(df[col].median()), 2),
                "75%": round(float(df[col].quantile(0.75)), 2),
                "max": round(float(df[col].max()), 2)
            }

    # Breakdown by Crop
    crop_stats = {}
    if "crop_type" in df.columns:
        crop_grouped = df.groupby("crop_type")["yield_kg_per_hectare"].agg(["count", "mean", "std", "min", "max"]).reset_index()
        for idx, row in crop_grouped.iterrows():
            crop_stats[row["crop_type"]] = {
                "count": int(row["count"]),
                "avg_yield": round(float(row["mean"]), 2),
                "std_yield": round(float(row["std"]), 2),
                "min_yield": round(float(row["min"]), 2),
                "max_yield": round(float(row["max"]), 2)
            }

    # Summary Payload
    summary_payload = {
        "total_records": total_records,
        "overall_stats": stats_dict,
        "crop_breakdown": crop_stats,
        "top_crop_by_yield": max(crop_stats.items(), key=lambda x: x[1]["avg_yield"])[0] if crop_stats else "N/A"
    }

    with open(metrics_json_path, "w", encoding="utf-8") as f:
        json.dump(summary_payload, f, indent=2)
    print(f"      Saved statistical summary JSON to: {metrics_json_path}")

    print("[3/4] Generating visual EDA charts...")

    # Chart 1: Yield Distribution
    fig, ax = plt.subplots(figsize=(9, 5))
    sns.histplot(df["yield_kg_per_hectare"], kde=True, color="#2ea043", bins=25, ax=ax)
    ax.set_title("YieldSense AI - Crop Yield Distribution (kg/ha)", fontsize=14, fontweight="bold", pad=12, color="#2ea043")
    ax.set_xlabel("Crop Yield (kg/hectare)", fontsize=11)
    ax.set_ylabel("Farm Count", fontsize=11)
    plt.tight_layout()
    plt.savefig(os.path.join(plots_dir, "yield_distribution.png"), dpi=200)
    plt.close()
    print("      [+] Created eda_plots/yield_distribution.png")

    # Chart 2: Yield by Crop Type
    fig, ax = plt.subplots(figsize=(9, 5))
    sns.boxplot(data=df, x="crop_type", y="yield_kg_per_hectare", hue="crop_type", palette="viridis", legend=False, ax=ax)
    ax.set_title("YieldSense AI - Yield Comparison by Crop Type", fontsize=14, fontweight="bold", pad=12, color="#58a6ff")
    ax.set_xlabel("Crop Type", fontsize=11)
    ax.set_ylabel("Yield (kg/hectare)", fontsize=11)
    plt.tight_layout()
    plt.savefig(os.path.join(plots_dir, "yield_by_crop.png"), dpi=200)
    plt.close()
    print("      [+] Created eda_plots/yield_by_crop.png")

    # Chart 3: Rainfall vs Yield
    fig, ax = plt.subplots(figsize=(9, 5))
    sns.regplot(data=df, x="rainfall_mm", y="yield_kg_per_hectare",
                scatter_kws={"alpha": 0.6, "color": "#1f6beb"},
                line_kws={"color": "#f85149", "linewidth": 2}, ax=ax)
    ax.set_title("YieldSense AI - Seasonal Rainfall (mm) vs. Crop Yield", fontsize=14, fontweight="bold", pad=12, color="#1f6beb")
    ax.set_xlabel("Rainfall (mm)", fontsize=11)
    ax.set_ylabel("Yield (kg/hectare)", fontsize=11)
    plt.tight_layout()
    plt.savefig(os.path.join(plots_dir, "rainfall_vs_yield.png"), dpi=200)
    plt.close()
    print("      [+] Created eda_plots/rainfall_vs_yield.png")

    # Chart 4: Soil pH vs Yield
    fig, ax = plt.subplots(figsize=(9, 5))
    sns.scatterplot(data=df, x="soil_pH", y="yield_kg_per_hectare", hue="crop_type", palette="Set2", s=70, alpha=0.8, ax=ax)
    ax.set_title("YieldSense AI - Soil pH Impact on Crop Yield", fontsize=14, fontweight="bold", pad=12, color="#d2a8ff")
    ax.set_xlabel("Soil pH", fontsize=11)
    ax.set_ylabel("Yield (kg/hectare)", fontsize=11)
    ax.legend(title="Crop", facecolor="#161b22", edgecolor="#30363d")
    plt.tight_layout()
    plt.savefig(os.path.join(plots_dir, "soil_pH_vs_yield.png"), dpi=200)
    plt.close()
    print("      [+] Created eda_plots/soil_pH_vs_yield.png")

    # Chart 5: Correlation Heatmap
    fig, ax = plt.subplots(figsize=(9, 7))
    corr = df[numeric_cols].corr()
    sns.heatmap(corr, annot=True, fmt=".2f", cmap="mako", linewidths=0.5, cbar_kws={"label": "Correlation"}, ax=ax)
    ax.set_title("YieldSense AI - Multi-Feature Correlation Matrix", fontsize=14, fontweight="bold", pad=12, color="#79c0ff")
    plt.tight_layout()
    plt.savefig(os.path.join(plots_dir, "correlation_heatmap.png"), dpi=200)
    plt.close()
    print("      [+] Created eda_plots/correlation_heatmap.png")

    print("=" * 60)
    print("SUCCESS: Exploratory Data Analysis Complete.")
    print("=" * 60)

if __name__ == "__main__":
    run_eda()
