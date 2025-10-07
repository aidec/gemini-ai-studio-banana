# 🍌 Gemini AI Studio 自動化助手

這是一個 Chrome 擴充工具，專門用於自動化執行 Google Gemini AI Studio 的任務，並批次下載生成的圖片。
文章介紹：https://blog.aidec.tw/post/nano-banana-batch-tools-chrome-ext
## ✨ 功能特色

### 1. 自動化任務執行
- 📝 支援文本模式（每行一組提示詞）
- 🔧 支援 JSON 格式資料
- ⚙️ 可自訂輸入延遲和組間延遲時間
- 🎯 自動偵測按鈕狀態並執行
- 📊 即時顯示執行進度

### 2. 智慧偵測
- ✅ 自動檢測按鈕是否啟用（移除 disabled）
- 🔄 偵測任務執行狀態（Run/Stop）
- ⏱️ 等待任務完成後自動執行下一組
- 🛑 可隨時停止執行

### 3. 圖片下載
- 🖼️ 自動捕捉所有生成的圖片
- 📥 批次下載圖片
- 🏷️ 使用圖片 alt 屬性作為檔名
- 📁 自動清理檔名中的非法字元

### 4. 進度追蹤
- 📈 顯示當前執行進度（X / 總數）
- 📊 進度條視覺化
- 📝 詳細的執行日誌
- ⏰ 每條日誌都有時間戳記

## 🚀 安裝方式

### 方式一：開發者模式載入

1. 開啟 Chrome 瀏覽器
2. 輸入 `chrome://extensions/` 進入擴充功能頁面
3. 開啟右上角的「開發人員模式」
4. 點擊「載入未封裝項目」
5. 選擇此專案資料夾

### 方式二：生成圖示（首次使用）

如果需要生成擴充工具圖示：

1. 在瀏覽器中開啟 `create-icons.html`
2. 會自動下載三個尺寸的圖示檔案
3. 將下載的圖示放入 `icons` 資料夾中
4. 重新載入擴充功能

## 📖 使用說明

### 基本使用流程

1. **開啟 Gemini AI Studio**
   - 前往 https://aistudio.google.com/
   - 進入聊天或生成頁面

2. **開啟擴充工具**
   - 點擊瀏覽器工具列上的香蕉圖示 🍌
   - 或使用快捷鍵開啟

3. **設定任務**
   - 選擇任務類型（文本模式或 JSON 模式）
   - 輸入資料：
     ```
     文本模式範例：
     生成一隻可愛的貓
     生成一隻快樂的狗
     生成一朵美麗的花
     ```
     ```json
     JSON模式範例：
     [
       {"prompt": "生成一隻可愛的貓"},
       {"prompt": "生成一隻快樂的狗"}
     ]
     ```

4. **調整時間設定**
   - 輸入後等待時間：輸入文本後等待多久才點擊按鈕（預設 1.5 秒）
   - 組間間隔時間：完成一組後等待多久執行下一組（預設 2.5 秒）

5. **開始執行**
   - 點擊「開始執行」按鈕
   - 查看執行進度和日誌
   - 需要時可點擊「停止執行」中斷任務

6. **下載圖片**
   - 任務執行完成後
   - 點擊「下載圖片」按鈕
   - 所有生成的圖片會自動下載

## 🎯 工作原理

### 任務執行流程

```
1. 輸入文本到 textarea
   ↓
2. 等待指定延遲時間
   ↓
3. 檢查 button 是否啟用（disabled 移除）
   ↓
4. 點擊 Run 按鈕
   ↓
5. 監控按鈕狀態變化（Run → Stop → Run）
   ↓
6. 偵測 textarea 是否被清空
   ↓
7. 確認任務完成
   ↓
8. 等待組間延遲
   ↓
9. 執行下一組（重複步驟 1-8）
```

### 按鈕狀態偵測

擴充工具會偵測以下狀態：

- **Disabled (未輸入)**：button 有 `disabled` class 或屬性
- **Enabled (可執行)**：button 沒有 `disabled`，文字顯示 "Run"
- **Running (執行中)**：button 文字顯示 "Stop"
- **Completed (完成)**：button 有 `disabled`，文字變回 "Run"，textarea 被清空

