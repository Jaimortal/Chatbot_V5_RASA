import json
import os
import random
import re
from typing import Any, Text, Dict, List, Optional

from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher

# Location aliases for normalizing user input
LOCATION_ALIASES = {
    "college of information technology faculty": "COT Faculty",
    "cit faculty": "COT Faculty",
    "college it faculty": "COT Faculty",
    "comlab 1": "ComLab 1",
    "computer laboratory 1": "ComLab 1",
    "com lab 1": "ComLab 1",
    "cl1": "ComLab 1",

    "comlab 2": "ComLab 2",
    "computer laboratory 2": "ComLab 2",
    "com lab 2": "ComLab 2",
    "cl2": "ComLab 2",

    "comlab 3": "ComLab 3",
    "computer laboratory 3": "ComLab 3",
    "com lab 3": "ComLab 3",
    "cl3": "ComLab 3",

    "comlab 4": "ComLab 4",
    "computer laboratory 4": "ComLab 4",
    "com lab 4": "ComLab 4",
    "cl4": "ComLab 4",

    "comlab 5": "ComLab 5",
    "computer laboratory 5": "ComLab 5",
    "com lab 5": "ComLab 5",
    "cl5": "ComLab 5",

    "comlab 6": "ComLab 6",
    "computer laboratory 6": "ComLab 6",
    "com lab 6": "ComLab 6",
    "cl6": "ComLab 6",

    "comlab 7": "ComLab 7",
    "computer laboratory 7": "ComLab 7",
    "com lab 7": "ComLab 7",
    "cl7": "ComLab 7",

    "comlab 8": "ComLab 8",
    "computer laboratory 8": "ComLab 8",
    "com lab 8": "ComLab 8",
    "cl8": "ComLab 8",

    "comlab 9": "ComLab 9",
    "computer laboratory 9": "ComLab 9",
    "com lab 9": "ComLab 9",
    "cl8": "ComLab 8",

    "comlab 10": "ComLab 10",
    "computer laboratory 10": "ComLab 10",
    "com lab 10": "ComLab 10",
    "cl10": "ComLab 10",

    "comlab 11": "ComLab 11",
    "computer laboratory 11": "ComLab 11",
    "com lab 11": "ComLab 11",
    "cl11": "ComLab 11",

    "comlab 12": "ComLab 12",
    "computer laboratory 12": "ComLab 12",
    "com lab 12": "ComLab 12",
    "cl12": "ComLab 12",

    "faculty room 102": "Faculty Room 102",
    "classroom 204": "Classroom 204"
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
        lower_name = raw_name.lower().strip()
        return LOCATION_ALIASES.get(lower_name, raw_name)

    def get_location_response(self, location_name: str, user_message: str) -> Dict[str, Any]:
        normalized_name = self._normalize_location_name(location_name)
        locations = self.location_responses.get("locations", {})
        location_info = locations.get(normalized_name)
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
        
        # Add map data
        if location_info.get("coordinates") and location_info.get("map_id"):
            result["custom"] = {
                "mapData": {
                    "locationName": normalized_name,
                    "coordinates": location_info["coordinates"],
                    "mapId": location_info["map_id"]
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

        return {"text": response_text}


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

        # Entity-based Location lookup
        if intent == "ask_locations":
            location_name = None
            for entity in tracker.latest_message.get("entities", []):
                if entity.get("entity") == "location_name":
                    location_name = entity.get("value")
                    break

            if location_name is None:
                location_name = tracker.get_slot("location_name")

            if location_name:
                response = self.helper.get_location_response(location_name, user_msg)
                dispatcher.utter_message(text=response["text"])
                if response.get("custom"):
                    dispatcher.utter_message(json_message=response["custom"])
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

        # Entity-based Faculty Room lookup
        if intent == "ask_faculty_room_location":
            college = None
            for entity in tracker.latest_message.get("entities", []):
                if entity.get("entity") == "college":
                    college = entity.get("value")
                    break

            if college is None:
                college = tracker.get_slot("college")

            # If college exists, respond with specific faculty room info
            if college:
                response = self.helper._get_faculty_room_response(college, user_msg)
                dispatcher.utter_message(text=response["text"])
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
