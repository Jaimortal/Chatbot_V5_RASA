"""
API Client for fetching responses from the main application API
Replaces direct JSON file access in production
"""

import os
import json
import requests
from typing import Any, Dict, List, Optional

# API Configuration
API_BASE_URL = os.environ.get("CHATBOT_API_URL", "http://localhost:5000/api/rasa")

class ResponseAPIClient:
    """
    Client for fetching responses from the PostgreSQL-backed API
    This replaces ActionReplyFromJsonHelper for production use
    """
    
    def __init__(self, api_base_url: Optional[str] = None):
        self.api_base_url = api_base_url or API_BASE_URL
        self._cache: Dict[str, Any] = {}
        self._cache_loaded = False
    
    def _fetch_from_api(self, endpoint: str) -> Optional[Dict]:
        """Make GET request to API"""
        try:
            url = f"{self.api_base_url}/{endpoint}"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            if data.get("success"):
                return data.get("data")
            return None
        except requests.RequestException as e:
            print(f"[ResponseAPIClient] Error fetching {endpoint}: {e}")
            return None
    
    def _load_all_responses(self) -> List[Dict]:
        """Load all responses from API"""
        data = self._fetch_from_api("responses")
        if data and isinstance(data, list):
            return data
        return []
    
    def _load_all_locations(self) -> Dict[str, Any]:
        """Load all locations from API"""
        data = self._fetch_from_api("locations")
        if data and isinstance(data, list):
            # Convert to dict keyed by name
            return {loc["name"]: loc for loc in data}
        return {}
    
    def warm_cache(self) -> None:
        """Pre-load all data into cache"""
        if not self._cache_loaded:
            responses = self._load_all_responses()
            locations = self._load_all_locations()
            self._cache = {
                "responses": {r["intent"]: r for r in responses},
                "locations": locations
            }
            self._cache_loaded = True
    
    def get_response(self, intent: str) -> Optional[Dict]:
        """Get response by intent"""
        # Try cache first
        if self._cache_loaded and intent in self._cache.get("responses", {}):
            return self._cache["responses"][intent]
        
        # Fetch from API
        return self._fetch_from_api(f"responses/{intent}")
    
    def get_location(self, name: str) -> Optional[Dict]:
        """Get location by name"""
        # Try cache first
        if self._cache_loaded and name in self._cache.get("locations", {}):
            return self._cache["locations"][name]
        
        # Fetch from API
        return self._fetch_from_api(f"locations/{name}")
    
    def get_all_responses(self) -> List[Dict]:
        """Get all responses"""
        if self._cache_loaded:
            return list(self._cache.get("responses", {}).values())
        return self._load_all_responses()
    
    def get_all_locations(self) -> Dict[str, Any]:
        """Get all locations"""
        if self._cache_loaded:
            return self._cache.get("locations", {})
        return self._load_all_locations()
    
    def health_check(self) -> bool:
        """Check API health"""
        try:
            url = f"{self.api_base_url}/health"
            response = requests.get(url, timeout=5)
            data = response.json()
            return data.get("success") and data.get("status") == "healthy"
        except requests.RequestException:
            return False


class HybridResponseHelper:
    """
    Hybrid helper that tries API first, falls back to JSON files
    Use this for smooth migration from JSON to PostgreSQL
    """
    
    def __init__(self, api_base_url: Optional[str] = None, json_path: Optional[str] = None):
        self.api_client = ResponseAPIClient(api_base_url)
        self.json_helper = None
        self.json_path = json_path
        self.use_api = True
        
        # Try to warm API cache
        self.api_client.warm_cache()
        
        # Check API health
        if not self.api_client.health_check():
            print("[HybridResponseHelper] API unavailable, falling back to JSON files")
            self.use_api = False
            # Import and initialize JSON helper
            try:
                from actions import ActionReplyFromJsonHelper
                self.json_helper = ActionReplyFromJsonHelper(json_path)
            except ImportError:
                print("[HybridResponseHelper] JSON helper not available")
    
    def get_response(self, intent: str, **kwargs) -> Any:
        """Get response - tries API first, falls back to JSON"""
        if self.use_api:
            response = self.api_client.get_response(intent)
            if response:
                return self._format_response(response, kwargs.get("user_message", ""))
        
        # Fallback to JSON
        if self.json_helper:
            return self.json_helper.get_response(intent, **kwargs)
        
        return "I'm sorry, I'm having trouble accessing my responses."
    
    def get_location_response(self, location_name: str) -> Optional[Dict]:
        """Get location response"""
        if self.use_api:
            return self.api_client.get_location(location_name)
        
        # Fallback to JSON
        if self.json_helper:
            loc_data = self.json_helper.location_responses.get("locations", {}).get(location_name)
            if loc_data:
                return {
                    "name": location_name,
                    **loc_data
                }
        
        return None
    
    def _format_response(self, response: Dict, user_message: str) -> Any:
        """Format API response to match JSON helper output"""
        responses_data = response.get("responses", {})
        answer = responses_data.get("answer", "")
        
        result = {}
        
        # Handle multilingual or simple format
        if isinstance(answer, dict):
            # Multilingual
            preferred_lang = "en"
            bisaya_words = [
                "unsay", "unsa", "asa", "ngano", "diin", "kinsa", "kanus-a", 
                "pila", "gamay", "dako", "mao", "ug", "uy", "man", "gani", 
                "diay", "sige", "kinahanglan", "bisan", "sab", "gud", "pod", 
                "wala", "naa", "ikaw", "ako", "unsaon", "unsaon nako", 
                "unsaon nato", "unsaon ta", "ahamanato", "ahaman ta", 
                "ahaman nato", "ahaman ko", "ahaman ka", "nganong"
            ]
            user_words = user_message.lower().split()
            if any(word in bisaya_words for word in user_words):
                preferred_lang = "ceb"
            
            selected = answer.get(preferred_lang) or answer.get("en") or []
            
            if isinstance(selected, list):
                result["text"] = "\n".join(selected)
            else:
                result["text"] = selected
        elif isinstance(answer, list):
            result["text"] = "\n".join(answer)
        else:
            result["text"] = answer
        
        # Add optional fields
        if responses_data.get("imageUrl"):
            result["image"] = responses_data["imageUrl"]
        if responses_data.get("imageUrls"):
            result["images"] = responses_data["imageUrls"]
        if responses_data.get("mapData"):
            result["custom"] = {"mapData": responses_data["mapData"]}
        
        # Return dict if has rich content, else just text
        if "image" in result or "images" in result or "custom" in result:
            return result
        return result.get("text", "")


# Convenience function for actions.py
def create_response_helper():
    """
    Factory function to create the appropriate response helper
    
    Usage in actions.py:
        from api_client import create_response_helper
        
        class ActionMyAction(Action):
            def __init__(self):
                self.helper = create_response_helper()
            
            def run(self, dispatcher, tracker, domain):
                response = self.helper.get_response("my_intent", user_message=tracker.latest_message.get("text"))
                dispatcher.utter_message(text=response)
    """
    # Check environment variable to decide which helper to use
    use_api = os.environ.get("USE_API_RESPONSES", "true").lower() == "true"
    
    if use_api:
        return HybridResponseHelper()
    else:
        # Use original JSON helper
        from actions import ActionReplyFromJsonHelper
        return ActionReplyFromJsonHelper()
