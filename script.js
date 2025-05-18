class MemoryGame {
    constructor() {
        this.cards = [];
        this.score = 0;
        this.level = 1;
        this.moves = 0;
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.isLocked = false;
        this.gameStarted = false;
        this.completedLevels = new Set();
        this.maxLevel = 1;
        this.isMuted = false;

        // DOM elements
        this.gameBoard = document.getElementById('gameBoard');
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.movesElement = document.getElementById('moves');
        this.startButton = document.getElementById('startGame');
        this.resetButton = document.getElementById('resetBtn');
        this.muteButton = document.getElementById('muteBtn');
        this.clickSound = document.getElementById('clickSound');
        this.levelUpSound = document.getElementById('levelUpSound');
        this.backgroundMusic = document.getElementById('backgroundMusic');

        // Load saved progress
        this.loadProgress();

        // Start button listener
        this.startButton.addEventListener('click', () => {
            this.startGame();
            this.startButton.style.display = 'none'; // Hide the button after game starts
        });

        // Reset button listener
        this.resetButton.addEventListener('click', () => {
            this.resetGame();
            // Animate the reset icon
            const resetIcon = this.resetButton.querySelector('i');
            resetIcon.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                resetIcon.style.transform = '';
            }, 300);
        });

        // Mute button listener
        this.muteButton.addEventListener('click', () => {
            this.toggleMute();
        });

        // Auto-save progress when window is closed
        window.addEventListener('beforeunload', () => {
            this.saveProgress();
        });

        // All available emojis by category
        this.emojiCategories = {
            games: ['🎮', '🎲', '🎯', '🎨', '🎭', '🎪', '🎟️', '🎸', '🎳', '🎯', '🎪', '🎨'],
            animals: ['🦁', '🐯', '🐘', '🦒', '🦊', '🐼', '🦄', '🦋', '🐬', '🦜', '🦩', '🦆'],
            food: ['🍕', '🍔', '🌮', '🍦', '🍩', '🍰', '🍎', '🍓', '🥑', '🌶️', '🥕', '🍉'],
            sports: ['⚽', '🏀', '🎾', '⚾', '🏈', '🏉', '🎱', '🏓', '🏸', '⛳', '🥊', '🏹'],
            travel: ['✈️', '🚗', '🚲', '⛵', '🚁', '🚂', '🚀', '🛸', '🎪', '⛺', '🗽', '🎡'],
            nature: ['🌸', '🌺', '🌻', '🌹', '🌴', '🌈', '⭐', '🌙', '🌞', '❄️', '🌊', '🔥']
        };
    }

    startGame() {
        this.gameStarted = true;
        // Start from level 1
        this.level = 1;
        this.createCards();
        this.saveProgress();
        // Start background music
        if (!this.isMuted) {
            this.backgroundMusic.play();
        }
    }

    fullReset() {
        this.gameStarted = true;
        this.score = 0;
        this.level = 1;
        this.moves = 0;
        this.matchedPairs = 0;
        this.flippedCards = [];
        this.isLocked = false;
        this.completedLevels = new Set();
        this.maxLevel = 1;
        
        this.gameBoard.innerHTML = '';
        this.updateStats();
        this.createCards();
        this.saveProgress();
    }

    resetGame() {
        this.score = 0;
        this.level = 1;
        this.moves = 0;
        this.matchedPairs = 0;
        this.flippedCards = [];
        this.isLocked = false;
        this.completedLevels = new Set();
        this.maxLevel = 1;
        
        this.gameBoard.innerHTML = '';
        this.updateStats();
        this.createCards();
        this.saveProgress();
    }

    createCards() {
        let selectedEmojis;
        if (this.level <= 2) {
            const categories = Object.keys(this.emojiCategories);
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];
            selectedEmojis = this.emojiCategories[randomCategory];
        } else {
            selectedEmojis = Object.values(this.emojiCategories)
                .flat()
                .sort(() => Math.random() - 0.5)
                .slice(0, 12);
        }

        const numPairs = Math.min(8 + Math.floor(this.level / 2), 12);
        const emojisForLevel = selectedEmojis.slice(0, numPairs);
        const pairs = [...emojisForLevel, ...emojisForLevel];
        this.cards = this.shuffleArray(pairs);
        
        const totalCards = this.cards.length;
        const columns = totalCards <= 16 ? 4 : 6;
        this.gameBoard.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
        
        this.cards.forEach((emoji, index) => {
            const card = this.createCardElement(emoji, index);
            this.gameBoard.appendChild(card);
        });
    }

    createCardElement(emoji, index) {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-front">${emoji}</div>
            <div class="card-back"></div>
        `;
        card.dataset.index = index;
        card.addEventListener('click', () => {
            if (!this.isLocked && !this.flippedCards.includes(card) && !card.classList.contains('matched')) {
                this.playClickSound();
                this.flipCard(card);
            }
        });
        return card;
    }

    flipCard(card) {
        if (
            this.isLocked || 
            this.flippedCards.length >= 2 || 
            this.flippedCards.includes(card) ||
            card.classList.contains('matched')
        ) {
            return;
        }

        card.classList.add('flip');
        this.flippedCards.push(card);

        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateStats();
            this.checkMatch();
        }
    }

    checkMatch() {
        this.isLocked = true;
        const [card1, card2] = this.flippedCards;
        const emoji1 = card1.querySelector('.card-front').textContent;
        const emoji2 = card2.querySelector('.card-front').textContent;

        if (emoji1 === emoji2) {
            this.handleMatch(card1, card2);
        } else {
            this.handleMismatch(card1, card2);
        }
    }

    handleMatch(card1, card2) {
        this.score += 10 * this.level;
        this.matchedPairs++;
        
        card1.classList.add('matched');
        card2.classList.add('matched');
        
        this.updateStats();
        this.flippedCards = [];
        this.isLocked = false;
        this.saveProgress();

        if (this.matchedPairs === this.cards.length / 2) {
            this.levelUp();
        }
    }

    handleMismatch(card1, card2) {
        setTimeout(() => {
            card1.classList.remove('flip');
            card2.classList.remove('flip');
            this.flippedCards = [];
            this.isLocked = false;
        }, 1000);
    }

    levelUp() {
        // Add current level to completed levels before incrementing
        this.completedLevels.add(this.level);
        this.level++;
        this.maxLevel = Math.max(this.maxLevel, this.level);
        this.levelElement.classList.add('level-up');
        this.playLevelUpSound();
        
        // Reset only the game board for the next level
        this.matchedPairs = 0;
        this.flippedCards = [];
        this.isLocked = false;
        this.gameBoard.innerHTML = '';
        
        // Create new cards for the next level
        this.createCards();
        this.updateStats();
        this.saveProgress();

        // Remove the level-up animation class after animation completes
        setTimeout(() => {
            this.levelElement.classList.remove('level-up');
        }, 1000);
    }

    updateStats() {
        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
        this.movesElement.textContent = this.moves;
        this.saveProgress();
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    playClickSound() {
        if (this.clickSound) {
            this.clickSound.currentTime = 0;
            this.clickSound.play().catch(error => {
                console.log("Error playing sound:", error);
            });
        }
    }

    playLevelUpSound() {
        if (this.levelUpSound) {
            this.levelUpSound.currentTime = 0;
            this.levelUpSound.play().catch(error => {
                console.log("Error playing level up sound:", error);
            });
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.muteButton.querySelector('i').className = this.isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
        
        if (this.isMuted) {
            this.backgroundMusic.pause();
        } else if (this.gameStarted) {
            this.backgroundMusic.play();
        }
        
        // Save mute preference
        localStorage.setItem('isMuted', this.isMuted);
    }

    saveProgress() {
        const progress = {
            score: this.score,
            level: this.level,
            moves: this.moves,
            completedLevels: Array.from(this.completedLevels),
            maxLevel: this.maxLevel
        };
        localStorage.setItem('gameProgress', JSON.stringify(progress));
    }

    loadProgress() {
        const savedProgress = localStorage.getItem('gameProgress');
        if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            this.score = progress.score || 0;
            this.level = progress.level || 1;
            this.moves = progress.moves || 0;
            this.completedLevels = new Set(progress.completedLevels || []);
            this.maxLevel = progress.maxLevel || 1;
        }
        
        // Load mute preference
        this.isMuted = localStorage.getItem('isMuted') === 'true';
        if (this.isMuted) {
            this.muteButton.querySelector('i').className = 'fas fa-volume-mute';
        }
    }
}

// Initialize the game
const game = new MemoryGame(); 