// Game State Management
class GameState {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.state = 'menu'; // menu, playing, paused, gameOver
        this.score = 0;
        this.lives = 3;
        this.distance = 0;
        this.speed = 2;
        this.gameTime = 0;
        this.selectedCar = 'lightning';
        
        // Game objects
        this.player = {
            x: 375,
            y: 500,
            width: 50,
            height: 80,
            speed: 5
        };
        
        this.obstacles = [];
        this.powerUps = [];
        this.coins = [];
        this.particles = [];
        this.activePowerUps = {};
        
        // Input handling
        this.keys = {};
        
        // Performance tracking
        this.lastTime = 0;
        this.fps = 60;
    }
}

// User Management System
class UserManager {
    constructor() {
        this.currentUser = null;
        this.users = JSON.parse(localStorage.getItem('turboRushUsers') || '{}');
        this.loadCurrentUser();
    }
    
    register(username, email, password) {
        if (this.users[username]) {
            throw new Error('Username already exists');
        }
        
        const user = {
            username,
            email,
            password: this.hashPassword(password),
            level: 1,
            experience: 0,
            totalScore: 0,
            totalDistance: 0,
            totalPlayTime: 0,
            gamesPlayed: 0,
            achievements: [],
            createdAt: Date.now()
        };
        
        this.users[username] = user;
        this.saveUsers();
        this.login(username, password);
        return user;
    }
    
    login(username, password) {
        const user = this.users[username];
        if (!user || user.password !== this.hashPassword(password)) {
            throw new Error('Invalid username or password');
        }
        
        this.currentUser = user;
        localStorage.setItem('turboRushCurrentUser', username);
        this.updateUI();
        return user;
    }
    
    logout() {
        this.currentUser = null;
        localStorage.removeItem('turboRushCurrentUser');
        this.updateUI();
    }
    
    updateStats(score, distance, playTime) {
        if (!this.currentUser) return;
        
        this.currentUser.totalScore += score;
        this.currentUser.totalDistance += distance;
        this.currentUser.totalPlayTime += playTime;
        this.currentUser.gamesPlayed++;
        
        // Level progression
        const newExperience = this.currentUser.experience + Math.floor(score / 10);
        const newLevel = Math.floor(newExperience / 1000) + 1;
        
        if (newLevel > this.currentUser.level) {
            this.currentUser.level = newLevel;
            showNotification(`Level Up! You are now level ${newLevel}`, 'success');
        }
        
        this.currentUser.experience = newExperience;
        this.saveUsers();
        this.updateUI();
    }
    
    addAchievement(achievementId) {
        if (!this.currentUser || this.currentUser.achievements.includes(achievementId)) return;
        
        this.currentUser.achievements.push(achievementId);
        this.saveUsers();
        
        const achievement = achievements[achievementId];
        if (achievement) {
            showNotification(`Achievement Unlocked: ${achievement.name}`, 'success');
        }
    }
    
    hashPassword(password) {
        // Simple hash for demo purposes - use proper hashing in production
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }
    
    loadCurrentUser() {
        const username = localStorage.getItem('turboRushCurrentUser');
        if (username && this.users[username]) {
            this.currentUser = this.users[username];
        }
        this.updateUI();
    }
    
    saveUsers() {
        localStorage.setItem('turboRushUsers', JSON.stringify(this.users));
    }
    
    updateUI() {
        const userName = document.getElementById('userName');
        const dropdownUserName = document.getElementById('dropdownUserName');
        const loginBtn = document.querySelector('[onclick="showLoginModal()"]');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (this.currentUser) {
            userName.textContent = this.currentUser.username;
            dropdownUserName.textContent = this.currentUser.username;
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'flex';
            
            // Update profile section
            this.updateProfileSection();
        } else {
            userName.textContent = 'Guest';
            dropdownUserName.textContent = 'Guest Player';
            loginBtn.style.display = 'flex';
            logoutBtn.style.display = 'none';
        }
    }
    
