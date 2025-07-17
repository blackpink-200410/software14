document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const englishInput = document.getElementById('english-input');
    const japaneseInput = document.getElementById('japanese-input');
    const addButton = document.getElementById('add-button');
    const wordList = document.getElementById('word-list');
    const filterSelect = document.getElementById('filter-select');
    const shuffleButton = document.getElementById('shuffle-button');
    const startQuizButton = document.getElementById('start-quiz-button');
    const quizModal = document.getElementById('quiz-modal');
    const quizText = document.getElementById('quiz-text');
    const closeQuiz = document.getElementById('close-quiz');
    const quizActions = document.getElementById('quiz-actions');
    const quizStatusCheckbox = document.getElementById('quiz-status-checkbox');

    // --- アプリケーションの状態管理 ---
    let words = JSON.parse(localStorage.getItem('words')) || [];
    let quizWords = [];
    let currentQuizIndex = 0;
    let isShowingAnswer = false;

    // --- 関数定義 ---

    // 単語リストを画面に描画する関数
    const renderWords = () => {
        wordList.innerHTML = '';
        const filter = filterSelect.value;
        const filteredWords = words.filter(word => {
            if (filter === 'all') return true;
            return word.status === filter;
        });

        filteredWords.forEach(word => {
            const li = document.createElement('li');
            if (word.status === 'remembered') {
                li.classList.add('remembered');
            }
            li.dataset.id = word.id;

            const wordText = document.createElement('span');
            wordText.className = 'word-text';
            wordText.textContent = `${word.english} : ${word.japanese}`;
            li.appendChild(wordText);

            const actions = document.createElement('div');
            actions.className = 'word-actions';

            const statusCheckbox = document.createElement('input');
            statusCheckbox.type = 'checkbox';
            statusCheckbox.title = '覚えたらチェック';
            statusCheckbox.checked = word.status === 'remembered';
            statusCheckbox.addEventListener('change', () => toggleStatus(word.id));
            actions.appendChild(statusCheckbox);
            
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-button';
            deleteButton.textContent = '削除';
            deleteButton.addEventListener('click', () => deleteWord(word.id));
            actions.appendChild(deleteButton);
            
            li.appendChild(actions);
            wordList.appendChild(li);
        });
    };

    // データをローカルストレージに保存する関数
    const saveWords = () => {
        localStorage.setItem('words', JSON.stringify(words));
    };

    // 単語を追加する関数
    const addWord = () => {
        const english = englishInput.value.trim();
        const japanese = japaneseInput.value.trim();
        if (english && japanese) {
            const newWord = {
                id: Date.now(),
                english: english,
                japanese: japanese,
                status: 'unremembered'
            };
            words.push(newWord);
            saveWords();
            renderWords();
            englishInput.value = '';
            japaneseInput.value = '';
        } else {
            alert('英単語と日本語訳の両方を入力してください。');
        }
    };
    
    // 単語を削除する関数
    const deleteWord = (id) => {
        words = words.filter(word => word.id !== id);
        saveWords();
        renderWords();
    };

    // 単語の状態を切り替える関数
    const toggleStatus = (id) => {
        const word = words.find(word => word.id === id);
        if (word) {
            word.status = word.status === 'remembered' ? 'unremembered' : 'remembered';
            saveWords();
            renderWords();
        }
    };

    // 単語リストをシャッフルする関数
    const shuffleWords = () => {
        for (let i = words.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [words[i], words[j]] = [words[j], words[i]];
        }
        saveWords();
        renderWords();
    };

    // クイズを開始する関数
    const startQuiz = () => {
        const filter = filterSelect.value;
        let filteredWords = words.filter(word => {
            if (filter === 'all') return true;
            return word.status === filter;
        });

        if (filteredWords.length === 0) {
            alert('クイズ対象の単語がありません。');
            return;
        }
        
        quizWords = [...filteredWords].sort(() => Math.random() - 0.5);
        currentQuizIndex = 0;
        isShowingAnswer = false;

        quizText.textContent = quizWords[currentQuizIndex].english;
        quizActions.classList.add('hidden');
        quizModal.classList.remove('hidden');
    };

    // クイズを終了する関数
    const endQuiz = () => {
        quizModal.classList.add('hidden');
        renderWords();
    };

    // クイズ画面をクリックしたときの処理
    const handleQuizClick = (e) => {
        if (e.target.closest('#quiz-actions')) {
            return;
        }

        if (quizWords.length === 0) return;

        const isLeftClick = e.clientX < window.innerWidth / 2;

        if (isLeftClick) {
            if (isShowingAnswer) {
                quizText.textContent = quizWords[currentQuizIndex].english;
                quizActions.classList.add('hidden');
                isShowingAnswer = false;
            } else {
                if (currentQuizIndex > 0) {
                    currentQuizIndex--;
                    quizText.textContent = quizWords[currentQuizIndex].english;
                    quizActions.classList.add('hidden');
                    isShowingAnswer = false;
                }
            }
        } else {
            if (!isShowingAnswer) {
                const currentWord = quizWords[currentQuizIndex];
                quizText.textContent = currentWord.japanese;
                quizStatusCheckbox.checked = currentWord.status === 'remembered';
                quizActions.classList.remove('hidden');
                isShowingAnswer = true;
            } else {
                currentQuizIndex++;
                if (currentQuizIndex >= quizWords.length) {
                    alert('学習が完了しました！');
                    endQuiz();
                } else {
                    quizText.textContent = quizWords[currentQuizIndex].english;
                    quizActions.classList.add('hidden');
                    isShowingAnswer = false;
                }
            }
        }
    };

    // --- イベントリスナーの設定 ---
    addButton.addEventListener('click', addWord);
    filterSelect.addEventListener('change', renderWords);
    shuffleButton.addEventListener('click', shuffleWords);
    startQuizButton.addEventListener('click', startQuiz);
    
    closeQuiz.addEventListener('click', (e) => {
        e.stopPropagation();
        endQuiz();
    });

    quizModal.addEventListener('click', handleQuizClick);

    quizStatusCheckbox.addEventListener('change', () => {
        const currentWordId = quizWords[currentQuizIndex].id;
        const wordInMainList = words.find(w => w.id === currentWordId);
        if (wordInMainList) {
            wordInMainList.status = quizStatusCheckbox.checked ? 'remembered' : 'unremembered';
            saveWords();
        }
    });

    // 初期描画
    renderWords();
});