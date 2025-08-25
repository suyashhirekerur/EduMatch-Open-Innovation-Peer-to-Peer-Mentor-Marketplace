// Global variables
let currentUser = null;
let currentMentor = null;
let currentRating = 0;

// Sample data
const sampleMentors = [
    {
        id: 1,
        name: "Sarah Johnson",
        domain: "Programming",
        skills: ["JavaScript", "React", "Node.js", "MongoDB"],
        experience: "5+ years",
        education: "CS, MIT",
        bio: "Full-stack developer with 5+ years experience in modern web technologies.",
        rating: 4.8,
        reviews: 23
    },
    {
        id: 2,
        name: "David Chen",
        domain: "Design",
        skills: ["UI/UX", "Figma", "Photoshop", "Design Systems"],
        experience: "3-5 years",
        education: "Design, Stanford",
        bio: "UX designer passionate about creating intuitive digital experiences.",
        rating: 4.9,
        reviews: 31
    },
    {
        id: 3,
        name: "Emily Rodriguez",
        domain: "Marketing",
        skills: ["Digital Marketing", "SEO", "Content Strategy", "Analytics"],
        experience: "3-5 years",
        education: "Marketing, UCLA",
        bio: "Digital marketing specialist with expertise in growth strategies.",
        rating: 4.7,
        reviews: 18
    },
    {
        id: 4,
        name: "Alex Kumar",
        domain: "Data Science",
        skills: ["Python", "Machine Learning", "SQL", "Tableau"],
        experience: "5+ years",
        education: "Data Science, Berkeley",
        bio: "Data scientist specializing in ML and predictive analytics.",
        rating: 4.8,
        reviews: 27
    },
    {
        id: 5,
        name: "Lisa Wang",
        domain: "Entrepreneurship",
        skills: ["Startup Strategy", "Fundraising", "Business Development", "Leadership"],
        experience: "5+ years",
        education: "MBA, Harvard",
        bio: "Serial entrepreneur and startup advisor with multiple successful exits.",
        rating: 4.9,
        reviews: 42
    }
];

// Initialize app
document.addEventListener('DOMContentLoaded', function () {
    initializeEventListeners();
    loadMentors();
});

function initializeEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

    // Signup form
    document.getElementById('signupForm').addEventListener('submit', handleSignup);

    // Profile form
    document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);

    // Book session form
    document.getElementById('bookSessionForm').addEventListener('submit', handleBookSession);

    // Review form
    document.getElementById('reviewForm').addEventListener('submit', handleReviewSubmit);

    // Rating stars
    document.querySelectorAll('#ratingInput i').forEach(star => {
        star.addEventListener('click', function () {
            setRating(parseInt(this.getAttribute('data-rating')));
        });
    });

    // Search input
    document.getElementById('searchInput').addEventListener('keyup', function (e) {
        if (e.key === 'Enter') {
            searchMentors();
        }
    });

    // Message input
    document.getElementById('messageInput').addEventListener('keyup', function (e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

function showScreen(screenName) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // Show target screen
    const targetScreen = document.getElementById(screenName + 'Screen');
    if (targetScreen) {
        targetScreen.classList.add('active');
    }

    // Update navigation
    if (screenName === 'home' || screenName === 'mentors' || screenName === 'sessions' || screenName === 'profile') {
        if (!currentUser) {
            showScreen('login');
            return;
        }
    }
}

function showTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName + 'Tab').classList.add('active');

    if (tabName === 'recommendations') {
        loadRecommendations();
    }
}

function showSessionTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName + 'Tab').classList.add('active');

    loadSessions(tabName);
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Simple authentication (in real app, this would be server-side)
    if (email && password) {
        currentUser = {
            id: Date.now(),
            name: email.split('@')[0],
            email: email,
            domain: "Programming",
            skills: ["JavaScript", "HTML", "CSS"],
            experience: "1-3",
            education: "",
            bio: ""
        };

        updateUIForLoggedInUser();
        showScreen('home');
    }
}

function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    if (name && email && password) {
        currentUser = {
            id: Date.now(),
            name: name,
            email: email,
            domain: "Programming",
            skills: ["JavaScript", "HTML", "CSS"],
            experience: "0-1",
            education: "",
            bio: ""
        };

        updateUIForLoggedInUser();
        showScreen('profile');
    }
}

