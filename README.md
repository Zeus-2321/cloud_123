# CLOUD_COURSE_PROJECT

## Project Overview

This project delivers a web-based platform showcasing the power of modern AI and Machine Learning services. It integrates Google Cloud's APIs for sophisticated text and speech processing (translation, language detection, text-to-speech, speech-to-text) with a locally executed, state-of-the-art Hugging Face model (Salesforce BLIP) for image captioning. The goal was to create an interactive demonstration of these capabilities through a user-friendly interface, separating concerns between a scalable backend API and a responsive frontend.


## Methodology

### Architecture
The project follows a decoupled architecture with a Python/Flask backend serving a RESTful API and a React.js frontend consuming that API. This separation enables independent development, scalability, and deployment.

### Development Process
We focused on modular design, implementing each AI service integration (Text, Speech, Image) as distinct components in both the frontend and backend for better maintainability and flexibility.

### Key Design Choices

- ### Flask (Backend)
  Chosen for its simplicity, flexibility, and suitability for building REST APIs in Python. It integrates well with Google Cloud client libraries and machine learning libraries.

- ### React (Frontend)
  Selected for building a dynamic and responsive user interface using its component-based architecture.

- ### Google Cloud APIs
  Utilized for language translation, Text-to-Speech (TTS), and Speech-to-Text (STT) due to their scalability, robustness, and high accuracy.

- ### Local BLIP Model (Image Captioning)
  Integrated a locally hosted BLIP model for generating image captions, demonstrating backend ML model deployment with lower inference latency compared to external API calls.

### Deployment Strategy

- ### Frontend Deployment (Netlify)
  - The React app was built as a static site and deployed on Netlify.
  - Configured to pull from GitHub.
  - Environment variables were used to dynamically set the backend API URL.

- ### Backend Deployment (Render)
  - The Flask backend was deployed on Render as a web service.
  - Managed Python dependencies using `requirements.txt`.
  - Used `gunicorn` as the WSGI server for production.
  - Secure handling of Google Cloud credentials via environment variables.

## System Flowchart
The following flowchart represents the overall working of the system, highlighting the interaction between the frontend, backend, and external services.
![System Flowchart]("C:\Users\singh\OneDrive\Desktop\System Flowchart.png")

### Flow Explanation:
1)The user interacts with the React Frontend, providing input through text, file uploads (images/audio), or button clicks.

2)These user actions trigger API requests using Axios to the Flask Backend.

3)The Flask Backend processes these requests and routes them to the appropriate services based on the functionality:
For image-related tasks → Calls the locally hosted Hugging Face BLIP Model for image captioning.
For text or speech-related tasks → Utilizes Google Cloud APIs for:

Translation
Text-to-Speech (TTS)
Speech-to-Text (STT)

4)Once the processing is complete, the backend returns the results in the form of:

JSON response (text, captions, translations)
Audio files (for TTS)

5)The React Frontend dynamically handles and displays these results to the user using different React components.


## Features

*   **Text Services:**Utilizes Google Cloud APIs to automatically detect the language of input text, translate it into various supported languages, and synthesize natural-sounding speech from the translated text (Text-to-Speech).
*   **Speech-to-Text (STT):** Leverages Google Cloud STT and local pydub/ffmpeg processing to transcribe uploaded audio files from multiple source languages, with an option to subsequently translate the generated transcription.
*   **Image Captioning:**  Employs a locally hosted Salesforce BLIP model (via Hugging Face Transformers/PyTorch) within the backend to analyze uploaded images and generate relevant, descriptive text captions.


## Technology Stack

*   **Backend:** Python 3.x, Flask, Flask-CORS, Google Cloud Client Libraries (Translate, TTS, Speech), Hugging Face Transformers, PyTorch, pydub, Pillow
*   **Frontend:** React.js, Axios, CSS
*   **Cloud Services:** Google Cloud Platform (Translate, TTS, STT APIs)
*   **Hosting:**
    *   Frontend: Netlify
    *   Backend: Render

## Prerequisites

Ensure you have the following installed and configured before proceeding:

1.  **Python:** Version 3.8+ (Runs the backend Flask server and ML model).
2.  **Node.js & npm:** Node.js version 16+ recommended (Runs the React frontend build process). npm is included with Node.js.
3.  **ffmpeg & ffprobe:** **Required System Installation.** Essential external programs for backend audio processing (used by `pydub` for Speech-to-Text). Verify installation with `ffmpeg -version`.
4.  **Google Cloud Project:** An active project on Google Cloud Platform.
5.  **Enabled Google Cloud APIs:** Within your project, enable:
    *   Cloud Translation API
    *   Cloud Text-to-Speech API
    *   Cloud Speech-to-Text API
6.  **Google Cloud Service Account Key:** A downloaded `.json` key file for a service account authorized to use the APIs above.
7.  **Key Python ML Libraries:** The project relies heavily on these, which will be installed via `pip` (see Setup section):
    *   **`transformers`** (Hugging Face library for the BLIP model)
    *   **`torch`** (PyTorch, the backend for the `transformers` model)


## Running Locally

1.  **Start Backend:**
    *   In the backend directory with venv activated: `python app.py`
    *   Wait for Flask to start and the BLIP model to load (check console logs).
2.  **Access Frontend:** Open browser to `http://127.0.0.1:5000` (or the port Flask is running on).

## Deployment
## Deployment

This application uses a split deployment strategy: the frontend is hosted on Netlify and the backend API on Render.

1.  **Frontend (Netlify):**
    *   **Platform:** Netlify
    *   **Live URL:** [https://multimodaal.netlify.app/](https://multimodaal.netlify.app/)
    *   **Setup:** Connected to the Git repository (`cloud-app` directory).
    *   **Build:** Configured with build command `npm run build` and publish directory `cloud-app/build`.
    *   **Configuration:** Uses a `REACT_APP_API_URL` environment variable (set in Netlify UI) pointing to the live Render backend URL.

2.  **Backend (Render):**
    *   **Platform:** Render
    *   **Live URL:** [Your Render Backend Service URL - e.g., `https://your-app-name.onrender.com`]
    *   **Setup:** Deployed as a "Web Service" connected to the Git repository's root backend directory.
    *   **Build & Runtime:** Installs Python dependencies via `requirements.txt`. Uses `gunicorn` as the WSGI server for running the Flask app (specified in the Start Command).
    *   **`ffmpeg` Dependency:** **Requires `ffmpeg` system package.** This must be installed in the Render environment (e.g., via Dockerfile or specific buildpack configurations) for audio processing to work.
    *   **Google Credentials:** Service account `.json` key file is **not** committed to Git. It's securely managed using Render's "Secret Files", and the `GOOGLE_APPLICATION_CREDENTIALS` environment variable is set in Render to point to its path.
    *   **Resources:** Requires a Render instance with sufficient RAM (minimum ~2GB recommended due to the BLIP model).


## Presentation Slides

A presentation detailing the project's architecture, challenges, and results can be found here:

*   **[Link to your Google Slides / PowerPoint Online / PDF presentation]**

---

*(Optional: Add License section if applicable)*
