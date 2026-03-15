// AI Interview Simulator - Enhanced Main JavaScript File
// Face2Hire - Complete with all fixes and enhancements

// Global state management with improved structure
const AppState = {
    // User and session state
    currentUser: null,
    currentInterview: null,
    isAuthenticated: false,
    
    // Audio and speech state
    avatarInstance: null,
    speechSynthesis: null,
    isRecording: false,
    isSpeaking: false,
    speechQueue: [],
    isProcessingResponse: false,
    pausedSpeech: null,
    speechPaused: false,
    userInteracted: false,
    
    // Media recording state
    mediaRecorder: null,
    audioStream: null,
    audioChunks: [],
    audioBlob: null,
    audioContext: null,
    analyser: null,
    recognition: null,
    recordingStartTime: 0,
    
    // Coaching and analysis state
    coachingState: 'listening',
    deliveryMetrics: {
        pace: 0,
        fillers: 0,
        clarity: 0,
        energy: 0,
        fillerWords: {}
    },
    realTimeAnalysis: {
        wordsPerMinute: 0,
        fillerWords: [],
        volume: 0,
        pitch: 0
    },
    
    // Transcript state
    currentResponseTranscript: '',
    finalTranscript: '',
    currentQuestion: null,
    
    // Interview state
    selectedRole: null,
    interviewScores: {
        communication: 75,
        content: 80,
        confidence: 70
    },
    
    // Performance tracking
    performanceHistory: []
};

// Configuration constants
const CONFIG = {
    API_MODEL: 'gemini-1.5-flash', // Updated to valid model name
    MAX_RECORDING_TIME: 300000, // 5 minutes
    IDEAL_PACE_RANGE: { min: 120, max: 160 },
    MAX_FILLER_WORDS: 5,
    FILLER_WORDS: ['um', 'uh', 'like', 'you know', 'so', 'well', 'actually', 'basically'],
    SUPPORTED_FILE_TYPES: ['application/pdf', 'text/plain']
};

// Initialize application with enhanced error handling
document.addEventListener('DOMContentLoaded', function() {
    console.log('Face2Hire Application Initializing...');
    initializeApp();
});

// Main initialization function with safety wrapper
async function initializeApp() {
    try {
        // Test all connections first
        await testAllConnections();
        
        // Initialize scroll reveal animations
        safeInit(initScrollReveal, 'Scroll reveal');
        
        // Initialize Vanta.js background if on landing page
        if (document.getElementById('vanta-bg')) {
            safeInit(initVantaBackground, 'Vanta background');
        }
        
        // Initialize page-specific functionality
        const currentPage = getCurrentPage();
        console.log(`Initializing page: ${currentPage}`);
        
        switch(currentPage) {
            case 'index':
                initLandingPage();
                break;
            case 'dashboard':
                initDashboard();
                break;
            case 'interview-setup':
                await initInterviewSetup();
                break;
            case 'interview-live':
                await initLiveInterview();
                break;
            case 'results':
                initResultsPage();
                break;
            case 'profile':
                initProfilePage();
                break;
            case 'login':
                initLoginPage();
                break;
            default:
                console.log(`Unknown page: ${currentPage}`);
        }
        
        // Initialize common functionality
        safeInit(initNavigation, 'Navigation');
        safeInit(initVoiceSystems, 'Voice systems');
        
        // Request microphone permission
        await requestMicrophonePermission();
        
        console.log('[SUCCESS] Application initialized successfully');
        showNotification('Application ready!', 'success');
        
    } catch (error) {
        console.error('[ERROR] Application initialization failed:', error);
        showNotification('Failed to initialize application. Please refresh.', 'error');
    }
}

// Enhanced safe initialization wrapper
function safeInit(fn, featureName = 'Feature') {
    try {
        const result = fn();
        console.log(`✅ ${featureName} initialized`);
        return result;
    } catch (error) {
        console.warn(`[WARNING] ${featureName} initialization failed:`, error);
        return null;
    }
}

// Test all external connections
async function testAllConnections() {
    console.log('=== Testing Face2Hire Connections ===');
    
    const tests = {
        'Three.js': () => {
            const available = typeof THREE !== 'undefined';
            if (!available) console.warn('Three.js not loaded. Add CDN to HTML.');
            return available;
        },
        'Vanta.js': () => {
            const available = typeof VANTA !== 'undefined';
            if (!available) console.warn('Vanta.js not loaded. Add CDN to HTML.');
            return available;
        },
        'ECharts': () => {
            const available = typeof echarts !== 'undefined';
            if (!available) console.warn('ECharts not loaded. Add CDN to HTML.');
            return available;
        },
        'SpeechRecognition': () => {
            const available = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
            if (!available) console.warn('SpeechRecognition not supported. Use Chrome/Edge.');
            return available;
        },
        'SpeechSynthesis': () => 'speechSynthesis' in window || 'webkitSpeechSynthesis' in window,
        'MediaRecorder': () => 'MediaRecorder' in window,
        'WebRTC': () => navigator.mediaDevices && navigator.mediaDevices.getUserMedia,
        'Questions JSON': async () => {
            try {
                const res = await fetch('./questions.json');
                if (!res.ok) throw new Error('File not found');
                return true;
            } catch (error) {
                console.warn('questions.json not found. Using mock questions.');
                return false;
            }
        },
        'Environment Config': () => {
            // Check if API key is available in localStorage or environment
            const hasApiKey = localStorage.getItem('GEMINI_API_KEY') ||
                             window.GEMINI_API_KEY ||
                             false;
            // Note: API key check is silent - AI features will gracefully degrade
            return !!hasApiKey;
        }
    };
    
    const results = [];
    for (const [name, test] of Object.entries(tests)) {
        try {
            const result = typeof test === 'function' ? 
                (test.constructor.name === 'AsyncFunction' ? await test() : test()) : 
                false;
            results.push({ name, status: result ? '[SUCCESS]' : '[ERROR]' });
            console.log(`${name}: ${result ? '[SUCCESS]' : '[ERROR]'}`);
        } catch (error) {
            results.push({ name, status: '❌', error: error.message });
            console.log(`${name}: ❌ (${error.message})`);
        }
    }
    
    return results;
}

// Get current page identifier
function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    
    if (page.includes('dashboard')) return 'dashboard';
    if (page.includes('interview-setup')) return 'interview-setup';
    if (page.includes('interview-live')) return 'interview-live';
    if (page.includes('results')) return 'results';
    if (page.includes('profile')) return 'profile';
    if (page.includes('login')) return 'login';
    return 'index';
}

// Initialize scroll reveal animations with intersection observer
function initScrollReveal() {
    if (!('IntersectionObserver' in window)) {
        console.warn('IntersectionObserver not supported');
        return;
    }
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.scroll-reveal').forEach(el => {
        observer.observe(el);
    });
}

// Initialize Vanta.js background animation
function initVantaBackground() {
    if (typeof VANTA === 'undefined') {
        console.warn('Vanta.js not loaded');
        return;
    }
    
    try {
        VANTA.BIRDS({
            el: "#vanta-bg",
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            backgroundColor: 0x1e293b,
            color1: 0x3b82f6,
            color2: 0x8b5cf6,
            colorMode: "lerpGradient",
            birdSize: 1.20,
            wingSpan: 25.00,
            speedLimit: 4.00,
            separation: 20.00,
            alignment: 20.00,
            cohesion: 20.00,
            quantity: 3.00
        });
        console.log('Vanta background initialized');
    } catch (error) {
        console.error('Vanta.js initialization failed:', error);
    }
}

// Initialize landing page specific functionality
function initLandingPage() {
    // Add smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Initialize demo avatar interaction
    initDemoAvatar();
}

// Initialize demo avatar functionality
function initDemoAvatar() {
    const avatarDemo = document.querySelector('.interactive-demo');
    if (avatarDemo) {
        avatarDemo.addEventListener('click', activateAvatar);
    }
}

// Activate avatar demo
function activateAvatar() {
    const avatar = document.querySelector('.interactive-demo img');
    if (avatar && !AppState.isSpeaking) {
        AppState.isSpeaking = true;
        
        // Add speaking animation
        avatar.style.transform = 'scale(1.1)';
        avatar.style.transition = 'transform 0.3s ease';
        
        // Simulate avatar speaking
        setTimeout(() => {
            avatar.style.transform = 'scale(1)';
            AppState.isSpeaking = false;
        }, 2000);
        
        // Show notification
        showNotification('Avatar activated! Try the full experience in the dashboard.');
    }
}

// Initialize dashboard functionality
function initDashboard() {
    // Initialize user stats
    updateUserStats();
    
    // Initialize progress charts
    initProgressCharts();
    
    // Initialize recent activity
    loadRecentActivity();
    
    // Initialize achievement system
    initAchievements();
}

// Initialize progress charts using ECharts
function initProgressCharts() {
    if (typeof echarts === 'undefined') {
        console.warn('ECharts not loaded');
        return;
    }
    
    const chartContainer = document.getElementById('progress-chart');
    if (!chartContainer) return;
    
    try {
        const chart = echarts.init(chartContainer);
        
        const option = {
            title: {
                text: 'Interview Performance Trends',
                textStyle: {
                    color: '#1e293b',
                    fontSize: 18,
                    fontWeight: 'bold'
                }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross'
                }
            },
            legend: {
                data: ['Communication', 'Technical', 'Confidence', 'Overall'],
                bottom: 0
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '15%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
                axisLine: {
                    lineStyle: {
                        color: '#64748b'
                    }
                }
            },
            yAxis: {
                type: 'value',
                min: 0,
                max: 100,
                axisLine: {
                    lineStyle: {
                        color: '#64748b'
                    }
                }
            },
            series: [
                {
                    name: 'Communication',
                    type: 'line',
                    data: [65, 72, 78, 82, 85, 88],
                    smooth: true,
                    lineStyle: {
                        color: '#3b82f6',
                        width: 3
                    },
                    itemStyle: {
                        color: '#3b82f6'
                    }
                },
                {
                    name: 'Technical',
                    type: 'line',
                    data: [70, 75, 80, 83, 87, 90],
                    smooth: true,
                    lineStyle: {
                        color: '#8b5cf6',
                        width: 3
                    },
                    itemStyle: {
                        color: '#8b5cf6'
                    }
                },
                {
                    name: 'Confidence',
                    type: 'line',
                    data: [60, 68, 72, 76, 80, 85],
                    smooth: true,
                    lineStyle: {
                        color: '#10b981',
                        width: 3
                    },
                    itemStyle: {
                        color: '#10b981'
                    }
                },
                {
                    name: 'Overall',
                    type: 'line',
                    data: [65, 72, 77, 81, 84, 88],
                    smooth: true,
                    lineStyle: {
                        color: '#f59e0b',
                        width: 4
                    },
                    itemStyle: {
                        color: '#f59e0b'
                    }
                }
            ]
        };
        
        chart.setOption(option);
        
        // Make chart responsive
        window.addEventListener('resize', () => {
            chart.resize();
        });
        
    } catch (error) {
        console.error('Error initializing progress chart:', error);
    }
}

