// --- THEME TOGGLE LOGIC ---
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeText = document.getElementById('theme-text');
const body = document.body;

if (localStorage.getItem('theme') === 'dark') {
    enableDarkMode();
}

themeToggleBtn.addEventListener('click', () => {
    if (body.classList.contains('dark-mode')) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
});

function enableDarkMode() {
    body.classList.add('dark-mode');
    themeIcon.innerText = '☀️';
    themeText.innerText = 'Light Mode';
    localStorage.setItem('theme', 'dark');
}

function disableDarkMode() {
    body.classList.remove('dark-mode');
    themeIcon.innerText = '🌙';
    themeText.innerText = 'Dark Mode';
    localStorage.setItem('theme', 'light');
}

// --- TAB NAVIGATION LOGIC ---
const tabBtns = document.querySelectorAll('.study-tab-btn');
const tabContents = document.querySelectorAll('.study-tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => {
            b.classList.remove('text-blue-600', 'border-blue-600', 'bg-blue-50', 'text-yellow-600', 'border-yellow-500', 'bg-yellow-50', 'text-green-600', 'border-green-500', 'bg-green-50');
            b.classList.add('text-gray-500', 'border-transparent', 'bg-white');
            if (document.body.classList.contains('dark-mode')) {
                b.classList.remove('bg-white');
                b.classList.add('dark:bg-gray-800');
            }
        });

        tabContents.forEach(c => c.classList.add('hidden'));

        btn.classList.remove('text-gray-500', 'border-transparent', 'bg-white', 'dark:bg-gray-800');
        
        const tabId = btn.id.replace('tab-btn-', '');
        document.getElementById(`tab-content-${tabId}`).classList.remove('hidden');

        if (tabId === 'notes') btn.classList.add('text-blue-600', 'border-blue-600', 'bg-blue-50', 'dark:bg-gray-700');
        if (tabId === 'cards') btn.classList.add('text-yellow-600', 'border-yellow-500', 'bg-yellow-50', 'dark:bg-gray-700');
        if (tabId === 'quiz') btn.classList.add('text-green-600', 'border-green-500', 'bg-green-50', 'dark:bg-gray-700');
    });
});

// --- SHOW/HIDE QUIZ COUNT INPUT ---
const modeSelect = document.getElementById('mode');
const quizOptionsContainer = document.getElementById('quiz-options-container');

modeSelect.addEventListener('change', () => {
    if (modeSelect.value === 'Study Mode') {
        quizOptionsContainer.classList.remove('hidden');
    } else {
        quizOptionsContainer.classList.add('hidden');
    }
});

// --- GLOBAL QUIZ VARIABLES ---
let currentQuizData = [];

