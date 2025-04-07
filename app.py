# app.py
import os
import io
import tempfile
import traceback
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from google.cloud import translate_v2 as translate
from google.cloud import texttospeech, speech
from pydub import AudioSegment
from PIL import Image
import torch
from transformers import BlipProcessor, BlipForConditionalGeneration

# --- Logging Setup ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s:%(message)s')

# --- Google Credentials ---
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "./cloud-translation-service-1ec3fca0d41b.json"

# --- Flask Setup ---
app = Flask(__name__)
CORS(app)

# --- Google Cloud Clients ---
translate_client = translate.Client()
tts_client = texttospeech.TextToSpeechClient()
speech_client = speech.SpeechClient()

# --- BLIP Model Setup ---
MODEL_NAME = "Salesforce/blip-image-captioning-large"
captioning_model_loaded = False
processor = None
model = None
try:
    device = (
        "cuda" if torch.cuda.is_available()
        else "mps" if torch.backends.mps.is_available()
        else "cpu"
    )
    processor = BlipProcessor.from_pretrained(MODEL_NAME, use_fast=False)
    model = BlipForConditionalGeneration.from_pretrained(MODEL_NAME).to(device)
    captioning_model_loaded = True
    logging.info(f"BLIP model loaded on {device}")
except Exception as e:
    logging.error(f"Failed to load BLIP model: {e}")

# --- Helper Functions ---
def generate_caption(image_pil):
    image_rgb = image_pil.convert("RGB")
    inputs = processor(image_rgb, return_tensors="pt").to(model.device)
    output = model.generate(**inputs, max_length=75, num_beams=5, early_stopping=True)
    return processor.decode(output[0], skip_special_tokens=True)

# --- Routes ---

@app.route("/")
def home():
    return "Server is running"

@app.route("/image-captioning", methods=["POST"])
def image_captioning():
    if not captioning_model_loaded:
        return jsonify({"error": "Model not loaded"}), 500
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400
    try:
        image = Image.open(io.BytesIO(file.read()))
        caption = generate_caption(image)
        return jsonify({"caption": caption})
    except Exception as e:
        logging.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route("/speech-to-text", methods=["POST"])
def speech_to_text():
    file = request.files.get("file")
    lang = request.form.get("language_code", "en-US")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400
    temp_audio_path = None
    try:
        audio_bytes = file.read()
        ext = os.path.splitext(file.filename)[1].replace(".", "").lower() or None
        audio = AudioSegment.from_file(io.BytesIO(audio_bytes), format=ext)
        audio = audio.set_channels(1).set_frame_rate(16000).set_sample_width(2)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            temp_audio_path = temp_audio.name
            audio.export(temp_audio_path, format="wav")

        with open(temp_audio_path, "rb") as audio_file:
            content = audio_file.read()

        audio_obj = speech.RecognitionAudio(content=content)
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,
            language_code=lang
        )

        response = speech_client.recognize(config=config, audio=audio_obj)
        transcript = " ".join([res.alternatives[0].transcript for res in response.results])
        return jsonify({"transcript": transcript or "No speech detected"})

    except Exception as e:
        logging.error(traceback.format_exc())
        msg = str(e)
        if "LANGUAGE_CODE_INVALID" in msg:
            msg = f"Invalid or unsupported language code: '{lang}'"
        return jsonify({"error": msg}), 500
    finally:
        if temp_audio_path and os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)

@app.route("/detect-language", methods=["POST"])
def detect_language():
    data = request.get_json()
    text = data.get("text")
    if not text:
        return jsonify({"error": "No text provided"}), 400
    try:
        result = translate_client.detect_language(text)
        return jsonify({
            "detected_language": result.get("language"),
            "confidence": result.get("confidence", "N/A")
        })
    except Exception as e:
        logging.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route("/translate", methods=["POST"])
def translate_text():
    data = request.get_json()
    text = data.get("text")
    target = data.get("target_language")
    if not text or not target:
        return jsonify({"error": "Missing text or target_language"}), 400
    try:
        result = translate_client.translate(text, target_language=target)
        return jsonify({"translated_text": result["translatedText"]})
    except Exception as e:
        logging.error(traceback.format_exc())
        msg = str(e)
        if "invalid" in msg.lower():
            msg = f"Invalid or unsupported target language code: '{target}'"
        return jsonify({"error": msg}), 500

@app.route("/text-to-speech", methods=["POST"])
def text_to_speech():
    data = request.get_json()
    text = data.get("text")
    lang = data.get("language_code", "en-US")
    if not text:
        return jsonify({"error": "Missing text"}), 400
    try:
        input_text = texttospeech.SynthesisInput(text=text)
        voice = texttospeech.VoiceSelectionParams(language_code=lang, ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL)
        audio_config = texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3)
        response = tts_client.synthesize_speech(input=input_text, voice=voice, audio_config=audio_config)
        return jsonify({"audioContent": response.audio_content.decode("latin1")})
    except Exception as e:
        logging.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

# --- Run the app ---
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)