// Initialize interview setup functionality
async function initInterviewSetup() {
    // Initialize role selection
    initRoleSelection();
    
    // Initialize file upload
    initFileUpload();
    
    // Initialize avatar selection
    initAvatarSelection();
    
    // Initialize settings configuration
    initSettingsConfig();
}

// Initialize role selection interface
function initRoleSelection() {
    const roleCards = document.querySelectorAll('.role-card');
    roleCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove active class from all cards
            roleCards.forEach(c => c.classList.remove('ring-2', 'ring-blue-500'));
            
            // Add active class to clicked card
            this.classList.add('ring-2', 'ring-blue-500');
            
            // Store selected role
            const roleId = this.dataset.roleId;
            AppState.selectedRole = roleId;
            
            // Update preview
            updateRolePreview(roleId);
        });
    });
}

// Update role preview
function updateRolePreview(roleId) {
    const previewElement = document.getElementById('role-preview');
    if (previewElement) {
        previewElement.textContent = `Selected: ${roleId.replace('-', ' ').toUpperCase()}`;
    }
}

// Initialize avatar selection
function initAvatarSelection() {
    const avatarOptions = document.querySelectorAll('.avatar-option');
    avatarOptions.forEach(avatar => {
        avatar.addEventListener('click', function() {
            avatarOptions.forEach(a => a.classList.remove('border-blue-500', 'border-2'));
            this.classList.add('border-blue-500', 'border-2');

            // Store selected avatar name directly from data-avatar attribute
            const selectedAvatar = this.dataset.avatar || 'Sarah';

            // Store selected avatar name
            localStorage.setItem('selectedAvatar', selectedAvatar);
        });
    });
}

// Initialize settings configuration
function initSettingsConfig() {
    const difficultySlider = document.getElementById('difficulty-slider');
    const durationSlider = document.getElementById('duration-slider');
    const feedbackToggle = document.getElementById('feedback-toggle');
    
    if (difficultySlider) {
        difficultySlider.addEventListener('input', function() {
            document.getElementById('difficulty-value').textContent = `${this.value}/10`;
        });
    }
    
    if (durationSlider) {
        durationSlider.addEventListener('input', function() {
            document.getElementById('duration-value').textContent = `${this.value} min`;
        });
    }
    
    if (feedbackToggle) {
        feedbackToggle.addEventListener('change', function() {
            console.log('Real-time feedback:', this.checked ? 'Enabled' : 'Disabled');
        });
    }
}

// Initialize file upload functionality
function initFileUpload() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    
    if (!dropZone || !fileInput) return;
    
    // Click to upload
    dropZone.addEventListener('click', () => fileInput.click());
    
    // Drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-blue-500', 'bg-blue-50');
    });
    
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-blue-500', 'bg-blue-50');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-blue-500', 'bg-blue-50');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
}

// Handle file upload
async function handleFileUpload(file) {
    if (!CONFIG.SUPPORTED_FILE_TYPES.includes(file.type)) {
        showNotification('Please upload a PDF or text file.', 'error');
        return;
    }
    
    try {
        // Show upload progress
        showUploadProgress();
        
        // Simulate file processing
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        hideUploadProgress();
        showNotification('File uploaded successfully! AI is analyzing the job description.');
        
        // Extract job requirements (simulated)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        displayExtractedRequirements();
        
    } catch (error) {
        showNotification('File upload failed. Please try again.', 'error');
        console.error('Upload error:', error);
    }
}

// Show upload progress
function showUploadProgress() {
    const progressElement = document.getElementById('upload-progress');
    if (progressElement) {
        progressElement.classList.remove('hidden');
        let progress = 0;
        const interval = setInterval(() => {
            progress += 20;
            progressElement.value = progress;
            if (progress >= 100) clearInterval(interval);
        }, 300);
    }
}

// Hide upload progress
function hideUploadProgress() {
    const progressElement = document.getElementById('upload-progress');
    if (progressElement) {
        progressElement.classList.add('hidden');
    }
}

// Display extracted requirements
function displayExtractedRequirements() {
    const requirementsElement = document.getElementById('extracted-requirements');
    if (requirementsElement) {
        requirementsElement.innerHTML = `
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 class="font-semibold text-green-800 mb-2">✓ Requirements Extracted</h4>
                <ul class="text-sm text-green-700 space-y-1">
                    <li>• Strong communication skills</li>
                    <li>• Experience with modern frameworks</li>
                    <li>• Problem-solving abilities</li>
                    <li>• Team collaboration experience</li>
                </ul>
            </div>
        `;
    }
}

// Initialize live interview functionality
async function initLiveInterview() {
    console.log('Initializing live interview...');

    // Enable voice features since user has navigated to interview page
    AppState.userInteracted = true;

    // Initialize 3D avatar
    init3DAvatar();

    // Initialize interview interface
    initInterviewInterface();

    // Initialize voice recording
    initVoiceRecording();

    // Initialize webcam
    initWebcam();

    // Initialize coaching panel
    initCoachingPanel();

    // Start interview session
    await startInterviewSession();
}

// Initialize 3D avatar using Three.js
function init3DAvatar() {
    if (typeof THREE === 'undefined') {
        console.warn('Three.js not loaded - skipping 3D avatar');
        return;
    }
    
    const avatarContainer = document.getElementById('avatar-container');
    if (!avatarContainer) return;
    
    try {
        // Create scene
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, avatarContainer.clientWidth / avatarContainer.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        
        renderer.setSize(avatarContainer.clientWidth, avatarContainer.clientHeight);
        renderer.setClearColor(0x000000, 0);
        avatarContainer.appendChild(renderer.domElement);
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 1, 1);
        scene.add(directionalLight);
        
        // Create avatar geometry
        const geometry = new THREE.BoxGeometry(1, 1.5, 0.5);
        const material = new THREE.MeshPhongMaterial({ color: 0x3b82f6 });
        const avatar = new THREE.Mesh(geometry, material);
        scene.add(avatar);
        
        // Position camera
        camera.position.z = 3;
        
        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            
            // Gentle rotation animation
            avatar.rotation.y += 0.01;
            
            renderer.render(scene, camera);
        }
        animate();
        
        // Store avatar instance
        AppState.avatarInstance = { scene, camera, renderer, avatar };
        
        // Handle window resize
        window.addEventListener('resize', () => {
            const width = avatarContainer.clientWidth;
            const height = avatarContainer.clientHeight;
            
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        });
        
        console.log('3D Avatar initialized successfully');
        
    } catch (error) {
        console.error('Error initializing 3D avatar:', error);
        // Fallback to static avatar
        avatarContainer.innerHTML = '<div class="w-full h-full flex items-center justify-center text-6xl"><svg class="w-16 h-16 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg></div>';
    }
}

// Initialize interview interface
function initInterviewInterface() {
    // Initialize chat display
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.innerHTML = '<div class="text-center text-slate-500 py-8">Interview starting soon...</div>';
    }
    
    // Initialize response input
    const responseInput = document.getElementById('response-input');
    if (responseInput) {
        responseInput.addEventListener('input', updateWordCount);
    }
    
    // Initialize buttons
    const voiceButton = document.getElementById('voice-button');
    if (voiceButton) {
        voiceButton.addEventListener('click', toggleVoiceRecording);
    }
    
    const sendButton = document.getElementById('send-button');
    if (sendButton) {
        sendButton.addEventListener('click', () => {
            const input = document.getElementById('response-input');
            if (input && input.value.trim()) {
                processResponse(input.value.trim());
                input.value = '';
                updateWordCount();
            }
        });
    }
    
    const doneButton = document.getElementById('done-button');
    if (doneButton) {
        doneButton.addEventListener('click', imDoneAnswering);
    }
    
    const nextButton = document.getElementById('next-button');
    if (nextButton) {
        nextButton.addEventListener('click', nextQuestion);
    }

    const clarificationButton = document.getElementById('clarification-button');
    if (clarificationButton) {
        clarificationButton.addEventListener('click', requestClarification);
    }
}

// Initialize voice recording
function initVoiceRecording() {
    if (!window.MediaRecorder) {
        console.warn('MediaRecorder not supported in this browser');
        showNotification('Audio recording not supported. Using text input mode.', 'warning');
        return;
    }
    
    // Initialize MediaRecorder properties
    AppState.mediaRecorder = null;
    AppState.audioStream = null;
    AppState.audioChunks = [];
    AppState.audioBlob = null;
    AppState.isRecording = false;
    
    // MediaRecorder options for better compatibility
    AppState.mediaRecorderOptions = {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' :
                  MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' :
                  'audio/webm'
    };
    
    console.log('Voice recording initialized with MediaRecorder');
}

// Initialize coaching panel functionality
function initCoachingPanel() {
    // Set initial state
    setCoachingState('listening');
    
    // Initialize delivery metrics display
    updateDeliveryMetrics();
    
    // Start avatar animations
    startAvatarAnimations();
}

// Start avatar animations
function startAvatarAnimations() {
    const avatar = document.getElementById('avatar-display');
    if (avatar) {
        // Gentle breathing animation
        avatar.style.animation = 'breathing 4s ease-in-out infinite';
    }
    
    // Add random micro-interactions
    setInterval(() => {
        if (Math.random() < 0.3) {
            const avatar = document.getElementById('avatar-display');
            if (avatar && !avatar.classList.contains('avatar-speaking')) {
                avatar.classList.add('avatar-nodding');
                setTimeout(() => avatar.classList.remove('avatar-nodding'), 1000);
            }
        }
    }, 5000);
}

// Set coaching panel state
function setCoachingState(state) {
    AppState.coachingState = state;
    
    const states = ['listening', 'speaking', 'finished'];
    states.forEach(s => {
        const element = document.getElementById(`${s}-state`);
        if (element) {
            element.classList.toggle('hidden', s !== state);
        }
    });
    
    // Update title
    const titleElement = document.getElementById('coaching-title');
    if (titleElement) {
        switch(state) {
            case 'listening':
                titleElement.textContent = 'Coaching Panel';
                break;
            case 'speaking':
                titleElement.textContent = 'Real-time Analysis';
                break;
            case 'finished':
                titleElement.textContent = 'Content Feedback';
                break;
        }
    }
}

// Start interview session
async function startInterviewSession() {
    console.log('Starting interview session...');

    // Initialize interview state
    AppState.currentInterview = {
        startTime: new Date(),
        questions: [],
        responses: [],
        scores: { ...AppState.interviewScores },
        currentQuestionIndex: 0,
        totalQuestions: 5
    };

    // Load interview questions
    await loadInterviewQuestions();

    // Speak introduction message
    const introductionMessage = "Welcome to your AI-powered interview practice session. I'll be asking you a series of questions to help you prepare. Let's begin with the first question.";
    await speakIntroduction(introductionMessage);

    // Ask first question after a brief pause
    setTimeout(async () => {
        await askNextQuestion();
    }, 2000);
}

