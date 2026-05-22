exports.handler = async function(event, context) {
const headers = {
"Access-Control-Allow-Origin": "*",
"Access-Control-Allow-Headers": "Content-Type",
"Access-Control-Allow-Methods": "POST, OPTIONS",
"Content-Type": "application/json"
};

if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: "Method Not Allowed" };

try {
const { category, ratio, prompt, imagesArray } = JSON.parse(event.body);
const apiKey = process.env.GEMINI_API_KEY;

let width = 1080; let height = 1080;
if (ratio === '9:16') { width = 1080; height = 1920; }
if (ratio === '16:9') { width = 1920; height = 1080; }
if (ratio === '4:5') { width = 1080; height = 1350; }

let imageParts = [];
if (imagesArray && imagesArray.length > 0) {
imageParts = imagesArray.map(base64Str => {
const cleanBase64 = base64Str.includes(",") ? base64Str.split(',')[1] : base64Str;
return { inlineData: { mimeType: "image/png", data: cleanBase64 } };
});
}

const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

// මෝඩෙල් එකට පින්තූර අනිවාර්යයෙන්ම දාන්න කියලා දෙන Strict Rule එක
const systemInstruction = `You are a professional Social Media Banner Designer. Create a premium advertisement banner in RAW SVG format.
Canvas size: viewBox="0 0 ${width} ${height}".

CRITICAL STYLING LAWS:
1. Create a beautiful dark or modern background with geometric gradients.
2. You MUST render exactly ${imageParts.length} <image> elements. If you hide them, the design fails. Use these exact href strings sequentially:
${imageParts.map((_, i) => `- href="{USER_IMAGE_${i}}"`).join("\n")}
3. Place the images in a clean, high-end side-by-side or stacked dual-frame grid with white borders and shadow effects so they look like a luxury fashion catalog.
4. Based on the user's concept: "${prompt}", write highly catchy premium English marketing text, titles, and a stylized "SHOP NOW" pill button at the bottom.
5. Output ONLY raw valid SVG code starting with <svg> and ending with </svg>. No markdown wraps, no backticks.`;

const apiPayload = {
contents: [{ parts: [...imageParts, { text: systemInstruction }] }],
generationConfig: { temperature: 0.3, topP: 0.95 }
};

const apiResponse = await fetch(url, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(apiPayload)
});

const data = await apiResponse.json();
let svgContent = data.candidates[0].content.parts[0].text.trim();

if (svgContent.includes("```")) {
svgContent = svgContent.replace(/```svg|```xml|```html|```/gi, "").trim();
}
if (!svgContent.startsWith("<svg") && svgContent.includes("<svg")) {
svgContent = svgContent.substring(svgContent.indexOf("<svg"));
}

const base64Svg = Buffer.from(svgContent).toString('base64');
return {
statusCode: 200,
headers,
body: JSON.stringify({ base64Image: `data:image/svg+xml;base64,${base64Svg}` })
};

} catch (error) {
return { statusCode: 500, headers, body: JSON.stringify({ error: "Engine Error: " + error.message }) };
}
};
