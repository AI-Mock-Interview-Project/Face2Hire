// AI Interview Simulator - Main JavaScript File
// Handles all interactive functionality across the application

// Global state management
const AppState = {
    currentUser: null,
    currentInterview: null,
    avatarInstance: null,
    speechSynthesis: null,
    isRecording: false,
    isSpeaking: false,
    speechQueue: [], // Queue for speech utterances to prevent interruption
    isProcessingResponse: false, // Flag to prevent auto-processing
    pausedSpeech: null, // Store paused speech utterance
    speechPaused: false // Flag to track if speech is paused
};

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Main initialization function
function initializeApp() {
    // Initialize scroll reveal animations
    initScrollReveal();
    
    // Initialize Vanta.js background if on landing page
    if (document.getElementById('vanta-bg')) {
        initVantaBackground();
    }
    
    // Initialize page-specific functionality
    const currentPage = getCurrentPage();
    switch(currentPage) {
        case 'index':
            initLandingPage();
            break;
        case 'dashboard':
            initDashboard();
            break;
        case 'interview-setup':
            initInterviewSetup();
            break;
        case 'interview-live':
            initLiveInterview();
            break;
        case 'results':
            initResultsPage();
            break;
        case 'profile':
            initProfilePage();
            break;
    }
    
    // Initialize common functionality
    initNavigation();
    initSpeechSystems();
}

// Get current page identifier
function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('dashboard')) return 'dashboard';
    if (path.includes('interview-setup')) return 'interview-setup';
    if (path.includes('interview-live')) return 'interview-live';
    if (path.includes('results')) return 'results';
    if (path.includes('profile')) return 'profile';
    if (path.includes('login')) return 'login';
    return 'index';
}

// Initialize scroll reveal animations
function initScrollReveal() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, observerOptions);
    
    // Observe all scroll-reveal elements
    document.querySelectorAll('.scroll-reveal').forEach(el => {
        observer.observe(el);
    });
}

// Initialize Vanta.js background animation
function initVantaBackground() {
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
    } catch (error) {
        console.log('Vanta.js initialization failed:', error);
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
    const chartContainer = document.getElementById('progress-chart');
    if (chartContainer) {
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
    }
}

// Initialize interview setup functionality
function initInterviewSetup() {
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

// Initialize file upload functionality
function initFileUpload() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    
    if (dropZone && fileInput) {
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
}

// Handle file upload
function handleFileUpload(file) {
    if (file.type === 'application/pdf' || file.type.startsWith('text/')) {
        // Show upload progress
        showUploadProgress();
        
        // Simulate file processing
        setTimeout(() => {
            hideUploadProgress();
            showNotification('File uploaded successfully! AI is analyzing the job description.');
            
            // Extract job requirements (simulated)
            setTimeout(() => {
                displayExtractedRequirements();
            }, 2000);
        }, 1500);
    } else {
        showNotification('Please upload a PDF or text file.', 'error');
    }
}

// Initialize live interview functionality
function initLiveInterview() {
    // Initialize 3D avatar
    init3DAvatar();
    
    // Initialize interview interface
    initInterviewInterface();
    
    // Initialize voice recording
    initVoiceRecording();
    
    // Initialize webcam
    initWebcam();
    
    // Start interview session
    startInterviewSession();
}

// Initialize 3D avatar using Three.js
function init3DAvatar() {
    const avatarContainer = document.getElementById('avatar-container');
    if (avatarContainer && typeof THREE !== 'undefined') {
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
        
        // Create avatar geometry (simplified)
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
    }
}

function initVoiceRecording() {
    // Check for MediaRecorder support
    if (!window.MediaRecorder) {
        console.warn('MediaRecorder not supported in this browser');
        showNotification('Audio recording not supported in this browser. Using text input mode.', 'warning');
        return;
    }

    // Add MediaRecorder properties to AppState
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

// Analyze recorded audio for tone using Web Audio API
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
        await new Promise(resolve => setTimeout(resolve, 100)); // Short delay to get data
        analyser.getByteFrequencyData(dataArray);

        // Calculate average volume (RMS)
        const channelData = audioBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
            sum += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sum / channelData.length);
        const volume = rms * 100; // Scale to 0-100

        // Estimate pitch (find dominant frequency)
        let maxIndex = 0;
        let maxValue = 0;
        for (let i = 0; i < bufferLength; i++) {
            if (dataArray[i] > maxValue) {
                maxValue = dataArray[i];
                maxIndex = i;
            }
        }
        const nyquist = audioContext.sampleRate / 2;
        const pitch = (maxIndex / bufferLength) * nyquist;

        const duration = audioBuffer.duration;

        // Estimate speaking rate if transcript available
        let speakingRate = 0;
        if (AppState.finalTranscript) {
            const words = AppState.finalTranscript.trim().split(/\s+/).length;
            speakingRate = (words / duration) * 60; // words per minute
        }

        // Generate feedback based on metrics
        let feedback = [];
        if (volume > 50) {
            feedback.push('Your volume indicates confidence and enthusiasm.');
        } else if (volume < 20) {
            feedback.push('Try speaking louder to convey more confidence.');
        }

        if (pitch > 200) {
            feedback.push('Your pitch suggests energy and engagement.');
        } else if (pitch < 100) {
            feedback.push('Consider varying your pitch for better expressiveness.');
        }

        if (speakingRate > 200) {
            feedback.push('Speaking rate is fast - try slowing down for clarity.');
        } else if (speakingRate < 100) {
            feedback.push('Speaking rate is slow - try speaking a bit faster.');
        }

        if (duration > 30) {
            feedback.push('Good pacing - you took time to think.');
        } else if (duration < 10) {
            feedback.push('Consider speaking a bit longer for more detailed responses.');
        }

        audioContext.close();

        return {
            pitch: Math.round(pitch),
            volume: Math.round(volume),
            duration: Math.round(duration),
            speakingRate: Math.round(speakingRate),
            feedback: feedback.length > 0 ? feedback.join(' ') : 'Good tone overall!'
        };
    } catch (error) {
        console.error('Error analyzing audio:', error);
        return {
            pitch: 0,
            volume: 0,
            duration: 0,
            feedback: 'Unable to analyze tone. Please ensure microphone is working.'
        };
    }
}

