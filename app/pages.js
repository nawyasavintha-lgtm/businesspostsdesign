'use client';
import { useState } from 'react';

export default function Home() {
const [category, setCategory] = useState('clothing');
const [ratio, setRatio] = useState('1:1');
const [prompt, setPrompt] = useState('');
const [svgOutput, setSvgOutput] = useState('');
const [loading, setLoading] = useState(false);

const handleGenerate = async () => {
if (!prompt) return alert("කරුණාකර පෝස්ට් එකේ වෙන්න ඕන දේ ලියන්න!");
setLoading(true);
setSvgOutput('');

try {
const res = await fetch('/api/generate', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ category, ratio, prompt })
});
const data = await res.json();
if (data.svg) {
setSvgOutput(data.svg);
} else {
alert(data.error || "දෝෂයක් සිදු විය.");
}
} catch (err) {
alert("API සම්බන්ධතාවයේ ගැටලුවක්.");
}
setLoading(false);
};

const handleDownload = () => {
const svgElement = document.getElementById('previewContainer').querySelector('svg');
if (!svgElement) return;

const svgString = new XMLSerializer().serializeToString(svgElement);
const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
const blobURL = URL.createObjectURL(svgBlob);

const image = new Image();
image.onload = () => {
let width = 1080; let height = 1080;
if (ratio === '9:16') { width = 1080; height = 1920; }
if (ratio === '16:9') { width = 1920; height = 1080; }
if (ratio === '4:5') { width = 1080; height = 1350; }

const canvas = document.getElementById('downloadCanvas');
canvas.width = width;
canvas.height = height;
const context = canvas.getContext("2d");
context.drawImage(image, 0, 0, width, height);

const pngURL = canvas.toDataURL("image/png");
const downloadLink = document.createElement("a");
downloadLink.href = pngURL;
downloadLink.download = `LankaAI_${category}_${ratio}.png`;
document.body.appendChild(downloadLink);
downloadLink.click();
document.body.removeChild(downloadLink);
URL.revokeObjectURL(blobURL);
};
image.src = blobURL;
};

return (
<div className="bg-gray-50 min-h-screen font-sans flex flex-col justify-between">
<header class="bg-slate-900 text-white py-6 text-center shadow-sm">
<h1 class="text-2xl font-bold text-amber-400">Lanka AI Design Agent</h1>
<p class="text-xs text-slate-400 mt-1">Gemini AI මඟින් ක්‍රියාත්මක වන ප්‍රබල ඩිසයින් සිස්ටම් එක</p>
</header>

<main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8 w-full flex-grow">
<div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
<div className="space-y-6">
<div>
<label className="block text-sm font-semibold text-gray-700 mb-2">1. බිස්නස් වර්ගය තෝරන්න:</label>
<div className="grid grid-cols-2 gap-2">
{[['clothing', '👕 Clothing'], ['cake', '🎂 Cake & Bakery'], ['rent', '🚗 Rent & Taxi'], ['tourism', '🌴 Tourism & Safari']].map(([id, label]) => (
<button key={id} onClick={() => setCategory(id)} className={`p-3 text-left border rounded-xl text-xs font-medium transition ${category === id ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold' : 'border-gray-200 hover:bg-gray-50'}`}>{label}</button>
))}
</div>
</div>

<div>
<label className="block text-sm font-semibold text-gray-700 mb-2">2. පෝස්ට් එකේ ප්‍රමාණය (Ratio):</label>
<div className="grid grid-cols-4 gap-2">
{['1:1', '9:16', '16:9', '4:5'].map((r) => (
<button key={r} onClick={() => setRatio(r)} className={`p-2 border rounded-xl text-xs font-bold transition ${ratio === r ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}>{r}</button>
))}
</div>
</div>

<div>
<label className="block text-sm font-semibold text-gray-700 mb-2">3. ඔබට අවශ්‍ය දේ ලියන්න (Prompt):</label>
<textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows="4" placeholder="උදා: Muru Safari එකට සිංහල අවුරුදු නිවාඩුවට යාල සෆාරි යන්න එන්න කියන පෝස්ට් එකක්..." className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"></textarea>
</div>
</div>

<button onClick={handleGenerate} disabled={loading} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 rounded-xl shadow-md transition text-sm">
{loading ? '⏳ AI මොඩලය මඟින් ඇත්තම Design එකක් සාදමින් පවතී...' : '✨ Real AI Design එක සාදන්න'}
</button>
</div>

<div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between items-center min-h-[400px]">
<h3 className="text-sm font-semibold text-gray-700 self-start mb-4">Live AI Preview:</h3>

<div id="previewContainer" className={`w-full max-w-[300px] bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden p-2 shadow-inner transition-all
${ratio === '1:1' ? 'aspect-square' : ''}
${ratio === '9:16' ? 'aspect-[9/16]' : ''}
${ratio === '16:9' ? 'aspect-[16/9]' : ''}
${ratio === '4:5' ? 'aspect-[4/5]' : ''}
`}>
{svgOutput ? (
<div className="w-full h-full flex items-center justify-center" dangerouslySetInnerHTML={{ __html: svgOutput }} />
) : (
<p className="text-gray-400 text-xs text-center px-6">විස්තර ඇතුළත් කර බටන් එක ඔබන්න.</p>
)}
</div>

{svgOutput && (
<button onClick={handleDownload} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl shadow-sm transition text-sm">
📥 Post එක High Quality Image (.png) එකක් ලෙස බාගත කරගන්න
</button>
)}
</div>
</main>
<canvas id="downloadCanvas" className="hidden"></canvas>
<footer class="bg-slate-900 text-slate-500 text-center py-4 text-xs border-t border-slate-800">
&copy; 2026 Lanka AI Design Agent. Powered by Gemini API.
</footer>
</div>
);
}
