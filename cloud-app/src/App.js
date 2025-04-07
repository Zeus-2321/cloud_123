// App.js
import React, { useState, useCallback } from "react";
import axios from "axios";
import "./App.css"; // Ensure App.css is linked

const API_URL = "http://127.0.0.1:5000";

// Language list for Translation/TTS
const LANGUAGES_TRANSLATE_TTS = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "hi", name: "Hindi" },
  { code: "ja", name: "Japanese" },
  { code: "ar", name: "Arabic" },
  { code: "bn", name: "Bengali" },
  { code: "zh-CN", name: "Chinese (Simplified)" },
  { code: "ko", name: "Korean" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "it", name: "Italian" },
  { code: "id", name: "Indonesian" },
  { code: "nl", name: "Dutch" },
  { code: "sv", name: "Swedish" },
  { code: "tr", name: "Turkish" },
  { code: "vi", name: "Vietnamese" },
  // Add more languages as needed
];

// Language list specifically for STT (Update based on Google STT support)
const LANGUAGES_STT = [
    { code: "en-US", name: "English (US)" },
    { code: "en-GB", name: "English (UK)" },
    { code: "es-ES", name: "Spanish (Spain)" },
    { code: "es-MX", name: "Spanish (Mexico)" },
    { code: "fr-FR", name: "French (France)" },
    { code: "de-DE", name: "German (Germany)" },
    { code: "hi-IN", name: "Hindi (India)" },
    { code: "ja-JP", name: "Japanese (Japan)" },
    { code: "ar-XA", name: "Arabic (Modern Standard)"}, // Example, check exact codes needed
    { code: "bn-IN", name: "Bengali (India)" },
    { code: "cmn-Hans-CN", name: "Chinese (Mandarin, Simplified)" },
    { code: "ko-KR", name: "Korean (South Korea)" },
    { code: "pt-BR", name: "Portuguese (Brazil)" },
    { code: "ru-RU", name: "Russian (Russia)" },
    { code: "it-IT", name: "Italian (Italy)" },
    { code: "id-ID", name: "Indonesian (Indonesia)" },
    { code: "nl-NL", name: "Dutch (Netherlands)" },
    // Add more STT-supported languages as needed
];