// Play the recorded audio
function playRecording() {
    if (AppState.audioBlob) {
        const audioUrl = URL.createObjectURL(AppState.audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
        showNotification('Playing your recording...', 'info');
    } else {
        showNotification('No recording available to play.', 'warning');
    }
}

// Initialize speech synthesis
function initSpeechSystems() {
    if ('speechSynthesis' in window) {
        AppState.speechSynthesis = window.speechSynthesis;
    }
}

// Start interview session
async function startInterviewSession() {
    // Initialize interview state
    AppState.currentInterview = {
        startTime: new Date(),
        questions: [],
        responses: [],
        score: 0,
        currentQuestionIndex: 0
    };

    // Load interview questions from JSON with filtering
    await loadInterviewQuestions();

    // Ask first question
    await askNextQuestion();
}

// Ask next interview question
async function askNextQuestion() {
    const questions = await getMockInterviewQuestions();
    const currentIndex = AppState.currentInterview.currentQuestionIndex;

    if (currentIndex < questions.length) {
        const question = questions[currentIndex];

        // Display question
        displayQuestion(question);

        // Speak question if voice is enabled
        if (AppState.speechSynthesis) {
            speakText(question.text);
        }

        // Update interview state
        AppState.currentInterview.questions.push(question);
        AppState.currentInterview.currentQuestionIndex++;
    } else {
        // End interview
        endInterviewSession();
    }
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

    // Store current question for AI responses
    AppState.currentQuestion = question;
}

// Speak text using speech synthesis
function speakText(text) {
    if (AppState.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        
        AppState.speechSynthesis.speak(utterance);
    }
}

// Toggle voice recording with MediaRecorder and SpeechRecognition
function toggleVoiceRecording() {
    if (!window.MediaRecorder) {
        showNotification('Audio recording not supported in this browser.', 'error');
        return;
    }

    if (AppState.isRecording) {
        // Stop recording
        if (AppState.mediaRecorder && AppState.mediaRecorder.state === 'recording') {
            AppState.mediaRecorder.stop();
        }
        if (AppState.recognition) {
            AppState.recognition.stop();
        }
        if (AppState.audioContext && AppState.audioContext.state !== 'closed') {
            AppState.audioContext.close();
            AppState.audioContext = null;
        }
        AppState.isRecording = false;
        updateVoiceButtonState();
    } else {
        // Reset transcripts for new recording
        AppState.finalTranscript = '';
        AppState.currentResponseTranscript = '';

        // Start recording
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                AppState.audioStream = stream;
                AppState.audioChunks = [];

                try {
                    AppState.mediaRecorder = new MediaRecorder(stream, AppState.mediaRecorderOptions);

                    // Initialize SpeechRecognition for transcript
                    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
                        AppState.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
                        AppState.recognition.continuous = true;
                        AppState.recognition.interimResults = true;
                        AppState.recognition.lang = 'en-US';

                        AppState.recognition.onresult = (event) => {
                            let interimTranscript = '';
                            let newFinalTranscript = ''; // New final parts from this event
                            
                            for (let i = event.resultIndex; i < event.results.length; i++) {
                                const result = event.results[i][0].transcript;
                                if (event.results[i].isFinal) {
                                    newFinalTranscript += result + ' ';
                                } else {
                                    interimTranscript += result;
                                }
                            }
                            
                            // Append new final parts to persistent transcript
                            if (newFinalTranscript) {
                                AppState.finalTranscript += newFinalTranscript;
                                AppState.finalTranscript = AppState.finalTranscript.trim();
                                AppState.currentResponseTranscript = AppState.finalTranscript;
                            }
                            
                            // Update text input with full final + current interim for real-time preview
                            const inputElement = document.getElementById('response-input');
                            if (inputElement) {
                                inputElement.value = AppState.finalTranscript + (interimTranscript ? ' ' + interimTranscript : '');
                                updateWordCount(); // Update word count
                            }
                            
                            // Update transcript display
                            const transcriptElement = document.getElementById('transcript');
                            if (transcriptElement) {
                                transcriptElement.textContent = AppState.finalTranscript + (interimTranscript ? ' ... ' + interimTranscript : '');
                            }
                        };

                        AppState.recognition.onend = () => {
                            console.log('Speech recognition ended during recording');
                            // Restart if still recording to handle pauses (breathing) - faster for quick speech
                            if (AppState.isRecording) {
                                setTimeout(() => {
                                    if (AppState.recognition) {
                                        AppState.recognition.start();
                                    }
                                }, 100); // Reduced delay for faster response to fast speech
                            }
                        };

                        AppState.recognition.onerror = (event) => {
                            console.error('Speech recognition error:', event.error);
                            const transcriptElement = document.getElementById('transcript');
                            if (transcriptElement) {
                                transcriptElement.textContent = 'Speech recognition unavailable.';
                            }
                        };

                        AppState.recognition.start();
                    } else {
                        const transcriptElement = document.getElementById('transcript');
                        if (transcriptElement) {
                            transcriptElement.textContent = 'Speech recognition not supported. Recording audio only.';
                        }
                    }

                    // Initialize real-time tone analysis
                    AppState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const analyser = AppState.audioContext.createAnalyser();
                    analyser.fftSize = 2048;
                    const source = AppState.audioContext.createMediaStreamSource(stream);
                    source.connect(analyser);
                    AppState.analyser = analyser;

                    // Start real-time tone monitoring
                    function updateRealTimeTone() {
                        if (!AppState.isRecording) return;

                        const bufferLength = analyser.frequencyBinCount;
                        const dataArray = new Uint8Array(bufferLength);
                        analyser.getByteFrequencyData(dataArray);

                        // Calculate average volume
                        let sum = 0;
                        for (let i = 0; i < bufferLength; i++) {
                            sum += dataArray[i];
                        }
                        const volume = sum / bufferLength;

                        // Update confidence score ring in real-time
                        const confidenceRing = document.getElementById('confidence-score');
                        const confidenceText = document.getElementById('confidence-text');
                        if (confidenceRing) {
                            const score = Math.min(100, volume * 2); // Scale volume to 0-100
                            confidenceRing.setAttribute('stroke-dasharray', `${score}, 100`);
                            if (confidenceText) {
                                confidenceText.textContent = Math.round(score);
                            }
                        }

                        requestAnimationFrame(updateRealTimeTone);
                    }
                    updateRealTimeTone();

                    AppState.mediaRecorder.ondataavailable = (event) => {
                        if (event.data.size > 0) {
                            AppState.audioChunks.push(event.data);
                        }
                    };

                    AppState.mediaRecorder.onstop = async () => {
                        // Create audio blob
                        if (AppState.audioChunks && AppState.audioChunks.length > 0 && AppState.mediaRecorderOptions) {
                            AppState.audioBlob = new Blob(AppState.audioChunks, { type: AppState.mediaRecorderOptions.mimeType });
                        }

                        // Stop all tracks
                        if (AppState.audioStream) {
                            AppState.audioStream.getTracks().forEach(track => track.stop());
                        }

                        // Stop recognition and context
                        if (AppState.recognition) {
                            AppState.recognition.stop();
                        }
                        if (AppState.audioContext && AppState.audioContext.state !== 'closed') {
                            AppState.audioContext.close();
                            AppState.audioContext = null;
                        }

                        // Clean the transcript with AI
                        AppState.finalTranscript = await cleanTranscriptWithAI(AppState.finalTranscript);

                        // Update input with cleaned transcript
                        const inputElement = document.getElementById('response-input');
                        if (inputElement && AppState.finalTranscript) {
                            inputElement.value = AppState.finalTranscript;
                            updateWordCount();
                        }

                        // Get basic audio metrics
                        const audioMetrics = AppState.audioBlob ? await analyzeAudioTone(AppState.audioBlob) : {
                            pitch: 0,
                            volume: 0,
                            duration: 0,
                            speakingRate: 0,
                            feedback: 'Audio recording failed - unable to analyze tone.'
                        };

                        // Get AI-powered tone analysis for suggestions
                        const aiAnalysis = await getToneAnalysisFromAI(AppState.finalTranscript, audioMetrics);

                        // Show suggestions in the feedback box (appears while user is speaking/recording)
                        const feedbackElement = document.getElementById('feedback-message');
                        if (feedbackElement && aiAnalysis.feedback) {
                            feedbackElement.innerHTML = `
                                <div class="space-y-2">
                                    <div class="text-sm font-medium text-blue-600">💡 Tone Analysis:</div>
                                    <div class="text-sm text-slate-700">${aiAnalysis.feedback}</div>
                                    <div class="text-xs text-slate-500">Real-time analysis • Volume: ${audioMetrics.volume}% • Pitch: ${audioMetrics.pitch}Hz</div>
                                </div>
                            `;
                        }

                        // Update transcript display to show recording is complete with analysis results
                        const transcriptElement = document.getElementById('transcript');
                        if (transcriptElement) {
                            transcriptElement.innerHTML = `
                                <div class="mb-3">
                                    <div class="text-green-600 font-medium text-sm mb-1">📝 Your Response:</div>
                                    <div class="text-slate-700 text-sm bg-slate-50 p-2 rounded">${AppState.finalTranscript || 'No speech detected'}</div>
                                </div>
                                <div class="mb-2">
                                    <div class="text-blue-600 font-medium text-xs mb-1">🎯 Analysis Results:</div>
                                    <div class="text-slate-600 text-xs">
                                        <span>Volume: ${audioMetrics.volume}%</span> •
                                        <span>Pitch: ${audioMetrics.pitch}Hz</span> •
                                        <span>Duration: ${audioMetrics.duration}s</span>
                                    </div>
                                </div>
                                <div class="text-xs text-slate-500">Response recorded • Ready for next question</div>
                            `;
                        }

                        // Update feedback message with AI insights (already updated above)

                        showNotification('Analysis complete! Check the feedback below.', 'success');

                        console.log('Recording stopped. Basic Analysis:', audioMetrics, 'AI Analysis:', aiAnalysis);

                        // Process the voice response for interview flow - only if not already processing
                        if (AppState.finalTranscript && !AppState.isProcessingResponse) {
                            AppState.isProcessingResponse = true;
                            processResponse(AppState.finalTranscript);
                        }

                        // Clear transcripts for next response
                        AppState.finalTranscript = '';
                        AppState.currentResponseTranscript = '';
                    };

                    AppState.mediaRecorder.onerror = (event) => {
                        console.error('MediaRecorder error:', event.error);
                        showNotification('Recording error occurred.', 'error');
                        AppState.isRecording = false;
                        updateVoiceButtonState();
                    };

                    // Start recording
                    AppState.mediaRecorder.start();
                    AppState.isRecording = true;
                    updateVoiceButtonState();
                    showNotification('Recording started...', 'info');

                    // Update transcript display
                    const transcriptElement = document.getElementById('transcript');
                    if (transcriptElement) {
                        transcriptElement.textContent = 'Recording...';
                    }

                } catch (err) {
                    console.error('Error creating MediaRecorder:', err);
                    showNotification('Failed to start recording.', 'error');
                }
            })
            .catch(err => {
                console.error('Microphone access denied:', err);
                showNotification('Microphone access denied. Please enable permissions.', 'error');
            });
    }
}

