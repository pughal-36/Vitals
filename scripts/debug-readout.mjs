const res = await fetch("http://localhost:3000/readout/7ad15c9e-92c3-425e-a620-b6bc78351b9f");
const html = await res.text();
const scriptMatches = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m => m[1]);
console.log("Scripts loaded on readout (" + scriptMatches.length + "):");
scriptMatches.forEach(s => console.log(" - " + s));
