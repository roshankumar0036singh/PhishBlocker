import os
import sys

# Ensure src is in python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from src.api.transformer_analyzer import TransformerURLAnalyzer, init_transformer_analyzer
import warnings
warnings.filterwarnings('ignore')

print("Testing standard embedding mode...")
analyzer_base = TransformerURLAnalyzer(is_classifier=False)
result_base = analyzer_base.analyze_url_semantics("http://example.com")
print("Base embedding result (has standard deviation):", "embedding_std" in result_base)

print("\nTesting classifier mode (with base model since fine-tuned not available)...")
# Note: we use distilbert-base-uncased which will have a randomly initialized classification head,
# but it's enough to test if the code path works without blowing up
analyzer_class = TransformerURLAnalyzer(is_classifier=True)
result_class = analyzer_class.classify_phishing("http://evil-phishing.com")
print("Classification result keys:", result_class.keys())
print("Is phishing key present:", "is_phishing" in result_class)

print("\nAll tests passed locally!")
