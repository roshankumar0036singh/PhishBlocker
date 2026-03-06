import sys
import os
import json
import traceback

# Add src/api to path
sys.path.append("/app/api")
sys.path.append("/app")

print(f"Python path: {sys.path}")

try:
    import tensorflow as tf
    print(f"TF Version: {tf.__version__}")
    
    from api.phishing_model import PhishingDetectionEnsemble
    
    detector = PhishingDetectionEnsemble()
    models_path = "/app/models/"
    
    print(f"Attempting to load models from {models_path}")
    detector.load_models(models_path)
    print("SUCCESS: Full load_models completed.")
    
except Exception as e:
    print("\n--- ERROR DETECTED ---")
    print(f"Error Type: {type(e)}")
    print(f"Error Message: {e}")
    traceback.print_exc()
    print("----------------------")
