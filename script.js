// グローバル変数
let isBreathing = false;
let breathingInterval = null;
let timeInterval = null;
let phase = 'idle';
let cycles = 0;
let startTime;

// 呼吸パターンの設定
let inhaleTime = 4;
let holdTime = 4;
let exhaleTime = 4;

// DOM要素の取得
let breathCircle, instructions, startBtn, stopBtn, patternBtns, waves, cycleCount, timer, particles;

// 音声関連
let audioContext = null;
let inhaleSound = null;
let holdSound = null;
let exhaleSound = null;

// DOMが読み込まれた後に要素を取得
function initElements() {
    breathCircle = document.getElementById('breathCircle');
    instructions = document.getElementById('instructions');
    startBtn = document.getElementById('startBtn');
    stopBtn = document.getElementById('stopBtn');
    patternBtns = document.querySelectorAll('.pattern-btn');
    waves = document.querySelector('.waves');
    cycleCount = document.getElementById('cycleCount');
    timer = document.getElementById('timer');
    particles = document.getElementById('particles');
}

// 音声コンテキストの初期化
function initAudio() {
    try {
        if (audioContext) {
            // すでに初期化されている場合は何もしない
            return true;
        }
        
        // AudioContextの作成
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('AudioContext状態:', audioContext.state);
        
        // 各フェーズの音を作成
        createSounds();
        
        return true;
    } catch (e) {
        console.error('音声の初期化に失敗しました:', e);
        return false;
    }
}

// サウンドの作成（AudioContextがアクティブな場合のみ）
function createSounds() {
    if (!audioContext) return false;
    
    try {
        // 既存のサウンドをクリーンアップ
        if (inhaleSound && inhaleSound.isPlaying) {
            try {
                inhaleSound.oscillator.stop();
                inhaleSound.isPlaying = false;
            } catch (e) {
                console.log('既存の吸う音を停止できませんでした', e);
            }
        }
        
        if (holdSound && holdSound.isPlaying) {
            try {
                holdSound.oscillator.stop();
                holdSound.isPlaying = false;
            } catch (e) {
                console.log('既存の保持音を停止できませんでした', e);
            }
        }
        
        if (exhaleSound && exhaleSound.isPlaying) {
            try {
                exhaleSound.oscillator.stop();
                exhaleSound.isPlaying = false;
            } catch (e) {
                console.log('既存の吐く音を停止できませんでした', e);
            }
        }
        
        // 新しいサウンドを作成
        inhaleSound = createTone(396);
        holdSound = createTone(528);
        exhaleSound = createTone(639);
        
        return true;
    } catch (e) {
        console.error('サウンドの作成に失敗しました:', e);
        return false;
    }
}

// 音声トーンの作成
function createTone(frequency, type = 'sine') {
    if (!audioContext) return null;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        
        gainNode.gain.value = 0;
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        return { oscillator, gainNode, isPlaying: false };
    } catch (e) {
        console.error('音声トーンの作成に失敗しました:', e);
        return null;
    }
}

// 呼吸音を開始
function startSounds() {
    if (!audioContext || !inhaleSound || !holdSound || !exhaleSound) {
        console.log('音声が初期化されていないため、開始できません');
        return false;
    }
    
    try {
        // すでに再生中なら何もしない
        if (inhaleSound.isPlaying && holdSound.isPlaying && exhaleSound.isPlaying) {
            return true;
        }
        
        // AudioContextが一時停止状態なら再開
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        // オシレーターが未開始なら開始
        if (!inhaleSound.isPlaying) {
            // 新しいオシレーターを作成
            inhaleSound.oscillator = audioContext.createOscillator();
            inhaleSound.oscillator.type = 'sine';
            inhaleSound.oscillator.frequency.value = 396;
            inhaleSound.oscillator.connect(inhaleSound.gainNode);
            inhaleSound.oscillator.start();
            inhaleSound.isPlaying = true;
        }
        
        if (!holdSound.isPlaying) {
            holdSound.oscillator = audioContext.createOscillator();
            holdSound.oscillator.type = 'sine';
            holdSound.oscillator.frequency.value = 528;
            holdSound.oscillator.connect(holdSound.gainNode);
            holdSound.oscillator.start();
            holdSound.isPlaying = true;
        }
        
        if (!exhaleSound.isPlaying) {
            exhaleSound.oscillator = audioContext.createOscillator();
            exhaleSound.oscillator.type = 'sine';
            exhaleSound.oscillator.frequency.value = 639;
            exhaleSound.oscillator.connect(exhaleSound.gainNode);
            exhaleSound.oscillator.start();
            exhaleSound.isPlaying = true;
        }
        
        console.log('音声が正常に開始されました');
        return true;
    } catch (e) {
        console.error('音声の開始に失敗しました:', e);
        return false;
    }
}

