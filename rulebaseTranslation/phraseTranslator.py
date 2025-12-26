#!/usr/bin/env python3
"""
Phrase-based English to Cebuano translation module
Uses phrase_rules.json for rule-based translation
"""

import json
import os
import re
import sys
import argparse
from pathlib import Path
from typing import Dict, Optional

class PhraseTranslator:
    def __init__(self, rules_file: Optional[str] = None):
        """Initialize the phrase translator with rules file"""
        if rules_file is None:
            # Default to phrase_rules.json in same directory as script
            script_dir = Path(__file__).parent
            rules_file = script_dir / "phrase_rules.json"
        
        self.rules_file = Path(rules_file)
        self.phrase_rules = {}
        self.load_rules()
    
    def load_rules(self):
        """Load phrase rules from JSON file"""
        try:
            if self.rules_file.exists():
                with open(self.rules_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.phrase_rules = data.get('phrase_rules', {})
            else:
                self.phrase_rules = {}
        except Exception as e:
            self.phrase_rules = {}
    
    def translate_text(self, text: str) -> str:
        """
        Translate English text to Cebuano using phrase rules
        Prioritizes longer phrases to avoid partial matches
        """
        if not text or not isinstance(text, str):
            return text
        
        # Sort phrases by length (longer first) to prioritize complete phrases
        sorted_phrases = sorted(self.phrase_rules.keys(), key=len, reverse=True)
        
        result = text.lower()
        translations_made = []
        
        # Apply phrase-based translations
        for phrase in sorted_phrases:
            if phrase in result:
                translation = self.phrase_rules[phrase]
                # Use word boundaries to avoid partial matches
                pattern = r'\b' + re.escape(phrase) + r'\b'
                result = re.sub(pattern, translation, result, flags=re.IGNORECASE)
                translations_made.append(f"'{phrase}' -> '{translation}'")
        
        # Capitalize first letter if original was capitalized
        if text and text[0].isupper():
            result = result.capitalize()
        
        return result
    
    def get_translation_info(self) -> Dict:
        """Get information about the loaded translation rules"""
        return {
            "rules_file": str(self.rules_file),
            "total_rules": len(self.phrase_rules),
            "sample_rules": dict(list(self.phrase_rules.items())[:5])
        }

def main():
    """Main function with command-line interface"""
    parser = argparse.ArgumentParser(description='Phrase-based English to Cebuano translator')
    parser.add_argument('--translate', type=str, help='Text to translate')
    parser.add_argument('--test', action='store_true', help='Run test translations')
    parser.add_argument('--info', action='store_true', help='Show translation info')
    
    args = parser.parse_args()
    translator = PhraseTranslator()
    
    if args.translate:
        # Translate single text and output JSON
        translated = translator.translate_text(args.translate)
        result = {
            "success": True,
            "translatedText": translated,
            "originalText": args.translate
        }
        print(json.dumps(result))
    elif args.test:
        # Run test translations
        test_phrases = [
            "hello, how are you?",
            "where is the nearest restaurant?",
            "thank you for your help",
            "good morning",
            "i need help"
        ]
        
        print("Phrase Translator Test:")
        print("=" * 40)
        
        for phrase in test_phrases:
            translated = translator.translate_text(phrase)
            print(f"EN: {phrase}")
            print(f"CEB: {translated}")
            print("-" * 20)
        
        print("\nTranslation Info:")
        info = translator.get_translation_info()
        for key, value in info.items():
            print(f"{key}: {value}")
    elif args.info:
        # Show translation info as JSON
        info = translator.get_translation_info()
        print(json.dumps(info, indent=2))
    else:
        # Default: run test
        main()

if __name__ == "__main__":
    main()
