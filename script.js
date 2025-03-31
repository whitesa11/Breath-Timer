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

// 単純化したオーディオ用変数
let inhaleSoundGain = null;
let holdSoundGain = null;
let exhaleSoundGain = null;

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

// 注意：この関数はユーザーインタラクション時にのみ呼び出す
function initializeAudio() {
    if (audioInitialized) {
        console.log(LOG_PREFIX + 'オーディオはすでに初期化されています');
        return;
    }
    
    console.log(LOG_PREFIX + 'オーディオを初期化します');
    
    // iOS Safariでの再生を確実にするためのサイレントファイル再生
    if (isIOS) {
        playSilentSound();
    }
    
    try {
        // AudioContextの作成
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();
        
        console.log(LOG_PREFIX + 'AudioContext状態:', audioContext.state);
        
        // 再生が一時停止状態なら再開試行
        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log(LOG_PREFIX + 'AudioContext再開成功:', audioContext.state);
                createSounds();
            }).catch(err => {
                console.error(LOG_PREFIX + 'AudioContext再開失敗:', err);
            });
        } else {
            createSounds();
        }
        
        audioInitialized = true;
    } catch (e) {
        console.error(LOG_PREFIX + 'オーディオ初期化エラー:', e);
    }
}

// iOS Safariでの音声再生を確実にするためのサイレントサウンド
function playSilentSound() {
    try {
        // 無音の音声ファイルを作成（データURIを使用）
        const silentSound = new Audio("data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU3LjU2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAkJCQkJCQkJCQkJCQkJCQwMDAwMDAwMDAwMDAwMDAwMD///////////////////////////////////////////////8AAAAATGF2YzU3LjY0AAAAAAAAAAAAAAAAJAUHkkMAAAAAAAGwsIKv5wAAAAAAAAAAAAAAAAAAAP/jWMQAEvkixv6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+MYxDUAUmICQvtYAQAAABhTT0hMSExORVJVU4CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/+MYxEkAUmYCQvrSAAMmQQQhE1MTU1NSJUCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA");
        
        // 再生開始前のハンドラーを設定
        silentSound.addEventListener('canplaythrough', () => {
            console.log(LOG_PREFIX + 'サイレントサウンド再生準備完了');
            silentSound.play()
                .then(() => {
                    console.log(LOG_PREFIX + 'サイレントサウンド再生成功');
                })
                .catch(err => {
                    console.error(LOG_PREFIX + 'サイレントサウンド再生失敗:', err);
                });
        }, { once: true });
        
        // エラーハンドラーを設定
        silentSound.addEventListener('error', (e) => {
            console.error(LOG_PREFIX + 'サイレントサウンド読み込みエラー:', e);
        }, { once: true });
        
        // 読み込み開始
        silentSound.load();
    } catch (e) {
        console.error(LOG_PREFIX + 'サイレントサウンド作成エラー:', e);
    }
}

// 音声の生成
function createSounds() {
    if (!audioContext) return;
    
    try {
        console.log(LOG_PREFIX + '音声を生成します');
        
        // 吸う音
        const inhaleOsc = audioContext.createOscillator();
        inhaleOsc.type = 'sine';
        inhaleOsc.frequency.value = 396;
        inhaleSoundGain = audioContext.createGain();
        inhaleSoundGain.gain.value = 0;
        inhaleOsc.connect(inhaleSoundGain);
        inhaleSoundGain.connect(audioContext.destination);
        inhaleOsc.start();
        
        // 止める音
        const holdOsc = audioContext.createOscillator();
        holdOsc.type = 'sine';
        holdOsc.frequency.value = 528;
        holdSoundGain = audioContext.createGain();
        holdSoundGain.gain.value = 0;
        holdOsc.connect(holdSoundGain);
        holdSoundGain.connect(audioContext.destination);
        holdOsc.start();
        
        // 吐く音
        const exhaleOsc = audioContext.createOscillator();
        exhaleOsc.type = 'sine';
        exhaleOsc.frequency.value = 639;
        exhaleSoundGain = audioContext.createGain();
        exhaleSoundGain.gain.value = 0;
        exhaleOsc.connect(exhaleSoundGain);
        exhaleSoundGain.connect(audioContext.destination);
        exhaleOsc.start();
        
        console.log(LOG_PREFIX + '音声生成完了');
        audioEnabled = true;
    } catch (e) {
        console.error(LOG_PREFIX + '音声生成エラー:', e);
        audioEnabled = false;
    }
}

