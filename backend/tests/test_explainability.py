import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_get_explain_sensor_found():
    resp = client.get("/explain/717447")
    assert resp.status_code == 200
    data = resp.json()
    assert data["sensor_id"] == "717447"
    assert "feature_contributions" in data
    assert len(data["feature_contributions"]) > 0
    assert "upstream_attributions" in data
    assert len(data["upstream_attributions"]) > 0
    
    # Check SHAP feature fields
    feat0 = data["feature_contributions"][0]
    assert "feature_name" in feat0
    assert "shap_value" in feat0

    # Check GAT attention weights sum approximately to 1.0
    attn_sum = sum(a["attention_weight"] for a in data["upstream_attributions"])
    assert 0.9 <= attn_sum <= 1.1

def test_get_explain_sensor_not_found():
    resp = client.get("/explain/invalid_sensor_999999")
    assert resp.status_code == 404