    updateProfileSection() {
        if (!this.currentUser) return;
        
        document.getElementById('profileName').textContent = this.currentUser.username;
        document.getElementById('profileLevel').textContent = this.currentUser.level;
        document.getElementById('profileScore').textContent = this.currentUser.totalScore.toLocaleString();
        document.getElementById('profileDistance').textContent = `${this.currentUser.totalDistance.toLocaleString()}m`;
        document.getElementById('profileTime').textContent = `${Math.floor(this.currentUser.totalPlayTime / 3600)}h`;
        
        // Update level progress
        const currentLevelExp = (this.currentUser.level - 1) * 1000;
        const nextLevelExp = this.currentUser.level * 1000;
        const progress = ((this.currentUser.experience - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100;
        document.getElementById('levelProgress').style.width = `${progress}%`;
        
        // Update achievements
        this.updateAchievements();
    }
    
    updateAchievements() {
        const achievementGrid = document.getElementById('achievementGrid');
        achievementGrid.innerHTML = '';
        
        Object.keys(achievements).forEach(id => {
            const achievement = achievements[id];
            const unlocked = this.currentUser && this.currentUser.achievements.includes(id);
            
            const achievementEl = document.createElement('div');
            achievementEl.className = `achievement ${unlocked ? 'unlocked' : ''}`;
            achievementEl.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-name">${achievement.name}</div>
            `;
            achievementGrid.appendChild(achievementEl);
        });
    }
}

// Car definitions with enhanced stats
const carTypes = {
    lightning: {
        name: 'Lightning Bolt',
        type: 'Sports Car',
        speed: 85,
        acceleration: 90,
        handling: 80,
        color: '#00f5ff',
        description: 'Perfect balance of speed and control',
        icon: '🏎️'
    },
    velocity: {
        name: 'Velocity X',
        type: 'Supercar',
        speed: 95,
        acceleration: 85,
        handling: 75,
        color: '#ff6b35',
        description: 'Maximum speed with sleek design',
        icon: '🚗'
    },
    quantum: {
        name: 'Quantum Racer',
        type: 'Hypercar',
        speed: 100,
        acceleration: 95,
        handling: 70,
        color: '#ffd700',
        description: 'Cutting-edge technology meets raw power',
        icon: '🏁'
    },
    tesla: {
        name: 'Tesla Storm',
        type: 'Electric',
        speed: 80,
        acceleration: 100,
        handling: 85,
        color: '#00ff88',
        description: 'Instant torque and eco-friendly',
        icon: '⚡'
    },
    thunder: {
        name: 'Thunder Beast',
        type: 'Muscle Car',
        speed: 90,
        acceleration: 75,
        handling: 65,
        color: '#8b00ff',
        description: 'Raw power and aggressive styling',
        icon: '💪'
    },
    phoenix: {
        name: 'Phoenix F1',
        type: 'Formula Car',
        speed: 100,
        acceleration: 80,
        handling: 100,
        color: '#ff1744',
        description: 'Professional racing precision',
        icon: '🔥'
    }
};

// Power-up types
const powerUpTypes = {
    shield: { color: '#00ff88', duration: 5000, icon: '🛡️' },
    nitro: { color: '#ff6b35', duration: 3000, icon: '🚀' },
    multiplier: { color: '#ffd700', duration: 8000, icon: '✨' },
    extraLife: { color: '#ff69b4', duration: 0, icon: '❤️' }
};

// Achievement system
const achievements = {
    firstRace: { name: 'First Race', icon: '🏁', description: 'Complete your first race' },
    speedDemon: { name: 'Speed Demon', icon: '⚡', description: 'Reach 100 km/h' },
    survivor: { name: 'Survivor', icon: '💪', description: 'Survive for 2 minutes' },
    collector: { name: 'Collector', icon: '💰', description: 'Collect 100 coins' },
    scorer: { name: 'High Scorer', icon: '🏆', description: 'Score 1000 points' },
    distance: { name: 'Long Distance', icon: '🛣️', description: 'Travel 5000m' },
    powerUp: { name: 'Power User', icon: '⭐', description: 'Use 10 power-ups' },
    perfectRun: { name: 'Perfect Run', icon: '💎', description: 'Complete a race without taking damage' }
};

// Global instances
let gameState;
let userManager;

// Initialize the game
function init() {
    gameState = new GameState();
    userManager = new UserManager();
    
    gameState.canvas = document.getElementById('gameCanvas');
    gameState.ctx = gameState.canvas.getContext('2d');
    
    // Set canvas size
    gameState.canvas.width = 800;
    gameState.canvas.height = 600;
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize UI
    initializeUI();
    
    // Start game loop
    gameLoop();
    
    // Start background effects
    startBackgroundEffects();
    
    // Hide loader
    setTimeout(() => {
        document.getElementById('loader').classList.add('hidden');
    }, 3000);
}

function setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        gameState.keys[e.key] = true;
    });
    
    document.addEventListener('keyup', (e) => {
        gameState.keys[e.key] = false;
    });
    
    // Mouse movement for cursor trail
    document.addEventListener('mousemove', (e) => {
        updateCursorTrail(e.clientX, e.clientY);
    });
    
    // Game controls
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('pauseBtn').addEventListener('click', pauseGame);
    document.getElementById('resetBtn').addEventListener('click', resetGame);
    document.getElementById('overlayBtn').addEventListener('click', startGame);
    
    // Mobile controls
    setupMobileControls();
    
    // Navigation
    setupNavigation();
    
    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    
    // Auth forms
    setupAuthForms();
    
    // Back to top
    setupBackToTop();
}

function setupMobileControls() {
    const mobileControls = {
        leftBtn: () => gameState.keys['ArrowLeft'] = true,
        rightBtn: () => gameState.keys['ArrowRight'] = true,
        upBtn: () => gameState.keys['ArrowUp'] = true,
        downBtn: () => gameState.keys['ArrowDown'] = true
    };
    
    Object.keys(mobileControls).forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                mobileControls[btnId]();
            });
            
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                Object.keys(gameState.keys).forEach(key => gameState.keys[key] = false);
            });
        }
    });
}

function setupNavigation() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Mobile menu toggle
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
}

function setupAuthForms() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            userManager.login(username, password);
            closeModal('loginModal');
            showNotification('Login successful!', 'success');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });
    
    // Register form
    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        
        try {
            userManager.register(username, email, password);
            closeModal('loginModal');
            showNotification('Registration successful!', 'success');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });
}

function setupBackToTop() {
    const backToTop = document.getElementById('backToTop');
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });
    
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function initializeUI() {
    // Initialize garage
    initializeGarage();
    
    // Initialize leaderboard
    updateLeaderboard();
    
    // Animate hero stats
    animateStats();
    
    // Update profile
    userManager.updateProfileSection();
}

function initializeGarage() {
    const garageGrid = document.getElementById('garageGrid');
    garageGrid.innerHTML = '';
    
    Object.keys(carTypes).forEach(carId => {
        const car = carTypes[carId];
        const carCard = document.createElement('div');
        carCard.className = `car-card ripple-btn ${carId === gameState.selectedCar ? 'selected' : ''}`;
        carCard.onclick = () => selectCar(carId);
        
        carCard.innerHTML = `
            <div class="car-visual" style="background: linear-gradient(135deg, ${car.color}, ${car.color}88);">
                <span style="font-size: 3rem;">${car.icon}</span>
            </div>
            <div class="car-info">
                <h3>${car.name}</h3>
                <div class="car-type">${car.type}</div>
                <div class="car-stats">
                    <div class="car-stat">
                        <span class="stat-name">Speed</span>
                        <div class="stat-bar">
                            <div class="stat-fill" style="width: ${car.speed}%; background: linear-gradient(90deg, ${car.color}, ${car.color}88);"></div>
                        </div>
                        <span class="stat-number">${car.speed}</span>
                    </div>
                    <div class="car-stat">
                        <span class="stat-name">Acceleration</span>
                        <div class="stat-bar">
                            <div class="stat-fill" style="width: ${car.acceleration}%; background: linear-gradient(90deg, ${car.color}, ${car.color}88);"></div>
                        </div>
                        <span class="stat-number">${car.acceleration}</span>
                    </div>
                    <div class="car-stat">
                        <span class="stat-name">Handling</span>
                        <div class="stat-bar">
                            <div class="stat-fill" style="width: ${car.handling}%; background: linear-gradient(90deg, ${car.color}, ${car.color}88);"></div>
                        </div>
                        <span class="stat-number">${car.handling}</span>
                    </div>
                </div>
            </div>
        `;
        
        garageGrid.appendChild(carCard);
    });
}

function selectCar(carId) {
    gameState.selectedCar = carId;
    
    // Update garage UI
    document.querySelectorAll('.car-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
    
    // Update player stats
    updatePlayerStats();
    
    showNotification(`Selected ${carTypes[carId].name}`, 'success');
}

function updatePlayerStats() {
    const selectedCar = carTypes[gameState.selectedCar];
    gameState.player.speed = 3 + (selectedCar.speed / 100) * 2;
    gameState.player.acceleration = selectedCar.acceleration / 100;
    gameState.player.handling = selectedCar.handling / 100;
}

// Game Logic Functions
function startGame() {
    if (gameState.state === 'menu' || gameState.state === 'gameOver') {
        resetGame();
    }
    gameState.state = 'playing';
    document.getElementById('gameOverlay').style.display = 'none';
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('pauseBtn').style.display = 'inline-flex';
    
    // Add first race achievement
    if (userManager.currentUser) {
        userManager.addAchievement('firstRace');
    }
}

function pauseGame() {
    if (gameState.state === 'playing') {
        gameState.state = 'paused';
        document.getElementById('gameOverlay').style.display = 'flex';
        document.getElementById('overlayTitle').textContent = 'Game Paused';
        document.getElementById('overlayMessage').textContent = 'Click to resume racing';
        document.getElementById('overlayBtn').innerHTML = '<span>Resume</span>';
        document.getElementById('startBtn').style.display = 'inline-flex';
        document.getElementById('pauseBtn').style.display = 'none';
    }
}

function resetGame() {
    gameState.state = 'menu';
    gameState.score = 0;
    gameState.lives = 3;
    gameState.distance = 0;
    gameState.gameTime = 0;
    gameState.speed = 2;
    
    gameState.player.x = 375;
    gameState.player.y = 500;
    
    gameState.obstacles = [];
    gameState.powerUps = [];
    gameState.coins = [];
    gameState.particles = [];
    gameState.activePowerUps = {};
    
    document.getElementById('gameOverlay').style.display = 'flex';
    document.getElementById('overlayTitle').textContent = 'Turbo Rush';
    document.getElementById('overlayMessage').textContent = 'Choose your car and start racing!';
    document.getElementById('overlayBtn').innerHTML = '<span>Start Racing</span>';
    document.getElementById('startBtn').style.display = 'inline-flex';
    document.getElementById('pauseBtn').style.display = 'none';
    
    updateUI();
}

function gameLoop(currentTime = 0) {
    const deltaTime = currentTime - gameState.lastTime;
    gameState.lastTime = currentTime;
    
    // Calculate FPS
    gameState.fps = 1000 / deltaTime;
    
    update(deltaTime);
    render();
    requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
    if (gameState.state !== 'playing') return;
    
    gameState.gameTime += deltaTime;
    gameState.distance += gameState.speed;
    
    // Increase difficulty over time
    if (gameState.gameTime % 10000 < deltaTime) {
        gameState.speed += 0.1;
    }
    
    // Update player
    updatePlayer();
    
    // Update game objects
    updateObstacles();
    updatePowerUps();
    updateCoins();
    updateParticles();
    
    // Check collisions
    checkCollisions();
    
    // Spawn new objects
    spawnObjects();
    
    // Update power-ups
    updateActivePowerUps(deltaTime);
    
    // Update UI
    updateUI();
    
    // Check achievements
    checkAchievements();
}

function updatePlayer() {
    const selectedCar = carTypes[gameState.selectedCar];
    const speedMultiplier = selectedCar.speed / 100;
    const handlingMultiplier = selectedCar.handling / 100;
    
    // Handle input
    if (gameState.keys['ArrowLeft'] || gameState.keys['a'] || gameState.keys['A']) {
        gameState.player.x -= gameState.player.speed * handlingMultiplier * 1.2;
    }
    if (gameState.keys['ArrowRight'] || gameState.keys['d'] || gameState.keys['D']) {
        gameState.player.x += gameState.player.speed * handlingMultiplier * 1.2;
    }
    if (gameState.keys['ArrowUp'] || gameState.keys['w'] || gameState.keys['W']) {
        gameState.player.y -= gameState.player.speed * 0.6;
    }
    if (gameState.keys['ArrowDown'] || gameState.keys['s'] || gameState.keys['S']) {
        gameState.player.y += gameState.player.speed * 0.6;
    }
    
    // Apply nitro effect
    if (gameState.activePowerUps.nitro) {
        gameState.player.speed = 8 * speedMultiplier;
        createNitroParticles();
    } else {
        gameState.player.speed = 5 * speedMultiplier;
    }
    
    // Keep player in bounds
    gameState.player.x = Math.max(25, Math.min(gameState.canvas.width - 75, gameState.player.x));
    gameState.player.y = Math.max(50, Math.min(gameState.canvas.height - 100, gameState.player.y));
}

function updateObstacles() {
    gameState.obstacles.forEach((obstacle, index) => {
        obstacle.y += gameState.speed + obstacle.speed;
        
        if (obstacle.y > gameState.canvas.height) {
            gameState.obstacles.splice(index, 1);
            gameState.score += 10;
        }
    });
}

function updatePowerUps() {
    gameState.powerUps.forEach((powerUp, index) => {
        powerUp.y += gameState.speed;
        powerUp.rotation += 0.1;
        
        if (powerUp.y > gameState.canvas.height) {
            gameState.powerUps.splice(index, 1);
        }
    });
}

function updateCoins() {
    gameState.coins.forEach((coin, index) => {
        coin.y += gameState.speed;
        coin.rotation += 0.15;
        
        if (coin.y > gameState.canvas.height) {
            gameState.coins.splice(index, 1);
        }
    });
}

function updateParticles() {
    gameState.particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        particle.alpha = particle.life / particle.maxLife;
        
        if (particle.life <= 0) {
            gameState.particles.splice(index, 1);
        }
    });
}

function updateActivePowerUps(deltaTime) {
    Object.keys(gameState.activePowerUps).forEach(type => {
        gameState.activePowerUps[type] -= deltaTime;
        if (gameState.activePowerUps[type] <= 0) {
            delete gameState.activePowerUps[type];
        }
    });
}

function checkCollisions() {
    // Check obstacle collisions
    gameState.obstacles.forEach((obstacle, index) => {
        if (isColliding(gameState.player, obstacle)) {
            if (!gameState.activePowerUps.shield) {
                gameState.lives--;
                createExplosionParticles(gameState.player.x, gameState.player.y);
                
                if (gameState.lives <= 0) {
                    gameOver();
                } else {
                    // Temporary invincibility
                    gameState.activePowerUps.shield = 1000;
                }
            }
            gameState.obstacles.splice(index, 1);
        }
    });
    
    // Check power-up collisions
    gameState.powerUps.forEach((powerUp, index) => {
        if (isColliding(gameState.player, powerUp)) {
            activatePowerUp(powerUp.type);
            createPowerUpParticles(powerUp.x, powerUp.y, powerUp.type);
            gameState.powerUps.splice(index, 1);
        }
    });
    
    // Check coin collisions
    gameState.coins.forEach((coin, index) => {
        if (isColliding(gameState.player, coin)) {
            const coinValue = gameState.activePowerUps.multiplier ? 20 : 10;
            gameState.score += coinValue;
            createCoinParticles(coin.x, coin.y);
            gameState.coins.splice(index, 1);
        }
    });
}

function isColliding(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

function activatePowerUp(type) {
    const powerUp = powerUpTypes[type];
    
    switch (type) {
        case 'shield':
            gameState.activePowerUps.shield = powerUp.duration;
            showNotification('Shield Activated!', 'success');
            break;
        case 'nitro':
            gameState.activePowerUps.nitro = powerUp.duration;
            showNotification('Nitro Boost!', 'success');
            break;
        case 'multiplier':
            gameState.activePowerUps.multiplier = powerUp.duration;
            showNotification('Score Multiplier Active!', 'success');
            break;
        case 'extraLife':
            gameState.lives++;
            showNotification('Extra Life Gained!', 'success');
            break;
    }
    
    // Achievement for power-up usage
    if (userManager.currentUser) {
        userManager.addAchievement('powerUp');
    }
}

function spawnObjects() {
    // Spawn obstacles
    if (Math.random() < 0.015 + (gameState.speed * 0.001)) {
        gameState.obstacles.push({
            x: Math.random() * (gameState.canvas.width - 60) + 30,
            y: -50,
            width: 50,
            height: 80,
            speed: Math.random() * 2 + 1,
            type: Math.random() > 0.7 ? 'truck' : 'car'
        });
    }
    
    // Spawn power-ups
    if (Math.random() < 0.003) {
        const types = Object.keys(powerUpTypes);
        const type = types[Math.floor(Math.random() * types.length)];
        gameState.powerUps.push({
            x: Math.random() * (gameState.canvas.width - 30) + 15,
            y: -30,
            width: 30,
            height: 30,
            type: type,
            rotation: 0
        });
    }
    
    // Spawn coins
    if (Math.random() < 0.025) {
        gameState.coins.push({
            x: Math.random() * (gameState.canvas.width - 20) + 10,
            y: -20,
            width: 20,
            height: 20,
            rotation: 0
        });
    }
}

function checkAchievements() {
    if (!userManager.currentUser) return;
    
    // Speed achievement
    if (gameState.speed > 10) {
        userManager.addAchievement('speedDemon');
    }
    
    // Survival achievement
    if (gameState.gameTime > 120000) {
        userManager.addAchievement('survivor');
    }
    
    // Score achievements
    if (gameState.score >= 1000) {
        userManager.addAchievement('scorer');
    }
    
    // Distance achievement
    if (gameState.distance >= 5000) {
        userManager.addAchievement('distance');
    }
}

// Particle Effects
function createNitroParticles() {
    for (let i = 0; i < 3; i++) {
        gameState.particles.push({
            x: gameState.player.x + Math.random() * gameState.player.width,
            y: gameState.player.y + gameState.player.height,
            vx: (Math.random() - 0.5) * 2,
            vy: Math.random() * 3 + 2,
            life: 30,
            maxLife: 30,
            color: '#ff6b35',
            size: Math.random() * 5 + 3,
            alpha: 1
        });
    }
}

function createExplosionParticles(x, y) {
    for (let i = 0; i < 15; i++) {
        gameState.particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 60,
            maxLife: 60,
            color: Math.random() > 0.5 ? '#ff6b35' : '#ffd700',
            size: Math.random() * 8 + 4,
            alpha: 1
        });
    }
}

function createPowerUpParticles(x, y, type) {
    const color = powerUpTypes[type].color;
    for (let i = 0; i < 10; i++) {
        gameState.particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 40,
            maxLife: 40,
            color: color,
            size: Math.random() * 6 + 2,
            alpha: 1
        });
    }
}

function createCoinParticles(x, y) {
    for (let i = 0; i < 8; i++) {
        gameState.particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 30,
            maxLife: 30,
            color: '#ffd700',
            size: Math.random() * 4 + 2,
            alpha: 1
        });
    }
}

// Rendering Functions
function render() {
    // Clear canvas with gradient background
    const gradient = gameState.ctx.createLinearGradient(0, 0, 0, gameState.canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    gameState.ctx.fillStyle = gradient;
    gameState.ctx.fillRect(0, 0, gameState.canvas.width, gameState.canvas.height);
    
    // Draw road
    drawRoad();
    
    // Draw game objects
    drawPlayer();
    drawObstacles();
    drawPowerUps();
    drawCoins();
    drawParticles();
    
    // Draw UI elements
    drawPowerUpIndicators();
}

function drawRoad() {
    // Road surface
    gameState.ctx.fillStyle = '#2a2a3e';
    gameState.ctx.fillRect(0, 0, gameState.canvas.width, gameState.canvas.height);
    
    // Road lines with animation
    gameState.ctx.strokeStyle = '#00f5ff';
    gameState.ctx.lineWidth = 3;
    gameState.ctx.setLineDash([30, 20]);
    gameState.ctx.lineDashOffset = -(gameState.gameTime * 0.1) % 50;
    
    // Center line
    gameState.ctx.beginPath();
    gameState.ctx.moveTo(gameState.canvas.width / 2, 0);
    gameState.ctx.lineTo(gameState.canvas.width / 2, gameState.canvas.height);
    gameState.ctx.stroke();
    
    // Side lines
    gameState.ctx.lineWidth = 2;
    gameState.ctx.setLineDash([20, 15]);
    for (let i = 1; i < 4; i++) {
        const x = (gameState.canvas.width / 4) * i;
        gameState.ctx.beginPath();
        gameState.ctx.moveTo(x, 0);
        gameState.ctx.lineTo(x, gameState.canvas.height);
        gameState.ctx.stroke();
    }
    
    gameState.ctx.setLineDash([]);
}

function drawPlayer() {
    const car = carTypes[gameState.selectedCar];
    
    gameState.ctx.save();
    gameState.ctx.translate(gameState.player.x + gameState.player.width/2, gameState.player.y + gameState.player.height/2);
    
    // Shield effect
    if (gameState.activePowerUps.shield) {
        gameState.ctx.strokeStyle = '#00ff88';
        gameState.ctx.lineWidth = 3;
        gameState.ctx.beginPath();
        gameState.ctx.arc(0, 0, gameState.player.width/2 + 10, 0, Math.PI * 2);
        gameState.ctx.stroke();
    }
    
    // Draw car with gradient
    const gradient = gameState.ctx.createLinearGradient(-gameState.player.width/2, -gameState.player.height/2, gameState.player.width/2, gameState.player.height/2);
    gradient.addColorStop(0, car.color);
    gradient.addColorStop(1, car.color + '88');
    gameState.ctx.fillStyle = gradient;
    
    // Car body
    gameState.ctx.fillRect(-gameState.player.width/2, -gameState.player.height/2, gameState.player.width, gameState.player.height);
    
    // Car details
    gameState.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    gameState.ctx.fillRect(-gameState.player.width/3, -gameState.player.height/2 + 5, gameState.player.width * 2/3, gameState.player.height/4);
    
    // Wheels
    gameState.ctx.fillStyle = '#1a1a1a';
    gameState.ctx.fillRect(-gameState.player.width/2 - 6, -gameState.player.height/3, 10, 18);
    gameState.ctx.fillRect(gameState.player.width/2 - 4, -gameState.player.height/3, 10, 18);
    gameState.ctx.fillRect(-gameState.player.width/2 - 6, gameState.player.height/3 - 18, 10, 18);
    gameState.ctx.fillRect(gameState.player.width/2 - 4, gameState.player.height/3 - 18, 10, 18);
    
    gameState.ctx.restore();
}

function drawObstacles() {
    gameState.obstacles.forEach(obstacle => {
        gameState.ctx.fillStyle = obstacle.type === 'truck' ? '#8b4513' : '#666';
        gameState.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Add details
        gameState.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        gameState.ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, obstacle.height/4);
        
        // Wheels
        gameState.ctx.fillStyle = '#333';
        gameState.ctx.fillRect(obstacle.x - 3, obstacle.y + 10, 6, 10);
        gameState.ctx.fillRect(obstacle.x + obstacle.width - 3, obstacle.y + 10, 6, 10);
        gameState.ctx.fillRect(obstacle.x - 3, obstacle.y + obstacle.height - 20, 6, 10);
        gameState.ctx.fillRect(obstacle.x + obstacle.width - 3, obstacle.y + obstacle.height - 20, 6, 10);
    });
}

function drawPowerUps() {
    gameState.powerUps.forEach(powerUp => {
        const type = powerUpTypes[powerUp.type];
        
        gameState.ctx.save();
        gameState.ctx.translate(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2);
        gameState.ctx.rotate(powerUp.rotation);
        
        // Glow effect
        gameState.ctx.shadowColor = type.color;
        gameState.ctx.shadowBlur = 15;
        
        gameState.ctx.fillStyle = type.color;
        gameState.ctx.fillRect(-powerUp.width/2, -powerUp.height/2, powerUp.width, powerUp.height);
        
        // Icon
        gameState.ctx.shadowBlur = 0;
        gameState.ctx.fillStyle = '#fff';
        gameState.ctx.font = '16px Arial';
        gameState.ctx.textAlign = 'center';
        gameState.ctx.fillText(type.icon, 0, 5);
        
        gameState.ctx.restore();
    });
}

function drawCoins() {
    gameState.coins.forEach(coin => {
        gameState.ctx.save();
        gameState.ctx.translate(coin.x + coin.width/2, coin.y + coin.height/2);
        gameState.ctx.rotate(coin.rotation);
        
        // Coin glow
        gameState.ctx.shadowColor = '#ffd700';
        gameState.ctx.shadowBlur = 10;
        
        gameState.ctx.fillStyle = '#ffd700';
        gameState.ctx.beginPath();
        gameState.ctx.arc(0, 0, coin.width/2, 0, Math.PI * 2);
        gameState.ctx.fill();
        
        // Inner circle
        gameState.ctx.shadowBlur = 0;
        gameState.ctx.fillStyle = '#fff';
        gameState.ctx.font = 'bold 12px Arial';
        gameState.ctx.textAlign = 'center';
        gameState.ctx.fillText('$', 0, 4);
        
        gameState.ctx.restore();
    });
}

function drawParticles() {
    gameState.particles.forEach(particle => {
        gameState.ctx.save();
        gameState.ctx.globalAlpha = particle.alpha;
        gameState.ctx.fillStyle = particle.color;
        gameState.ctx.beginPath();
        gameState.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        gameState.ctx.fill();
        gameState.ctx.restore();
    });
}

function drawPowerUpIndicators() {
    let y = 20;
    Object.keys(gameState.activePowerUps).forEach(type => {
        const timeLeft = gameState.activePowerUps[type];
        const powerUp = powerUpTypes[type];
        
        gameState.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        gameState.ctx.fillRect(10, y, 150, 25);
        
        gameState.ctx.fillStyle = powerUp.color;
        gameState.ctx.fillRect(12, y + 2, (timeLeft / powerUp.duration) * 146, 21);
        
        gameState.ctx.fillStyle = '#fff';
        gameState.ctx.font = '14px Arial';
        gameState.ctx.fillText(`${powerUp.icon} ${type.toUpperCase()}`, 15, y + 17);
        
        y += 30;
    });
}

function gameOver() {
    gameState.state = 'gameOver';
    document.getElementById('gameOverlay').style.display = 'flex';
    document.getElementById('overlayTitle').textContent = 'Game Over!';
    document.getElementById('overlayMessage').textContent = `Final Score: ${gameState.score} | Distance: ${Math.floor(gameState.distance)}m`;
    document.getElementById('overlayBtn').innerHTML = '<span>Play Again</span>';
    document.getElementById('startBtn').style.display = 'inline-flex';
    document.getElementById('pauseBtn').style.display = 'none';
    
    // Update user stats
    if (userManager.currentUser) {
        userManager.updateStats(gameState.score, Math.floor(gameState.distance), Math.floor(gameState.gameTime / 1000));
    }
    
    // Update leaderboard
    updateLeaderboard();
}

function updateUI() {
    document.getElementById('score').textContent = gameState.score.toLocaleString();
    document.getElementById('lives').textContent = gameState.lives;
    document.getElementById('distance').textContent = Math.floor(gameState.distance).toLocaleString();
    document.getElementById('speed').textContent = Math.floor(gameState.speed * 10);
}

// Leaderboard Management
function updateLeaderboard() {
    const leaderboard = JSON.parse(localStorage.getItem('turboRushLeaderboard') || '[]');
    
    // Add current game to leaderboard if it has a score
    if (gameState.score > 0) {
        const entry = {
            score: gameState.score,
            distance: Math.floor(gameState.distance),
            car: carTypes[gameState.selectedCar].name,
            player: userManager.currentUser ? userManager.currentUser.username : 'Guest',
            date: new Date().toLocaleDateString()
        };
        
        leaderboard.push(entry);
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard.splice(20); // Keep top 20
        
        localStorage.setItem('turboRushLeaderboard', JSON.stringify(leaderboard));
    }
    
    displayLeaderboard(leaderboard);
}

function displayLeaderboard(leaderboard) {
    const tbody = document.getElementById('leaderboardBody');
    tbody.innerHTML = '';
    
    leaderboard.forEach((entry, index) => {
        const entryEl = document.createElement('div');
        entryEl.className = `leaderboard-entry ${index < 3 ? 'top-3' : ''}`;
        entryEl.innerHTML = `
            <div class="rank">#${index + 1}</div>
            <div class="player-name">${entry.player}</div>
            <div class="score">${entry.score.toLocaleString()}</div>
            <div class="distance">${entry.distance.toLocaleString()}m</div>
            <div class="car-name">${entry.car}</div>
        `;
        tbody.appendChild(entryEl);
    });
    
    // Update personal stats
    updatePersonalStats(leaderboard);
}

function updatePersonalStats(leaderboard) {
    if (userManager.currentUser) {
        const userEntries = leaderboard.filter(entry => entry.player === userManager.currentUser.username);
        
        if (userEntries.length > 0) {
            const bestScore = Math.max(...userEntries.map(e => e.score));
            const bestDistance = Math.max(...userEntries.map(e => e.distance));
            const userRank = leaderboard.findIndex(entry => entry.player === userManager.currentUser.username && entry.score === bestScore) + 1;
            
            document.getElementById('personalBest').textContent = bestScore.toLocaleString();
            document.getElementById('personalDistance').textContent = `${bestDistance.toLocaleString()}m`;
            document.getElementById('gamesPlayed').textContent = userEntries.length;
            document.getElementById('playerRank').textContent = userRank > 0 ? `#${userRank}` : '-';
        }
    } else {
        document.getElementById('personalBest').textContent = '0';
        document.getElementById('personalDistance').textContent = '0m';
        document.getElementById('gamesPlayed').textContent = '0';
        document.getElementById('playerRank').textContent = '-';
    }
}

// Background Effects
function startBackgroundEffects() {
    createParticleBackground();
    startCursorTrail();
}

function createParticleBackground() {
    const particlesBg = document.getElementById('particles-bg');
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 2px;
            height: 2px;
            background: rgba(0, 245, 255, 0.5);
            border-radius: 50%;
            top: ${Math.random() * 100}%;
            left: ${Math.random() * 100}%;
            animation: particleFloat ${5 + Math.random() * 10}s linear infinite;
        `;
        particlesBg.appendChild(particle);
    }
    
    // Add particle animation
    if (!document.getElementById('particle-styles')) {
        const style = document.createElement('style');
        style.id = 'particle-styles';
        style.textContent = `
            @keyframes particleFloat {
                0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

function startCursorTrail() {
    const trail = document.getElementById('cursor-trail');
    let mouseX = 0, mouseY = 0;
    let trailX = 0, trailY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        trail.style.opacity = '1';
    });
    
    function animateTrail() {
        trailX += (mouseX - trailX) * 0.1;
        trailY += (mouseY - trailY) * 0.1;
        
        trail.style.left = trailX + 'px';
        trail.style.top = trailY + 'px';
        
        requestAnimationFrame(animateTrail);
    }
    
    animateTrail();
}

function updateCursorTrail(x, y) {
    const trail = document.getElementById('cursor-trail');
    trail.style.left = x + 'px';
    trail.style.top = y + 'px';
}

// Utility Functions
function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target'));
        const increment = target / 100;
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            stat.textContent = Math.floor(current);
            
            if (current >= target) {
                stat.textContent = target;
                clearInterval(timer);
            }
        }, 20);
    });
}

function toggleTheme() {
    const body = document.body;
    const themeIcon = document.querySelector('#theme-toggle i');
    
    if (body.getAttribute('data-theme') === 'dark') {
        body.setAttribute('data-theme', 'light');
        themeIcon.className = 'fas fa-sun';
    } else {
        body.setAttribute('data-theme', 'dark');
        themeIcon.className = 'fas fa-moon';
    }
}

function showLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
}

function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabs = document.querySelectorAll('.auth-tab');
    
    tabs.forEach(t => t.classList.remove('active'));
    
    if (tab === 'login') {
        loginForm.style.display = 'flex';
        registerForm.style.display = 'none';
        tabs[0].classList.add('active');
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'flex';
        tabs[1].classList.add('active');
    }
}

function logout() {
    userManager.logout();
    showNotification('Logged out successfully!', 'success');
}

function scrollToGame() {
    document.getElementById('game').scrollIntoView({ behavior: 'smooth' });
}

function showGarage() {
    document.getElementById('garage').scrollIntoView({ behavior: 'smooth' });
}

function showNotification(message, type = 'info') {
    const notifications = document.getElementById('notifications');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notifications.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notifications.removeChild(notification), 300);
    }, 3000);
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', init);