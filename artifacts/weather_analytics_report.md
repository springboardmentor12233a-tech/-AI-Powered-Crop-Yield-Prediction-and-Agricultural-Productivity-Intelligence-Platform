# Weather Analytics & Agro-Meteorological Intelligence Report

## 1. Executive Overview

The YieldSense AI Weather Analytics Module analyzes historical meteorological metrics (Temperature, Relative Humidity, and Precipitation) across both Dataset A and Dataset B to provide crop-specific climate suitability assessments and sensitivity factors.

## 2. Dataset Weather Distributions

### Dataset A (Crop Recommendation - 7,000 Records)

- **Temperature**: Range: 6.11°C to 46.79°C (Mean: 23.49°C, Std: 6.76°C)
- **Humidity**: Range: 6.03% to 99.98% (Mean: 71.32%, Std: 22.29%)
- **Rainfall**: Range: 20.21 mm to 5990.0 mm (Mean: 751.48 mm, Std: 825.47 mm)

### Dataset B (Smart Crop Yield - 10,000 Records)

- **Temperature**: Range: 15.0°C to 35.0°C (Mean: 24.98°C)
- **Humidity**: Range: 30.0% to 90.0% (Mean: 60.05%)
- **Rainfall**: Range: 200.0 mm to 1499.7 mm (Mean: 843.66 mm)

## 3. Crop Climatic Tolerance Profiles (Sample Crops)

| Crop Variety | Temperature Range | Avg Temp | Humidity Range | Avg Humidity | Rainfall Range | Avg Rainfall |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Rice** | 20.0°C - 26.9°C | 23.7°C | 80.1% - 85.0% | 82.3% | 182.6mm - 298.6mm | 236.2 mm |
| **Maize** | 18.0°C - 26.5°C | 22.4°C | 55.3% - 74.8% | 65.1% | 60.7mm - 109.8mm | 84.8 mm |
| **Coffee** | 23.1°C - 27.9°C | 25.5°C | 50.0% - 69.9% | 58.9% | 115.2mm - 199.5mm | 158.1 mm |
| **Tea** | 12.5°C - 14.5°C | 13.5°C | 95.1% - 98.0% | 96.5% | 1000.6mm - 1497.5mm | 1243.4 mm |
| **Jute** | 23.1°C - 27.0°C | 25.0°C | 70.9% - 89.9% | 79.6% | 150.2mm - 199.8mm | 174.8 mm |
| **Cotton** | 22.0°C - 26.0°C | 24.0°C | 75.0% - 84.9% | 79.8% | 60.7mm - 99.9mm | 80.4 mm |
| **Sugarcane** | 27.1°C - 44.8°C | 36.0°C | 45.0% - 64.9% | 54.6% | 3002.7mm - 4484.8mm | 3782.2 mm |
| **Apple** | 21.0°C - 24.0°C | 22.6°C | 90.0% - 94.9% | 92.3% | 100.1mm - 125.0mm | 112.7 mm |

## 4. Key Agronomic Insights & Limitations

1. **Static Historical Analysis**: Weather data analyzed is derived from static project datasets. Real-time live weather feeds require third-party meteorological API integration.
2. **Micro-climate Envelopes**: Extreme tropical crops (e.g., Tea, Jute) thrive in high-humidity (>80%) and high-precipitation (>2,000 mm) regions, whereas arid crops (e.g., Bajra, Mustard) require lower moisture.
3. **Yield Impact**: In Dataset B, weather variables provide baseline growing conditions while management factors (fertilizers, irrigation) account for production variance.