// Speak introduction message
async function speakIntroduction(message) {
    return new Promise((resolve) => {
        speakText(message, null, () => {
            resolve();
        });
    });
}

// Load interview questions from JSON file
async function loadInterviewQuestions() {
    // Get selected role from sessionStorage
    const setupData = JSON.parse(sessionStorage.getItem('interviewSetup') || '{}');
    let selectedRole = setupData.selectedRole || 'softwareengineer';

    // Fetch questions from JSON file
    const response = await fetch('./questions.json');
    if (!response.ok) throw new Error('Failed to fetch questions');

    const data = await response.json();
    const roleQuestions = data[selectedRole] || data['softwareengineer'] || [];

    // Shuffle and return first 5 questions
    const shuffled = [...roleQuestions].sort(() => Math.random() - 0.5);
    AppState.currentInterview.questions = shuffled.slice(0, 5);

    console.log(`Loaded ${AppState.currentInterview.questions.length} questions`);
}

// Get fallback questions
function getFallbackQuestions() {
    return [
        {
            id: 1,
            text: "Tell me about yourself and your professional background.",
            type: "Introduction",
            category: "Personal"
        },
        {
            id: 2,
            text: "What interests you about this position and our company?",
            type: "Motivation",
            category: "Company Fit"
        },
        {
            id: 3,
            text: "Describe a challenging project you worked on. What was your role and what did you learn?",
            type: "Experience",
            category: "Behavioral"
        },
        {
            id: 4,
            text: "How do you handle tight deadlines and multiple priorities?",
            type: "Problem Solving",
            category: "Behavioral"
        },
        {
            id: 5,
            text: "Where do you see yourself in five years?",
            type: "Future Goals",
            category: "Career"
        }
    ];
}

// Ask next interview question
async function askNextQuestion() {
    if (!AppState.currentInterview) {
        console.error('No interview session active');
        return;
    }
    
    const currentIndex = AppState.currentInterview.currentQuestionIndex;
    const questions = AppState.currentInterview.questions;
    
    if (currentIndex >= questions.length) {
        endInterviewSession();
        return;
    }
    
    const question = questions[currentIndex];
    AppState.currentQuestion = question;
    
    // Display question
    displayQuestion(question);
    
    // Display question in speech bubble
    showQuestionInBubble(question.text);
    
    // Speak question if voice is enabled
    if (AppState.speechSynthesis) {
        speakText(question.text);
    }
    
    // Start active listening animation
    setTimeout(() => {
        startActiveListening();
    }, 2000);
    
    // Set coaching state to listening
    setCoachingState('listening');
    
    // Update structure helper
    updateStructureHelper(question.type);
    
    // Update question counter
    updateQuestionCounter(currentIndex + 1, questions.length);
    
    // Update interview state
    AppState.currentInterview.currentQuestionIndex++;
    
    console.log(`Question ${currentIndex + 1}/${questions.length}: ${question.type}`);
}

// Display question in interface
function displayQuestion(question) {
    const questionElement = document.getElementById('current-question');
    const questionTypeElement = document.getElementById('question-type');
    
    if (questionElement) {
        questionElement.textContent = question.text;
    }
    
    if (questionTypeElement) {
        questionTypeElement.textContent = question.type;
    }
    
    // Add question to chat
    addChatMessage('interviewer', question.text);
}

// Show question in speech bubble
function showQuestionInBubble(question) {
    const bubble = document.getElementById('interviewer-speech-bubble');
    const textElement = document.getElementById('current-question-text');
    
    if (bubble && textElement) {
        textElement.textContent = question;
        bubble.classList.remove('hidden');
        
        // Hide after 5 seconds
        setTimeout(() => {
            bubble.classList.add('hidden');
        }, 5000);
    }
}

// Add active listening animation to avatar
function startActiveListening() {
    const avatar = document.getElementById('avatar-display');
    if (avatar) {
        avatar.classList.add('avatar-nodding');
        setTimeout(() => {
            avatar.classList.remove('avatar-nodding');
        }, 2000);
    }
}

// Add thinking animation to avatar
function startThinkingAnimation() {
    const avatar = document.getElementById('avatar-display');
    if (avatar) {
        avatar.classList.add('avatar-thinking');
    }
}

// Stop thinking animation
function stopThinkingAnimation() {
    const avatar = document.getElementById('avatar-display');
    if (avatar) {
        avatar.classList.remove('avatar-thinking');
    }
}

