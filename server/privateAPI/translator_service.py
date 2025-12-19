#!/usr/bin/env python3
"""
Private translation service using CTranslate2, OPUS-MT, or NLLB.
Run as a subprocess from the Node.js private API.
"""

import argparse
import json
import os
import re
import sys
import warnings
from typing import Dict

warnings.filterwarnings("ignore")

os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
os.environ.setdefault("TRANSFORMERS_NO_ADVISORY_WARNINGS", "1")
os.environ.setdefault("HF_HUB_DISABLE_PROGRESS_BARS", "1")

# Words to preserve during translation (case-insensitive)
WORDS_TO_PRESERVE = [
    "BukSU",
    "Buksu",
    "university",
    "clinic",
    "laboratory",
    "admissions",
    "portal",
    "try",
    "application",
    # Add more words you want to keep in English
]

POST_FILTER_MAP: Dict[str, str] = {
    "ang the": "ang",
    "sa the": "sa",
    "ug and": "ug",
    "mga are": "mga",
    "kon": "kong",
}

def preserve_words_before_translation(text: str) -> str:
    """Temporarily disabled - translation models corrupt placeholders"""
    return text

def restore_preserved_words(text: str) -> str:
    """Temporarily disabled - translation models corrupt placeholders"""
    return text

OPUS_MT_MODEL_NAME = os.environ.get("OPUS_MT_MODEL", "Helsinki-NLP/opus-mt-en-ceb")
OPUS_MT_PIPELINE = None


def _resolve_ct2_model_dir(model_path: str) -> str:
    if not model_path:
        return ""
    if os.path.isfile(os.path.join(model_path, "model.bin")):
        return model_path
    if not os.path.isdir(model_path):
        return model_path

    candidates = []
    try:
        for name in os.listdir(model_path):
            d = os.path.join(model_path, name)
            if os.path.isdir(d) and os.path.isfile(os.path.join(d, "model.bin")):
                candidates.append(d)
    except Exception:
        return model_path

    if not candidates:
        return model_path

    for d in candidates:
        base = os.path.basename(d).lower()
        if base in ("en-ceb", "eng-ceb", "en_ceb", "eng_ceb"):
            return d
    return candidates[0]

def _translate_opus_mt(text: str) -> str:
    """Fast translation using preloaded OPUS-MT pipeline."""
    global OPUS_MT_PIPELINE
    if OPUS_MT_PIPELINE is None:
        try:
            from transformers import pipeline
            OPUS_MT_PIPELINE = pipeline("translation", model=OPUS_MT_MODEL_NAME)
        except Exception as e:
            raise RuntimeError(f"OPUS-MT pipeline not available: {e}")
    result = OPUS_MT_PIPELINE(text)
    return result[0]['translation_text']

def _translate_ctranslate2(text: str, model_path: str, spm_path: str) -> str:
    import ctranslate2

    resolved_model_dir = _resolve_ct2_model_dir(model_path)
    if not resolved_model_dir or not os.path.isdir(resolved_model_dir):
        raise RuntimeError(f"CTranslate2 model directory not found: {model_path}")

    translator = ctranslate2.Translator(resolved_model_dir)

    if spm_path and os.path.isfile(spm_path):
        import sentencepiece as spm
        sp = spm.SentencePieceProcessor(model_file=spm_path)
        src_tokens = sp.encode(text, out_type=str)
        results = translator.translate_batch([src_tokens])
        translated_tokens = results[0].hypotheses[0] if results and results[0].hypotheses else []
        return sp.decode(translated_tokens)

    try:
        from transformers import AutoTokenizer
    except Exception as e:
        raise RuntimeError(f"Transformers is required for ctranslate2 without spm.model: {e}")

    tokenizer_source = os.environ.get("CT2_TOKENIZER_PATH") or os.environ.get("CT2_TOKENIZER_NAME") or OPUS_MT_MODEL_NAME
    tokenizer = AutoTokenizer.from_pretrained(tokenizer_source)

    src_tokens = tokenizer.tokenize(text)
    results = translator.translate_batch([src_tokens])
    translated_tokens = results[0].hypotheses[0] if results and results[0].hypotheses else []
    translated = tokenizer.convert_tokens_to_string(translated_tokens)
    return translated.strip()

def _translate_nllb(text: str) -> str:
    from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
    import torch

    model_name = os.environ.get("NLLB_MODEL_NAME", "facebook/nllb-200-distilled-600M")
    src_lang = os.environ.get("NLLB_SRC_LANG", "eng_Latn")
    tgt_lang = os.environ.get("NLLB_TGT_LANG", "ceb_Latn")

    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)

    if hasattr(tokenizer, "src_lang"):
        tokenizer.src_lang = src_lang

    encoded = tokenizer(text, return_tensors="pt")
    encoded = {k: v.to(device) for k, v in encoded.items()}

    forced_bos_token_id = None
    if hasattr(tokenizer, "lang_code_to_id") and tgt_lang in tokenizer.lang_code_to_id:
        forced_bos_token_id = tokenizer.lang_code_to_id[tgt_lang]
    else:
        try:
            forced_bos_token_id = tokenizer.convert_tokens_to_ids(tgt_lang)
        except Exception:
            forced_bos_token_id = None
    generated = model.generate(
        **encoded,
        forced_bos_token_id=forced_bos_token_id,
        max_new_tokens=int(os.environ.get("NLLB_MAX_NEW_TOKENS", "256")),
    )
    out = tokenizer.batch_decode(generated, skip_special_tokens=True)
    return (out[0] if out else "").strip()

def translate_text(text: str, model_path: str, spm_path: str, backend: str) -> str:
    # Preserve specific words before translation
    text = preserve_words_before_translation(text)
    
    if backend == "ctranslate2":
        translated = _translate_ctranslate2(text, model_path, spm_path)
    elif backend == "nllb":
        translated = _translate_nllb(text)
    elif backend == "opus_mt":
        translated = _translate_opus_mt(text)
    elif backend == "auto":
        if model_path and os.path.isdir(model_path) and spm_path and os.path.isfile(spm_path):
            try:
                translated = _translate_ctranslate2(text, model_path, spm_path)
            except Exception:
                try:
                    translated = _translate_opus_mt(text)
                except Exception:
                    translated = _translate_nllb(text)
        else:
            try:
                translated = _translate_opus_mt(text)
            except Exception:
                translated = _translate_nllb(text)
    else:
        raise RuntimeError(f"Unknown backend: {backend}")

    # Apply post-filter map
    for src, dst in POST_FILTER_MAP.items():
        translated = translated.replace(src, dst)
    
    # Restore preserved words
    translated = restore_preserved_words(translated)

    return translated

def main():
    parser = argparse.ArgumentParser(description="Translate English to Cebuano")
    parser.add_argument("--text", required=True)
    parser.add_argument("--model", default="", help="Path to CTranslate2 model directory")
    parser.add_argument("--spm", default="", help="Path to SentencePiece model file")
    parser.add_argument("--backend", default=os.environ.get("TRANSLATOR_BACKEND", "auto"),
                        choices=["auto", "ctranslate2", "nllb", "opus_mt"])
    
    args = parser.parse_args()
    
    try:
        result = translate_text(args.text, args.model, args.spm, args.backend)
        print(json.dumps({"success": True, "translatedText": result}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
