// 選擇器配置
const SELECTORS = {
  textarea: 'body > app-root > ms-app > div > div > div.layout-wrapper.ng-tns-c2478659452-0 > div > span > ms-prompt-renderer > ms-chunk-editor > section > footer > ms-prompt-input-wrapper > div > div > div > div.text-wrapper > ms-chunk-input > section > div > ms-text-chunk > ms-autosize-textarea > textarea',
  button: 'button.run-button',
  buttonText: 'button.run-button .label',
  resultContainer: '.ng-star-inserted',
  resultImages: '.chat-container .ng-star-inserted img'
}; 

// 狀態管理
let isRunning = false;
let shouldStop = false;
let currentTaskIndex = 0;
let totalTasks = 0;
let completedTasks = 0;
let tasksData = [];
let config = {
  inputDelay: 1500,
  taskDelay: 2500
};

// 日誌函數
function log(message, type = 'info') {
  console.log(`[Gemini Auto] ${message}`);
  chrome.runtime.sendMessage({
    action: 'log',
    message: message,
    type: type
  });
}

// 更新進度
function updateProgress() {
  chrome.runtime.sendMessage({
    action: 'updateProgress',
    current: currentTaskIndex,
    total: totalTasks
  });
}

// 等待指定時間
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 檢查 button 是否可用 (disabled 被移除)
function isButtonEnabled() {
  const button = document.querySelector(SELECTORS.button);
  if (!button) return false;
  
  // 檢查是否有 disabled class
  const hasDisabledClass = button.classList.contains('disabled');
  // 檢查 disabled 屬性
  const hasDisabledAttr = button.hasAttribute('disabled') || button.disabled;
  
  return !hasDisabledClass && !hasDisabledAttr;
}

// 檢查是否正在執行中 (button 文字是 Stop)
function isTaskRunning() {
  const buttonText = document.querySelector(SELECTORS.buttonText);
  if (!buttonText) return false;
  
  return buttonText.textContent.trim().toLowerCase() === 'stop';
}

// 檢查任務是否完成 (button disabled 且文字是 Run)
function isTaskCompleted() {
  const button = document.querySelector(SELECTORS.button);
  const buttonText = document.querySelector(SELECTORS.buttonText);
  
  if (!button || !buttonText) return false;
  
  const isDisabled = button.classList.contains('disabled') || button.hasAttribute('disabled') || button.disabled;
  const isRunText = buttonText.textContent.trim().toLowerCase() === 'run';
  
  return isDisabled && isRunText;
}

// 檢查 textarea 是否被清空
function isTextareaCleared() {
  const textarea = document.querySelector(SELECTORS.textarea);
  if (!textarea) return false;
  
  return textarea.value.trim() === '';
}

// 輸入文本到 textarea
async function inputText(text) {
  const textarea = document.querySelector(SELECTORS.textarea);
  
  if (!textarea) {
    log('找不到輸入框！', 'error');
    return false;
  }
  
  // 清空並輸入文本
  textarea.value = '';
  textarea.focus();
  
  // 模擬真實輸入
  textarea.value = text;
  
  // 觸發事件
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.dispatchEvent(new Event('change', { bubbles: true }));
  
  log(`已輸入文本: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`, 'info');
  return true;
}

// 點擊 Run 按鈕
async function clickRunButton() {
  const button = document.querySelector(SELECTORS.button);
  
  if (!button) {
    log('找不到執行按鈕！', 'error');
    return false;
  }
  
  if (!isButtonEnabled()) {
    log('按鈕尚未啟用，等待中...', 'warning');
    return false;
  }
  
  button.click();
  log('已點擊執行按鈕', 'success');
  return true;
}

// 等待任務完成
async function waitForTaskCompletion() {
  log('等待任務執行完成...', 'info');
  
  let checkCount = 0;
  const maxChecks = 600; // 最多等待 5 分鐘 (600 * 0.5 秒)
  
  while (checkCount < maxChecks) {
    if (shouldStop) {
      log('收到停止指令', 'warning');
      return false;
    }
    
    await sleep(500);
    checkCount++;
    
    // 檢查是否還在執行中
    if (isTaskRunning()) {
      if (checkCount % 10 === 0) { // 每 5 秒報告一次
        log(`任務執行中... (${checkCount * 0.5}秒)`, 'info');
      }
      continue;
    }
    
    // 檢查是否完成
    if (isTaskCompleted() && isTextareaCleared()) {
      log('任務執行完成！', 'success');
      return true;
    }
  }
  
  log('任務執行超時！', 'error');
  return false;
}