// Add chat message
function addChatMessage(sender, message) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `mb-4 ${sender === 'user' ? 'text-right' : 'text-left'}`;
    
    const bubbleClass = sender === 'user' 
        ? 'bg-blue-500 text-white inline-block rounded-lg px-4 py-2 max-w-xs'
        : 'bg-slate-100 text-slate-800 inline-block rounded-lg px-4 py-2 max-w-xs';
    
    messageDiv.innerHTML = `
        <div class="${bubbleClass}">
            <div class="text-sm">${message}</div>
            <div class="text-xs opacity-70 mt-1">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Voice preference configuration
const VOICE_PREFERENCES = {
    'Alex': {
        gender: 'male',
        priority: ['Microsoft David Desktop', 'Microsoft Mark Desktop', 'Microsoft David - English (United States)', 'Microsoft Mark - English (United States)', 'Google US English Male', 'Google UK English Male', 'Microsoft David', 'Microsoft Mark', 'Mark', 'Paul', 'Michael', 'David', 'James', 'John', 'Robert', 'Alex', 'Daniel', 'Matthew', 'Anthony', 'Donald', 'Steven', 'Andrew', 'Joshua', 'Joseph', 'Thomas', 'Christopher', 'Charles', 'Daniel', 'Matthew', 'Anthony'],
        keywords: ['male', 'david', 'mark', 'paul', 'michael', 'guy', 'man', 'desktop', 'james', 'john', 'robert', 'alex', 'daniel', 'matthew', 'anthony', 'donald', 'steven', 'andrew', 'joshua', 'joseph', 'thomas', 'christopher', 'charles'],
        exclude: ['female', 'woman', 'girl', 'lady', 'zira', 'hazel', 'susan', 'samantha', 'victoria', 'karen', 'sara', 'lisa', 'nancy', 'betty', 'helen', 'sandra', 'donna', 'carol', 'ruth', 'sharon', 'michelle', 'laura', 'sarah', 'kimberly', 'deborah', 'dorothy', 'amy', 'angela', 'anna', 'brenda', 'emma', 'fiona', 'grace', 'hannah', 'isabella', 'jennifer', 'kate', 'linda', 'maria', 'natalie', 'olivia', 'penny', 'queen', 'rachel', 'sophia', 'taylor', 'ursula', 'vanessa', 'wendy', 'xanthe', 'yvonne', 'zoe']
    },
    'Michael': {
        gender: 'male',
        priority: ['Microsoft David Desktop', 'Microsoft Mark Desktop', 'Microsoft David - English (United States)', 'Microsoft Mark - English (United States)', 'Google US English Male', 'Google UK English Male', 'Microsoft David', 'Microsoft Mark', 'Mark', 'Paul', 'Michael', 'David', 'James', 'John', 'Robert', 'Alex', 'Daniel', 'Matthew', 'Anthony', 'Donald', 'Steven', 'Andrew', 'Joshua', 'Joseph', 'Thomas', 'Christopher', 'Charles', 'Daniel', 'Matthew', 'Anthony'],
        keywords: ['male', 'david', 'mark', 'paul', 'michael', 'guy', 'man', 'desktop', 'james', 'john', 'robert', 'alex', 'daniel', 'matthew', 'anthony', 'donald', 'steven', 'andrew', 'joshua', 'joseph', 'thomas', 'christopher', 'charles'],
        exclude: ['female', 'woman', 'girl', 'lady', 'zira', 'hazel', 'susan', 'samantha', 'victoria', 'karen', 'sara', 'lisa', 'nancy', 'betty', 'helen', 'sandra', 'donna', 'carol', 'ruth', 'sharon', 'michelle', 'laura', 'sarah', 'kimberly', 'deborah', 'dorothy', 'amy', 'angela', 'anna', 'brenda', 'emma', 'fiona', 'grace', 'hannah', 'isabella', 'jennifer', 'kate', 'linda', 'maria', 'natalie', 'olivia', 'penny', 'queen', 'rachel', 'sophia', 'taylor', 'ursula', 'vanessa', 'wendy', 'xanthe', 'yvonne', 'zoe']
    },
    'Sarah': {
        gender: 'female',
        priority: ['Microsoft Zira Desktop', 'Microsoft Hazel Desktop', 'Microsoft Zira - English (United States)', 'Microsoft Hazel - English (United States)', 'Google US English Female', 'Samantha', 'Susan', 'Hazel'],
        keywords: ['female', 'zira', 'hazel', 'samantha', 'susan', 'woman', 'girl', 'lady', 'desktop'],
        exclude: ['male', 'man', 'guy', 'david', 'mark']
    }
};

// Voice scoring function
function scoreVoice(voice, preferences) {
    let score = 0;

    // Language preference (English voices get higher score)
    if (voice.lang.startsWith('en')) {
        score += 100;
    } else if (voice.lang.includes('en')) {
        score += 50;
    }

    // Priority voice names get highest score
    const priorityIndex = preferences.priority.findIndex(name =>
        voice.name.toLowerCase().includes(name.toLowerCase())
    );
    if (priorityIndex !== -1) {
        score += 200 - (priorityIndex * 10); // Higher priority = higher score
    }

    // Keyword matching
    preferences.keywords.forEach(keyword => {
        if (voice.name.toLowerCase().includes(keyword.toLowerCase())) {
            score += 30;
        }
    });

    // Exclude unwanted voices
    preferences.exclude.forEach(excludeWord => {
        if (voice.name.toLowerCase().includes(excludeWord.toLowerCase())) {
            score -= 100; // Heavy penalty for excluded voices
        }
    });

    // Prefer voices with "Google" or "Natural" in name for quality
    if (voice.name.includes('Google') || voice.name.includes('Natural') || voice.name.includes('Enhanced')) {
        score += 50;
    }

    // Prefer voices that are not default system voices (usually lower quality)
    if (!voice.name.includes('System') && !voice.name.includes('Default')) {
        score += 20;
    }

    return score;
}

// Improved voice selection function
function selectBestVoice(voices, avatarId) {
    if (!voices || voices.length === 0) return null;

    // Get preferences for the selected avatar
    const preferences = VOICE_PREFERENCES[avatarId] || VOICE_PREFERENCES['Sarah'];

    // First, filter voices that match the gender keywords
    const genderFilteredVoices = voices.filter(voice => {
        const name = voice.name.toLowerCase();
        const hasKeyword = preferences.keywords.some(keyword => name.includes(keyword.toLowerCase()));
        const hasExclude = preferences.exclude.some(exclude => name.includes(exclude.toLowerCase()));
        return hasKeyword && !hasExclude;
    });

    // If we have gender-matched voices, use them; otherwise fall back to all voices
    const voicesToScore = genderFilteredVoices.length > 0 ? genderFilteredVoices : voices;

    // Score the voices
    let scoredVoices = voicesToScore.map(voice => ({
        voice,
        score: scoreVoice(voice, preferences)
    }));

    // Sort by score (highest first)
    scoredVoices.sort((a, b) => b.score - a.score);

    // For male avatars, prefer voices from their priority list
    if (avatarId === 'Alex' || avatarId === 'Michael') {
        const priorityVoices = scoredVoices.filter(scored =>
            VOICE_PREFERENCES[avatarId].priority.some(priority =>
                scored.voice.name.toLowerCase().includes(priority.toLowerCase())
            )
        );
        // If we have priority voices, use only those; otherwise keep all
        if (priorityVoices.length > 0) {
            scoredVoices = priorityVoices;
        }
    }

    // For female avatar, ensure we don't select male voices
    if (avatarId === 'Sarah') {
        scoredVoices = scoredVoices.filter(scored => {
            const name = scored.voice.name.toLowerCase();
            return !name.includes('david') && !name.includes('mark') && !name.includes('paul') && !name.includes('alex') && !name.includes('michael') && !name.includes('male') && !name.includes('man') && !name.includes('guy');
        });
    }

    // Log top 3 voices for debugging
    console.log(`Voice selection for ${avatarId}:`, scoredVoices.slice(0, 3).map(v => ({
        name: v.voice.name,
        lang: v.voice.lang,
        score: v.score
    })));

    // Return the highest scoring voice, or fallback
    if (scoredVoices.length > 0) {
        return scoredVoices[0].voice;
    } else {
        // Ultimate fallback
        return voices.find(v => v.lang.startsWith('en')) || voices[0];
    }
}

// Speak text using speech synthesis with queuing
function speakText(text, speechParams, callback) {
    console.log('speakText called with text:', text.substring(0, 50) + '...');

    if (!AppState.speechSynthesis) {
        console.warn('Speech synthesis not available');
        if (callback) callback();
        return;
    }

    console.log('Speech synthesis available, userInteracted:', AppState.userInteracted);

    // Check if user has interacted with the page
    if (!AppState.userInteracted) {
        console.warn('Speech synthesis blocked: User has not interacted with the page yet');
        showNotification('Click anywhere on the page to enable voice features', 'warning');
        if (callback) callback();
        return;
    }

    // If speech is paused, resume
    if (AppState.speechPaused && AppState.pausedSpeech) {
        AppState.speechSynthesis.resume();
        AppState.speechPaused = false;
        AppState.pausedSpeech = null;
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    // Wait for voices to load if not already loaded
    const selectVoice = () => {
        const voices = AppState.speechSynthesis.getVoices();
        if (voices.length > 0) {
            // Get selected avatar
            const selectedAvatar = localStorage.getItem('selectedAvatar') || 'Sarah';
            console.log(`Selecting voice for avatar: ${selectedAvatar}`);

            // Use improved voice selection
            const selectedVoice = selectBestVoice(voices, selectedAvatar);

            if (selectedVoice) {
                utterance.voice = selectedVoice;
                console.log(`Selected voice: ${selectedVoice.name} (${selectedVoice.lang}) for avatar: ${selectedAvatar}`);
            } else {
                // Ultimate fallback - prefer English voices
                utterance.voice = voices.find(v => v.lang.startsWith('en')) || voices[0];
                console.warn(`No suitable voice found for ${selectedAvatar}, using fallback: ${utterance.voice.name}`);
            }
        } else {
            console.warn('No voices available');
        }
    };

    // If voices are already loaded, select immediately
    if (AppState.voicesLoaded) {
        selectVoice();
    } else {
        // Wait for voices to load
        const checkVoices = () => {
            const voices = AppState.speechSynthesis.getVoices();
            if (voices.length > 0) {
                AppState.voicesLoaded = true;
                selectVoice();
            } else {
                // Retry after a short delay
                setTimeout(checkVoices, 100);
            }
        };
        checkVoices();
    }

    // Use speechParams if provided, otherwise use defaults
    const params = speechParams || {};
    utterance.rate = params.rate !== undefined ? params.rate : 0.8;
    utterance.pitch = params.pitch !== undefined ? params.pitch : 1;
    utterance.volume = params.volume !== undefined ? params.volume : 0.8;

    // Animate avatar while speaking
    utterance.onstart = () => {
        const avatar = document.getElementById('avatar-display');
        if (avatar) {
            avatar.classList.add('avatar-speaking');
        }
        AppState.isSpeaking = true;
    };

    utterance.onend = () => {
        const avatar = document.getElementById('avatar-display');
        if (avatar) {
            avatar.classList.remove('avatar-speaking');
        }
        AppState.isSpeaking = false;
        AppState.speechQueue.shift();

        // Process next in queue
        if (AppState.speechQueue.length > 0) {
            setTimeout(() => {
                AppState.speechSynthesis.speak(AppState.speechQueue[0]);
            }, 500);
        }

        if (callback) callback();
    };

    utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        AppState.isSpeaking = false;

        // Handle specific error cases
        if (event.error === 'not-allowed') {
            console.warn('Speech synthesis blocked by browser - user interaction required');
            showNotification('Voice features blocked. Please interact with the page first.', 'warning');
            AppState.userInteracted = false; // Reset to allow re-enabling
            initUserInteractionTracking(); // Re-initialize tracking
        } else {
            console.warn('Speech synthesis failed - continuing without voice');
            showNotification('Voice synthesis unavailable - continuing with text only', 'info');
        }

        // Process next in queue even on error
        AppState.speechQueue.shift();
        if (AppState.speechQueue.length > 0) {
            setTimeout(() => {
                AppState.speechSynthesis.speak(AppState.speechQueue[0]);
            }, 500);
        }

        if (callback) callback();
    };

    // Add to queue and speak
    AppState.speechQueue.push(utterance);
    if (AppState.speechQueue.length === 1 && !AppState.speechPaused) {
        AppState.speechSynthesis.speak(utterance);
    }
}

// Toggle voice recording with MediaRecorder and SpeechRecognition
async function toggleVoiceRecording() {
    if (!window.MediaRecorder) {
        showNotification('Audio recording not supported in this browser.', 'error');
        return;
    }
    
    if (AppState.isRecording) {
        stopRecording();
    } else {
        await startRecording();
    }
}

// Start recording
async function startRecording() {
    try {
        // Request microphone permission
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
            }
        });
        
        AppState.audioStream = stream;
        AppState.audioChunks = [];
        AppState.recordingStartTime = Date.now();
        
        // Initialize MediaRecorder
        AppState.mediaRecorder = new MediaRecorder(stream, AppState.mediaRecorderOptions);
        
        // Set up data handler
        AppState.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                AppState.audioChunks.push(event.data);
            }
        };
        
        // Set up stop handler
        AppState.mediaRecorder.onstop = handleRecordingStop;
        
        // Start recording
        AppState.mediaRecorder.start();
        AppState.isRecording = true;
        
        // Initialize speech recognition if available
        initSpeechRecognition();
        
        // Update UI
        updateVoiceButtonState();
        setCoachingState('speaking');
        showNotification('Recording started... Speak now!', 'info');
        
        // Auto-stop after max time
        setTimeout(() => {
            if (AppState.isRecording) {
                stopRecording();
            }
        }, CONFIG.MAX_RECORDING_TIME);
        
    } catch (error) {
        console.error('Error starting recording:', error);
        showNotification('Could not access microphone. Please check permissions.', 'error');
    }
}

// Initialize speech recognition
function initSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        console.warn('Speech recognition not supported');
        return;
    }
    
    AppState.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    AppState.recognition.continuous = true;
    AppState.recognition.interimResults = true;
    AppState.recognition.lang = 'en-US';
    
    AppState.recognition.onresult = (event) => {
        let interimTranscript = '';
        let newFinalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                newFinalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }
        
        // Update transcripts
        if (newFinalTranscript) {
            AppState.finalTranscript += newFinalTranscript;
            AppState.currentResponseTranscript = AppState.finalTranscript.trim();
        }
        
        // Update input field
        const inputElement = document.getElementById('response-input');
        if (inputElement) {
            inputElement.value = AppState.finalTranscript + (interimTranscript ? ' ' + interimTranscript : '');
            updateWordCount();
        }
        
        // Update live transcript display
        updateLiveTranscriptDisplay(AppState.finalTranscript, interimTranscript);
        
        // Update real-time analysis
        const combinedTranscript = AppState.finalTranscript + (interimTranscript ? ' ' + interimTranscript : '');
        if (combinedTranscript.trim()) {
            updateRealTimeAnalysis(combinedTranscript.trim());
            updateAvatarBehavior(combinedTranscript.trim());
        }
    };
    
    AppState.recognition.onend = () => {
        if (AppState.isRecording) {
            // Restart recognition to handle pauses
            setTimeout(() => {
                try {
                    AppState.recognition.start();
                } catch (e) {
                    console.warn('Speech recognition restart failed:', e);
                }
            }, 100);
        }
    };
    
    AppState.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
    };
    
    // Start recognition
    try {
        AppState.recognition.start();
    } catch (error) {
        console.warn('Speech recognition start failed:', error);
    }
}

// Stop recording
function stopRecording() {
    if (AppState.mediaRecorder && AppState.mediaRecorder.state === 'recording') {
        AppState.mediaRecorder.stop();
    }
    
    if (AppState.recognition) {
        AppState.recognition.stop();
    }
    
    if (AppState.audioStream) {
        AppState.audioStream.getTracks().forEach(track => track.stop());
    }
    
    AppState.isRecording = false;
    updateVoiceButtonState();
    
    // Set coaching state to finished
    setCoachingState('finished');
    
    // Show done and next buttons
    const doneButton = document.getElementById('done-button');
    const nextButton = document.getElementById('next-button');
    if (doneButton) doneButton.style.display = 'inline-block';
    if (nextButton) nextButton.style.display = 'inline-block';
    
    showNotification('Recording stopped. Analyzing your response...', 'info');
}

// Handle recording stop
async function handleRecordingStop() {
    try {
        // Create audio blob
        if (AppState.audioChunks.length > 0) {
            AppState.audioBlob = new Blob(AppState.audioChunks, { 
                type: AppState.mediaRecorderOptions.mimeType 
            });
        }
        
        // Clean transcript with AI
        AppState.finalTranscript = await cleanTranscriptWithAI(AppState.finalTranscript);
        
        // Update input with cleaned transcript
        const inputElement = document.getElementById('response-input');
        if (inputElement && AppState.finalTranscript) {
            inputElement.value = AppState.finalTranscript;
            updateWordCount();
        }
        
        // Analyze audio
        const audioMetrics = AppState.audioBlob ? await analyzeAudioTone(AppState.audioBlob) : {
            pitch: 0,
            volume: 0,
            duration: 0,
            speakingRate: 0,
            feedback: 'No audio recorded'
        };
        
        // Get AI-powered analysis
        const aiAnalysis = await getToneAnalysisFromAI(AppState.finalTranscript, audioMetrics);
        
        // Show feedback
        const feedbackElement = document.getElementById('content-feedback');
        if (feedbackElement) {
            feedbackElement.innerHTML = `
                <div class="space-y-2">
                    <div class="text-sm font-medium text-blue-600">💡 AI Analysis:</div>
                    <div class="text-sm text-slate-700">${aiAnalysis.feedback}</div>
                    <div class="text-xs text-slate-500">
                        Volume: ${audioMetrics.volume}% • 
                        Pitch: ${audioMetrics.pitch}Hz • 
                        Duration: ${audioMetrics.duration}s
                    </div>
                </div>
            `;
        }
        
        // Update transcript display
        const transcriptElement = document.getElementById('transcript');
        if (transcriptElement) {
            transcriptElement.innerHTML = `
                <div class="mb-3">
                    <div class="text-green-600 font-medium text-sm mb-1">📝 Your Response:</div>
                    <div class="text-slate-700 text-sm bg-slate-50 p-2 rounded">${AppState.finalTranscript || 'No speech detected'}</div>
                </div>
                <div class="text-xs text-slate-500">✓ Response recorded and analyzed</div>
            `;
        }
        
        // Process response if not already processing
        if (AppState.finalTranscript && !AppState.isProcessingResponse) {
            AppState.isProcessingResponse = true;
            await processResponse(AppState.finalTranscript);
        }
        
    } catch (error) {
        console.error('Error handling recording stop:', error);
        showNotification('Error analyzing recording. Please try again.', 'error');
    } finally {
        // Reset transcripts for next response
        AppState.finalTranscript = '';
        AppState.currentResponseTranscript = '';
        AppState.isProcessingResponse = false;
    }
}

// Update voice button state
function updateVoiceButtonState() {
    const voiceButton = document.getElementById('voice-button');
    if (voiceButton) {
        if (AppState.isRecording) {
            voiceButton.innerHTML = '<span class="mr-2">⏹️</span> Stop Recording';
            voiceButton.classList.remove('bg-blue-500', 'hover:bg-blue-600');
            voiceButton.classList.add('bg-red-500', 'hover:bg-red-600', 'animate-pulse');
        } else {
            voiceButton.innerHTML = '<span class="mr-2">🎤</span> Start Recording';
            voiceButton.classList.remove('bg-red-500', 'hover:bg-red-600', 'animate-pulse');
            voiceButton.classList.add('bg-blue-500', 'hover:bg-blue-600');
        }
    }
}

// Update word count
function updateWordCount() {
    const inputElement = document.getElementById('response-input');
    const wordCountElement = document.getElementById('word-count');
    
    if (inputElement && wordCountElement) {
        const text = inputElement.value.trim();
        const words = text ? text.split(/\s+/).length : 0;
        wordCountElement.textContent = `${words} words`;
        
        // Color code based on length
        if (words < 30) {
            wordCountElement.className = 'text-xs text-amber-600';
        } else if (words <= 150) {
            wordCountElement.className = 'text-xs text-green-600';
        } else {
            wordCountElement.className = 'text-xs text-red-600';
        }
    }
}

// Analyze recorded audio for tone
async function analyzeAudioTone(audioBlob) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        
        // Get frequency data
        source.start();
        await new Promise(resolve => setTimeout(resolve, 100));
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        const channelData = audioBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
            sum += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sum / channelData.length);
        const volume = Math.min(100, Math.round(rms * 200));
        
        // Estimate pitch
        let maxIndex = 0;
        let maxValue = 0;
        for (let i = 0; i < bufferLength; i++) {
            if (dataArray[i] > maxValue) {
                maxValue = dataArray[i];
                maxIndex = i;
            }
        }
        const nyquist = audioContext.sampleRate / 2;
        const pitch = Math.round((maxIndex / bufferLength) * nyquist);
        
        const duration = Math.round(audioBuffer.duration);
        
        // Estimate speaking rate
        let speakingRate = 0;
        if (AppState.finalTranscript) {
            const words = AppState.finalTranscript.trim().split(/\s+/).length;
            speakingRate = Math.round((words / duration) * 60);
        }
        
        // Generate feedback
        let feedback = [];
        if (volume > 50) {
            feedback.push('Good volume level.');
        } else if (volume < 20) {
            feedback.push('Try speaking louder.');
        }
        
        if (speakingRate > 180) {
            feedback.push('Speaking a bit fast.');
        } else if (speakingRate < 100) {
            feedback.push('Consider speaking faster.');
        }
        
        audioContext.close();
        
        return {
            pitch,
            volume,
            duration,
            speakingRate,
            feedback: feedback.length > 0 ? feedback.join(' ') : 'Good delivery!'
        };
        
    } catch (error) {
        console.error('Error analyzing audio:', error);
        return {
            pitch: 0,
            volume: 0,
            duration: 0,
            speakingRate: 0,
            feedback: 'Unable to analyze audio'
        };
    }
}

// Update real-time analysis during speech
function updateRealTimeAnalysis(transcript) {
    if (!transcript || !AppState.recordingStartTime) return;
    
    // Calculate words per minute
    const words = transcript.split(/\s+/).length;
    const timeElapsed = (Date.now() - AppState.recordingStartTime) / 60000;
    AppState.deliveryMetrics.pace = Math.round(words / Math.max(timeElapsed, 0.01));
    
    // Count filler words
    AppState.deliveryMetrics.fillers = CONFIG.FILLER_WORDS.reduce((count, filler) => {
        const regex = new RegExp(`\\b${filler}\\b`, 'gi');
        const matches = transcript.match(regex);
        return count + (matches ? matches.length : 0);
    }, 0);
    
    // Calculate clarity (simple heuristic)
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = sentences.length > 0 ? words / sentences.length : 0;
    AppState.deliveryMetrics.clarity = Math.min(100, Math.max(0, 
        100 - Math.abs(avgWordsPerSentence - 15) * 2
    ));
    
    // Update display
    updateDeliveryMetrics();
    
    // Update confidence
    updateConfidenceScore();
}

// Update delivery metrics display
function updateDeliveryMetrics() {
    const metrics = {
        'pace-metric': AppState.deliveryMetrics.pace,
        'filler-metric': AppState.deliveryMetrics.fillers,
        'clarity-metric': AppState.deliveryMetrics.clarity,
        'energy-metric': AppState.deliveryMetrics.energy
    };
    
    Object.entries(metrics).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
            
            // Color coding
            if (id === 'pace-metric') {
                element.className = value >= 120 && value <= 160 ? 
                    'text-green-600 font-bold' : 'text-amber-600';
            } else if (id === 'filler-metric') {
                element.className = value <= 3 ? 
                    'text-green-600 font-bold' : 
                    value <= 7 ? 'text-amber-600' : 'text-red-600';
            }
        }
    });
    
    // Check for interventions
    checkInterventionAlerts();
}

// Update confidence score
function updateConfidenceScore() {
    let confidenceScore = 50;
    
    // Pace factor
    if (AppState.deliveryMetrics.pace >= 120 && AppState.deliveryMetrics.pace <= 160) {
        confidenceScore += 20;
    } else if (AppState.deliveryMetrics.pace >= 100 && AppState.deliveryMetrics.pace <= 180) {
        confidenceScore += 10;
    }
    
    // Filler words factor
    if (AppState.deliveryMetrics.fillers === 0) {
        confidenceScore += 15;
    } else if (AppState.deliveryMetrics.fillers <= 2) {
        confidenceScore += 10;
    } else if (AppState.deliveryMetrics.fillers <= 5) {
        confidenceScore += 5;
    } else {
        confidenceScore -= 10;
    }
    
    // Clarity factor
    if (AppState.deliveryMetrics.clarity >= 80) {
        confidenceScore += 15;
    } else if (AppState.deliveryMetrics.clarity >= 60) {
        confidenceScore += 10;
    }
    
    // Ensure bounds
    confidenceScore = Math.max(0, Math.min(100, confidenceScore));
    
    // Update UI elements
    const confidenceIcon = document.getElementById('confidence-icon');
    const confidenceRing = document.getElementById('confidence-score');
    const confidenceText = document.getElementById('confidence-text');
    
    if (confidenceIcon) {
        if (confidenceScore >= 80) {
            confidenceIcon.textContent = '😊';
        } else if (confidenceScore >= 60) {
            confidenceIcon.textContent = '😐';
        } else {
            confidenceIcon.textContent = '😟';
        }
    }
    
    if (confidenceRing) {
        confidenceRing.setAttribute('stroke-dasharray', `${confidenceScore}, 100`);
    }
    
    if (confidenceText) {
        confidenceText.textContent = Math.round(confidenceScore);
    }
}

// Check for real-time intervention alerts
function checkInterventionAlerts() {
    const alertsContainer = document.getElementById('intervention-alerts');
    if (!alertsContainer) return;
    
    alertsContainer.innerHTML = '';
    let hasAlerts = false;
    
    // Pace alerts
    if (AppState.deliveryMetrics.pace > 180) {
        addInterventionAlert('Speaking too fast! Try 140-160 WPM.', 'warning');
        hasAlerts = true;
    } else if (AppState.deliveryMetrics.pace < 60) {
        addInterventionAlert('Speaking too slowly. Aim for 140-160 WPM.', 'info');
        hasAlerts = true;
    }
    
    // Filler word alerts
    if (AppState.deliveryMetrics.fillers > 10) {
        addInterventionAlert('Too many filler words. Try pausing instead.', 'error');
        hasAlerts = true;
    } else if (AppState.deliveryMetrics.fillers > 5) {
        addInterventionAlert('Consider reducing filler words.', 'warning');
        hasAlerts = true;
    }
    
    // Show/hide container
    if (hasAlerts) {
        alertsContainer.classList.remove('hidden');
    } else {
        alertsContainer.classList.add('hidden');
    }
}

// Add intervention alert
function addInterventionAlert(message, type) {
    const alertsContainer = document.getElementById('intervention-alerts');
    if (!alertsContainer) return;
    
    const alertEl = document.createElement('div');
    alertEl.className = `text-xs p-2 rounded-lg mb-2 ${
        type === 'error' ? 'bg-red-100 text-red-800' :
        type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
        'bg-blue-100 text-blue-800'
    }`;
    alertEl.textContent = message;
    alertsContainer.appendChild(alertEl);
}

// Update avatar behavior based on speech
function updateAvatarBehavior(transcript) {
    const avatar = document.getElementById('avatar-display');
    if (!avatar || !transcript) return;
    
    // Detect complete sentences
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const isCompleteSentence = sentences.length > 0 && 
        sentences[sentences.length - 1].trim().length > 10;
    
    // Nod for complete sentences
    if (isCompleteSentence && Math.random() < 0.3) {
        avatar.classList.add('avatar-nodding');
        setTimeout(() => avatar.classList.remove('avatar-nodding'), 1000);
    }
}

// Update structure helper
function updateStructureHelper(questionType) {
    const structureHelper = document.getElementById('structure-helper');
    if (!structureHelper) return;
    
    const helpers = {
        'Introduction': {
            title: 'Introduction Structure:',
            content: 'Background → Current Role → Why This Position'
        },
        'Motivation': {
            title: 'Motivation Structure:',
            content: 'Company Research → Role Appeal → Career Goals'
        },
        'Experience': {
            title: 'Experience Structure:',
            content: 'Situation → Task → Action → Result (STAR Method)'
        },
        'Problem Solving': {
            title: 'Problem Solving Structure:',
            content: 'Understand → Analyze → Solve → Learn'
        },
        'Future Goals': {
            title: 'Future Goals Structure:',
            content: 'Short-term → Long-term → Company Contribution'
        },
        'behavioral': {
            title: 'STAR Method:',
            content: 'Situation → Task → Action → Result'
        },
        'technical': {
            title: 'Technical Answer Structure:',
            content: 'Explain → Demonstrate → Apply'
        }
    };
    
    const helper = helpers[questionType] || helpers['behavioral'];
    structureHelper.innerHTML = `
        <div class="font-medium mb-1">${helper.title}</div>
        <div class="text-sm">${helper.content}</div>
    `;
}

// Update question counter
function updateQuestionCounter(current, total) {
    const counterEl = document.getElementById('question-counter');
    if (counterEl) {
        counterEl.textContent = `Question ${current}/${total}`;
    }
}

// Update live transcript display
function updateLiveTranscriptDisplay(finalTranscript, interimTranscript) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    // Find or create transcript element
    let transcriptDiv = document.getElementById('live-transcript');
    if (!transcriptDiv) {
        transcriptDiv = document.createElement('div');
        transcriptDiv.id = 'live-transcript';
        transcriptDiv.className = 'mb-4 text-left';
        chatMessages.appendChild(transcriptDiv);
    }
    
    const displayText = finalTranscript + (interimTranscript ? ' <span class="text-slate-400">' + interimTranscript + '...</span>' : '');
    transcriptDiv.innerHTML = `
        <div class="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 max-w-xs inline-block">
            <div class="text-xs text-blue-600 mb-1">You (live):</div>
            <div class="text-sm text-blue-800">${displayText}</div>
        </div>
    `;
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Process user response
async function processResponse(response) {
    if (!response.trim()) {
        showNotification('Please provide a response.', 'warning');
        return;
    }
    
    try {
        // Add user message to chat
        addChatMessage('user', response);
        
        // Provide feedback
        await provideFeedback(response);
        
        // Get AI interviewer response
        const questionContext = AppState.currentQuestion ? AppState.currentQuestion.text : 'Initial response';
        const aiResponse = await getAIResponse(response, questionContext);
        
        // Add AI response to chat
        addChatMessage('interviewer', aiResponse);
        
        // Speak AI response
        speakText(aiResponse, () => {
            // After AI finishes speaking, automatically advance to next question
            setTimeout(() => {
                if (AppState.currentInterview && 
                    AppState.currentInterview.currentQuestionIndex < AppState.currentInterview.questions.length) {
                    askNextQuestion();
                }
            }, 1000);
        });
        
    } catch (error) {
        console.error('Error processing response:', error);
        showNotification('Error processing response. Please try again.', 'error');
        
        // Fallback: just advance to next question
        setTimeout(() => {
            if (AppState.currentInterview && 
                AppState.currentInterview.currentQuestionIndex < AppState.currentInterview.questions.length) {
                askNextQuestion();
            }
        }, 2000);
    }
}

// Provide AI feedback
async function provideFeedback(response) {
    try {
        const apiKey = await getApiKey();
        if (!apiKey) {
            // Fallback feedback
            updateScores({ communication: 75, content: 80, confidence: 70 });
            showNotification('Good response! Keep practicing.', 'info');
            return;
        }
        
        const prompt = `Analyze this interview response and provide scores (0-100) and feedback:
        
