"""
Test for Predictive-Advantage Routing Scenario (07_Test_Plan.md Section 10, Item 9).
Constructs a scenario where a primary corridor segment is currently clear (t=0 congestion low) but GAT+GRU predicts downstream cascade bottleneck in 15-30 minutes.
Verifies that the cascade-aware reranker penalizes the main corridor and recommends the uncongested bypass corridor instead.
"""
from routing.reranker import CascadeReRanker

def test_predictive_advantage_scenario():
    reranker = CascadeReRanker()

    # Scenario: Highway is currently free-flowing (low immediate congestion),
    # but GAT+GRU predicts a downstream bottleneck cascade in 15-30 mins.
    candidate_routes = [
        {
            "route_id": "primary_highway_corridor",
            "eta_min": 15.0, # Shorter base ETA by 2.5 minutes
            "geometry": {
                "type": "LineString",
                "coordinates": [[-118.2437, 34.0522], [-118.2500, 34.0600], [-118.2600, 34.0700]]
            }
        },
        {
            "route_id": "alternate_bypass_corridor",
            "eta_min": 17.5, # Slightly longer raw ETA
            "geometry": {
                "type": "LineString",
                "coordinates": [[-118.2437, 34.0522], [-118.2350, 34.0580], [-118.2600, 34.0700]]
            }
        }
    ]

    ranked = reranker.rank_routes(candidate_routes, emergency_mode=False)

    # Verification: Recommended route should be alternate_bypass_corridor due to predicted cascade
    recommended = next(r for r in ranked if r.recommended)
    assert recommended.route_id == "alternate_bypass_corridor"
    assert recommended.is_shortcut is True
    assert recommended.cascade_safety_score > 0.60
