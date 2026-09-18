import pytest
import torch
from models.graph_wavenet.model import GraphWaveNetModel
from models.dcrnn.model import DCRNNModel
from graph.network import get_adjacency_matrix

def test_graph_wavenet_forward_pass_and_bounds():
    num_nodes = 10
    seq_len = 12
    in_features = 6
    batch = 2
    
    model = GraphWaveNetModel(num_nodes=num_nodes, in_features=in_features, hidden_channels=32, num_horizons=3)
    x = torch.randn(batch, num_nodes, seq_len, in_features)
    adj = torch.from_numpy(get_adjacency_matrix()).float()
    
    out = model(x, adj)
    assert out.shape == (batch, num_nodes, 3)
    assert torch.all(out >= 0.0) and torch.all(out <= 1.0)

def test_dcrnn_forward_pass_and_bounds():
    num_nodes = 10
    seq_len = 12
    in_features = 6
    batch = 2
    
    model = DCRNNModel(in_features=in_features, hidden_size=48, num_horizons=3, K=2)
    x = torch.randn(batch, num_nodes, seq_len, in_features)
    adj = torch.from_numpy(get_adjacency_matrix()).float()
    
    out = model(x, adj)
    assert out.shape == (batch, num_nodes, 3)
    assert torch.all(out >= 0.0) and torch.all(out <= 1.0)