// パーティクルを作成
function createParticles() {
    particles.innerHTML = '';
    const count = 50;
    
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        const size = Math.random() * 5 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        
        particles.appendChild(particle);
        
        // ゆっくり浮遊させる
        animateParticle(particle);
    }
}

// パーティクルのアニメーション
function animateParticle(particle) {
    const speed = 1 + Math.random() * 2;
    const direction = Math.random() * Math.PI * 2;
    let x = parseFloat(particle.style.left);
    let y = parseFloat(particle.style.top);
    
    function move() {
        if (!document.body.contains(particle)) return;
        
        x += Math.cos(direction) * speed * 0.05;
        y += Math.sin(direction) * speed * 0.05;
        
        // 画面からはみ出さないようにする
        if (x < 0) x = 100;
        if (x > 100) x = 0;
        if (y < 0) y = 100;
        if (y > 100) y = 0;
        
        particle.style.left = `${x}%`;
        particle.style.top = `${y}%`;
        
        requestAnimationFrame(move);
    }
    
    move();
}

// 呼吸の状態に応じてサークルをアニメーション
function animateBreathCircle() {
    if (!isBreathing) return;
    
    breathCircle.style.transform = 'scale(1)';
    breathCircle.style.boxShadow = '0 0 30px rgba(138, 158, 240, 0.5)';
    waves.style.opacity = '0';
    
    if (phase === 'inhale') {
        // 吸う - スケールを元の大きさに戻す
        breathCircle.animate([
            { transform: 'scale(1)', boxShadow: '0 0 30px rgba(138, 158, 240, 0.5)' },
            { transform: 'scale(1.5)', boxShadow: '0 0 50px rgba(138, 158, 240, 0.8)' }
        ], {
            duration: inhaleTime * 1000,
            fill: 'forwards'
        });
        instructions.textContent = '吸う...';
        waves.style.opacity = '1';
        
        // 吸う音
        if (audioContext && inhaleSound && holdSound && exhaleSound) {
            inhaleSound.gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
            holdSound.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
            exhaleSound.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
        }
    } 
    else if (phase === 'hold') {
        // 息を止める
        instructions.textContent = '息を止める...';
        
        // 息を止める音
        if (audioContext && inhaleSound && holdSound && exhaleSound) {
            inhaleSound.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
            holdSound.gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
            exhaleSound.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
        }
    } 
    else if (phase === 'exhale') {
        // 吐く - スケールを元の大きさに戻す
        breathCircle.animate([
            { transform: 'scale(1.5)', boxShadow: '0 0 50px rgba(138, 158, 240, 0.8)' },
            { transform: 'scale(1)', boxShadow: '0 0 30px rgba(138, 158, 240, 0.5)' }
        ], {
            duration: exhaleTime * 1000,
            fill: 'forwards'
        });
        instructions.textContent = '吐く...';
        
        // 吐く音
        if (audioContext && inhaleSound && holdSound && exhaleSound) {
            inhaleSound.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
            holdSound.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
            exhaleSound.gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
        }
    }
}

// 呼吸サイクルを開始
function startBreathing() {
    if (isBreathing) return;
    
    console.log('呼吸セッションを開始します');
    
    isBreathing = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    
    // 音声を開始
    startSounds();
    
    // 経過時間の計測を開始
    startTime = new Date();
    timeInterval = setInterval(updateTimer, 1000);
    
    cycles = 0;
    cycleCount.textContent = cycles;
    
    // 呼吸サイクルを開始
    phase = 'idle';
    nextPhase();
    
    console.log('呼吸セッションが開始されました');
}

// 呼吸サイクルを停止
function stopBreathing() {
    console.log('停止処理を開始します');
    
    if (!isBreathing) {
        console.log('すでに停止しています');
        return;
    }
    
    // 状態を更新
    isBreathing = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    
    // タイマーをクリア
    if (breathingInterval) {
        clearTimeout(breathingInterval);
        breathingInterval = null;
    }
    
    if (timeInterval) {
        clearInterval(timeInterval);
        timeInterval = null;
    }
    
    // 音声を停止
    if (audioContext && inhaleSound && holdSound && exhaleSound) {
        try {
            inhaleSound.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
            holdSound.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
            exhaleSound.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
            
            if (inhaleSound.isPlaying) {
                inhaleSound.oscillator.stop();
                inhaleSound.isPlaying = false;
            }
            
            if (holdSound.isPlaying) {
                holdSound.oscillator.stop();
                holdSound.isPlaying = false;
            }
            
            if (exhaleSound.isPlaying) {
                exhaleSound.oscillator.stop();
                exhaleSound.isPlaying = false;
            }
        } catch (e) {
            console.error('音声の停止に失敗しました:', e);
        }
    }
    
    // 表示をリセット
    phase = 'idle';
    instructions.textContent = '準備ができたら「開始」を押してください';
    breathCircle.style.transform = 'scale(1)';
    waves.style.opacity = '0';
    
    console.log('停止処理が完了しました');
}