Response: "${response}"

Output format:
Communication: [score]
Content: [score]
Confidence: [score]
Feedback: [1-2 sentences]`;
        
        const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.API_MODEL}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });
        
        if (!apiResponse.ok) throw new Error('API request failed');
        
        const data = await apiResponse.json();
        const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Parse scores
        const commMatch = analysis.match(/Communication:\s*(\d+)/);
        const contentMatch = analysis.match(/Content:\s*(\d+)/);
        const confMatch = analysis.match(/Confidence:\s*(\d+)/);
        const feedbackMatch = analysis.match(/Feedback:\s*(.+)/);
        
        const communication = commMatch ? parseInt(commMatch[1]) : 75;
        const content = contentMatch ? parseInt(contentMatch[1]) : 80;
        const confidence = confMatch ? parseInt(confMatch[1]) : 70;
        const feedback = feedbackMatch ? feedbackMatch[1].trim() : 'Good response!';
        
        // Update scores
        updateScores({ communication, content, confidence });
        
        // Show feedback
        const feedbackElement = document.getElementById('feedback-message');
        if (feedbackElement) {
            feedbackElement.textContent = `💡 ${feedback}`;
        }
        
        showNotification('Feedback updated!', 'success');
        
    } catch (error) {
        console.error('Feedback analysis error:', error);
        // Fallback
        updateScores({ communication: 75, content: 80, confidence: 70 });
        showNotification('Good response!', 'info');
    }
}

// Update scores
function updateScores(scores) {
    if (!AppState.currentInterview) return;
    
    // Weighted average with existing scores
    const weight = 0.7; // 70% weight to new score
    AppState.currentInterview.scores.communication = 
        Math.round(weight * scores.communication + (1 - weight) * AppState.currentInterview.scores.communication);
    AppState.currentInterview.scores.content = 
        Math.round(weight * scores.content + (1 - weight) * AppState.currentInterview.scores.content);
    AppState.currentInterview.scores.confidence = 
        Math.round(weight * scores.confidence + (1 - weight) * AppState.currentInterview.scores.confidence);
    
    // Update UI
    updateScoreUI('communication', AppState.currentInterview.scores.communication);
    updateScoreUI('content', AppState.currentInterview.scores.content);
    updateScoreUI('confidence', AppState.currentInterview.scores.confidence);
}

// Update score UI
function updateScoreUI(skill, score) {
    const textElement = document.getElementById(`${skill}-text`);
    const ringElement = document.getElementById(`${skill}-score`);
    
    if (textElement) {
        textElement.textContent = Math.round(score);
        // Color coding
        if (score >= 80) {
            textElement.className = 'text-green-600 font-bold';
        } else if (score >= 60) {
            textElement.className = 'text-amber-600';
        } else {
            textElement.className = 'text-red-600';
        }
    }
    
    if (ringElement) {
        ringElement.setAttribute('stroke-dasharray', `${Math.round(score)}, 100`);
    }
}

// Handle "I'm Done Answering"
function imDoneAnswering() {
    const input = document.getElementById('response-input');
    const response = input ? input.value.trim() : '';
    
    if (response) {
        // Hide buttons
        const doneButton = document.getElementById('done-button');
        const nextButton = document.getElementById('next-button');
        if (doneButton) doneButton.style.display = 'none';
        if (nextButton) nextButton.style.display = 'none';
        
        // Process response
        processResponse(response);
        if (input) input.value = '';
        updateWordCount();
        
    } else {
        showNotification('Please provide a response before continuing.', 'warning');
    }
}

// Handle "Next Question"
function nextQuestion() {
    // Hide buttons
    const doneButton = document.getElementById('done-button');
    const nextButton = document.getElementById('next-button');
    if (doneButton) doneButton.style.display = 'none';
    if (nextButton) nextButton.style.display = 'none';

    // Move to next question
    askNextQuestion();
}

// Handle "Request Clarification"
function requestClarification() {
    if (!AppState.currentQuestion) {
        showNotification('No active question to clarify.', 'warning');
        return;
    }

    // Show thinking animation
    startThinkingAnimation();

    // Disable clarification button temporarily
    const clarificationButton = document.getElementById('clarification-button');
    if (clarificationButton) {
        clarificationButton.disabled = true;
        clarificationButton.textContent = 'Getting clarification...';
    }

    // Get clarification from AI
    getClarificationFromAI(AppState.currentQuestion.text)
        .then(clarification => {
            // Stop thinking animation
            stopThinkingAnimation();

            // Add clarification to chat
            addChatMessage('interviewer', clarification);

            // Speak clarification
            speakText(clarification, () => {
                // Re-enable button after speaking
                if (clarificationButton) {
                    clarificationButton.disabled = false;
                    clarificationButton.textContent = 'Request Clarification';
                }
            });

            showNotification('Clarification provided!', 'success');
        })
        .catch(error => {
            console.error('Error getting clarification:', error);
            stopThinkingAnimation();

            // Re-enable button
            if (clarificationButton) {
                clarificationButton.disabled = false;
                clarificationButton.textContent = 'Request Clarification';
            }

            showNotification('Unable to get clarification. Please try again.', 'error');
        });
}

// End interview session
function endInterviewSession() {
    console.log('Interview session ended');
    
    // Calculate final scores
    if (AppState.currentInterview) {
        const scores = AppState.currentInterview.scores;
        const overallScore = Math.round(
            (scores.communication + scores.content + scores.confidence) / 3
        );
        
        // Store results
        const results = {
            scores,
            overallScore,
            responses: AppState.currentInterview.responses,
            questions: AppState.currentInterview.questions,
            timestamp: new Date().toISOString()
        };
        
        sessionStorage.setItem('interviewResults', JSON.stringify(results));
        
        // Redirect to results page
        setTimeout(() => {
            window.location.href = 'results.html';
        }, 2000);
    }
    
    showNotification('Interview completed! Redirecting to results...', 'success');
}

// Initialize results page
function initResultsPage() {
    // Initialize results charts
    initResultsCharts();
    
    // Initialize feedback system
    initFeedbackSystem();
    
    // Initialize download functionality
    initDownloadFunctionality();
}

// Initialize results charts
function initResultsCharts() {
    if (typeof echarts === 'undefined') {
        console.warn('ECharts not loaded for results');
        return;
    }
    
    // Load results from sessionStorage
    const results = JSON.parse(sessionStorage.getItem('interviewResults') || '{}');
    const scores = results.scores || { communication: 75, content: 80, confidence: 70 };
    const overallScore = Math.round((scores.communication + scores.content + scores.confidence) / 3);
    
    // Update overall score display
    const overallScoreEl = document.getElementById('overall-score');
    if (overallScoreEl) {
        overallScoreEl.textContent = overallScore;
    }
    
    // Initialize radar chart
    const radarChartEl = document.getElementById('skill-radar-chart');
    if (radarChartEl) {
        const chart = echarts.init(radarChartEl);
        
        const option = {
            title: {
                text: 'Skill Assessment',
                textStyle: {
                    color: '#1e293b',
                    fontSize: 16,
                    fontWeight: 'bold'
                }
            },
            radar: {
                indicator: [
                    { name: 'Communication', max: 100 },
                    { name: 'Technical', max: 100 },
                    { name: 'Problem Solving', max: 100 },
                    { name: 'Confidence', max: 100 },
                    { name: 'Adaptability', max: 100 }
                ],
                radius: '70%'
            },
            series: [{
                name: 'Skills',
                type: 'radar',
                data: [{
                    value: [
                        scores.communication,
                        scores.content,
                        Math.round((scores.content + scores.confidence) / 2),
                        scores.confidence,
                        Math.round((scores.communication + scores.confidence) / 2)
                    ],
                    name: 'Your Performance',
                    itemStyle: {
                        color: '#3b82f6'
                    },
                    areaStyle: {
                        color: 'rgba(59, 130, 246, 0.2)'
                    }
                }]
            }]
        };
        
        chart.setOption(option);
        
        window.addEventListener('resize', () => {
            chart.resize();
        });
    }
    
    // Initialize breakdown chart
    const breakdownChartEl = document.getElementById('score-breakdown-chart');
    if (breakdownChartEl) {
        const chart = echarts.init(breakdownChartEl);
        
        const option = {
            title: {
                text: 'Score Breakdown',
                textStyle: {
                    color: '#1e293b',
                    fontSize: 16,
                    fontWeight: 'bold'
                }
            },
            tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b}: {c} ({d}%)'
            },
            series: [{
                name: 'Score Components',
                type: 'pie',
                radius: '70%',
                data: [
                    { value: scores.communication, name: 'Communication' },
                    { value: scores.content, name: 'Content' },
                    { value: scores.confidence, name: 'Confidence' }
                ],
                itemStyle: {
                    color: function(params) {
                        const colors = ['#3b82f6', '#8b5cf6', '#10b981'];
                        return colors[params.dataIndex] || '#64748b';
                    }
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }]
        };
        
        chart.setOption(option);
        
        window.addEventListener('resize', () => {
            chart.resize();
        });
    }
}

// Initialize feedback system
function initFeedbackSystem() {
    const results = JSON.parse(sessionStorage.getItem('interviewResults') || '{}');
    const scores = results.scores || { communication: 75, content: 80, confidence: 70 };
    
    // Generate feedback summary
    const summaryEl = document.getElementById('results-summary');
    if (summaryEl) {
        const strengths = [];
        const improvements = [];
        
        if (scores.communication >= 80) strengths.push('communication skills');
        else if (scores.communication <= 60) improvements.push('communication clarity');
        
        if (scores.content >= 80) strengths.push('technical knowledge');
        else if (scores.content <= 60) improvements.push('content depth');
        
        if (scores.confidence >= 80) strengths.push('confidence');
        else if (scores.confidence <= 60) improvements.push('confidence building');
        
        let summary = 'Interview completed! ';
        if (strengths.length > 0) {
            summary += `Your strengths: ${strengths.join(', ')}. `;
        }
        if (improvements.length > 0) {
            summary += `Areas to improve: ${improvements.join(', ')}.`;
        }
        
        summaryEl.textContent = summary;
    }
}

// Initialize download functionality
function initDownloadFunctionality() {
    const downloadBtn = document.getElementById('download-report');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            const results = JSON.parse(sessionStorage.getItem('interviewResults') || '{}');
            const dataStr = JSON.stringify(results, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `interview-results-${new Date().toISOString().split('T')[0]}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            showNotification('Report downloaded!', 'success');
        });
    }
}

