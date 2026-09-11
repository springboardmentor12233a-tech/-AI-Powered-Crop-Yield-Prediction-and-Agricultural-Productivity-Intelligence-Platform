import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from scipy.stats import pearsonr
import matplotlib.pyplot as plt
import seaborn as sns
import os

_soil_analysis_cache = None

def load_historical_soil_analysis(data_path="Smart_Farming_Crop_Yield_2024.csv"):
    global _soil_analysis_cache
    if _soil_analysis_cache is not None:
        return _soil_analysis_cache

    if not os.path.exists(data_path):
        data_path = "../Smart_Farming_Crop_Yield_2024.csv"

    df = pd.read_csv(data_path)
    X = df.drop(columns=['yield_kg_per_hectare'])
    y = df['yield_kg_per_hectare']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)
    
    train_df = X_train.copy()
    train_df['yield_kg_per_hectare'] = y_train

    soil_vars = ['soil_moisture_%', 'soil_pH']
    target = 'yield_kg_per_hectare'
    
    overall_mean_yield = train_df[target].mean()

    # 1. Ranges and Bin stats
    ranges = {}
    labels = ['low', 'medium-low', 'medium-high', 'high']
    for var in soil_vars:
        _, bins = pd.qcut(train_df[var], q=4, labels=labels, duplicates='drop', retbins=True)
        bins[0] = -np.inf
        bins[-1] = np.inf
        
        train_df[f'{var}_group'] = pd.cut(train_df[var], bins=bins, labels=labels, include_lowest=True)
        group_stats = train_df.groupby(f'{var}_group', observed=False)[target].mean().to_dict()
        
        ranges[var] = {
            'bins': bins.tolist(),
            'labels': labels,
            'yields': group_stats
        }

    # 2. Crop specific correlations & ranges
    crop_stats = {}
    for crop in train_df['crop_type'].unique():
        crop_df = train_df[train_df['crop_type'] == crop]
        if len(crop_df) > 10:
            corrs = {}
            for var in soil_vars:
                corr, _ = pearsonr(crop_df[var], crop_df[target])
                corrs[var] = corr
                
            # Calculate crop-specific ranges (25th and 75th percentiles)
            observed_ranges = {
                var: {
                    'p25': crop_df[var].quantile(0.25),
                    'p75': crop_df[var].quantile(0.75),
                    'median': crop_df[var].median(),
                    'mean_yield': crop_df[target].mean()
                } for var in soil_vars
            }
                
            crop_stats[crop] = {
                'correlations': corrs,
                'observed_ranges': observed_ranges,
                'mean_yield': crop_df[target].mean()
            }

    # 3. Region specific
    region_stats = train_df.groupby('region')[soil_vars + [target]].mean().to_dict('index')

    _soil_analysis_cache = {
        'overall_mean_yield': overall_mean_yield,
        'ranges': ranges,
        'crop_stats': crop_stats,
        'region_stats': region_stats
    }
    return _soil_analysis_cache

def assess_soil_suitability(crop_type: str, region: str, soil_data: dict, analysis: dict) -> dict:
    soil_vars = {
        'soil_moisture': 'soil_moisture_%',
        'soil_pH': 'soil_pH'
    }
    
    assessment_result = {}
    overall_mean = analysis['overall_mean_yield']
    
    for pretty_name, var_name in soil_vars.items():
        val = soil_data.get(var_name)
        if val is None:
            continue
            
        var_range = analysis['ranges'][var_name]
        bins = var_range['bins']
        labels = var_range['labels']
        yields = var_range['yields']
        
        bin_idx = np.digitize(val, bins) - 1
        if bin_idx < 0: bin_idx = 0
        if bin_idx >= len(labels): bin_idx = len(labels) - 1
        
        assigned_label = labels[bin_idx]
        bin_yield = yields[assigned_label]
        
        is_favorable = bin_yield >= overall_mean
        yield_comparison = "an above-average" if is_favorable else "a below-average"
        range_assessment = f"This overall {pretty_name} quartile was associated with {yield_comparison} historical yield in the training data."
        
        crop_context = "Limited historical evidence for this crop."
        if crop_type in analysis['crop_stats']:
            crop_info = analysis['crop_stats'][crop_type]
            corr = crop_info['correlations'][var_name]
            p25 = crop_info['observed_ranges'][var_name]['p25']
            p75 = crop_info['observed_ranges'][var_name]['p75']
            
            direction = "positive" if corr > 0 else "negative"
            corr_text = f"Observed a {direction} historical correlation ({corr:+.3f}) between {pretty_name} and {crop_type} yield." if abs(corr) > 0.1 else f"Weak historical correlation ({corr:+.3f}) with {crop_type} yield."
            
            in_common_range = p25 <= val <= p75
            common_text = f"Value is inside the middle 50% of historically observed {pretty_name} values for {crop_type} ({p25:.1f} - {p75:.1f})." if in_common_range else f"Value is outside the middle 50% of historically observed {pretty_name} values for {crop_type} ({p25:.1f} - {p75:.1f})."
            
            crop_context = f"{common_text} {corr_text}"
        
        assessment_result[pretty_name] = {
            "value": val,
            "assessment": f"Value is in the '{assigned_label}' historical quartile. {range_assessment}",
            "historical_context": crop_context
        }
        
    region_context = f"No historical data for region '{region}'."
    if region in analysis['region_stats']:
        r_yield = analysis['region_stats'][region]['yield_kg_per_hectare']
        r_favorable = "higher" if r_yield >= overall_mean else "lower"
        region_context = f"Historically, {region} averages a yield of {r_yield:.0f} kg/ha, which is {r_favorable} than the overall average."
        
    return {
        "crop_type": crop_type,
        "region": region,
        "soil_suitability_assessment": assessment_result,
        "overall_assessment": "The provided soil conditions represent historical associations from the training data, combining observed quartile yield performance with crop-specific statistical trends.",
        "historical_yield_context": f"Overall historical average yield is {overall_mean:.0f} kg/ha. {region_context}",
        "agricultural_insight": "Soil suitability is crop-specific. P25-P75 ranges indicate typical historical planting conditions, not universal biological optima.",
        "limitations": "Assessment is based on associations observed in the historical training dataset and does not establish causation."
    }

