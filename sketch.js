﻿let spriteSheet;
let newSpriteSheet; // 新角色的精靈圖
let character;
let newCharacter; // 新角色物件
let companion;
let npcImage;
let quizTable; // 用於儲存 CSV 測驗題庫
let backgroundImage; // 用於儲存背景圖片

// --- 對話系統變數 ---
let dialogState = 'IDLE'; // IDLE, ASKING, FEEDBACK
let currentDialog = { message: '', alpha: 0 };
let currentQuestion = null; // 目前的題目物件
let answerInput; // 玩家的答案輸入框
let interactionActive = false; // 是否在互動範圍內

function preload() {
  spriteSheet = loadImage('2/all-2.png');
  newSpriteSheet = loadImage('4/8-all.png'); // 載入新角色的圖檔
  npcImage = loadImage('下載.png'); // 載入 NPC 圖片
  quizTable = loadTable('quiz.csv', 'csv', 'header'); // 載入 CSV 題庫
  backgroundImage = loadImage('5/0.png'); // 載入背景圖片
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noSmooth();
  // 初始化角色，並傳入精靈圖
  character = new Character(spriteSheet);
  // 將角色的初始位置設定在畫面中央
  character.x = width / 2;
  character.y = height / 2;

  // 建立新角色
  newCharacter = new SideCharacter(newSpriteSheet);
  // 將新角色初始位置設定在主要角色的左邊
  newCharacter.x = character.x - 150;
  newCharacter.y = character.y;

  // 建立一個固定的 NPC，設定在畫面中心偏右的位置
  removeImageBackground(npcImage, color(255, 255, 255)); // 移除圖片的白色背景
  companion = new Companion(width / 2 + 150, height / 2, npcImage);

  // 建立答案輸入框
  answerInput = createInput();
  answerInput.size(100, 20);
  answerInput.hide(); // 平時隱藏
  answerInput.elt.addEventListener('keydown', handleAnswerSubmit);
}

function draw() {
  // 將背景圖片繪製到整個畫布
  image(backgroundImage, 0, 0, width, height);

  // 我們已經移除攝影機跟隨功能，所以角色會在畫面上自由移動

  // 更新並繪製角色
  character.update();
  character.display();

  // 更新並繪製新角色
  // 新角色現在是靜止的，只更新動畫
  newCharacter.update();
  newCharacter.display();

  // 更新並繪製小夥伴
  companion.update();
  companion.display();

  // --- 互動偵測 ---
  // 計算玩家與 NPC 之間的距離
  const distToCompanion = dist(character.x, character.y, companion.x, companion.y);
  const distToNewCharacter = dist(character.x, character.y, newCharacter.x, newCharacter.y);
  // 如果靠近任一個 NPC，就啟動互動
  interactionActive = (distToCompanion < 80 || distToNewCharacter < 80);

  if (interactionActive && dialogState === 'IDLE') {
    // 進入互動範圍且處於閒置狀態，開始提問
    startQuiz();
  } else if (!interactionActive && dialogState !== 'IDLE') {
    // 離開互動範圍，重設一切
    resetDialog();
  }

  // --- 對話框淡入淡出邏輯 ---
  if (dialogState !== 'IDLE') {
    // 如果在對話中，顯示對話框
    if (currentDialog.alpha < 220) currentDialog.alpha += 15;
  } else {
    // 如果不在對話中，淡出對話框
    if (currentDialog.alpha > 0) currentDialog.alpha -= 15;
  }

  // 只有在透明度大於 0 時才繪製
  if (currentDialog.alpha > 0) {
    drawDialogBox(currentDialog.message, currentDialog.alpha);
  }

  // --- 輸入框位置與可見度 ---
  if (dialogState === 'ASKING') {
    // 顯示並定位輸入框在玩家頭上
    answerInput.show();
    answerInput.position(character.x - answerInput.width / 2, character.y - character.getDisplayHeight() - 40);
  } else {
    answerInput.hide();
  }
}

function keyPressed() {
  character.handleKeyPressed(keyCode);
  return false;
}