// 執行單個任務
async function executeTask(taskData, taskIndex) {
  log(`\n========== 開始執行第 ${taskIndex + 1} / ${totalTasks} 組 ==========`, 'info');
  
  // 準備文本
  let textToInput;
  if (typeof taskData === 'string') {
    textToInput = taskData;
  } else if (typeof taskData === 'object') {
    textToInput = JSON.stringify(taskData, null, 2);
  } else {
    textToInput = String(taskData);
  }
  
  // 1. 輸入文本
  const inputSuccess = await inputText(textToInput);
  if (!inputSuccess) {
    log(`第 ${taskIndex + 1} 組：輸入失敗`, 'error');
    return false;
  }
  
  // 2. 等待指定時間後檢查按鈕是否啟用
  log(`等待 ${config.inputDelay / 1000} 秒後檢查按鈕狀態...`, 'info');
  await sleep(config.inputDelay);
  
  // 3. 等待按鈕啟用
  let waitCount = 0;
  while (!isButtonEnabled() && waitCount < 20) {
    if (shouldStop) return false;
    await sleep(500);
    waitCount++;
  }
  
  if (!isButtonEnabled()) {
    log(`第 ${taskIndex + 1} 組：按鈕未啟用，跳過`, 'error');
    return false;
  }
  
  // 4. 點擊按鈕
  const clickSuccess = await clickRunButton();
  if (!clickSuccess) {
    log(`第 ${taskIndex + 1} 組：點擊失敗`, 'error');
    return false;
  }
  
  // 5. 等待任務完成
  const completed = await waitForTaskCompletion();
  
  if (completed) {
    log(`第 ${taskIndex + 1} 組：執行成功！`, 'success');
    completedTasks++;
    return true;
  } else {
    log(`第 ${taskIndex + 1} 組：執行失敗`, 'error');
    return false;
  }
}

// 主要執行流程
async function runTasks() {
  isRunning = true;
  shouldStop = false;
  currentTaskIndex = 0;
  completedTasks = 0;
  
  log(`\n🚀 開始自動化任務，共 ${totalTasks} 組`, 'info');
  log(`⚙️ 配置 - 輸入延遲: ${config.inputDelay / 1000}秒，組間延遲: ${config.taskDelay / 1000}秒\n`, 'info');
  
  for (let i = 0; i < totalTasks; i++) {
    if (shouldStop) {
      log('任務已被停止', 'warning');
      break;
    }
    
    currentTaskIndex = i;
    updateProgress();
    
    const success = await executeTask(tasksData[i], i);
    
    // 如果不是最後一組，等待指定時間
    if (i < totalTasks - 1 && !shouldStop) {
      log(`等待 ${config.taskDelay / 1000} 秒後執行下一組...\n`, 'info');
      await sleep(config.taskDelay);
    }
  }
  
  isRunning = false;
  
  if (shouldStop) {
    chrome.runtime.sendMessage({
      action: 'taskStopped',
      completed: completedTasks,
      total: totalTasks
    });
  } else {
    log(`\n✅ 所有任務執行完成！成功: ${completedTasks} / ${totalTasks}`, 'success');
    chrome.runtime.sendMessage({
      action: 'taskComplete',
      completed: completedTasks,
      total: totalTasks
    });
  }
}

// 下載圖片
async function downloadImages() {
  log('開始搜尋圖片...', 'info');
  
  const images = document.querySelectorAll(SELECTORS.resultImages);
  
  if (images.length === 0) {
    log('未找到任何圖片！', 'error');
    return;
  }
  
  log(`找到 ${images.length} 張圖片，準備下載...`, 'info');
  
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const imgSrc = img.src;
    const imgAlt = img.alt || `image_${i + 1}`;
    
    try {
      // 清理檔名（移除非法字元）
      const sanitizedName = imgAlt.replace(/[<>:"/\\|?*]/g, '_');
      const filename = `gemini_${sanitizedName}_${Date.now()}_${i + 1}.png`;
      
      // 下載圖片
      chrome.runtime.sendMessage({
        action: 'log',
        message: `正在下載: ${sanitizedName}`,
        type: 'info'
      });
      
      // 使用 fetch 轉換為 blob URL
      const response = await fetch(imgSrc);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // 下載
      chrome.runtime.sendMessage({
        action: 'download',
        url: blobUrl,
        filename: filename
      });
      //大於十張在多等0.3秒
      if(i>10){
        await sleep(300);
      }
      await sleep(500); // 避免同時下載太多
    } catch (error) {
      log(`下載圖片失敗: ${error.message}`, 'error');
    }
  }
  
  log(`圖片下載完成！共 ${images.length} 張`, 'success');
}

// 監聽來自 popup 的訊息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startTasks') {
    if (isRunning) {
      log('任務已在執行中！', 'warning');
      return;
    }
    
    tasksData = message.tasks;
    totalTasks = message.tasks.length;
    config.inputDelay = message.inputDelay;
    config.taskDelay = message.taskDelay;
    
    runTasks();
  } else if (message.action === 'stopTasks') {
    shouldStop = true;
    log('正在停止任務...', 'warning');
  } else if (message.action === 'downloadImages') {
    downloadImages();
  }
});

// 頁面載入時通知
log('Content Script 已載入', 'info');

