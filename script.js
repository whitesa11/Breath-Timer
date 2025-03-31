// グローバル変数
let isBreathing = false;
let breathingInterval = null;
let timeInterval = null;
let phase = 'idle';
let cycles = 0;
let startTime;
let audioEnabled = false;

// 呼吸パターンの設定
let inhaleTime = 4;
let holdTime = 4;
let exhaleTime = 4;

// DOM要素の取得
let breathCircle, instructions, startBtn, stopBtn, patternBtns, waves, cycleCount, timer, particles;

// 音声関連
let audioContext = null;
let audioInitialized = false;
let audioTones = {};
let unlocked = false;

// デバイス検出
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
const isSafari = /Safari/.test(navigator.userAgent) && !isChrome;

// ユーザーインタラクション検出フラグ
let userInteracted = false;

// Log prefix for easier debugging
const LOG_PREFIX = '🔊 ';

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
    
    console.log(LOG_PREFIX + '要素の初期化完了');
}

// iOS Safariでオーディオをアンロック（タッチ・クリックイベント内で呼び出す）
function unlockAudio() {
    if (unlocked) return true;
    
    console.log(LOG_PREFIX + 'オーディオのアンロックを試みます');
    
    try {
        // AudioContextの作成
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        
        if (!audioContext) {
            audioContext = new AudioContext();
            console.log(LOG_PREFIX + 'AudioContext作成:', audioContext.state);
        }
        
        // iOSの場合、空のバッファを再生してアンロック
        if (isIOS || isSafari) {
            const buffer = audioContext.createBuffer(1, 1, 22050);
            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.destination);
            
            // iOSの場合は開始時刻を指定
            if (isIOS) {
                source.start(0);
            } else {
                source.start();
            }
            
            console.log(LOG_PREFIX + '空バッファ再生によるアンロック');
        }
        
        // 状態が suspended なら resume を試みる
        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log(LOG_PREFIX + 'AudioContext再開成功:', audioContext.state);
            }).catch(err => {
                console.error(LOG_PREFIX + 'AudioContext再開失敗:', err);
            });
        }
        
        unlocked = true;
        return true;
    } catch (e) {
        console.error(LOG_PREFIX + 'オーディオアンロックエラー:', e);
        return false;
    }
}

// 音声を設定（アンロック後に呼び出す）
function setupAudio() {
    if (!audioContext || audioInitialized) return false;
    
    try {
        console.log(LOG_PREFIX + '音声設定を開始します');
        
        // 基本的なゲインノード
        const masterGain = audioContext.createGain();
        masterGain.gain.value = 0.3; // 全体音量
        masterGain.connect(audioContext.destination);
        
        // 各フェーズのトーンを作成
        const frequencies = {
            inhale: 396,
            hold: 528,
            exhale: 639
        };
        
        Object.keys(frequencies).forEach(phase => {
            const oscillator = audioContext.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.value = frequencies[phase];
            
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0; // 初期は無音
            
            oscillator.connect(gainNode);
            gainNode.connect(masterGain);
            
            try {
                oscillator.start(0);
            } catch (e) {
                console.error(LOG_PREFIX + phase + 'トーン開始エラー:', e);
            }
            
            audioTones[phase] = {
                oscillator: oscillator,
                gainNode: gainNode
            };
        });
        
        audioInitialized = true;
        audioEnabled = true;
        console.log(LOG_PREFIX + '音声設定完了');
        return true;
    } catch (e) {
        console.error(LOG_PREFIX + '音声設定エラー:', e);
        return false;
    }
}

