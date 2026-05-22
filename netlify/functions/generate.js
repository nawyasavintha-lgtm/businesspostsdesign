

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
customStyle = "Use beautiful wild safari colors (olive greens, deep dark forest tones, safari oranges). Add modern shapes.";
} else if (category === 'cake') {
customStyle = "Use sweet bakery pastel colors (soft pink, vanilla cream, gold outlines). Elegant typography.";
} else if (category === 'clothing') {
customStyle = "Minimalist luxury theme, aesthetic fashion backgrounds, bold typography.";
} else if (category === 'rent') {
customStyle = "High contrast dynamic tech dark background with bright yellow highlights, premium vehicle brand vibes.";
}

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

const apiPayload = {
contents: [{
parts: [{
text: `Create a professional marketing social media post banner in raw SVG format with viewBox="0 0 ${width} ${height}".
The business type is "${category}" and user requested text or concept: "${prompt}".
Style guidelines: ${customStyle}.
Include visible, clean English text for main headings based on the prompt.
The output must ONLY be a valid string of SVG code. Do not include markdown code blocks like \`\`\`svg or text explanations. Return raw svg data.`
}]
}],
generationConfig: { temperature: 0.3 }
};

const apiResponse = await fetch(url, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(apiPayload)
});

const data = await apiResponse.json();
let svgCode = data.candidates[0].content.parts[0].text.trim();

if(svgCode.startsWith("```")) {
svgCode = svgCode.replace(/```svg|```xml|```/g, "").trim();
}

return {
statusCode: 200,
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ svg: svgCode })
};

} catch (error) {
return {
statusCode: 500,
body: JSON.stringify({ error: "AI Engine එකෙන් Design එක සෑදීමට නොහැකි විය." })
};
}
};
