"""
Diffusion Convolutional Recurrent Neural Network (DCRNN) Reference Model (dcrnn_v1).
Models traffic flow as a diffusion process on a directed graph.
Used as an alternative stronger baseline (Phase 2).
"""
import torch
import torch.nn as nn
import torch.nn.functional as F

class DiffusionConv(nn.Module):
    """
    Diffusion Graph Convolution layer using K-step random walk diffusion.
    """
    def __init__(self, in_features: int, out_features: int, K: int = 2):
        super().__init__()
        self.K = K
        self.weights = nn.Parameter(torch.randn(K, in_features, out_features))
        nn.init.xavier_uniform_(self.weights)

    def forward(self, x: torch.Tensor, adj: torch.Tensor) -> torch.Tensor:
        # x shape: [batch, num_nodes, in_features]
        # Normalize adjacency for random walk matrix P = D^-1 * A
        deg = torch.sum(adj, dim=1, keepdim=True) + 1e-5
        P = adj / deg
        
        out = torch.zeros(x.shape[0], x.shape[1], self.weights.shape[-1], device=x.device)
        P_k = torch.eye(adj.shape[0], device=x.device)
        
        for k in range(self.K):
            # [batch, num_nodes, in_features] x P_k -> spatial diffusion
            x_diff = torch.matmul(P_k, x) # [batch, num_nodes, in_features]
            out = out + torch.matmul(x_diff, self.weights[k])
            P_k = torch.matmul(P_k, P)
            
        return F.relu(out)

class DCRNNModel(nn.Module):
    """
    DCRNN model integrating diffusion graph convolution with recurrent temporal update cells.
    """
    def __init__(self, in_features: int = 6, hidden_size: int = 48, num_horizons: int = 3, K: int = 2):
        super().__init__()
        self.diff_conv = DiffusionConv(in_features=in_features, out_features=hidden_size, K=K)
        self.gru_cell = nn.GRUCell(input_size=hidden_size, hidden_size=hidden_size)
        self.fc_out = nn.Sequential(
            nn.Linear(hidden_size, 32),
            nn.ReLU(),
            nn.Linear(32, num_horizons),
            nn.Sigmoid()
        )

    def forward(self, x: torch.Tensor, adj: torch.Tensor) -> torch.Tensor:
        """
        x: Tensor of shape [batch, num_nodes, seq_len, in_features]
        adj: Adjacency matrix of shape [num_nodes, num_nodes]
        Returns: Tensor of shape [batch, num_nodes, num_horizons]
        """
        batch, num_nodes, seq_len, in_feat = x.shape
        h = torch.zeros(batch * num_nodes, 48, device=x.device)
        
        for t in range(seq_len):
            xt = x[:, :, t, :] # [batch, num_nodes, in_features]
            spatial_feat = self.diff_conv(xt, adj) # [batch, num_nodes, hidden_size]
            spatial_flat = spatial_feat.view(batch * num_nodes, -1)
            h = self.gru_cell(spatial_flat, h)
            
        out_flat = self.fc_out(h) # [batch * num_nodes, num_horizons]
        out = out_flat.view(batch, num_nodes, -1)
        return out
