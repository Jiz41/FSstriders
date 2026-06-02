// ========================================
// FS Striders - Player Profile Generator
// Ver 1.2
// 2026年2月12日 / 2026年6月更新
// フルストライド100万本売れてくれ！！！！！！！！
//
// 作成者: Musyn Reagan (ファン制作)
// 非公式ツールです。公式とは一切関係ありません。
// バグ報告・改善案は気軽にムシンちゃんのXへどうぞ。
// ========================================

// ========== 枠番カラー定義 ==========
const WAKU_COLORS = {
    "1": { bg: "#ffffff", tx: "#000000" },
    "2": { bg: "#000000", tx: "#ffffff" },
    "3": { bg: "#e60012", tx: "#ffffff" },
    "4": { bg: "#0062ad", tx: "#ffffff" },
    "5": { bg: "#ffdb00", tx: "#000000" },
    "6": { bg: "#009944", tx: "#ffffff" },
    "7": { bg: "#f39800", tx: "#ffffff" },
    "8": { bg: "#e5007f", tx: "#ffffff" }
};

// ========== テキストデフォルト値 ==========
const DEFAULT_PLACEHOLDER = "---";
const DEFAULT_COMMENT     = "...よろしくお願いします";

// ========== カードサイズ ==========
const CARD_WIDTH  = 850;
const CARD_HEIGHT = 580;

// ========== レイアウト定数 ==========
const WAKU_BAR_WIDTH    = 100;   // 枠番カラーバー幅
const HEADER_HEIGHT     = 155;   // ヘッダーエリア高さ
const GREY_OVERLAY_X    = 340;   // グレー背景の開始X
const ICON_X            = 185;   // アイコン中心X座標
const ICON_Y            = 77.5;  // アイコン中心Y座標
const ICON_RADIUS_OUTER = 55;    // アイコン枠の半径
const ICON_RADIUS_INNER = 50;    // アイコン描画半径
const ICON_RADIUS_EMPTY = 40;    // 未設定アイコン半径
const TEXT_X            = 260;   // 名前・SNS テキスト開始X
const CONTENT_LEFT      = 130;   // コンテンツ左マージン
const COL2_X            = 475;   // 右カラム開始X
const CONTENT_WIDTH     = 690;   // コンテンツ幅
const COMMENT_LINE_Y    = 470;   // コメント区切り線Y座標
const DOT_PITCH         = 12;    // ドット柄の間隔（px）

// ========== 状態変数 ==========
let dotPatternCanvas = null;
let watermarkImage   = null;
let currentWaku      = "3";
let userIconImage    = null;
let updateTimer      = null;

const cardData = {
    waku:      "3",
    name:      "JOCKEY NAME",
    sns:       "@---",
    exp:       "馬歴 / Horse History: ---",
    hard:      "主なハード / Platform: ---",
    favHorse:  "---",
    favJockey: "---",
    blood:     "---",
    bank:      "---",
    coat:      "---",
    memorable: "---",
    style:     "---",
    way:       "---",
    time:      "---",
    comment:   "...よろしくお願いします"
};

// ========== DOM参照 ==========
const canvas = document.getElementById('preview-canvas');
const ctx    = canvas.getContext('2d');

const inputs = {
    waku:      document.getElementById('in-waku'),
    icon:      document.getElementById('in-icon'),
    n:         document.getElementById('in-n'),
    sns:       document.getElementById('in-sns'),
    exp:       document.getElementById('in-exp'),
    hard:      document.getElementById('in-hard'),
    favHorse:  document.getElementById('in-fav-horse'),
    favJockey: document.getElementById('in-fav-jockey'),
    blood:     document.getElementById('in-blood'),
    bank:      document.getElementById('in-bank'),
    coat:      document.getElementById('in-coat'),
    memorable: document.getElementById('in-memorable'),
    style:     document.getElementById('in-style'),
    way:       document.getElementById('in-way'),
    time:      document.getElementById('in-time'),
    com:       document.getElementById('in-com')
};

const counters = {
    n:         document.getElementById('counter-n'),
    sns:       document.getElementById('counter-sns'),
    exp:       document.getElementById('counter-exp'),
    hard:      document.getElementById('counter-hard'),
    favHorse:  document.getElementById('counter-fav-horse'),
    favJockey: document.getElementById('counter-fav-jockey'),
    blood:     document.getElementById('counter-blood'),
    bank:      document.getElementById('counter-bank'),
    coat:      document.getElementById('counter-coat'),
    memorable: document.getElementById('counter-memorable'),
    way:       document.getElementById('counter-way'),
    time:      document.getElementById('counter-time'),
    com:       document.getElementById('counter-com')
};

