"""
Road network graph topology definition for the bounded METR-LA sensor subset.
Defines sensor nodes, geographic coordinates, adjacency matrix, and PyTorch Geometric edge_index.
"""
from typing import Dict, List, Tuple
import numpy as np

# Bounded road network subset (METR-LA key sensors)
DEMO_SENSORS: List[str] = [
    "717447", "717512", "717446", "717445", "717458",
    "717459", "717460", "717461", "717462", "717463"
]

# Geographic locations for demo subset sensors (lat, lng)
SENSOR_COORDINATES: Dict[str, Tuple[float, float]] = {
    "717447": (34.0522, -118.2437),
    "717512": (34.0560, -118.2480),
    "717446": (34.0600, -118.2520),
    "717445": (34.0640, -118.2560),
    "717458": (34.0680, -118.2600),
    "717459": (34.0535, -118.2450),
    "717460": (34.0585, -118.2500),
    "717461": (34.0625, -118.2540),
    "717462": (34.0665, -118.2580),
    "717463": (34.0700, -118.2620),
}

# Directed edges representing physical road connections (source_sensor -> target_sensor)
EDGES: List[Tuple[str, str, float]] = [
    ("717447", "717512", 0.8),
    ("717512", "717446", 0.9),
    ("717446", "717445", 0.7),
    ("717445", "717458", 1.1),
    ("717447", "717459", 0.5),
    ("717459", "717460", 0.8),
    ("717460", "717461", 0.9),
    ("717461", "717462", 0.7),
    ("717462", "717463", 1.0),
    ("717460", "717446", 0.6),  # Cross-corridor connecting edge
]

def get_sensor_index_map() -> Dict[str, int]:
    """Returns mapping from sensor_id to integer node index."""
    return {sensor_id: idx for idx, sensor_id in enumerate(DEMO_SENSORS)}

def build_edge_index() -> List[List[int]]:
    """
    Returns edge_index in PyTorch Geometric format [2, num_edges].
    """
    mapping = get_sensor_index_map()
    sources = [mapping[src] for src, tgt, _ in EDGES if src in mapping and tgt in mapping]
    targets = [mapping[tgt] for src, tgt, _ in EDGES if src in mapping and tgt in mapping]
    return [sources, targets]

def get_adjacency_matrix() -> np.ndarray:
    """Returns binary adjacency matrix [num_nodes, num_nodes]."""
    num_nodes = len(DEMO_SENSORS)
    adj = np.zeros((num_nodes, num_nodes), dtype=np.float32)
    mapping = get_sensor_index_map()
    for src, tgt, dist in EDGES:
        if src in mapping and tgt in mapping:
            adj[mapping[src], mapping[tgt]] = 1.0
    return adj
