"""
LSTM Baseline Model (2-layer LSTM, hidden_size=64).
Non-graph spatial model used as a comparative baseline per TRD Section 2 and Model Card.
"""
import torch
import torch.nn as nn

class LSTMBaselineModel(nn.Module):
    """
    2-Layer LSTM baseline for congestion prediction (comparison baseline).
    """
    def __init__(self, in_features: int = 6, hidden_size: int = 64, num_layers: int = 2, num_horizons: int = 3):
        super().__init__()
        self.lstm = nn.LSTM(input_size=in_features, hidden_size=hidden_size, num_layers=num_layers, batch_first=True)
        self.fc_out = nn.Sequential(
            nn.Linear(hidden_size, 32),
            nn.ReLU(),
            nn.Linear(32, num_horizons),
            nn.Sigmoid()  # Bounded strictly to [0, 1] per Data Dictionary
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        x: Tensor of shape [batch, num_nodes, seq_len, in_features]
        Returns: Tensor of shape [batch, num_nodes, num_horizons]
        """
        batch, num_nodes, seq_len, in_feat = x.shape
        x_flat = x.view(batch * num_nodes, seq_len, in_feat)
        
        _, (h_n, _) = self.lstm(x_flat) # h_n shape: [num_layers, batch * num_nodes, hidden_size]
        last_hidden = h_n[-1] # [batch * num_nodes, hidden_size]
        
        out_flat = self.fc_out(last_hidden) # [batch * num_nodes, num_horizons]
        out = out_flat.view(batch, num_nodes, -1) # [batch, num_nodes, num_horizons]
        return out