const saveBtn        = document.getElementById('save-btn');
const loadingOverlay = document.getElementById('loading-overlay');

// ========== トリミングUI DOM参照 ==========
const cropModal      = document.getElementById('crop-modal');
const cropCanvas     = document.getElementById('crop-canvas');
const cropCtx        = cropCanvas.getContext('2d');
const cropSlider     = document.getElementById('crop-slider');
const cropConfirmBtn = document.getElementById('crop-confirm');
const cropCancelBtn  = document.getElementById('crop-cancel');

// ========== 初期化 ==========

// ドット柄パターンをオフスクリーンキャンバスに生成
function createDotPattern() {
    const patCanvas = document.createElement('canvas');
    patCanvas.width  = CARD_WIDTH;
    patCanvas.height = CARD_HEIGHT;
    const patCtx = patCanvas.getContext('2d');

    patCtx.fillStyle = '#e8e8e8';
    for (let x = 0; x < CARD_WIDTH; x += DOT_PITCH) {
        for (let y = 0; y < CARD_HEIGHT; y += DOT_PITCH) {
            patCtx.beginPath();
            patCtx.arc(x, y, 1.2, 0, Math.PI * 2);
            patCtx.fill();
        }
    }
    dotPatternCanvas = patCanvas;
}

// JS.png を非同期でプリロードし、読み込み完了後にカードを再描画する
function initWatermark() {
    const img = new Image();
    img.onload = () => { watermarkImage = img; drawCard(); };
    img.onerror = () => {};
    img.src = 'JS.png';
}

// 透かしパターン描画: JS.png と「FSS」テキストを45°タイルで全面に敷く
function drawWatermarkPattern(targetCtx) {
    const IMG_SIZE = 68;
    const STEP     = 120;

    targetCtx.save();
    targetCtx.globalAlpha = 0.07;
    targetCtx.translate(CARD_WIDTH / 2, CARD_HEIGHT / 2);
    targetCtx.rotate(Math.PI / 4);

    const reach = Math.ceil(Math.sqrt(CARD_WIDTH * CARD_WIDTH + CARD_HEIGHT * CARD_HEIGHT) / 2) + STEP;
    const count = Math.ceil(reach / STEP);

    targetCtx.fillStyle   = '#000000';
    targetCtx.font        = 'bold 18px sans-serif';
    targetCtx.textAlign   = 'center';
    targetCtx.textBaseline = 'middle';

    for (let row = -count; row <= count; row++) {
        for (let col = -count; col <= count; col++) {
            const x = col * STEP;
            const y = row * STEP;
            if ((row + col) % 2 === 0) {
                if (watermarkImage) {
                    targetCtx.drawImage(watermarkImage, x - IMG_SIZE / 2, y - IMG_SIZE / 2, IMG_SIZE, IMG_SIZE);
                }
            } else {
                targetCtx.fillText('FSS', x, y);
            }
        }
    }

    targetCtx.restore();
}

// ========== 描画 ==========