// Initialize profile page
function initProfilePage() {
    // Load user data
    const userData = JSON.parse(localStorage.getItem('userProfile') || '{}');
    
    // Populate form
    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const bioInput = document.getElementById('profile-bio');
    
    if (nameInput) nameInput.value = userData.name || '';
    if (emailInput) emailInput.value = userData.email || '';
    if (bioInput) bioInput.value = userData.bio || '';
    
    // Initialize save button
    const saveBtn = document.getElementById('save-profile');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveProfile);
    }
    
    // Initialize achievements display
    initAchievementDisplay();
}

// Save profile
function saveProfile() {
    const name = document.getElementById('profile-name').value;
    const email = document.getElementById('profile-email').value;
    const bio = document.getElementById('profile-bio').value;
    
    const userData = {
        name,
        email,
        bio,
        updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('userProfile', JSON.stringify(userData));
    showNotification('Profile saved successfully!', 'success');
}

// Initialize achievement display
function initAchievementDisplay() {
    const achievements = [
        { id: 1, title: 'First Interview', unlocked: true, date: '1 week ago' },
        { id: 2, title: 'Communication Master', unlocked: true, date: '3 days ago' },
        { id: 3, title: 'Perfect Score', unlocked: false },
        { id: 4, title: 'Interview Pro', unlocked: false },
        { id: 5, title: 'Consistent Learner', unlocked: true, date: 'Yesterday' }
    ];
    
    const container = document.getElementById('achievements-container');
    if (!container) return;
    
    container.innerHTML = achievements.map(achievement => `
        <div class="bg-white rounded-lg p-4 border ${achievement.unlocked ? 'border-green-200' : 'border-slate-200'}">
            <div class="flex items-center">
                <div class="w-10 h-10 ${achievement.unlocked ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'} rounded-full flex items-center justify-center mr-3">
                    ${achievement.unlocked ? '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>' : '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path></svg>'}
                </div>
                <div>
                    <h4 class="font-semibold ${achievement.unlocked ? 'text-slate-800' : 'text-slate-400'}">${achievement.title}</h4>
                    <p class="text-sm ${achievement.unlocked ? 'text-green-600' : 'text-slate-400'}">
                        ${achievement.unlocked ? `Unlocked ${achievement.date}` : 'Locked'}
                    </p>
                </div>
            </div>
        </div>
    `).join('');
}

// Initialize login page
function initLoginPage() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // Simple validation
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    // Mock login - in real app, this would call an API
    localStorage.setItem('userToken', 'mock-token');
    localStorage.setItem('userEmail', email);
    
    showNotification('Login successful! Redirecting...', 'success');
    
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1500);
}

