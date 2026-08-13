# Youtube-transcript-summarizer-and-keyword-extractor
Supervisor: Ms. Appam Ashwini

Email: ashwini_vce1650@vardhaman.org 

Contact: 9505037805

Project Type: Mini Project / EPBL Internship 

Domain: Artificial Intelligence, Generative AI & Web Development




#  YouTube Transcript Summarizer and Keyword Extractor

##  Project Overview

YouTube contains a huge amount of educational, technical, informational, and tutorial-based content. However, watching lengthy videos completely to identify important information can be time-consuming.

The **YouTube Transcript Summarizer and Keyword Extractor** is an AI-powered web application that analyzes YouTube videos and generates useful information from their available transcripts.

The system uses Google's **Gemini Generative AI models** to understand video transcripts and generate summaries, key insights, study materials, quizzes, and fact-checking results.

The application provides multiple analysis modes so that users can choose the type of information they need from a YouTube video.

---

## Objectives

The main objectives of this project are:

- To retrieve transcripts from YouTube videos.
- To generate concise summaries of lengthy video content.
- To provide important keywords from video transcripts.
- To generate bullet-point summaries.
- To generate timestamp-based summaries.
- To identify important insights from videos.
- To provide study notes and flashcards.
- To generate multiple-choice practice quizzes.
- To provide AI-based fact-checking analysis.
- To support multiple output languages.
- To estimate reading time.
- To perform basic sentiment analysis.
- To provide an easy-to-use web interface for video analysis.

---

## Features

### 1. General Summary

Generates a detailed summary of the complete video content.

The generated summary focuses on:

- Main topics
- Important concepts
- Key arguments
- Examples
- Overall conclusion

---

### 2. Bullet Summary

Converts the video content into concise bullet points.

This mode is useful for:

- Quick revision
- Presentation preparation
- Notes
- Fast information retrieval

---

### 3. Timestamp Summary

Generates a summary containing timestamps related to important sections of the video.

The application converts timestamps into clickable YouTube links so users can navigate directly to the relevant portion of the video.

---

### 4. Key Insights

Extracts the most valuable ideas from the video.

The system generates approximately 5–10 important insights depending on the content.

---

### 5. Study Mode

Study Mode converts video content into learning material.

It provides:

- Detailed study notes
- Flashcards
- Multiple-choice questions
- Interactive quiz interface

Users can specify the number of quiz questions.

---

### 6. Fact Check

The Fact Check mode extracts objective claims from the video and evaluates them using AI.

Possible verdicts include:

- `True`
- `False`
- `Misleading`

The system also provides an explanation for each evaluated claim.

> Note: AI-based fact checking should be treated as an assistive feature and not as a replacement for authoritative verification.

---

### 7. Keyword Extraction

The application extracts frequently occurring meaningful words from the transcript.

Short words are filtered out and the most frequent words are returned as keywords.

---

### 8. Video Analytics

For videos where a transcript is successfully retrieved, the application provides:

- Estimated reading time
- Sentiment score
- Important keywords

---

### 9. Multilingual Output

The application supports generating results in multiple languages.

Currently available languages include:

- English
- Hindi
- Telugu
- Spanish
- French
- German

---

###  10. Dark Mode

The web application provides both:

- Light Mode
- Dark Mode

The selected theme is stored in browser local storage.

---

##  System Architecture

The project follows the following general workflow:

```text
                  ┌──────────────────────┐
                  │      User Input      │
                  │   YouTube Video URL  │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │  YouTube Video ID    │
                  │      Extraction      │
                  └──────────┬───────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │     Transcript Retrieval     │
              │  YouTube Transcript API      │
              └──────────────┬───────────────┘
                             │
                    Transcript Available?
                       ┌─────┴─────┐
                      YES          NO
                       │            │
                       │            ▼
                       │     ┌──────────────┐
                       │     │   yt-dlp     │
                       │     │ Audio Fetch  │
                       │     └──────┬───────┘
                       │            │
                       └──────┬─────┘
                              ▼
                    ┌─────────────────────┐
                    │   Content Analysis  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Google Gemini AI  │
                    │ Gemini 2.5 Flash /  │
                    │ Gemini 2.5 Pro      │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
       Summarization      Study Material    Fact Checking
             │                 │                 │
             ▼                 ▼                 ▼
       Keywords          Notes/Flashcards      Claims
       Sentiment              Quiz             Verdicts
       Reading Time
             │                 │                 │
             └─────────────────┼─────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │    Web Interface    │
                    │ Flask + HTML/CSS/JS │
                    └─────────────────────┘