// カードをキャンバスに描画する
function drawCard(targetCtx = ctx) {
    const theme = WAKU_COLORS[currentWaku];

    // 背景（白ベース）
    targetCtx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
    targetCtx.fillStyle = '#ffffff';
    targetCtx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

    // 右側グレー背景
    targetCtx.fillStyle = '#f2f2f2';
    targetCtx.beginPath();
    targetCtx.moveTo(GREY_OVERLAY_X, 0);
    targetCtx.lineTo(CARD_WIDTH, 0);
    targetCtx.lineTo(CARD_WIDTH, CARD_HEIGHT);
    targetCtx.lineTo(0, CARD_HEIGHT);
    targetCtx.closePath();
    targetCtx.fill();

    // 透かしパターンを重ねる（ドット柄に代わる背景）
    drawWatermarkPattern(targetCtx);

    // カード外枠（ダブルライン）
    targetCtx.strokeStyle = '#000000';
    targetCtx.lineWidth = 2;
    targetCtx.strokeRect(2, 2, CARD_WIDTH - 4, CARD_HEIGHT - 4);
    targetCtx.strokeStyle = '#cccccc';
    targetCtx.lineWidth = 1;
    targetCtx.strokeRect(6, 6, CARD_WIDTH - 12, CARD_HEIGHT - 12);

    // 枠番カラーバー
    targetCtx.fillStyle = theme.bg;
    targetCtx.fillRect(0, 0, WAKU_BAR_WIDTH, CARD_HEIGHT);
    targetCtx.strokeStyle = '#000000';
    targetCtx.lineWidth = 4;
    targetCtx.beginPath();
    targetCtx.moveTo(WAKU_BAR_WIDTH, 0);
    targetCtx.lineTo(WAKU_BAR_WIDTH, CARD_HEIGHT);
    targetCtx.stroke();

    // 枠番数字
    targetCtx.fillStyle = theme.tx;
    targetCtx.font = '900 85px sans-serif';
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'middle';
    targetCtx.fillText(currentWaku, WAKU_BAR_WIDTH / 2, CARD_HEIGHT / 2);

    // ヘッダーエリア（半透明白）
    targetCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    targetCtx.fillRect(WAKU_BAR_WIDTH, 0, CARD_WIDTH - WAKU_BAR_WIDTH, HEADER_HEIGHT);
    targetCtx.strokeStyle = '#000000';
    targetCtx.lineWidth = 4;
    targetCtx.beginPath();
    targetCtx.moveTo(WAKU_BAR_WIDTH, HEADER_HEIGHT);
    targetCtx.lineTo(CARD_WIDTH, HEADER_HEIGHT);
    targetCtx.stroke();

    // アイコン枠（ダブルリング: 外=枠色、内=白細線）
    targetCtx.strokeStyle = theme.bg;
    targetCtx.lineWidth = 5;
    targetCtx.beginPath();
    targetCtx.arc(ICON_X, ICON_Y, ICON_RADIUS_OUTER, 0, Math.PI * 2);
    targetCtx.stroke();

    // アイコン背景（白）
    targetCtx.fillStyle = '#ffffff';
    targetCtx.fill();

    targetCtx.strokeStyle = '#ffffff';
    targetCtx.lineWidth = 1;
    targetCtx.beginPath();
    targetCtx.arc(ICON_X, ICON_Y, 52, 0, Math.PI * 2);
    targetCtx.stroke();

    // アイコン描画（画像 or プレースホルダー）
    if (userIconImage) {
        targetCtx.save();
        targetCtx.beginPath();
        targetCtx.arc(ICON_X, ICON_Y, ICON_RADIUS_INNER, 0, Math.PI * 2);
        targetCtx.closePath();
        targetCtx.clip();
        targetCtx.drawImage(
            userIconImage,
            ICON_X - ICON_RADIUS_INNER,
            ICON_Y - ICON_RADIUS_INNER,
            ICON_RADIUS_INNER * 2,
            ICON_RADIUS_INNER * 2
        );
        targetCtx.restore();
    } else {
        targetCtx.fillStyle = '#cccccc';
        targetCtx.beginPath();
        targetCtx.arc(ICON_X, ICON_Y, ICON_RADIUS_EMPTY, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.fillStyle = '#888888';
        targetCtx.font = 'bold 60px sans-serif';
        targetCtx.textAlign = 'center';
        targetCtx.textBaseline = 'middle';
        targetCtx.fillText('?', ICON_X, ICON_Y);
    }

    // 名前・SNS・経歴テキスト
    targetCtx.fillStyle = '#000000';
    targetCtx.textAlign = 'left';
    targetCtx.textBaseline = 'top';

    const nameLength   = cardData.name.length;
    const nameFontSize = nameLength > 15 ? 28 : nameLength > 10 ? 34 : 44;
    targetCtx.font = `900 ${nameFontSize}px sans-serif`;
    wrapText(targetCtx, cardData.name, TEXT_X, 16, CARD_WIDTH - TEXT_X - 30, nameFontSize * 1.1, 2);

    targetCtx.font = '800 13px sans-serif';
    targetCtx.fillStyle = '#333333';
    targetCtx.fillText(cardData.exp,  TEXT_X, 83);
    targetCtx.fillText(cardData.hard, TEXT_X, 100);

    targetCtx.fillStyle = '#000000';
    targetCtx.font = '900 14px sans-serif';
    targetCtx.fillText('SNS: ' + cardData.sns, TEXT_X, 118);

    // コンテンツエリアのクリップ設定
    targetCtx.save();
    targetCtx.beginPath();
    targetCtx.rect(WAKU_BAR_WIDTH, HEADER_HEIGHT + 10, CARD_WIDTH - WAKU_BAR_WIDTH - 20, CARD_HEIGHT - HEADER_HEIGHT - 10 - 60);
    targetCtx.clip();

    // カラーバー付きラベル＋値を描画するローカル関数（28px行高）
    function drawItem(x, y, label, value, width) {
        targetCtx.fillStyle = theme.bg;
        targetCtx.fillRect(x, y, 6, 26);

        targetCtx.fillStyle = '#888888';
        targetCtx.font = '900 10px sans-serif';
        targetCtx.fillText(label, x + 12, y + 2);

        targetCtx.fillStyle = '#000000';
        targetCtx.font = '900 17px sans-serif';
        wrapText(targetCtx, value, x + 12, y + 14, width - 30, 20, 1);
    }

    // 競馬の好みセクション
    const SEC1_Y = HEADER_HEIGHT + 22;   // 177
    targetCtx.fillStyle = '#1a1a1a';
    targetCtx.fillRect(CONTENT_LEFT, SEC1_Y, CONTENT_WIDTH, 21);
    targetCtx.fillStyle = '#e8e8e8';
    targetCtx.font = '900 13px sans-serif';
    targetCtx.fillText('競馬の好み / Favorite (Real)', CONTENT_LEFT + 12, SEC1_Y + 5);

    const R1 = SEC1_Y + 28;   // 205
    const R2 = R1 + 36;       // 241
    const R3 = R2 + 36;       // 277
    drawItem(CONTENT_LEFT, R1, '推し馬 / Fav Horse',          cardData.favHorse,  330);
    drawItem(COL2_X,       R1, '推し騎手 / Fav Jockey',        cardData.favJockey, 330);
    drawItem(CONTENT_LEFT, R2, '好きな血統 / Fav Pedigree',    cardData.blood,     330);
    drawItem(COL2_X,       R2, '好きな競馬場 / Fav Racecourse', cardData.bank,      330);
    drawItem(CONTENT_LEFT, R3, '好きな毛色 / Fav Coat',        cardData.coat,      330);
    drawItem(COL2_X,       R3, '思い出のレース / Memorable',   cardData.memorable, 330);

    // プレイの傾向セクション
    const SEC2_Y = R3 + 46;   // 323
    targetCtx.fillStyle = '#1a1a1a';
    targetCtx.fillRect(CONTENT_LEFT, SEC2_Y, CONTENT_WIDTH, 21);
    targetCtx.fillStyle = '#e8e8e8';
    targetCtx.font = '900 13px sans-serif';
    targetCtx.fillText('プレイの傾向 / Playstyle (Game)', CONTENT_LEFT + 12, SEC2_Y + 5);

    const R4 = SEC2_Y + 28;   // 351
    const R5 = R4 + 38;       // 389
    drawItem(CONTENT_LEFT, R4, '好きな脚質 / Favorite Strategy',  cardData.style, 330);
    drawItem(COL2_X,       R4, 'よく遊ぶ時間帯 / Usual Play Time', cardData.time,  330);
    drawItem(CONTENT_LEFT, R5, '騎乗スタイル / Riding Style',      cardData.way,   CONTENT_WIDTH);

    targetCtx.restore();

    // コメント区切り線
    targetCtx.strokeStyle = '#555555';
    targetCtx.lineWidth = 1;
    targetCtx.beginPath();
    targetCtx.moveTo(WAKU_BAR_WIDTH, COMMENT_LINE_Y);
    targetCtx.lineTo(CARD_WIDTH, COMMENT_LINE_Y);
    targetCtx.stroke();

    // 一言メッセージ
    targetCtx.fillStyle = '#000000';
    const commentLength   = cardData.comment.length;
    const commentFontSize = commentLength > 60 ? 15 : commentLength > 30 ? 18 : 21;
    targetCtx.font = `900 ${commentFontSize}px sans-serif`;
    wrapText(targetCtx, cardData.comment, CONTENT_LEFT, COMMENT_LINE_Y + 12, CONTENT_WIDTH, commentFontSize * 1.3, 3);

    // コピーライト
    targetCtx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    targetCtx.font = 'bold 11px sans-serif';
    targetCtx.textAlign = 'right';
    targetCtx.fillText('© 2026 Musyn Reagan', CARD_WIDTH - 12, CARD_HEIGHT - 12);
}

// 入力値をcardDataに反映する
function updateCardData() {
    cardData.waku = currentWaku;
    cardData.name = inputs.n.value.trim() || "JOCKEY NAME";

    let snsVal = inputs.sns.value.trim().replace(/^@+/, '@');
    if (!snsVal || snsVal === '@') snsVal = '@---';
    cardData.sns = snsVal;

    cardData.exp       = "馬歴 / Horse History: "   + (inputs.exp.value.trim()       || DEFAULT_PLACEHOLDER);
    cardData.hard      = "主なハード / Platform: "   + (inputs.hard.value.trim()      || DEFAULT_PLACEHOLDER);
    cardData.favHorse  = inputs.favHorse.value.trim()  || DEFAULT_PLACEHOLDER;
    cardData.favJockey = inputs.favJockey.value.trim() || DEFAULT_PLACEHOLDER;
    cardData.blood     = inputs.blood.value.trim()     || DEFAULT_PLACEHOLDER;
    cardData.bank      = inputs.bank.value.trim()      || DEFAULT_PLACEHOLDER;
    cardData.coat      = inputs.coat.value.trim()      || DEFAULT_PLACEHOLDER;
    cardData.memorable = inputs.memorable.value.trim() || DEFAULT_PLACEHOLDER;
    cardData.style   = inputs.style.value         || "---";
    cardData.way     = inputs.way.value.trim()    || DEFAULT_PLACEHOLDER;
    cardData.time    = inputs.time.value.trim()   || DEFAULT_PLACEHOLDER;
    cardData.comment = inputs.com.value.trim()    || DEFAULT_COMMENT;
}

// プレビューを遅延更新（高速入力に対応）
function updatePreview() {
    clearTimeout(updateTimer);
    updateTimer = setTimeout(() => {
        updateCardData();
        drawCard();
    }, 50);
}

// ========== イベントハンドラ ==========

// 枠番変更時にテーマ色とプレビューを更新する
function updateWaku() {
    currentWaku = inputs.waku.value;
    const theme = WAKU_COLORS[currentWaku];

    document.documentElement.style.setProperty('--k-color',   theme.bg);
    document.documentElement.style.setProperty('--txt-color', theme.tx);

    document.querySelectorAll('.g-title').forEach(el => {
        const color = theme.bg === "#ffffff" ? "#ccc" : theme.bg;
        el.style.color       = color;
        el.style.borderColor = color;
    });

    updatePreview();
}

// プロフィール画像を読み込む（トリミングモーダルへ渡す）
function loadImage(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        showToast('画像サイズは5MB以下にしてください', 'error');
        e.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            openCropModal(img);
        };
        img.src = event.target.result;
    };
    reader.onerror = () => showToast('画像の読み込みに失敗しました', 'error');
    reader.readAsDataURL(file);
}

