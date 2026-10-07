(function() {
    'use strict';

    // ==================== CHATBOT CONFIGURATION ====================
    const CHATBOT_CONFIG = {
        botName: 'NeIPS Assistant',
        defaultQuestions: [
            {
                text: 'What courses do you offer?',
                response: 'NeIPS offers a variety of courses including Fashion Designing,Commis chef,Mobile Repairing,food and Beverage and many more. Which specific course are you interested in?'
            },
            {
                text: 'What are the admission requirements?',
                response: 'Admission requirements vary by course. Generally, you need to be 8th grade passed and above. Some advanced courses may require specific prerequisites. Would you like details for a specific course?'
            },
            {
                text: 'Where is your campus located?',
                response: 'Our main campus is located at Nongstoin Town Upper-New Nongstoin, Shillong city, Meghalaya. We also have multiple learning centers across the state. Would you like specific directions?'
            },
            {
                text: 'What are the class timings?',
                response: 'We offer flexible batches: Morning (9 AM - 5 PM)?'
            },
            {
                text: 'Want to know more about NeIPS ?',
                response: 'you can visit the website and explore more about NeIPS?'
            }
        ],
        greetings: [
            'Hello! I\'m NeIPS Assistant. How can I help you today?',
            'Hi there! Welcome to NeIPS. What would you like to know?',
            'Greetings! I\'m here to help with your queries about NeIPS courses and admissions.'
        ],
        fallbackResponses: [
            'I understand you\'re asking about "$QUERY". Could you rephrase that?',
            'That\'s an interesting question. Let me connect you with a counselor who can help better.',
            'I\'m still learning! Please ask about courses, admissions, fees, timings, or campus location.',
            'For detailed information about "$QUERY", I recommend speaking with our counselor directly.'
        ]
    };

    // ==================== UTILITY FUNCTIONS ====================
    const Utils = {
        // Get random response from array
        getRandomResponse: function(responses) {
            return responses[Math.floor(Math.random() * responses.length)];
        },

        // Format current time
        getCurrentTime: function() {
            const now = new Date();
            return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        },

        // Sanitize user input
        sanitizeInput: function(input) {
            return input.replace(/[<>]/g, '').trim();
        },

        // Find best matching question
        findBestMatch: function(userInput) {
            userInput = userInput.toLowerCase();
            let bestMatch = null;
            let highestScore = 0;

            CHATBOT_CONFIG.defaultQuestions.forEach((question, index) => {
                const questionWords = question.text.toLowerCase().split(' ');
                let score = 0;
                
                questionWords.forEach(word => {
                    if (userInput.includes(word)) {
                        score++;
                    }
                });
                
                if (score > highestScore) {
                    highestScore = score;
                    bestMatch = question;
                }
            });

            return { match: bestMatch, score: highestScore };
        },

        // Generate response based on user input
        generateResponse: function(userInput) {
            const sanitizedInput = this.sanitizeInput(userInput);
            
            // Check if input is empty
            if (!sanitizedInput) {
                return "Please type your question.";
            }

            // Check for greetings
            const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon'];
            if (greetings.some(greet => sanitizedInput.toLowerCase().includes(greet))) {
                return this.getRandomResponse(CHATBOT_CONFIG.greetings);
            }

            // Check for exact or partial matches
            const matchResult = this.findBestMatch(sanitizedInput);
            
            if (matchResult.match && matchResult.score >= 1) {
                return matchResult.match.response;
            }

            // Fallback response
            const fallback = this.getRandomResponse(CHATBOT_CONFIG.fallbackResponses);
            return fallback.replace('$QUERY', sanitizedInput.substring(0, 50));
        },

        // Track analytics
        trackEvent: function(category, action, label) {
            if (typeof gtag !== 'undefined') {
                gtag('event', action, {
                    'event_category': category,
                    'event_label': label
                });
            }
            console.log(`Chatbot Event: ${category} - ${action} - ${label}`);
        },

        // Storage utilities
        setStorage: function(key, value) {
            try {
                localStorage.setItem(`neips_chatbot_${key}`, value);
            } catch (e) {
                console.warn('LocalStorage not available');
            }
        },

        getStorage: function(key) {
            try {
                return localStorage.getItem(`neips_chatbot_${key}`);
            } catch (e) {
                return null;
            }
        }
    };

    // ==================== CHATBOT CLASS ====================
    class ChatBot {
        constructor() {
            this.initialized = false;
            this.isOpen = false;
            this.unreadMessages = 0;
            this.elements = {};
            this.messages = [];
            this.init();
        }

        init() {
            if (this.initialized) return;

            this.cacheElements();
            this.bindEvents();
            this.setupChatbot();
            this.loadMessages();
            this.initialized = true;
        }

        cacheElements() {
            this.elements = {
                bubble: document.getElementById('chatbotBubble'),
                container: document.getElementById('chatbotContainer'),
                header: document.getElementById('chatbotHeader'),
                closeBtn: document.getElementById('chatbotClose'),
                toggleBtn: document.getElementById('chatbotToggle'),
                messagesContainer: document.getElementById('chatbotMessages'),
                input: document.getElementById('chatbotInput'),
                sendBtn: document.getElementById('chatbotSend'),
                quickQuestions: document.getElementById('quickQuestions'),
                badge: document.querySelector('.chatbot-badge')
            };
        }

        bindEvents() {
            // Toggle chatbot
            if (this.elements.toggleBtn) {
                this.elements.toggleBtn.addEventListener('click', () => this.toggleChat());
            }

            // Close button
            if (this.elements.closeBtn) {
                this.elements.closeBtn.addEventListener('click', () => this.closeChat());
            }

            // Send message
            if (this.elements.sendBtn) {
                this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
            }

            // Enter key in input
            if (this.elements.input) {
                this.elements.input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.sendMessage();
                    }
                });
            }

            // Quick question buttons
            if (this.elements.quickQuestions) {
                this.elements.quickQuestions.addEventListener('click', (e) => {
                    if (e.target.classList.contains('quick-question')) {
                        const question = e.target.textContent;
                        this.addUserMessage(question);
                        setTimeout(() => this.addBotResponse(question), 500);
                    }
                });
            }

            // Auto-hide when clicking outside
            document.addEventListener('click', (e) => this.handleOutsideClick(e));
        }

        setupChatbot() {
            // Add welcome message if first time
            if (!Utils.getStorage('chatbot_opened')) {
                setTimeout(() => {
                    this.showWelcomeBubble();
                }, 3000);
            }

            // Initialize with greeting
            if (this.elements.messagesContainer && this.messages.length === 0) {
                this.addBotMessage(Utils.getRandomResponse(CHATBOT_CONFIG.greetings));
            }

            // Initialize quick questions
            this.setupQuickQuestions();
        }

        setupQuickQuestions() {
            if (!this.elements.quickQuestions) return;

            CHATBOT_CONFIG.defaultQuestions.forEach((question, index) => {
                if (index < 3) { // Show only first 3 as quick questions
                    const button = document.createElement('button');
                    button.className = 'quick-question';
                    button.textContent = question.text;
                    this.elements.quickQuestions.appendChild(button);
                }
            });
        }

        toggleChat() {
            if (this.isOpen) {
                this.closeChat();
            } else {
                this.openChat();
            }
        }

        openChat() {
            if (!this.isOpen) {
                this.isOpen = true;
                this.elements.container.classList.add('active');
                this.elements.bubble.classList.add('hidden');
                
                // Clear badge
                this.unreadMessages = 0;
                this.updateBadge();
                
                // Focus input
                setTimeout(() => {
                    if (this.elements.input) {
                        this.elements.input.focus();
                    }
                }, 300);
                
                Utils.trackEvent('chatbot', 'open', 'chatbot_widget');
            }
        }

        closeChat() {
            if (this.isOpen) {
                this.isOpen = false;
                this.elements.container.classList.remove('active');
                this.elements.bubble.classList.remove('hidden');
                Utils.trackEvent('chatbot', 'close', 'chatbot_widget');
            }
        }

        handleOutsideClick(event) {
            if (!this.isOpen || !this.elements.container) return;
            
            const isClickInside = this.elements.container.contains(event.target);
            const isToggleButton = this.elements.toggleBtn && this.elements.toggleBtn.contains(event.target);
            
            if (!isClickInside && !isToggleButton) {
                this.closeChat();
            }
        }

        sendMessage() {
            if (!this.elements.input) return;
            
            const userInput = this.elements.input.value.trim();
            if (!userInput) return;
            
            // Add user message
            this.addUserMessage(userInput);
            
            // Clear input
            this.elements.input.value = '';
            
            // Show typing indicator
            this.showTypingIndicator();
            
            // Generate and show bot response after delay
            setTimeout(() => {
                this.removeTypingIndicator();
                const response = Utils.generateResponse(userInput);
                this.addBotResponse(response);
                
                // Track question
                Utils.trackEvent('chatbot', 'question_asked', userInput.substring(0, 50));
            }, 1000 + Math.random() * 1000);
        }

        addUserMessage(text) {
            const message = {
                type: 'user',
                text: text,
                time: Utils.getCurrentTime()
            };
            this.messages.push(message);
            this.renderMessage(message);
            this.saveMessages();
        }

        addBotResponse(userQuestion) {
            const response = Utils.generateResponse(userQuestion);
            this.addBotMessage(response);
        }

        addBotMessage(text) {
            const message = {
                type: 'bot',
                text: text,
                time: Utils.getCurrentTime()
            };
            this.messages.push(message);
            this.renderMessage(message);
            this.saveMessages();
        }

        renderMessage(message) {
            if (!this.elements.messagesContainer) return;
            
            const messageElement = document.createElement('div');
            messageElement.className = `chat-message ${message.type}-message`;
            
            const timeSpan = message.time ? `<span class="message-time">${message.time}</span>` : '';
            
            messageElement.innerHTML = `
                <div class="message-content">
                    ${message.text}
                    ${timeSpan}
                </div>
            `;
            
            this.elements.messagesContainer.appendChild(messageElement);
            
            // Scroll to bottom
            setTimeout(() => {
                this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
            }, 100);
        }

        showTypingIndicator() {
            if (!this.elements.messagesContainer) return;
            
            const typingElement = document.createElement('div');
            typingElement.className = 'chat-message bot-message typing-indicator';
            typingElement.id = 'typingIndicator';
            typingElement.innerHTML = `
                <div class="message-content">
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            `;
            
            this.elements.messagesContainer.appendChild(typingElement);
            this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
        }

        removeTypingIndicator() {
            const typingIndicator = document.getElementById('typingIndicator');
            if (typingIndicator) {
                typingIndicator.remove();
            }
        }

        showWelcomeBubble() {
            if (this.elements.bubble) {
                this.elements.bubble.classList.remove('hidden');
                setTimeout(() => {
                    this.elements.bubble.classList.add('hidden');
                }, 8000);
            }
        }

        updateBadge() {
            if (!this.elements.badge) return;
            
            if (this.unreadMessages > 0) {
                this.elements.badge.textContent = this.unreadMessages;
                this.elements.badge.style.display = 'flex';
            } else {
                this.elements.badge.style.display = 'none';
            }
        }

        saveMessages() {
            Utils.setStorage('messages', JSON.stringify(this.messages.slice(-20))); // Save last 20 messages
        }

        loadMessages() {
            const saved = Utils.getStorage('messages');
            if (saved) {
                try {
                    this.messages = JSON.parse(saved);
                    
                    // Render saved messages
                    if (this.elements.messagesContainer) {
                        this.elements.messagesContainer.innerHTML = '';
                        this.messages.forEach(msg => this.renderMessage(msg));
                    }
                } catch (e) {
                    console.warn('Could not load saved messages');
                }
            }
        }

        // Public method to add custom quick actions
        addQuickAction(text, callback) {
            if (this.elements.quickQuestions) {
                const button = document.createElement('button');
                button.className = 'quick-question';
                button.textContent = text;
                button.addEventListener('click', callback);
                this.elements.quickQuestions.appendChild(button);
            }
        }
    }

    // ==================== GLOBAL FUNCTIONS ====================
    window.NEIPSChatBot = {
        // Open chatbot
        open: function() {
            const chatbot = window._chatbotInstance;
            if (chatbot) {
                chatbot.openChat();
                return true;
            }
            return false;
        },

        // Close chatbot
        close: function() {
            const chatbot = window._chatbotInstance;
            if (chatbot) {
                chatbot.closeChat();
                return true;
            }
            return false;
        },

        // Send a message programmatically
        sendMessage: function(message) {
            const chatbot = window._chatbotInstance;
            if (chatbot && message) {
                chatbot.addUserMessage(message);
                setTimeout(() => {
                    chatbot.addBotResponse(message);
                }, 1000);
                return true;
            }
            return false;
        },

        // Add custom quick question
        addQuickQuestion: function(text) {
            const chatbot = window._chatbotInstance;
            if (chatbot) {
                chatbot.addQuickAction(text, () => {
                    chatbot.addUserMessage(text);
                    setTimeout(() => chatbot.addBotResponse(text), 500);
                });
                return true;
            }
            return false;
        },

        // Get conversation history
        getHistory: function() {
            const chatbot = window._chatbotInstance;
            return chatbot ? chatbot.messages : [];
        },

        // Clear conversation
        clearHistory: function() {
            const chatbot = window._chatbotInstance;
            if (chatbot) {
                chatbot.messages = [];
                if (chatbot.elements.messagesContainer) {
                    chatbot.elements.messagesContainer.innerHTML = '';
                }
                chatbot.addBotMessage(Utils.getRandomResponse(CHATBOT_CONFIG.greetings));
                return true;
            }
            return false;
        }
    };

    // ==================== INITIALIZATION ====================
    function initializeChatbot() {
        if (document.getElementById('neips-chatbot')) {
            window._chatbotInstance = new ChatBot();
            Utils.trackEvent('chatbot', 'loaded', 'chatbot_widget');
            console.log('NeIPS ChatBot initialized successfully');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeChatbot);
    } else {
        initializeChatbot();
    }

})();