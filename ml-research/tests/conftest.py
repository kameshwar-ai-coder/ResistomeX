import sys
import os

# Add backend directory to sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Alias app.ai as src for test compatibility
import app.ai as src_module
sys.modules['src'] = src_module
sys.modules['src.data'] = src_module.data
sys.modules['src.modeling'] = src_module.modeling
sys.modules['src.evaluation'] = src_module.evaluation
sys.modules['src.explainability'] = src_module.explainability
sys.modules['src.llm'] = src_module.llm
sys.modules['src.validation'] = src_module.validation
sys.modules['src.analysis'] = src_module.analysis
sys.modules['src.reporting'] = src_module.reporting
sys.modules['src.pipeline'] = src_module.pipeline
