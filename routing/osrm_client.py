"""
OSRM Routing Engine Client.
Communicates with Open Source Routing Machine (OSRM) HTTP API to retrieve route geometry
and topological ETA estimates. Includes fallback geometric route generator for offline test suites.
"""
from typing import Dict, List, Tuple, Any, Optional
import math
import requests

class OSRMClient:
    """
    Client for Open Source Routing Machine (OSRM) driving API.
    """
    def __init__(self, base_url: str = "http://router.project-osrm.org"):
        self.base_url = base_url.rstrip("/")

    def get_candidate_routes(self, origin: Tuple[float, float], destination: Tuple[float, float], waypoints: Optional[List[Tuple[float, float]]] = None) -> List[Dict[str, Any]]:
        """
        Retrieves candidate driving routes between origin and destination.
        Returns list of route dicts containing geometry (GeoJSON LineString) and base eta_min.
        """
        all_pts = [origin] + (waypoints or []) + [destination]
        coords_str = ";".join([f"{lng:.6f},{lat:.6f}" for lat, lng in all_pts])
        url = f"{self.base_url}/route/v1/driving/{coords_str}?overview=full&geometries=geojson&alternatives=true"
        
        try:
            resp = requests.get(url, timeout=4.0)
            if resp.status_code == 200:
                data = resp.json()
                if "routes" in data and len(data["routes"]) > 0:
                    results = []
                    for idx, r in enumerate(data["routes"]):
                        duration_sec = r.get("duration", 600.0)
                        eta_min = round(duration_sec / 60.0, 2)
                        geometry = r.get("geometry", {"type": "LineString", "coordinates": [[all_pts[0][1], all_pts[0][0]], [all_pts[-1][1], all_pts[-1][0]]]})
                        results.append({
                            "route_id": f"osrm_r{idx + 1}",
                            "geometry": geometry,
                            "eta_min": eta_min
                        })
                    return results
        except Exception:
            pass  # Fall back to synthetic candidate route generation below

        # Offline / synthetic candidate route fallback
        return self._generate_synthetic_candidates(origin, destination)

    def _generate_synthetic_candidates(self, origin: Tuple[float, float], destination: Tuple[float, float]) -> List[Dict[str, Any]]:
        """
        Generates deterministic geometric candidate routes for offline or fallback operation.
        """
        lat1, lng1 = origin
        lat2, lng2 = destination
        dist_km = math.sqrt((lat2 - lat1)**2 + (lng2 - lng1)**2) * 111.0
        base_eta = round(max(3.0, dist_km * 2.5), 1)

        # Candidate 1: Direct highway path
        coords_c1 = [
            [lng1, lat1],
            [lng1 + (lng2 - lng1) * 0.5, lat1 + (lat2 - lat1) * 0.5],
            [lng2, lat2]
        ]
        
        # Candidate 2: Alternate corridor path (slightly longer, different detour)
        coords_c2 = [
            [lng1, lat1],
            [lng1 + (lng2 - lng1) * 0.2, lat1 + (lat2 - lat1) * 0.7],
            [lng1 + (lng2 - lng1) * 0.8, lat1 + (lat2 - lat1) * 0.3],
            [lng2, lat2]
        ]

        return [
            {
                "route_id": "route_primary",
                "geometry": {"type": "LineString", "coordinates": coords_c1},
                "eta_min": base_eta
            },
            {
                "route_id": "route_alternate",
                "geometry": {"type": "LineString", "coordinates": coords_c2},
                "eta_min": round(base_eta * 1.15, 1)
            }
        ]
