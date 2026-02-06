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
let masterGain = null;
let inhaleTone = null;
let holdTone = null;
let exhaleTone = null;

// モバイルデバイス検出
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
// iOS検出
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
             (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// スマホでは呼吸アニメーションのスケールを小さくする
const breathScale = (window.innerWidth <= 768) ? 1.3 : 1.5;

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
    
    console.log('要素の初期化完了');
}

// AudioContextを初期化（直接ユーザージェスチャーから呼び出す必要あり）
function initAudioContext() {
    if (audioContext) return audioContext;
    
    try {
        console.log('AudioContextを初期化します');
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // マスターゲインノード
        masterGain = audioContext.createGain();
        masterGain.gain.value = 0.3; // 全体音量
        masterGain.connect(audioContext.destination);
        
        console.log('AudioContext初期化完了:', audioContext.state);
        return audioContext;
    } catch (e) {
        console.error('AudioContext初期化エラー:', e);
        return null;
    }
}

// 音声トーンを作成（AudioContextが初期化された後に呼び出す）
function setupTones() {
    if (!audioContext) return false;
    
    try {
        console.log('トーンを設定します');
        
        // 既存のトーンがあれば停止
        if (inhaleTone) {
            try { inhaleTone.oscillator.stop(); } catch (e) {}
        }
        if (holdTone) {
            try { holdTone.oscillator.stop(); } catch (e) {}
        }
        if (exhaleTone) {
            try { exhaleTone.oscillator.stop(); } catch (e) {}
        }
        
        // 新しいトーンを作成
        inhaleTone = createTone(396);
        holdTone = createTone(528);
        exhaleTone = createTone(639);
        
        console.log('トーン設定完了');
        return true;
    } catch (e) {
        console.error('トーン設定エラー:', e);
        return false;
    }
}

// トーン生成関数
function createTone(frequency, waveType = 'sine') {
    if (!audioContext) return null;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = waveType;
        oscillator.frequency.value = frequency;
        gainNode.gain.value = 0;
        
        oscillator.connect(gainNode);
        gainNode.connect(masterGain || audioContext.destination);
        
        // ここでは開始しない
        
        return { oscillator, gainNode, isStarted: false };
    } catch (e) {
        console.error(`トーン生成エラー (${frequency}Hz):`, e);
        return null;
    }
}

// 音声トーンを開始（ユーザージェスチャー内で呼び出す）
function startTones() {
    if (!audioContext || !inhaleTone || !holdTone || !exhaleTone) return false;
    
    try {
        console.log('トーンを開始します');
        
        // トーンが開始されていなければ開始
        if (!inhaleTone.isStarted) {
            inhaleTone.oscillator.start();
            inhaleTone.isStarted = true;
        }
        
        if (!holdTone.isStarted) {
            holdTone.oscillator.start();
            holdTone.isStarted = true;
        }
        
        if (!exhaleTone.isStarted) {
            exhaleTone.oscillator.start();
            exhaleTone.isStarted = true;
        }
        
        console.log('トーン開始完了');
        audioEnabled = true;
        return true;
    } catch (e) {
        console.error('トーン開始エラー:', e);
        return false;
    }
}