// Update voice button state
function updateVoiceButtonState() {
    const voiceButton = document.getElementById('voice-button');
    if (voiceButton) {
        if (AppState.isRecording) {
            voiceButton.classList.add('bg-red-500', 'hover:bg-red-600');
            voiceButton.classList.remove('bg-blue-500', 'hover:bg-blue-600');
            voiceButton.innerHTML = '<span class="mr-2">⏹️</span> Stop Recording';
        } else {
            voiceButton.classList.remove('bg-red-500', 'hover:bg-red-600');
            voiceButton.classList.add('bg-blue-500', 'hover:bg-blue-600');
            voiceButton.innerHTML = '<span class="mr-2">🎤</span> Start Recording';
        }
    }
}

// Initialize results page functionality
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
    // Load real interview data from sessionStorage
    const interviewResults = JSON.parse(sessionStorage.getItem('interviewResults') || '{}');
    const scores = interviewResults.scores || { communication: 75, content: 80, confidence: 70 };
    const responses = interviewResults.responses || [];
    const overallScore = Math.round((scores.communication + scores.content + scores.confidence) / 3);

    // Calculate aggregated scores for charts
    const commScore = Math.round(scores.communication || 75);
    const techScore = Math.round((scores.content || 80) * 0.7 + (scores.confidence || 70) * 0.3); // Approximate technical from content/confidence
    const problemScore = Math.round(scores.content || 80); // Use content as proxy
    const leadershipScore = Math.round(scores.confidence || 70);
    const adaptScore = Math.round((scores.communication || 75) * 0.5 + scores.confidence * 0.5);

    // Skill radar chart with real data
    const radarChart = document.getElementById('skill-radar-chart');
    if (radarChart) {
        const chart = echarts.init(radarChart);
        
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
                    { name: 'Leadership', max: 100 },
                    { name: 'Confidence', max: 100 },
                    { name: 'Adaptability', max: 100 }
                ],
                radius: '70%'
            },
            series: [{
                name: 'Skills',
                type: 'radar',
                data: [{
                    value: [commScore, techScore, problemScore, leadershipScore, scores.confidence || 70, adaptScore],
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
    
    // Score breakdown chart with real data
    const breakdownChart = document.getElementById('score-breakdown-chart');
    if (breakdownChart) {
        const chart = echarts.init(breakdownChart);
        
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
                    { value: commScore, name: 'Communication', itemStyle: { color: '#3b82f6' } },
                    { value: techScore, name: 'Technical Skills', itemStyle: { color: '#8b5cf6' } },
                    { value: problemScore, name: 'Problem Solving', itemStyle: { color: '#10b981' } },
                    { value: scores.confidence || 70, name: 'Confidence', itemStyle: { color: '#f59e0b' } }
                ],
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

    // Update overall score display
    const overallScoreEl = document.getElementById('overall-score');
    if (overallScoreEl) {
        overallScoreEl.textContent = overallScore;
    }

    // Generate personalized summary based on real responses
    const summaryEl = document.getElementById('results-summary');
    if (summaryEl && responses.length > 0) {
        const strengths = [];
        if (commScore > 80) strengths.push('strong communication');
        if (techScore > 80) strengths.push('solid technical knowledge');
        if (scores.confidence > 80) strengths.push('high confidence');

        const areas = [];
        if (commScore < 60) areas.push('communication clarity');
        if (techScore < 60) areas.push('technical depth');
        if (scores.confidence < 60) areas.push('confidence building');

        let summary = `You completed ${responses.length} questions with an overall score of ${overallScore}/100. `;
        if (strengths.length > 0) {
            summary += `Strengths: ${strengths.join(', ')}. `;
        }
        if (areas.length > 0) {
            summary += `Areas for improvement: ${areas.join(', ')}. `;
        }
        summary += 'Review your responses below for detailed feedback.';

        summaryEl.textContent = summary;
    }
}

// Initialize profile page functionality
function initProfilePage() {
    // Initialize profile editing
    initProfileEditing();
    
    // Initialize settings management
    initSettingsManagement();
    
    // Initialize achievement display
    initAchievementDisplay();
}

// Initialize navigation functionality
function initNavigation() {
    // Mobile menu toggle
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    // Smooth scroll for anchor links
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
}

// Utility Functions

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full`;
    
    // Set notification style based on type
    switch(type) {
        case 'success':
            notification.classList.add('bg-green-500', 'text-white');
            break;
        case 'error':
            notification.classList.add('bg-red-500', 'text-white');
            break;
        case 'warning':
            notification.classList.add('bg-yellow-500', 'text-white');
            break;
        default:
            notification.classList.add('bg-blue-500', 'text-white');
    }
    
    notification.innerHTML = `
        <div class="flex items-center justify-between">
            <span class="mr-4">${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                </svg>
            </button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

// Update user stats
function updateUserStats() {
    // Mock user stats - in real app, this would come from API
    const stats = {
        interviewsCompleted: 12,
        averageScore: 85,
        improvement: 15,
        streak: 7
    };
    
    // Update DOM elements
    const elements = {
        interviewsCompleted: document.getElementById('interviews-completed'),
        averageScore: document.getElementById('average-score'),
        improvement: document.getElementById('improvement'),
        streak: document.getElementById('streak')
    };
    
    Object.keys(elements).forEach(key => {
        if (elements[key]) {
            elements[key].textContent = stats[key];
        }
    });
}

// Load recent activity
function loadRecentActivity() {
    const activityContainer = document.getElementById('recent-activity');
    if (activityContainer) {
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
}

// Initialize achievement system
function initAchievements() {
    const achievementContainer = document.getElementById('achievements');
    if (achievementContainer) {
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
            <div class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'} bg-white rounded-lg p-6 border border-slate-200 text-center transition-all duration-300 hover:shadow-md">
                <div class="text-4xl mb-3 ${achievement.unlocked ? '' : 'grayscale opacity-50'}">${achievement.icon}</div>
                <h4 class="font-semibold text-slate-800 mb-2">${achievement.title}</h4>
                <p class="text-sm text-slate-600 mb-3">${achievement.description}</p>
                ${achievement.unlocked ? 
                    `<span class="text-xs text-green-600 font-medium">Unlocked ${achievement.date}</span>` :
                    `<span class="text-xs text-slate-400 font-medium">Not yet unlocked</span>`
                }
            </div>
        `).join('');
    }
}

// Load interview questions from JSON file
async function loadInterviewQuestions() {
    try {
        // Get selected role from sessionStorage
        const setupData = JSON.parse(sessionStorage.getItem('interviewSetup') || '{}');
        const selectedRole = setupData.selectedRole || 'softwareengineer';

        // Fetch questions from JSON file
        const response = await fetch('questions.json');
        const data = await response.json();
        const roleQuestions = data[selectedRole] || data['softwareengineer'] || [];

        // Shuffle and return first 5 questions
        const shuffled = roleQuestions.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 5);
    } catch (error) {
        console.error('Error loading questions:', error);
        return [];
    }
}

// Real interview questions loaded from JSON
async function getMockInterviewQuestions() {
    try {
        // Load questions from questions.json file
        const questions = await loadInterviewQuestions();
        return questions.length > 0 ? questions : [
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
    } catch (error) {
        console.error('Error loading questions:', error);
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
}

// Process user response (text or voice) for interview flow
async function processResponse(response) {
    // Stop recording if active to ensure clean state for next question
    if (AppState.isRecording) {
        toggleVoiceRecording();
    }

    // Add user message to chat
    if (window.addChatMessage) {
        window.addChatMessage('user', response);
    }

    // Provide feedback and update scores based on AI analysis (silent, doesn't interrupt flow)
    await provideFeedback(response);

    // Get AI interviewer response (adaptive feedback and next question)
    const questionContext = AppState.currentQuestion ? AppState.currentQuestion.text : 'Initial response';
    const aiResponse = await getAIResponse(response, questionContext);

    // Add AI response to chat and speak it (will queue if currently speaking)
    if (window.addChatMessage) {
        window.addChatMessage('interviewer', aiResponse);
    }

    // Reset processing flag - next question will be triggered by speech queue completion
    // The speech synthesis onend handler will call nextQuestion when AI response finishes speaking
    AppState.isProcessingResponse = false;

    // Set up speech completion handler to advance to next question
    if (AppState.speechQueue && AppState.speechQueue.length > 0) {
        const lastUtterance = AppState.speechQueue[AppState.speechQueue.length - 1];
        const originalOnEnd = lastUtterance.onend;
        lastUtterance.onend = () => {
            // Call original onend handler
            if (originalOnEnd) originalOnEnd();

            // Advance to next question after AI response is fully spoken
            setTimeout(() => {
                if (window.nextQuestion) {
                    window.nextQuestion();
                } else {
                    askNextQuestion();
                }
            }, 1500); // Natural pause before next question
        };
    } else {
        // Fallback if no speech queue
        setTimeout(() => {
            if (window.nextQuestion) {
                window.nextQuestion();
            } else {
                askNextQuestion();
            }
        }, 2000);
    }
}

// AI-powered feedback and score updates
async function provideFeedback(response) {
    try {
        const apiKey = await getApiKey();
        if (!apiKey) {
            console.warn('API key not loaded, using fallback feedback');
            // Fallback to basic updates
            const improvements = {
                communication: Math.random() * 10 - 5,
                content: Math.random() * 10 - 5,
                confidence: Math.random() * 10 - 5
            };

            Object.keys(improvements).forEach(skill => {
                interviewState.scores[skill] = Math.max(0, Math.min(100, interviewState.scores[skill] + improvements[skill]));
                updateScoreUI(skill, interviewState.scores[skill]);
            });

            const feedbackElement = document.getElementById('feedback-message');
            if (feedbackElement) {
                feedbackElement.textContent = `💡 Good response! Keep practicing.`;
            }
            return;
        }

        const prompt = `Analyze this interview response critically and provide realistic scores for communication, content, and confidence (0-100). Be honest - give low scores (below 50) for poor, irrelevant, or incomplete responses. Also give brief constructive feedback.

Response: "${response}"

Output format:
Communication: [score]
Content: [score]
Confidence: [score]
Feedback: [1-2 sentences]`;

        const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
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

        // Update scores in interviewState (weighted average favoring new score)
        interviewState.scores.communication = Math.max(0, Math.min(100, 0.8 * communication + 0.2 * interviewState.scores.communication));
        interviewState.scores.content = Math.max(0, Math.min(100, 0.8 * content + 0.2 * interviewState.scores.content));
        interviewState.scores.confidence = Math.max(0, Math.min(100, 0.8 * confidence + 0.2 * interviewState.scores.confidence));

        // Update UI
        updateScoreUI('communication', interviewState.scores.communication);
        updateScoreUI('content', interviewState.scores.content);
        updateScoreUI('confidence', interviewState.scores.confidence);

        // Update feedback message
        const feedbackElement = document.getElementById('feedback-message');
        if (feedbackElement) {
            feedbackElement.textContent = `💡 ${feedback}`;
        }

        showNotification('Feedback updated based on your response!', 'info');
    } catch (error) {
        console.error('Feedback analysis error:', error);
        // Fallback to basic updates
        const improvements = {
            communication: Math.random() * 10 - 5,
            content: Math.random() * 10 - 5,
            confidence: Math.random() * 10 - 5
        };

        Object.keys(improvements).forEach(skill => {
            interviewState.scores[skill] = Math.max(0, Math.min(100, interviewState.scores[skill] + improvements[skill]));
            updateScoreUI(skill, interviewState.scores[skill]);
        });

        const feedbackElement = document.getElementById('feedback-message');
        if (feedbackElement) {
            feedbackElement.textContent = `💡 Good response! Keep practicing.`;
        }
    }
}

// Helper to update score UI
function updateScoreUI(skill, score) {
    const textElement = document.getElementById(`${skill}-text`);
    const ringElement = document.getElementById(`${skill}-score`);

    if (textElement) textElement.textContent = Math.round(score);
    if (ringElement) ringElement.setAttribute('stroke-dasharray', `${Math.round(score)}, 100`);
}

// Navigation functions
function startDemo() {
    showNotification('Redirecting to demo interview...');
    setTimeout(() => {
        window.location.href = 'interview-setup.html';
    }, 1000);
}

function scrollToFeatures() {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Resume interview after pause
function resumeInterview() {
    showNotification('Interview resumed.', 'info');
    // Additional resume logic can be added here
}

// Export functions for global access
window.startDemo = startDemo;
window.scrollToFeatures = scrollToFeatures;
window.activateAvatar = activateAvatar;
window.toggleVoiceRecording = toggleVoiceRecording;
window.processResponse = processResponse;
window.resumeInterview = resumeInterview;
window.provideFeedback = provideFeedback;
window.initWebcam = initWebcam;
window.speakText = speakText;

// Webcam functionality for interview interface
function initWebcam() {
    const video = document.getElementById('webcam-video');
    const placeholder = document.getElementById('webcam-placeholder');
    const statusIndicator = document.getElementById('webcam-status');
    const statusText = document.getElementById('webcam-status-text');
    
    if (!video || !placeholder) {
        console.log('Webcam elements not found');
        return;
    }
    
    // Check if browser supports getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        statusText.textContent = 'Camera not supported';
        statusIndicator.className = 'w-3 h-3 bg-red-400 rounded-full';
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
        // Success - show video stream
        video.srcObject = stream;
        placeholder.style.display = 'none';
        statusText.textContent = 'Camera Active';
        statusIndicator.className = 'w-3 h-3 bg-green-400 rounded-full';
        
        // Store stream reference for cleanup
        window.webcamStream = stream;
        
        console.log('Webcam initialized successfully');
    })
    .catch(function(err) {
        // Error handling
        console.error('Error accessing webcam:', err);
        statusText.textContent = 'Camera Blocked';
        statusIndicator.className = 'w-3 h-3 bg-red-400 rounded-full';
        
        // Show helpful message based on error
        if (err.name === 'NotAllowedError') {
            statusText.textContent = 'Camera Permission Denied';
        } else if (err.name === 'NotFoundError') {
            statusText.textContent = 'No Camera Found';
        } else {
            statusText.textContent = 'Camera Error';
        }
    });
}

// Initialize webcam when page loads
if (document.getElementById('webcam-video')) {
    document.addEventListener('DOMContentLoaded', function() {
        // Delay webcam initialization to ensure all elements are loaded
        setTimeout(initWebcam, 1000);
    });
}

// Cleanup webcam stream when leaving page
window.addEventListener('beforeunload', function() {
    if (window.webcamStream) {
        window.webcamStream.getTracks().forEach(track => track.stop());
    }
});

// Clean transcript with AI (correct mispronunciations, grammar)
async function cleanTranscriptWithAI(rawTranscript) {
    if (!rawTranscript) return rawTranscript;

    try {
        const apiKey = await getApiKey();
        if (!apiKey) {
            console.warn('API key not loaded, skipping AI cleaning');
            return rawTranscript;
        }

        const prompt = `Clean this spoken transcript for an interview response. Correct mispronunciations, grammar, and make it professional: "${rawTranscript}"
Output only the cleaned text.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
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

// Real Gemini API integration for AI-powered tone analysis
async function getToneAnalysisFromAI(transcript, audioMetrics) {
    if (!transcript) return { feedback: 'No speech detected for analysis.' };

    try {
        const apiKey = await getApiKey();
        if (!apiKey) {
            return { feedback: 'API key not loaded. Please check .env file.' };
        }

        const prompt = `Analyze this interview response for communication skills, confidence, tone, and delivery. Provide constructive feedback in 1-2 sentences.

Transcript: "${transcript}"
Audio Metrics: Volume: ${audioMetrics.volume}%, Pitch: ${audioMetrics.pitch}Hz, Duration: ${audioMetrics.duration}s, Speaking Rate: ${audioMetrics.speakingRate} WPM

Focus on: clarity, confidence level, pacing, and areas for improvement.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        const feedback = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate AI feedback.';

        return { feedback: feedback.trim() };
    } catch (error) {
        console.error('AI tone analysis error:', error);
        return { feedback: 'AI analysis unavailable. Check API key and connection.' };
    }
}

// Gemini API integration for AI interviewer responses
async function getAIResponse(userInput, questionContext) {
    try {
        const apiKey = await getApiKey();
        if (!apiKey) {
            return "Got it. Let's move to the next question.";
        }

        const prompt = `As a professional interviewer, after hearing the candidate's response, provide a very brief acknowledgment (1-2 words max) and immediately ask the next appropriate follow-up question. Keep it natural and conversational.

Question: ${questionContext}
Candidate's Response: ${userInput}

Output format:
[Brief acknowledgment]. [Next question]?`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Got it. Let's continue.";

        return aiResponse.trim();
    } catch (error) {
        console.error('Error getting AI response:', error);
        // Fallback to basic response
        return "Got it. Let's move to the next question.";
    }
}

// Initialize voice systems (synthesis only, recognition replaced with MediaRecorder)
function initVoiceSystems() {
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
        AppState.speechSynthesis = window.speechSynthesis;
    }
}

// Enhanced speech synthesis with better voice selection and queuing
function speakText(text) {
    if (AppState.speechSynthesis) {
        // If speech is paused, resume from where it left off
        if (AppState.speechPaused && AppState.pausedSpeech) {
            AppState.speechSynthesis.resume();
            AppState.speechPaused = false;
            AppState.pausedSpeech = null;
            return;
        }

        // Add to speech queue instead of interrupting
        const utterance = new SpeechSynthesisUtterance(text);

        // Get selected avatar to choose appropriate voice
        const setupData = JSON.parse(sessionStorage.getItem('interviewSetup') || '{}');
        const selectedAvatar = setupData.selectedAvatar || 'female-1';

        // Try to find a voice based on avatar gender
        const voices = AppState.speechSynthesis.getVoices();
        let selectedVoice = null;

        if (selectedAvatar === 'female-1') {
            // Sarah - prefer female voices
            selectedVoice = voices.find(voice =>
                voice.name.toLowerCase().includes('female') ||
                voice.name.toLowerCase().includes('woman') ||
                voice.name.toLowerCase().includes('samantha') ||
                voice.name.toLowerCase().includes('susan') ||
                (voice.name.toLowerCase().includes('google') && voice.name.toLowerCase().includes('us female')) ||
                (voice.name.toLowerCase().includes('microsoft') && voice.name.toLowerCase().includes('female'))
            );
        } else if (selectedAvatar === 'male-1') {
            // Michael - prefer male voices
            selectedVoice = voices.find(voice =>
                voice.name.toLowerCase().includes('male') ||
                voice.name.toLowerCase().includes('man') ||
                voice.name.toLowerCase().includes('david') ||
                voice.name.toLowerCase().includes('james') ||
                (voice.name.toLowerCase().includes('google') && voice.name.toLowerCase().includes('us male')) ||
                (voice.name.toLowerCase().includes('microsoft') && voice.name.toLowerCase().includes('male'))
            );
        } else {
            // Alex (diverse) - use default or neutral voice
            selectedVoice = voices.find(voice =>
                voice.lang.startsWith('en-US') &&
                !voice.name.toLowerCase().includes('female') &&
                !voice.name.toLowerCase().includes('male')
            );
        }

        // Fallback to any English voice if specific voice not found
        if (!selectedVoice) {
            selectedVoice = voices.find(voice =>
                voice.lang.startsWith('en-US') ||
                voice.lang.startsWith('en-GB')
            );
        }

        // Set the voice if found
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        utterance.rate = 0.8;
        utterance.pitch = 1;
        utterance.volume = 0.8;

        // Store text for potential replay
        utterance.storedText = text;

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
            // Process next item in queue after a natural pause
            AppState.speechQueue.shift();
            if (AppState.speechQueue.length > 0) {
                // Add 1-2 second pause between messages for natural conversation flow
                setTimeout(() => {
                    if (AppState.speechQueue.length > 0) {
                        AppState.speechSynthesis.speak(AppState.speechQueue[0]);
                    }
                }, 1500); // 1.5 second pause
            }
        };

        utterance.onpause = () => {
            AppState.speechPaused = true;
            AppState.pausedSpeech = utterance;
        };

        utterance.onresume = () => {
            AppState.speechPaused = false;
            AppState.pausedSpeech = null;
        };

        // Add to queue and speak if nothing is currently speaking
        AppState.speechQueue.push(utterance);
        if (AppState.speechQueue.length === 1 && !AppState.speechPaused) {
            AppState.speechSynthesis.speak(utterance);
        }
    }
}

// Pause current speech
function pauseSpeech() {
    if (AppState.speechSynthesis && AppState.speechSynthesis.speaking && !AppState.speechSynthesis.paused) {
        AppState.speechSynthesis.pause();
    }
}

// Resume paused speech
function resumeSpeech() {
    if (AppState.speechSynthesis && AppState.speechSynthesis.paused) {
        AppState.speechSynthesis.resume();
    }
}

// Replay last spoken text
function replayLastSpeech() {
    if (AppState.speechQueue.length > 0) {
        const lastUtterance = AppState.speechQueue[AppState.speechQueue.length - 1];
        if (lastUtterance.storedText) {
            speakText(lastUtterance.storedText);
        }
    }
}

async function getApiKey() {
    if (window.geminiApiKey) return window.geminiApiKey;

    try {
        const response = await fetch('env.txt');
        const text = await response.text();
        const lines = text.split('\n');
        for (let line of lines) {
            if (line.startsWith('GEMINI_API_KEY=')) {
                window.geminiApiKey = line.split('=')[1].trim().replace(/"/g, '');
                return window.geminiApiKey;
            }
        }
    } catch (e) {
        console.error('Failed to load API key from env.txt');
    }
    return null; // Will cause fallback in functions
}

// Request microphone permissions explicitly
function requestMicrophonePermission() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        return navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function(stream) {
                // Success - microphone permission granted
                stream.getTracks().forEach(track => track.stop());
                return true;
            })
            .catch(function(err) {
                console.error('Microphone permission denied:', err);
                return false;
            });
    }
    return Promise.resolve(false);
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Request microphone permission on page load
    requestMicrophonePermission().then(granted => {
        if (granted) {
            console.log('Microphone permission granted');
        } else {
            console.log('Microphone permission not granted');
            showNotification('Microphone permission required for voice features', 'warning');
        }
    });
    
    // Initialize voice systems
    initVoiceSystems();
});