// ========== トリミングUI ==========
const CROP_SIZE   = 240;
const CROP_RADIUS = 120;

let cropSourceImage    = null;
let cropOffsetX        = 0;
let cropOffsetY        = 0;
let cropScale          = 1;
let cropIsDragging     = false;
let cropDragStartX     = 0;
let cropDragStartY     = 0;
let cropDragStartOX    = 0;
let cropDragStartOY    = 0;
let cropRafId          = null;

function openCropModal(img) {
    cropSourceImage = img;
    cropOffsetX = 0;
    cropOffsetY = 0;
    // 短辺が円径に収まる初期スケール
    const minDim  = Math.min(img.naturalWidth, img.naturalHeight);
    const initScale = CROP_SIZE / minDim;
    cropScale = initScale;
    cropSlider.min   = initScale;
    cropSlider.max   = initScale * 4;
    cropSlider.step  = initScale * 0.01;
    cropSlider.value = initScale;
    cropModal.classList.add('active');
    scheduleCropDraw();
}

function closeCropModal() {
    cropModal.classList.remove('active');
    cropSourceImage = null;
    if (cropRafId !== null) {
        cancelAnimationFrame(cropRafId);
        cropRafId = null;
    }
}

function drawCropPreview() {
    cropRafId = null;
    if (!cropSourceImage) return;

    cropCtx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);

    // 暗背景
    cropCtx.fillStyle = '#111';
    cropCtx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);

    // 円形クリップで画像描画
    cropCtx.save();
    cropCtx.beginPath();
    cropCtx.arc(CROP_RADIUS, CROP_RADIUS, CROP_RADIUS, 0, Math.PI * 2);
    cropCtx.clip();

    const drawW = cropSourceImage.naturalWidth  * cropScale;
    const drawH = cropSourceImage.naturalHeight * cropScale;
    cropCtx.drawImage(
        cropSourceImage,
        CROP_RADIUS + cropOffsetX - drawW / 2,
        CROP_RADIUS + cropOffsetY - drawH / 2,
        drawW, drawH
    );
    cropCtx.restore();

    // 円枠
    cropCtx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    cropCtx.lineWidth = 1;
    cropCtx.beginPath();
    cropCtx.arc(CROP_RADIUS, CROP_RADIUS, CROP_RADIUS - 1, 0, Math.PI * 2);
    cropCtx.stroke();
}

