import tensorflow as tf
import tf2onnx
import onnx
import os
import sys

# Ensure we are in the project root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def export_to_onnx(h5_path='models/phishblocker_nn_model.h5', onnx_path='models/url_classifier.onnx'):
    """
    Converts a Keras .h5 model to ONNX format
    """
    print(f"Neural Export: Initiating conversion of {h5_path}...")
    
    if not os.path.exists(h5_path):
        print(f"Error: Source model {h5_path} not found.")
        return False
        
    try:
        # Load the Keras model
        print("Neural Export: Loading Keras weights...")
        model = tf.keras.models.load_model(h5_path, compile=False)
        
        # Save to temporary SavedModel format
        temp_saved_model = "models/temp_neural_export"
        print(f"Neural Export: Serializing to {temp_saved_model}...")
        model.export(temp_saved_model)
        
        # Convert SavedModel to ONNX using subprocess for maximum isolation
        print("Neural Export: Transforming SavedModel to ONNX graph...")
        import subprocess
        
        cmd = [
            sys.executable, "-m", "tf2onnx.convert",
            "--saved-model", temp_saved_model,
            "--output", onnx_path,
            "--opset", "13"
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"Neural Export Error: {result.stderr}")
            return False
            
        # Cleanup
        import shutil
        if os.path.exists(temp_saved_model):
            shutil.rmtree(temp_saved_model)
            
        print(f"Neural Export: Finalizing {onnx_path}...")
        return True
        
    except Exception as e:
        print(f"Neural Export Error: {str(e)}")
        return False

if __name__ == "__main__":
    success = export_to_onnx()
    if success:
        # Also copy to extension public folder if it exists
        ext_model_dir = 'extension-react/public/models'
        os.makedirs(ext_model_dir, exist_ok=True)
        import shutil
        shutil.copy2('models/url_classifier.onnx', os.path.join(ext_model_dir, 'url_classifier.onnx'))
        print(f"Neural Export: Asset mirrored to {ext_model_dir}")