function updateUIForLoggedInUser() {
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'inline-block';

    // Populate profile form
    if (currentUser) {
        document.getElementById('profileName').value = currentUser.name;
        document.getElementById('profileEmail').value = currentUser.email;
        document.getElementById('profileDomain').value = currentUser.domain;
        document.getElementById('profileSkills').value = currentUser.skills.join(', ');
        document.getElementById('profileEducation').value = currentUser.education;
        document.getElementById('profileExperience').value = currentUser.experience;
        document.getElementById('profileBio').value = currentUser.bio;
    }
}

function logout() {
    currentUser = null;
    document.getElementById('loginBtn').style.display = 'inline-block';
    document.getElementById('logoutBtn').style.display = 'none';
    showScreen('welcome');
}

function handleProfileUpdate(e) {
    e.preventDefault();
    if (currentUser) {
        currentUser.name = document.getElementById('profileName').value;
        currentUser.domain = document.getElementById('profileDomain').value;
        currentUser.skills = document.getElementById('profileSkills').value.split(',').map(s => s.trim());
        currentUser.education = document.getElementById('profileEducation').value;
        currentUser.experience = document.getElementById('profileExperience').value;
        currentUser.bio = document.getElementById('profileBio').value;

        alert('Profile updated successfully!');
    }
}

function loadMentors() {
    const mentorFeed = document.getElementById('mentorFeed');
    const mentorsList = document.getElementById('mentorsList');

    const mentorHTML = sampleMentors.map(mentor => createMentorCard(mentor)).join('');

    if (mentorFeed) mentorFeed.innerHTML = mentorHTML;
    if (mentorsList) mentorsList.innerHTML = mentorHTML;
}

function createMentorCard(mentor) {
    return `
                <div class="profile-card">
                    <div class="profile-header">
                        <div class="profile-avatar">
                            ${mentor.name.charAt(0)}
                        </div>
                        <div class="profile-info">
                            <h3>${mentor.name}</h3>
                            <p>${mentor.domain} • ${mentor.experience}</p>
                            <p>${mentor.education}</p>
                        </div>
                    </div>
                    <div class="rating">
                        <div class="stars">
                            ${'★'.repeat(Math.floor(mentor.rating))}${'☆'.repeat(5 - Math.floor(mentor.rating))}
                        </div>
                        <span>${mentor.rating} (${mentor.reviews} reviews)</span>
                    </div>
                    <p style="margin-bottom: 15px; color: #666;">${mentor.bio}</p>
                    <div class="skills-tags">
                        ${mentor.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <button class="btn btn-primary" onclick="openBookSessionModal(${mentor.id})">
                            <i class="fas fa-calendar"></i> Book Session
                        </button>
                        <button class="btn btn-secondary" onclick="openChatModal(${mentor.id})">
                            <i class="fas fa-comment"></i> Chat
                        </button>
                        <button class="btn btn-secondary" onclick="openReviewModal(${mentor.id})">
                            <i class="fas fa-star"></i> Review
                        </button>
                    </div>
                </div>
            `;
}

function searchMentors() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const domainFilter = document.getElementById('domainFilter').value;

    const filteredMentors = sampleMentors.filter(mentor => {
        const matchesSearch = mentor.name.toLowerCase().includes(searchTerm) ||
            mentor.skills.some(skill => skill.toLowerCase().includes(searchTerm)) ||
            mentor.domain.toLowerCase().includes(searchTerm);
        const matchesDomain = !domainFilter || mentor.domain === domainFilter;

        return matchesSearch && matchesDomain;
    });

    const mentorHTML = filteredMentors.map(mentor => createMentorCard(mentor)).join('');
    document.getElementById('mentorFeed').innerHTML = mentorHTML || '<p>No mentors found matching your criteria.</p>';
}