// Handle registration
function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    // Mock registration
    const userData = {
        name,
        email,
        createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('userProfile', JSON.stringify(userData));
    localStorage.setItem('userToken', 'mock-token');
    localStorage.setItem('userEmail', email);
    
    showNotification('Registration successful! Redirecting...', 'success');
    
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1500);
}

// Initialize navigation
function initNavigation() {
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
            mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (event) => {
        if (mobileMenu && !mobileMenu.contains(event.target) && 
            mobileMenuButton && !mobileMenuButton.contains(event.target) &&
            !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
            mobileMenuButton.setAttribute('aria-expanded', 'false');
        }
    });
    
    // User menu toggle
    const userMenuButton = document.getElementById('user-menu-button');
    const userMenu = document.getElementById('user-menu');
    
    if (userMenuButton && userMenu) {
        userMenuButton.addEventListener('click', () => {
            userMenu.classList.toggle('hidden');
        });
        
        // Close when clicking outside
        document.addEventListener('click', (event) => {
            if (!userMenu.contains(event.target) && 
                !userMenuButton.contains(event.target) &&
                !userMenu.classList.contains('hidden')) {
                userMenu.classList.add('hidden');
            }
        });
    }
    
    // Check authentication state
    updateAuthState();
}

// Update authentication state
function updateAuthState() {
    const isAuthenticated = !!localStorage.getItem('userToken');
    AppState.isAuthenticated = isAuthenticated;
    
    const authElements = document.querySelectorAll('[data-auth]');
    authElements.forEach(element => {
        const authState = element.getAttribute('data-auth');
        if (authState === 'authenticated') {
            element.classList.toggle('hidden', !isAuthenticated);
        } else if (authState === 'unauthenticated') {
            element.classList.toggle('hidden', isAuthenticated);
        }
    });
    
    // Update user info
    if (isAuthenticated) {
        const userEmail = localStorage.getItem('userEmail');
        const userName = document.getElementById('user-name');
        const userEmailEl = document.getElementById('user-email');
        
        if (userName && userEmail) {
            userName.textContent = userEmail.split('@')[0];
        }
        if (userEmailEl) {
            userEmailEl.textContent = userEmail;
        }
    }
}

// Initialize voice systems
function initVoiceSystems() {
    // Initialize speech synthesis
    if ('speechSynthesis' in window || 'webkitSpeechSynthesis' in window) {
        AppState.speechSynthesis = window.speechSynthesis || window.webkitSpeechSynthesis;

        // Get voices immediately to trigger loading
        const initialVoices = AppState.speechSynthesis.getVoices();
        if (initialVoices.length > 0) {
            AppState.voicesLoaded = true;
            console.log('Speech synthesis voices already loaded');
        } else {
            AppState.voicesLoaded = false;
        }

        // Wait for voices to load
        AppState.speechSynthesis.onvoiceschanged = () => {
            AppState.voicesLoaded = true;
            console.log('Speech synthesis voices loaded');
        };
    }

    // Initialize speech recognition if supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        console.log('Speech recognition supported');
    }

    // Add user interaction tracking for speech synthesis
    initUserInteractionTracking();
}

// Initialize user interaction tracking for speech synthesis
function initUserInteractionTracking() {
    const handleUserInteraction = () => {
        if (!AppState.userInteracted) {
            AppState.userInteracted = true;
            console.log('User interaction detected - speech synthesis enabled');
            showNotification('Voice features enabled!', 'success');

            // Remove event listeners after first interaction
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('keydown', handleUserInteraction);
            document.removeEventListener('touchstart', handleUserInteraction);
        }
    };

    // Listen for various user interaction events
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });

    console.log('User interaction tracking initialized for speech synthesis');
}

// Request microphone permission
async function requestMicrophonePermission() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('WebRTC not supported');
        return false;
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        console.log('Microphone permission granted');
        return true;
    } catch (error) {
        console.warn('Microphone permission denied:', error);
        return false;
    }
}

// Get API key from .env file
async function getApiKey() {
    // Check cache first
    if (window.GEMINI_API_KEY) {
        console.log('Using cached API key');
        return window.GEMINI_API_KEY;
    }

    try {
        console.log('Attempting to load API key from backend...');

        // Fetch API key from backend endpoint
        const response = await fetch('http://localhost:5000/api-key');
        if (!response.ok) {
            throw new Error(`Failed to fetch API key from backend: ${response.status}`);
        }

        const data = await response.json();
        const apiKey = data.apiKey;

        if (!apiKey) {
            throw new Error('API key not found in backend response');
        }

        // Validate API key
        if (apiKey === 'your_gemini_api_key_here') {
            throw new Error('API key is still the placeholder value');
        }

        if (apiKey.length < 20) {
            throw new Error(`API key too short: expected at least 20 characters, got ${apiKey.length}`);
        }

        console.log('API key loaded successfully from backend');
        window.GEMINI_API_KEY = apiKey;
        return apiKey;
    } catch (error) {
        console.error('Failed to load API key:', error.message);
        console.error('Error details:', error);

        // Check if API key is in localStorage as fallback
        const localStorageKey = localStorage.getItem('GEMINI_API_KEY');
        if (localStorageKey && localStorageKey !== 'your_gemini_api_key_here') {
            console.log('Using API key from localStorage');
            window.GEMINI_API_KEY = localStorageKey;
            return localStorageKey;
        }

        return null;
    }
}

