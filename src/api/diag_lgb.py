import lightgbm as lgb
import os

model_path = "/app/models/phishblocker_lgb_model.txt"
print(f"Testing LightGBM load from: {model_path}")

try:
    if os.path.exists(model_path):
        print(f"File size: {os.path.getsize(model_path)} bytes")
        # Try loading
        model = lgb.Booster(model_file=model_path)
        print("SUCCESS: LightGBM model loaded!")
        print(f"Number of features: {model.num_feature()}")
    else:
        print("Error: File does not exist.")
except Exception as e:
    print("\n--- LightGBM ERROR ---")
    print(f"Message: {e}")
    import traceback
    traceback.print_exc()