def main():
    data_path = "../Smart_Farming_Crop_Yield_2024.csv"
    if not os.path.exists(data_path):
        data_path = "Smart_Farming_Crop_Yield_2024.csv"
        
    df = pd.read_csv(data_path)
    X = df.drop(columns=['yield_kg_per_hectare'])
    y = df['yield_kg_per_hectare']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)
    
    train_df = X_train.copy()
    train_df['yield_kg_per_hectare'] = y_train
    
    print(f"Total records: {len(df)}")
    print(f"Training records: {len(train_df)}")
    print("-" * 50)
    
    soil_vars = ['soil_moisture_%', 'soil_pH']
    target = 'yield_kg_per_hectare'
    
    os.makedirs("soil_plots", exist_ok=True)

    # TASK 3: Basic Soil Statistics
    print("TASK 3: Basic Soil Statistics")
    stats = train_df[soil_vars].describe().T
    print(stats.to_string())
    print("-" * 50)
    
    # TASK 4: Soil <-> Yield Relationships
    print("TASK 4: Soil <-> Yield Relationships (Pearson Correlation)")
    for var in soil_vars:
        corr, p_value = pearsonr(train_df[var], train_df[target])
        strength = "weak"
        if abs(corr) > 0.3: strength = "moderate"
        if abs(corr) > 0.6: strength = "strong"
        direction = "positive" if corr > 0 else "negative"
        print(f"{var:15s} <-> yield: {corr:+.3f} (p={p_value:.3f}) | {strength} {direction}")
    print("-" * 50)

    # TASK 5: Soil Range Analysis
    print("TASK 5: Soil Range Analysis")
    labels = ['low', 'medium-low', 'medium-high', 'high']
    for var in soil_vars:
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

    # TASK 6: Crop-Specific Soil Analysis
    print("TASK 6: Crop-Specific Soil Analysis")
    crop_stats = train_df.groupby('crop_type')[soil_vars + [target]].mean().reset_index()
    print("Average values by crop:")
    print(crop_stats.to_string(index=False))
    
    print("\nCorrelations by crop:")
    for crop in train_df['crop_type'].unique():
        crop_df = train_df[train_df['crop_type'] == crop]
        if len(crop_df) > 10:
            print(f"Crop: {crop} (n={len(crop_df)})")
            for var in soil_vars:
                corr, _ = pearsonr(crop_df[var], crop_df[target])
                print(f"  {var:15s}: {corr:+.3f}")
    print("-" * 50)

    # TASK 7: Region-Specific Analysis
    print("TASK 7: Region-Specific Soil Analysis")
    region_stats = train_df.groupby('region')[soil_vars + [target]].mean().reset_index()
    print(region_stats.to_string(index=False))
    print("-" * 50)

    # TASK 9: Interactions
    print("TASK 9: Check Interactions")
    train_df['moisture_x_ph'] = train_df['soil_moisture_%'] * train_df['soil_pH']
    corr_int, _ = pearsonr(train_df['moisture_x_ph'], train_df[target])
    print(f"soil_moisture_% x soil_pH <-> yield: {corr_int:+.3f}")
    print("-" * 50)

    # TASK 10: Visualizations
    sns.set_theme(style="whitegrid")
    
    for i, var in enumerate(soil_vars):
        plt.figure(figsize=(8, 6))
        sns.scatterplot(data=train_df, x=var, y=target, alpha=0.6)
        plt.title(f"{var} vs Yield")
        plt.savefig(f"soil_plots/{i+1}_{var}_vs_yield.png")
        plt.close()
        
    for i, var in enumerate(soil_vars):
        plt.figure(figsize=(8, 6))
        sns.barplot(data=train_df, x=f'{var}_group', y=target, estimator=np.mean, errorbar='ci')
        plt.title(f"Average Yield across {var} Bins")
        plt.savefig(f"soil_plots/{i+3}_{var}_bins.png")
        plt.close()
        
    # Crop plots
    for i, var in enumerate(soil_vars):
        plt.figure(figsize=(10, 6))
        sns.barplot(data=train_df, x='crop_type', y=var, estimator=np.mean, errorbar=None)
        plt.title(f"Average {var} by Crop")
        plt.xticks(rotation=45)
        plt.savefig(f"soil_plots/{i+5}_crop_{var}.png")
        plt.close()
        
    # Region plots
    for i, var in enumerate(soil_vars):
        plt.figure(figsize=(10, 6))
        sns.barplot(data=train_df, x='region', y=var, estimator=np.mean, errorbar=None)
        plt.title(f"Average {var} by Region")
        plt.xticks(rotation=45)
        plt.savefig(f"soil_plots/{i+7}_region_{var}.png")
        plt.close()

    print("TASK 10: Visualizations saved to 'soil_plots/' directory.")
    print("-" * 50)
    
if __name__ == "__main__":
    main()
