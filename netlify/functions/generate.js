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

if (category === 'clothing') {
bgColor = "#111827"; // Luxury Dark
accentColor = "#fbbf24"; // Amber Gold
overlayCard = "rgba(31, 41, 55, 0.8)";
} else if (category === 'tourism') {
bgColor = "#14532d"; // Safari Jungle Green
accentColor = "#f97316"; // Safety Orange
overlayCard = "rgba(255, 255, 255, 0.95)";
} else if (category === 'cake') {
bgColor = "#fdf2f8"; // Pastel Soft Pink
accentColor = "#db2777"; // Deep Pink
overlayCard = "rgba(255, 255, 255, 0.9)";
} else if (category === 'rent') {
bgColor = "#0f172a"; // Tech Slate
accentColor = "#eab308"; // Glowing Yellow
overlayCard = "rgba(30, 41, 59, 0.85)";
}

// 3. HARDCODED SMART GRID SYSTEM FOR IMAGES (Prevents Overlapping)
let generatedImageTags = "";

if (imageCount && imageCount > 0) {
if (imageCount === 1) {
// Single Image Center Layout
let imgW = width * 0.7;
let imgH = height * 0.55;
let imgX = (width - imgW) / 2;
let imgY = height * 0.18;
generatedImageTags = `<g filter="url(#shadow)">
<rect x="${imgX - 10}" y="${imgY - 10}" width="${imgW + 20}" height="${imgH + 20}" rx="15" fill="#ffffff" stroke="${accentColor}" stroke-width="4"/>
<clipPath id="clip0"><rect x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" rx="10"/></clipPath>
<image href="{USER_IMAGE_0}" x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip0)"/>
</g>`;
}
else if (imageCount === 2) {
// 2 Images Side-by-Side Split Grid
let gap = 40;
let imgW = (width * 0.85 - gap) / 2;
let imgH = height * 0.55;
let startX = (width - (imgW * 2 + gap)) / 2;
let imgY = height * 0.18;

generatedImageTags = `
<g filter="url(#shadow)">
<rect x="${startX - 8}" y="${imgY - 8}" width="${imgW + 16}" height="${imgH + 16}" rx="15" fill="#ffffff" stroke="${accentColor}" stroke-width="3"/>
<clipPath id="clip1"><rect x="${startX}" y="${imgY}" width="${imgW}" height="${imgH}" rx="10"/></clipPath>
<image href="{USER_IMAGE_0}" x="${startX}" y="${imgY}" width="${imgW}" height="${imgH}" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip1)"/>
</g>
<g filter="url(#shadow)">
<rect x="${startX + imgW + gap - 8}" y="${imgY - 8}" width="${imgW + 16}" height="${imgH + 16}" rx="15" fill="#ffffff" stroke="${accentColor}" stroke-width="3"/>
<clipPath id="clip2"><rect x="${startX + imgW + gap}" y="${imgY}" width="${imgW}" height="${imgH}" rx="10"/></clipPath>
<image href="{USER_IMAGE_1}" x="${startX + imgW + gap}" y="${imgY}" width="${imgW}" height="${imgH}" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip2)"/>
</g>`;
}
else {
// 3 or More Images: Balanced 2x2 Matrix Grid
let gap = 30;
let imgW = (width * 0.85 - gap) / 2;
let imgH = (height * 0.55 - gap) / 2;
let startX = (width - (imgW * 2 + gap)) / 2;
let startY = height * 0.18;

// Slot 1
generatedImageTags += `<g filter="url(#shadow)">
<rect x="${startX - 6}" y="${startY - 6}" width="${imgW + 12}" height="${imgH + 12}" rx="12" fill="#ffffff" stroke="${accentColor}" stroke-width="2"/>
<clipPath id="c1"><rect x="${startX}" y="${startY}" width="${imgW}" height="${imgH}" rx="8"/></clipPath>
<image href="{USER_IMAGE_0}" x="${startX}" y="${startY}" width="${imgW}" height="${imgH}" preserveAspectRatio="xMidYMid slice" clip-path="url(#c1)"/>
</g>`;
// Slot 2
generatedImageTags += `<g filter="url(#shadow)">
<rect x="${startX + imgW + gap - 6}" y="${startY - 6}" width="${imgW + 12}" height="${imgH + 12}" rx="12" fill="#ffffff" stroke="${accentColor}" stroke-width="2"/>
<clipPath id="c2"><rect x="${startX + imgW + gap}" y="${startY}" width="${imgW}" height="${imgH}" rx="8"/></clipPath>
<image href="{USER_IMAGE_1}" x="${startX + imgW + gap}" y="${startY}" width="${imgW}" height="${imgH}" preserveAspectRatio="xMidYMid slice" clip-path="url(#c2)"/>
</g>`;
// Slot 3
if (imageCount >= 3) {
generatedImageTags += `<g filter="url(#shadow)">
<rect x="${startX - 6}" y="${startY + imgH + gap - 6}" width="${imgW + 12}" height="${imgH + 12}" rx="12" fill="#ffffff" stroke="${accentColor}" stroke-width="2"/>
<clipPath id="c3"><rect x="${startX}" y="${startY + imgH + gap}" width="${imgW}" height="${imgH}" rx="8"/></clipPath>
<image href="{USER_IMAGE_2}" x="${startX}" y="${startY + imgH + gap}" width="${imgW}" height="${imgH}" preserveAspectRatio="xMidYMid slice" clip-path="url(#c3)"/>
</g>`;
}
// Slot 4
if (imageCount >= 4) {
generatedImageTags += `<g filter="url(#shadow)">
<rect x="${startX + imgW + gap - 6}" y="${startY + imgH + gap - 6}" width="${imgW + 12}" height="${imgH + 12}" rx="12" fill="#ffffff" stroke="${accentColor}" stroke-width="2"/>
<clipPath id="c4"><rect x="${startX + imgW + gap}" y="${startY + imgH + gap}" width="${imgW}" height="${imgH}" rx="8"/></clipPath>
<image href="{USER_IMAGE_3}" x="${startX + imgW + gap}" y="${startY + imgH + gap}" width="${imgW}" height="${imgH}" preserveAspectRatio="xMidYMid slice" clip-path="url(#c4)"/>
</g>`;
}
}
}

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

// 4. Instruct Gemini to write ONLY Text overlays, graphics, and backgrounds around our frames
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

// Inject useful shadow filters definition to make frames pop out natively
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