function filterMentors() {
    const searchTerm = document.getElementById('mentorSearchInput').value.toLowerCase();
    const domainFilter = document.getElementById('mentorDomainFilter').value;

    const filteredMentors = sampleMentors.filter(mentor => {
        const matchesSearch = mentor.name.toLowerCase().includes(searchTerm) ||
            mentor.skills.some(skill => skill.toLowerCase().includes(searchTerm));
        const matchesDomain = !domainFilter || mentor.domain === domainFilter;

        return matchesSearch && matchesDomain;
    });

    const mentorHTML = filteredMentors.map(mentor => createMentorCard(mentor)).join('');
    document.getElementById('mentorsList').innerHTML = mentorHTML || '<p>No mentors found matching your criteria.</p>';
}

function loadRecommendations() {
    if (!currentUser) return;

    // Simple recommendation based on user's domain
    const recommendedMentors = sampleMentors.filter(mentor =>
        mentor.domain === currentUser.domain ||
        mentor.skills.some(skill => currentUser.skills.includes(skill))
    );

    const recommendationHTML = recommendedMentors.map(mentor => createMentorCard(mentor)).join('');
    document.getElementById('recommendations').innerHTML = recommendationHTML || '<p>No recommendations available. Please update your profile.</p>';
}

function openBookSessionModal(mentorId) {
    currentMentor = sampleMentors.find(m => m.id === mentorId);
    document.getElementById('bookSessionModal').style.display = 'block';

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('sessionDate').min = today;
}

function handleBookSession(e) {
    e.preventDefault();
    if (!currentUser || !currentMentor) return;

    const date = document.getElementById('sessionDate').value;
    const time = document.getElementById('sessionTime').value;
    const duration = document.getElementById('sessionDuration').value;
    const topic = document.getElementById('sessionTopic').value;

    const session = {
        id: Date.now(),
        mentorId: currentMentor.id,
        mentorName: currentMentor.name,
        date: date,
        time: time,
        duration: duration,
        topic: topic,
        status: 'upcoming'
    };

    // Store session (in real app, this would be saved to database)
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    sessions.push(session);
    localStorage.setItem('sessions', JSON.stringify(sessions));

    alert('Session booked successfully!');
    closeModal('bookSessionModal');
    document.getElementById('bookSessionForm').reset();
}

function openChatModal(mentorId) {
    currentMentor = sampleMentors.find(m => m.id === mentorId);
    document.getElementById('chatTitle').textContent = `Chat with ${currentMentor.name}`;
    document.getElementById('chatModal').style.display = 'block';

    loadChatMessages();
}