// --- MAIN ANALYZE LOGIC ---
document.getElementById('analyze-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('submit-btn');
    const loadingDiv = document.getElementById('loading');
    const resultsContainer = document.getElementById('results-container');
    const analyticsSection = document.getElementById('analytics-section');
    
    const url = document.getElementById('video-url').value;
    const language = document.getElementById('language').value;
    const mode = document.getElementById('mode').value;
    const quizCount = document.getElementById('quiz-count').value;

    resultsContainer.classList.add('hidden');
    analyticsSection.classList.add('hidden');
    loadingDiv.classList.remove('hidden');
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-50');

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, language, mode, quiz_count: quizCount })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Something went wrong');
        }

        document.getElementById('video-thumbnail').src = data.thumbnail;
        
        const standardSummaryDiv = document.getElementById('standard-summary');
        const studySummaryDiv = document.getElementById('study-summary');
        const factCheckDiv = document.getElementById('fact-check-summary');

        if (mode === "Study Mode") {
            standardSummaryDiv.classList.add('hidden');
            factCheckDiv.classList.add('hidden');
            studySummaryDiv.classList.remove('hidden');
            document.getElementById('tab-btn-notes').click(); 

            const text = data.summary;
            const notesMatch = text.match(/\[NOTES\]([\s\S]*?)\[FLASHCARDS\]/i);
            const cardsMatch = text.match(/\[FLASHCARDS\]([\s\S]*?)\[QUIZ\]/i);
            const quizMatch = text.match(/\[QUIZ\]([\s\S]*)/i);

            if (notesMatch) document.getElementById('study-notes-content').innerHTML = marked.parse(notesMatch[1].trim());

            const cardContainer = document.getElementById('study-flashcards-content');
            cardContainer.innerHTML = ''; 
            
            if (cardsMatch) {
                const lines = cardsMatch[1].trim().split('\n');
                lines.forEach(line => {
                    const parts = line.split('|');
                    if (parts.length >= 2 && parts[0].includes('Q:')) {
                        const q = parts[0].replace('Q:', '').replace('**Q:**', '').trim();
                        const a = parts.slice(1).join('|').replace('A:', '').replace('**A:**', '').trim();
                        
                        const cardHTML = `
                            <div class="flashcard perspective-1000 w-full h-48 cursor-pointer">
                                <div class="flashcard-inner relative w-full h-full text-center transform-style-3d">
                                    <div class="flashcard-front absolute w-full h-full bg-yellow-50 dark:bg-gray-700 border-2 border-yellow-200 dark:border-gray-600 rounded-xl p-4 flex flex-col items-center justify-center backface-hidden shadow-sm overflow-y-auto">
                                        <p class="font-bold text-lg text-gray-800 dark:text-gray-100">${q}</p>
                                        <span class="mt-4 text-xs font-semibold text-yellow-600 dark:text-yellow-400">Hover to flip ⤵</span>
                                    </div>
                                    <div class="flashcard-back absolute w-full h-full bg-yellow-100 dark:bg-gray-600 border-2 border-yellow-300 dark:border-gray-500 rounded-xl p-4 flex items-center justify-center backface-hidden rotate-y-180 shadow-md overflow-y-auto">
                                        <p class="text-gray-800 dark:text-gray-100">${a}</p>
                                    </div>
                                </div>
                            </div>
                        `;
                        cardContainer.innerHTML += cardHTML;
                    }
                });
            }

            const quizContainer = document.getElementById('quiz-questions-container');
            const quizActions = document.getElementById('quiz-actions');
            const scoreDisplay = document.getElementById('quiz-score-display');
            
            quizContainer.innerHTML = '';
            quizActions.classList.add('hidden');
            scoreDisplay.classList.add('hidden');
            document.getElementById('show-answers-btn').classList.add('hidden');
            document.getElementById('try-again-btn').classList.add('hidden');
            document.getElementById('submit-quiz-btn').classList.remove('hidden');

            if (quizMatch) {
                try {
                    let jsonStr = quizMatch[1].replace(/```json/gi, '').replace(/```/g, '').trim();
                    currentQuizData = JSON.parse(jsonStr);

                    currentQuizData.forEach((q, index) => {
                        let optionsHTML = '';
                        q.options.forEach((opt, i) => {
                            optionsHTML += `
                                <label class="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors option-label-${index}">
                                    <input type="radio" name="question-${index}" value="${opt}" class="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500">
                                    <span class="ml-3 text-gray-700 dark:text-gray-200">${opt}</span>
                                </label>
                            `;
                        });

                        const questionBlock = `
                            <div class="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 question-block" id="q-block-${index}">
                                <h4 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">${index + 1}. ${q.question}</h4>
                                <div class="space-y-2">
                                    ${optionsHTML}
                                </div>
                                <div class="hidden mt-4 text-sm font-semibold answer-feedback" id="feedback-${index}"></div>
                            </div>
                        `;
                        quizContainer.innerHTML += questionBlock;
                    });
                    quizActions.classList.remove('hidden');
                } catch (err) {
                    console.error("Quiz Parse Error:", err);
                    quizContainer.innerHTML = `<p class="text-red-500">Failed to generate interactive quiz. The AI format was invalid.</p>`;
                }
            }

        } else if (mode === "Fact Check") {
            standardSummaryDiv.classList.add('hidden');
            studySummaryDiv.classList.add('hidden');
            factCheckDiv.classList.remove('hidden');
            
            const container = document.getElementById('fact-check-container');
            container.innerHTML = ''; 

            try {
                let jsonStr = data.summary.replace(/```json/gi, '').replace(/```/g, '').trim();
                const factData = JSON.parse(jsonStr);

                factData.forEach(item => {
                    let badgeColor = "bg-gray-100 text-gray-800 border-gray-200";
                    let icon = "❓";
                    
                    if (item.verdict.toLowerCase() === "true") {
                        badgeColor = "bg-green-100 text-green-800 border-green-200";
                        icon = "✅";
                    } else if (item.verdict.toLowerCase() === "false") {
                        badgeColor = "bg-red-100 text-red-800 border-red-200";
                        icon = "❌";
                    } else if (item.verdict.toLowerCase() === "misleading") {
                        badgeColor = "bg-orange-100 text-orange-800 border-orange-200";
                        icon = "⚠️";
                    }

                    const cardHTML = `
                        <div class="bg-gray-50 dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                            <div class="flex items-start justify-between gap-4 mb-3">
                                <h4 class="font-bold text-gray-900 dark:text-gray-100 text-lg flex-1">"${item.claim}"</h4>
                                <span class="px-3 py-1 text-sm font-bold rounded-full border flex items-center gap-1 whitespace-nowrap ${badgeColor}">
                                    ${icon} ${item.verdict.toUpperCase()}
                                </span>
                            </div>
                            <p class="text-gray-600 dark:text-gray-300 text-sm bg-white dark:bg-gray-700 p-4 rounded border border-gray-100 dark:border-gray-600 leading-relaxed">
                                <span class="font-bold text-gray-800 dark:text-gray-200 text-xs uppercase tracking-wider block mb-1">AI Explanation:</span>
                                ${item.explanation}
                            </p>
                        </div>
                    `;
                    container.innerHTML += cardHTML;
                });

            } catch (err) {
                console.error("Fact Check Parse Error:", err);
                container.innerHTML = `<p class="text-red-500 font-bold p-4 bg-red-50 rounded">Failed to generate Fact Check. The AI format was invalid.</p>`;
            }

        } else {
            studySummaryDiv.classList.add('hidden');
            factCheckDiv.classList.add('hidden');
            standardSummaryDiv.classList.remove('hidden');
            document.getElementById('summary-content').innerHTML = marked.parse(data.summary);
        }

        const summaryLinks = document.querySelectorAll('.prose a');
        summaryLinks.forEach(link => {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        });

        if (data.stats) {
            analyticsSection.classList.remove('hidden');
            document.getElementById('read-time').innerText = data.reading_time;
            document.getElementById('sentiment-val').innerText = data.sentiment;
            
            const kwContainer = document.getElementById('keywords-container');
            kwContainer.innerHTML = '';
            data.keywords.forEach(kw => {
                const span = document.createElement('span');
                span.className = 'bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full border border-gray-200';
                if(body.classList.contains('dark-mode')){
                    span.className = 'bg-gray-700 text-gray-200 text-xs px-2 py-1 rounded-full border border-gray-600';
                }
                span.innerText = kw;
                kwContainer.appendChild(span);
            });
        }

        resultsContainer.classList.remove('hidden');

    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        loadingDiv.classList.add('hidden');
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-50');
    }
});

