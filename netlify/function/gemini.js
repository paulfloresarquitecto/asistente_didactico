// Este código se ejecuta en el servidor de Netlify, no en el navegador.

exports.handler = async function (event, context) {
    // 1. Validar que la petición sea correcta (solo aceptamos POST)
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Método no permitido' }),
        };
    }

    try {
        // 2. Extraer los datos que nos envía el frontend
        const { prompt, inlineData } = JSON.parse(event.body);
        if (!prompt) {
             return { statusCode: 400, body: JSON.stringify({ error: 'El prompt es requerido' }) };
        }

        // 3. Obtener la API Key de forma segura desde las variables de entorno de Netlify
        const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
        if (!GOOGLE_API_KEY) {
            return { statusCode: 500, body: JSON.stringify({ error: 'La API Key no está configurada en el servidor' }) };
        }
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GOOGLE_API_KEY}`;
        
        // 4. Preparar la llamada a la API de Google
        const parts = [{ text: prompt }];
        if (inlineData) {
            parts.push({ inlineData: { mimeType: inlineData.mimeType, data: inlineData.data } });
        }
        const payload = { contents: [{ parts }] };

        // 5. Realizar la llamada a la API de Google
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const result = await response.json();
        
        if (!response.ok) {
            console.error('Error de la API de Google:', result);
            const errorMessage = result.error?.message || `Error en la API de Google: ${response.status}`;
            return { statusCode: response.status, body: JSON.stringify({ error: errorMessage }) };
        }
        
        const textContent = result.candidates?.[0]?.content?.parts?.[0]?.text;

        // 6. Enviar la respuesta de vuelta al frontend
        return {
            statusCode: 200,
            body: JSON.stringify({ text: textContent }),
        };

    } catch (error) {
        console.error('Error en la función de backend:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Ocurrió un error interno en el servidor.' }),
        };
    }
};