function scheduleCropDraw() {
    if (cropRafId === null) {
        cropRafId = requestAnimationFrame(drawCropPreview);
    }
}

// ドラッグ（マウス）
cropCanvas.addEventListener('mousedown', e => {
    cropIsDragging  = true;
    cropDragStartX  = e.clientX;
    cropDragStartY  = e.clientY;
    cropDragStartOX = cropOffsetX;
    cropDragStartOY = cropOffsetY;
    e.preventDefault();
});

window.addEventListener('mousemove', e => {
    if (!cropIsDragging) return;
    cropOffsetX = cropDragStartOX + (e.clientX - cropDragStartX);
    cropOffsetY = cropDragStartOY + (e.clientY - cropDragStartY);
    scheduleCropDraw();
});

window.addEventListener('mouseup', () => { cropIsDragging = false; });

// タッチ操作
cropCanvas.addEventListener('touchstart', e => {
    const t = e.touches[0];
    cropIsDragging  = true;
    cropDragStartX  = t.clientX;
    cropDragStartY  = t.clientY;
    cropDragStartOX = cropOffsetX;
    cropDragStartOY = cropOffsetY;
    e.preventDefault();
}, { passive: false });

window.addEventListener('touchmove', e => {
    if (!cropIsDragging) return;
    const t = e.touches[0];
    cropOffsetX = cropDragStartOX + (t.clientX - cropDragStartX);
    cropOffsetY = cropDragStartOY + (t.clientY - cropDragStartY);
    scheduleCropDraw();
}, { passive: true });