// --- QUIZ ACTION LISTENERS ---
document.getElementById('submit-quiz-btn').addEventListener('click', () => {
    let score = 0;
    
    currentQuizData.forEach((q, index) => {
        const selectedOption = document.querySelector(`input[name="question-${index}"]:checked`);
        const block = document.getElementById(`q-block-${index}`);
        
        if (selectedOption) {
            if (selectedOption.value === q.answer) {
                score++;
                block.classList.add('border-green-500');
            } else {
                block.classList.add('border-red-500');
            }
        } else {
            block.classList.add('border-yellow-500'); 
        }

        const inputs = document.querySelectorAll(`input[name="question-${index}"]`);
        inputs.forEach(input => input.disabled = true);
    });

    document.getElementById('quiz-score-text').innerText = `${score} / ${currentQuizData.length}`;
    document.getElementById('quiz-score-display').classList.remove('hidden');
    
    document.getElementById('submit-quiz-btn').classList.add('hidden');
    document.getElementById('show-answers-btn').classList.remove('hidden');
    document.getElementById('try-again-btn').classList.remove('hidden');
});

document.getElementById('show-answers-btn').addEventListener('click', () => {
    currentQuizData.forEach((q, index) => {
        const feedback = document.getElementById(`feedback-${index}`);
        feedback.innerHTML = `Correct Answer: <span class="text-green-600 dark:text-green-400">${q.answer}</span>`;
        feedback.classList.remove('hidden');
    });
    document.getElementById('show-answers-btn').disabled = true;
    document.getElementById('show-answers-btn').classList.add('opacity-50');
});

document.getElementById('try-again-btn').addEventListener('click', () => {
    document.getElementById('analyze-form').dispatchEvent(new Event('submit'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
});