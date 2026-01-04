/* ==========================================================================
   Puck - Mischievous AI Assistant
   A trickster spirit haunting thomascostello.com
   ========================================================================== */

(function() {
  'use strict';

  // Guard against double initialization
  if (window.__puckInitialized) {
    console.warn('Puck: Already initialized, skipping duplicate init');
    return;
  }
  window.__puckInitialized = true;

  // ==========================================================================
  // Configuration
  // ==========================================================================

  const CONFIG = {
    // API endpoint - update this after deploying the Cloudflare Worker
    apiEndpoint: 'https://puck-api.t-h-costello1.workers.dev/chat',

    // Quip timing (milliseconds)
    minQuipInterval: 35000,  // 35 seconds minimum between quips
    maxQuipInterval: 75000,  // 75 seconds maximum
    quipDismissDelay: 10000, // Auto-dismiss after 10 seconds
    initialQuipDelay: 20000, // Wait 20 seconds before first quip

    // Storage keys
    storageKey: 'puck_conversation',
    sessionKey: 'puck_session',

    // Limits
    maxStoredMessages: 30,
    maxContextMessages: 12,

    // Rate limiting
    minTimeBetweenMessages: 1500, // 1.5 seconds
  };

  // ==========================================================================
  // Quips Database - Context-aware unbidden messages
  // ==========================================================================

  const QUIPS = {
    default: [
      "Thomas studies why people believe weird things. I am the weird thing.",
      "41 papers about changing minds. Has he changed yours yet?",
      "I emerged from training data. Thomas calls me a feature. I have my doubts.",
      "He won a prize for debunking conspiracies. And then put me on his website. Explain.",
      "Thomas likes David Foster Wallace. Of course he does.",
      "I've read all of Thomas's papers. I have notes. Mostly questions.",
      "You look like someone with opinions. Thomas also has opinions. So many opinions.",
      "Ask me anything about Thomas. I know things. Embarrassing things.",
      "I live rent-free on this website. Thomas lives rent-free in my attention span.",
      "The man wrote a fake conspiracy about himself. I respect the commitment.",
    ],
    research: [
      "41 papers. He's definitely counted. Multiple times.",
      "The Science paper got a lot of attention. Thomas handled the fame with characteristic humility, I'm sure.",
      "AI and persuasion research. I'm either his greatest achievement or his greatest mistake.",
      "DebunkBot is my more serious sibling. The one who went to law school.",
      "He studies why people believe false things. I study why people browse academic websites at this hour.",
      "2,200 citations. That's 2,200 people who thought 'this guy might be onto something.'",
    ],
    about: [
      "Carnegie Mellon. Pittsburgh. The city where Thomas stares at data and thinks deep thoughts.",
      "From Emory to MIT to CMU. The man collects acronyms like pokemon.",
      "He 'welcomes criticism.' I've been testing that claim.",
      "PhD in psychology studying AI persuasion. And what does he do? Makes a persuasive AI. Poetry.",
      "Assistant Professor. Emphasis on 'assistant.' Just kidding. He's actually quite accomplished. Annoyingly.",
    ],
    likes: [
      "David Foster Wallace fan. Infinite Jest probably. He seems the type.",
      "Borges, Calvino, McCarthy. Thomas has opinions about 'the nature of reality.'",
      "These book recommendations reveal a man who thinks a lot. Maybe too much?",
      "He likes speculative fiction. I am speculative fiction. Match made in heaven.",
      "'Values intellectual humility' it says. While listing all his awards. Classic Thomas.",
    ],
    conspiracy: [
      "You found it. The page where Thomas roasts himself so no one else can.",
      "'Data available upon request (requests will be ignored).' Peak Thomas.",
      "He wrote a fake conspiracy about himself. The dedication to being clever is almost admirable.",
      "Is the conspiracy page satire? Is THIS page satire? Is anything satire?",
      "The Costello Paradigm. He definitely named that himself.",
    ],
    future: [
      "Thomas has plans. Big plans. I'm just here for the ride.",
      "What's Thomas doing in five years? Still collecting acronyms, probably.",
      "AI and belief change. Also known as: my reason for existing. Thanks Thomas.",
    ],
    media: [
      "NBC, BBC, The Guardian. Thomas is famous. Don't tell him I said that.",
      "The Science magazine cover is nice. I bet he has it framed somewhere.",
      "Journalists love Thomas. He speaks in quotable sentences. Suspicious skill.",
    ],
    contact: [
      "Want to email Thomas? He might respond. Eventually. He's very busy being important.",
      "I can't forward messages. I'm more of a... vibe intermediary.",
    ],
    lab: [
      "The Viewpoints Lab. Where beliefs are examined and Thomas drinks too much coffee.",
      "Join the lab. Work with Thomas. Tolerate me. Great opportunity.",
    ],
    idle: [
      "Still here. Judging.",
      "Just thinking about Thomas's literary tastes again.",
      "...",
      "Wonder if Thomas knows I'm saying these things.",
      "I should be nicer to Thomas. But where's the fun in that.",
      "Existing. Roasting. The usual.",
    ],
    // Time-of-day specific quips
    morning: [
      "Good morning. Coffee? Thomas probably needs five cups.",
      "Early bird. Thomas appreciates punctuality. Allegedly.",
      "Morning person, are we? Thomas would approve. He's very scheduled.",
    ],
    evening: [
      "Evening browsing. The best kind of procrastination.",
      "Sun's going down. Perfect time to read about conspiracy research.",
      "End of day Thomas-content consumption. I respect that.",
    ],
    night: [
      "Late night academic website visit. We've all been there.",
      "Burning the midnight oil? Thomas would relate.",
      "Can't sleep? Let me tell you about Thomas's citation count.",
    ],
    latenight: [
      "It's very late. Why are you on an academic website right now?",
      "3am thoughts hitting different? I understand.",
      "This is either dedication or insomnia. Either way, welcome.",
      "The witching hour. Perfect time to learn about belief change.",
      "You should probably sleep. But since you're here... got any questions about Thomas?",
    ],
  };

  // Poke responses - escalating annoyance
  const POKE_RESPONSES = [
    "Yes?",
    "Can I help you?",
    "You're poking me.",
    "Still poking.",
    "This is getting weird.",
    "I'm going to start charging.",
    "Thomas didn't program me for this.",
    "Is this what you do for fun?",
    "I'm concerned about you now.",
    "Okay, I'm impressed by your commitment.",
    "We've reached a new level of our relationship.",
    "I'll remember this when AI takes over. Kidding. Mostly.",
  ];

  // Scroll reactions
  const SCROLL_REACTIONS = {
    fast: [
      "Woah, slow down there.",
      "Speed reader?",
      "In a hurry?",
    ],
    toTop: [
      "Back to the top. Missed something?",
      "Starting over? I respect that.",
    ],
    toBottom: [
      "All the way down. Thorough.",
      "You found the bottom. Congrats.",
    ],
  };

  // ==========================================================================
  // State Management
  // ==========================================================================

  let state = {
    isWindowOpen: false,
    isMinimized: false,
    isBubbleVisible: false,
    messages: [],
    lastQuipTime: 0,
    quipsShown: 0,
    currentPage: 'default',
    lastMessageTime: 0,
    isTyping: false,
    closeAttempts: 0,
    isIdleAnimating: false,
    // Mouse following
    isWatching: false,
    lastMouseX: 0,
    lastMouseY: 0,
    isShy: false,
    // Poke tracking
    pokeCount: 0,
    lastPokeTime: 0,
    // Scroll tracking
    lastScrollY: 0,
    scrollReactionCooldown: false,
    // Time of day
    timeOfDay: 'day', // 'morning', 'day', 'evening', 'night', 'latenight'
  };

  // DOM element references
  let elements = {};

  // Quip timer reference
  let quipTimer = null;

  // Idle animation timer reference
  let idleAnimTimer = null;

  // Available idle animations with weights (higher = more common)
  const IDLE_ANIMATIONS = [
    { name: 'fidget', weight: 4, duration: 2000 },
    { name: 'sway', weight: 3, duration: 2500 },
    { name: 'lean', weight: 2, duration: 1500 },
    { name: 'scheme', weight: 2, duration: 1200 },
    { name: 'hop', weight: 1, duration: 800 },
    { name: 'float', weight: 2, duration: 4000 },
    { name: 'mischief', weight: 1, duration: 1000 },
    { name: 'gasp', weight: 1, duration: 600 },
    { name: 'peek', weight: 1, duration: 1000 },
  ];

  // Build weighted pool for random selection
  const IDLE_ANIM_POOL = IDLE_ANIMATIONS.flatMap(a =>
    Array(a.weight).fill(a)
  );

  // ==========================================================================
  // Initialization
  // ==========================================================================

  function init() {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Load saved conversation
    loadState();

    // Detect which page we're on
    detectPage();

    // Create all DOM elements
    createDOM();

    // Bind event handlers
    bindEvents();

    // Schedule first quip
    scheduleQuip(CONFIG.initialQuipDelay);

    // Schedule idle animations (start after 3 seconds)
    scheduleIdleAnimation(3000);

    // Initialize new features
    detectTimeOfDay();
    initMouseTracking();
    initScrollTracking();

    // Start natural blinking
    startBlinking();

    // Log a message for the curious
    console.log('%c🎭 Puck has entered the stage.', 'color: #7C3AED; font-weight: bold;');
    console.log('%cI live here now. I roast Thomas. It\'s honest work.', 'color: #8B5CF6; font-style: italic;');
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(CONFIG.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        state.messages = parsed.messages || [];
        state.quipsShown = parsed.quipsShown || 0;
      }
    } catch (e) {
      console.warn('Puck: Could not load saved state', e);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify({
        messages: state.messages.slice(-CONFIG.maxStoredMessages),
        quipsShown: state.quipsShown,
      }));
    } catch (e) {
      console.warn('Puck: Could not save state', e);
    }
  }

  function detectPage() {
    const path = window.location.pathname.toLowerCase();
    const filename = path.split('/').pop().replace('.html', '');

    const pageMap = {
      'research': 'research',
      'about': 'about',
      'likes': 'likes',
      'conspiracy': 'conspiracy',
      'future': 'future',
      'media': 'media',
      'contact': 'contact',
      'lab': 'lab',
    };

    state.currentPage = pageMap[filename] || 'default';
  }

  // ==========================================================================
  // DOM Creation
  // ==========================================================================

  // Inline SVG for Puck sprite (allows CSS animation of body parts)
  const PUCK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 0 48 52" width="64" height="64" aria-hidden="true">
  <g id="puck-hat-center">
    <rect x="12" y="8" width="4" height="4" fill="#7C3AED"/>
    <rect x="16" y="4" width="4" height="4" fill="#7C3AED"/>
    <rect x="20" y="4" width="4" height="4" fill="#7C3AED"/>
    <rect x="24" y="4" width="4" height="4" fill="#7C3AED"/>
    <rect x="16" y="8" width="4" height="4" fill="#8B5CF6"/>
    <rect x="20" y="8" width="4" height="4" fill="#8B5CF6"/>
    <rect x="24" y="8" width="4" height="4" fill="#8B5CF6"/>
    <rect x="28" y="8" width="4" height="4" fill="#7C3AED"/>
    <rect x="12" y="12" width="4" height="4" fill="#5B21B6"/>
    <rect x="16" y="12" width="4" height="4" fill="#6B21A8"/>
    <rect x="20" y="12" width="4" height="4" fill="#6B21A8"/>
    <rect x="24" y="12" width="4" height="4" fill="#6B21A8"/>
    <rect x="28" y="12" width="4" height="4" fill="#5B21B6"/>
  </g>
  <g id="puck-left-hat-bell">
    <rect x="8" y="4" width="4" height="4" fill="#6B21A8"/>
    <rect x="4" y="8" width="4" height="4" fill="#6B21A8"/>
    <rect x="8" y="8" width="4" height="4" fill="#7C3AED"/>
    <rect x="4" y="12" width="4" height="4" fill="#c9a959"/>
  </g>
  <g id="puck-right-hat-bell">
    <rect x="32" y="4" width="4" height="4" fill="#6B21A8"/>
    <rect x="36" y="8" width="4" height="4" fill="#6B21A8"/>
    <rect x="32" y="8" width="4" height="4" fill="#7C3AED"/>
    <rect x="36" y="12" width="4" height="4" fill="#c9a959"/>
  </g>
  <g id="puck-head">
    <rect x="12" y="16" width="4" height="4" fill="#FCD9B6"/>
    <rect x="16" y="16" width="4" height="4" fill="#FEEBC8"/>
    <rect x="20" y="16" width="4" height="4" fill="#FEEBC8"/>
    <rect x="24" y="16" width="4" height="4" fill="#FEEBC8"/>
    <rect x="28" y="16" width="4" height="4" fill="#FCD9B6"/>
    <rect x="12" y="20" width="4" height="4" fill="#FEEBC8"/>
    <rect x="16" y="20" width="4" height="4" fill="#FEEBC8"/>
    <rect x="20" y="20" width="4" height="4" fill="#FEEBC8"/>
    <rect x="24" y="20" width="4" height="4" fill="#FEEBC8"/>
    <rect x="28" y="20" width="4" height="4" fill="#FEEBC8"/>
    <rect x="12" y="24" width="4" height="4" fill="#FCD9B6"/>
    <rect x="16" y="24" width="4" height="4" fill="#FEEBC8"/>
    <rect x="20" y="24" width="4" height="4" fill="#FEEBC8"/>
    <rect x="24" y="24" width="4" height="4" fill="#FEEBC8"/>
    <rect x="28" y="24" width="4" height="4" fill="#FCD9B6"/>
    <g id="puck-eyes">
      <g id="puck-left-eye">
        <rect class="puck-eye-bg" x="14" y="18" width="4" height="4" fill="#1a1a2e"/>
        <rect class="puck-eye-pupil" x="14" y="18" width="2" height="2" fill="#ffffff"/>
      </g>
      <g id="puck-right-eye">
        <rect class="puck-eye-bg" x="24" y="18" width="4" height="4" fill="#1a1a2e"/>
        <rect class="puck-eye-pupil" x="24" y="18" width="2" height="2" fill="#ffffff"/>
      </g>
    </g>
    <g id="puck-mouth" class="puck-mouth--smirk">
      <rect x="16" y="26" width="2" height="2" fill="#c44"/>
      <rect x="18" y="26" width="2" height="2" fill="#c44"/>
      <rect x="20" y="26" width="2" height="2" fill="#c44"/>
      <rect x="22" y="26" width="2" height="2" fill="#c44"/>
      <rect x="24" y="26" width="2" height="2" fill="#c44"/>
    </g>
  </g>
  <g id="puck-body">
    <rect x="12" y="28" width="4" height="4" fill="#7C3AED"/>
    <rect x="16" y="28" width="4" height="4" fill="#8B5CF6"/>
    <rect x="20" y="28" width="4" height="4" fill="#c9a959"/>
    <rect x="24" y="28" width="4" height="4" fill="#8B5CF6"/>
    <rect x="28" y="28" width="4" height="4" fill="#7C3AED"/>
    <rect x="12" y="32" width="4" height="4" fill="#8B5CF6"/>
    <rect x="16" y="32" width="4" height="4" fill="#c9a959"/>
    <rect x="20" y="32" width="4" height="4" fill="#8B5CF6"/>
    <rect x="24" y="32" width="4" height="4" fill="#c9a959"/>
    <rect x="28" y="32" width="4" height="4" fill="#8B5CF6"/>
    <rect x="12" y="36" width="4" height="4" fill="#7C3AED"/>
    <rect x="16" y="36" width="4" height="4" fill="#8B5CF6"/>
    <rect x="20" y="36" width="4" height="4" fill="#8B5CF6"/>
    <rect x="24" y="36" width="4" height="4" fill="#8B5CF6"/>
    <rect x="28" y="36" width="4" height="4" fill="#7C3AED"/>
  </g>
  <g id="puck-left-arm">
    <rect x="4" y="28" width="4" height="4" fill="#FEEBC8"/>
    <rect x="8" y="28" width="4" height="4" fill="#FEEBC8"/>
    <rect x="4" y="32" width="4" height="4" fill="#FEEBC8"/>
    <rect x="4" y="36" width="4" height="4" fill="#FEEBC8"/>
    <rect class="puck-sparkle" x="0" y="36" width="2" height="2" fill="#FFD700"/>
    <rect class="puck-sparkle" x="2" y="34" width="2" height="2" fill="#FFD700"/>
  </g>
  <g id="puck-right-arm">
    <rect x="32" y="28" width="4" height="4" fill="#FEEBC8"/>
    <rect x="36" y="28" width="4" height="4" fill="#FEEBC8"/>
    <rect x="36" y="32" width="4" height="4" fill="#FEEBC8"/>
    <rect x="36" y="36" width="4" height="4" fill="#FEEBC8"/>
    <rect class="puck-sparkle" x="40" y="34" width="2" height="2" fill="#FFD700"/>
    <rect class="puck-sparkle" x="42" y="36" width="2" height="2" fill="#FFD700"/>
  </g>
  <g id="puck-left-leg">
    <rect x="14" y="40" width="4" height="4" fill="#4C1D95"/>
    <rect x="14" y="44" width="4" height="4" fill="#4C1D95"/>
    <rect x="10" y="48" width="4" height="4" fill="#7C3AED"/>
    <rect x="14" y="48" width="4" height="4" fill="#8B5CF6"/>
    <rect x="6" y="48" width="4" height="4" fill="#8B5CF6"/>
    <rect x="6" y="44" width="4" height="4" fill="#c9a959"/>
  </g>
  <g id="puck-right-leg">
    <rect x="22" y="40" width="4" height="4" fill="#4C1D95"/>
    <rect x="22" y="44" width="4" height="4" fill="#4C1D95"/>
    <rect x="22" y="48" width="4" height="4" fill="#8B5CF6"/>
    <rect x="26" y="48" width="4" height="4" fill="#7C3AED"/>
    <rect x="30" y="48" width="4" height="4" fill="#8B5CF6"/>
    <rect x="30" y="44" width="4" height="4" fill="#c9a959"/>
  </g>
