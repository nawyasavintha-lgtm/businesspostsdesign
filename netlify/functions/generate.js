exports.handler = async function(event, context) {
if (event.httpMethod !== "POST") {
return { statusCode: 405, body: "Method Not Allowed" };
}

try {
const { category, ratio, prompt, hasModel, hasPattern } = JSON.parse(event.body);

let width = 1080; let height = 1080;
if (ratio === '9:16') { width = 1080; height = 1920; }
if (ratio === '16:9') { width = 1920; height = 1080; }
if (ratio === '4:5') { width = 1080; height = 1350; }

let customStyle = "";
if (category === 'clothing') {
customStyle = "Theme: Premium High-End Fashion Boutique. Style: Editorial fashion magazine cover vibe. Elegant geometric frames, background card overlays, neat typographic pairings.";
} else if (category === 'tourism') {
customStyle = "Theme: Wild safari adventure. Colors: Olive green, dark safari tones.";
} else if (category === 'cake') {
customStyle = "Theme: Luxury custom cakes. Colors: Pastel pink, rich cream, gold touches.";
} else if (category === 'rent') {
customStyle = "Theme: Modern car rental. Colors: High-contrast aggressive dark mode with glowing yellow.";
}

// DYNAMIC INJECTOR FOR MULTIPLE IMAGES
let multiImageInstruction = "";

if (hasModel) {
multiImageInstruction += `\n5. MODEL IMAGE RULE: The user has uploaded a primary Model/Product photo. You MUST include a highly professional, centrally placed <image> tag with the exact attribute href="{USER_MODEL_IMAGE}". Position it beautifully inside an elegant rectangle or arch frame layout.`;
}

if (hasPattern && category === 'clothing') {
multiImageInstruction += `\n6. PATTERN INTEGRATION: The user has uploaded a second image showing the clothing pattern fabric design. You must analyze its style conceptually and create a background design layout or side panels that harmonize with that style. Additionally, place a small artistic <image> tag with href="{USER_PATTERN_IMAGE}" inside a miniature 'Fabric Pattern Sample Swatch Card' or a background decorative abstract grid circle to blend it natively into the fashion advertisement poster.`;
} else if (hasPattern) {
multiImageInstruction += `\n6. SECONDARY IMAGE: Include an <image> tag with href="{USER_PATTERN_IMAGE}" in a secondary design box or badge element.`;
}

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

const apiPayload = {
contents: [{
parts: [{
text: `You are an expert Senior Graphic Designer. Create a highly professional, visually stunning commercial advertisement banner in RAW SVG format.
The SVG must have viewBox="0 0 ${width} ${height}" and width="100%" height="100%".

Business Category: ${category}
Design Style Guidelines: ${customStyle}
User's Goal/Concept: "${prompt}"

CRITICAL COMPLIANCE RULES:
1. Output MUST ONLY be valid, well-formatted SVG code.
2. Do NOT include ANY explanations, markdown blocks like \`\`\`svg, or notes outside the SVG text response.
3. Use beautiful built-in system typography (e.g., Arial, Impact, sans-serif) for readable bold English promotional headings. Keep text strings strictly English.
4. Use clean vector paths, beautiful gradients, overlays, and modern text-badges.
${multiImageInstruction}`
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
let svgCode = data.candidates[0].content.parts[0].text.trim();

if (svgCode.includes("```")) {
svgCode = svgCode.replace(/```svg|```xml|```html|```/gi, "").trim();
}
if (!svgCode.startsWith("<svg") && svgCode.includes("<svg")) {
svgCode = svgCode.substring(svgCode.indexOf("<svg"));
}

return {
statusCode: 200,
headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
body: JSON.stringify({ svg: svgCode })
};

} catch (error) {
return { statusCode: 500, body: JSON.stringify({ error: "Server Error: " + error.message }) };
}
};
