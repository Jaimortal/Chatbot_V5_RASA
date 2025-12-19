# Private Translation Service (Python CTranslate2 + NLLB)

## Prerequisites

- Python 3.8+
- pip
- (Windows) If Python is not on PATH, you can set:
```bash
set PYTHON_CMD=py
```

## Installation

1. Navigate to the service directory:
```bash
cd server/privateAPI
```

2. Install CTranslate2 and converter:
```bash
pip install ctranslate2
ct2-transformers-converter --model Helsinki-NLP/opus-mt-en-ceb --output_dir ./models/ctranslate2/en-ceb
```

3. Install remaining Python dependencies:
```bash
pip install -r requirements.txt
```

## Choose a Translation Backend

- **Option A (recommended for best accuracy, easiest setup): NLLB (Transformers)**
  - No local model files required.
  - The first run will download the model from HuggingFace.
- **Option B (fastest runtime): CTranslate2**
  - Requires the model you converted above in `models/ctranslate2/en-ceb/`
  - Optionally provide a SentencePiece model at `models/spm.model` (not required if using Transformers tokenizer)

## Environment Variables (Optional)

```bash
export CTRANSLATE2_MODEL_PATH=./models/ctranslate2/en-ceb
export SENTENCEPIECE_MODEL=./models/spm.model
export TRANSLATOR_BACKEND=nllb   # auto | nllb | ctranslate2
```

## How it works

- The backend `/api/admin/translate` endpoint spawns `translator_service.py` as a subprocess.
- The admin dashboard calls `/api/admin/translate` when the Cebuano field is empty on save.
- You can extend `POST_FILTER_MAP` in the Python script to improve output quality.

## Backend selection

Set `TRANSLATOR_BACKEND`:
- `nllb` (best accuracy, requires `transformers` + `torch`)
- `ctranslate2` (fastest, requires local model assets)
- `auto` (default): use CTranslate2 if model files exist; otherwise use NLLB

## Testing the Python service directly

```bash
python translator_service.py --text "Hello world" --backend nllb
```

## Integration

The admin dashboard automatically uses this when you save a response with an empty Cebuano field. Translation runs in the background, so the modal closes immediately and you'll see a toast when it completes.

## Running the entire system

1. Start the main server:
```bash
# From project root
npm run dev
```

2. Open Admin Dashboard:
- Navigate to `/admin`
- Enable **Auto Translate** in **User Privileges** if desired

3. Test auto-translation:
- Edit an intent
- Fill English field, leave Cebuano empty
- Save
- Modal closes immediately; toast appears when translation finishes

## Troubleshooting

- If translation fails, check the server console for subprocess errors.
- Ensure Python dependencies are installed from `requirements.txt`.
- For CTranslate2, verify the model exists at the expected path.
