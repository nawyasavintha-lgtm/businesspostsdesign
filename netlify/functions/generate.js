exports.handler = async function(event, context) {
if (event.httpMethod !== "POST") {
return { statusCode: 405, body: "Method Not Allowed" };
}

try {
const { category, ratio, prompt } = JSON.parse(event.body);

let width = 1080; let height = 1080;
if (ratio === '9:16') { width = 1080; height = 1920; }
if (ratio === '16:9') { width = 1920; height = 1080; }
if (ratio === '4:5') { width = 1080; height = 1350; }

let customStyle = "";
if (category === 'tourism') {
customStyle = "Theme: Wild safari, national park adventure. Colors: Olive green, safari orange, luxury dark forest background. Design elements: Modern abstract organic shapes, vector silhouettes of wild safari animals like elephants or acacia trees.";
} else if (category === 'cake') {
customStyle = "Theme: Sweet bakery, premium cupcakes. Colors: Soft pastel pink, vanilla cream, elegant gold borders. Design elements: Cute stars, dots, stylish modern minimal vector shapes.";
} else if (category === 'clothing') {
customStyle = "Theme: Minimalist high-end fashion boutique. Colors: Modern beige, aesthetic black and clean white tints. Design elements: Luxury frame layouts, bold lines, elegant geometric shapes.";
} else if (category === 'rent') {
customStyle = "Theme: Premium dynamic car rental service. Colors: High-contrast aggressive dark mode background (#111) with glowing neon yellow/amber or crimson accents. Design elements: Fast diagonal stripes, professional tech layouts.";
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
return { statusCode: 500, body: JSON.stringify({ error: "Netlify Environment Variable එකේ API Key එක නැත." }) };
}

const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

const apiPayload = {
contents: [{
parts: [{
text: `You are an expert Graphic Designer. Create a highly professional, beautiful social media marketing banner in RAW SVG format.
The SVG must have viewBox="0 0 ${width} ${height}" and width="100%" height="100%".

Business Category: ${category}
Design Style Guidelines: ${customStyle}
User's Goal/Concept (Translate or interpret if in another language): "${prompt}"

CRITICAL RULES:
1. Output MUST ONLY be valid, well-formatted SVG code.
2. Do NOT include ANY explanations, markdown blocks like \`\`\`svg, or notes outside the SVG.
3. Do not use complex external image URLs. Use clean vector geometry, paths, shapes, gradients, and beautiful built-in system typography (e.g., Arial, Impact, sans-serif) for readable English headings.
4. Keep all typography strings strictly in English characters to avoid render crashes.`
}]
}],
generationConfig: {
temperature: 0.2,
topP: 0.95
}
};

const apiResponse = await fetch(url, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(apiPayload)
});

if (!apiResponse.ok) {
return { statusCode: 500, body: JSON.stringify({ error: "Google API එක සමඟ සම්බන්ධ විය නොහැක." }) };
}

const data = await apiResponse.json();

if (!data.candidates || data.candidates.length === 0) {
return { statusCode: 500, body: JSON.stringify({ error: "AI මොඩලය විසින් කෝඩ් එකක් ලබා නොදුනි." }) };
}

let svgCode = data.candidates[0].content.parts[0].text.trim();

// Clean markdown blocks safely
if (svgCode.includes("```")) {
svgCode = svgCode.replace(/```svg|```xml|```html|```/gi, "").trim();
}

// Final check for valid SVG starting tag
if (!svgCode.startsWith("<svg") && svgCode.includes("<svg")) {
svgCode = svgCode.substring(svgCode.indexOf("<svg"));
}

return {
statusCode: 200,
headers: {
"Content-Type": "application/json",
"Access-Control-Allow-Origin": "*"
},
body: JSON.stringify({ svg: svgCode })
};

} catch (error) {
return {
statusCode: 500,
body: JSON.stringify({ error: "Server Error: " + error.message })
};
}
};