// 呼吸フェーズに合わせて音量を変更
function adjustToneVolumes(phase) {
    if (!audioEnabled || !audioContext || !inhaleTone || !holdTone || !exhaleTone) {
        return;
    }

    try {
        const now = audioContext.currentTime;
        const fadeTime = 0.2; // フェード時間
        
        if (phase === 'inhale') {
            inhaleTone.gainNode.gain.cancelScheduledValues(now);
            holdTone.gainNode.gain.cancelScheduledValues(now);
            exhaleTone.gainNode.gain.cancelScheduledValues(now);
            
            inhaleTone.gainNode.gain.setValueAtTime(inhaleTone.gainNode.gain.value, now);
            holdTone.gainNode.gain.setValueAtTime(holdTone.gainNode.gain.value, now);
            exhaleTone.gainNode.gain.setValueAtTime(exhaleTone.gainNode.gain.value, now);
            
            inhaleTone.gainNode.gain.linearRampToValueAtTime(0.8, now + fadeTime);
            holdTone.gainNode.gain.linearRampToValueAtTime(0, now + fadeTime);
            exhaleTone.gainNode.gain.linearRampToValueAtTime(0, now + fadeTime);
        } 
        else if (phase === 'hold') {
            inhaleTone.gainNode.gain.cancelScheduledValues(now);
            holdTone.gainNode.gain.cancelScheduledValues(now);
            exhaleTone.gainNode.gain.cancelScheduledValues(now);
            
            inhaleTone.gainNode.gain.setValueAtTime(inhaleTone.gainNode.gain.value, now);
            holdTone.gainNode.gain.setValueAtTime(holdTone.gainNode.gain.value, now);
            exhaleTone.gainNode.gain.setValueAtTime(exhaleTone.gainNode.gain.value, now);
            
            inhaleTone.gainNode.gain.linearRampToValueAtTime(0, now + fadeTime);
            holdTone.gainNode.gain.linearRampToValueAtTime(0.8, now + fadeTime);
            exhaleTone.gainNode.gain.linearRampToValueAtTime(0, now + fadeTime);
        } 
        else if (phase === 'exhale') {
            inhaleTone.gainNode.gain.cancelScheduledValues(now);
            holdTone.gainNode.gain.cancelScheduledValues(now);
            exhaleTone.gainNode.gain.cancelScheduledValues(now);
            
            inhaleTone.gainNode.gain.setValueAtTime(inhaleTone.gainNode.gain.value, now);
            holdTone.gainNode.gain.setValueAtTime(holdTone.gainNode.gain.value, now);
            exhaleTone.gainNode.gain.setValueAtTime(exhaleTone.gainNode.gain.value, now);
            
            inhaleTone.gainNode.gain.linearRampToValueAtTime(0, now + fadeTime);
            holdTone.gainNode.gain.linearRampToValueAtTime(0, now + fadeTime);
            exhaleTone.gainNode.gain.linearRampToValueAtTime(0.8, now + fadeTime);
        }
        else { // idle
            // すべての音を無音に
            inhaleTone.gainNode.gain.cancelScheduledValues(now);
            holdTone.gainNode.gain.cancelScheduledValues(now);
            exhaleTone.gainNode.gain.cancelScheduledValues(now);
            
            inhaleTone.gainNode.gain.setValueAtTime(inhaleTone.gainNode.gain.value, now);
            holdTone.gainNode.gain.setValueAtTime(holdTone.gainNode.gain.value, now);
            exhaleTone.gainNode.gain.setValueAtTime(exhaleTone.gainNode.gain.value, now);
            
            inhaleTone.gainNode.gain.linearRampToValueAtTime(0, now + fadeTime);
            holdTone.gainNode.gain.linearRampToValueAtTime(0, now + fadeTime);
            exhaleTone.gainNode.gain.linearRampToValueAtTime(0, now + fadeTime);
        }
    } catch (e) {
        console.error('音量調整エラー:', e);
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
            { transform: `scale(${breathScale})`, boxShadow: '0 0 50px rgba(138, 158, 240, 0.8)' }
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
            { transform: `scale(${breathScale})`, boxShadow: '0 0 50px rgba(138, 158, 240, 0.8)' },
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
    
    console.log('呼吸セッションを開始します');
    
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
    
    // 音声が有効なら音を停止
    if (audioEnabled && audioContext && inhaleTone && holdTone && exhaleTone) {
        try {
            adjustToneVolumes('idle'); // すべての音を無音に
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

// 音声を初期化してセットアップ（ユーザージェスチャー内で呼び出す）
function setupAudio() {
    // AudioContextを初期化
    const ctx = initAudioContext();
    if (!ctx) return false;
    
    // 一時停止状態なら再開を試みる
    if (ctx.state === 'suspended') {
        console.log('AudioContextを再開します');
        ctx.resume().then(() => {
            console.log('AudioContext再開成功:', ctx.state);
            // トーンをセットアップ
            if (setupTones()) {
                // トーンを開始
                startTones();
            }
        }).catch(err => {
            console.error('AudioContext再開失敗:', err);
        });
    } else {
        // 既に実行中なら直接トーンをセットアップ
        if (setupTones()) {
            // トーンを開始
            startTones();
        }
    }
    
    return true;
}

// イベントリスナーの設定
function setupEventListeners() {
    console.log('イベントリスナーを設定します');
    
    // 開始ボタン - クリック
    startBtn.addEventListener('click', function(e) {
        console.log('開始ボタンがクリックされました');
        
        // 音声のセットアップ（ユーザージェスチャー内で）
        setupAudio();
        
        // 呼吸を開始
        startBreathing();
    });
    
    // 開始ボタン - タッチ
    startBtn.addEventListener('touchend', function(e) {
        e.preventDefault(); // デフォルトの動作を防止
        console.log('開始ボタンがタッチされました');
        
        // 音声のセットアップ（ユーザージェスチャー内で）
        setupAudio();
        
        // 呼吸を開始
        startBreathing();
    });
    
    // 停止ボタン - クリック
    stopBtn.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('停止ボタンがクリックされました');
        stopBreathing();
    });
    
    // 停止ボタン - タッチ
    stopBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        console.log('停止ボタンがタッチされました');
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
            
            // パターン変更時も音声を初期化（ユーザージェスチャー内で）
            setupAudio();
        };
        
        // クリックイベント
        btn.addEventListener('click', patternChangeHandler);
        
        // タッチイベント
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
            if (isBreathing) {
                stopBreathing();
            } else {
                // 音声のセットアップ（ユーザージェスチャー内で）
                setupAudio();
                startBreathing();
            }
        }
        
        // ESCキーで停止
        if (e.code === 'Escape' && isBreathing) {
            e.preventDefault();
            stopBreathing();
        }
    });
    
    // iOS Safariの対策のためのタッチリスナー
    if (isIOS) {
        console.log('iOS向けのタッチリスナーを設定');
        
        // ページ内の任意の場所をタップしたときにAudioContextを有効化
        document.body.addEventListener('touchend', function iosTouchHandler() {
            console.log('iOS: ドキュメントがタッチされました');
            setupAudio();
            // 一度だけ実行するためリスナーを削除
            document.body.removeEventListener('touchend', iosTouchHandler);
        });
    }
    
    console.log('イベントリスナーの設定が完了しました');
}

// 初期化関数
function init() {
    console.log('アプリケーション初期化を開始します');
    console.log('デバイス:', isMobile ? 'モバイル' : 'デスクトップ', isIOS ? '(iOS)' : '');
    
    // DOM要素を取得
    initElements();
    
    // パーティクル作成
    createParticles();
    
    // イベントリスナー設定
    setupEventListeners();
    
    console.log('アプリケーション初期化が完了しました');
}

// ページ読み込み時に初期化を実行
document.addEventListener('DOMContentLoaded', init);