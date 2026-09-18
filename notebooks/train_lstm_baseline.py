"""
PyTorch Training Script for LSTM Baseline Model (lstm_baseline_v1).
Trains 2-layer LSTM on strict 80/20 time-based split METR-LA dataset.
Saves model checkpoint to models/lstm_baseline/lstm_baseline_v1.pt and prints real measured test metrics.
"""
import os
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import pandas as pd

from data.pipeline import prepare_metr_la_dataset
from models.lstm_baseline.model import LSTMBaselineModel

def create_sequences(feature_matrix: np.ndarray, seq_len: int = 12):
    """
    Creates time-series sliding window sequences.
    X shape: [num_samples, num_nodes, seq_len, num_features]
    Y shape: [num_samples, num_nodes, 3] (targets at +3 (15m), +6 (30m), +12 (60m) steps)
    """
    num_nodes, total_steps, num_features = feature_matrix.shape
    X_list, Y_list = [], []
    
    for t in range(total_steps - seq_len - 12):
        x_window = feature_matrix[:, t:t+seq_len, :] # [nodes, seq_len, features]
        y_targets = np.stack([
            feature_matrix[:, t+seq_len+2, 0],  # 15 min horizon
            feature_matrix[:, t+seq_len+5, 0],  # 30 min horizon
            feature_matrix[:, t+seq_len+11, 0]  # 60 min horizon
        ], axis=-1) # [nodes, 3]
        
        X_list.append(x_window)
        Y_list.append(y_targets)
        
    X = np.stack(X_list, axis=0) # [num_samples, num_nodes, seq_len, num_features]
    Y = np.stack(Y_list, axis=0) # [num_samples, num_nodes, 3]
    return torch.from_numpy(X).float(), torch.from_numpy(Y).float()

def train_lstm():
    torch.manual_seed(42)
    np.random.seed(42)

    df_feat, feature_matrix = prepare_metr_la_dataset(num_timesteps=600)
    
    # Strict Time-Based Train/Test Split (80% Train, 20% Test)
    total_steps = feature_matrix.shape[1]
    split_idx = int(total_steps * 0.8)
    
    train_matrix = feature_matrix[:, :split_idx, :]
    test_matrix = feature_matrix[:, split_idx:, :]
    
    X_train, Y_train = create_sequences(train_matrix, seq_len=12)
    X_test, Y_test = create_sequences(test_matrix, seq_len=12)
    
    model = LSTMBaselineModel(in_features=6, hidden_size=64, num_layers=2, num_horizons=3)
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    criterion = nn.MSELoss()
    
    print(f"Training LSTM Baseline on {X_train.shape[0]} train samples, testing on {X_test.shape[0]} test samples...")
    
    # PyTorch Training Loop
    model.train()
    epochs = 40
    batch_size = 32
    
    for epoch in range(epochs):
        permutation = torch.randperm(X_train.size(0))
        epoch_loss = 0.0
        
        for i in range(0, X_train.size(0), batch_size):
            indices = permutation[i:i+batch_size]
            batch_x, batch_y = X_train[indices], Y_train[indices]
            
            optimizer.zero_grad()
            out = model(batch_x)
            loss = criterion(out, batch_y)
            loss.backward()
            optimizer.step()
            
            epoch_loss += loss.item() * batch_x.size(0)
            
    # Evaluation on Held-Out Time-Based Test Set
    model.eval()
    with torch.no_grad():
        test_preds = model(X_test) # [test_samples, num_nodes, 3]
        
        mae_15 = torch.mean(torch.abs(test_preds[:, :, 0] - Y_test[:, :, 0])).item()
        mae_30 = torch.mean(torch.abs(test_preds[:, :, 1] - Y_test[:, :, 1])).item()
        mae_60 = torch.mean(torch.abs(test_preds[:, :, 2] - Y_test[:, :, 2])).item()
        
        rmse_avg = torch.sqrt(torch.mean((test_preds - Y_test)**2)).item()
        accuracy = max(0.0, 1.0 - ((mae_15 + mae_30 + mae_60) / 3.0))

    # Save Checkpoint
    checkpoint_dir = "models/lstm_baseline"
    os.makedirs(checkpoint_dir, exist_ok=True)
    ckpt_path = os.path.join(checkpoint_dir, "lstm_baseline_v1.pt")
    torch.save(model.state_dict(), ckpt_path)
    
    print("=== LSTM Baseline Training Complete ===")
    print(f"Saved Checkpoint: {ckpt_path}")
    print(f"Measured Test MAE (15 min): {mae_15:.4f}")
    print(f"Measured Test MAE (30 min): {mae_30:.4f}")
    print(f"Measured Test MAE (60 min): {mae_60:.4f}")
    print(f"Measured Test RMSE (avg):   {rmse_avg:.4f}")
    print(f"Measured Accuracy:          {accuracy:.4f}")

    return {
        "model": "lstm_baseline_v1",
        "mae_15min": round(mae_15, 4),
        "mae_30min": round(mae_30, 4),
        "mae_60min": round(mae_60, 4),
        "rmse_avg": round(rmse_avg, 4),
        "accuracy": round(accuracy, 4)
    }

if __name__ == "__main__":
    train_lstm()
