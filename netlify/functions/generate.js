exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { category, ratio, prompt, hasImage } = JSON.parse(event.body);

        let width = 1080; let height = 1080;
        if (ratio === '9:16') { width = 1080; height = 1920; }
        if (ratio === '16:9') { width = 1920; height = 1080; }
        if (ratio === '4:5') { width = 1080; height = 1350; }

        let customStyle = "";
        if (category === 'tourism') {
            customStyle = "Theme: Wild safari. Colors: Olive green, safari orange, deep dark forest tones.";
        } else if (category === 'cake') {
            customStyle = "Theme: Sweet bakery. Colors: Soft pastel pink, vanilla cream, gold outlines.";
        } else if (category === 'clothing') {
            // Updated Clothing style: Focusing on artistic illustration rather than real model Try-On
            customStyle = "Theme: Modern aesthetic clothing brand. Style: Elegant, premium graphic design with artistic flair. NOT A PHOTOGRAPH. Use modern minimalist geometric shapes, luxury frame layouts, and clean lines. Use color gradients matching user's reference.";
        } else if (category === 'rent') {
            customStyle = "Theme: Premium vehicle rent. Colors: High-contrast dark mode with bright yellow accents.";
        }

        // --- NEW: Artistic Image Prompt Injector ---
        let imageInstruction = "";
        if (hasImage) {
            if (category === 'clothing') {
                // Specialized instruction for clothing
                imageInstruction = `5. CRITICAL DESIGN RULE: The user has uploaded an image of a clothing design. You MUST create a stunning, professional VECTOR ILLUSTRATION or GRAPHIC DESIGN piece, not a real try-on. Study the user's provided pattern and color style from {USER_IMAGE}. Create a central artistic placeholder frame where the user's uploaded image with its exact href="{USER_IMAGE}" attribute will be displayed. Around it, you must dynamically generate elegant pattern motifs, flourishes, and design elements that *mimic and harmonize* with the style of the user's clothing pattern to make a cohesive artistic fashion poster.`;
            } else {
                // General image rule for other categories
                imageInstruction = `5. CRITICAL: Include a professional <image> tag with the exact attribute href="{USER_IMAGE}". Place it beautifully inside a stylish frame, rectangle, or circle mask. Set a proper x, y, width, and height.`;
            }
        } else {
            imageInstruction = `5. No image uploaded. Use beautiful pure vector shapes, geometric patterns, or icons to fill up the canvas beautifully.`;
        }
        // --- END ---

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: "API Key එක නැත." }) };

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const apiPayload = {
            contents: [{
                parts: [{
                    text: `You are an expert Senior Graphic Designer specializing in modern advertising posters. Create a highly professional, stunning commercial marketing banner in RAW SVG format.
                    The SVG must have viewBox="0 0 ${width} ${height}" and width="100%" height="100%".
                    
                    Business Category: ${category}
                    Design Style Guidelines: ${customStyle}
                    User's Goal/Concept: "${prompt}"
                    
                    CRITICAL PROMPT RULES:
                    1. Output MUST ONLY be valid, well-formatted SVG code.
                    2. Do NOT include ANY explanations, markdown blocks like \`\`\`svg, or notes outside the SVG.
                    3. Use beautiful built-in system typography (e.g., Arial, Impact, sans-serif) for readable bold English promotional headings. Keep strings strictly English.
                    4. Use vector paths, gradients, shapes, and badges.
                    ${imageInstruction}`
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
