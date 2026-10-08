# YieldSense AI

> Precision Agricultural Crop Yield Prediction and Agronomic Advisory Engine

## Features
- **Machine Learning Inference:** Random Forest Regression predicting metric yield (t/ha) & aggregate production.
- **FastAPI Backend:** Asynchronous endpoints for inference, prediction history, soil profiles, and local weather forecasts.
- **SQLite Database:** Automatic persistent logging of field parameters and model inferences.
- **React Frontend:** Responsive dashboard with dynamic weather widgets and interactive yield forecasts.

## Getting Started

### 1. Train the Machine Learning Pipeline
```bash
python ml/training/train_model.py