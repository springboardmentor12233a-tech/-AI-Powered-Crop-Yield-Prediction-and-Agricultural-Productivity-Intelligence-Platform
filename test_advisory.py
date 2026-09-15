import unittest
from advisory_service import generate_agronomic_report

class TestAdvisoryService(unittest.TestCase):
    def test_generate_agronomic_report(self):
        features = {
            'State': 'California',
            'Crop': 'Almonds',
            'Soil_Type': 'Loam',
            'Fertilizer': 'Urea',
            'N': 120,
            'P': 45,
            'K': 80,
            'Soil_pH': 6.5,
            'Rainfall_mm': 300,
            'Temperature_C': 25
        }
        predicted_yield = 2500.50
        
        report = generate_agronomic_report(features, predicted_yield)
        
        print("--- GENERATED REPORT ---")
        print(report)
        print("------------------------")
        
        if 'Failed to initialize Gemini client' in report:
            self.skipTest("GEMINI_API_KEY not set. Skipping the API call test.")
        
        # Check if the report contains the requested markdown sections
        self.assertIn('### Yield Benchmarking', report)
        self.assertIn('### Soil Health & Nutrient Remediation', report)
        self.assertIn('### Climate Stress Mitigation', report)
        self.assertIn('### Recommended Field Actions', report)
        
        # Ensure that no error message was returned instead
        self.assertNotIn('Failed to initialize Gemini client', report)
        self.assertNotIn('Error generating report', report)

if __name__ == '__main__':
    unittest.main()
