import h5py
import tensorflow as tf
import json
import os
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout

model_path = "/app/models/phishblocker_nn_model.h5"
meta_path = "/app/models/phishblocker_metadata.json"

print("Starting surgical reconstruction test...")

try:
    with open(meta_path, "r") as f:
        meta = json.load(f)
    input_dim = len(meta['feature_names'])
    print(f"Input dimensions from metadata: {input_dim}")

    model = Sequential([
        Dense(64, activation='relu', input_shape=(input_dim,)),
        Dropout(0.2),
        Dense(32, activation='relu'),
        Dense(1, activation='sigmoid')
    ])
    
    model.load_weights(model_path)
    print("✅ SUCCESS: Weights loaded into surgically reconstructed model!")
    model.summary()
    
    # Test a prediction
    import numpy as np
    dummy_input = np.random.rand(1, input_dim)
    output = model.predict(dummy_input)
    print(f"Test prediction output shape: {output.shape}")
    
except Exception as e:
    print(f"❌ FAILED: {e}")
