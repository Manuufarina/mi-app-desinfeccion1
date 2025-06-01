// IMPORTANTE: Reemplaza "" con tu API Key real de Gemini
const GEMINI_API_KEY = ""; // <--- REEMPLAZA ESTO CON TU API KEY

export async function callGeminiAPI(promptText) {
    if (!GEMINI_API_KEY) {
        console.warn("API Key de Gemini no configurada. La llamada a la IA no se realizará.");
        // Podrías devolver un mensaje por defecto o lanzar un error específico
        // para que la UI lo maneje, en lugar de que la app falle silenciosamente.
        return "Función de IA no disponible (API Key no configurada).";
    }
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const payload = { contents: [{ role: "user", parts: [{ text: promptText }] }] };
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Error en API Gemini:", response.status, errorBody);
            throw new Error(`Error de la API de Gemini: ${response.status}. ${errorBody}`);
        }
        const result = await response.json();
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            return result.candidates[0].content.parts[0].text;
        } else {
            console.error("Respuesta inesperada de Gemini:", result);
            throw new Error("Respuesta inesperada o vacía de la API de Gemini.");
        }
    } catch (error) {
        console.error("Error llamando a Gemini API:", error);
        throw error;
    }
}
