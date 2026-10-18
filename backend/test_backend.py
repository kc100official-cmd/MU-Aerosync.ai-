import sys
import os
import unittest
import threading
import time
import requests
import uvicorn

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.data.database import db

server_thread = None
server_instance = None
BASE_URL = "http://127.0.0.1:8765"

def run_server():
    config = uvicorn.Config(app, host="127.0.0.1", port=8765, log_level="warning")
    global server_instance
    server_instance = uvicorn.Server(config)
    server_instance.run()

class TestAeroSyncBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        global server_thread
        server_thread = threading.Thread(target=run_server, daemon=True)
        server_thread.start()
        # Wait for server to boot
        for _ in range(30):
            try:
                res = requests.get(f"{BASE_URL}/health", timeout=1)
                if res.status_code == 200:
                    break
            except Exception:
                time.sleep(0.2)

    def setUp(self):
        db.reset()

    def test_root_and_health(self):
        res = requests.get(f"{BASE_URL}/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["system"], "AeroSync AI Backend")

        res_health = requests.get(f"{BASE_URL}/health")
        self.assertEqual(res_health.status_code, 200)
        self.assertEqual(res_health.json()["status"], "ok")

    def test_auth_login(self):
        res = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "engineer@aerosync.demo", "password": "demo"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("token", data)
        self.assertEqual(data["user"]["name"], "Maya Chen")

        # Invalid login
        res_bad = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "bad@demo.com", "password": "wrong"})
        self.assertEqual(res_bad.status_code, 401)

    def test_fleet_endpoints(self):
        res = requests.get(f"{BASE_URL}/api/fleet")
        self.assertEqual(res.status_code, 200)
        fleet = res.json()
        self.assertGreaterEqual(len(fleet), 12)

        # Get specific aircraft
        res_ac = requests.get(f"{BASE_URL}/api/fleet/AS-101")
        self.assertEqual(res_ac.status_code, 200)
        self.assertEqual(res_ac.json()["id"], "AS-101")

        # Filter by fleet
        res_alpha = requests.get(f"{BASE_URL}/api/fleet?fleet=Alpha")
        self.assertEqual(res_alpha.status_code, 200)
        self.assertTrue(all(a["fleet"] == "Alpha" for a in res_alpha.json()))

    def test_components_and_predictive(self):
        res_comp = requests.get(f"{BASE_URL}/api/components?aircraftId=AS-102")
        self.assertEqual(res_comp.status_code, 200)
        comps = res_comp.json()
        self.assertTrue(any(c["id"] == "ENG-204" for c in comps))

        # Risk ranking
        res_risks = requests.get(f"{BASE_URL}/api/predictive/risks")
        self.assertEqual(res_risks.status_code, 200)
        risks = res_risks.json()
        self.assertGreater(len(risks), 0)

        # Narrative
        res_narrative = requests.get(f"{BASE_URL}/api/predictive/narrative/ENG-204")
        self.assertEqual(res_narrative.status_code, 200)
        self.assertIn("narrative", res_narrative.json())

    def test_work_orders(self):
        res_wo = requests.get(f"{BASE_URL}/api/work-orders")
        self.assertEqual(res_wo.status_code, 200)
        orders = res_wo.json()
        self.assertGreaterEqual(len(orders), 40)

        # Create new work order
        payload = {
            "aircraftId": "AS-101",
            "componentId": "ENG-101",
            "title": "Test Hydraulic Inspection",
            "faultDescription": "Test fault for backend verification",
            "priority": "high",
            "assignee": "Maya Chen",
            "team": "Line North",
            "estimatedHours": 3.5
        }
        res_create = requests.post(f"{BASE_URL}/api/work-orders", json=payload)
        self.assertEqual(res_create.status_code, 200)
        created_id = res_create.json()["id"]

        # Update it
        res_upd = requests.put(f"{BASE_URL}/api/work-orders/{created_id}", json={"status": "in_progress"})
        self.assertEqual(res_upd.status_code, 200)
        self.assertEqual(res_upd.json()["status"], "in_progress")

    def test_inventory_and_reservation(self):
        res_parts = requests.get(f"{BASE_URL}/api/inventory/parts")
        self.assertEqual(res_parts.status_code, 200)
        parts = res_parts.json()
        self.assertGreaterEqual(len(parts), 20)

        # Reserve part PRT-02
        res_res = requests.post(f"{BASE_URL}/api/inventory/reserve", json={
            "partId": "PRT-02",
            "quantity": 1,
            "userId": "usr-eng"
        })
        self.assertEqual(res_res.status_code, 200)
        self.assertTrue(res_res.json()["ok"])

    def test_insights_query(self):
        res_q = requests.post(f"{BASE_URL}/api/insights/query", json={"question": "Which aircraft need attention first?"})
        self.assertEqual(res_q.status_code, 200)
        data = res_q.json()
        self.assertIn("bullets", data)
        self.assertIn("numbers", data)

        res_brief = requests.get(f"{BASE_URL}/api/insights/executive-brief")
        self.assertEqual(res_brief.status_code, 200)
        self.assertIn("brief", res_brief.json())

if __name__ == "__main__":
    unittest.main()
