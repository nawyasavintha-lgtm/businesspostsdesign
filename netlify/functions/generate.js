exports.handler = async function(event, context) {
if (event.httpMethod !== "POST") {
return { statusCode: 405, body: "Method Not Allowed" };
}

try {
const { category, ratio, prompt, imageCount } = JSON.parse(event.body);

let width = 1080; let height = 1080;
if (ratio === '9:16') { width = 1080; height = 1920; }
if (ratio === '16:9') { width = 1920; height = 1080; }
if (ratio === '4:5') { width = 1080; height = 1350; }

let customStyle = "Theme: Modern commercial advertisement. Style: Clean geometric layouts, elegant typography with clean backgrounds.";
if (category === 'clothing') {
customStyle = "Theme: Premium Fashion Brand. Style: Editorial fashion magazine template layout with upscale geometric presentation.";
} else if (category === 'tourism') {
customStyle = "Theme: Wild safari adventure. Colors: Rich olive green, warm wooden tones, safari orange.";
} else if (category === 'cake') {
customStyle = "Theme: Luxury custom bakers. Colors: Pastel pink, rich sweet cream, golden accents.";
} else if (category === 'rent') {
customStyle = "Theme: Modern automotive car rent. Colors: High-contrast professional dark mode with striking neon yellow accents.";
}

// DYNAMICALLY GENERATE INDIVIDUAL IMAGES IN THE LAYOUT
let galleryInstruction = "";
if (imageCount && imageCount > 0) {
galleryInstruction = `\n5. DYNAMIC IMAGE GALLERY INSTRUCTIONS: The user has uploaded ${imageCount} reference image(s). You MUST include exactly ${imageCount} professional <image> tag(s) distributed artistically across the canvas.
Each image tag MUST use the exact placeholder format for its href attribute:`;

for (let i = 0; i < imageCount; i++) {
galleryInstruction += `\n- Image ${i+1}: Use href="{USER_IMAGE_${i}}". Place it inside a beautiful modern frame container (rectangle, grid layout, circle badge, or overlay card) with custom x, y, width, and height so they do not overlap overlaps messily. Arrange them as a stunning gallery collage or balanced promotional layout matching the business type.`;
}
} else {
galleryInstruction = `\n5. No reference images uploaded. Use highly creative vector illustrations, abstract background shapes, or clean pattern iconography to fill up the design gracefully.`;
}

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

const apiPayload = {
contents: [{
parts: [{
text: `You are an expert Senior UI/UX and Graphic Designer. Create a highly professional, visually stunning commercial advertisement banner in RAW SVG format.
The SVG must have viewBox="0 0 ${width} ${height}" and width="100%" height="100%".

Business Category: ${category}
Design Style Guidelines: ${customStyle}
User's Goal/Concept: "${prompt}"

CRITICAL COMPLIANCE RULES:
1. Output MUST ONLY be valid, well-formatted SVG code.
2. Do NOT include ANY explanations, markdown blocks like \`\`\`svg, or comments outside the SVG response.
3. Use beautiful built-in system typography (e.g., Arial, Impact, sans-serif) for readable bold English promotional headings. Keep text strings strictly English.
4. Use clean vector paths, gradients, card shapes, frames, and badge overlays.
${galleryInstruction}`
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
