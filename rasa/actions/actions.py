import json
import os
import random
import re
from typing import Any, Text, Dict, List, Optional

from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher

# Location aliases for normalizing user input
LOCATION_ALIASES = {
    # === Computer Laboratory Aliases ===
    "comlab 1": "ComLab 1",
    "computer laboratory 1": "ComLab 1",
    "com lab 1": "ComLab 1",
    "cl1": "ComLab 1",
    "lab 1": "ComLab 1",
    "computer lab 1": "ComLab 1",
    
    "comlab 2": "ComLab 2",
    "computer laboratory 2": "ComLab 2",
    "com lab 2": "ComLab 2",
    "cl2": "ComLab 2",
    "lab 2": "ComLab 2",
    "computer lab 2": "ComLab 2",
    
    "comlab 3": "ComLab 3",
    "computer laboratory 3": "ComLab 3",
    "com lab 3": "ComLab 3",
    "cl3": "ComLab 3",
    "lab 3": "ComLab 3",
    "computer lab 3": "ComLab 3",
    
    "comlab 4": "ComLab 4",
    "computer laboratory 4": "ComLab 4",
    "com lab 4": "ComLab 4",
    "cl4": "ComLab 4",
    "lab 4": "ComLab 4",
    "computer lab 4": "ComLab 4",
    
    "comlab 5": "ComLab 5",
    "computer laboratory 5": "ComLab 5",
    "com lab 5": "ComLab 5",
    "cl5": "ComLab 5",
    "lab 5": "ComLab 5",
    "computer lab 5": "ComLab 5",
    
    "comlab 6": "ComLab 6",
    "computer laboratory 6": "ComLab 6",
    "com lab 6": "ComLab 6",
    "cl6": "ComLab 6",
    "lab 6": "ComLab 6",
    "computer lab 6": "ComLab 6",
    
    "comlab 7": "ComLab 7",
    "computer laboratory 7": "ComLab 7",
    "com lab 7": "ComLab 7",
    "cl7": "ComLab 7",
    "lab 7": "ComLab 7",
    "computer lab 7": "ComLab 7",
    
    "comlab 8": "ComLab 8",
    "computer laboratory 8": "ComLab 8",
    "com lab 8": "ComLab 8",
    "cl8": "ComLab 8",
    "lab 8": "ComLab 8",
    "computer lab 8": "ComLab 8",
    
    "comlab 9": "ComLab 9",
    "computer laboratory 9": "ComLab 9",
    "com lab 9": "ComLab 9",
    "cl9": "ComLab 9",
    "lab 9": "ComLab 9",
    "computer lab 9": "ComLab 9",
    
    "comlab 10": "ComLab 10",
    "computer laboratory 10": "ComLab 10",
    "com lab 10": "ComLab 10",
    "cl10": "ComLab 10",
    "lab 10": "ComLab 10",
    "computer lab 10": "ComLab 10",
    
    "comlab 11": "ComLab 11",
    "computer laboratory 11": "ComLab 11",
    "com lab 11": "ComLab 11",
    "cl11": "ComLab 11",
    "lab 11": "ComLab 11",
    "computer lab 11": "ComLab 11",
    
    "comlab 12": "ComLab 12",
    "computer laboratory 12": "ComLab 12",
    "com lab 12": "ComLab 12",
    "cl12": "ComLab 12",
    "lab 12": "ComLab 12",
    "computer lab 12": "ComLab 12",
    
    # === Electronics Laboratory Aliases ===
    "electronics laboratory 1": "Electronics Laboratory 1",
    "electronics lab 1": "Electronics Laboratory 1",
    "electronics lab": "Electronics Laboratory 1",
    "el1": "Electronics Laboratory 1",
    
    "electronics laboratory 2": "Electronics Laboratory 2",
    "electronics lab 2": "Electronics Laboratory 2",
    "el2": "Electronics Laboratory 2",
    
    # === Room Code Aliases (C2-2-XX format) ===
    # C2-2-01 variations
    "c2-2-01": "C2-2-01",
    "c2-2-1": "C2-2-01",
    "c2201": "C2-2-01",
    "c2 2 01": "C2-2-01",
    "c2 2 1": "C2-2-01",
    "c2-2 01": "C2-2-01",
    "room c2-2-01": "C2-2-01",
    "room c2201": "C2-2-01",
    
    # C2-2-02 variations
    "c2-2-02": "C2-2-02",
    "c2-2-2": "C2-2-02",
    "c2202": "C2-2-02",
    "room c2202": "C2-2-02",
    "c2 2 02": "C2-2-02",
    "c2 2 2": "C2-2-02",
    "c2-2 02": "C2-2-02",
    "room c2-2-02": "C2-2-02",
    "room c2202": "C2-2-02",
    
    # C2-2-03 variations
    "c2-2-03": "C2-2-03",
    "c2-2-3": "C2-2-03",
    "c2203": "C2-2-03",
    "c2 2 03": "C2-2-03",
    "c2 2 3": "C2-2-03",
    "c2-2 03": "C2-2-03",
    "room c2-2-03": "C2-2-03",
    "room c2203": "C2-2-03",
    
    # C2-2-04 variations
    "c2-2-04": "C2-2-04",
    "c2-2-4": "C2-2-04",
    "c2204": "C2-2-04",
    "c2 2 04": "C2-2-04",
    "c2 2 4": "C2-2-04",
    "c2-2 04": "C2-2-04",
    "room c2-2-04": "C2-2-04",
    "room c2204": "C2-2-04",
    
    # === Faculty Room Aliases ===
    "college of information technology faculty": "COT Faculty Room",
    "cit faculty": "COT Faculty Room",
    "college it faculty": "COT Faculty Room",
    "cot faculty": "COT Faculty Room",
    "cot faculty room": "COT Faculty Room",
    "college of technology faculty": "COT Faculty Room",
    
    "cob faculty": "COB Faculty Room",
    "college of business faculty": "COB Faculty Room",
    "cob faculty room": "COB Faculty Room",
    
    "cpag faculty": "CPAG Faculty Room",
    "cpag faculty room": "CPAG Faculty Room",
    
    "bsn faculty": "BSN Faculty Room",
    "bsn faculty room": "BSN Faculty Room",
    "nursing faculty": "BSN Faculty Room",
    
    "cas deans office": "CAS Deans Office",
    "cas dean's office": "CAS Deans Office",
    
    "cpag deans office": "CPAG Deans Office",
    "cpag dean's office": "CPAG Deans Office",
    
    # === Building Aliases ===
    "old cot building": "Old COT Building",
    "new cot building": "New COT Building",
    "college of technology building": "New COT Building",
    "cot building": "Old COT Building",
    
    "finance building": "Finance Building",
    "finance bldg": "Finance Building",
    
    "cpag building": "CPAG Building",
    
    "college of business building": "College of Business Building",
    "cob building": "College of Business Building",
    
    "registrars office": "Registrar Office",
    "registrar's office": "Registrar Office",
    "registrar office": "Registrar Office",
    
    "old college of nursing": "Old College of Nursing",
    "old nursing building": "Old College of Nursing",
    
    # === Dormitory Aliases ===
    "mahogany dorm": "Mahogany Dorm",
    "mahoganys dorm": "Mahogany Dorm",
    "mahogany's dorm": "Mahogany Dorm",
    "mahoganys doorm": "Mahogany Dorm",
    "mahogany's doorm": "Mahogany Dorm",
    "male dorm": "Mahogany Dorm",
    "mahogany dormitory": "Mahogany Dorm",
    "mahogany's dormitory": "Mahogany Dorm",
    "mahoganys dormitory": "Mahogany Dorm",
    "male dormitory": "Mahogany Dorm",
    "man dormitory": "Mahogany Dorm",
    "mans dormitory": "Mahogany Dorm",
    "boy dormitory": "Mahogany Dorm",
    "boys dormitory": "Mahogany Dorm",

    "female dorm": "Rubia Dorm",
    "rubia dorm": "Rubia Dorm",
    "rubia's dorm": "Rubia Dorm",
    "rubias doorm": "Rubia Dorm",
    "rubias dorm": "Rubia Dorm",
    "rubia dormitory": "Rubia Dorm",
    "rubia's dormitory": "Rubia Dorm",
    "female dormitory": "Rubia Dorm",
    "rubia ladies dormitory": "Rubia Dorm",
    "woman dormitory": "Rubia Dorm",
    "ladies dormitory": "Rubia Dorm",

    "kilala dorm": "Kilala Dorm",
    "kilalas dorm": "Kilala Dorm",
    "kilalas doorm": "Kilala Dorm",
    "kilala's dorm": "Kilala Dorm",
    "kilala dormitory": "Kilala Dorm",
    "kilalas dormitory": "Kilala Dorm",
    "kilala's dormitory": "Kilala Dorm",

    # === Facility Aliases ===
    "library": "Library",
    "university library": "Library",
    "main library": "Library",
    "buksu library": "Library",
    
    "auditorium": "Auditorium",
    "main auditorium": "Auditorium",
    
    "theater": "Theater",
    "mini theater": "Theater",
    "finance theater": "Theater",
    
    "cafeteria": "Cafeteria",
    "university cafeteria": "Cafeteria",
    "canteen": "Cafeteria",
    
    "gym": "Fitness Gym",
    "fitness gym": "Fitness Gym",
    
    "oval": "Oval",
    "university oval": "Oval",
    
    "museum": "Museum",
    "university museum": "Museum",
    
    "multimedia lab": "Multimedia Laboratory",
    "multimedia": "Multimedia Laboratory",
    "multimedia laboratories": "Multimedia Laboratory",
    "multimedia laboratory": "Multimedia Laboratory",
    
    "computer laboratories": "Computer Laboratories",
    "computer laboratory": "Computer Laboratories",
    "computer labs": "Computer Laboratories",
    
    "avc": "AVC",
    "avc room": "AVC",
    "audio visual center": "AVC",
    
    "dxbu": "DXBU",
    "dxbu office": "DXBU",
    
    "law office": "Law Office",
    "college law office": "Law Office",
    "legal office": "Law Office",
    
    "admission office": "Admission Office",
    "admission and testing office": "Admission Office",
    "admissions office": "Admission Office",
    
    "nstp office": "NSTP Office",
    
    "automotive faculty office": "Automotive Faculty Office",
    "automotive office": "Automotive Faculty Office",
    
    "electronics faculty room": "Electronics Faculty Room",
    "electronics office": "Electronics Faculty Room",
    
    "electronics laboratories": "Electronics Laboratories",
    "electronics labs": "Electronics Laboratories",
    
    "guard house": "Guard House",
    "security office": "Guard House",
    "entrance gate": "Guard House",
    
    "vehicle parking": "Vehicle Parking Area",
    "vehicle": "Vehicle Parking Area",
    "car parking": "Car Parking Area",
    "motorcycle parking": "Motorcycle Parking Area",
    "motorcycle": "Motorcycle Parking Area",
    "car": "Car Parking Area",
    "park": "Vehicle Parking Area",
    "parking area": "Vehicle Parking Area",

    # CR badi
    "comfort room": "Comfort Room",
    "restroom": "Comfort Room",
    "toilet": "Comfort Room",
    "cr": "Comfort Room",
    "libanganan": "Comfort Room",
    
    # research extension ni sya bay
    "research extension": "Research Extension",
    "extension office": "Research Extension",
    
    
    "university press": "University Press Building",
    "press building": "University Press Building",
    
    "cot buildings": "COT Buildings",
    "college of technology buildings": "COT Buildings",
    "cot building": "COT Buildings",
    "college of technology building": "COT Buildings",
    "cot bldgs": "COT Buildings",
    "cot bldg": "COT Buildings",
    "room cot": "COT Buildings",

     "college of business building": "College of Business Building",
    "cob building": "College of Business Building",

    "b-1-01": "B-1-01",
    "b1-01": "B-1-01",
    "b1 01": "B-1-01",
    "b 1 01": "B-1-01",
    "b101": "B-1-01",
    "room b-1-01": "B-1-01",
    "room b101": "B-1-01",
    "room b0101": "B-1-01",

    "b-1-02": "B-1-02",
    "b1-02": "B-1-02",
    "b1 02": "B-1-02",
    "b 1 02": "B-1-02",
    "b102": "B-1-02",
    "room b-1-02": "B-1-02",
    "room b102": "B-1-02",
    "room b0102": "B-1-02",

    "b-1-03": "B-1-03",
    "b1-03": "B-1-03",
    "b1 03": "B-1-03",
    "b 1 03": "B-1-03",
    "b103": "B-1-03",
    "room b-1-03": "B-1-03",
    "room b103": "B-1-03",
    "room b0103": "B-1-03",

    "b-1-04": "B-1-04",
    "b1-04": "B-1-04",
    "b1 04": "B-1-04",
    "b 1 04": "B-1-04",
    "b104": "B-1-04",
    "room b-1-04": "B-1-04",
    "room b104": "B-1-04",
    "room b0104": "B-1-04",

    "b-1-05": "B-1-05",
    "b1-05": "B-1-05",
    "b1 05": "B-1-05",
    "b 1 05": "B-1-05",
    "b105": "B-1-05",
    "room b-1-05": "B-1-05",
    "room b105": "B-1-05",
    "room b0105": "B-1-05",

    "b-1-06": "B-1-06",
    "b1-06": "B-1-06",
    "b1 06": "B-1-06",
    "b 1 06": "B-1-06",
    "b106": "B-1-06",
    "room b-1-06": "B-1-06",
    "room b106": "B-1-06",
    "room b0106": "B-1-06",

    "b-1-08": "B-1-08",
    "b1-08": "B-1-08",
    "b1 08": "B-1-08",
    "b 1 08": "B-1-08",
    "b108": "B-1-08",
    "room b-1-08": "B-1-08",
    "room b108": "B-1-08",
    "room b0108": "B-1-08",

    "b-1-09": "B-1-09",
    "b1-09": "B-1-09",
    "b1 09": "B-1-09",
    "b 1 09": "B-1-09",
    "b109": "B-1-09",
    "room b-1-09": "B-1-09",
    "room b109": "B-1-09",
    "room b0109": "B-1-09",

    "b-2-10": "B-2-10",
    "b2-10": "B-2-10",
    "b2 10": "B-2-10",
    "b 2 10": "B-2-10",
    "b210": "B-2-10",
    "room b-2-10": "B-2-10",
    "room b210": "B-2-10",
    "room b0210": "B-2-10",

    "b-2-07": "B-2-07",
    "b2-07": "B-2-07",
    "b2 07": "B-2-07",
    "b 2 07": "B-2-07",
    "b207": "B-2-07",
    "room b-2-07": "B-2-07",
    "room b207": "B-2-07",
    "room b0207": "B-2-07",

    "b-2-06": "B-2-06",
    "b2-06": "B-2-06",
    "b2 06": "B-2-06",
    "b 2 06": "B-2-06",
    "b206": "B-2-06",
    "room b-2-06": "B-2-06",
    "room b206": "B-2-06",
    "room b0206": "B-2-06",

    "b-2-05": "B-2-05",
    "b2-05": "B-2-05",
    "b2 05": "B-2-05",
    "b 2 05": "B-2-05",
    "b205": "B-2-05",
    "room b-2-05": "B-2-05",
    "room b205": "B-2-05",
    "room b0205": "B-2-05",

    "b-2-04": "B-2-04",
    "b2-04": "B-2-04",
    "b2 04": "B-2-04",
    "b 2 04": "B-2-04",
    "b204": "B-2-04",
    "room b-2-04": "B-2-04",
    "room b204": "B-2-04",
    "room b0204": "B-2-04",

    "b-2-03": "B-2-03",
    "b2-03": "B-2-03",
    "b2 03": "B-2-03",
    "b 2 03": "B-2-03",
    "b203": "B-2-03",
    "room b-2-03": "B-2-03",
    "room b203": "B-2-03",
    "room b0203": "B-2-03",

    "b-2-02": "B-2-02",
    "b2-02": "B-2-02",
    "b2 02": "B-2-02",
    "b 2 02": "B-2-02",
    "b202": "B-2-02",
    "room b-2-02": "B-2-02",
    "room b202": "B-2-02",
    "room b0202": "B-2-02",

    "b-2-01": "B-2-01",
    "b2-01": "B-2-01",
    "b2 01": "B-2-01",
    "b 2 01": "B-2-01",
    "b201": "B-2-01",
    "room b-2-01": "B-2-01",
    "room b201": "B-2-01",
    "room b0201": "B-2-01",

    "b-3-01": "B-3-01",
    "b3-01": "B-3-01",
    "b3 01": "B-3-01",
    "b 3 01": "B-3-01",
    "b301": "B-3-01",
    "room b-3-01": "B-3-01",
    "room b301": "B-3-01",
    "room b0301": "B-3-01",

    "b-3-02": "B-3-02",
    "b3-02": "B-3-02",
    "b3 02": "B-3-02",
    "b 3 02": "B-3-02",
    "b302": "B-3-02",
    "room b-3-02": "B-3-02",
    "room b302": "B-3-02",
    "room b0302": "B-3-02",

    # ...continue this pattern for all remaining rooms B-3-03 → B-4-09

    "cob 4th floor students organization": "COB 4th Floor Students Organization",
    "students organization cob 4th floor": "COB 4th Floor Students Organization",
    "cob 4th floor so": "COB 4th Floor Students Organization",
}


