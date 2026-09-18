import pytest
import torch
from models.gat_gru.model import GATGRUCascadeModel
from models.lstm_baseline.model import LSTMBaselineModel
from models.inference import get_inference_engine
from graph.network import get_adjacency_matrix

def test_gat_gru_forward_pass_and_bounds():
    num_nodes = 10
    seq_len = 12
    in_features = 6
    batch = 2
    
    model = GATGRUCascadeModel(in_features=in_features, spatial_hidden=32, heads=4, gru_hidden=64, num_horizons=3)
    x = torch.randn(batch, num_nodes, seq_len, in_features)
    adj = torch.from_numpy(get_adjacency_matrix()).float()
    
    out = model(x, adj)
    assert out.shape == (batch, num_nodes, 3)
    # Output must be strictly bounded in [0, 1] via Sigmoid
    assert torch.all(out >= 0.0) and torch.all(out <= 1.0)

def test_lstm_baseline_forward_pass_and_bounds():
    num_nodes = 10
    seq_len = 12
    in_features = 6
    batch = 2
    
    model = LSTMBaselineModel(in_features=in_features, hidden_size=64, num_layers=2, num_horizons=3)
    x = torch.randn(batch, num_nodes, seq_len, in_features)
    
    out = model(x)
    assert out.shape == (batch, num_nodes, 3)
    assert torch.all(out >= 0.0) and torch.all(out <= 1.0)

def test_inference_engine_predict_all_sensors():
    engine = get_inference_engine()
    preds = engine.predict_all_sensors()
    assert len(preds) == 10
    assert "717447" in preds
    assert 15 in preds["717447"]
    assert 30 in preds["717447"]
    assert 60 in preds["717447"]
    assert 0.0 <= preds["717447"][15] <= 1.0