### 圖片捕捉

- 搜尋所有 `.ng-star-inserted` 容器中的 `img` 元素
- 讀取 `img.src` 和 `img.alt`
- 使用 `alt` 作為檔名，清理非法字元
- 透過 Chrome Downloads API 下載

## ⚙️ 配置選項

### 時間設定

| 選項 | 預設值 | 說明 |
|------|--------|------|
| 輸入後等待時間 | 1.5 秒 | 輸入文本後等待多久才檢查按鈕狀態 |
| 組間間隔時間 | 2.5 秒 | 完成一組任務後等待多久執行下一組 |

### 選擇器配置

如果 Gemini AI Studio 的 DOM 結構改變，可以修改 `content.js` 中的選擇器：

```javascript
const SELECTORS = {
  textarea: 'textarea[placeholder="Start typing a prompt"]',
  button: 'button.run-button',
  buttonText: 'button.run-button .label',
  resultContainer: '.ng-star-inserted',
  resultImages: '.ng-star-inserted img'
};
```

## 🐛 疑難排解

### 找不到輸入框或按鈕
- 確認您在正確的 Gemini AI Studio 頁面
- 檢查頁面是否完全載入
- F12 開啟開發者工具查看 Console 日誌

### 按鈕一直無法啟用
- 增加「輸入後等待時間」
- 檢查輸入的文本格式是否正確
- 手動測試輸入是否能正常啟用按鈕

### 任務執行超時
- 每個任務最多等待 5 分鐘
- 如果 Gemini 回應較慢，這是正常的
- 可以手動點擊「停止執行」並重試

### 圖片下載失敗
- 檢查瀏覽器下載權限
- 確認圖片已經生成在頁面上
- 查看 Console 是否有錯誤訊息

## 📝 日誌類型

擴充工具會記錄以下類型的日誌：

- 🔵 **info**：一般資訊（藍綠色）
- 🟢 **success**：成功操作（綠色）
- 🟡 **warning**：警告訊息（黃色）
- 🔴 **error**：錯誤訊息（紅色）

## 🔒 權限說明

此擴充工具需要以下權限：

- `activeTab`：存取當前分頁
- `scripting`：注入內容腳本
- `downloads`：下載圖片
- `storage`：儲存設定
- `https://aistudio.google.com/*`：只在 Gemini AI Studio 網站運作

## 📄 檔案結構

```
gemini-ai-studio-banana/
├── manifest.json          # 擴充工具配置檔
├── popup.html            # 彈出視窗 HTML
├── popup.css             # 彈出視窗樣式
├── popup.js              # 彈出視窗邏輯
├── content.js            # 內容腳本（主要邏輯）
├── background.js         # 背景服務腳本
├── create-icons.html     # 圖示生成工具
├── README.md             # 說明文件
└── icons/                # 圖示資料夾
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 🎨 UI 特色

- 🎨 美觀的漸層色彩設計
- 📱 響應式界面
- 🌙 深色主題日誌視窗
- ✨ 流暢的動畫效果
- 📊 視覺化進度條

## 🔄 更新日誌

### Version 1.0.0
- ✅ 初始版本發布
- ✅ 文本和 JSON 模式支援
- ✅ 自動化任務執行
- ✅ 圖片批次下載
- ✅ 進度追蹤和日誌記錄

## 📞 技術支援

如有問題或建議，請查看：
- Console 日誌（F12 開發者工具）
- 擴充工具內建的執行日誌
- 檢查 Gemini AI Studio 頁面結構是否改變

## ⚠️ 注意事項

1. 此工具僅供個人使用，請遵守 Google 服務條款
2. 不要設定過短的延遲時間，以免對伺服器造成負擔
3. 大量任務執行時請注意 API 限制
4. 建議先用少量任務測試後再進行大批次處理
5. 下載的圖片會儲存在瀏覽器預設下載資料夾

## 📜 授權

此專案僅供學習和個人使用。

---

Made with 🍌 and ❤️

