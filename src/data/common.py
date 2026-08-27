import os
import logging
import yaml

# Set up logging format and level
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def get_logger(name):
    """Returns a logger instance with the specified name."""
    return logging.getLogger(name)

logger = get_logger("common")

def get_project_root():
    """Returns the absolute path to the project root directory."""
    # Since this file is in project_root/src/data/common.py
    current_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.abspath(os.path.join(current_dir, "..", ".."))

def load_config():
    """Loads the dataset configuration file configs/datasets.yaml."""
    root = get_project_root()
    config_path = os.path.join(root, "configs", "datasets.yaml")
    logger.info(f"Loading configuration from: {config_path}")
    
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Configuration file not found at {config_path}")
        
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    return config

def get_absolute_path(relative_path):
    """Resolves a relative path (from configs) to an absolute path in the workspace."""
    root = get_project_root()
    return os.path.abspath(os.path.join(root, relative_path))
