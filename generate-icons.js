// Node.js 腳本來生成簡單的 PNG 圖示
const fs = require('fs');
const path = require('path');

// 生成簡單的 SVG 圖示
function generateSVG(size) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.2}"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-size="${size * 0.6}" fill="white">🍌</text>
</svg>`;
}

// 確保 icons 資料夾存在
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

// 生成三個尺寸的 SVG 圖示
const sizes = [16, 48, 128];
sizes.forEach(size => {
  const svg = generateSVG(size);
  const filename = path.join(iconsDir, `icon${size}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`已生成: ${filename}`);
});

console.log('\n✅ SVG 圖示已生成！');
console.log('💡 您可以：');
console.log('1. 直接使用 SVG 檔案（需修改 manifest.json）');
console.log('2. 使用線上工具將 SVG 轉換為 PNG：https://www.aconvert.com/image/svg-to-png/');
console.log('3. 或在瀏覽器中開啟 create-icons.html 來生成 PNG');

