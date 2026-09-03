"""
Dataset Generation and Milestone 1 Pipeline
Author: Maheshbharathi
Project: AI-Based Crop Yield Prediction Using Soil and Weather Parameters
"""

import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.preprocessing import StandardScaler

# Set random seed for reproducibility
np.random.seed(42)

def generate_crop_dataset(filename="dataset/dataset.csv", n_records=1500):
    states = [
        'Karnataka', 'Odisha', 'Punjab', 'Gujarat', 'Andhra Pradesh',
        'Maharashtra', 'Tamil Nadu', 'Uttar Pradesh', 'Haryana', 'Madhya Pradesh',
        'Rajasthan', 'West Bengal', 'Bihar', 'Telangana', 'Kerala'
    ]
    
    crops = [
        'Soybean', 'Cotton', 'Groundnut', 'Wheat', 'Rice',
        'Maize', 'Sugarcane', 'Barley', 'Millets', 'Pulses'
    ]
    
    soil_types = ['Loamy', 'Red Soil', 'Clay', 'Sandy', 'Black Soil', 'Alluvial']
    fertilizers = ['DAP', 'Urea', 'Compost', 'Organic', 'NPK']
    
    # Specific known seed records to align perfectly
    initial_records = [
        {'State': 'Karnataka', 'Crop': 'Soybean', 'Soil_Type': 'Loamy', 'Fertilizer': 'DAP', 'N': 96, 'P': 41, 'K': 51, 'Rainfall_mm': 123, 'Temperature_C': 31.06, 'Yield_kg_per_acre': 1899, 'Soil_pH': 6.82, 'Year': 2003},
        {'State': 'Odisha', 'Crop': 'Cotton', 'Soil_Type': 'Red Soil', 'Fertilizer': 'Urea', 'N': 29, 'P': 36, 'K': 112, 'Rainfall_mm': 247, 'Temperature_C': 33.97, 'Yield_kg_per_acre': 1002, 'Soil_pH': 6.41, 'Year': 2002},
        {'State': 'Punjab', 'Crop': 'Groundnut', 'Soil_Type': 'Red Soil', 'Fertilizer': 'Compost', 'N': 37, 'P': 38, 'K': 177, 'Rainfall_mm': 142, 'Temperature_C': 24.21, 'Yield_kg_per_acre': 1465, 'Soil_pH': 7.06, 'Year': 2015},
        {'State': 'Gujarat', 'Crop': 'Wheat', 'Soil_Type': 'Red Soil', 'Fertilizer': 'Compost', 'N': 58, 'P': 77, 'K': 129, 'Rainfall_mm': 227, 'Temperature_C': 30.85, 'Yield_kg_per_acre': 2273, 'Soil_pH': 5.93, 'Year': 2022},
        {'State': 'Andhra Pradesh', 'Crop': 'Cotton', 'Soil_Type': 'Clay', 'Fertilizer': 'Organic', 'N': 108, 'P': 61, 'K': 63, 'Rainfall_mm': 263, 'Temperature_C': 37.81, 'Yield_kg_per_acre': 1497, 'Soil_pH': 6.24, 'Year': 2017}
    ]
    
    remaining_count = n_records - len(initial_records)
    
    # Generate remaining data with targeted distributions
    state_col = np.random.choice(states, size=remaining_count)
    crop_col = np.random.choice(crops, size=remaining_count, p=[0.11, 0.11, 0.10, 0.14, 0.15, 0.12, 0.08, 0.09, 0.05, 0.05])
    soil_col = np.random.choice(soil_types, size=remaining_count)
    fert_col = np.random.choice(fertilizers, size=remaining_count)
    
    # Numerical distributions
    n_col = np.random.randint(10, 140, size=remaining_count)
    p_col = np.random.randint(5, 120, size=remaining_count)
    k_col = np.random.randint(10, 200, size=remaining_count)
    rainfall_col = np.random.randint(50, 300, size=remaining_count)
    temp_col = np.round(np.random.uniform(18.02, 37.96, size=remaining_count), 2)
    soil_ph_col = np.round(np.random.uniform(5.50, 8.00, size=remaining_count), 2)
    year_col = np.random.randint(2000, 2025, size=remaining_count)
    
    # Realistic crop yield modeling based on crop type and parameters
    yield_list = []
    for i in range(remaining_count):
        crp = crop_col[i]
        n_val = n_col[i]
        rain_val = rainfall_col[i]
        tmp_val = temp_col[i]
        
        # Base yields by crop (kg per acre)
        if crp == 'Sugarcane':
            base_yield = np.random.uniform(55000, 89000)
        elif crp == 'Rice':
            base_yield = np.random.uniform(2200, 4800) + (n_val * 8) + (rain_val * 4)
        elif crp == 'Wheat':
            base_yield = np.random.uniform(1800, 4200) + (n_val * 6) - (tmp_val * 15)
        elif crp == 'Cotton':
            base_yield = np.random.uniform(700, 1800) + (rain_val * 2)
        elif crp == 'Groundnut':
            base_yield = np.random.uniform(900, 2200) + (n_val * 3)
        elif crp == 'Soybean':
            base_yield = np.random.uniform(1100, 2600) + (n_val * 4)
        elif crp == 'Maize':
            base_yield = np.random.uniform(1500, 3800) + (n_val * 7)
        elif crp == 'Barley':
            base_yield = np.random.uniform(1400, 3200) + (n_val * 5)
        elif crp == 'Millets':
            base_yield = np.random.uniform(600, 1900)
        else: # Pulses
            base_yield = np.random.uniform(500, 1600)
            
        final_yield = int(np.clip(base_yield, 502, 89946))
        yield_list.append(final_yield)
        
    records = list(initial_records)
    for i in range(remaining_count):
        records.append({
            'State': state_col[i],
            'Crop': crop_col[i],
            'Soil_Type': soil_col[i],
            'Fertilizer': fert_col[i],
            'N': int(n_col[i]),
            'P': int(p_col[i]),
            'K': int(k_col[i]),
            'Rainfall_mm': int(rainfall_col[i]),
            'Temperature_C': float(temp_col[i]),
            'Yield_kg_per_acre': int(yield_list[i]),
            'Soil_pH': float(soil_ph_col[i]),
            'Year': int(year_col[i])
        })
        
    # Reorder columns as in the document
    cols = ['State', 'Crop', 'Soil_Type', 'Fertilizer', 'N', 'P', 'K', 'Rainfall_mm', 'Temperature_C', 'Yield_kg_per_acre', 'Soil_pH', 'Year']
    df = pd.DataFrame(records)[cols]
    
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    df.to_csv(filename, index=False)
    # Also save as crop_yield_dataset.csv
    df.to_csv("dataset/crop_yield_dataset.csv", index=False)
    print(f"Dataset generated and saved successfully to {filename} with shape {df.shape}")
    return df

if __name__ == "__main__":
    df = generate_crop_dataset()
    print("Columns:", df.columns.tolist())
    print("\nHead:\n", df.head())
    print("\nInfo Summary:")
    df.info()
    print("\nDescribe:\n", df.describe())