window.addEventListener('touchend', () => { cropIsDragging = false; });

// スライダー
cropSlider.addEventListener('input', () => {
    cropScale = parseFloat(cropSlider.value);
    scheduleCropDraw();
});

// 確定：オフスクリーンCanvasで切り出しuserIconImageにセット
cropConfirmBtn.addEventListener('click', () => {
    const outSize = ICON_RADIUS_INNER * 2;
    const ratio   = outSize / CROP_SIZE;

    const offCanvas    = document.createElement('canvas');
    offCanvas.width    = outSize;
    offCanvas.height   = outSize;
    const offCtx       = offCanvas.getContext('2d');

    offCtx.beginPath();
    offCtx.arc(outSize / 2, outSize / 2, outSize / 2, 0, Math.PI * 2);
    offCtx.clip();

    const drawW = cropSourceImage.naturalWidth  * cropScale * ratio;
    const drawH = cropSourceImage.naturalHeight * cropScale * ratio;
    offCtx.drawImage(
        cropSourceImage,
        (outSize / 2) + cropOffsetX * ratio - drawW / 2,
        (outSize / 2) + cropOffsetY * ratio - drawH / 2,
        drawW, drawH
    );

    const finalImg = new Image();
    finalImg.onload = () => {
        userIconImage = finalImg;
        closeCropModal();
        updatePreview();
    };
    finalImg.src = offCanvas.toDataURL('image/png');
});

// キャンセル
cropCancelBtn.addEventListener('click', closeCropModal);

