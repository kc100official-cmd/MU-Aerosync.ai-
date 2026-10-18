import json
import os
from typing import Dict, Any, List, Optional
from threading import Lock
from .seed_data import build_seed

class InMemoryDatabase:
    _instance = None
    _lock = Lock()

    def __init__(self):
        self.data: Dict[str, Any] = build_seed()
        self.sim_paused: bool = False
        self.sim_live_aircraft: str = "AS-102"
        self.demo_scenario: str = "none"

    @classmethod
    def get_instance(cls) -> "InMemoryDatabase":
        with cls._lock:
            if cls._instance is None:
                cls._instance = InMemoryDatabase()
            return cls._instance

    def reset(self):
        with self._lock:
            self.data = build_seed()
            self.sim_paused = False
            self.sim_live_aircraft = "AS-102"
            self.demo_scenario = "none"

db = InMemoryDatabase.get_instance()
