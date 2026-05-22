exports.handler = async function(event, context) {
if (event.httpMethod !== "POST") {
return { statusCode: 405, body: "Method Not Allowed" };
}

try {
const { category, ratio, prompt, imageCount } = JSON.parse(event.body);

// 1. Determine Standard Sizes
let width = 1080; let height = 1080;
if (ratio === '9:16') { width = 1080; height = 1920; }
if (ratio === '16:9') { width = 1920; height = 1080; }
if (ratio === '4:5') { width = 1080; height = 1350; }

// 2. Set Up Custom Category Colors & Themes
let bgColor = "#f8fafc";
let accentColor = "#3b82f6";
let overlayCard = "rgba(255, 255, 255, 0.9)";
let customStyle = "Theme: Modern commercial advertisement. Style: Clean geometric layouts, elegant typography with beautiful backgrounds.";

if (category === 'clothing') {
bgColor = "#111827"; // Luxury Dark
accentColor = "#fbbf24"; // Amber Gold
overlayCard = "rgba(31, 41, 55, 0.8)";
customStyle = "Theme: Premium Fashion Brand. Style: Editorial fashion magazine template layout with upscale geometric presentation.";
} else if (category === 'tourism') {
bgColor = "#14532d"; // Safari Jungle Green
accentColor = "#f97316"; // Safety Orange
overlayCard = "rgba(255, 255, 255, 0.95)";
customStyle = "Theme: Wild safari adventure. Colors: Rich olive green, warm wooden tones, safari orange.";
} else if (category === 'cake') {
bgColor = "#fdf2f8"; // Pastel Soft Pink
accentColor = "#db2777"; // Deep Pink
overlayCard = "rgba(255, 255, 255, 0.9)";
customStyle = "Theme: Luxury custom bakers. Colors: Pastel pink, rich sweet cream, golden accents.";
} else if (category === 'rent') {
bgColor = "#0f172a"; // Tech Slate
accentColor = "#eab308"; // Glowing Yellow
overlayCard = "rgba(30, 41, 59, 0.85)";
customStyle = "Theme: Modern automotive car rent. Colors: High-contrast professional dark mode with striking neon yellow accents.";
}

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

const apiPayload = {
contents: [{
parts: [{
text: `You are an elite automated Graphic Designer. Generate a spectacular, high-end promotional advertisement banner in RAW SVG format.
The SVG Canvas size is exactly width="100%" height="100%" with viewBox="0 0 ${width} ${height}".

BUSINESS DATA:
- Category: ${category}
- Style Baseline: ${customStyle}
- Marketing Topic / Concept: "${prompt}"

STRUCTURE REQUIREMENT:
You must build a stunning commercial graphic background layer, badges, and marketing typography.

CRITICAL: Do NOT code any <image> tags yourself. I have already injected the image gallery grid.
You must design a beautiful, modern text-overlay footer banner section at the bottom (Y: ${height * 0.76} to ${height * 0.95}) to hold the primary headings, 'SHOP NOW' or call-to-action buttons, and promotional subtitles.

SVG CONSTRUCTION INSTRUCTIONS:
1. Start with a solid background <rect> using color "${bgColor}". Add modern diagonal decorative background stripes or soft glowing ambient vector circles.
2. Create a clean container accent overlay box with fill="${overlayCard}" at the top or bottom for high text readability.
3. Output ONLY the raw valid SVG string. Absolutely NO explanations, markdown code blocks, or HTML wrappers.`
}]
}],
generationConfig: { temperature: 0.2, topP: 0.95 }
};

const apiResponse = await fetch(url, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(apiPayload)
});

const data = await apiResponse.json();
let aiGeneratedGraphics = data.candidates[0].content.parts[0].text.trim();

// Clean markdown if present
if (aiGeneratedGraphics.includes("```")) {
aiGeneratedGraphics = aiGeneratedGraphics.replace(/```svg|```xml|```html|```/gi, "").trim();
}
if (!aiGeneratedGraphics.startsWith("<svg") && aiGeneratedGraphics.includes("<svg")) {
aiGeneratedGraphics = aiGeneratedGraphics.substring(aiGeneratedGraphics.indexOf("<svg"));
}

// 5. HYBRID ASSEMBLY: Inject the hardcoded safe image layout right before the closing </svg> tag
let finalClosingTagIndex = aiGeneratedGraphics.lastIndexOf("</svg>");
if (finalClosingTagIndex !== -1) {
let coreSvgSetup = aiGeneratedGraphics.substring(0, finalClosingTagIndex);

let filterDef = `<defs>
<filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
<feDropShadow dx="0" dy="12" stdDeviation="10" flood-opacity="0.3" flood-color="#000000"/>
</filter>
</defs>`;

aiGeneratedGraphics = `${coreSvgSetup}
${filterDef}
${generatedImageTags}
</svg>`;
}

return {
statusCode: 200,
headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
body: JSON.stringify({ svg: aiGeneratedGraphics })
};

} catch (error) {
return { statusCode: 500, body: JSON.stringify({ error: "Server Error: " + error.message }) };
}
};