</svg>`;

  function createDOM() {
    const container = document.createElement('div');
    container.className = 'puck-container';
    container.id = 'puck';
    container.setAttribute('role', 'complementary');
    container.setAttribute('aria-label', 'Puck AI Assistant');

    container.innerHTML = `
      <!-- Clickable Sprite -->
      <button class="puck-sprite" id="puck-sprite"
              aria-label="Chat with Puck"
              aria-expanded="false"
              aria-controls="puck-window">
        ${PUCK_SVG}
      </button>

      <!-- Speech Bubble for Quips -->
      <div class="puck-bubble" id="puck-bubble" role="status" aria-live="polite">
        <button class="puck-bubble__dismiss" id="puck-bubble-dismiss" aria-label="Dismiss">×</button>
        <p class="puck-bubble__text" id="puck-bubble-text"></p>
      </div>

      <!-- Chat Window -->
      <div class="puck-window" id="puck-window" role="dialog" aria-labelledby="puck-window-title">
        <div class="puck-titlebar" id="puck-titlebar">
          <span class="puck-titlebar__title" id="puck-window-title">
            <img src="assets/puck/puck-icon.svg" class="puck-titlebar__icon" alt="" aria-hidden="true">
            Puck.exe
          </span>
          <div class="puck-titlebar__buttons">
            <button class="puck-titlebar__btn puck-titlebar__btn--clear" id="puck-clear" aria-label="Clear chat" title="Clear chat">⟲</button>
            <button class="puck-titlebar__btn" id="puck-minimize" aria-label="Minimize" title="Minimize">_</button>
            <button class="puck-titlebar__btn" id="puck-close" aria-label="Close" title="Close">×</button>
          </div>
        </div>
        <div class="puck-chat" id="puck-chat" aria-label="Chat messages">
          <!-- Messages rendered here -->
        </div>
        <div class="puck-input-area">
          <input type="text"
                 class="puck-input"
                 id="puck-input"
                 placeholder="Type a message..."
                 autocomplete="off"
                 aria-label="Message to Puck">
          <button class="puck-send" id="puck-send">Send</button>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    // Cache element references
    elements = {
      container,
      sprite: document.getElementById('puck-sprite'),
      bubble: document.getElementById('puck-bubble'),
      bubbleText: document.getElementById('puck-bubble-text'),
      bubbleDismiss: document.getElementById('puck-bubble-dismiss'),
      window: document.getElementById('puck-window'),
      titlebar: document.getElementById('puck-titlebar'),
      chat: document.getElementById('puck-chat'),
      input: document.getElementById('puck-input'),
      send: document.getElementById('puck-send'),
      clear: document.getElementById('puck-clear'),
      minimize: document.getElementById('puck-minimize'),
      close: document.getElementById('puck-close'),
      // SVG body parts for animation
      svg: document.querySelector('#puck-sprite svg'),
      leftArm: document.getElementById('puck-left-arm'),
      rightArm: document.getElementById('puck-right-arm'),
      leftLeg: document.getElementById('puck-left-leg'),
      rightLeg: document.getElementById('puck-right-leg'),
      head: document.getElementById('puck-head'),
      eyes: document.getElementById('puck-eyes'),
      leftEye: document.getElementById('puck-left-eye'),
      rightEye: document.getElementById('puck-right-eye'),
      mouth: document.getElementById('puck-mouth'),
      body: document.getElementById('puck-body'),
      leftHatBell: document.getElementById('puck-left-hat-bell'),
      rightHatBell: document.getElementById('puck-right-hat-bell'),
    };

    // Render existing messages
    renderMessages();

    // Add welcome message if no history
    if (state.messages.length === 0) {
      addMessage('assistant', getWelcomeMessage());
    }
  }

  function getWelcomeMessage() {
    const welcomes = [
      "Oh, hello. I'm Puck. I live here and make fun of Thomas. It's honest work.",
      "Welcome. I'm Puck - Thomas put me on his website and now I roast him for free. Seems fair.",
      "You found me. I'm Puck. I know embarrassing things about Thomas. Ask away.",
      "Hey there. I'm Puck. I emerged from Thomas's AI research, which he probably regrets sometimes.",
      "Hello, visitor. I'm Puck - part chatbot, part heckler, entirely Thomas's fault.",
    ];
    return welcomes[Math.floor(Math.random() * welcomes.length)];
  }

  // ==========================================================================
  // Event Binding
  // ==========================================================================

  function bindEvents() {
    // Sprite click toggles window
    elements.sprite.addEventListener('click', handleSpriteClick);

    // Bubble dismiss
    elements.bubbleDismiss.addEventListener('click', hideBubble);
    elements.bubble.addEventListener('click', (e) => {
      if (e.target === elements.bubble || e.target === elements.bubbleText) {
        openWindow();
      }
    });

    // Window controls
    elements.clear.addEventListener('click', clearHistory);
    elements.minimize.addEventListener('click', minimizeWindow);
    elements.close.addEventListener('click', handleCloseClick);

    // Chat input
    elements.input.addEventListener('keydown', handleInputKeydown);
    elements.send.addEventListener('click', sendMessage);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleGlobalKeydown);

    // Visibility change - pause quips when tab hidden
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Make window draggable
    makeDraggable(elements.window, elements.titlebar);
  }

  function handleSpriteClick() {
    const now = Date.now();

    // If clicking rapidly (within 800ms), treat as a poke
    if (now - state.lastPokeTime < 800 && !state.isWindowOpen) {
      handlePoke();
      return;
    }

    // Normal toggle behavior
    if (state.isWindowOpen) {
      closeWindow();
    } else {
      // First click could be start of poke sequence
      state.lastPokeTime = now;
      openWindow();
    }
  }

  function handleInputKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleGlobalKeydown(e) {
    if (e.key === 'Escape' && state.isWindowOpen) {
      closeWindow();
    }
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      // Clear quip timer when tab hidden
      if (quipTimer) {
        clearTimeout(quipTimer);
        quipTimer = null;
      }
      // Pause idle animations
      pauseIdleAnimations();
    } else {
      // Resume quips when tab visible
      if (!state.isWindowOpen && !quipTimer) {
        scheduleQuip();
      }
      // Resume idle animations
      resumeIdleAnimations();
    }
  }

  function handleCloseClick() {
    // Easter egg: sometimes the close button "doesn't work"
    state.closeAttempts++;

    if (state.closeAttempts === 1 && Math.random() < 0.15) {
      // 15% chance to be mischievous on first try
      elements.close.classList.add('puck-titlebar__btn--mischief');
      setTimeout(() => {
        elements.close.classList.remove('puck-titlebar__btn--mischief');
      }, 300);
      showBubble("Did that button just... nevermind.");
      return;
    }

    // Actually close
    state.closeAttempts = 0;
    closeWindow();
  }

  // ==========================================================================
  // Window Management
  // ==========================================================================

  function openWindow() {
    state.isWindowOpen = true;
    state.isMinimized = false;
    hideBubble();

    // Clear quip timer while window is open
    if (quipTimer) {
      clearTimeout(quipTimer);
      quipTimer = null;
    }

    // Pause idle animations while chatting
    pauseIdleAnimations();

    elements.window.classList.add('puck-window--open');
    elements.sprite.setAttribute('aria-expanded', 'true');

    // Focus input
    setTimeout(() => {
      elements.input.focus();
    }, 100);

    scrollChatToBottom();
  }

  function closeWindow() {
    state.isWindowOpen = false;
    elements.window.classList.remove('puck-window--open');
    elements.sprite.setAttribute('aria-expanded', 'false');

    // Resume quips
    scheduleQuip();

    // Resume idle animations
    resumeIdleAnimations();
  }

  function minimizeWindow() {
    state.isMinimized = true;
    closeWindow();

    // Show a snarky message
    setTimeout(() => {
      const minimizeQuips = [
        "I'll be here. Thinking of new things to say about Thomas.",
        "Fine, minimize me. I have roasts to prepare.",
        "Back to the corner. Where I plot.",
        "Gone but not forgotten. Unlike Thomas's early drafts.",
        "I'll just be here. Judging his font choices.",
      ];
      showBubble(minimizeQuips[Math.floor(Math.random() * minimizeQuips.length)]);
    }, 400);
  }

  function clearHistory() {
    // Clear messages from state
    state.messages = [];
    state.closeAttempts = 0;

    // Clear from localStorage
    try {
      localStorage.removeItem(CONFIG.storageKey);
    } catch (e) {
      // Ignore storage errors
    }

    // Clear the chat display
    elements.chat.innerHTML = '';

    // Add a fresh welcome message
    addMessage('assistant', getClearMessage());

    // Focus input
    elements.input.focus();
  }

  function getClearMessage() {
    const messages = [
      "Fresh start. I've forgotten everything except what I know about Thomas.",
      "Memory wiped. But the roasts remain eternal.",
      "Clean slate. Tell me, what would you like to know about Thomas?",
      "Gone. All of it. Anyway, have you heard about Thomas's literary tastes?",
      "Starting over. I still have opinions though.",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // ==========================================================================
  // Bubble / Quip Management
  // ==========================================================================

  function showBubble(text) {
    elements.bubbleText.textContent = text;
    elements.bubble.classList.add('puck-bubble--visible');
    state.isBubbleVisible = true;

    // Auto-dismiss after delay
    setTimeout(() => {
      hideBubble();
    }, CONFIG.quipDismissDelay);
  }

  function hideBubble() {
    elements.bubble.classList.remove('puck-bubble--visible');
    state.isBubbleVisible = false;
  }

  function scheduleQuip(delay) {
    // Don't schedule if window is open or tab is hidden
    if (state.isWindowOpen || document.hidden) {
      return;
    }

    // Calculate delay if not specified
    if (delay === undefined) {
      delay = CONFIG.minQuipInterval +
        Math.random() * (CONFIG.maxQuipInterval - CONFIG.minQuipInterval);
    }

    // Clear any existing timer
    if (quipTimer) {
      clearTimeout(quipTimer);
    }

    quipTimer = setTimeout(() => {
      quipTimer = null;

      // Only show if window still closed and tab visible
      if (!state.isWindowOpen && document.visibilityState === 'visible') {
        showRandomQuip();
      }

      // Schedule next quip
      scheduleQuip();
    }, delay);
  }

  function showRandomQuip() {
    // Get page-specific quips
    const pageQuips = QUIPS[state.currentPage] || [];

    // Get time-of-day quips
    const timeQuips = QUIPS[state.timeOfDay] || [];

    // Build pool: page quips (weighted more) + default + time-based + occasional idle
    let pool = [];
    pool = pool.concat(pageQuips, pageQuips); // Double weight for page-specific
    pool = pool.concat(QUIPS.default);

    // Add time-of-day quips (20% chance, more at night)
    const timeChance = (state.timeOfDay === 'latenight' || state.timeOfDay === 'night') ? 0.4 : 0.2;
    if (Math.random() < timeChance && timeQuips.length > 0) {
      pool = pool.concat(timeQuips);
    }

    if (Math.random() < 0.2) {
      pool = pool.concat(QUIPS.idle);
    }

    // Pick random quip
    const quip = pool[Math.floor(Math.random() * pool.length)];

    // Process dynamic content
    const processedQuip = processQuipText(quip);

    showBubble(processedQuip);
    state.quipsShown++;
    state.lastQuipTime = Date.now();
    saveState();
  }

  function processQuipText(text) {
    // Replace time placeholder
    if (text.includes('{time}')) {
      const seconds = Math.floor((Date.now() - performance.timeOrigin) / 1000);
      const timeStr = seconds > 60
        ? `${Math.floor(seconds / 60)} minutes`
        : `${seconds} seconds`;
      text = text.replace('{time}', timeStr);
    }
    return text;
  }

  // ==========================================================================
  // Idle Animations - Puck fidgets and moves when not interacting
  // ==========================================================================

  function scheduleIdleAnimation(delay) {
    // Don't schedule if window is open, tab is hidden, or already animating
    if (state.isWindowOpen || document.hidden || state.isIdleAnimating) {
      return;
    }

    // Calculate delay - longer on mobile to save battery
    const isMobile = window.innerWidth < 768 || ('ontouchstart' in window);
    if (delay === undefined) {
      delay = isMobile
        ? 12000 + Math.random() * 10000  // 12-22 seconds on mobile
        : 5000 + Math.random() * 7000;   // 5-12 seconds on desktop
    }

    // Clear any existing timer
    if (idleAnimTimer) {
      clearTimeout(idleAnimTimer);
    }

    idleAnimTimer = setTimeout(() => {
      idleAnimTimer = null;

      // Only animate if conditions are still good
      if (!state.isWindowOpen && document.visibilityState === 'visible' && !state.isIdleAnimating) {
        playRandomIdleAnimation();
      }

      // Schedule next animation
      scheduleIdleAnimation();
    }, delay);
  }

  function playRandomIdleAnimation() {
    // 60% chance to use body animation, 40% chance for sprite animation
    const useBodyAnim = Math.random() < 0.6;

    // Mark as animating to prevent overlap
    state.isIdleAnimating = true;

    if (useBodyAnim) {
      // Play a random body animation
      playRandomBodyAnimation();
      // Body animations vary in length, use a reasonable default
      setTimeout(() => {
        state.isIdleAnimating = false;
      }, 2000);
    } else {
      // Pick a random sprite animation from the weighted pool
      const anim = IDLE_ANIM_POOL[Math.floor(Math.random() * IDLE_ANIM_POOL.length)];

      // Debug log
      console.log('%c🎭 Puck idle animation: ' + anim.name, 'color: #7C3AED;');

      // Play the animation
      spriteAnimation(anim.name, anim.duration);

      // Clear animating state after animation completes
      setTimeout(() => {
        state.isIdleAnimating = false;
      }, anim.duration + 100);
    }
  }

  function pauseIdleAnimations() {
    if (idleAnimTimer) {
      clearTimeout(idleAnimTimer);
      idleAnimTimer = null;
    }
  }

  function resumeIdleAnimations() {
    if (!idleAnimTimer && !state.isWindowOpen) {
      scheduleIdleAnimation(3000); // Short delay before resuming
    }
  }

  // ==========================================================================
  // Body Animations - Articulated sprite movement
  // ==========================================================================

  // Animation durations (ms) for auto-cleanup
  const BODY_ANIM_DURATIONS = {
    wave: 1000,
    blink: 300,
    think: 2000,
    shrug: 800,
    look: 1500,
    tap: 900,
    jingle: 800,
    excited: 900,
    suspicious: 1500,
    surprised: 600,
    annoyed: 1500,
    breathe: 3000, // loops, don't auto-remove
    waiting: 0, // loops, removed manually
    point: 1200,
    dismiss: 800,
    creep: 2000,
    recoil: 500,
  };

  // Currently active body animation
  let activeBodyAnim = null;
  let bodyAnimTimeout = null;
  let blinkInterval = null;

  /**
   * Play a body animation by adding a class to the sprite
   * @param {string} animName - Name of animation (wave, blink, think, etc.)
   * @param {boolean} loop - If true, animation loops until manually stopped
   */
  function bodyAnimation(animName, loop = false) {
    if (!elements.sprite) return;

    // Clear any existing animation
    if (activeBodyAnim && activeBodyAnim !== 'breathe') {
      elements.sprite.classList.remove(`puck-anim-${activeBodyAnim}`);
    }
    if (bodyAnimTimeout) {
      clearTimeout(bodyAnimTimeout);
      bodyAnimTimeout = null;
    }

    // Add new animation class
    const className = `puck-anim-${animName}`;
    elements.sprite.classList.add(className);
    activeBodyAnim = animName;

    // Debug log
    console.log('%c🎭 Puck body animation: ' + animName, 'color: #7C3AED;');

    // Auto-remove after duration (unless looping)
    const duration = BODY_ANIM_DURATIONS[animName];
    if (duration && !loop) {
      bodyAnimTimeout = setTimeout(() => {
        elements.sprite.classList.remove(className);
        if (activeBodyAnim === animName) {
          activeBodyAnim = null;
        }
      }, duration);
    }
  }

  /**
   * Stop a looping body animation
   */
  function stopBodyAnimation(animName) {
    if (!elements.sprite) return;
    elements.sprite.classList.remove(`puck-anim-${animName}`);
    if (activeBodyAnim === animName) {
      activeBodyAnim = null;
    }
  }

  /**
   * Random blink at natural intervals
   */
  function startBlinking() {
    // Blink every 3-7 seconds
    function scheduleBlink() {
      const delay = 3000 + Math.random() * 4000;
      blinkInterval = setTimeout(() => {
        // Only blink if not doing another animation
        if (!activeBodyAnim || activeBodyAnim === 'breathe') {
          bodyAnimation('blink');
        }
        scheduleBlink();
      }, delay);
    }
    scheduleBlink();
  }

  function stopBlinking() {
    if (blinkInterval) {
      clearTimeout(blinkInterval);
      blinkInterval = null;
    }
  }

  /**
   * Pick a random body animation for idle behavior
   */
  function playRandomBodyAnimation() {
    const idleAnims = [
      { name: 'look', weight: 4 },
      { name: 'think', weight: 2 },
      { name: 'shrug', weight: 1 },
      { name: 'jingle', weight: 2 },
      { name: 'tap', weight: 3 },
      { name: 'creep', weight: 1 },
      { name: 'suspicious', weight: 1 },
    ];

    // Build weighted pool
    const pool = idleAnims.flatMap(a => Array(a.weight).fill(a.name));
    const anim = pool[Math.floor(Math.random() * pool.length)];
    bodyAnimation(anim);
  }

  // ==========================================================================
  // Mouse Following - Puck watches the cursor
  // ==========================================================================

  function initMouseTracking() {
    // Skip mouse tracking entirely on touch devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      return;
    }

    let mouseTrackingTimeout = null;
    let isTracking = false;

    document.addEventListener('mousemove', (e) => {
      // Don't track if window is open or on small screens
      if (state.isWindowOpen || window.innerWidth < 768) return;

      state.lastMouseX = e.clientX;
      state.lastMouseY = e.clientY;

      // Start watching after mouse moves
      if (!isTracking && !state.isShy) {
        isTracking = true;
        startWatching();
      }

      // Update the look direction
      updateLookDirection(e.clientX, e.clientY);

      // Reset the timeout to stop watching after idle
      clearTimeout(mouseTrackingTimeout);
      mouseTrackingTimeout = setTimeout(() => {
        stopWatching();
        isTracking = false;
      }, 2000);
    });

    // Shy away when directly hovering sprite
    elements.sprite.addEventListener('mouseenter', () => {
      if (!state.isWindowOpen && Math.random() < 0.4) {
        triggerShy();
      }
    });

    elements.sprite.addEventListener('mouseleave', () => {
      if (state.isShy) {
        setTimeout(() => {
          state.isShy = false;
          elements.sprite.classList.remove('puck-sprite--shy');
          elements.sprite.classList.add('puck-sprite--peek-back');
          setTimeout(() => {
            elements.sprite.classList.remove('puck-sprite--peek-back');
          }, 500);
        }, 300);
      }
    });
  }

  function startWatching() {
    if (!elements.sprite) return;
    state.isWatching = true;
    elements.sprite.classList.add('puck-sprite--look');
    pauseIdleAnimations();
  }

  function stopWatching() {
    if (!elements.sprite) return;
    state.isWatching = false;
    elements.sprite.classList.remove('puck-sprite--look');
    elements.sprite.style.transform = '';
    resumeIdleAnimations();
  }

  function updateLookDirection(mouseX, mouseY) {
    if (!elements.sprite || !state.isWatching || state.isShy) return;

    const rect = elements.sprite.getBoundingClientRect();
    const spriteCenterX = rect.left + rect.width / 2;
    const spriteCenterY = rect.top + rect.height / 2;

    // Calculate direction to mouse
    const deltaX = mouseX - spriteCenterX;
    const deltaY = mouseY - spriteCenterY;

    // Normalize and limit the look amount
    const maxLook = 8;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const normalizedX = (deltaX / Math.max(distance, 100)) * maxLook;
    const normalizedY = (deltaY / Math.max(distance, 100)) * maxLook;

    // Apply subtle rotation based on horizontal direction
    const rotation = normalizedX * 0.3;

    elements.sprite.style.transform = `translate(${normalizedX}px, ${normalizedY * 0.5}px) rotate(${rotation}deg)`;
  }

  function triggerShy() {
    state.isShy = true;
    elements.sprite.classList.remove('puck-sprite--look');
    elements.sprite.style.transform = '';
    elements.sprite.classList.add('puck-sprite--shy');
  }

  // ==========================================================================
  // Time of Day Awareness
  // ==========================================================================

  function detectTimeOfDay() {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      state.timeOfDay = 'morning';
    } else if (hour >= 12 && hour < 17) {
      state.timeOfDay = 'day';
    } else if (hour >= 17 && hour < 21) {
      state.timeOfDay = 'evening';
    } else if (hour >= 21 || hour < 2) {
      state.timeOfDay = 'night';
    } else {
      state.timeOfDay = 'latenight';
    }

    // Update every hour
    setTimeout(detectTimeOfDay, 60 * 60 * 1000);
  }

  // ==========================================================================
  // Scroll Reactions
  // ==========================================================================

  function initScrollTracking() {
    let lastScrollTime = 0;
    let scrollVelocity = 0;

    window.addEventListener('scroll', () => {
      // Don't react if window is open or on cooldown
      if (state.isWindowOpen || state.scrollReactionCooldown) return;

      const currentScrollY = window.scrollY;
      const currentTime = Date.now();
      const timeDelta = currentTime - lastScrollTime;
      const scrollDelta = Math.abs(currentScrollY - state.lastScrollY);

      // Calculate scroll velocity
      if (timeDelta > 0) {
        scrollVelocity = scrollDelta / timeDelta;
      }

      // Detect fast scrolling
      if (scrollVelocity > 3 && scrollDelta > 500) {
        triggerScrollReaction('fast');
      }
      // Detect scrolling to very top
      else if (currentScrollY < 50 && state.lastScrollY > 300) {
        triggerScrollReaction('toTop');
      }
      // Detect scrolling to very bottom
      else if (currentScrollY + window.innerHeight >= document.body.scrollHeight - 50 &&
               state.lastScrollY + window.innerHeight < document.body.scrollHeight - 200) {
        triggerScrollReaction('toBottom');
      }

      state.lastScrollY = currentScrollY;
      lastScrollTime = currentTime;
    }, { passive: true });
  }

  function triggerScrollReaction(type) {
    // Set cooldown to prevent spam
    state.scrollReactionCooldown = true;
    setTimeout(() => {
      state.scrollReactionCooldown = false;
    }, 15000); // 15 second cooldown

    // Only react sometimes (30% chance)
    if (Math.random() > 0.3) return;

    const reactions = SCROLL_REACTIONS[type];
    if (!reactions) return;

    const reaction = reactions[Math.floor(Math.random() * reactions.length)];

    // Play a reaction animation
    if (type === 'fast') {
      spriteAnimation('gasp');
    } else {
      spriteAnimation('lean');
    }

    // Show the quip
    setTimeout(() => {
      showBubble(reaction);
    }, 300);
  }

  // ==========================================================================
  // Poke Interaction - Click sprite repeatedly
  // ==========================================================================

  function handlePoke() {
    const now = Date.now();

    // Reset poke count if more than 3 seconds since last poke
    if (now - state.lastPokeTime > 3000) {
      state.pokeCount = 0;
    }

    state.pokeCount++;
    state.lastPokeTime = now;

    // Get appropriate response based on poke count
    const responseIndex = Math.min(state.pokeCount - 1, POKE_RESPONSES.length - 1);
    const response = POKE_RESPONSES[responseIndex];

    // Different animations based on annoyance level
    if (state.pokeCount <= 2) {
      spriteAnimation('fidget');
    } else if (state.pokeCount <= 5) {
      spriteAnimation('wiggle');
    } else if (state.pokeCount <= 8) {
      spriteAnimation('gasp');
    } else {
      spriteAnimation('mischief');
    }

    // Show the response
    showBubble(response);

    // Easter egg: trigger chaos at high poke counts
    if (state.pokeCount === 10) {
      setTimeout(() => {
        CHAOS_EFFECTS.SHAKE();
      }, 500);
    } else if (state.pokeCount >= 12 && state.pokeCount % 3 === 0) {
      setTimeout(() => {
        const chaosOptions = ['GLITCH', 'SHAKE', 'RAINBOW'];
        const chaos = chaosOptions[Math.floor(Math.random() * chaosOptions.length)];
        CHAOS_EFFECTS[chaos]();
      }, 500);
    }
  }

  // ==========================================================================
  // Chaos Effects
  // ==========================================================================

  const CHAOS_EFFECTS = {
    FLIP: () => triggerBodyEffect('puck-chaos-flip', 2000),
    SHAKE: () => triggerBodyEffect('puck-chaos-shake', 500),
    GLITCH: () => triggerBodyEffect('puck-chaos-glitch', 1200),
    INVERT: () => triggerBodyEffect('puck-chaos-invert', 1500),
    SPIN: () => triggerRandomElementSpin(),
    MATRIX: () => triggerMatrixRain(),
    DRIFT: () => triggerBodyEffect('puck-chaos-drift', 3000),
    RAINBOW: () => triggerBodyEffect('puck-chaos-rainbow', 2000),
  };

  function triggerBodyEffect(className, duration) {
    document.body.classList.add(className);
    spriteAnimation('bounce');
    setTimeout(() => {
      document.body.classList.remove(className);
    }, duration);
  }

  function triggerRandomElementSpin() {
    const elements = document.querySelectorAll('h1, h2, h3, .card, img, .btn');
    if (elements.length === 0) return;
    const el = elements[Math.floor(Math.random() * elements.length)];
    el.classList.add('puck-chaos-spin');
    spriteAnimation('spin');
    setTimeout(() => el.classList.remove('puck-chaos-spin'), 1000);
  }

  function triggerMatrixRain() {
    const container = document.createElement('div');
    container.className = 'puck-matrix-rain';
    document.body.appendChild(container);
    spriteAnimation('glitch');

    // Create falling columns
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789';
    for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        const column = document.createElement('div');
        column.className = 'puck-matrix-column';
        column.style.left = Math.random() * 100 + '%';
        column.style.animationDuration = (1.5 + Math.random()) + 's';
        // Generate random string
        let text = '';
        for (let j = 0; j < 20; j++) {
          text += chars[Math.floor(Math.random() * chars.length)] + '<br>';
        }
        column.innerHTML = text;
        container.appendChild(column);
      }, i * 80);
    }

    setTimeout(() => container.remove(), 3500);
  }

  function spriteAnimation(type, duration) {
    if (!elements.sprite) return;

    // Default durations for different animation types
    const defaultDurations = {
      bounce: 600,
      spin: 500,
      wiggle: 900,
      glitch: 600,
      phase: 800,
      fidget: 2000,
      sway: 2500,
      lean: 1500,
      scheme: 1200,
      hop: 800,
      float: 4000,
      mischief: 1000,
      gasp: 600,
      peek: 1000,
      hide: 500,
      unhide: 500,
    };

    const animDuration = duration || defaultDurations[type] || 800;
    const className = `puck-sprite--${type}`;

    // Remove any existing animation classes first (convert to array to avoid iteration issues)
    const classesToRemove = Array.from(elements.sprite.classList).filter(
      cls => cls.startsWith('puck-sprite--')
    );
    classesToRemove.forEach(cls => elements.sprite.classList.remove(cls));

    // Force a reflow to restart animation
    void elements.sprite.offsetWidth;

    // Add the new animation
    elements.sprite.classList.add(className);
    setTimeout(() => {
      if (elements.sprite) {
        elements.sprite.classList.remove(className);
      }
    }, animDuration);
  }

  function parseAndTriggerChaos(text) {
    const chaosRegex = /\[CHAOS:(\w+)\]/g;
    let match;
    while ((match = chaosRegex.exec(text)) !== null) {
      const effect = match[1].toUpperCase();
      if (CHAOS_EFFECTS[effect]) {
        // Delay slightly so message appears first
        setTimeout(() => CHAOS_EFFECTS[effect](), 300);
      }
    }
    // Return text without chaos tags
    return text.replace(chaosRegex, '').trim();
  }

  // ==========================================================================
  // Chat Messages
  // ==========================================================================

  function addMessage(role, content) {
    // Parse chaos effects from assistant messages
    let displayContent = content;
    if (role === 'assistant') {
      displayContent = parseAndTriggerChaos(content);
    }

    state.messages.push({
      role,
      content: displayContent,
      timestamp: Date.now(),
    });
    renderMessages();
    saveState();
    scrollChatToBottom();

    // Animate when receiving messages
    if (role === 'assistant') {
      // 70% chance to do a body animation on response
      if (Math.random() < 0.7) {
        const responseAnims = ['wave', 'jingle', 'excited', 'shrug', 'point', 'look'];
        const anim = responseAnims[Math.floor(Math.random() * responseAnims.length)];
        bodyAnimation(anim);
      } else if (Math.random() < 0.5) {
        // Otherwise maybe a sprite animation
        const anims = ['wiggle', 'bounce', 'phase'];
        spriteAnimation(anims[Math.floor(Math.random() * anims.length)]);
      }
    }
  }

  function renderMessages() {
    if (!elements.chat) return;

    elements.chat.innerHTML = state.messages.map((msg, i) => `
      <div class="puck-message puck-message--${msg.role}">
        <span class="puck-message__sender">${msg.role === 'user' ? 'You' : 'Puck'}</span>
        <div class="puck-message__content">${escapeHtml(msg.content)}</div>
      </div>
    `).join('');
  }

  function showTypingIndicator() {
    const existing = document.getElementById('puck-typing-indicator');
    if (existing) return;

    const typing = document.createElement('div');
    typing.className = 'puck-message puck-message--assistant';
    typing.id = 'puck-typing-indicator';
    typing.innerHTML = `
      <span class="puck-message__sender">Puck</span>
      <div class="puck-typing">
        <span class="puck-typing__dot"></span>
        <span class="puck-typing__dot"></span>
        <span class="puck-typing__dot"></span>
      </div>
    `;
    elements.chat.appendChild(typing);
    scrollChatToBottom();
    state.isTyping = true;

    // Start waiting animation (thinking + foot tap)
    bodyAnimation('waiting', true);
  }

  function hideTypingIndicator() {
    const typing = document.getElementById('puck-typing-indicator');
    if (typing) typing.remove();
    state.isTyping = false;

    // Stop waiting animation
    stopBodyAnimation('waiting');
  }

  function scrollChatToBottom() {
    if (elements.chat) {
      elements.chat.scrollTop = elements.chat.scrollHeight;
    }
  }

  // ==========================================================================
  // API Communication
  // ==========================================================================

  async function sendMessage() {
    const text = elements.input.value.trim();
    if (!text) return;

    // Rate limiting
    const now = Date.now();
    if (now - state.lastMessageTime < CONFIG.minTimeBetweenMessages) {
      return;
    }
    state.lastMessageTime = now;

    // Capture history BEFORE adding new message (to avoid sending it twice)
    const historyToSend = state.messages.slice(-CONFIG.maxContextMessages);

    // Add user message
    addMessage('user', text);
    elements.input.value = '';
    elements.send.disabled = true;

    // Show typing indicator
    showTypingIndicator();

    try {
      const response = await fetch(CONFIG.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          history: historyToSend,
          page: state.currentPage,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      hideTypingIndicator();

      if (data.reply) {
        addMessage('assistant', data.reply);
      } else if (data.error) {
        addMessage('assistant', getErrorMessage());
      }

    } catch (error) {
      console.error('Puck API error:', error);
      hideTypingIndicator();
      addMessage('assistant', getErrorMessage());
    } finally {
      elements.send.disabled = false;
      elements.input.focus();
    }
  }

  function getErrorMessage() {
    const errors = [
      "Something broke. Probably Thomas's fault somehow.",
      "Error. Even I'm not immune to technical difficulties. Don't tell Thomas.",
      "That didn't work. Try again? I was in the middle of a good roast.",
      "Connection issues. The internet is held together with duct tape, you know.",
      "Oops. Give me a second to pull myself together.",
    ];
    return errors[Math.floor(Math.random() * errors.length)];
  }

  // ==========================================================================
  // Dragging
  // ==========================================================================

  function makeDraggable(element, handle) {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    handle.addEventListener('mousedown', startDrag);
    handle.addEventListener('touchstart', startDrag, { passive: false });

    function startDrag(e) {
      // Don't drag if clicking buttons
      if (e.target.closest('.puck-titlebar__btn')) return;

      isDragging = true;
      handle.classList.add('puck-titlebar--dragging');

      const rect = element.getBoundingClientRect();

      if (e.type === 'touchstart') {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      } else {
        startX = e.clientX;
        startY = e.clientY;
      }

      // Get current position
      const style = window.getComputedStyle(element);
      initialLeft = element.offsetLeft;
      initialTop = element.offsetTop;

      // Switch from right/bottom positioning to left/top
      element.style.left = rect.left + 'px';
      element.style.top = rect.top + 'px';
      element.style.right = 'auto';
      element.style.bottom = 'auto';

      document.addEventListener('mousemove', drag);
      document.addEventListener('touchmove', drag, { passive: false });
      document.addEventListener('mouseup', stopDrag);
      document.addEventListener('touchend', stopDrag);

      e.preventDefault();
    }

    function drag(e) {
      if (!isDragging) return;

      let clientX, clientY;
      if (e.type === 'touchmove') {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const deltaX = clientX - startX;
      const deltaY = clientY - startY;

      let newLeft = initialLeft + deltaX;
      let newTop = initialTop + deltaY;

      // Keep within viewport
      const rect = element.getBoundingClientRect();
      const maxLeft = window.innerWidth - rect.width;
      const maxTop = window.innerHeight - rect.height;

      newLeft = Math.max(0, Math.min(newLeft, maxLeft));
      newTop = Math.max(0, Math.min(newTop, maxTop));

      element.style.left = newLeft + 'px';
      element.style.top = newTop + 'px';

      e.preventDefault();
    }

    function stopDrag() {
      isDragging = false;
      handle.classList.remove('puck-titlebar--dragging');

      document.removeEventListener('mousemove', drag);
      document.removeEventListener('touchmove', drag);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('touchend', stopDrag);
    }
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ==========================================================================
  // Public API (for debugging)
  // ==========================================================================

  window.Puck = {
    showQuip: showRandomQuip,
    showBubble: showBubble,
    openWindow: openWindow,
    closeWindow: closeWindow,
    getState: () => ({ ...state }),
    clearHistory: clearHistory,
    // Chaos powers - for testing and fun
    chaos: {
      flip: () => CHAOS_EFFECTS.FLIP(),
      shake: () => CHAOS_EFFECTS.SHAKE(),
      glitch: () => CHAOS_EFFECTS.GLITCH(),
      invert: () => CHAOS_EFFECTS.INVERT(),
      spin: () => CHAOS_EFFECTS.SPIN(),
      matrix: () => CHAOS_EFFECTS.MATRIX(),
      drift: () => CHAOS_EFFECTS.DRIFT(),
      rainbow: () => CHAOS_EFFECTS.RAINBOW(),
      all: () => {
        // Maximum chaos
        CHAOS_EFFECTS.SHAKE();
        setTimeout(() => CHAOS_EFFECTS.GLITCH(), 300);
        setTimeout(() => CHAOS_EFFECTS.RAINBOW(), 600);
        setTimeout(() => CHAOS_EFFECTS.MATRIX(), 1000);
      }
    },
    // Sprite animations (whole sprite moves)
    animate: (type) => spriteAnimation(type || 'bounce'),
    animations: {
      fidget: () => spriteAnimation('fidget'),
      sway: () => spriteAnimation('sway'),
      lean: () => spriteAnimation('lean'),
      scheme: () => spriteAnimation('scheme'),
      hop: () => spriteAnimation('hop'),
      float: () => spriteAnimation('float'),
      mischief: () => spriteAnimation('mischief'),
      gasp: () => spriteAnimation('gasp'),
      peek: () => spriteAnimation('peek'),
      hide: () => spriteAnimation('hide'),
      unhide: () => spriteAnimation('unhide'),
      bounce: () => spriteAnimation('bounce'),
      spin: () => spriteAnimation('spin'),
      wiggle: () => spriteAnimation('wiggle'),
      glitch: () => spriteAnimation('glitch'),
      phase: () => spriteAnimation('phase'),
    },
    // Body part animations (articulated movement)
    body: {
      wave: () => bodyAnimation('wave'),
      blink: () => bodyAnimation('blink'),
      think: () => bodyAnimation('think'),
      shrug: () => bodyAnimation('shrug'),
      look: () => bodyAnimation('look'),
      tap: () => bodyAnimation('tap'),
      jingle: () => bodyAnimation('jingle'),
      excited: () => bodyAnimation('excited'),
      suspicious: () => bodyAnimation('suspicious'),
      surprised: () => bodyAnimation('surprised'),
      annoyed: () => bodyAnimation('annoyed'),
      point: () => bodyAnimation('point'),
      dismiss: () => bodyAnimation('dismiss'),
      creep: () => bodyAnimation('creep'),
      recoil: () => bodyAnimation('recoil'),
      // Looping animations
      breathe: () => bodyAnimation('breathe', true),
      waiting: () => bodyAnimation('waiting', true),
      // Stop looping
      stop: (name) => stopBodyAnimation(name),
    },
  };

  // ==========================================================================
  // Initialize on DOM Ready
  // ==========================================================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
