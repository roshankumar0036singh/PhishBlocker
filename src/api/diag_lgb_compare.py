import lightgbm as lgb
import numpy as np
import os

# 1. Check version
print(f"LightGBM Version: {lgb.__version__}")

# 2. Train a tiny model
X = np.random.rand(100, 10)
y = np.random.randint(0, 2, 100)
train_data = lgb.Dataset(X, label=y)
params = {'objective': 'binary', 'verbose': -1}
model = lgb.train(params, train_data, num_boost_round=5)
model.save_model("tiny_model.txt")
print("Tiny model saved.")

# 3. Compare headers
def print_header(path):
    print(f"\n--- Header of {path} ---")
    with open(path, 'r') as f:
        for i in range(10):
            print(f"{i+1}: {f.readline().strip()}")

print_header("tiny_model.txt")
print_header("/app/models/phishblocker_lgb_model.txt")

# 4. Try loading the failing model with a different method
try:
    print("\nAttempting load with Booster(model_str=...)")
    with open("/app/models/phishblocker_lgb_model.txt", "r") as f:
        m_str = f.read()
    m = lgb.Booster(model_str=m_str)
    print("SUCCESS with model_str!")
except Exception as e:
    print(f"FAILED with model_str: {e}")