// 呼吸フェーズに合わせて音量を変更
function adjustToneVolumes(breathPhase) {
    if (!audioEnabled || !audioContext || !audioInitialized) return;
    
    try {
        const now = audioContext.currentTime;
        const fadeTime = 0.2; // フェード時間
        
        // すべてのトーンのゲインを取得
        const inhaleGain = audioTones.inhale ? audioTones.inhale.gainNode : null;
        const holdGain = audioTones.hold ? audioTones.hold.gainNode : null;
        const exhaleGain = audioTones.exhale ? audioTones.exhale.gainNode : null;
        
        if (!inhaleGain || !holdGain || !exhaleGain) {
            console.error(LOG_PREFIX + 'トーンが初期化されていません');
            return;
        }
        
        // 現在の値を取得して次の変更に備える
        inhaleGain.gain.cancelScheduledValues(now);
        holdGain.gain.cancelScheduledValues(now);
        exhaleGain.gain.cancelScheduledValues(now);
        
        inhaleGain.gain.setValueAtTime(inhaleGain.gain.value || 0, now);
        holdGain.gain.setValueAtTime(holdGain.gain.value || 0, now);
        exhaleGain.gain.setValueAtTime(exhaleGain.gain.value || 0, now);
        
        // 現在のフェーズに応じた音量設定
        if (breathPhase === 'inhale') {
            inhaleGain.gain.linearRampToValueAtTime(0.5, now + fadeTime);
            holdGain.gain.linearRampToValueAtTime(0, now + fadeTime);
            exhaleGain.gain.linearRampToValueAtTime(0, now + fadeTime);
        } 
        else if (breathPhase === 'hold') {
            inhaleGain.gain.linearRampToValueAtTime(0, now + fadeTime);
            holdGain.gain.linearRampToValueAtTime(0.5, now + fadeTime);
            exhaleGain.gain.linearRampToValueAtTime(0, now + fadeTime);
        }
        else if (breathPhase === 'exhale') {
            inhaleGain.gain.linearRampToValueAtTime(0, now + fadeTime);
            holdGain.gain.linearRampToValueAtTime(0, now + fadeTime);
            exhaleGain.gain.linearRampToValueAtTime(0.5, now + fadeTime);
        }
        else { // idle
            inhaleGain.gain.linearRampToValueAtTime(0, now + fadeTime);
            holdGain.gain.linearRampToValueAtTime(0, now + fadeTime);
            exhaleGain.gain.linearRampToValueAtTime(0, now + fadeTime);
        }
    } catch (e) {
        console.error(LOG_PREFIX + '音量調整エラー:', e);
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
        // 吸う - スケールを大きくする
        breathCircle.animate([
            { transform: 'scale(1)', boxShadow: '0 0 30px rgba(138, 158, 240, 0.5)' },
            { transform: 'scale(1.5)', boxShadow: '0 0 50px rgba(138, 158, 240, 0.8)' }
        ], {
            duration: inhaleTime * 1000,
            fill: 'forwards'
        });
        instructions.textContent = '吸う...';
        waves.style.opacity = '1';
        
        // 音を調整（音声が有効な場合のみ）
        if (audioEnabled) {
            adjustToneVolumes('inhale');
        }
    } 
    else if (phase === 'hold') {
        // 息を止める
        instructions.textContent = '息を止める...';
        
        // 音を調整（音声が有効な場合のみ）
        if (audioEnabled) {
            adjustToneVolumes('hold');
        }
    } 
    else if (phase === 'exhale') {
        // 吐く - スケールを元に戻す
        breathCircle.animate([
            { transform: 'scale(1.5)', boxShadow: '0 0 50px rgba(138, 158, 240, 0.8)' },
            { transform: 'scale(1)', boxShadow: '0 0 30px rgba(138, 158, 240, 0.5)' }
        ], {
            duration: exhaleTime * 1000,
            fill: 'forwards'
        });
        instructions.textContent = '吐く...';
        
        // 音を調整（音声が有効な場合のみ）
        if (audioEnabled) {
            adjustToneVolumes('exhale');
        }
    }
}

// 呼吸サイクルを開始
function startBreathing() {
    if (isBreathing) return;
    
    console.log(LOG_PREFIX + '呼吸セッションを開始します');
    
    isBreathing = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    
    // 経過時間の計測を開始
    startTime = new Date();
    timeInterval = setInterval(updateTimer, 1000);
    
    cycles = 0;
    cycleCount.textContent = cycles;
    
    // 呼吸サイクルを開始
    phase = 'idle';
    nextPhase();
    
    console.log(LOG_PREFIX + '呼吸セッションが開始されました');
}

