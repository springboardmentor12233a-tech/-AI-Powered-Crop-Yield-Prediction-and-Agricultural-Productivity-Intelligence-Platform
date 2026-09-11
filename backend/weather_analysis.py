import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from scipy.stats import pearsonr
import matplotlib.pyplot as plt
import seaborn as sns
import os

# Global cache for the analysis
_analysis_cache = None

def load_historical_weather_analysis(data_path="Smart_Farming_Crop_Yield_2024.csv"):
    global _analysis_cache
    if _analysis_cache is not None:
        return _analysis_cache

    if not os.path.exists(data_path):
        data_path = "../Smart_Farming_Crop_Yield_2024.csv"

    df = pd.read_csv(data_path)
    X = df.drop(columns=['yield_kg_per_hectare'])
    y = df['yield_kg_per_hectare']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)
    
    train_df = X_train.copy()
    train_df['yield_kg_per_hectare'] = y_train

    weather_vars = ['temperature_C', 'rainfall_mm', 'humidity_%', 'sunlight_hours']
    target = 'yield_kg_per_hectare'
    
    overall_mean_yield = train_df[target].mean()

    # 1. Ranges and Bin stats
    ranges = {}
    labels = ['low', 'medium-low', 'medium-high', 'high']
    for var in weather_vars:
        # We use qcut to get quartiles, but catch the bins so we can classify new data
        _, bins = pd.qcut(train_df[var], q=4, labels=labels, duplicates='drop', retbins=True)
        # Overwrite ends to catch out-of-bounds new data
        bins[0] = -np.inf
        bins[-1] = np.inf
        
        # Calculate mean yield for these bins on the training data
        train_df[f'{var}_group'] = pd.cut(train_df[var], bins=bins, labels=labels, include_lowest=True)
        group_stats = train_df.groupby(f'{var}_group', observed=False)[target].mean().to_dict()
        
        ranges[var] = {
            'bins': bins.tolist(),
            'labels': labels,
            'yields': group_stats
        }

    # 2. Crop specific correlations
    crop_correlations = {}
    for crop in train_df['crop_type'].unique():
        crop_df = train_df[train_df['crop_type'] == crop]
        if len(crop_df) > 10:
            corrs = {}
            for var in weather_vars:
                corr, _ = pearsonr(crop_df[var], crop_df[target])
                corrs[var] = corr
            crop_correlations[crop] = corrs

    # 3. Region specific
    region_stats = train_df.groupby('region')[weather_vars + [target]].mean().to_dict('index')

    _analysis_cache = {
        'overall_mean_yield': overall_mean_yield,
        'ranges': ranges,
        'crop_correlations': crop_correlations,
        'region_stats': region_stats
    }
    return _analysis_cache

def assess_weather(crop_type: str, region: str, weather_data: dict, analysis: dict) -> dict:
    weather_vars = {
        'temperature': 'temperature_C',
        'rainfall': 'rainfall_mm',
        'humidity': 'humidity_%',
        'sunlight': 'sunlight_hours'
    }
    
    assessment_result = {}
    overall_mean = analysis['overall_mean_yield']
    
    for pretty_name, var_name in weather_vars.items():
        val = weather_data.get(var_name)
        if val is None:
            continue
            
        # Range assessment
        var_range = analysis['ranges'][var_name]
        bins = var_range['bins']
        labels = var_range['labels']
        yields = var_range['yields']
        
        # Determine which bin the value falls into
        bin_idx = np.digitize(val, bins) - 1
        if bin_idx < 0: bin_idx = 0
        if bin_idx >= len(labels): bin_idx = len(labels) - 1
        
        assigned_label = labels[bin_idx]
        bin_yield = yields[assigned_label]
        
        is_favorable = bin_yield >= overall_mean
        range_assessment = "within the higher-yield observed range" if is_favorable else "within the lower-yield observed range"
        
        # Crop specific
        crop_context = "Limited historical evidence for this crop."
        if crop_type in analysis['crop_correlations']:
            corr = analysis['crop_correlations'][crop_type][var_name]
            if abs(corr) > 0.1:
                direction = "positive" if corr > 0 else "negative"
                crop_context = f"Observed a {direction} historical correlation ({corr:+.3f}) with {crop_type} yield."
            else:
                crop_context = f"Weak historical correlation ({corr:+.3f}) with {crop_type} yield."
        
        assessment_result[pretty_name] = {
            "value": val,
            "assessment": f"Value is historically considered '{assigned_label}', which is {range_assessment}.",
            "historical_context": crop_context
        }
        
    # Overall and Region
    region_context = f"No historical data for region '{region}'."
    if region in analysis['region_stats']:
        r_yield = analysis['region_stats'][region]['yield_kg_per_hectare']
        r_favorable = "higher" if r_yield >= overall_mean else "lower"
        region_context = f"Historically, {region} averages a yield of {r_yield:.0f} kg/ha, which is {r_favorable} than the overall average."
        
    return {
        "crop_type": crop_type,
        "region": region,
        "weather_assessment": assessment_result,
        "overall_assessment": "The provided weather conditions represent historical associations from the training data. Actual yield depends on complex interactions beyond these univariate ranges.",
        "historical_yield_context": f"Overall historical average yield is {overall_mean:.0f} kg/ha. {region_context}",
        "agricultural_insight": "Weather impacts are highly crop-specific. For example, some crops benefit from higher rainfall while others may be harmed by it.",
        "limitations": "Assessment is based on associations observed in the historical training dataset and does not establish causation."
    }

