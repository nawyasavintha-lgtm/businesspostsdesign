exports.handler = async function(event, context) {
// Enable CORS
const headers = {
"Access-Control-Allow-Origin": "*",
"Access-Control-Allow-Headers": "Content-Type",
"Access-Control-Allow-Methods": "POST, OPTIONS",
"Content-Type": "application/json"
};

if (event.httpMethod === "OPTIONS") {
return { statusCode: 200, headers, body: "" };
}

if (event.httpMethod !== "POST") {
return { statusCode: 405, headers, body: "Method Not Allowed" };
}

try {
const { category, ratio, prompt, imagesArray } = JSON.parse(event.body);
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
return { statusCode: 500, headers, body: JSON.stringify({ error: "API Key එක Backend එකේ සෙට් කර නැත!" }) };
}

// 1. Determine Exact Dimensions
let width = 1080; let height = 1080;
if (ratio === '9:16') { width = 1080; height = 1920; }
if (ratio === '16:9') { width = 1920; height = 1080; }
if (ratio === '4:5') { width = 1080; height = 1350; }

// 2. Prepare Multimodal Payload
let imageParts = [];
if (imagesArray && imagesArray.length > 0) {
imageParts = imagesArray.map(base64Str => {
const cleanBase64 = base64Str.includes(",") ? base64Str.split(',')[1] : base64Str;
return {
inlineData: {
mimeType: "image/png",
data: cleanBase64
}
};
});
}

// 3. Fallback and Smart Hybrid Model Call (Ensures No '0' reading errors)
// We use the powerful Gemini 2.5 Flash which can process images and return high-fidelity vector/structured styling definitions natively if output format handles it.
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

const systemInstruction = `You are Lanka AI Design Agent PRO, powered by Google's advanced multimodal engine.
The user has uploaded ${imageParts.length} image(s). Your job is to generate a premium social media advertisement banner in RAW SVG format based on the business category: "${category}".

CRITICAL RULES:
1. Canvas ViewBox: "0 0 ${width} ${height}"
2. You MUST include exactly ${imageParts.length} image elements inside the SVG to display the uploaded reference images. Use the exact href tags:
${imageParts.map((_, i) => `- href="{USER_IMAGE_${i}}"`).join("\n")}
3. Do NOT overlay the images directly on top of each other. Arrange them into a premium, modern dual-grid frame, catalog layout, or stylish polaroid alignment. Give them elegant borders, rounded corners (rx), and soft drop-shadows.
4. Write highly converting English promotional text and beautiful typography elements matching the prompt: "${prompt}". Add a "SHOP NOW" or action pill button at the bottom.
5. Output ONLY the raw valid SVG string. No markdown code blocks (do NOT wrap in \`\`\`xml or \`\`\`svg), no chat explanations, no HTML. Start directly with <svg> and end with </svg>.`;

const apiPayload = {
contents: [{
parts: [
...imageParts,
{ text: systemInstruction }
]
}],
generationConfig: {
temperature: 0.4,
topP: 0.95
}
};

const apiResponse = await fetch(url, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(apiPayload)
});

const data = await apiResponse.json();

// Safe Parsing Block to prevent "Cannot read properties of undefined"
if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
console.error("Google API Raw Response Error:", JSON.stringify(data));
return {
statusCode: 500,
headers,
body: JSON.stringify({ error: "Google API එකෙන් නිසි පිළිතුරක් ලැබුණේ නැත. කරුණාකර නැවත උත්සාහ කරන්න." })
};
}

let svgContent = data.candidates[0].content.parts[0].text.trim();

// Clean out any accidental markdown wrapper if the AI hallucinates it
if (svgContent.includes("```")) {
svgContent = svgContent.replace(/```svg|```xml|```html|```/gi, "").trim();
}
if (!svgContent.startsWith("<svg") && svgContent.includes("<svg")) {
svgContent = svgContent.substring(svgContent.indexOf("<svg"));
}

// Dynamically insert high-end shadow filters into the AI's SVG definitions dynamically if missing
if (svgContent.includes("</svg>") && !svgContent.includes("id=\"premium-shadow\"")) {
const closingTagIndex = svgContent.lastIndexOf("</svg>");
const filterDefs = `<defs>
<filter id="premium-shadow" x="-10%" y="-10%" width="120%" height="120%">
<feDropShadow dx="0" dy="8" stdDeviation="8" flood-opacity="0.25"/>
</filter>
</defs>`;
svgContent = svgContent.substring(0, closingTagIndex) + filterDefs + "</svg>";
}

// We convert the dynamically assembled SVG straight into a safe DataURI base64 string so that our new front-end img tag can render it flawlessly without breakage!
const base64Svg = Buffer.from(svgContent).toString('base64');
const finalResponseImage = `data:image/svg+xml;base64,${base64Svg}`;

return {
statusCode: 200,
headers,
body: JSON.stringify({ base64Image: finalResponseImage })
};

} catch (error) {
return {
statusCode: 500,
headers,
body: JSON.stringify({ error: "Lanka AI Engine Core Error: " + error.message })
};
}
};