# -------------------------
# Conversation Context
# -------------------------
class ConversationContext:
    """
    Manages conversation context and dynamic slots for multi-turn conversations.
    """
    def __init__(self):
        self.slots: Dict[str, Any] = {
            "conversation_history": []  # Stores last N messages for context
        }

    def set_slot(self, slot_name: str, value: Any) -> None:
        self.slots[slot_name] = value

    def get_slot(self, slot_name: str) -> Any:
        return self.slots.get(slot_name)

    def reset(self) -> None:
        self.slots = {"conversation_history": []}

    def add_to_history(self, intent: str, user_message: str) -> None:
        self.slots["conversation_history"].append({"intent": intent, "message": user_message})
        if len(self.slots["conversation_history"]) > 20:
            self.slots["conversation_history"] = self.slots["conversation_history"][-20:]

    def get_last_topic(self) -> Optional[str]:
        last_topic = self.get_slot("last_topic")
        if not last_topic and self.slots["conversation_history"]:
            last_topic = self.slots["conversation_history"][-1]["intent"]
        return last_topic


# -------------------------
# JSON Response Helper
# -------------------------
class ActionReplyFromJsonHelper:
    """
    Loads responses from JSON and provides context-aware replies.
    Supports dynamic topics, categories, sub-categories, and multi-turn conversations.
    """
    def __init__(self, responses_path: Optional[str] = None):
        if responses_path is None:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            responses_path = os.path.join(current_dir, "responses.json")
        self.responses_path = responses_path
        self.responses = self._load_responses()
        self.location_responses_path = os.path.join(os.path.dirname(responses_path), "responses_location.json")
        self.location_responses = self._load_location_responses()
        self.context = ConversationContext()

    def _load_location_responses(self) -> Dict[str, Any]:
        try:
            with open(self.location_responses_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Error: responses_location.json not found at {self.location_responses_path}")
            return {}
        except json.JSONDecodeError as e:
            print(f"Error: Invalid JSON in responses_location.json - {e}")
            return {}

    def _load_responses(self) -> List[Dict[str, Any]]:
        try:
            with open(self.responses_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Error: responses.json not found at {self.responses_path}")
            return []
        except json.JSONDecodeError as e:
            print(f"Error: Invalid JSON in responses.json - {e}")
            return []

    # -------------------------
    # Get Main Response
    # -------------------------
    def get_response(self, intent: str, category: Optional[str] = None,
                     sub_category: Optional[str] = None, pick_random: bool = True,
                     user_message: str = "") -> Any:

        if not self.responses:
            return "I'm sorry, I'm having trouble accessing my responses."

        # Track history
        self.context.add_to_history(intent, user_message)

        # Filter entries by intent
        matched_entries = [
            entry for entry in self.responses
            if entry.get("intent") == intent and
               (category is None or entry.get("category") == category) and
               (sub_category is None or entry.get("sub_category") == sub_category)
        ]

        if not matched_entries:
            return self._get_fallback_response()

        entry = matched_entries[0]
        responses_data = entry.get("responses", {})

        # Apply dynamic slots
        context_slots = responses_data.get("context_slots", {})
        for slot_name, value in context_slots.items():
            self.context.set_slot(slot_name, value)

        # Always update last topic
        self.context.set_slot("last_topic", intent)

        # Main answer
        answer = responses_data.get("answer", "I'm sorry, I don't have an answer for that.")
        
        # Check for image or map data (Enhanced for Map Support)
        image_data = responses_data.get("image", None) or responses_data.get("imageUrl", None)
        image_list = responses_data.get("images", None) or responses_data.get("imageUrls", None)
        map_data = responses_data.get("mapData", None)
        
        # Prepare result payload
        result = {}
        
        if isinstance(answer, dict):
            # New multilingual format: { "en": [...], "ceb": [...] }
            # Detect language from user_message (improved heuristic)
            preferred_lang = "en"
            # More precise Bisaya detection with word boundaries
            bisaya_words = [
                "unsay", "unsa", "asa", "ngano", "diin", "kinsa", "kanus-a", 
                "pila", "gamay", "dako", "mao", "ug", "uy", "man", "gani", 
                "diay", "sige", "kinahanglan", "bisan", "sab", "gud", "pod", 
                "wala", "naa", "ikaw", "ako"
            ]
            # Use word boundary matching to avoid false positives
            user_words = user_message.lower().split()
            if any(word in bisaya_words for word in user_words):
                preferred_lang = "ceb"

            selected = answer.get(preferred_lang)

            is_blank_selected = (
                selected is None or
                (isinstance(selected, str) and not selected.strip()) or
                (isinstance(selected, list) and not any(str(x).strip() for x in selected))
            )

            if is_blank_selected:
                # Fallback to English or first available language
                selected = answer.get("en")
                if selected is None or (
                    (isinstance(selected, str) and not selected.strip()) or
                    (isinstance(selected, list) and not any(str(x).strip() for x in selected))
                ):
                    first_key = next(iter(answer), None)
                    selected = answer.get(first_key) if first_key else None
            if isinstance(selected, list):
                result["text"] = "\n".join(selected)
            elif isinstance(selected, str):
                result["text"] = selected
            else:
                result["text"] = "I'm sorry, I don't have an answer for that."
        elif isinstance(answer, list):
            result["text"] = "\n".join(answer)
        elif isinstance(answer, str):
            result["text"] = answer
        else:
            result["text"] = "I'm sorry, I don't have an answer for that."
            
        if image_data:
             result["image"] = image_data

        if isinstance(image_list, list):
             cleaned = [str(x) for x in image_list if x]
             if cleaned:
                  result["images"] = cleaned
             
        if map_data:
             result["custom"] = {"mapData": map_data}

        # Return dict if we have rich content, otherwise just text
        if "image" in result or "images" in result or "custom" in result:
             return result
             
        return result["text"]

    # -------------------------
    # Get Follow-Up (improved)
    # -------------------------
    def get_follow_up(self, last_topic: str,
                      category: Optional[str] = None,
                      sub_category: Optional[str] = None,
                      pick_random: bool = True) -> List[str]:

        # Fallback if no last topic recorded
        if not last_topic:
            return ["Unfortunately that's all the data I can give for now."]

        matched_entries = [
            entry for entry in self.responses
            if entry.get("intent") == last_topic and
               (category is None or entry.get("category") == category) and
               (sub_category is None or entry.get("sub_category") == sub_category)
        ]

        if not matched_entries:
            return ["Unfortunately that's all the data I can give for now."]

        entry = matched_entries[0]
        follow_up = entry.get("responses", {}).get("follow_up", [])

        # If follow_up is missing or empty → fallback
        if not follow_up:
            return ["Unfortunately that's all the data I can give for now."]

        if isinstance(follow_up, str):
            return [follow_up]
        if isinstance(follow_up, list):
            return follow_up

        return ["Unfortunately that's all the data I can give for now."]

    # -------------------------
    # Generic fallback
    # -------------------------
    def _get_fallback_response(self) -> str:
        fallback_entry = next((entry for entry in self.responses if entry.get("intent") == "nlu_fallback"), None)
        if fallback_entry:
            fallback = fallback_entry.get("responses", {}).get("answer", "I'm not sure how to respond.")
            if isinstance(fallback, list):
                return random.choice(fallback)
            return fallback
        return "I'm not sure how to respond. Could you rephrase your question?"

    # Helpers
    def set_dynamic_slot(self, slot_name: str, value: Any) -> None:
        self.context.set_slot(slot_name, value)

    def get_dynamic_slot(self, slot_name: str) -> Any:
        return self.context.get_slot(slot_name)

    def _normalize_location_name(self, raw_name: str) -> str:
        if not raw_name:
            return raw_name

        cleaned = str(raw_name).lower()

        # ✅ remove punctuation
        cleaned = re.sub(r"[^\w\s-]", "", cleaned)

        cleaned = cleaned.strip()

        # remove prefixes
        cleaned = re.sub(r"^\s*(room|rm|the)\s+", "", cleaned).strip()

        if cleaned in LOCATION_ALIASES:
            return LOCATION_ALIASES[cleaned]

        return LOCATION_ALIASES.get(cleaned, raw_name)

    def _guess_all_locations_from_text(self, user_message: str) -> List[str]:
        """Find ALL location aliases in the text, not just the best one"""
        if not user_message:
            return []

        text = str(user_message).strip().lower()
        found_locations = set()

        # Find all matching aliases
        for alias, normalized in LOCATION_ALIASES.items():
            if alias and alias in text:
                found_locations.add(normalized)

        # Also try room code patterns
        matches = re.finditer(r"\b(c\d+)\s+(\d+)\s+(\d{1,2})\b", text)
        for match in matches:
            building, floor, room = match.group(1), match.group(2), match.group(3)
            room_padded = room.zfill(2)
            found_locations.add(f"{building}-{floor}-{room_padded}".upper())

        matches2 = re.finditer(r"\b(c\d+)-(\d+)-(\d{1,2})\b", text)
        for match in matches2:
            building, floor, room = match.group(1), match.group(2), match.group(3)
            room_padded = room.zfill(2)
            found_locations.add(f"{building}-{floor}-{room_padded}".upper())

        return list(found_locations)

    def _guess_location_from_text(self, user_message: str) -> Optional[str]:
        """Find the best (longest) location alias in the text"""
        if not user_message:
            return None

        text = str(user_message).strip().lower()

        # direct substring match against aliases (prefer longest alias)
        best_alias = None
        for alias in LOCATION_ALIASES.keys():
            if alias and alias in text:
                if best_alias is None or len(alias) > len(best_alias):
                    best_alias = alias

        if best_alias:
            return LOCATION_ALIASES.get(best_alias)

        # Try to reconstruct room codes like "c2 2 01" even if entity extraction is partial
        match = re.search(r"\b(c\d+)\s+(\d+)\s+(\d{1,2})\b", text)
        if match:
            building, floor, room = match.group(1), match.group(2), match.group(3)
            room_padded = room.zfill(2)
            return f"{building}-{floor}-{room_padded}".upper()

        match2 = re.search(r"\b(c\d+)-(\d+)-(\d{1,2})\b", text)
        if match2:
            building, floor, room = match2.group(1), match2.group(2), match2.group(3)
            room_padded = room.zfill(2)
            return f"{building}-{floor}-{room_padded}".upper()

        return None

    def get_location_response(self, location_name: str, user_message: str) -> Dict[str, Any]:
        normalized_name = self._normalize_location_name(location_name)
        locations = self.location_responses.get("locations", {})
        location_info = locations.get(normalized_name)
        if not location_info and isinstance(normalized_name, str):
            # Fallback: try case-insensitive match against keys in responses_location.json
            for k, v in locations.items():
                if isinstance(k, str) and k.strip().lower() == normalized_name.strip().lower():
                    normalized_name = k
                    location_info = v
                    break
        if not location_info:
            return {"text": f"Sorry, I don't have information about {location_name}."}
        
        # Detect language
        bisaya_words = ["asa", "unsay", "ngano", "diin", "kinsa", "kanus-a", "pila", "gamay", "dako", "mao", "ug", "uy", "man", "gani", "diay", "sige", "kinahanglan", "bisan", "sab", "gud", "pod", "wala", "naa", "ikaw", "ako"]
        user_words = user_message.lower().split()
        is_bisaya = any(word in bisaya_words for word in user_words)
        lang_key = "ceb" if is_bisaya else "en"
        responses = location_info.get("responses", {}).get(lang_key)
        if not responses:
            responses = location_info.get("responses", {}).get("en", [])
        
        if isinstance(responses, list):
            response_text = "\n".join(responses)
        else:
            response_text = str(responses)
        
        result = {"text": response_text}

        # Add images if available
        images = None
        if isinstance(location_info.get("imageUrls"), list):
            images = [str(x) for x in location_info.get("imageUrls") if x]
        elif isinstance(location_info.get("images"), list):
            images = [str(x) for x in location_info.get("images") if x]
        elif location_info.get("image"):
            images = [str(location_info.get("image"))]
        elif location_info.get("imageUrl"):
            images = [str(location_info.get("imageUrl"))]

        if images:
            result["images"] = images
            result["image"] = images[0]
        
        # Add map data (support multiple pins)
        map_id = location_info.get("map_id") or location_info.get("mapId")
        pins_raw = location_info.get("pins")

        pins_out = []
        if isinstance(pins_raw, list):
            for idx, p in enumerate(pins_raw):
                coords = None
                if isinstance(p, dict) and isinstance(p.get("coordinates"), list) and len(p.get("coordinates")) == 2:
                    coords = p.get("coordinates")
                name = None
                if isinstance(p, dict):
                    name = str(p.get("name") or "").strip()
                if not name:
                    name = f"Pin {idx + 1}"
                if coords:
                    pins_out.append({"name": name, "coordinates": coords})

        if map_id:
            if pins_out:
                result["custom"] = {
                    "mapData": {
                        "locationName": normalized_name,
                        "pins": pins_out,
                        "mapId": map_id,
                    }
                }
            elif location_info.get("coordinates"):
                result["custom"] = {
                    "mapData": {
                        "locationName": normalized_name,
                        "coordinates": location_info["coordinates"],
                        "mapId": map_id,
                    }
                }
        
        return result
    def _normalize_lab_number(self, raw_value: Any) -> Optional[str]:
        if raw_value is None:
            return None

        value = str(raw_value).strip().lower()

        # Common cases: "3", "comlab 3", "computer laboratory 3"
        match = re.search(r"\b(\d{1,2})\b", value)
        if match:
            return match.group(1)

        # Word numbers (limited support)
        word_to_num = {
            "one": "1",
            "two": "2",
            "three": "3",
            "four": "4",
            "five": "5",
            "six": "6",
            "seven": "7",
            "eight": "8",
            "nine": "9",
            "ten": "10",
            "eleven": "11",
            "twelve": "12",
        }
        for word, num in word_to_num.items():
            if re.search(rf"\b{re.escape(word)}\b", value):
                return num

        return None

    def _get_lab_location_response(self, lab_number: str, user_message: str) -> dict:
        """Get location response for specific ComLab from the new JSON structure"""

        entry = next((e for e in self.responses if e.get("intent") == "locate_comlab"), None)
        laboratories = (entry or {}).get("laboratories", {})
        lab_info = laboratories.get(str(lab_number))
        
        if not lab_info:
            return {"text": f"Sorry, I don't have information about ComLab {lab_number}."}
        
        # Detect language for bilingual support (improved heuristic)
        bisaya_words = [
            "asa", "unsay", "ngano", "diin", "kinsa", "kanus-a", "pila", "gamay", 
            "dako", "mao", "ug", "uy", "man", "gani", "diay", "sige", "kinahanglan", 
            "bisan", "sab", "gud", "pod", "wala", "naa", "ikaw", "ako"
        ]
        user_words = user_message.lower().split()
        is_bisaya = any(word in bisaya_words for word in user_words)
        
        # Get the appropriate language responses
        lang_key = "ceb" if is_bisaya else "en"
        responses = lab_info.get(lang_key)
        if not responses:
            responses = lab_info.get("en", [])

        # Combine all response lines
        if isinstance(responses, list):
            response_text = "\n".join(responses)
        else:
            response_text = str(responses)

        result = {"text": response_text}
        
        # Add images if available
        images = None
        if isinstance(lab_info.get("images"), list):
            images = [str(x) for x in lab_info.get("images") if x]
        elif isinstance(lab_info.get("imageUrls"), list):
            images = [str(x) for x in lab_info.get("imageUrls") if x]
        elif lab_info.get("image"):
            images = [str(lab_info.get("image"))]
        elif lab_info.get("imageUrl"):
            images = [str(lab_info.get("imageUrl"))]

        if images:
            result["images"] = images
            # keep backward compatibility for clients that only read `image`
            result["image"] = images[0]
        
        # Add map data if available
        map_id = lab_info.get("map_id") or lab_info.get("mapId")
        if lab_info.get("coordinates") and map_id:
            location_name = lab_info.get("locationName") or f"ComLab {lab_number}"
            result["custom"] = {
                "mapData": {
                    "locationName": location_name,
                    "coordinates": lab_info["coordinates"],
                    "mapId": map_id
                }
            }
        
        return result

    def _get_faculty_room_response(self, college: str, user_message: str) -> dict:
        """Get location response for specific faculty room from JSON structure"""
        
        entry = next((e for e in self.responses if e.get("intent") == "ask_faculty_room_location"), None)
        faculty_rooms = (entry or {}).get("faculty_rooms", {})
        college_info = faculty_rooms.get(college.upper())
        
        if not college_info:
            return {"text": f"Sorry, I don't have information about {college} faculty room."}
        
        # Detect language for bilingual support (improved heuristic)
        bisaya_words = [
            "asa", "unsay", "ngano", "diin", "kinsa", "kanus-a", "pila", "gamay", 
            "dako", "mao", "ug", "uy", "man", "gani", "diay", "sige", "kinahanglan", 
            "bisan", "sab", "gud", "pod", "wala", "naa", "ikaw", "ako"
        ]
        user_words = user_message.lower().split()
        is_bisaya = any(word in bisaya_words for word in user_words)
        
        # Get the appropriate language responses
        lang_key = "ceb" if is_bisaya else "en"
        responses = college_info.get(lang_key)
        if not responses:
            responses = college_info.get("en", [])

        # Combine all response lines
        if isinstance(responses, list):
            response_text = "\n".join(responses)
        else:
            response_text = str(responses)

        result = {"text": response_text}
        
        # Add map data if available
        map_id = college_info.get("map_id") or college_info.get("mapId")
        pins_raw = college_info.get("pins")
        
        pins_out = []
        if isinstance(pins_raw, list):
            for idx, p in enumerate(pins_raw):
                coords = None
                if isinstance(p, dict) and isinstance(p.get("coordinates"), list) and len(p.get("coordinates")) == 2:
                    coords = p.get("coordinates")
                name = None
                if isinstance(p, dict):
                    name = str(p.get("name") or "").strip()
                if not name:
                    name = f"Pin {idx + 1}"
                if coords:
                    pins_out.append({"name": name, "coordinates": coords})

        if map_id:
            if pins_out:
                result["custom"] = {
                    "mapData": {
                        "locationName": college.upper() + " Faculty Room",
                        "pins": pins_out,
                        "mapId": map_id,
                    }
                }
            elif college_info.get("coordinates"):
                result["custom"] = {
                    "mapData": {
                        "locationName": college.upper() + " Faculty Room",
                        "coordinates": college_info["coordinates"],
                        "mapId": map_id,
                    }
                }
        
        return result


# -------------------------
# Rasa Actions
# -------------------------
class ActionReplyFromJson(Action):
    def __init__(self):
        self.helper = ActionReplyFromJsonHelper()

    def name(self) -> str:
        return "action_reply_from_json"

    async def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: dict):

        intent = tracker.latest_message.get("intent", {}).get("name")
        user_msg = tracker.latest_message.get("text", "")
        category = tracker.get_slot("category")
        sub_category = tracker.get_slot("sub_category")

        # Entity-based ComLab lookup
        if intent == "locate_comlab":
            raw_lab = None
            for entity in tracker.latest_message.get("entities", []):
                if entity.get("entity") == "lab_number":
                    raw_lab = entity.get("value")
                    break

            if raw_lab is None:
                raw_lab = tracker.get_slot("lab_number")

            lab_number = self.helper._normalize_lab_number(raw_lab)

            # If lab number exists, respond with lab-specific info
            if lab_number:
                response = self.helper._get_lab_location_response(lab_number, user_msg)

                if response.get("text"):
                    dispatcher.utter_message(text=response["text"])
                if isinstance(response.get("images"), list):
                    for img in response.get("images"):
                        if img:
                            dispatcher.utter_message(image=img)
                elif response.get("image"):
                    dispatcher.utter_message(image=response["image"])
                if response.get("custom"):
                    dispatcher.utter_message(json_message=response["custom"])

                return []

            # If no lab number extracted, use the generic locate_comlab response
            response = self.helper.get_response(
                "locate_comlab",
                category="comlab",
                sub_category="computer_laboratories",
                user_message=user_msg,
            )

            if isinstance(response, dict):
                if response.get("text"):
                    dispatcher.utter_message(text=response["text"])
                if isinstance(response.get("images"), list):
                    for img in response.get("images"):
                        if img:
                            dispatcher.utter_message(image=img)
                elif response.get("image"):
                    dispatcher.utter_message(image=response["image"])
                if response.get("custom"):
                    dispatcher.utter_message(json_message=response["custom"])
            else:
                dispatcher.utter_message(text=response)

            return []

        # Entity-based Location lookup - NOW SUPPORTS MULTIPLE LOCATIONS
        if intent == "ask_locations":
            # Get all location entities from the tracker
            location_entities = list(tracker.get_latest_entity_values("location_name"))
            
            # DEBUG: Log what entities were extracted
            print(f"DEBUG - ask_locations: Extracted entities: {location_entities}")
            
            # Check if extracted entities are valid (not generic words like 'faculty room', 'room')
            invalid_entities = ['faculty room', 'room', 'office', 'building', 'location']
            has_only_invalid = all(
                any(inv in str(ent).lower() for inv in invalid_entities)
                for ent in location_entities
            ) if location_entities else True
            
            # If no entities found OR only invalid generic entities, try to find ALL locations in text
            if not location_entities or has_only_invalid:
                print(f"DEBUG - No valid entities found, searching text for all locations...")
                guessed_locations = self.helper._guess_all_locations_from_text(user_msg)
                if guessed_locations:
                    location_entities = guessed_locations
                    print(f"DEBUG - Found locations in text: {location_entities}")

            if location_entities:
                # DEBUG: Log what we're processing
                print(f"DEBUG - Processing {len(location_entities)} locations: {location_entities}")
                
                processed_count = 0
                all_map_pins = []  # Collect all pins for combined map
                first_map_id = None  # Use the first map_id found
                
                # First pass: send all text and images, collect map data
                for i, location_name in enumerate(location_entities):
                    response = self.helper.get_location_response(location_name, user_msg)
                    
                    # DEBUG: Log each location processing
                    print(f"DEBUG - Processing location {i+1}/{len(location_entities)}: {location_name}")
                    
                    if response.get("text") and not response["text"].startswith("Sorry, I don't have information"):
                        # Send text response for this location
                        dispatcher.utter_message(text=response["text"])
                        print(f"DEBUG - Sent text for {location_name}")
                        
                        # Send image for this location if available
                        if response.get("images"):
                            for img in response["images"]:
                                if img:
                                    dispatcher.utter_message(image=img)
                                    print(f"DEBUG - Sent image for {location_name}")
                        elif response.get("image"):
                            dispatcher.utter_message(image=response["image"])
                            print(f"DEBUG - Sent image for {location_name}")
                        
                        # Collect map data for combined map
                        if response.get("custom") and response["custom"].get("mapData"):
                            map_data = response["custom"]["mapData"]
                            
                            # Track the first map_id we find
                            if first_map_id is None and map_data.get("mapId"):
                                first_map_id = map_data["mapId"]
                            
                            # Collect pins with location name prefix
                            if map_data.get("pins"):
                                for pin in map_data["pins"]:
                                    pin_copy = dict(pin)  # Copy to avoid modifying original
                                    # Prefix pin name with location for clarity
                                    location_prefix = str(map_data.get("locationName", location_name))
                                    if "name" in pin_copy:
                                        pin_copy["name"] = f"{location_prefix}: {pin_copy['name']}"
                                    else:
                                        pin_copy["name"] = location_prefix
                                    all_map_pins.append(pin_copy)
                            elif map_data.get("coordinates"):
                                # If no pins but has coordinates, create a pin
                                all_map_pins.append({
                                    "name": str(map_data.get("locationName", location_name)),
                                    "coordinates": map_data["coordinates"]
                                })
                        
                        processed_count += 1

                # DEBUG: Log final count
                print(f"DEBUG - Successfully processed {processed_count} locations")
                
                # Send helper text before the combined map (only if multiple pins)
                if all_map_pins and first_map_id and len(all_map_pins) > 1:
                    dispatcher.utter_message(text="Please press the zoom out button to see the other pinpoint of the map")
                    print(f"DEBUG - Sent zoom out helper text")
                
                # Send combined map with all pins if we have any
                if all_map_pins and first_map_id:
                    combined_map = {
                        "mapData": {
                            "locationName": f"Multiple Locations ({processed_count})",
                            "pins": all_map_pins,
                            "mapId": first_map_id
                        }
                    }
                    dispatcher.utter_message(json_message=combined_map)
                    print(f"DEBUG - Sent combined map with {len(all_map_pins)} pins")

                if processed_count == 0:
                    dispatcher.utter_message(text="Sorry, I couldn't find information about those locations.")
                
                return []

            # If no location extracted, use generic response if available
            response = self.helper.get_response(
                "ask_locations",
                user_message=user_msg
            )
            if isinstance(response, dict):
                if response.get("text"):
                    dispatcher.utter_message(text=response["text"])
            else:
                dispatcher.utter_message(text=response)
            return []

        # Entity-based Faculty Room lookup - NOW SUPPORTS MULTIPLE COLLEGES
        if intent == "ask_faculty_room_location":
            # Get all college entities from the tracker
            college_entities = list(tracker.get_latest_entity_values("college"))
            
            # DEBUG: Log what entities were extracted
            print(f"DEBUG - ask_faculty_room_location: Extracted entities: {college_entities}")
            
            if not college_entities:
                slot_college = tracker.get_slot("college")
                if slot_college:
                    college_entities = [slot_college]

            if college_entities:
                # DEBUG: Log what we're processing
                print(f"DEBUG - Processing {len(college_entities)} colleges: {college_entities}")
                
                all_map_pins = []  # Collect all pins for combined map
                first_map_id = None  # Use the first map_id found
                processed_count = 0
                
                # First pass: send all text, collect map data
                for i, college in enumerate(college_entities):
                    response = self.helper._get_faculty_room_response(college, user_msg)
                    
                    # DEBUG: Log each college processing
                    print(f"DEBUG - Processing college {i+1}/{len(college_entities)}: {college}")
                    
                    if response.get("text"):
                        # Send text response for this location
                        dispatcher.utter_message(text=response["text"])
                        print(f"DEBUG - Sent text for {college}")
                        
                        # Collect map data for combined map
                        if response.get("custom") and response["custom"].get("mapData"):
                            map_data = response["custom"]["mapData"]
                            
                            # Track the first map_id we find
                            if first_map_id is None and map_data.get("mapId"):
                                first_map_id = map_data["mapId"]
                            
                            # Collect pins with college name prefix
                            if map_data.get("pins"):
                                for pin in map_data["pins"]:
                                    pin_copy = dict(pin)
                                    college_prefix = str(map_data.get("locationName", f"{college} Faculty Room"))
                                    if "name" in pin_copy:
                                        pin_copy["name"] = f"{college_prefix}: {pin_copy['name']}"
                                    else:
                                        pin_copy["name"] = college_prefix
                                    all_map_pins.append(pin_copy)
                            elif map_data.get("coordinates"):
                                all_map_pins.append({
                                    "name": str(map_data.get("locationName", f"{college} Faculty Room")),
                                    "coordinates": map_data["coordinates"]
                                })
                        
                        processed_count += 1
                
                # Send helper text before the combined map (only if multiple pins)
                if all_map_pins and first_map_id and len(all_map_pins) > 1:
                    dispatcher.utter_message(text="Please press the zoom out button to see the other pinpoint of the map")
                    print(f"DEBUG - Sent zoom out helper text")
                
                # Send combined map with all pins if we have any
                if all_map_pins and first_map_id:
                    combined_map = {
                        "mapData": {
                            "locationName": f"Multiple Faculty Rooms ({processed_count})",
                            "pins": all_map_pins,
                            "mapId": first_map_id
                        }
                    }
                    dispatcher.utter_message(json_message=combined_map)
                    print(f"DEBUG - Sent combined map with {len(all_map_pins)} pins")
                
                return []

            # If no college extracted, use generic response
            response = self.helper.get_response(
                "ask_faculty_room_location",
                user_message=user_msg
            )
            
            if isinstance(response, dict):
                if response.get("text"):
                    dispatcher.utter_message(text=response["text"])
            else:
                dispatcher.utter_message(text=response)
            
            return []

        # ✨ FIX: if intent == ask_more → DO NOT call main response
        if intent == "ask_more":
            last_topic = self.helper.get_dynamic_slot("last_topic")
            follow_ups = self.helper.get_follow_up(last_topic)

            for line in follow_ups:
                dispatcher.utter_message(text=line)
            return []

        # Otherwise → normal answer
        response = self.helper.get_response(
            intent, category=category,
            sub_category=sub_category,
            user_message=user_msg
        )

        # If NLU intent is not ask_locations but the text clearly contains a known location alias,
        # answer with location response instead of generic fallback.
        if intent not in {"ask_locations", "locate_comlab", "ask_faculty_room_location", "ask_more"}:
            guessed = self.helper._guess_location_from_text(user_msg)
            if guessed:
                loc_resp = self.helper.get_location_response(guessed, user_msg)
                if loc_resp and loc_resp.get("text") and not loc_resp["text"].startswith("Sorry, I don't have information"):
                    dispatcher.utter_message(text=loc_resp["text"])
                    if loc_resp.get("custom"):
                        dispatcher.utter_message(json_message=loc_resp["custom"])
                    return []
        
        if isinstance(response, dict):
            if response.get("text"):
                dispatcher.utter_message(text=response["text"])

            if isinstance(response.get("images"), list):
                for img in response.get("images"):
                    if img:
                        dispatcher.utter_message(image=img)
            elif response.get("image"):
                dispatcher.utter_message(image=response["image"])
                
            if response.get("custom"):
                dispatcher.utter_message(json_message=response["custom"])
        else:
            dispatcher.utter_message(text=response)
        
        return []


class ActionSetDynamicSlot(Action):
    """Set any dynamic slot during the conversation."""
    def __init__(self):
        self.helper = ActionReplyFromJsonHelper()

    def name(self) -> str:
        return "action_set_dynamic_slot"

    async def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: dict):
        slot_name = tracker.get_slot("slot_name")
        slot_value = tracker.get_slot("slot_value")
        if slot_name and slot_value:
            self.helper.set_dynamic_slot(slot_name, slot_value)
            dispatcher.utter_message(text=f"Slot '{slot_name}' set to '{slot_value}'.")
        return []
