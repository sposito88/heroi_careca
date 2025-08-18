/**
 * Herói Careca vs. Gorila do Mal - Motor do Jogo
 * Desenvolvido em HTML5 + JavaScript vanilla
 */

// Configurações globais do jogo
const GAME_CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    FPS: 60,
    GRAVITY: 0.5,
    JUMP_FORCE: -12,
    DOUBLE_JUMP_FORCE: -10,
    MOVE_SPEED: 4,
    COYOTE_TIME: 100, // ms
    INVINCIBILITY_TIME: 1000, // ms
    BANANA_COOLDOWN: 300, // ms
    PUDDING_COOLDOWN: 500, // ms
    PUDDING_DURATION: 5000, // ms
    TILE_SIZE: 32
};

// Estados do jogo
const GAME_STATES = {
    LOADING: 'loading',
    MAIN_MENU: 'main_menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    VICTORY: 'victory',
    INSTRUCTIONS: 'instructions',
    CREDITS: 'credits',
    SETTINGS: 'settings'
};

// Direções
const DIRECTIONS = {
    LEFT: -1,
    RIGHT: 1,
    NONE: 0
};

// Classe principal do jogo
class Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.state = GAME_STATES.LOADING;
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Sistemas do jogo
        this.inputManager = new InputManager();
        this.assetManager = new AssetManager();
        this.audioManager = new AudioManager();
        this.sceneManager = new EnhancedSceneManager();
        this.uiManager = new UIManager();
        
        // Configurações
        this.settings = {
            volume: 0.5,
            reduceMotion: false,
            highContrast: false
        };
        
        // Estatísticas
        this.stats = {
            score: 0,
            lives: 3,
            puddingCount: 3,
            level: 1,
            keysCollected: 0
        };
        
        this.init();
    }
    
    async init() {
        try {
            this.setupCanvas();
            this.setupEventListeners();
            await this.loadAssets();
            this.setupSystems();
            this.setState(GAME_STATES.MAIN_MENU);
            this.startGameLoop();
        } catch (error) {
            console.error('Erro ao inicializar o jogo:', error);
        }
    }
    
    setupCanvas() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Configurar tamanho do canvas
        this.canvas.width = GAME_CONFIG.CANVAS_WIDTH;
        this.canvas.height = GAME_CONFIG.CANVAS_HEIGHT;
        
        // Configurações de renderização
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
    }
    
    setupEventListeners() {
        // Eventos de menu
        document.getElementById('btn-start-game').addEventListener('click', () => this.startGame());
        document.getElementById('btn-instructions').addEventListener('click', () => this.setState(GAME_STATES.INSTRUCTIONS));
        document.getElementById('btn-credits').addEventListener('click', () => this.setState(GAME_STATES.CREDITS));
        document.getElementById('btn-settings').addEventListener('click', () => this.setState(GAME_STATES.SETTINGS));
        
        // Botões de voltar
        document.getElementById('btn-back-instructions').addEventListener('click', () => this.setState(GAME_STATES.MAIN_MENU));
        document.getElementById('btn-back-credits').addEventListener('click', () => this.setState(GAME_STATES.MAIN_MENU));
        document.getElementById('btn-back-settings').addEventListener('click', () => this.setState(GAME_STATES.PAUSED));
        
        // Controles de pausa
        document.getElementById('btn-pause').addEventListener('click', () => this.togglePause());
        document.getElementById('btn-resume').addEventListener('click', () => this.togglePause());
        document.getElementById('btn-restart').addEventListener('click', () => this.restartGame());
        
        // Game over
        document.getElementById('btn-restart-game').addEventListener('click', () => this.restartGame());
        document.getElementById('btn-main-menu').addEventListener('click', () => this.setState(GAME_STATES.MAIN_MENU));
        
        // Configurações
        document.getElementById('reduce-motion').addEventListener('change', (e) => {
            this.settings.reduceMotion = e.target.checked;
            this.applySettings();
        });
        
        document.getElementById('high-contrast').addEventListener('change', (e) => {
            this.settings.highContrast = e.target.checked;
            this.applySettings();
        });
        
        document.getElementById('volume-slider').addEventListener('input', (e) => {
            this.settings.volume = e.target.value / 100;
            this.audioManager.setVolume(this.settings.volume);
        });
    }
    
    async loadAssets() {
        const loadingProgress = document.querySelector('.loading-progress');
        
        // Lista de assets para carregar
        const assets = [
            { type: 'image', name: 'hero_idle', src: 'assets/img/hero_idle.png' },
            { type: 'image', name: 'hero_walk1', src: 'assets/img/hero_walk1.png' },
            { type: 'image', name: 'hero_walk2', src: 'assets/img/hero_walk2.png' },
            { type: 'image', name: 'hero_jump', src: 'assets/img/hero_jump.png' },
            { type: 'image', name: 'gorilla_idle', src: 'assets/img/gorilla_idle.png' },
            { type: 'image', name: 'princess', src: 'assets/img/princess.png' },
            { type: 'image', name: 'banana', src: 'assets/img/banana.png' },
            { type: 'image', name: 'pudding', src: 'assets/img/pudding.png' },
            { type: 'image', name: 'platform', src: 'assets/img/platform.png' },
            { type: 'image', name: 'coin', src: 'assets/img/coin.png' },
            { type: 'image', name: 'key', src: 'assets/img/key.png' },
            { type: 'image', name: 'tower', src: 'assets/img/tower.png' },
            { type: 'image', name: 'background_sky', src: 'assets/img/background_sky.png' }
        ];
        
        let loaded = 0;
        const total = assets.length;
        
        for (const asset of assets) {
            await this.assetManager.loadAsset(asset);
            loaded++;
            const progress = (loaded / total) * 100;
            loadingProgress.style.width = `${progress}%`;
        }
        
        // Esconder tela de carregamento
        document.getElementById('loading-screen').style.display = 'none';
    }
    
    setupSystems() {
        this.inputManager.init();
        this.sceneManager.init(this);
        this.uiManager.init(this);
    }
    
    setState(newState) {
        this.state = newState;
        this.uiManager.updateUI(newState);
    }
    
    startGame() {
        this.resetStats();
        this.sceneManager.loadLevel(1);
        this.setState(GAME_STATES.PLAYING);
    }
    
    restartGame() {
        this.resetStats();
        this.sceneManager.loadLevel(1);
        this.setState(GAME_STATES.PLAYING);
    }
    
    togglePause() {
        if (this.state === GAME_STATES.PLAYING) {
            this.setState(GAME_STATES.PAUSED);
        } else if (this.state === GAME_STATES.PAUSED) {
            this.setState(GAME_STATES.PLAYING);
        }
    }
    
    resetStats() {
        this.stats = {
            score: 0,
            lives: 3,
            puddingCount: 3,
            level: 1,
            keysCollected: 0
        };
        this.uiManager.updateHUD();
    }
    
    applySettings() {
        const gameContainer = document.getElementById('game-container');
        
        if (this.settings.reduceMotion) {
            gameContainer.classList.add('reduce-motion');
        } else {
            gameContainer.classList.remove('reduce-motion');
        }
        
        if (this.settings.highContrast) {
            gameContainer.classList.add('high-contrast');
        } else {
            gameContainer.classList.remove('high-contrast');
        }
    }
    
    startGameLoop() {
        const gameLoop = (currentTime) => {
            this.deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            this.update(this.deltaTime);
            this.render();
            
            requestAnimationFrame(gameLoop);
        };
        
        requestAnimationFrame(gameLoop);
    }
    
    update(deltaTime) {
        if (this.state === GAME_STATES.PLAYING) {
            this.inputManager.update();
            this.sceneManager.update(deltaTime);
        }
    }
    
    render() {
        // Limpar canvas
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.state === GAME_STATES.PLAYING || this.state === GAME_STATES.PAUSED) {
            this.sceneManager.render(this.ctx);
        }
    }
    
    // Métodos de gameplay
    addScore(points) {
        this.stats.score += points;
        this.uiManager.updateHUD();
    }
    
    loseLife() {
        this.stats.lives--;
        this.uiManager.updateHUD();
        
        if (this.stats.lives <= 0) {
            this.setState(GAME_STATES.GAME_OVER);
        }
    }
    
    collectKey() {
        this.stats.keysCollected++;
        this.addScore(50);
    }
    
    collectPudding() {
        this.stats.puddingCount++;
        this.uiManager.updateHUD();
    }
    
    usePudding() {
        if (this.stats.puddingCount > 0) {
            this.stats.puddingCount--;
            this.uiManager.updateHUD();
            return true;
        }
        return false;
    }
}

