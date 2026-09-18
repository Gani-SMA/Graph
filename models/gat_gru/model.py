"""
GAT+GRU Core Cascade Prediction Model.
Combines Graph Attention Networks (GAT) for spatial road topology feature extraction
with Gated Recurrent Units (GRU) for temporal sequence modeling.
"""
import torch
import torch.nn as nn
import torch.nn.functional as F

class SimpleGraphAttentionLayer(nn.Module):
    """
    Graph Attention Layer (GAT) for node feature aggregation.
    Supports multi-head attention over graph adjacency structure.
    """
    def __init__(self, in_features: int, out_features: int, heads: int = 4):
        super().__init__()
        self.heads = heads
        self.out_per_head = out_features // heads
        self.fc = nn.Linear(in_features, out_features, bias=False)
        self.attn_src = nn.Parameter(torch.zeros(1, heads, self.out_per_head))
        self.attn_dst = nn.Parameter(torch.zeros(1, heads, self.out_per_head))
        nn.init.xavier_uniform_(self.fc.weight)
        nn.init.xavier_uniform_(self.attn_src)
        nn.init.xavier_uniform_(self.attn_dst)

    def forward(self, x: torch.Tensor, adj: torch.Tensor) -> torch.Tensor:
        # x shape: [batch, num_nodes, in_features]
        batch, num_nodes, _ = x.shape
        h = self.fc(x).view(batch, num_nodes, self.heads, self.out_per_head) # [batch, nodes, heads, out_per_head]
        
        # Attention scores pairwise addition across nodes
        score_src = (h * self.attn_src).sum(dim=-1, keepdim=True) # [batch, nodes, heads, 1]
        score_dst = (h * self.attn_dst).sum(dim=-1, keepdim=True) # [batch, nodes, heads, 1]
        
        score_src_h = score_src.permute(0, 2, 1, 3) # [batch, heads, num_nodes, 1]
        score_dst_h = score_dst.permute(0, 2, 3, 1) # [batch, heads, 1, num_nodes]
        
        attn_matrix = score_src_h + score_dst_h # [batch, heads, num_nodes, num_nodes]
        attn_matrix = F.leaky_relu(attn_matrix, negative_slope=0.2)
        
        # Mask out non-adjacent nodes using adjacency matrix
        adj_expanded = adj.unsqueeze(0).unsqueeze(0) # [1, 1, nodes, nodes]
        attn_matrix = attn_matrix.masked_fill(adj_expanded == 0, -1e9)
        
        attn_weights = F.softmax(attn_matrix, dim=-1) # [batch, heads, nodes, nodes]
        
        # Aggregate neighbor features
        # h: [batch, nodes, heads, out_per_head] -> transpose to [batch, heads, nodes, out_per_head]
        h_trans = h.transpose(1, 2)
        out = torch.matmul(attn_weights, h_trans) # [batch, heads, nodes, out_per_head]
        out = out.transpose(1, 2).contiguous().view(batch, num_nodes, -1) # [batch, nodes, out_features]
        return F.relu(out)

class GATGRUCascadeModel(nn.Module):
    """
    Core GAT+GRU cascade model predicting congestion levels (0-1) across 15, 30, and 60 min horizons.
    """
    def __init__(self, in_features: int = 6, spatial_hidden: int = 32, heads: int = 4, gru_hidden: int = 64, num_horizons: int = 3):
        super().__init__()
        self.gat = SimpleGraphAttentionLayer(in_features=in_features, out_features=spatial_hidden, heads=heads)
        self.gru = nn.GRU(input_size=spatial_hidden, hidden_size=gru_hidden, batch_first=True, num_layers=1)
        self.fc_out = nn.Sequential(
            nn.Linear(gru_hidden, 32),
            nn.ReLU(),
            nn.Linear(32, num_horizons),
            nn.Sigmoid()  # Bounded strictly to [0, 1] per Data Dictionary
        )

    def forward(self, x: torch.Tensor, adj: torch.Tensor) -> torch.Tensor:
        """
        x: Tensor of shape [batch, num_nodes, seq_len, in_features]
        adj: Adjacency matrix of shape [num_nodes, num_nodes]
        Returns: Tensor of shape [batch, num_nodes, num_horizons] (predictions for 15, 30, 60 min)
        """
        batch, num_nodes, seq_len, in_feat = x.shape
        
        # Apply GAT per timestep
        spatial_feats = []
        for t in range(seq_len):
            xt = x[:, :, t, :] # [batch, num_nodes, in_features]
            ht = self.gat(xt, adj) # [batch, num_nodes, spatial_hidden]
            spatial_feats.append(ht.unsqueeze(2))
            
        spatial_seq = torch.cat(spatial_feats, dim=2) # [batch, num_nodes, seq_len, spatial_hidden]
        
        # Flatten batch and nodes for GRU processing
        spatial_seq_flat = spatial_seq.view(batch * num_nodes, seq_len, -1)
        _, final_hidden = self.gru(spatial_seq_flat) # [1, batch * num_nodes, gru_hidden]
        
        last_hidden = final_hidden.squeeze(0) # [batch * num_nodes, gru_hidden]
        out_flat = self.fc_out(last_hidden) # [batch * num_nodes, num_horizons]
        
        out = out_flat.view(batch, num_nodes, -1) # [batch, num_nodes, num_horizons]
        return out