// 次の呼吸フェーズに移行
function nextPhase() {
    if (!isBreathing) {
        console.log('呼吸セッションが停止されました');
        return;
    }
    
    if (phase === 'idle' || phase === 'exhale') {
        // exhaleフェーズが完了したらサイクルをカウントアップ
        if (phase === 'exhale') {
            cycles++;
            cycleCount.textContent = cycles;
        }
        
        phase = 'inhale';
        animateBreathCircle();
        breathingInterval = setTimeout(nextPhase, inhaleTime * 1000);
    } 
    else if (phase === 'inhale' && holdTime > 0) {
        phase = 'hold';
        animateBreathCircle();
        breathingInterval = setTimeout(nextPhase, holdTime * 1000);
    } 
    else {
        phase = 'exhale';
        animateBreathCircle();
        breathingInterval = setTimeout(nextPhase, exhaleTime * 1000);
    }
}

// 経過時間を更新
function updateTimer() {
    if (!isBreathing) return;
    
    const elapsed = Math.floor((new Date() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    timer.textContent = `${minutes}:${seconds}`;
}

// 呼吸パターンを設定
function setBreathPattern(inhale, hold, exhale) {
    inhaleTime = inhale;
    holdTime = hold;
    exhaleTime = exhale;
}

// イベントリスナーの設定
function setupEventListeners() {
    // 開始ボタン
    startBtn.addEventListener('click', function() {
        console.log('開始ボタンがクリックされました');
        
        // AudioContextをユーザージェスチャー内で初期化
        if (!audioContext) {
            initAudio();
        }
        
        // AudioContextが一時停止状態なら再開
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log('AudioContext resumed successfully');
                startBreathing();
            }).catch(err => {
                console.error('Failed to resume AudioContext', err);
                // 音声なしでも開始を続行
                startBreathing();
            });
        } else {
            startBreathing();
        }
    });
    
    startBtn.addEventListener('touchend', function(e) {
        console.log('開始ボタンがタッチされました');
        e.preventDefault();
        
        // タッチイベントでも同様に処理
        if (!audioContext) {
            initAudio();
        }
        
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                startBreathing();
            }).catch(() => {
                startBreathing();
            });
        } else {
            startBreathing();
        }
    });
    
    // 停止ボタン - クリックとタッチの両方に対応
    stopBtn.addEventListener('click', function(e) {
        console.log('停止ボタンがクリックされました');
        e.preventDefault();
        stopBreathing();
    });
    
    stopBtn.addEventListener('touchend', function(e) {
        console.log('停止ボタンがタッチされました');
        e.preventDefault();
        stopBreathing();
    });
    
    // パターン選択ボタン
    patternBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            patternBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const inhale = parseInt(this.dataset.inhale);
            const hold = parseInt(this.dataset.hold);
            const exhale = parseInt(this.dataset.exhale);
            
            setBreathPattern(inhale, hold, exhale);
        });
    });
    
    // キーボードショートカット
    document.addEventListener('keydown', function(e) {
        // スペースキーで開始/停止を切り替え
        if (e.code === 'Space') {
            e.preventDefault();
            if (isBreathing) {
                stopBreathing();
            } else {
                if (!audioContext) {
                    initAudio();
                }
                
                if (audioContext && audioContext.state === 'suspended') {
                    audioContext.resume().then(startBreathing).catch(startBreathing);
                } else {
                    startBreathing();
                }
            }
        }
        
        // ESCキーで停止
        if (e.code === 'Escape' && isBreathing) {
            e.preventDefault();
            stopBreathing();
        }
    });
}

// iOS Safariの自動再生制限対策
function setupIOSAudioFix() {
    // iOS Safariでは、ユーザーのインタラクションが必要
    // 画面全体をタップしたときにもAudioContextを有効化
    document.body.addEventListener('touchend', function() {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log('Body touch: AudioContext resumed');
            }).catch(e => {
                console.error('Body touch: Failed to resume AudioContext', e);
            });
        }
    }, { once: true });
}

// 初期化関数
function init() {
    // まずDOM要素を取得
    initElements();
    // パーティクル作成
    createParticles();
    // イベントリスナー設定
    setupEventListeners();
    // iOS Safari用の対策
    setupIOSAudioFix();
    
    console.log('アプリケーションが初期化されました');
}

// ページ読み込み時に初期化を実行
window.addEventListener('load', init);