// Gerenciador de Assets
class AssetManager {
    constructor() {
        this.images = new Map();
        this.sounds = new Map();
    }
    
    async loadAsset(asset) {
        if (asset.type === 'image') {
            return this.loadImage(asset.name, asset.src);
        } else if (asset.type === 'audio') {
            return this.loadSound(asset.name, asset.src);
        }
    }
    
    loadImage(name, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images.set(name, img);
                resolve(img);
            };
            img.onerror = reject;
            img.src = src;
        });
    }
    
    loadSound(name, src) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.oncanplaythrough = () => {
                this.sounds.set(name, audio);
                resolve(audio);
            };
            audio.onerror = reject;
            audio.src = src;
        });
    }
    
    getImage(name) {
        return this.images.get(name);
    }
    
    getSound(name) {
        return this.sounds.get(name);
    }
}

// Gerenciador de Input
class InputManager {
    constructor() {
        this.keys = new Map();
        this.mobileControls = new Map();
        this.isMobile = this.detectMobile();
    }
    
    init() {
        this.setupKeyboardEvents();
        if (this.isMobile) {
            this.setupMobileControls();
        }
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            this.keys.set(e.code, true);
            
            // Prevenir comportamento padrão para teclas do jogo
            if (['Space', 'ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'KeyK', 'KeyL', 'KeyP'].includes(e.code)) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys.set(e.code, false);
        });
    }
    
    setupMobileControls() {
        const controls = [
            { id: 'btn-left', action: 'left' },
            { id: 'btn-right', action: 'right' },
            { id: 'btn-jump', action: 'jump' },
            { id: 'btn-banana', action: 'banana' },
            { id: 'btn-pudding', action: 'pudding' }
        ];
        
        controls.forEach(control => {
            const btn = document.getElementById(control.id);
            if (btn) {
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.mobileControls.set(control.action, true);
                    btn.classList.add('pressed');
                });
                
                btn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.mobileControls.set(control.action, false);
                    btn.classList.remove('pressed');
                });
                
                // Eventos de mouse para desktop
                btn.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    this.mobileControls.set(control.action, true);
                    btn.classList.add('pressed');
                });
                
                btn.addEventListener('mouseup', (e) => {
                    e.preventDefault();
                    this.mobileControls.set(control.action, false);
                    btn.classList.remove('pressed');
                });
            }
        });
    }
    
    isPressed(action) {
        // Mapear ações para teclas
        const keyMap = {
            left: ['ArrowLeft', 'KeyA'],
            right: ['ArrowRight', 'KeyD'],
            jump: ['Space'],
            banana: ['KeyK'],
            pudding: ['KeyL'],
            pause: ['KeyP']
        };
        
        // Verificar teclado
        if (keyMap[action]) {
            for (const key of keyMap[action]) {
                if (this.keys.get(key)) {
                    return true;
                }
            }
        }
        
        // Verificar controles mobile
        return this.mobileControls.get(action) || false;
    }
    
    update() {
        // Atualizar estado dos controles se necessário
    }
}

// Gerenciador de Áudio
class AudioManager {
    constructor() {
        this.volume = 0.5;
        this.sounds = new Map();
        this.audioContext = null;
        this.masterGain = null;
        this.initAudioContext();
    }
    
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this.volume;
        } catch (error) {
            console.warn('Web Audio API não suportada:', error);
        }
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    }
    
    // Gerar som de pulo
    playJumpSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }
    
    // Gerar som de coleta de moeda
    playCoinSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
    
    // Gerar som de arremesso
    playThrowSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(100, this.audioContext.currentTime + 0.15);
        
        gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.15);
    }
    
    // Gerar som de dano
    playHurtSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(50, this.audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
    
    // Gerar som de vitória
    playVictorySound() {
        if (!this.audioContext) return;
        
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        let time = this.audioContext.currentTime;
        
        notes.forEach((frequency, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(frequency, time);
            
            gainNode.gain.setValueAtTime(0.2, time);
            gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
            
            oscillator.start(time);
            oscillator.stop(time + 0.4);
            
            time += 0.2;
        });
    }
    
    playSound(name) {
        switch (name) {
            case 'jump':
                this.playJumpSound();
                break;
            case 'coin':
                this.playCoinSound();
                break;
            case 'throw':
                this.playThrowSound();
                break;
            case 'hurt':
                this.playHurtSound();
                break;
            case 'victory':
                this.playVictorySound();
                break;
            default:
                console.log(`Som não encontrado: ${name}`);
        }
    }
    
    playMusic(name) {
        // Música de fundo simples
        console.log(`Tocando música: ${name}`);
    }
}

// Gerenciador de Cenas
class SceneManager {
    constructor() {
        this.currentScene = null;
        this.game = null;
    }
    
    init(game) {
        this.game = game;
    }
    
    loadLevel(levelNumber) {
        this.currentScene = new GameScene(this.game, levelNumber);
    }
    
    update(deltaTime) {
        if (this.currentScene) {
            this.currentScene.update(deltaTime);
        }
    }
    
    render(ctx) {
        if (this.currentScene) {
            this.currentScene.render(ctx);
        }
    }
}

// Cena do Jogo
class GameScene {
    constructor(game, levelNumber) {
        this.game = game;
        this.levelNumber = levelNumber;
        this.camera = new Camera();
        this.entities = [];
        this.platforms = [];
        this.collectibles = [];
        this.projectiles = [];
        this.puddingPools = [];
        
        this.setupLevel();
    }
    
    setupLevel() {
        // Criar herói
        this.hero = new Hero(100, 400, this.game);
        this.entities.push(this.hero);
        
        // Criar plataformas básicas
        this.createPlatforms();
        
        // Criar coletáveis
        this.createCollectibles();
        
        // Configurar câmera
        this.camera.setTarget(this.hero);
    }
    
    createPlatforms() {
        // Plataformas básicas para teste
        const platformData = [
            { x: 0, y: 550, width: 200 },
            { x: 300, y: 450, width: 100 },
            { x: 500, y: 350, width: 100 },
            { x: 700, y: 250, width: 100 },
            { x: 200, y: 200, width: 300 }
        ];
        
        platformData.forEach(data => {
            for (let i = 0; i < data.width; i += GAME_CONFIG.TILE_SIZE) {
                this.platforms.push(new Platform(data.x + i, data.y));
            }
        });
    }
    
    createCollectibles() {
        // Adicionar algumas moedas e chaves
        this.collectibles.push(new Coin(350, 400));
        this.collectibles.push(new Coin(550, 300));
        this.collectibles.push(new Key(750, 200));
        this.collectibles.push(new PuddingPickup(250, 150));
    }
    
