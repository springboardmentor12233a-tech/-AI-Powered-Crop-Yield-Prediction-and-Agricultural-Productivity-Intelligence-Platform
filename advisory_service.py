import os
from google import genai
from dotenv import load_dotenv

def generate_agronomic_report(features: dict, predicted_yield: float) -> str:
    """
    Generates a structured agronomic advisory report using Gemini.
    """
    # Load environment variables from .env file
    load_dotenv()
    
    # Initialize the client. It will automatically pick up GEMINI_API_KEY from environment variables.
    try:
        client = genai.Client()
    except Exception as e:
        return f"Failed to initialize Gemini client. Ensure GEMINI_API_KEY is set. Error: {e}"

    prompt = f"""
You are an expert Agronomist AI. I have run a predictive model for a farm with the following characteristics:
- State: {features.get('State')}
- Crop: {features.get('Crop')}
- Soil Type: {features.get('Soil_Type')}
- Fertilizer Used: {features.get('Fertilizer')}
- N-P-K (Nitrogen, Phosphorus, Potassium): {features.get('N')} - {features.get('P')} - {features.get('K')}
- Soil pH: {features.get('Soil_pH')}
- Rainfall (mm): {features.get('Rainfall_mm')}
- Temperature (C): {features.get('Temperature_C')}

The champion predictive model has forecast a yield of {predicted_yield:.2f} kg per acre.

Please provide a highly structured advisory report with the following EXACT sections in Markdown format:
### Yield Benchmarking
(Provide a brief comparison of {predicted_yield:.2f} kg/acre against regional/national averages for {features.get('Crop')}. Discuss if it is optimal.)

### Soil Health & Nutrient Remediation
(Analyze the provided NPK values ({features.get('N')}-{features.get('P')}-{features.get('K')}) and Soil pH ({features.get('Soil_pH')}). Suggest specific remediation or adjustments based on Liebig's Law of the Minimum.)

### Climate Stress Mitigation
(Analyze the Temperature ({features.get('Temperature_C')} C) and Rainfall ({features.get('Rainfall_mm')} mm). Suggest water management and temperature stress mitigation strategies.)

### Recommended Field Actions
(Provide 3-5 actionable, bulleted steps the farmer should take next to achieve or exceed the predicted yield.)

Keep the tone professional, scientific, yet accessible to a farm manager.
"""
    try:
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt,
        )
        return response.text
    except Exception as e:
        return f"Error generating report: {e}"