function loadChatMessages() {
    const chatContainer = document.getElementById('chatContainer');
    const messages = [
        { type: 'received', text: `Hi! I'm ${currentMentor.name}. How can I help you today?`, time: '10:00 AM' },
        { type: 'sent', text: 'Hi! I would like to learn more about JavaScript frameworks.', time: '10:02 AM' },
        { type: 'received', text: 'Great! Are you familiar with React or would you like to start with the basics?', time: '10:03 AM' }
    ];

    chatContainer.innerHTML = messages.map(msg =>
        `<div class="message ${msg.type}">
                    <div>${msg.text}</div>
                    <small style="opacity: 0.7;">${msg.time}</small>
                </div>`
    ).join('');

    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();

    if (message) {
        const chatContainer = document.getElementById('chatContainer');
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        chatContainer.innerHTML += `
                    <div class="message sent">
                        <div>${message}</div>
                        <small style="opacity: 0.7;">${time}</small>
                    </div>
                `;

        input.value = '';
        chatContainer.scrollTop = chatContainer.scrollHeight;

        // Simulate mentor response
        setTimeout(() => {
            chatContainer.innerHTML += `
                        <div class="message received">
                            <div>Thanks for your message! I'll get back to you soon.</div>
                            <small style="opacity: 0.7;">${time}</small>
                        </div>
                    `;
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 1000);
    }
}

function startVideoCall() {
    alert('Video call feature would integrate with services like Zoom, Google Meet, or custom WebRTC implementation.');
}

function openReviewModal(mentorId) {
    currentMentor = sampleMentors.find(m => m.id === mentorId);
    document.getElementById('reviewModal').style.display = 'block';
    setRating(0);
}

function setRating(rating) {
    currentRating = rating;
    const stars = document.querySelectorAll('#ratingInput i');

    stars.forEach((star, index) => {
        if (index < rating) {
            star.className = 'fas fa-star';
            star.style.color = '#ffd700';
        } else {
            star.className = 'far fa-star';
            star.style.color = '#ddd';
        }
    });
}

function handleReviewSubmit(e) {
    e.preventDefault();
    if (!currentRating) {
        alert('Please select a rating');
        return;
    }

    const reviewText = document.getElementById('reviewText').value;

    const review = {
        id: Date.now(),
        mentorId: currentMentor.id,
        rating: currentRating,
        text: reviewText,
        date: new Date().toLocaleDateString()
    };

    // Store review (in real app, this would be saved to database)
    const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    reviews.push(review);
    localStorage.setItem('reviews', JSON.stringify(reviews));

    alert('Review submitted successfully!');
    closeModal('reviewModal');
    document.getElementById('reviewForm').reset();
    setRating(0);
}

function loadSessions(type) {
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    const filteredSessions = sessions.filter(session => session.status === type);

    const container = document.getElementById(type + 'Sessions');

    if (filteredSessions.length === 0) {
        container.innerHTML = `<p>No ${type} sessions found.</p>`;
        return;
    }

    const sessionHTML = filteredSessions.map(session => `
                <div class="session-card">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                        <div>
                            <h4>${session.mentorName}</h4>
                            <p><i class="fas fa-calendar"></i> ${session.date} at ${session.time}</p>
                            <p><i class="fas fa-clock"></i> ${session.duration} minutes</p>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-secondary" onclick="openChatModal(${session.mentorId})">
                                <i class="fas fa-comment"></i>
                            </button>
                            ${type === 'completed' ?
            `<button class="btn btn-primary" onclick="openReviewModal(${session.mentorId})">
                                    <i class="fas fa-star"></i> Review
                                </button>` :
            `<button class="btn btn-primary" onclick="joinSession(${session.id})">
                                    <i class="fas fa-video"></i> Join
                                </button>`
        }
                        </div>
                    </div>
                    <p><strong>Topic:</strong> ${session.topic}</p>
                </div>
            `).join('');

    container.innerHTML = sessionHTML;
}

function joinSession(sessionId) {
    alert('Joining session... This would integrate with video calling services.');
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modals when clicking outside
window.onclick = function (event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Add some sample sessions for demo
if (!localStorage.getItem('sessions')) {
    const sampleSessions = [
        {
            id: 1,
            mentorId: 1,
            mentorName: 'Sarah Johnson',
            date: '2025-08-25',
            time: '14:00',
            duration: '60',
            topic: 'React best practices and hooks',
            status: 'upcoming'
        },
        {
            id: 2,
            mentorId: 2,
            mentorName: 'David Chen',
            date: '2025-08-20',
            time: '10:00',
            duration: '90',
            topic: 'UI/UX design principles',
            status: 'completed'
        }
    ];
    localStorage.setItem('sessions', JSON.stringify(sampleSessions));
}

/**
 * Requests access to the user's camera and microphone using WebRTC.
 * This is the crucial step for any video/audio communication.
 */
function requestMediaAccess() {
    const videoElement = document.getElementById('localVideo');
    const statusElement = document.getElementById('statusMessage');
    statusElement.textContent = 'Requesting access...';

    // 1. Check if the browser supports media devices
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        statusElement.textContent = 'Error: Your browser does not support the Media Devices API.';
        return;
    }

    // 2. Configure constraints: we request both video and audio
    const constraints = {
        video: true,
        audio: true
    };

    // 3. Request the media stream
    navigator.mediaDevices.getUserMedia(constraints)
        .then(function (stream) {
            // SUCCESS: User granted permission

            // Set the local video element's source to the captured stream
            videoElement.srcObject = stream;

            statusElement.textContent = 'Success! Camera and microphone access granted.';
            console.log('Local stream running:', stream);

            // In a real application, you would now use this 'stream' to 
            // connect to the RTCPeerConnection (as shown in the React example).
        })
        .catch(function (err) {
            // ERROR: Permission denied or device not found
            let message = 'Error accessing media: ';
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                message += "You denied permission to access your camera/mic.";
            } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                message += "No camera or microphone found on your device.";
            } else {
                message += err.name;
            }
            statusElement.textContent = message;
            console.error('Error accessing media devices:', err);
        });
}