    update(deltaTime) {
        // Atualizar entidades
        this.entities.forEach(entity => entity.update(deltaTime));
        
        // Atualizar projéteis
        this.projectiles.forEach(projectile => projectile.update(deltaTime));
        
        // Remover projéteis inativos
        this.projectiles = this.projectiles.filter(p => p.active);
        
        // Atualizar poças de pudim
        this.puddingPools.forEach(pool => pool.update(deltaTime));
        this.puddingPools = this.puddingPools.filter(p => p.active);
        
        // Verificar colisões
        this.checkCollisions();
        
        // Atualizar câmera
        this.camera.update();
    }
    
    checkCollisions() {
        // Colisões herói com plataformas
        this.checkPlatformCollisions(this.hero);
        
        // Colisões herói com coletáveis
        this.checkCollectibleCollisions();
        
        // Colisões projéteis com plataformas
        this.projectiles.forEach(projectile => {
            this.checkPlatformCollisions(projectile);
        });
    }
    
    checkPlatformCollisions(entity) {
        this.platforms.forEach(platform => {
            if (entity.checkCollision(platform)) {
                entity.handlePlatformCollision(platform);
            }
        });
    }
    
    checkCollectibleCollisions() {
        this.collectibles.forEach((collectible, index) => {
            if (this.hero.checkCollision(collectible)) {
                collectible.collect(this.game);
                this.collectibles.splice(index, 1);
            }
        });
    }
    
    addProjectile(projectile) {
        this.projectiles.push(projectile);
    }
    
    addPuddingPool(x, y) {
        this.puddingPools.push(new PuddingPool(x, y));
    }
    
    render(ctx) {
        ctx.save();
        
        // Aplicar transformação da câmera
        this.camera.apply(ctx);
        
        // Renderizar fundo
        this.renderBackground(ctx);
        
        // Renderizar plataformas
        this.platforms.forEach(platform => platform.render(ctx));
        
        // Renderizar coletáveis
        this.collectibles.forEach(collectible => collectible.render(ctx));
        
        // Renderizar poças de pudim
        this.puddingPools.forEach(pool => pool.render(ctx));
        
        // Renderizar entidades
        this.entities.forEach(entity => entity.render(ctx));
        
        // Renderizar projéteis
        this.projectiles.forEach(projectile => projectile.render(ctx));
        
        ctx.restore();
    }
    
    renderBackground(ctx) {
        // Renderizar fundo simples
        const bg = this.game.assetManager.getImage('background_sky');
        if (bg) {
            // Repetir fundo
            for (let x = -256; x < GAME_CONFIG.CANVAS_WIDTH + 256; x += 256) {
                for (let y = -256; y < GAME_CONFIG.CANVAS_HEIGHT + 256; y += 256) {
                    ctx.drawImage(bg, x, y);
                }
            }
        }
    }
}

// Gerenciador de UI
class UIManager {
    constructor() {
        this.game = null;
    }
    
    init(game) {
        this.game = game;
        this.updateHUD();
    }
    
    updateUI(state) {
        // Esconder todos os menus
        document.querySelectorAll('.menu').forEach(menu => {
            menu.classList.add('hidden');
        });
        
        // Mostrar menu apropriado
        switch (state) {
            case GAME_STATES.MAIN_MENU:
                document.getElementById('main-menu').classList.remove('hidden');
                break;
            case GAME_STATES.PAUSED:
                document.getElementById('pause-menu').classList.remove('hidden');
                break;
            case GAME_STATES.GAME_OVER:
                document.getElementById('game-over-menu').classList.remove('hidden');
                document.getElementById('final-score-value').textContent = this.game.stats.score;
                break;
            case GAME_STATES.INSTRUCTIONS:
                document.getElementById('instructions-menu').classList.remove('hidden');
                break;
            case GAME_STATES.CREDITS:
                document.getElementById('credits-menu').classList.remove('hidden');
                break;
            case GAME_STATES.SETTINGS:
                document.getElementById('settings-menu').classList.remove('hidden');
                break;
        }
    }
    
    updateHUD() {
        if (!this.game) return;
        
        // Atualizar vidas
        const hearts = document.querySelectorAll('.heart');
        hearts.forEach((heart, index) => {
            if (index < this.game.stats.lives) {
                heart.classList.remove('lost');
            } else {
                heart.classList.add('lost');
            }
        });
        
        // Atualizar pontuação
        document.getElementById('score-value').textContent = this.game.stats.score;
        
        // Atualizar pudins
        document.getElementById('pudding-value').textContent = this.game.stats.puddingCount;
    }
}

// Câmera
class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.target = null;
        this.smoothing = 0.1;
    }
    
    setTarget(target) {
        this.target = target;
    }
    
    update() {
        if (this.target) {
            const targetX = -this.target.x + GAME_CONFIG.CANVAS_WIDTH / 2;
            const targetY = -this.target.y + GAME_CONFIG.CANVAS_HEIGHT / 2;
            
            this.x += (targetX - this.x) * this.smoothing;
            this.y += (targetY - this.y) * this.smoothing;
        }
    }
    
    apply(ctx) {
        ctx.translate(this.x, this.y);
    }
}

// Inicializar o jogo quando a página carregar
window.addEventListener('load', () => {
    window.game = new Game();
});



// ===== CLASSES DAS ENTIDADES =====

