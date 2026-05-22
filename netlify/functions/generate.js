exports.handler = async function(event, context) {
if (event.httpMethod !== "POST") {
return { statusCode: 405, body: "Method Not Allowed" };
}

try {
// Front-end එකෙන් එන දත්ත සහ Upload කරපු Images (Base64) ටික ගන්නවා
const { category, ratio, prompt, imagesArray } = JSON.parse(event.body);

const apiKey = process.env.GEMINI_API_KEY;

// 1. Google Nano Banana 2 / Pro Image Endpoint එක කෝල් කිරීම
const url = `https://generativelanguage.googleapis.com/v1beta/models/nano-banana-2:generateContent?key=${apiKey}`;

// 2. යූසර් අප්ලෝඩ් කරපු පින්තූර ටික AI එකට කියවිය හැකි Multimodal Format එකට හැරවීම
let imageParts = [];
if (imagesArray && imagesArray.length > 0) {
imageParts = imagesArray.map(base64Str => {
// Remove data:image/png;base64, prefix if exists
const cleanBase64 = base64Str.split(',')[1] || base64Str;
return {
inlineData: {
mimeType: "image/png",
data: cleanBase64
}
};
});
}

// 3. Nano Banana සඳහා විශේෂිත වූ Image-to-Image / Editing Prompt එක සැකසීම
const systemInstruction = `You are Google's Nano Banana Pro, a state-of-the-art image editing and generation model.
Your task is to analyze the provided reference images and combine, modify, or edit them flawlessly according to the user's prompt.
Maintain perfect photorealism, perspective, lighting, and consistency. Do not output code, return the generated creative image directly.`;

const apiPayload = {
contents: [{
parts: [
...imageParts, // Upload කරපු පින්තූර ටික මුලින්ම inline දෙනවා
{ text: `${systemInstruction}\n\nUser Request: ${prompt}\nBusiness Category Context: ${category}\nAspect Ratio Goal: ${ratio}` }
]
}],
generationConfig: {
temperature: 0.5,
// Nano Banana Models can output high-res raw image data directly
responseMimeType: "image/png"
}
};

const apiResponse = await fetch(url, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(apiPayload)
});

const data = await apiResponse.json();

// Nano Banana API එකෙන් එන බයිනරි Image එක Base64 විදියට Front-end එකට යැවීම
let base64Image = data.candidates[0].content.parts[0].inlineData.data;

return {
statusCode: 200,
headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
body: JSON.stringify({ base64Image: `data:image/png;base64,${base64Image}` })
};

} catch (error) {
return { statusCode: 500, body: JSON.stringify({ error: "Nano Banana Engine Error: " + error.message }) };
}
};