export default function App() {
  // --- State for Inputs ---
  const [text, setText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("en"); // Target for text translation
  const [audioFile, setAudioFile] = useState(null);
  const [audioFileName, setAudioFileName] = useState("");
  const [audioSourceLanguage, setAudioSourceLanguage] = useState("en-US"); // Language of uploaded audio
  const [captionFile, setCaptionFile] = useState(null);
  const [captionFileName, setCaptionFileName] = useState("");
  const [transcriptionTargetLanguage, setTranscriptionTargetLanguage] = useState("fr"); // Target for transcription translation

  // --- State for Outputs ---
  const [translatedText, setTranslatedText] = useState(null);
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [transcription, setTranscription] = useState(null);
  const [caption, setCaption] = useState(null);
  const [translatedTranscription, setTranslatedTranscription] = useState(null);

  // --- Loading and Error States ---
  const [loading, setLoading] = useState({
      detect: false,
      translate: false,
      tts: false,
      stt: false,
      caption: false,
      translateStt: false,
  });
  const [error, setError] = useState({
      detect: null,
      translate: null,
      tts: null,
      stt: null,
      caption: null,
      translateStt: null,
   });

  // --- Generic Request Handler (Handles file + additional form data) ---
  const handleRequest = useCallback(
    async (endpoint, data, resultSetter, errorSetter, loadingSetterKey, isFile = false, additionalFormData = {}) => {
      setLoading((prev) => ({ ...prev, [loadingSetterKey]: true }));
      errorSetter(prevError => ({ ...prevError, [loadingSetterKey]: null }));

      try {
        let response;
        if (isFile) {
          const formData = new FormData();
          if (!data) throw new Error("No file provided for upload.");
          formData.append("file", data); // Append file
          // Append additional form data
          for (const key in additionalFormData) {
              if (additionalFormData.hasOwnProperty(key)) {
                  formData.append(key, additionalFormData[key]);
              }
          }
          response = await axios.post(`${API_URL}/${endpoint}`, formData); // Content-Type set by browser for FormData
        } else {
          // JSON request
          response = await axios.post(`${API_URL}/${endpoint}`, data, {
            headers: { "Content-Type": "application/json" },
          });
        }
        console.log(`API Response for ${endpoint}:`, response.data);
        if (response.data.error) {
            throw new Error(response.data.error);
        }
        resultSetter(response.data);
      } catch (err) {
        console.error(`Error in ${endpoint}:`, err);
        const errorMessage = err?.response?.data?.error || err?.message || "An unknown error occurred";
        errorSetter(prevError => ({ ...prevError, [loadingSetterKey]: errorMessage }));
        resultSetter(null);
      } finally {
        setLoading((prev) => ({ ...prev, [loadingSetterKey]: false }));
      }
    },
    []
  );

  // --- Event Handlers for File Inputs ---
  const handleAudioFileChange = (e) => {
    const file = e.target.files[0];
    const inputElement = document.getElementById('audio-upload');
    if (file) {
        setAudioFile(file);
        setAudioFileName(file.name);
    } else {
        setAudioFile(null);
        setAudioFileName("");
        if(inputElement) inputElement.value = "";
    }
    setTranscription(null);
    setTranslatedTranscription(null);
    setError(prev => ({...prev, stt: null, translateStt: null}));
  };

  const handleCaptionFileChange = (e) => {
    const file = e.target.files[0];
    const inputElement = document.getElementById('caption-upload');
     if (file) {
        setCaptionFile(file);
        setCaptionFileName(file.name);
    } else {
        setCaptionFile(null);
        setCaptionFileName("");
        if(inputElement) inputElement.value = "";
    }
    setCaption(null);
    setError(prev => ({...prev, caption: null}));
  };

  // --- Render Helper ---
  const renderResult = (data, dataKey, defaultText, errorMsg, isLoading) => {
    const currentError = errorMsg || null;
    if (isLoading) return <p>Loading...</p>;
    if (currentError) return <p className="error-message">Error: {currentError}</p>;
    const resultText = data && typeof data === 'object' && data.hasOwnProperty(dataKey) ? data[dataKey] : null;
    return <p>{resultText !== null ? resultText : defaultText}</p>;
  };


  return (
    <div className="App">
      <h1>Google Cloud AI & Local ML Services</h1>
      <div className="main-content-area">

        {/* Text Services Section */}
        <div className="service-section" id="text-services">
            <h2>Text Services</h2>
              <textarea
                  rows="4"
                  value={text}
                  onChange={(e) => {
                      setText(e.target.value);
                      setTranslatedText(null);
                      setAudioUrl(null);
                      setError(prev => ({ ...prev, translate: null, tts: null }));
                  }}
                  placeholder="Enter text here for detection, translation, or TTS"
              />
              {/* Language Detection */}
              <button
                  onClick={() => handleRequest("detect-language", { text }, setDetectedLanguage, setError, "detect")}
                  disabled={!text || loading.detect}
              >
                  {loading.detect ? "Detecting..." : "Detect Language"}
              </button>
              {renderResult(detectedLanguage, 'detected_language', 'Language: N/A', error.detect, loading.detect)}
              {detectedLanguage?.confidence && !error.detect && !loading.detect && (
                   // Use specific class for confidence if needed
                   <p className="confidence-score">Confidence: {Number(detectedLanguage.confidence).toFixed(2)}</p>
              )}

              {/* Translation */}
              <div className="inline-controls">
                  <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)}>
                      {/* Use translation language list */}
                      {LANGUAGES_TRANSLATE_TTS.map(lang => (
                          <option key={lang.code} value={lang.code}>{lang.name}</option>
                      ))}
                  </select>
                  <button
                      onClick={() => handleRequest("translate", { text, target_language: targetLanguage }, setTranslatedText, setError, "translate")}
                      disabled={!text || loading.translate}
                  >
                      {loading.translate ? "Translating..." : "Translate"}
                  </button>
              </div>
              {renderResult(translatedText, 'translated_text', 'Translation: N/A', error.translate, loading.translate)}

              {/* Text-to-Speech (using translated text) */}
              <button
                  onClick={() => {
                      if (translatedText?.translated_text) {
                           handleRequest(
                              "text-to-speech",
                              { text: translatedText.translated_text, language_code: targetLanguage },
                              setAudioUrl,
                              setError,
                              "tts"
                           );
                      } else {
                          setError(prev => ({...prev, tts: "Please translate the text first."}));
                          setAudioUrl(null);
                      }
                  }}
                  disabled={!translatedText?.translated_text || loading.tts}
              >
                  {loading.tts ? "Generating Speech..." : "Speak Translated Text"}
              </button>
              {loading.tts && <p>Loading audio...</p>}
              {error.tts && <p className="error-message">Error: {error.tts}</p>}
              {/* Use URL directly from backend response */}
              {audioUrl?.audio_url && !error.tts && !loading.tts && (
                  <audio controls src={`${API_URL}${audioUrl.audio_url}`} key={audioUrl.audio_url}>
                      Your browser does not support the audio element.
                  </audio>
              )}
        </div> {/* End Text Services Section */}


        {/* Speech-to-Text Section */}
        <div className="service-section" id="stt-services">
            <h2>Speech to Text</h2>
              {/* Dropdown for Audio Language */}
              <div className="stt-language-selector" style={{ marginBottom: '15px' }}>
                  <label htmlFor="stt-language-select" style={{ display: 'block', marginBottom: '5px', textAlign:'left', fontWeight:'500' }}>
                      Audio Language:
                  </label>
                  <select
                      id="stt-language-select"
                      value={audioSourceLanguage}
                      onChange={(e) => setAudioSourceLanguage(e.target.value)}
                      // style={{ width: '100%' }} // Width is handled by global select style
                  >
                      {/* Use STT language list */}
                      {LANGUAGES_STT.map(lang => (
                          <option key={`stt-src-${lang.code}`} value={lang.code}>{lang.name}</option>
                      ))}
                  </select>
              </div>
              {/* File Input */}
              <label htmlFor="audio-upload" className="file-input-label"> Choose Audio File </label>
              <input id="audio-upload" type="file" accept="audio/*" onChange={handleAudioFileChange} />
             {audioFileName && <p className="file-name">Selected: {audioFileName}</p>}
              {/* Transcribe Button */}
              <button
                  onClick={() => {
                      handleRequest( "speech-to-text", audioFile, setTranscription, setError, "stt", true, { language_code: audioSourceLanguage } )
                  }}
                  disabled={!audioFile || loading.stt} >
                  {loading.stt ? "Transcribing..." : "Transcribe Speech"}
              </button>
              {renderResult(transcription, 'transcript', 'Transcription: No transcription available', error.stt, loading.stt)}

              {/* Translate Transcription Controls */}
              {transcription?.transcript && !error.stt && (
                  <div className="translation-controls"> {/* Removed inline style, use CSS */}
                      <h4>Translate Transcription:</h4>
                      <div className="inline-controls">
                          <select value={transcriptionTargetLanguage} onChange={(e) => setTranscriptionTargetLanguage(e.target.value)}>
                              {/* Use translation language list */}
                              {LANGUAGES_TRANSLATE_TTS.map(lang => (
                                  <option key={`stt-tr-${lang.code}`} value={lang.code}>{lang.name}</option>
                              ))}
                          </select>
                          <button
                              onClick={() => {
                                  if (transcription?.transcript) {
                                       handleRequest( "translate", { text: transcription.transcript, target_language: transcriptionTargetLanguage }, setTranslatedTranscription, setError, "translateStt" );
                                  }
                              }}
                              disabled={!transcription?.transcript || loading.translateStt} >
                              {loading.translateStt ? "Translating..." : "Translate Transcript"}
                          </button>
                      </div>
                      {renderResult(translatedTranscription, 'translated_text', 'Translated Transcription: N/A', error.translateStt, loading.translateStt)}
                  </div>
              )}
        </div> {/* End Speech-to-Text Section */}


        {/* Image Captioning Section */}
        <div className="service-section" id="image-services">
            <h2>Image Captioning</h2>
            <div className="image-service-block">
                <label htmlFor="caption-upload" className="file-input-label">
                    Choose Image for Captioning
                </label>
                <input
                id="caption-upload"
                type="file"
                accept="image/*"
                onChange={handleCaptionFileChange}
                />
                {captionFileName && (
                <>
                <p className="file-name">Selected: {captionFileName}</p>
                <img
                    src={URL.createObjectURL(captionFile)}
                    alt="Selected for captioning"
                    className="preview-image"
                    style={{ maxWidth: "100%", maxHeight: "300px", marginTop: "10px", borderRadius: "8px" }}
                />
            </>
        )}
        <button
            onClick={() =>
                handleRequest(
                    "image-captioning",
                    captionFile,
                    setCaption,
                    setError,
                    "caption",
                    true
                )
            }
            disabled={!captionFile || loading.caption}
        >
            {loading.caption ? "Generating..." : "Generate Image Caption"}
        </button>
        {renderResult(
            caption,
            "caption",
            "Image Caption: No caption generated",
            error.caption,
            loading.caption
        )}
    </div>
</div>


      </div> {/* End .main-content-area */}
    </div> // End .App div
  );
}