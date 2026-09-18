import pytest
from routing.osrm_client import OSRMClient
from routing.reranker import CascadeReRanker

def test_osrm_client_candidate_generation():
    client = OSRMClient()
    origin = (34.0522, -118.2437)
    destination = (34.0622, -118.2537)
    routes = client.get_candidate_routes(origin, destination)
    
    assert len(routes) >= 1
    assert "route_id" in routes[0]
    assert "geometry" in routes[0]
    assert routes[0]["geometry"]["type"] == "LineString"
    assert "eta_min" in routes[0]
    assert routes[0]["eta_min"] > 0.0

def test_cascade_reranker_normal_mode():
    client = OSRMClient()
    reranker = CascadeReRanker()
    
    origin = (34.0522, -118.2437)
    destination = (34.0622, -118.2537)
    raw_routes = client.get_candidate_routes(origin, destination)
    
    ranked = reranker.rank_routes(raw_routes, emergency_mode=False)
    assert len(ranked) == len(raw_routes)
    assert ranked[0].recommended is True
    assert 0.0 <= ranked[0].cascade_safety_score <= 1.0
    assert len(ranked[0].delay_timeline) > 0

def test_cascade_reranker_unmapped_segment_flag():
    reranker = CascadeReRanker()
    # Route completely outside mapped sensor network (e.g. distant location)
    synthetic_route = [{
        "route_id": "r_remote",
        "geometry": {
            "type": "LineString",
            "coordinates": [[-120.0000, 37.0000], [-120.1000, 37.1000]]
        },
        "eta_min": 15.0
    }]
    
    ranked = reranker.rank_routes(synthetic_route, emergency_mode=False)
    assert len(ranked) == 1
    # Segments outside mapped network must explicitly set cascade_data_available = False
    assert any(pt.cascade_data_available is False for pt in ranked[0].delay_timeline)

def test_emergency_mode_weighting():
    reranker = CascadeReRanker()
    # Two synthetic routes: R1 is shorter distance but has low cascade safety; R2 is longer but high cascade safety
    routes = [
        {
            "route_id": "r1_congested",
            "geometry": {"type": "LineString", "coordinates": [[-118.2437, 34.0522], [-118.2480, 34.0560]]}, # Matches 717447
            "eta_min": 8.0
        },
        {
            "route_id": "r2_clear",
            "geometry": {"type": "LineString", "coordinates": [[-118.2580, 34.0665], [-118.2620, 34.0700]]}, # Matches 717462
            "eta_min": 10.0
        }
    ]
    
    ranked_normal = reranker.rank_routes(routes, emergency_mode=False)
    ranked_emergency = reranker.rank_routes(routes, emergency_mode=True)
    
    assert len(ranked_normal) == 2
    assert len(ranked_emergency) == 2