def main():
    # 1. Load data and split
    data_path = "../Smart_Farming_Crop_Yield_2024.csv"
    if not os.path.exists(data_path):
        data_path = "Smart_Farming_Crop_Yield_2024.csv"
        
    df = pd.read_csv(data_path)
    
    X = df.drop(columns=['yield_kg_per_hectare'])
    y = df['yield_kg_per_hectare']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)
    
    train_df = X_train.copy()
    train_df['yield_kg_per_hectare'] = y_train
    
    if 'sowing_date' in train_df.columns:
        train_df['sowing_month'] = pd.to_datetime(train_df['sowing_date']).dt.month
    if 'timestamp' in train_df.columns:
        train_df['observation_month'] = pd.to_datetime(train_df['timestamp']).dt.month
        
    print(f"Total records: {len(df)}")
    print(f"Training records: {len(train_df)}")
    print("-" * 50)
    
    weather_vars = ['temperature_C', 'rainfall_mm', 'humidity_%', 'sunlight_hours']
    target = 'yield_kg_per_hectare'
    
    os.makedirs("weather_plots", exist_ok=True)

    # TASK 1: Basic Weather Statistics
    print("TASK 1: Basic Weather Statistics")
    stats_cols = weather_vars + [target]
    stats = train_df[stats_cols].agg(['mean', 'median', 'min', 'max', 'std']).T
    print(stats.to_string())
    print("-" * 50)
    
    # TASK 2: Weather <-> Yield Relationships
    print("TASK 2: Weather <-> Yield Relationships (Pearson Correlation)")
    correlations = {}
    for var in weather_vars:
        corr, p_value = pearsonr(train_df[var], train_df[target])
        strength = "weak"
        if abs(corr) > 0.3: strength = "moderate"
        if abs(corr) > 0.6: strength = "strong"
        direction = "positive" if corr > 0 else "negative"
        print(f"{var:15s} <-> yield: {corr:+.3f} (p={p_value:.3f}) | {strength} {direction}")
        correlations[var] = corr
    print("-" * 50)

    # TASK 3: Weather Range Analysis
    print("TASK 3: Weather Range Analysis")
    labels = ['low', 'medium-low', 'medium-high', 'high']
    for var in weather_vars:
        train_df[f'{var}_group'] = pd.qcut(train_df[var], q=4, labels=labels, duplicates='drop')
        
        group_stats = train_df.groupby(f'{var}_group', observed=False)[target].agg(
            count='count',
            mean_yield='mean',
            median_yield='median',
            min_yield='min',
            max_yield='max'
        ).reset_index()
        print(f"\nRanges for {var}:")
        print(group_stats.to_string(index=False))
    print("-" * 50)

    # TASK 4: Crop-Specific Weather Analysis
    print("TASK 4: Crop-Specific Weather Analysis")
    crop_stats = train_df.groupby('crop_type')[weather_vars + [target]].mean().reset_index()
    print("Average values by crop:")
    print(crop_stats.to_string(index=False))
    
    print("\nCorrelations by crop:")
    for crop in train_df['crop_type'].unique():
        crop_df = train_df[train_df['crop_type'] == crop]
        if len(crop_df) > 10:
            print(f"Crop: {crop} (n={len(crop_df)})")
            for var in weather_vars:
                corr, _ = pearsonr(crop_df[var], crop_df[target])
                print(f"  {var:15s}: {corr:+.3f}")
    print("-" * 50)

    # TASK 5: Region-Specific Analysis
    print("TASK 5: Region-Specific Analysis")
    region_stats = train_df.groupby('region')[weather_vars + [target]].mean().reset_index()
    print(region_stats.to_string(index=False))
    print("-" * 50)

    # TASK 6: Monthly / Seasonal Analysis
    print("TASK 6: Monthly / Seasonal Analysis")
    if 'sowing_month' in train_df.columns:
        sowing_stats = train_df.groupby('sowing_month')[weather_vars + [target]].mean().reset_index()
        print("\nBy Sowing Month:")
        print(sowing_stats.to_string(index=False))
    if 'observation_month' in train_df.columns:
        obs_stats = train_df.groupby('observation_month')[weather_vars + [target]].mean().reset_index()
        print("\nBy Observation Month:")
        print(obs_stats.to_string(index=False))
    print("-" * 50)

    # TASK 7: Combined Weather Conditions
    print("TASK 7: Combined Weather Conditions")
    print("Correlations of interaction terms with yield:")
    interactions = [
        ('temperature_C', 'rainfall_mm'),
        ('temperature_C', 'humidity_%'),
        ('rainfall_mm', 'humidity_%'),
        ('rainfall_mm', 'sunlight_hours')
    ]
    for v1, v2 in interactions:
        train_df[f'{v1}_x_{v2}'] = train_df[v1] * train_df[v2]
        corr, _ = pearsonr(train_df[f'{v1}_x_{v2}'], train_df[target])
        print(f"{v1} x {v2}: {corr:+.3f}")
        
    train_df['all_weather_prod'] = train_df['temperature_C'] * train_df['rainfall_mm'] * train_df['humidity_%'] * train_df['sunlight_hours']
    corr_all, _ = pearsonr(train_df['all_weather_prod'], train_df[target])
    print(f"Temp x Rain x Hum x Sun: {corr_all:+.3f}")
    print("-" * 50)

    # TASK 8: Weather Impact Score Proposal
    print("TASK 8: Weather Impact Score Proposal")
    print("Let's calculate a simple linear score based on correlations.")
    
    norm_df = train_df.copy()
    for var in weather_vars:
        min_v = norm_df[var].min()
        max_v = norm_df[var].max()
        norm_df[f'{var}_norm'] = (norm_df[var] - min_v) / (max_v - min_v)
        
    score = np.zeros(len(norm_df))
    for var in weather_vars:
        sign = 1 if correlations[var] > 0 else -1
        weight = abs(correlations[var])
        score += sign * weight * norm_df[f'{var}_norm']
        
    norm_df['weather_impact_score'] = score
    score_corr, _ = pearsonr(norm_df['weather_impact_score'], norm_df[target])
    print(f"Correlation of proposed Weather Impact Score with Yield: {score_corr:+.3f}")
    print("-" * 50)

    # TASK 9: Visualizations
    sns.set_theme(style="whitegrid")
    for i, var in enumerate(weather_vars):
        plt.figure(figsize=(8, 6))
        sns.scatterplot(data=train_df, x=var, y=target, alpha=0.6)
        plt.title(f"{var} vs Yield")
        plt.savefig(f"weather_plots/{i+1}_{var}_vs_yield.png")
        plt.close()
        
    for i, var in enumerate(weather_vars):
        plt.figure(figsize=(8, 6))
        sns.barplot(data=train_df, x=f'{var}_group', y=target, estimator=np.mean, errorbar='ci')
        plt.title(f"Average Yield across {var} Bins")
        plt.savefig(f"weather_plots/{i+5}_{var}_bins.png")
        plt.close()
        
    if 'sowing_month' in train_df.columns:
        plt.figure(figsize=(10, 6))
        sns.barplot(data=train_df, x='sowing_month', y=target, estimator=np.mean, errorbar=None)
        plt.title("Average Yield by Sowing Month")
        plt.xticks(rotation=45)
        plt.savefig(f"weather_plots/9_monthly_yield.png")
        plt.close()
        
    plt.figure(figsize=(10, 6))
    sns.barplot(data=train_df, x='crop_type', y=target, estimator=np.mean, errorbar=None)
    plt.title("Average Yield by Crop")
    plt.xticks(rotation=45)
    plt.savefig(f"weather_plots/10_crop_yield.png")
    plt.close()
    
    print("TASK 9: Visualizations saved to 'weather_plots/' directory.")
    print("-" * 50)
    
if __name__ == "__main__":
    main()