// Classe base para entidades
class Entity {
    constructor(x, y, width = 32, height = 32) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
        this.active = true;
    }
    
    update(deltaTime) {
        // Implementação básica de física
        this.x += this.vx;
        this.y += this.vy;
        
        // Aplicar gravidade
        if (!this.onGround) {
            this.vy += GAME_CONFIG.GRAVITY;
        }
        
        // Limitar velocidade de queda
        if (this.vy > 15) {
            this.vy = 15;
        }
    }
    
    render(ctx) {
        // Renderização básica (retângulo)
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    
    checkCollision(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
    
    handlePlatformCollision(platform) {
        // Colisão básica com plataformas
        const overlapX = Math.min(this.x + this.width - platform.x, platform.x + platform.width - this.x);
        const overlapY = Math.min(this.y + this.height - platform.y, platform.y + platform.height - this.y);
        
        if (overlapX < overlapY) {
            // Colisão horizontal
            if (this.x < platform.x) {
                this.x = platform.x - this.width;
            } else {
                this.x = platform.x + platform.width;
            }
            this.vx = 0;
        } else {
            // Colisão vertical
            if (this.y < platform.y) {
                this.y = platform.y - this.height;
                this.vy = 0;
                this.onGround = true;
            } else {
                this.y = platform.y + platform.height;
                this.vy = 0;
            }
        }
    }
}

// Herói principal
class Hero extends Entity {
    constructor(x, y, game) {
        super(x, y, 32, 32);
        this.game = game;
        this.direction = DIRECTIONS.RIGHT;
        this.canDoubleJump = true;
        this.coyoteTime = 0;
        this.invincibilityTime = 0;
        this.lastBananaTime = 0;
        this.lastPuddingTime = 0;
        
        // Animação
        this.animationFrame = 0;
        this.animationTime = 0;
        this.currentAnimation = 'idle';
        
        // Estados
        this.isWalking = false;
        this.isJumping = false;
    }
    
    update(deltaTime) {
        this.handleInput();
        this.updateAnimation(deltaTime);
        this.updateTimers(deltaTime);
        
        // Resetar estado de chão
        this.onGround = false;
        
        super.update(deltaTime);
        
        // Atualizar coyote time
        if (!this.onGround) {
            this.coyoteTime -= deltaTime;
        } else {
            this.coyoteTime = GAME_CONFIG.COYOTE_TIME;
            this.canDoubleJump = true;
        }
        
        // Limitar movimento horizontal
        if (this.x < 0) this.x = 0;
        if (this.x > 2000) this.x = 2000; // Limite do mundo
    }
    
    handleInput() {
        const input = this.game.inputManager;
        
        // Movimento horizontal
        this.isWalking = false;
        if (input.isPressed('left')) {
            this.vx = -GAME_CONFIG.MOVE_SPEED;
            this.direction = DIRECTIONS.LEFT;
            this.isWalking = true;
        } else if (input.isPressed('right')) {
            this.vx = GAME_CONFIG.MOVE_SPEED;
            this.direction = DIRECTIONS.RIGHT;
            this.isWalking = true;
        } else {
            this.vx *= 0.8; // Fricção
        }
        
        // Pulo
        if (input.isPressed('jump')) {
            this.jump();
        }
        
        // Arremessar banana
        if (input.isPressed('banana')) {
            this.throwBanana();
        }
        
        // Arremessar pudim
        if (input.isPressed('pudding')) {
            this.throwPudding();
        }
    }
    
    jump() {
        const currentTime = Date.now();
        
        if (this.onGround || this.coyoteTime > 0) {
            // Pulo normal
            this.vy = GAME_CONFIG.JUMP_FORCE;
            this.onGround = false;
            this.coyoteTime = 0;
            this.isJumping = true;
            
            // Tocar som de pulo
            if (this.game && this.game.audioManager) {
                this.game.audioManager.playSound('jump');
            }
        } else if (this.canDoubleJump) {
            // Duplo pulo
            this.vy = GAME_CONFIG.DOUBLE_JUMP_FORCE;
            this.canDoubleJump = false;
            this.isJumping = true;
            
            // Tocar som de pulo
            if (this.game && this.game.audioManager) {
                this.game.audioManager.playSound('jump');
            }
        }
    }
    
    throwBanana() {
        const currentTime = Date.now();
        if (currentTime - this.lastBananaTime < GAME_CONFIG.BANANA_COOLDOWN) {
            return;
        }
        
        this.lastBananaTime = currentTime;
        
        const banana = new Banana(
            this.x + (this.direction === DIRECTIONS.RIGHT ? this.width : 0),
            this.y + this.height / 2,
            this.direction
        );
        
        this.game.sceneManager.currentScene.addProjectile(banana);
        
        // Tocar som de arremesso
        if (this.game && this.game.audioManager) {
            this.game.audioManager.playSound('throw');
        }
    }
    
    throwPudding() {
        const currentTime = Date.now();
        if (currentTime - this.lastPuddingTime < GAME_CONFIG.PUDDING_COOLDOWN) {
            return;
        }
        
        if (!this.game.usePudding()) {
            return;
        }
        
        this.lastPuddingTime = currentTime;
        
        const pudding = new PuddingProjectile(
            this.x + (this.direction === DIRECTIONS.RIGHT ? this.width : 0),
            this.y + this.height / 2,
            this.direction,
            this.game
        );
        
        this.game.sceneManager.currentScene.addProjectile(pudding);
        
        // Tocar som de arremesso
        if (this.game && this.game.audioManager) {
            this.game.audioManager.playSound('throw');
        }
    }
    
    updateAnimation(deltaTime) {
        this.animationTime += deltaTime;
        
        // Determinar animação atual
        if (!this.onGround) {
            this.currentAnimation = 'jump';
        } else if (this.isWalking) {
            this.currentAnimation = 'walk';
        } else {
            this.currentAnimation = 'idle';
        }
        
        // Atualizar frame de animação
        if (this.currentAnimation === 'walk' && this.animationTime > 200) {
            this.animationFrame = (this.animationFrame + 1) % 2;
            this.animationTime = 0;
        }
    }
    
    updateTimers(deltaTime) {
        if (this.invincibilityTime > 0) {
            this.invincibilityTime -= deltaTime;
        }
    }
    
    takeDamage() {
        if (this.invincibilityTime > 0) {
            return;
        }
        
        this.invincibilityTime = GAME_CONFIG.INVINCIBILITY_TIME;
        this.game.loseLife();
        
        // Knockback
        this.vy = -8;
        this.vx = this.direction * -3;
    }
    
    render(ctx) {
        const assetManager = this.game.assetManager;
        let spriteName = 'hero_idle';
        
        // Selecionar sprite baseado na animação
        switch (this.currentAnimation) {
            case 'walk':
                spriteName = this.animationFrame === 0 ? 'hero_walk1' : 'hero_walk2';
                break;
            case 'jump':
                spriteName = 'hero_jump';
                break;
            default:
                spriteName = 'hero_idle';
        }
        
        const sprite = assetManager.getImage(spriteName);
        if (sprite) {
            ctx.save();
            
            // Aplicar efeito de invencibilidade
            if (this.invincibilityTime > 0) {
                ctx.globalAlpha = Math.sin(Date.now() * 0.02) * 0.5 + 0.5;
            }
            
            // Espelhar sprite se necessário
            if (this.direction === DIRECTIONS.LEFT) {
                ctx.scale(-1, 1);
                ctx.drawImage(sprite, -this.x - this.width, this.y, this.width, this.height);
            } else {
                ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
            }
            
            ctx.restore();
        } else {
            // Fallback para retângulo
            super.render(ctx);
        }
    }
}

// Plataforma
class Platform extends Entity {
    constructor(x, y) {
        super(x, y, GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE);
        this.vx = 0;
        this.vy = 0;
    }
    
    update(deltaTime) {
        // Plataformas não se movem
    }
    
    render(ctx) {
        const sprite = window.game.assetManager.getImage('platform');
        if (sprite) {
            ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

// Projétil Banana
class Banana extends Entity {
    constructor(x, y, direction) {
        super(x, y, 16, 16);
        this.direction = direction;
        this.vx = direction * 8;
        this.vy = -6;
        this.gravity = 0.3;
        this.bounces = 0;
        this.maxBounces = 2;
    }
    
    update(deltaTime) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        
        // Remover se sair da tela
        if (this.x < -100 || this.x > 2100 || this.y > 700) {
            this.active = false;
        }
    }
    
    handlePlatformCollision(platform) {
        if (this.bounces < this.maxBounces) {
            this.vy = -Math.abs(this.vy) * 0.6;
            this.vx *= 0.8;
            this.bounces++;
            this.y = platform.y - this.height;
        } else {
            this.active = false;
        }
    }
    
    render(ctx) {
        const sprite = window.game.assetManager.getImage('banana');
        if (sprite) {
            ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#FFFF00';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

// Projétil Pudim
class PuddingProjectile extends Entity {
    constructor(x, y, direction, game) {
        super(x, y, 16, 16);
        this.direction = direction;
        this.vx = direction * 6;
        this.vy = -4;
        this.gravity = 0.4;
        this.game = game;
        this.hasLanded = false;
    }
    
    update(deltaTime) {
        if (!this.hasLanded) {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += this.gravity;
            
            // Remover se sair da tela
            if (this.x < -100 || this.x > 2100 || this.y > 700) {
                this.active = false;
            }
        }
    }
    
    handlePlatformCollision(platform) {
        if (!this.hasLanded) {
            this.hasLanded = true;
            this.y = platform.y - this.height;
            this.vx = 0;
            this.vy = 0;
            
            // Criar poça de pudim
            this.game.sceneManager.currentScene.addPuddingPool(this.x, platform.y);
            this.active = false;
        }
    }
    
    render(ctx) {
        const sprite = window.game.assetManager.getImage('pudding');
        if (sprite) {
            ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#D2691E';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

// Poça de Pudim
class PuddingPool extends Entity {
    constructor(x, y) {
        super(x, y, 64, 8);
        this.duration = GAME_CONFIG.PUDDING_DURATION;
        this.alpha = 1.0;
    }
    
    update(deltaTime) {
        this.duration -= deltaTime;
        
        if (this.duration <= 0) {
            this.active = false;
        } else if (this.duration < 1000) {
            // Fade out nos últimos 1000ms
            this.alpha = this.duration / 1000;
        }
    }
    
    render(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
    
    isSlippery() {
        return this.active;
    }
}

// Coletáveis
class Collectible extends Entity {
    constructor(x, y, width = 16, height = 16) {
        super(x, y, width, height);
        this.bobOffset = Math.random() * Math.PI * 2;
        this.bobSpeed = 0.003;
        this.originalY = y;
    }
    
    update(deltaTime) {
        // Efeito de flutuação
        this.y = this.originalY + Math.sin(Date.now() * this.bobSpeed + this.bobOffset) * 3;
    }
    
    collect(game) {
        // Implementar em subclasses
    }
}

class Coin extends Collectible {
    constructor(x, y) {
        super(x, y);
    }
    
    collect(game) {
        game.addScore(100);
    }
    
    render(ctx) {
        const sprite = window.game.assetManager.getImage('coin');
        if (sprite) {
            ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

class Key extends Collectible {
    constructor(x, y) {
        super(x, y);
    }
    
    collect(game) {
        game.collectKey();
    }
    
    render(ctx) {
        const sprite = window.game.assetManager.getImage('key');
        if (sprite) {
            ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

class PuddingPickup extends Collectible {
    constructor(x, y) {
        super(x, y);
    }
    
    collect(game) {
        game.collectPudding();
        game.addScore(25);
    }
    
    render(ctx) {
        const sprite = window.game.assetManager.getImage('pudding');
        if (sprite) {
            ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#D2691E';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}


// ===== SISTEMA DE CARREGAMENTO DE FASES =====

// Gerenciador de Fases
class LevelManager {
    constructor() {
        this.levels = new Map();
        this.currentLevel = 1;
        this.maxLevel = 3;
        this.initializeLevels();
    }
    
    initializeLevels() {
        // Dados das fases inline para evitar problemas de CORS
        const levelData = {
            1: {
                "name": "Floresta Encantada",
                "width": 1600,
                "height": 600,
                "playerStart": { "x": 100, "y": 400 },
                "background": "forest",
                "platforms": [
                    { "x": 0, "y": 550, "width": 300, "type": "ground" },
                    { "x": 400, "y": 450, "width": 128, "type": "platform" },
                    { "x": 600, "y": 350, "width": 96, "type": "platform" },
                    { "x": 800, "y": 250, "width": 128, "type": "platform" },
                    { "x": 1000, "y": 400, "width": 160, "type": "platform" },
                    { "x": 1200, "y": 300, "width": 96, "type": "platform" },
                    { "x": 1400, "y": 200, "width": 200, "type": "platform" }
                ],
                "collectibles": [
                    { "type": "coin", "x": 450, "y": 400 },
                    { "type": "coin", "x": 630, "y": 300 },
                    { "type": "coin", "x": 830, "y": 200 },
                    { "type": "key", "x": 1050, "y": 350 },
                    { "type": "pudding", "x": 1230, "y": 250 },
                    { "type": "coin", "x": 1450, "y": 150 }
                ],
                "enemies": [
                    { "type": "goomba", "x": 500, "y": 418, "patrol": { "start": 450, "end": 550 } },
                    { "type": "goomba", "x": 900, "y": 218, "patrol": { "start": 850, "end": 950 } }
                ],
                "goal": { "x": 1500, "y": 150, "type": "door" },
                "requiredKeys": 1
            },
            2: {
                "name": "Montanha Rochosa",
                "width": 2000,
                "height": 600,
                "playerStart": { "x": 100, "y": 400 },
                "background": "mountain",
                "platforms": [
                    { "x": 0, "y": 550, "width": 200, "type": "ground" },
                    { "x": 300, "y": 480, "width": 64, "type": "platform" },
                    { "x": 450, "y": 400, "width": 64, "type": "platform" },
                    { "x": 600, "y": 320, "width": 96, "type": "platform" },
                    { "x": 800, "y": 240, "width": 64, "type": "platform" },
                    { "x": 950, "y": 350, "width": 128, "type": "platform" },
                    { "x": 1150, "y": 280, "width": 64, "type": "platform" },
                    { "x": 1300, "y": 200, "width": 96, "type": "platform" },
                    { "x": 1500, "y": 120, "width": 64, "type": "platform" },
                    { "x": 1700, "y": 180, "width": 200, "type": "platform" }
                ],
                "collectibles": [
                    { "type": "coin", "x": 330, "y": 430 },
                    { "type": "pudding", "x": 480, "y": 350 },
                    { "type": "coin", "x": 630, "y": 270 },
                    { "type": "coin", "x": 830, "y": 190 },
                    { "type": "key", "x": 1000, "y": 300 },
                    { "type": "coin", "x": 1180, "y": 230 },
                    { "type": "pudding", "x": 1330, "y": 150 },
                    { "type": "key", "x": 1530, "y": 70 },
                    { "type": "coin", "x": 1750, "y": 130 }
                ],
                "enemies": [
                    { "type": "goomba", "x": 400, "y": 448, "patrol": { "start": 350, "end": 500 } },
                    { "type": "goomba", "x": 700, "y": 288, "patrol": { "start": 650, "end": 750 } },
                    { "type": "goomba", "x": 1200, "y": 248, "patrol": { "start": 1150, "end": 1250 } },
                    { "type": "spiker", "x": 1400, "y": 168, "patrol": { "start": 1350, "end": 1450 } }
                ],
                "goal": { "x": 1800, "y": 130, "type": "door" },
                "requiredKeys": 2
            },
            3: {
                "name": "Torre do Castelo",
                "width": 1200,
                "height": 800,
                "playerStart": { "x": 100, "y": 700 },
                "background": "tower",
                "platforms": [
                    { "x": 0, "y": 750, "width": 300, "type": "ground" },
                    { "x": 400, "y": 650, "width": 96, "type": "platform" },
                    { "x": 200, "y": 550, "width": 96, "type": "platform" },
                    { "x": 500, "y": 450, "width": 96, "type": "platform" },
                    { "x": 300, "y": 350, "width": 96, "type": "platform" },
                    { "x": 600, "y": 250, "width": 96, "type": "platform" },
                    { "x": 400, "y": 150, "width": 96, "type": "platform" },
                    { "x": 700, "y": 50, "width": 200, "type": "platform" }
                ],
                "collectibles": [
                    { "type": "coin", "x": 430, "y": 600 },
                    { "type": "pudding", "x": 230, "y": 500 },
                    { "type": "coin", "x": 530, "y": 400 },
                    { "type": "key", "x": 330, "y": 300 },
                    { "type": "coin", "x": 630, "y": 200 },
                    { "type": "pudding", "x": 430, "y": 100 },
                    { "type": "key", "x": 750, "y": 0 },
                    { "type": "key", "x": 850, "y": 0 }
                ],
                "enemies": [
                    { "type": "goomba", "x": 450, "y": 618, "patrol": { "start": 400, "end": 500 } },
                    { "type": "spiker", "x": 250, "y": 518, "patrol": { "start": 200, "end": 300 } },
                    { "type": "goomba", "x": 550, "y": 418, "patrol": { "start": 500, "end": 600 } },
                    { "type": "spiker", "x": 350, "y": 318, "patrol": { "start": 300, "end": 400 } },
                    { "type": "goomba", "x": 650, "y": 218, "patrol": { "start": 600, "end": 700 } }
                ],
                "goal": { "x": 800, "y": 0, "type": "princess" },
                "requiredKeys": 3,
                "boss": {
                    "type": "gorilla",
                    "x": 750,
                    "y": 18,
                    "health": 5,
                    "attacks": ["throw_barrel", "ground_pound", "charge"]
                }
            }
        };
        
        // Armazenar dados das fases
        for (const [levelNum, data] of Object.entries(levelData)) {
            this.levels.set(parseInt(levelNum), data);
        }
    }
    
    async loadLevel(levelNumber) {
        // Retornar dados já carregados
        return this.levels.get(levelNumber) || null;
    }
    
    getLevelData(levelNumber) {
        return this.levels.get(levelNumber);
    }
    
    hasNextLevel() {
        return this.currentLevel < this.maxLevel;
    }
    
    nextLevel() {
        if (this.hasNextLevel()) {
            this.currentLevel++;
            return this.currentLevel;
        }
        return null;
    }
    
    resetToFirstLevel() {
        this.currentLevel = 1;
    }
}

// Atualizar SceneManager para usar LevelManager
class EnhancedSceneManager extends SceneManager {
    constructor() {
        super();
        this.levelManager = new LevelManager();
    }
    
    async loadLevel(levelNumber) {
        // Carregar dados da fase
        let levelData = this.levelManager.getLevelData(levelNumber);
        if (!levelData) {
            levelData = await this.levelManager.loadLevel(levelNumber);
        }
        
        if (!levelData) {
            console.error(`Não foi possível carregar a fase ${levelNumber}`);
            return;
        }
        
        // Criar nova cena com os dados da fase
        this.currentScene = new EnhancedGameScene(this.game, levelNumber, levelData);
        this.levelManager.currentLevel = levelNumber;
    }
    
    completeLevel() {
        const nextLevel = this.levelManager.nextLevel();
        if (nextLevel) {
            // Carregar próxima fase
            this.loadLevel(nextLevel);
            this.game.addScore(500); // Bônus por completar fase
        } else {
            // Jogo completo!
            this.game.setState(GAME_STATES.VICTORY);
        }
    }
}

// Cena de jogo aprimorada
class EnhancedGameScene extends GameScene {
    constructor(game, levelNumber, levelData) {
        super(game, levelNumber);
        this.levelData = levelData;
        this.keysCollected = 0;
        this.requiredKeys = levelData.requiredKeys || 0;
        this.levelComplete = false;
        
        this.setupLevelFromData();
    }
    
    setupLevelFromData() {
        // Limpar entidades existentes
        this.entities = [];
        this.platforms = [];
        this.collectibles = [];
        this.projectiles = [];
        this.puddingPools = [];
        
        // Criar herói na posição inicial
        const startPos = this.levelData.playerStart;
        this.hero = new Hero(startPos.x, startPos.y, this.game);
        this.entities.push(this.hero);
        
        // Criar plataformas
        this.createPlatformsFromData();
        
        // Criar coletáveis
        this.createCollectiblesFromData();
        
        // Criar inimigos
        this.createEnemiesFromData();
        
        // Criar objetivo da fase
        this.createGoalFromData();
        
        // Configurar câmera
        this.camera.setTarget(this.hero);
    }
    
    createPlatformsFromData() {
        this.levelData.platforms.forEach(platformData => {
            for (let x = platformData.x; x < platformData.x + platformData.width; x += GAME_CONFIG.TILE_SIZE) {
                this.platforms.push(new Platform(x, platformData.y));
            }
        });
    }
    
    createCollectiblesFromData() {
        this.levelData.collectibles.forEach(collectibleData => {
            let collectible;
            switch (collectibleData.type) {
                case 'coin':
                    collectible = new Coin(collectibleData.x, collectibleData.y);
                    break;
                case 'key':
                    collectible = new Key(collectibleData.x, collectibleData.y);
                    break;
                case 'pudding':
                    collectible = new PuddingPickup(collectibleData.x, collectibleData.y);
                    break;
            }
            if (collectible) {
                this.collectibles.push(collectible);
            }
        });
    }
    
    createEnemiesFromData() {
        if (this.levelData.enemies) {
            this.levelData.enemies.forEach(enemyData => {
                let enemy;
                switch (enemyData.type) {
                    case 'goomba':
                        enemy = new Goomba(enemyData.x, enemyData.y, enemyData.patrol);
                        break;
                    case 'spiker':
                        enemy = new Spiker(enemyData.x, enemyData.y, enemyData.patrol);
                        break;
                }
                if (enemy) {
                    this.entities.push(enemy);
                }
            });
        }
    }
    
    createGoalFromData() {
        const goalData = this.levelData.goal;
        let goal;
        
        switch (goalData.type) {
            case 'door':
                goal = new LevelDoor(goalData.x, goalData.y, this);
                break;
            case 'princess':
                goal = new Princess(goalData.x, goalData.y, this);
                break;
        }
        
        if (goal) {
            this.entities.push(goal);
        }
        
        // Criar chefão se existir
        if (this.levelData.boss) {
            const bossData = this.levelData.boss;
            const boss = new GorillaKing(bossData.x, bossData.y, this.game, bossData);
            this.entities.push(boss);
        }
    }
    
    checkCollectibleCollisions() {
        this.collectibles.forEach((collectible, index) => {
            if (this.hero.checkCollision(collectible)) {
                // Verificar se é uma chave
                if (collectible instanceof Key) {
                    this.keysCollected++;
                }
                
                collectible.collect(this.game);
                this.collectibles.splice(index, 1);
            }
        });
    }
    
    checkLevelCompletion() {
        if (!this.levelComplete && this.keysCollected >= this.requiredKeys) {
            // Verificar se chegou ao objetivo
            const goal = this.entities.find(entity => entity instanceof LevelDoor || entity instanceof Princess);
            if (goal && this.hero.checkCollision(goal)) {
                this.levelComplete = true;
                goal.activate();
            }
        }
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        this.checkLevelCompletion();
    }
    
    completeLevel() {
        this.game.sceneManager.completeLevel();
    }
}

// Porta da fase
class LevelDoor extends Entity {
    constructor(x, y, scene) {
        super(x, y, 32, 64);
        this.scene = scene;
        this.activated = false;
    }
    
    activate() {
        if (!this.activated) {
            this.activated = true;
            setTimeout(() => {
                this.scene.completeLevel();
            }, 1000);
        }
    }
    
    render(ctx) {
        // Renderizar porta simples
        ctx.fillStyle = this.activated ? '#00FF00' : '#8B4513';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Adicionar detalhes
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(this.x + 20, this.y + 30, 6, 6);
    }
}

// Princesa
class Princess extends Entity {
    constructor(x, y, scene) {
        super(x, y, 32, 32);
        this.scene = scene;
        this.activated = false;
        this.bobOffset = 0;
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        this.bobOffset += deltaTime * 0.003;
        this.y += Math.sin(this.bobOffset) * 0.5;
    }
    
    activate() {
        if (!this.activated) {
            this.activated = true;
            this.scene.game.setState(GAME_STATES.VICTORY);
        }
    }
    
    render(ctx) {
        const sprite = this.scene.game.assetManager.getImage('princess');
        if (sprite) {
            ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#FFB6C1';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

// Substituir SceneManager no Game
// Atualizar a inicialização do jogo para usar o novo sistema
if (typeof window !== 'undefined' && window.game) {
    // Substituir o sceneManager existente
    window.game.sceneManager = new EnhancedSceneManager();
    window.game.sceneManager.init(window.game);
}


// ===== CLASSES DE INIMIGOS =====

// Inimigo base
class Enemy extends Entity {
    constructor(x, y, width = 32, height = 32, patrol = null) {
        super(x, y, width, height);
        this.patrol = patrol;
        this.direction = DIRECTIONS.LEFT;
        this.speed = 1;
        this.health = 1;
        this.isDead = false;
        this.deathTime = 0;
        
        if (patrol) {
            this.patrolStart = patrol.start;
            this.patrolEnd = patrol.end;
        }
    }
    
    update(deltaTime) {
        if (this.isDead) {
            this.deathTime += deltaTime;
            if (this.deathTime > 1000) {
                this.active = false;
            }
            return;
        }
        
        this.patrol();
        super.update(deltaTime);
    }
    
    patrol() {
        if (!this.patrol) return;
        
        this.vx = this.direction * this.speed;
        
        if (this.direction === DIRECTIONS.LEFT && this.x <= this.patrolStart) {
            this.direction = DIRECTIONS.RIGHT;
        } else if (this.direction === DIRECTIONS.RIGHT && this.x >= this.patrolEnd) {
            this.direction = DIRECTIONS.LEFT;
        }
    }
    
    takeDamage() {
        this.health--;
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        this.isDead = true;
        this.vx = 0;
        this.vy = -5;
        
        // Adicionar pontos
        if (window.game) {
            window.game.addScore(100);
        }
    }
    
    checkCollisionWithHero(hero) {
        if (this.isDead) return false;
        
        if (this.checkCollision(hero)) {
            // Verificar se o herói está pulando em cima
            if (hero.vy > 0 && hero.y < this.y) {
                this.takeDamage();
                hero.vy = -8; // Pequeno pulo
                return false;
            } else {
                // Herói toma dano
                hero.takeDamage();
                return true;
            }
        }
        return false;
    }
}

// Goomba - Inimigo básico
class Goomba extends Enemy {
    constructor(x, y, patrol) {
        super(x, y, 32, 32, patrol);
        this.speed = 1;
    }
    
    render(ctx) {
        if (this.isDead) {
            // Renderizar achatado
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x, this.y + this.height - 8, this.width, 8);
        } else {
            // Renderizar normal
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Olhos
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(this.x + 8, this.y + 8, 6, 6);
            ctx.fillRect(this.x + 18, this.y + 8, 6, 6);
            
            ctx.fillStyle = '#000000';
            ctx.fillRect(this.x + 10, this.y + 10, 2, 2);
            ctx.fillRect(this.x + 20, this.y + 10, 2, 2);
        }
    }
}

// Spiker - Inimigo com espinhos
class Spiker extends Enemy {
    constructor(x, y, patrol) {
        super(x, y, 32, 32, patrol);
        this.speed = 0.5;
        this.health = 2;
    }
    
    checkCollisionWithHero(hero) {
        if (this.isDead) return false;
        
        if (this.checkCollision(hero)) {
            // Spiker sempre causa dano, mesmo se pisado em cima
            hero.takeDamage();
            return true;
        }
        return false;
    }
    
    takeDamage() {
        // Spiker só pode ser derrotado por projéteis
        this.health--;
        if (this.health <= 0) {
            this.die();
        }
    }
    
    render(ctx) {
        if (this.isDead) {
            ctx.fillStyle = '#666666';
            ctx.fillRect(this.x, this.y + this.height - 8, this.width, 8);
        } else {
            // Corpo
            ctx.fillStyle = '#4A4A4A';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Espinhos
            ctx.fillStyle = '#FFFFFF';
            for (let i = 0; i < 4; i++) {
                const spikeX = this.x + i * 8 + 4;
                ctx.beginPath();
                ctx.moveTo(spikeX, this.y);
                ctx.lineTo(spikeX - 4, this.y - 8);
                ctx.lineTo(spikeX + 4, this.y - 8);
                ctx.closePath();
                ctx.fill();
            }
            
            // Olhos vermelhos
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(this.x + 8, this.y + 12, 4, 4);
            ctx.fillRect(this.x + 20, this.y + 12, 4, 4);
        }
    }
}

// Atualizar GameScene para verificar colisões com inimigos
const originalCheckCollisions = EnhancedGameScene.prototype.checkCollisions;
EnhancedGameScene.prototype.checkCollisions = function() {
    // Chamar verificações originais
    originalCheckCollisions.call(this);
    
    // Verificar colisões herói com inimigos
    this.entities.forEach(entity => {
        if (entity instanceof Enemy) {
            entity.checkCollisionWithHero(this.hero);
        }
    });
    
    // Verificar colisões projéteis com inimigos
    this.projectiles.forEach(projectile => {
        this.entities.forEach(entity => {
            if (entity instanceof Enemy && !entity.isDead) {
                if (projectile.checkCollision(entity)) {
                    entity.takeDamage();
                    projectile.active = false;
                }
            }
        });
    });
};


// ===== CHEFÃO GORILA DO MAL =====

class GorillaKing extends Enemy {
    constructor(x, y, game, bossData) {
        super(x, y, 64, 64);
        this.game = game;
        this.bossData = bossData;
        this.health = bossData.health || 5;
        this.maxHealth = this.health;
        this.speed = 0.5;
        this.state = 'idle';
        this.attackTimer = 0;
        this.attackCooldown = 3000; // 3 segundos entre ataques
        this.isInvulnerable = false;
        this.invulnerabilityTime = 0;
        this.currentAttack = null;
        this.attackPattern = 0;
        
        // Estados de ataque
        this.attacks = {
            throw_barrel: { duration: 2000, cooldown: 4000 },
            ground_pound: { duration: 1500, cooldown: 3500 },
            charge: { duration: 3000, cooldown: 5000 }
        };
        
        // Animação
        this.animationFrame = 0;
        this.animationTime = 0;
        
        // Barris arremessados
        this.barrels = [];
    }
    
    update(deltaTime) {
        if (this.isDead) {
            this.deathTime += deltaTime;
            if (this.deathTime > 3000) {
                // Chefão derrotado - vitória!
                this.game.setState(GAME_STATES.VICTORY);
            }
            return;
        }
        
        this.updateTimers(deltaTime);
        this.updateAI(deltaTime);
        this.updateAnimation(deltaTime);
        this.updateBarrels(deltaTime);
        
        super.update(deltaTime);
    }
    
    updateTimers(deltaTime) {
        this.attackTimer += deltaTime;
        
        if (this.invulnerabilityTime > 0) {
            this.invulnerabilityTime -= deltaTime;
            if (this.invulnerabilityTime <= 0) {
                this.isInvulnerable = false;
            }
        }
    }
    
    updateAI(deltaTime) {
        const hero = this.game.sceneManager.currentScene.hero;
        const distanceToHero = Math.abs(this.x - hero.x);
        
        switch (this.state) {
            case 'idle':
                if (this.attackTimer >= this.attackCooldown) {
                    this.chooseAttack(distanceToHero);
                }
                break;
                
            case 'attacking':
                this.executeCurrentAttack(deltaTime);
                break;
                
            case 'stunned':
                // Gorila fica atordoado após tomar dano
                if (this.attackTimer >= 1000) {
                    this.state = 'idle';
                    this.attackTimer = 0;
                }
                break;
        }
    }
    
    chooseAttack(distanceToHero) {
        let attackType;
        
        // Escolher ataque baseado na distância e padrão
        if (distanceToHero > 200) {
            attackType = 'throw_barrel';
        } else if (distanceToHero < 100) {
            attackType = 'ground_pound';
        } else {
            attackType = 'charge';
        }
        
        this.startAttack(attackType);
    }
    
    startAttack(attackType) {
        this.state = 'attacking';
        this.currentAttack = attackType;
        this.attackTimer = 0;
        
        switch (attackType) {
            case 'throw_barrel':
                this.throwBarrel();
                break;
            case 'ground_pound':
                this.groundPound();
                break;
            case 'charge':
                this.startCharge();
                break;
        }
    }
    
    executeCurrentAttack(deltaTime) {
        const attack = this.attacks[this.currentAttack];
        
        if (this.attackTimer >= attack.duration) {
            this.state = 'idle';
            this.attackCooldown = attack.cooldown;
            this.attackTimer = 0;
            this.currentAttack = null;
        }
    }
    
    throwBarrel() {
        const hero = this.game.sceneManager.currentScene.hero;
        const direction = hero.x > this.x ? 1 : -1;
        
        const barrel = new Barrel(
            this.x + this.width / 2,
            this.y,
            direction,
            this.game
        );
        
        this.barrels.push(barrel);
    }
    
    groundPound() {
        // Criar ondas de choque
        const hero = this.game.sceneManager.currentScene.hero;
        const distance = Math.abs(this.x - hero.x);
        
        if (distance < 150) {
            // Herói está próximo, toma dano
            hero.takeDamage();
        }
        
        // Efeito visual de tremor
        if (!this.game.settings.reduceMotion) {
            this.shakeScreen();
        }
    }
    
    startCharge() {
        const hero = this.game.sceneManager.currentScene.hero;
        this.chargeDirection = hero.x > this.x ? 1 : -1;
        this.vx = this.chargeDirection * 3;
    }
    
    shakeScreen() {
        // Implementar tremor de tela
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            canvas.style.transform = 'translate(2px, 2px)';
            setTimeout(() => {
                canvas.style.transform = 'translate(-2px, -2px)';
                setTimeout(() => {
                    canvas.style.transform = 'translate(0, 0)';
                }, 100);
            }, 100);
        }
    }
    
    updateBarrels(deltaTime) {
        this.barrels.forEach((barrel, index) => {
            barrel.update(deltaTime);
            if (!barrel.active) {
                this.barrels.splice(index, 1);
            }
        });
    }
    
    updateAnimation(deltaTime) {
        this.animationTime += deltaTime;
        
        if (this.animationTime > 500) {
            this.animationFrame = (this.animationFrame + 1) % 2;
            this.animationTime = 0;
        }
    }
    
    takeDamage() {
        if (this.isInvulnerable || this.isDead) {
            return;
        }
        
        this.health--;
        this.isInvulnerable = true;
        this.invulnerabilityTime = 1500;
        this.state = 'stunned';
        this.attackTimer = 0;
        
        // Knockback
        this.vx = -this.direction * 2;
        this.vy = -3;
        
        if (this.health <= 0) {
            this.die();
        }
        
        // Adicionar pontos
        this.game.addScore(200);
    }
    
    die() {
        this.isDead = true;
        this.vx = 0;
        this.vy = -8;
        this.deathTime = 0;
        
        // Pontos por derrotar o chefão
        this.game.addScore(1000);
    }
    
    checkCollisionWithHero(hero) {
        if (this.isDead) return false;
        
        if (this.checkCollision(hero)) {
            // Chefão sempre causa dano ao herói
            hero.takeDamage();
            return true;
        }
        
        // Verificar colisão com barris
        this.barrels.forEach(barrel => {
            if (barrel.checkCollision(hero)) {
                hero.takeDamage();
                barrel.active = false;
            }
        });
        
        return false;
    }
    
    render(ctx) {
        // Renderizar barris primeiro
        this.barrels.forEach(barrel => barrel.render(ctx));
        
        if (this.isDead) {
            // Renderizar gorila derrotado
            ctx.fillStyle = '#666666';
            ctx.fillRect(this.x, this.y + this.height - 16, this.width, 16);
            return;
        }
        
        ctx.save();
        
        // Efeito de invulnerabilidade
        if (this.isInvulnerable) {
            ctx.globalAlpha = Math.sin(Date.now() * 0.02) * 0.5 + 0.5;
        }
        
        // Tentar usar sprite do gorila
        const sprite = this.game.assetManager.getImage('gorilla_idle');
        if (sprite) {
            // Espelhar se necessário
            if (this.direction === DIRECTIONS.LEFT) {
                ctx.scale(-1, 1);
                ctx.drawImage(sprite, -this.x - this.width, this.y, this.width, this.height);
            } else {
                ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
            }
        } else {
            // Fallback para renderização simples
            ctx.fillStyle = this.state === 'attacking' ? '#8B0000' : '#4A4A4A';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Olhos vermelhos
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(this.x + 16, this.y + 16, 8, 8);
            ctx.fillRect(this.x + 40, this.y + 16, 8, 8);
            
            // Barra de vida
            this.renderHealthBar(ctx);
        }
        
        ctx.restore();
    }
    
    renderHealthBar(ctx) {
        const barWidth = 60;
        const barHeight = 6;
        const barX = this.x + (this.width - barWidth) / 2;
        const barY = this.y - 15;
        
        // Fundo da barra
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Vida atual
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Borda
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
}

// Barril arremessado pelo chefão
class Barrel extends Entity {
    constructor(x, y, direction, game) {
        super(x, y, 24, 24);
        this.direction = direction;
        this.vx = direction * 4;
        this.vy = -8;
        this.gravity = 0.4;
        this.bounces = 0;
        this.maxBounces = 3;
        this.game = game;
        this.rotationAngle = 0;
    }
    
    update(deltaTime) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.rotationAngle += this.vx * 0.1;
        
        // Remover se sair da tela
        if (this.x < -100 || this.x > 2100 || this.y > 700) {
            this.active = false;
        }
    }
    
    handlePlatformCollision(platform) {
        if (this.bounces < this.maxBounces) {
            this.vy = -Math.abs(this.vy) * 0.7;
            this.vx *= 0.9;
            this.bounces++;
            this.y = platform.y - this.height;
        } else {
            this.active = false;
        }
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotationAngle);
        
        // Renderizar barril simples
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Detalhes do barril
        ctx.fillStyle = '#654321';
        ctx.fillRect(-this.width / 2, -this.height / 2 + 4, this.width, 2);
        ctx.fillRect(-this.width / 2, -this.height / 2 + 10, this.width, 2);
        ctx.fillRect(-this.width / 2, -this.height / 2 + 16, this.width, 2);
        
        ctx.restore();
    }
}

// Adicionar menu de vitória ao HTML (será adicionado via JavaScript)
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            const victoryMenu = document.createElement('div');
            victoryMenu.id = 'victory-menu';
            victoryMenu.className = 'menu hidden';
            victoryMenu.innerHTML = `
                <div class="menu-content">
                    <h2>Vitória!</h2>
                    <p>Parabéns! Você derrotou o Gorila do Mal e resgatou a princesa!</p>
                    <div id="final-score-victory">Pontuação Final: <span id="final-score-victory-value">0</span></div>
                    <button id="btn-play-again" class="menu-btn primary">Jogar Novamente</button>
                    <button id="btn-main-menu-victory" class="menu-btn">Menu Principal</button>
                </div>
            `;
            gameContainer.appendChild(victoryMenu);
            
            // Adicionar event listeners
            document.getElementById('btn-play-again').addEventListener('click', () => {
                if (window.game) {
                    window.game.restartGame();
                }
            });
            
            document.getElementById('btn-main-menu-victory').addEventListener('click', () => {
                if (window.game) {
                    window.game.setState(GAME_STATES.MAIN_MENU);
                }
            });
        }
    });
}

// Atualizar UIManager para lidar com estado de vitória
const originalUpdateUI = UIManager.prototype.updateUI;
UIManager.prototype.updateUI = function(state) {
    originalUpdateUI.call(this, state);
    
    if (state === GAME_STATES.VICTORY) {
        document.getElementById('victory-menu').classList.remove('hidden');
        if (this.game) {
            document.getElementById('final-score-victory-value').textContent = this.game.stats.score;
        }
    }
};