// 呼吸サイクルを停止
function stopBreathing() {
    console.log(LOG_PREFIX + '停止処理を開始します');
    
    if (!isBreathing) {
        console.log(LOG_PREFIX + 'すでに停止しています');
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
    
    // 音声が有効なら音を停止
    if (audioEnabled) {
        adjustToneVolumes('idle');
    }
    
    // 表示をリセット
    phase = 'idle';
    instructions.textContent = '準備ができたら「開始」を押してください';
    breathCircle.style.transform = 'scale(1)';
    waves.style.opacity = '0';
    
    console.log(LOG_PREFIX + '停止処理が完了しました');
}

// 次の呼吸フェーズに移行
function nextPhase() {
    if (!isBreathing) {
        console.log(LOG_PREFIX + '呼吸セッションが停止されました');
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

// ハンドラー - ユーザーインタラクション
function handleUserInteraction(e) {
    userInteracted = true;
    console.log(LOG_PREFIX + 'ユーザーインタラクション検出:', e.type);
    
    // オーディオのアンロックを試みる
    unlockAudio();
    
    // すでにアンロック済みかつ初期化されていない場合は初期化
    if (unlocked && !audioInitialized) {
        setupAudio();
    }
}

// 開始ボタンハンドラー
function handleStart(e) {
    if (e) e.preventDefault();
    console.log(LOG_PREFIX + '開始処理を実行します');
    
    // 音声のアンロックと初期化
    unlockAudio();
    
    if (unlocked && !audioInitialized) {
        setupAudio();
    }
    
    // 呼吸を開始
    startBreathing();
}

// イベントリスナーの設定
function setupEventListeners() {
    console.log(LOG_PREFIX + 'イベントリスナーを設定します');
    
    // 画面全体へのインタラクションイベント（音声アンロック用）
    const interactionEvents = ['mousedown', 'touchstart', 'touchend', 'click'];
    
    interactionEvents.forEach(eventType => {
        document.addEventListener(eventType, handleUserInteraction, { once: true });
    });
    
    // 開始ボタン
    startBtn.addEventListener('click', handleStart);
    startBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        handleStart(e);
    });
    
    // 停止ボタン
    stopBtn.addEventListener('click', function(e) {
        e.preventDefault();
        stopBreathing();
    });
    
    stopBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        stopBreathing();
    });
    
    // パターン選択ボタン
    patternBtns.forEach(btn => {
        // パターン変更ハンドラー
        const patternChangeHandler = function(e) {
            if (e) e.preventDefault();
            
            patternBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const inhale = parseInt(this.dataset.inhale);
            const hold = parseInt(this.dataset.hold);
            const exhale = parseInt(this.dataset.exhale);
            
            setBreathPattern(inhale, hold, exhale);
            
            // インタラクションとしてカウント
            handleUserInteraction({ type: 'patternChange' });
        };
        
        btn.addEventListener('click', patternChangeHandler);
        btn.addEventListener('touchend', function(e) {
            e.preventDefault();
            patternChangeHandler.call(this, e);
        });
    });
    
    // キーボードショートカット
    document.addEventListener('keydown', function(e) {
        // スペースキーで開始/停止を切り替え
        if (e.code === 'Space') {
            e.preventDefault();
            handleUserInteraction({ type: 'keydown_space' });
            
            if (isBreathing) {
                stopBreathing();
            } else {
                handleStart();
            }
        }
        
        // ESCキーで停止
        if (e.code === 'Escape' && isBreathing) {
            e.preventDefault();
            stopBreathing();
        }
    });
    
    // メディアセッションが切れた場合などに対応
    if (typeof navigator.mediaSession !== 'undefined') {
        navigator.mediaSession.setActionHandler('play', function() {
            if (!isBreathing) handleStart();
        });
        
        navigator.mediaSession.setActionHandler('pause', function() {
            if (isBreathing) stopBreathing();
        });
    }
    
    console.log(LOG_PREFIX + 'イベントリスナーの設定が完了しました');
}

// iOS固有の対応策
function setupIOSWorkarounds() {
    if (!isIOS) return;
    
    console.log(LOG_PREFIX + 'iOS向けの対応策を設定します');
    
    // iOSの場合、ボディ全体をタップ可能にする
    document.body.addEventListener('touchend', function iosBugFix() {
        // 小さな音を再生してiOSのオーディオシステムをアンロック
        const silence = new Audio();
        silence.controls = false;
        silence.preload = 'auto';
        silence.src = 'data:audio/mp3;base64,/+MYxAAAAANIAAAAAExBTUUzLjk4LjIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
        silence.loop = false;
        silence.load();
        
        unlockAudio();
        
        document.body.removeEventListener('touchend', iosBugFix);
    });
    
    // iOS Safariで「開始」ボタンを2回タップする必要がある問題の対策
    startBtn.addEventListener('touchstart', function(e) {
        unlockAudio();
    });
}

// 初期化関数
function init() {
    console.log(LOG_PREFIX + 'アプリケーション初期化を開始します');
    console.log(LOG_PREFIX + 'デバイス情報:', 
        isIOS ? 'iOS' : 'iOS以外', 
        isSafari ? 'Safari' : 'Safari以外',
        isChrome ? 'Chrome' : 'Chrome以外');
    
    // DOM要素を取得
    initElements();
    
    // パーティクル作成
    createParticles();
    
    // イベントリスナー設定
    setupEventListeners();
    
    // iOS向けの特別対応
    if (isIOS) {
        setupIOSWorkarounds();
    }
    
    console.log(LOG_PREFIX + 'アプリケーション初期化が完了しました');
}

// ページ読み込み時に初期化を実行
document.addEventListener('DOMContentLoaded', init);

// iOSのタッチイベントの問題を解決するため、空のタッチハンドラーを追加
document.addEventListener('touchstart', function(){}, {passive: false});