// Clean transcript with AI
async function cleanTranscriptWithAI(rawTranscript) {
    if (!rawTranscript || rawTranscript.trim().length < 10) {
        return rawTranscript;
    }
    
    try {
        const apiKey = await getApiKey();
        if (!apiKey) {
            return rawTranscript;
        }
        
        const prompt = `Clean and correct this spoken transcript for an interview response. 
        Fix grammar, remove filler words, and make it professional: "${rawTranscript}"
        
        Output only the cleaned text.`;
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.API_MODEL}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        const cleanedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || rawTranscript;
        
        return cleanedText;
        
    } catch (error) {
        console.error('Transcript cleaning error:', error);
        return rawTranscript;
    }
}

// Get AI tone analysis
async function getToneAnalysisFromAI(transcript, audioMetrics) {
    if (!transcript || transcript.trim().length < 10) {
        return { feedback: 'Insufficient speech for analysis.' };
    }
    
    try {
        const apiKey = await getApiKey();
        if (!apiKey) {
            return { feedback: 'AI analysis unavailable. Please check your API key.' };
        }
        
        const prompt = `Analyze this interview response for communication effectiveness, confidence, and tone.
        
        Transcript: "${transcript}"
        Audio Metrics: Volume: ${audioMetrics.volume}%, Pitch: ${audioMetrics.pitch}Hz, Duration: ${audioMetrics.duration}s
        
        Provide specific, constructive feedback in 1-2 sentences focusing on:
        1. Clarity and structure
        2. Confidence level
        3. Areas for improvement
        
        Keep it professional and encouraging.`;
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.API_MODEL}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        const feedback = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 
                        'Good response! Consider adding more specific examples.';
        
        return { feedback };
        
    } catch (error) {
        console.error('AI tone analysis error:', error);
        return { 
            feedback: 'AI analysis temporarily unavailable. Focus on speaking clearly and confidently.' 
        };
    }
}

// Get AI interviewer response
async function getAIResponse(userInput, questionContext) {
    try {
        const apiKey = await getApiKey();
        if (!apiKey) {
            return "Thank you for your response. Let's continue with the next question.";
        }
        
        const prompt = `As an AI interviewer, respond naturally to the candidate's answer and ask the next relevant question.
        
        Previous Question: ${questionContext}
        Candidate's Response: ${userInput}
        
        Provide a brief acknowledgment (1-2 words) followed by the next interview question.
        Keep it professional and conversational.`;
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.API_MODEL}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 
                         "Thank you. Now, let's move to the next question.";
        
        return aiResponse;
        
    } catch (error) {
        console.error('Error getting AI response:', error);
        return "Thank you. Let's continue with the next question.";
    }
}

// Initialize webcam
function initWebcam() {
    const video = document.getElementById('webcam-video');
    const placeholder = document.getElementById('webcam-placeholder');
    const statusIndicator = document.getElementById('webcam-status');
    const statusText = document.getElementById('webcam-status-text');
    
    if (!video || !placeholder) {
        console.log('Webcam elements not found');
        return;
    }
    
    // Check browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        statusText.textContent = 'Camera not supported';
        if (statusIndicator) statusIndicator.className = 'w-3 h-3 bg-red-400 rounded-full';
        return;
    }
    
    // Request camera access
    navigator.mediaDevices.getUserMedia({ 
        video: { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
        },
        audio: false
    })
    .then(function(stream) {
        // Success
        video.srcObject = stream;
        placeholder.style.display = 'none';
        
        if (statusText) statusText.textContent = 'Camera Active';
        if (statusIndicator) statusIndicator.className = 'w-3 h-3 bg-green-400 rounded-full';
        
        // Store for cleanup
        window.webcamStream = stream;
        
        console.log('Webcam initialized successfully');
    })
    .catch(function(err) {
        // Error handling
        console.error('Error accessing webcam:', err);
        
        if (statusText) {
            if (err.name === 'NotAllowedError') {
                statusText.textContent = 'Camera Permission Denied';
            } else if (err.name === 'NotFoundError') {
                statusText.textContent = 'No Camera Found';
            } else {
                statusText.textContent = 'Camera Error';
            }
        }
        
        if (statusIndicator) statusIndicator.className = 'w-3 h-3 bg-red-400 rounded-full';
    });
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full`;
    
    // Set style based on type
    const styles = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        warning: 'bg-yellow-500 text-white',
        info: 'bg-blue-500 text-white'
    };
    
    notification.classList.add(...styles[type].split(' '));
    
    notification.innerHTML = `
        <div class="flex items-center justify-between">
            <span class="mr-4">${message}</span>
            <button class="text-white hover:text-gray-200 transition-colors">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                </svg>
            </button>
        </div>
    `;
    
    // Add close button handler
    const closeButton = notification.querySelector('button');
    closeButton.addEventListener('click', () => {
        notification.classList.add('translate-x-full');
        setTimeout(() => notification.remove(), 300);
    });
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.classList.add('translate-x-full');
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Update user stats
function updateUserStats() {
    // Mock stats - in production, fetch from API
    const stats = {
        interviewsCompleted: 12,
        averageScore: 85,
        improvement: 15,
        streak: 7
    };
    
    const elements = {
        'interviews-completed': stats.interviewsCompleted,
        'average-score': stats.averageScore,
        'improvement': stats.improvement,
        'streak': stats.streak
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

// Load recent activity
function loadRecentActivity() {
    const activityContainer = document.getElementById('recent-activity');
    if (!activityContainer) return;
    
    const activities = [
        {
            type: 'interview',
            role: 'Senior Software Engineer',
            score: 88,
            date: '2 hours ago',
            status: 'completed'
        },
        {
            type: 'achievement',
            title: 'Communication Master',
            description: 'Scored 90+ in communication 5 times',
            date: '1 day ago'
        },
        {
            type: 'interview',
            role: 'Product Manager',
            score: 82,
            date: '3 days ago',
            status: 'completed'
        }
    ];
    
    activityContainer.innerHTML = activities.map(activity => {
        if (activity.type === 'interview') {
            return `
                <div class="flex items-center p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow">
                    <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                        <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-semibold text-slate-800">${activity.role} Interview</h4>
                        <p class="text-sm text-slate-600">Score: ${activity.score}/100 • ${activity.date}</p>
                    </div>
                    <button class="text-blue-600 hover:text-blue-700 text-sm font-medium">Review</button>
                </div>
            `;
        } else {
            return `
                <div class="flex items-center p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow">
                    <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                        <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                        </svg>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-semibold text-slate-800">Achievement Unlocked!</h4>
                        <p class="text-sm text-slate-600">${activity.title} • ${activity.date}</p>
                    </div>
                </div>
            `;
        }
    }).join('');
}

// Initialize achievements
function initAchievements() {
    const achievementContainer = document.getElementById('achievements');
    if (!achievementContainer) return;
    
    const achievements = [
        {
            title: 'First Interview',
            description: 'Completed your first practice interview',
            icon: '🎯',
            unlocked: true,
            date: '1 week ago'
        },
        {
            title: 'Communication Master',
            description: 'Scored 90+ in communication 5 times',
            icon: '💬',
            unlocked: true,
            date: '1 day ago'
        },
        {
            title: 'Streak Champion',
            description: 'Practice for 7 consecutive days',
            icon: '🔥',
            unlocked: true,
            date: 'Today'
        },
        {
            title: 'Perfect Score',
            description: 'Achieve a perfect 100 in any category',
            icon: '⭐',
            unlocked: false
        },
        {
            title: 'Interview Pro',
            description: 'Complete 50 practice interviews',
            icon: '🏆',
            unlocked: false
        },
        {
            title: 'Speed Demon',
            description: 'Complete an interview in under 10 minutes',
            icon: '⚡',
            unlocked: false
        }
    ];
    
    achievementContainer.innerHTML = achievements.map(achievement => `
        <div class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'} bg-white rounded-lg p-6 border ${achievement.unlocked ? 'border-green-200' : 'border-slate-200'} text-center transition-all duration-300 hover:shadow-md">
            <div class="text-4xl mb-3 ${achievement.unlocked ? '' : 'grayscale opacity-50'}">${achievement.icon}</div>
            <h4 class="font-semibold ${achievement.unlocked ? 'text-slate-800' : 'text-slate-400'} mb-2">${achievement.title}</h4>
            <p class="text-sm ${achievement.unlocked ? 'text-slate-600' : 'text-slate-400'} mb-3">${achievement.description}</p>
            ${achievement.unlocked ? 
                `<span class="text-xs text-green-600 font-medium">Unlocked ${achievement.date}</span>` :
                `<span class="text-xs text-slate-400 font-medium">Not yet unlocked</span>`
            }
        </div>
    `).join('');
}

// Cleanup resources
function cleanupResources() {
    // Stop webcam
    if (window.webcamStream) {
        window.webcamStream.getTracks().forEach(track => track.stop());
    }
    
    // Stop audio recording
    if (AppState.audioStream) {
        AppState.audioStream.getTracks().forEach(track => track.stop());
    }
    
    // Close audio context
    if (AppState.audioContext && AppState.audioContext.state !== 'closed') {
        AppState.audioContext.close();
    }
    
    // Cancel speech synthesis
    if (AppState.speechSynthesis) {
        AppState.speechSynthesis.cancel();
    }
    
    // Clear speech recognition
    if (AppState.recognition) {
        AppState.recognition.stop();
    }
    
    console.log('Resources cleaned up');
}

// Global cleanup on page unload
window.addEventListener('beforeunload', cleanupResources);

// Export functions for global access
window.startDemo = function() {
    showNotification('Starting demo interview...', 'info');
    setTimeout(() => {
        window.location.href = 'interview-setup.html';
    }, 1000);
};

window.scrollToFeatures = function() {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
};

window.activateAvatar = activateAvatar;
window.toggleVoiceRecording = toggleVoiceRecording;
window.processResponse = processResponse;
window.imDoneAnswering = imDoneAnswering;
window.nextQuestion = nextQuestion;
window.startThinkingAnimation = startThinkingAnimation;
window.stopThinkingAnimation = stopThinkingAnimation;
window.speakText = speakText;

// Initialize when DOM is loaded
console.log('Face2Hire Main.js loaded successfully');