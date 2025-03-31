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

// 音声システム初期化
function setupAudio() {
    // すでに初期化済みなら何もしない
    if (audioContext) {
        console.log('音声システムはすでに初期化されています');
        return true;
    }

    try {
        // AudioContextの作成
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // マスターゲインノード
        masterGain = audioContext.createGain();
        masterGain.gain.value = 0.3; // 全体音量
        masterGain.connect(audioContext.destination);
        
        console.log('AudioContext初期化:', audioContext.state);
        
        // 音を生成
        inhaleTone = createTone(396, masterGain);
        holdTone = createTone(528, masterGain);
        exhaleTone = createTone(639, masterGain);
        
        // AudioContextのイベントリスナー
        audioContext.onstatechange = function() {
            console.log('AudioContext状態変更:', audioContext.state);
        };
        
        return true;
    } catch (e) {
        console.error('音声システム初期化エラー:', e);
        // 音声なしでも続行
        audioEnabled = false;
        return false;
    }
}

// 音声を有効化（ユーザーインタラクション内で呼び出す必要あり）
function enableAudio() {
    // 音声コンテキストがなければ初期化
    if (!audioContext) {
        setupAudio();
    }
    
    // コンテキストが一時停止状態なら再開
    if (audioContext && audioContext.state === 'suspended') {
        console.log('AudioContextを再開します');
        
        audioContext.resume().then(() => {
            console.log('AudioContext再開成功:', audioContext.state);
            audioEnabled = true;
        }).catch(err => {
            console.error('AudioContext再開失敗:', err);
            audioEnabled = false;
        });
    } else if (audioContext && audioContext.state === 'running') {
        console.log('AudioContextは既に実行中です');
        audioEnabled = true;
    }
}

// トーン生成関数
function createTone(frequency, outputNode, waveType = 'sine') {
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = waveType;
        oscillator.frequency.value = frequency;
        gainNode.gain.value = 0;
        
        oscillator.connect(gainNode);
        gainNode.connect(outputNode);
        
        oscillator.start();
        
        return { oscillator, gainNode };
    } catch (e) {
        console.error(`トーン生成エラー (${frequency}Hz):`, e);
        return null;
    }
}

