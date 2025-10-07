// 背景服務腳本 - 處理下載請求

// 監聽來自 content script 或 popup 的訊息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'download') {
    // 下載圖片
    chrome.downloads.download({
      url: message.url,
      filename: message.filename,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('下載失敗:', chrome.runtime.lastError);
      } else {
        console.log('下載成功:', downloadId);
      }
    });
  }
});

// 擴充工具安裝時
chrome.runtime.onInstalled.addListener(() => {
  console.log('Gemini AI Studio 自動化助手已安裝');
});

