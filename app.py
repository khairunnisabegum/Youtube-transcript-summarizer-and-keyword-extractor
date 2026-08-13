import os
import time
import re
from collections import Counter
from urllib.parse import urlparse, parse_qs

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from dotenv import load_dotenv
from youtube_transcript_api import YouTubeTranscriptApi
from google import genai
import yt_dlp

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# ---------------- HELPERS ----------------
def extract_video_id(url):
    try:
        parsed = urlparse(url)
        if parsed.hostname == "youtu.be":
            return parsed.path[1:]
        if "youtube" in parsed.hostname:
            if parsed.path == "/watch":
                return parse_qs(parsed.query).get("v", [None])[0]
    except:
        pass
    return None

def download_audio(url):
    filename = f"audio_{int(time.time())}.%(ext)s"
    ydl_opts = {
        'format': 'm4a/bestaudio/best',
        'outtmpl': filename,
        'quiet': True,
        'noplaylist': True,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'm4a',
            'preferredquality': '192',
        }],
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            result = ydl.extract_info(url, download=True)
            downloaded_file = ydl.prepare_filename(result)
            base, _ = os.path.splitext(downloaded_file)
            final_file = base + ".m4a"
        return final_file if os.path.exists(final_file) else None
    except Exception as e:
        print("Audio download error:", e)
        return None

def make_clickable_timestamps(text, video_id):
    def convert(match):
        timestamp = match.group(0)
        parts = list(map(int, timestamp.split(":")))
        if len(parts) == 2:
            seconds = parts[0] * 60 + parts[1]
        else:
            seconds = parts[0] * 3600 + parts[1] * 60 + parts[2]
        return f"[{timestamp}](https://youtu.be/{video_id}?t={seconds})"
    return re.sub(r"\b(?:\d{1,2}:)?\d{1,2}:\d{2}\b", convert, text)

def extract_keywords(text, n=10):
    words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
    common = Counter(words).most_common(n)
    return [w[0] for w in common]

def sentiment_score(text):
    positive = ["good", "great", "excellent", "positive", "success", "happy"]
    negative = ["bad", "poor", "negative", "fail", "sad", "problem"]
    score = 0
    for word in text.lower().split():
        if word in positive:
            score += 1
        if word in negative:
            score -= 1
    return score

def estimate_reading_time(text):
    return round(len(text.split()) / 200, 2)

def process_with_gemini(content, input_type, prompt):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("API Key not found")
        
    client = genai.Client(api_key=api_key)
    models = ["gemini-2.5-flash", "gemini-2.5-pro"]

    strict_instruction = """You are a strict, literal, and highly precise video analysis AI. 
    Your ONLY job is to summarize the EXACT events, dialogue, and facts present in the provided content.
    DO NOT invent storylines, events, or outcomes that are not explicitly stated."""

    last_error = None

    for model_name in models:
        try:
            if input_type == "text":
                full_prompt = f"{strict_instruction}\n\nTask: {prompt}\n\nContent to Analyze:\n{content}"
                response = client.models.generate_content(
                    model=model_name,
                    contents=full_prompt,
                    config={"temperature": 0.0}
                )
            else:
                uploaded_file = client.files.upload(file=content)
                full_prompt = f"{strict_instruction}\n\nTask: {prompt}"
                response = client.models.generate_content(
                    model=model_name,
                    contents=[full_prompt, uploaded_file],
                    config={"temperature": 0.0}
                )
            return response.text, None
        except Exception as e:
            print(f"Gemini error with {model_name}:", e)
            last_error = str(e)
            continue
            
    # If all models fail, return the last error encountered to inform the user
    return None, last_error