// カードを2倍解像度で画像出力する
function saveImage() {
    saveBtn.disabled = true;
    saveBtn.classList.add('saving');
    saveBtn.textContent = '生成中...';
    loadingOverlay.classList.add('active');

    setTimeout(() => {
        try {
            const outputCanvas        = document.createElement('canvas');
            outputCanvas.width        = CARD_WIDTH * 2;
            outputCanvas.height       = CARD_HEIGHT * 2;
            const outputCtx           = outputCanvas.getContext('2d');

            outputCtx.scale(2, 2);
            drawCard(outputCtx);

            const filename = 'fsstriderscard.png';

            outputCanvas.toBlob(blob => {
                if (!blob) throw new Error('画像生成失敗');

                const url  = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = filename;
                link.href     = url;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                showToast('画像を保存しました！', 'success');

                saveBtn.disabled = false;
                saveBtn.classList.remove('saving');
                saveBtn.textContent = '画像を保存する / Save Image 📸';
                loadingOverlay.classList.remove('active');
            }, 'image/png');
        } catch (err) {
            console.error('保存エラー:', err);
            showToast('画像の保存に失敗しました', 'error');
            saveBtn.disabled = false;
            saveBtn.classList.remove('saving');
            saveBtn.textContent = '画像を保存する / Save Image 📸';
            loadingOverlay.classList.remove('active');
        }
    }, 0);
}

// コンテナサイズに合わせてキャンバスをスケーリングする
function adjustScale() {
    const container = document.querySelector('.card-container');
    const scaleX    = container.offsetWidth  / (CARD_WIDTH  + 8);
    const scaleY    = container.offsetHeight / (CARD_HEIGHT + 8);
    const scale     = Math.min(scaleX, scaleY, 1.0);
    canvas.style.transform = `scale(${scale})`;
}

// ========== ユーティリティ ==========

// トースト通知を表示する
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className   = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

// 文字数カウンターを更新し、割合に応じてスタイルを変える
function updateCounter(input, counter, maxLength) {
    const length = input.value.length;
    counter.textContent = `${length} / ${maxLength}`;

    counter.classList.remove('warning', 'danger');
    if (length > maxLength * 0.9) {
        counter.classList.add('danger');
    } else if (length > maxLength * 0.7) {
        counter.classList.add('warning');
    }
}

// テキストを指定幅で折り返し、最大行数を超えたら省略する
function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    const chars = text.split('');
    let line  = '';
    let lines = [];

    for (let i = 0; i < chars.length; i++) {
        const testLine = line + chars[i];
        const metrics  = ctx.measureText(testLine);

        if (metrics.width > maxWidth && line !== '') {
            lines.push(line);
            line = chars[i];
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    if (lines.length > maxLines) {
        lines = lines.slice(0, maxLines);
        let last = lines[maxLines - 1];
        if (last.length > 3) {
            lines[maxLines - 1] = last.slice(0, -3) + '...';
        }
    }

    lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
}

// ========== イベントリスナー登録 ==========
inputs.waku.addEventListener('change', updateWaku);
inputs.icon.addEventListener('change', loadImage);

const inputCounterPairs = [
    { input: inputs.n,         counter: counters.n,         max: 20  },
    { input: inputs.sns,       counter: counters.sns,       max: 30  },
    { input: inputs.exp,       counter: counters.exp,       max: 30  },
    { input: inputs.hard,      counter: counters.hard,      max: 30  },
    { input: inputs.favHorse,  counter: counters.favHorse,  max: 30  },
    { input: inputs.favJockey, counter: counters.favJockey, max: 30  },
    { input: inputs.blood,     counter: counters.blood,     max: 30  },
    { input: inputs.bank,      counter: counters.bank,      max: 30  },
    { input: inputs.coat,      counter: counters.coat,      max: 30  },
    { input: inputs.memorable, counter: counters.memorable, max: 30  },
    { input: inputs.way,       counter: counters.way,       max: 30  },
    { input: inputs.time,      counter: counters.time,      max: 15  },
    { input: inputs.com,       counter: counters.com,       max: 138 }
];

inputCounterPairs.forEach(({ input, counter, max }) => {
    input.addEventListener('input', () => {
        updateCounter(input, counter, max);
        updatePreview();
    });
});

inputs.style.addEventListener('change', updatePreview);
saveBtn.addEventListener('click', saveImage);
window.addEventListener('resize', adjustScale);

// ========== 起動処理 ==========
window.addEventListener('load', () => {
    createDotPattern();
    initWatermark();
    adjustScale();
    updateWaku();
    updateCardData();
    drawCard();

    inputCounterPairs.forEach(({ input, counter, max }) => {
        updateCounter(input, counter, max);
    });

});