function keyReleased() {
  character.handleKeyReleased(keyCode);
  return false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

/**
 * 開始一個新的問答
 */
function startQuiz() {
  dialogState = 'ASKING';
  // 從題庫中隨機抽取一題
  const questionRow = quizTable.getArray()[floor(random(quizTable.getRowCount()))];
  currentQuestion = {
    question: questionRow[0],
    answer: questionRow[1],
    correct_feedback: questionRow[2],
    wrong_feedback: questionRow[3],
    hint: questionRow[4]
  };
  currentDialog.message = currentQuestion.question; // 設定對話內容為題目
  answerInput.value(''); // 清空上次的答案
}

/**
 * 處理答案提交 (當在輸入框按下 Enter)
 * @param {KeyboardEvent} e 鍵盤事件
 */
function handleAnswerSubmit(e) {
  if (e.key === 'Enter') {
    const playerAnswer = answerInput.value().trim();
    if (playerAnswer === currentQuestion.answer) {
      // 答對了
      currentDialog.message = currentQuestion.correct_feedback;
    } else {
      // 答錯了
      currentDialog.message = currentQuestion.wrong_feedback;
    }
    dialogState = 'FEEDBACK';
    // 顯示回饋 3 秒後，重新提問或結束
    setTimeout(() => {
      if (interactionActive) startQuiz(); // 如果還在範圍內，問下一題
      else resetDialog(); // 如果已離開，結束對話
    }, 3000); // 3000 毫秒 = 3 秒
  }
}

function resetDialog() {
  dialogState = 'IDLE';
  currentQuestion = null;
  answerInput.hide();
}

/**
 * 繪製復古風格的網格背景
 */
function drawRetroBackground() {
  const color1 = '#D2B48C'; // 復古的淺棕褐色 (Tan)
  const color2 = '#A08C6E'; // 較深的棕色
  const gridSize = 40;      // 棋盤格大小

  noStroke(); // 我們將直接繪製方塊，所以不需要邊線

  for (let y = 0; y < height; y += gridSize) {
    for (let x = 0; x < width; x += gridSize) {
      const i = x / gridSize;
      const j = y / gridSize;

      // 根據格子位置的奇偶性來決定顏色
      if ((i + j) % 2 === 0) {
        fill(color1);
      } else {
        fill(color2);
      }
      // 繪製一個格子
      rect(x, y, gridSize, gridSize);
    }
  }
}
/**
 * 在畫面上方繪製一個對話框
 * @param {string} message   要顯示的文字訊息
 * @param {number} alpha     對話框的透明度
 */
function drawDialogBox(message, alpha) {
  push();
  const boxWidth = min(width * 0.8, 600); // 對話框寬度，最大不超過 600px
  const boxHeight = 100;
  const boxX = (width - boxWidth) / 2;
  const boxY = 30; // 距離頂部 30px

  // 繪製對話框背景
  fill(255, 255, 255, alpha); // 使用傳入的透明度
  stroke(100, alpha);
  strokeWeight(2);
  rect(boxX, boxY, boxWidth, boxHeight, 15); // 圓角矩形

  // 繪製文字
  noStroke();
  fill(0, alpha);
  textAlign(CENTER, CENTER);
  textSize(18);
  text(message, boxX + boxWidth / 2, boxY + boxHeight / 2);
  pop();
}

/**
 * 移除圖片中的指定顏色背景，將其變為透明。
 * @param {p5.Image} img 要處理的圖片物件
 * @param {p5.Color} colorToRemove 要移除的顏色
 */
function removeImageBackground(img, colorToRemove) {
  const r_target = red(colorToRemove);
  const g_target = green(colorToRemove);
  const b_target = blue(colorToRemove);

  img.loadPixels(); // 載入像素資料
  // 遍歷所有像素 (每 4 個值代表一個像素的 R, G, B, A)
  for (let i = 0; i < img.pixels.length; i += 4) {
    const r = img.pixels[i];
    const g = img.pixels[i + 1];
    const b = img.pixels[i + 2];

    // 如果像素顏色與目標顏色相符，就將其 Alpha 值設為 0 (完全透明)
    if (r === r_target && g === g_target && b === b_target) {
      img.pixels[i + 3] = 0;
    }
  }
  img.updatePixels(); // 更新像素資料
}

// ==================================================
// Character Class
// ==================================================
class Character {
  constructor(spriteSheet) {
    this.spriteSheet = spriteSheet;
    this.x = 0; // 角色在「世界」中的 X 座標
    this.y = 0; // 角色在「世界」中的 Y 座標
    this.direction = 1; // 1 = right, -1 = left
    this.moveSpeed = 4;

    this.currentFrame = 0;
    this.totalFrames = 8;
    this.frameWidth = 419 / 8;
    this.frameHeight = 67;
    this.animationSpeed = 6; // 加快動畫速度以匹配移動
    this.scaleFactor = 1.2; // 角色縮放比例 (1 = 100%, 1.2 = 120%)
    this.frameCounter = 0;

    this.keysPressed = {};
  }

  handleKeyPressed(keyCode) {
    this.keysPressed[keyCode] = true;
  }

  handleKeyReleased(keyCode) {
    this.keysPressed[keyCode] = false;
  }

  update() {
    let isMoving = false;
    // 處理移動
    if (this.keysPressed[RIGHT_ARROW]) {
      this.x += this.moveSpeed;
      this.direction = 1;
      isMoving = true;
    }
    if (this.keysPressed[LEFT_ARROW]) {
      this.x -= this.moveSpeed;
      this.direction = -1;
      isMoving = true;
    }
    if (this.keysPressed[UP_ARROW]) {
      this.y -= this.moveSpeed;
      isMoving = true;
    }
    if (this.keysPressed[DOWN_ARROW]) {
      this.y += this.moveSpeed;
      isMoving = true;
    }

    // 更新動畫幀
    this.frameCounter++;
    if (this.frameCounter >= this.animationSpeed) {
      this.frameCounter = 0;
      // 無論是否移動，都持續播放動畫
      this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
    }
  }

  getDisplayHeight() {
    return this.frameHeight * this.scaleFactor;
  }

  display() {
    push();
    // 將原點移動到角色的 (x, y) 位置
    translate(this.x, this.y);
    
    // 根據方向翻轉畫布
    if (this.direction === -1) {
      scale(-1, 1);
    }

    const srcX = this.currentFrame * this.frameWidth;
    const srcY = 0;

    const displayWidth = this.frameWidth * this.scaleFactor;
    const displayHeight = this.frameHeight * this.scaleFactor;

    // 繪製角色，使其腳底對齊 (0,0)
    image(this.spriteSheet, -displayWidth / 2, -displayHeight, displayWidth, displayHeight, srcX, srcY, this.frameWidth, this.frameHeight);
    pop();
  }
}

// ==================================================
// SideCharacter Class (新增的角色)
// ==================================================
class SideCharacter {
  constructor(spriteSheet) {
    this.spriteSheet = spriteSheet;
    this.x = 0;
    this.y = 0;
    this.scaleFactor = 1.2; // 縮放比例

    this.totalFrames = 8;       // 根據要求，重複播放 8 幀
    this.frameWidth = 225 / 8;  // 總寬度 / 幀數
    this.frameHeight = 48;      // 圖片高度
    this.currentFrame = 0;

    this.animationSpeed = 6; // 動畫播放速度
    this.frameCounter = 0;
  }

  update() {
    // 更新動畫幀
    this.frameCounter++;
    if (this.frameCounter >= this.animationSpeed) {
      this.frameCounter = 0;
      this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
    }
  }

  display() {
    push();
    translate(this.x, this.y);

    const srcX = this.currentFrame * this.frameWidth;
    const srcY = 0;

    const displayWidth = this.frameWidth * this.scaleFactor;
    const displayHeight = this.frameHeight * this.scaleFactor;

    image(this.spriteSheet, -displayWidth / 2, -displayHeight, displayWidth, displayHeight, srcX, srcY, this.frameWidth, this.frameHeight);
    pop();
  }
}

// ==================================================
// Companion Class
// ==================================================
class Companion {
  constructor(x, y, img) {
    this.x = x; // NPC 的固定 X 座標
    this.y = y; // NPC 的固定 Y 座標
    this.img = img; // NPC 的圖片
  }

  update() {
    // 這個 NPC 是靜止的，所以 update 函式是空的。
    // 未來可以在這裡加入待機動畫等邏輯。
  }

  display() {
    const imgWidth = 70;  // 設定圖片寬度為 70
    const imgHeight = 60; // 設定圖片高度為 60

    push();
    translate(this.x, this.y);
    // 繪製圖片，使其腳底對齊 (0,0)
    image(this.img, -imgWidth / 2, -imgHeight, imgWidth, imgHeight);
    pop();
  }
}