# ---------------- ROUTES ----------------
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/analyze', methods=['POST'])
def analyze():
    data = request.get_json(silent=True) or {}
    video_url = data.get('url')
    language = data.get('language', 'English')
    mode = data.get('mode', 'General Summary')
    quiz_count = data.get('quiz_count', 5)

    if not video_url:
        return jsonify({"error": "No URL provided"}), 400

    video_id = extract_video_id(video_url)
    if not video_id:
        return jsonify({"error": "Invalid YouTube URL"}), 400

    content_type = "text"
    try:
        # Reverted to your original, correct syntax for the new API version
        api = YouTubeTranscriptApi()
        transcript_obj = api.fetch(
            video_id, 
            languages=['en', 'en-US', 'en-GB', 'en-CA', 'en-IN', 'hi', 'te']
        )
        content = " ".join([snippet.text for snippet in transcript_obj])
    except Exception as e:
        print(f"Transcript failed, falling back to audio: {e}")
        content = download_audio(video_url)
        if not content:
            return jsonify({"error": "Failed to fetch transcript or audio."}), 500
        content_type = "audio"

    prompts = {
        "General Summary": "Provide a highly detailed and comprehensive summary of the content. Break the summary into logical paragraphs. Include the main theme, all major topics discussed, key arguments, important examples, and the overall conclusion. Do not leave out crucial information.",
        "Bullet Summary": "Convert the following text into short, clear bullet points suitable for a presentation. Keep each point concise and easy to understand.",
        "Timestamp Summary": "Create a detailed timeline summary with timestamps for all major shifts in topic.",
        "Key Insights": "Provide the top 5 to 10 most valuable key insights, explaining each one thoroughly.",
        "Study Mode": f"""Create a study guide for this video. You MUST use exactly these three tags to separate the sections: [NOTES], [FLASHCARDS], and [QUIZ]. 

[NOTES]
Write a detailed outline of the core concepts, theories, and definitions in Markdown format.

[FLASHCARDS]
Generate 5 to 10 flashcards. You MUST format each flashcard exactly like this on a single line:
Q: [Insert Question] | A: [Insert Answer]
Do not use any other formatting or bullet points for the flashcards.

[QUIZ]
Generate exactly {quiz_count} multiple-choice questions. You MUST return ONLY a raw JSON array for this section. Do not use markdown blocks for the JSON. Do not write anything after the JSON.
Format the JSON exactly like this:
[
  {{"question": "What is the main concept?", "options": ["A", "B", "C", "D"], "answer": "B"}},
  {{"question": "How does it work?", "options": ["X", "Y", "Z", "W"], "answer": "X"}}
]""",
        "Fact Check": """You are an expert, unbiased fact-checker. Analyze the transcript and extract the top 5 to 10 objective, verifiable claims made by the speaker.
Ignore subjective opinions. For each claim, evaluate its accuracy based on established facts.
You MUST return ONLY a raw JSON array. Do not use markdown blocks for the JSON. Do not write anything after the JSON.
Format the JSON exactly like this:
[
  {"claim": "The speaker claimed that human DNA is 50% similar to bananas.", "verdict": "Misleading", "explanation": "While humans and bananas share about 50% of their genes, this refers to the protein-coding genes, which make up only a small fraction of the total genome."},
  {"claim": "Water boils at 100 degrees Celsius.", "verdict": "True", "explanation": "This is a scientifically established fact at standard sea-level atmospheric pressure."}
]
Verdicts must be exactly one of these three words: "True", "False", or "Misleading"."""
    }
    
    prompt = f"{prompts.get(mode, prompts['General Summary'])} Respond strictly in {language}."
    
    try:
        result, ai_error = process_with_gemini(content, content_type, prompt)
        
        # Cleanup audio file immediately after processing to save disk space
        if content_type == "audio" and os.path.exists(content):
            os.remove(content)

        # Handle API rate limit gracefully
        if not result:
            if "429" in str(ai_error) or "RESOURCE_EXHAUSTED" in str(ai_error):
                return jsonify({"error": "Google API Free Tier quota exceeded. Please wait a minute and try again."}), 429
            return jsonify({"error": f"Failed to generate AI response: {ai_error}"}), 500
            
        formatted_result = make_clickable_timestamps(result, video_id)
        
        response_data = {
            "summary": formatted_result,
            "video_id": video_id,
            "thumbnail": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
        }

        if content_type == "text":
            response_data.update({
                "stats": True,
                "reading_time": estimate_reading_time(content),
                "sentiment": sentiment_score(content),
                "keywords": extract_keywords(content)
            })

        return jsonify(response_data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)