// オーディオ状態の確認と復旧
function checkAudioState() {
    if (!audioContext) return false;
    
    if (audioContext.state === 'suspended') {
        console.log(LOG_PREFIX + 'AudioContextが一時停止状態です。再開を試みます。');
        
        audioContext.resume().then(() => {
            console.log(LOG_PREFIX + 'AudioContext再開成功:', audioContext.state);
            return true;
        }).catch(e => {
            console.error(LOG_PREFIX + 'AudioContext再開失敗:', e);
            return false;
        });
    }
    
    return audioContext.state === 'running';
}

// 呼吸フェーズに合わせて音量を変更
function adjustToneVolumes(phase) {
    if (!audioEnabled || !audioContext) return;
    
    // オーディオ状態の確認
    checkAudioState();
    
    if (audioContext.state !== 'running') {
        console.log(LOG_PREFIX + 'AudioContextが実行状態ではないため音量調整をスキップします');
        return;
    }
    
    try {
        const now = audioContext.currentTime;
        const fadeTime = 0.2; // フェード時間
        
        // ゲインノードが存在するか確認
        if (!inhaleSoundGain || !holdSoundGain || !exhaleSoundGain) {
            console.error(LOG_PREFIX + 'ゲインノードが初期化されていません');
            return;
        }
        
        if (phase === 'inhale') {
            inhaleSoundGain.gain.cancelScheduledValues(now);
            holdSoundGain.gain.cancelScheduledValues(now);
            exhaleSoundGain.gain.cancelScheduledValues(now);
            
            inhaleSoundGain.gain.setValueAtTime(inhaleSoundGain.gain.value, now);
            holdSoundGain.gain.setValueAtTime(holdSoundGain.gain.value, now);
            exhaleSoundGain.gain.setValueAtTime(exhaleSoundGain.gain.value, now);
            
            inhaleSoundGain.gain.linearRampToValueAtTime(0.5, now + fadeTime);
            holdSoundGain.gain.linearRampToValueAtTime(0, now + fadeTime);
            exhaleSoundGain.gain.linearRampToValueAtTime(0, now + fadeTime);
            
            console.log(LOG_PREFIX + '吸う音に切り替え');
        } 
        else if (phase === 'hold') {
            inhaleSoundGain.gain.cancelScheduledValues(now);
            holdSoundGain.gain.cancelScheduledValues(now);
            exhaleSoundGain.gain.cancelScheduledValues(now);
            
            inhaleSoundGain.gain.setValueAtTime(inhaleSoundGain.gain.value, now);
            holdSoundGain.gain.setValueAtTime(holdSoundGain.gain.value, now);
            exhaleSoundGain.gain.setValueAtTime(exhaleSoundGain.gain.value, now);
            
            inhaleSoundGain.gain.linearRampToValueAtTime(0, now + fadeTime);
            holdSoundGain.gain.linearRampToValueAtTime(0.5, now + fadeTime);
            exhaleSoundGain.gain.linearRampToValueAtTime(0, now + fadeTime);
            
            console.log(LOG_PREFIX + '止める音に切り替え');
        } 
        else if (phase === 'exhale') {
            inhaleSoundGain.gain.cancelScheduledValues(now);
            holdSoundGain.gain.cancelScheduledValues(now);
            exhaleSoundGain.gain.cancelScheduledValues(now);
            
            inhaleSoundGain.gain.setValueAtTime(inhaleSoundGain.gain.value, now);
            holdSoundGain.gain.setValueAtTime(holdSoundGain.gain.value, now);
            exhaleSoundGain.gain.setValueAtTime(exhaleSoundGain.gain.value, now);
            
            inhaleSoundGain.gain.linearRampToValueAtTime(0, now + fadeTime);
            holdSoundGain.gain.linearRampToValueAtTime(0, now + fadeTime);
            exhaleSoundGain.gain.linearRampToValueAtTime(0.5, now + fadeTime);
            
            console.log(LOG_PREFIX + '吐く音に切り替え');
        }
        else { // idle
            inhaleSoundGain.gain.cancelScheduledValues(now);
            holdSoundGain.gain.cancelScheduledValues(now);
            exhaleSoundGain.gain.cancelScheduledValues(now);
            
            inhaleSoundGain.gain.setValueAtTime(inhaleSoundGain.gain.value, now);
            holdSoundGain.gain.setValueAtTime(holdSoundGain.gain.value, now);
            exhaleSoundGain.gain.setValueAtTime(exhaleSoundGain.gain.value, now);
            
            inhaleSoundGain.gain.linearRampToValueAtTime(0, now + fadeTime);
            holdSoundGain.gain.linearRampToValueAtTime(0, now + fadeTime);
            exhaleSoundGain.gain.linearRampToValueAtTime(0, now + fadeTime);
            
            console.log(LOG_PREFIX + '全ての音をミュート');
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
    
    // すでにユーザーがインタラクションしている場合は音声を初期化
    if (userInteracted && !audioInitialized) {
        initializeAudio();
    }
    
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

// ユーザーインタラクションを検出する関数
function handleUserInteraction(e) {
    console.log(LOG_PREFIX + 'ユーザーインタラクション検出:', e.type);
    userInteracted = true;
    
    // iOS Safariの場合は特に慎重に処理
    if (isIOS) {
        initializeAudio();
    }
}

// イベントリスナーの設定
function setupEventListeners() {
    console.log(LOG_PREFIX + 'イベントリスナーを設定します');
    
    // ユーザーインタラクションを検出するイベントリスナー
    document.addEventListener('touchstart', handleUserInteraction, { once: true });
    document.addEventListener('touchend', handleUserInteraction, { once: true });
    document.addEventListener('click', handleUserInteraction, { once: true });
    
    // 開始ボタン - クリック
    startBtn.addEventListener('click', function(e) {
        console.log(LOG_PREFIX + '開始ボタンがクリックされました');
        
        // 音声を初期化
        initializeAudio();
        
        // 少し遅延を入れて呼吸を開始（音声初期化の時間を確保）
        setTimeout(() => {
            startBreathing();
        }, 100);
    });
    
    // 開始ボタン - タッチ
    startBtn.addEventListener('touchstart', function(e) {
        // タッチ開始時はデフォルトの動作を防止するだけ
        e.preventDefault();
    });
    
    startBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        console.log(LOG_PREFIX + '開始ボタンがタッチされました');
        
        // 音声を初期化
        initializeAudio();
        
        // 少し遅延を入れて呼吸を開始（音声初期化の時間を確保）
        setTimeout(() => {
            startBreathing();
        }, 100);
    });
    
    // 停止ボタン - クリック
    stopBtn.addEventListener('click', function(e) {
        console.log(LOG_PREFIX + '停止ボタンがクリックされました');
        stopBreathing();
    });
    
    // 停止ボタン - タッチ
    stopBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        console.log(LOG_PREFIX + '停止ボタンがタッチされました');
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
            
            // パターン変更時も音声を初期化
            initializeAudio();
        };
        
        // クリックイベント
        btn.addEventListener('click', patternChangeHandler);
        
        // タッチイベント
        btn.addEventListener('touchend', function(e) {
            e.preventDefault();
            patternChangeHandler.call(this, e);
        });
    });
    
    // iOS Safariの場合は追加のトリガーを設定
    if (isIOS) {
        // ボディ全体へのタッチリスナー（一度だけ実行）
        document.body.addEventListener('touchend', function iosTouchend() {
            console.log(LOG_PREFIX + 'iOS: ボディがタッチされました');
            initializeAudio();
            document.body.removeEventListener('touchend', iosTouchend);
        }, { once: true });
    }
    
    // キーボードショートカット
    document.addEventListener('keydown', function(e) {
        // スペースキーで開始/停止を切り替え
        if (e.code === 'Space') {
            e.preventDefault();
            if (isBreathing) {
                stopBreathing();
            } else {
                initializeAudio();
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
            console.log(LOG_PREFIX + 'ページがバックグラウンドになりました');
        } else {
            console.log(LOG_PREFIX + 'ページがフォアグラウンドに戻りました');
            
            // フォアグラウンドに戻ったときは音声を再開
            if (isBreathing && audioContext && audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                    console.log(LOG_PREFIX + 'AudioContextを再開しました');
                });
            }
        }
    });
    
    console.log(LOG_PREFIX + 'イベントリスナーの設定が完了しました');
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
    
    console.log(LOG_PREFIX + 'アプリケーション初期化が完了しました');
}

// ページ読み込み時に初期化を実行
document.addEventListener('DOMContentLoaded', init);

// iOSの互換性のために無音ファイルを追加でプリロード
if (isIOS) {
    window.addEventListener('load', function() {
        console.log(LOG_PREFIX + 'iOS向けの無音ファイルをプリロードします');
        const silence = new Audio("data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU3LjU2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAkJCQkJCQkJCQkJCQkJCQwMDAwMDAwMDAwMDAwMDAwMD///////////////////////////////////////////////8AAAAATGF2YzU3LjY0AAAAAAAAAAAAAAAAJAUHkkMAAAAAAAGwsIKv5wAAAAAAAAAAAAAAAAAAAP/jWMQAEvkixv6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+MYxDUAUmICQvtYAQAAABhTT0hMSExORVJVU4CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/+MYxEkAUmYCQvrSAAMmQQQhE1MTU1NSJUCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA");
        silence.load();
    });
}