// 呼吸フェーズに合わせて音量を変更
function adjustToneVolumes(phase) {
    if (!audioEnabled || !audioContext || audioContext.state !== 'running') {
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
        
        // 音を調整
        adjustToneVolumes('inhale');
    } 
    else if (phase === 'hold') {
        // 息を止める
        instructions.textContent = '息を止める...';
        
        // 音を調整
        adjustToneVolumes('hold');
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
        
        // 音を調整
        adjustToneVolumes('exhale');
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

// 呼吸サイクルを開始
function startBreathing() {
    if (isBreathing) return;
    
    console.log('呼吸セッションを開始します');
    
    isBreathing = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    
    // 音声が有効なら音声を調整
    if (audioEnabled && audioContext && audioContext.state === 'running') {
        console.log('音声が有効です');
        adjustToneVolumes('idle'); // 初期状態
    } else {
        console.log('音声が無効またはサスペンド状態です');
    }
    
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
    if (audioEnabled && audioContext) {
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

// イベントリスナーの設定
function setupEventListeners() {
    console.log('イベントリスナーを設定します');
    
    // すべてのユーザーインタラクションで音声を有効化する関数
    function tryEnableAudio(e) {
        console.log('ユーザーインタラクション検出:', e.type);
        enableAudio();
    }
    
    // モバイルでの音声有効化のため、さまざまなイベントをリッスン
    document.addEventListener('touchstart', tryEnableAudio, {once: true});
    document.addEventListener('touchend', tryEnableAudio, {once: true});
    document.addEventListener('click', tryEnableAudio, {once: true});
    
    // 開始ボタン（クリックイベント）
    startBtn.addEventListener('click', function(e) {
        console.log('開始ボタンがクリックされました');
        e.preventDefault();
        
        // 音声を有効化して開始
        enableAudio();
        startBreathing();
    });
    
    // 開始ボタン（タッチイベント - モバイル用）
    startBtn.addEventListener('touchstart', function(e) {
        console.log('開始ボタンがタッチ開始されました');
        e.preventDefault(); // スクロールやズームを防止
        
        // 音声有効化のみ（実際の開始はtouchendで）
        enableAudio();
    });
    
    startBtn.addEventListener('touchend', function(e) {
        console.log('開始ボタンがタッチ終了されました');
        e.preventDefault();
        
        // 音声を有効化して開始
        enableAudio();
        setTimeout(() => {
            startBreathing();
        }, 100); // 少し遅延を入れる
    });
    
    // 停止ボタン（クリックイベント）
    stopBtn.addEventListener('click', function(e) {
        console.log('停止ボタンがクリックされました');
        e.preventDefault();
        stopBreathing();
    });
    
    // 停止ボタン（タッチイベント - モバイル用）
    stopBtn.addEventListener('touchstart', function(e) {
        console.log('停止ボタンがタッチ開始されました');
        e.preventDefault();
    });
    
    stopBtn.addEventListener('touchend', function(e) {
        console.log('停止ボタンがタッチ終了されました');
        e.preventDefault();
        stopBreathing();
    });
    
    // パターン選択ボタン
    patternBtns.forEach(btn => {
        // クリックとタッチの両方に対応
        const patternChangeHandler = function() {
            patternBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const inhale = parseInt(this.dataset.inhale);
            const hold = parseInt(this.dataset.hold);
            const exhale = parseInt(this.dataset.exhale);
            
            setBreathPattern(inhale, hold, exhale);
            
            // パターン変更時も音声を有効化
            enableAudio();
        };
        
        btn.addEventListener('click', patternChangeHandler);
        btn.addEventListener('touchend', function(e) {
            e.preventDefault();
            patternChangeHandler.call(this);
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
                enableAudio();
                startBreathing();
            }
        }
        
        // ESCキーで停止
        if (e.code === 'Escape' && isBreathing) {
            e.preventDefault();
            stopBreathing();
        }
    });
    
    // visibilitychange イベントでバックグラウンド検出
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            console.log('ページがバックグラウンドになりました');
            // バックグラウンドに行ったときは何もしない（音声は続行）
        } else {
            console.log('ページがフォアグラウンドに戻りました');
            // フォアグラウンドに戻ったときは音声を再開
            if (isBreathing && audioContext && audioContext.state === 'suspended') {
                enableAudio();
            }
        }
    });
    
    console.log('イベントリスナーの設定が完了しました');
}

// iOS Safariの自動再生制限対策
function setupIOSSpecificFixes() {
    if (!isIOS) return;
    
    console.log('iOS向けの追加対策を設定します');
    
    // iOS Safariでの音声再生を確実にするため、さまざまなイベントをキャッチ
    const userEvents = ['touchstart', 'touchend', 'mousedown', 'mouseup', 'click'];
    
    userEvents.forEach(eventType => {
        document.body.addEventListener(eventType, function onFirstTouch() {
            console.log('iOS: ユーザーインタラクション検出:', eventType);
            
            // 音声システムをセットアップ
            setupAudio();
            
            // 音声コンテキストが存在し、一時停止状態なら再開
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                    console.log('iOS: AudioContext再開成功');
                    audioEnabled = true;
                }).catch(err => {
                    console.error('iOS: AudioContext再開失敗:', err);
                });
            }
            
            // イベントリスナーを一度だけ実行して削除
            userEvents.forEach(e => document.body.removeEventListener(e, onFirstTouch));
        });
    });
    
    console.log('iOS向けの追加対策を設定しました');
}

// 初期化関数
function init() {
    console.log('アプリケーション初期化を開始します');
    console.log('デバイス:', isMobile ? 'モバイル' : 'デスクトップ', isIOS ? '(iOS)' : '');
    
    // まずDOM要素を取得
    initElements();
    
    // パーティクル作成
    createParticles();
    
    // イベントリスナー設定
    setupEventListeners();
    
    // iOS特有の対策
    if (isIOS) {
        setupIOSSpecificFixes();
    }
    
    // 初期音声セットアップを試みる（後でユーザー操作で有効化）
    setupAudio();
    
    console.log('アプリケーション初期化が完了しました');
}

// ページ読み込み時に初期化を実行
window.addEventListener('DOMContentLoaded', init);

// ページが完全に読み込まれたときの処理
window.addEventListener('load', function() {
    console.log('ページの読み込みが完了しました');
});