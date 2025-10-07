// DOM 元素
const inputData = document.getElementById('inputData');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const downloadBtn = document.getElementById('downloadBtn');
const clearLogBtn = document.getElementById('clearLogBtn');
const statusElement = document.getElementById('status');
const progressElement = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');
const logContainer = document.getElementById('logContainer');
const inputDelay = document.getElementById('inputDelay');
const taskDelay = document.getElementById('taskDelay');

// 狀態變數
let isRunning = false;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  addLog('擴充工具已載入，準備就緒', 'info');
  
  // 監聽輸入資料變更
  inputData.addEventListener('input', saveSettings);
  
  // 監聽延遲時間變更
  inputDelay.addEventListener('change', saveSettings);
  taskDelay.addEventListener('change', saveSettings);
  
  // 監聽任務類型變更
  document.querySelectorAll('input[name="taskType"]').forEach(radio => {
    radio.addEventListener('change', saveSettings);
  });
});

// 載入設定
function loadSettings() {
  chrome.storage.local.get(['inputDelay', 'taskDelay', 'logs', 'inputData', 'taskType'], (result) => {
    if (result.inputDelay) inputDelay.value = result.inputDelay;
    if (result.taskDelay) taskDelay.value = result.taskDelay;
    if (result.inputData) inputData.value = result.inputData;
    if (result.taskType) {
      const radio = document.querySelector(`input[name="taskType"][value="${result.taskType}"]`);
      if (radio) radio.checked = true;
    }
    if (result.logs) {
      result.logs.forEach(log => addLog(log.message, log.type));
    }
  });
}

// 儲存設定
function saveSettings() {
  const taskType = document.querySelector('input[name="taskType"]:checked').value;
  chrome.storage.local.set({
    inputDelay: parseFloat(inputDelay.value),
    taskDelay: parseFloat(taskDelay.value),
    inputData: inputData.value,
    taskType: taskType
  });
}

// 新增日誌
function addLog(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString('zh-TW');
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry ${type}`;
  logEntry.textContent = `[${timestamp}] ${message}`;
  logContainer.appendChild(logEntry);
  logContainer.scrollTop = logContainer.scrollHeight;
  
  // 儲存日誌
  chrome.storage.local.get(['logs'], (result) => {
    const logs = result.logs || [];
    logs.push({ message, type, timestamp });
    if (logs.length > 100) logs.shift(); // 只保留最近 100 條
    chrome.storage.local.set({ logs });
  });
}

// 更新狀態
function updateStatus(status, current = null, total = null) {
  statusElement.textContent = status;
  
  if (current !== null && total !== null) {
    progressElement.textContent = `${current} / ${total}`;
    const percentage = total > 0 ? (current / total) * 100 : 0;
    progressBar.style.width = `${percentage}%`;
  }
}

// 清除日誌
clearLogBtn.addEventListener('click', () => {
  logContainer.innerHTML = '';
  chrome.storage.local.set({ logs: [] });
  addLog('日誌已清除', 'info');
});

// 開始執行
startBtn.addEventListener('click', async () => {
  const data = inputData.value.trim();
  
  if (!data) {
    addLog('請輸入資料！', 'error');
    return;
  }
  
  // 檢查是否在正確的頁面
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab.url.includes('aistudio.google.com')) {
    addLog('請在 Gemini AI Studio 頁面使用此擴充工具！', 'error');
    return;
  }
  
  // 解析資料
  const taskType = document.querySelector('input[name="taskType"]:checked').value;
  let tasks = [];
  
  try {
    if (taskType === 'text') {
      tasks = data.split('\n').filter(line => line.trim());
    } else {
      tasks = JSON.parse(data);
      if (!Array.isArray(tasks)) {
        tasks = [tasks];
      }
    }
  } catch (error) {
    addLog(`資料格式錯誤: ${error.message}`, 'error');
    return;
  }
  
  if (tasks.length === 0) {
    addLog('沒有有效的任務資料！', 'error');
    return;
  }
  
  // 儲存設定
  saveSettings();
  
  // 更新 UI
  isRunning = true;
  startBtn.disabled = true;
  stopBtn.disabled = false;
  inputData.disabled = true;
  
  addLog(`開始執行任務，共 ${tasks.length} 組`, 'info');
  updateStatus('執行中', 0, tasks.length);
  
  // 發送訊息到 content script
  chrome.tabs.sendMessage(tab.id, {
    action: 'startTasks',
    tasks: tasks,
    taskType: taskType,
    inputDelay: parseFloat(inputDelay.value) * 1000,
    taskDelay: parseFloat(taskDelay.value) * 1000
  });
});

// 停止執行
stopBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.tabs.sendMessage(tab.id, {
    action: 'stopTasks'
  });
  
  addLog('正在停止任務...', 'warning');
});

// 下載圖片
downloadBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  addLog('開始捕捉圖片...', 'info');
  
  chrome.tabs.sendMessage(tab.id, {
    action: 'downloadImages'
  });
});

// 接收來自 content script 的訊息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'log') {
    addLog(message.message, message.type || 'info');
  } else if (message.action === 'updateProgress') {
    updateStatus('執行中', message.current, message.total);
  } else if (message.action === 'taskComplete') {
    isRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    inputData.disabled = false;
    updateStatus('已完成', message.completed, message.total);
    addLog(`任務執行完成！成功: ${message.completed} / ${message.total}`, 'success');
  } else if (message.action === 'taskStopped') {
    isRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    inputData.disabled = false;
    updateStatus('已停止', message.completed, message.total);
    addLog(`任務已停止。已完成: ${message.completed} / ${message.total}`, 'warning');
  }
});

