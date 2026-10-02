import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Body parser with 20MB limit for high-res photo uploads
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Initialize Google GenAI with required headers
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// AI Recognition API Endpoint
app.post('/api/recognize', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', targetHint } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: '請提供要辨識的圖片資料 (imageBase64)' });
    }

    // Strip data URL prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

    const prompt = `
你是一位專業的台灣生活與醫療備忘錄助理。請分析這張圖片，自動判斷它是屬於以下哪一種類型的備忘錄：
1. "appointment" (就診掛號單、看診預約通知、醫院收據、檢查檢驗單、醫師名片等)
2. "medication" (藥袋、處方箋、藥盒、鋁箔排裝藥片、藥品外觀照片等)
3. "todo" (超商繳費單、水電水費單、手寫代辦便條紙、採買購物清單、行程通知、生活瑣事等)

請務必嚴格輸出合法的 JSON 物件，請勿包含 Markdown 標記 (\`\`\`json 或 \`\`\`)，直接輸出純 JSON。
JSON 結構範式如下：

{
  "detectedType": "appointment" | "medication" | "todo",
  "confidenceSummary": "簡述辨識到的內容（繁體中文，約15~30字）",
  "appointmentData": {
    "hospital": "醫院或診所名稱（如 台大醫院總院、台北榮總）",
    "department": "看診科別（如 心臟內科、新陳代謝科）",
    "doctor": "醫師姓名（如 林醫師）",
    "date": "YYYY-MM-DD",
    "time": "HH:mm",
    "number": "看診診號或號碼（如 28 號）",
    "address": "地址（若有）",
    "precautions": "注意事項（如 空腹抽血8小時、攜帶健保卡、停止服用抗凝血劑）",
    "itemsToBring": ["健保卡", "身分證", "近期藥袋"],
    "notes": "備註指引（如 門診大樓2樓12診間）"
  },
  "medicationData": {
    "name": "藥品名稱與劑量規格（如 脈優錠 5mg / Amlodipine）",
    "purpose": "用途或適應症（如 降血壓、預防血栓）",
    "dosage": "服用劑量（如 每次 1 顆）",
    "appearance": {
      "color": "藥品顏色（如 白色、粉紅色、紅白雙色）",
      "shape": "round" | "oval" | "capsule" | "square" | "other",
      "description": "藥品外觀特徵（如 刻有 AML 5 字樣之八角圓形錠）"
    },
    "timings": ["after_breakfast" | "after_lunch" | "after_dinner" | "bedtime" | "before_breakfast"],
    "frequency": "daily" | "prn" | "weekdays" | "interval",
    "maxDailyDoses": 1,
    "minIntervalHours": 4,
    "totalStock": 30,
    "foodNotes": "飲食注意事項（如 隨餐服用、避免葡萄柚）"
  },
  "todoData": {
    "title": "瑣事標題",
    "category": "家務" | "採買" | "繳費" | "聯絡" | "醫療" | "其他",
    "dueDate": "YYYY-MM-DD",
    "dueTime": "HH:mm",
    "priority": "high" | "medium" | "low",
    "notes": "備註細節（如 金額、繳費條碼、備註細項）"
  }
}

注意事項：
- 若日期中只有月/日或民國年（如 115年/2026年），請轉換為標準西元 YYYY-MM-DD。若無年份則使用當前西元年（2026）。
- 若辨識到藥袋，請特別抓取藥品名稱、早中晚飯前飯後服用時機、劑量與重要忌口警語。
- 若 targetHint 有提供（如 "appointment" 或 "medication" 或 "todo"），請優先朝該類型結構提取資料。
${targetHint ? `使用者提示類型偏好：${targetHint}` : ''}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '{}';
    let parsedData = {};
    try {
      parsedData = JSON.parse(rawText);
    } catch (parseErr) {
      // Clean possible markdown wrappers if any
      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    return res.json({ success: true, data: parsedData });
  } catch (err: any) {
    console.error('Gemini image recognition error:', err);
    return res.status(500).json({
      error: `影像辨識失敗：${err.message || '請確認圖片清晰並重試'}`,
    });
  }
});

// Setup Vite middleware in dev or static files in prod
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT} (NODE_ENV: ${process.env.NODE_ENV || 'development'})`);
  });
}

startServer();
