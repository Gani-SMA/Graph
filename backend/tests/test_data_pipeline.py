import pytest
import os
import pandas as pd
import numpy as np
from data.pipeline import prepare_metr_la_dataset, time_based_train_test_split

def test_dataset_generation_and_time_split():
    df, feature_matrix = prepare_metr_la_dataset(num_timesteps=300)
    
    assert isinstance(df, pd.DataFrame)
    assert "timestamp" in df.columns
    assert "sensor_id" in df.columns
    assert "speed" in df.columns
    assert "congestion_level" in df.columns
    
    # Check strict congestion_level bounds [0, 1] per Data Dictionary
    assert (df["congestion_level"] >= 0.0).all() and (df["congestion_level"] <= 1.0).all()
    
    # Check feature tensor shape [num_nodes, timesteps, 6]
    assert feature_matrix.ndim == 3
    assert feature_matrix.shape[0] == 10 # 10 sensors
    assert feature_matrix.shape[2] == 6  # 6 features
    
    # Check time-based train/test split (80% train, 20% test)
    train_df, test_df = time_based_train_test_split(df, split_ratio=0.8)
    assert len(train_df) + len(test_df) == len(df)
    # Earlier timestamps in train, later timestamps in test
    assert train_df["timestamp"].max() <= test_df["timestamp"].min()
