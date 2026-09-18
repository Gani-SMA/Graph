"""
Model Inference Manager.
Provides high-level interfaces for loading GAT+GRU model weights and performing
cascade congestion predictions across sensor nodes and forecast horizons.
"""
from typing import Dict, List, Optional
import torch
import numpy as np

from graph.network import DEMO_SENSORS, get_adjacency_matrix, get_sensor_index_map
from models.gat_gru.model import GATGRUCascadeModel

import os

class CascadeInferenceEngine:
    """
    Singleton-style inference engine for GAT+GRU cascade congestion model.
    """
    def __init__(self, checkpoint_path: Optional[str] = None):
        self.num_nodes = len(DEMO_SENSORS)
        self.sensor_map = get_sensor_index_map()
        self.adj_matrix = torch.from_numpy(get_adjacency_matrix()).float()
        
        self.model = GATGRUCascadeModel(in_features=6, spatial_hidden=32, heads=4, gru_hidden=64, num_horizons=3)
        self.model.eval()
        
        default_ckpt = "models/gat_gru/gat_gru_v1.pt"
        path_to_load = checkpoint_path or (default_ckpt if os.path.exists(default_ckpt) else None)
        
        if path_to_load and os.path.exists(path_to_load):
            try:
                self.model.load_state_dict(torch.load(path_to_load, map_location="cpu", weights_only=True))
                print(f"Successfully loaded trained GAT+GRU checkpoint: {path_to_load}")
            except Exception as e:
                print(f"Warning loading checkpoint: {e}")

    def predict_all_sensors(self) -> Dict[str, Dict[int, float]]:
        """
        Runs model inference for all sensors in the bounded subset.
        Returns mapping: sensor_id -> {15: val, 30: val, 60: val}
        """
        # Create standard input tensor [batch=1, num_nodes=10, seq_len=12, in_features=6]
        # Seeded with synthetic baseline features for MVP runtime execution
        dummy_input = torch.full((1, self.num_nodes, 12, 6), fill_value=0.2, dtype=torch.float32)
        
        with torch.no_grad():
            preds = self.model(dummy_input, self.adj_matrix) # [1, num_nodes, 3]
            preds_np = preds.squeeze(0).numpy()
            
        result = {}
        horizons = [15, 30, 60]
        for sensor_id, idx in self.sensor_map.items():
            result[sensor_id] = {
                h: float(preds_np[idx, i]) for i, h in enumerate(horizons)
            }
        return result

    def get_sensor_prediction(self, sensor_id: str) -> Optional[Dict[int, float]]:
        """Returns predictions for a specific sensor, or None if outside mapped graph."""
        all_preds = self.predict_all_sensors()
        return all_preds.get(sensor_id)

_ENGINE_INSTANCE: Optional[CascadeInferenceEngine] = None

def get_inference_engine() -> CascadeInferenceEngine:
    global _ENGINE_INSTANCE
    if _ENGINE_INSTANCE is None:
        _ENGINE_INSTANCE = CascadeInferenceEngine()
    return _ENGINE_INSTANCE
