// netlify/functions/gemini.js

exports.handler = async (event) => {
    // 1. Validar que sea un método POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Método no permitido' }),
        };
    }

    try {
        // 2. Extraer datos del cuerpo de la petición
        const { prompt, inlineData } = JSON.parse(event.body);
        const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

        // 3. Validar que la clave de API exista en las variables de entorno de Netlify
        if (!GOOGLE_API_KEY) {
            console.error("Error: La variable de entorno GOOGLE_API_KEY no está configurada en Netlify.");
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'La clave de API no está configurada en el servidor.' }),
            };
        }
        
        // 4. Construir la petición a la API de Google
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GOOGLE_API_KEY}`;
        const parts = [{ text: prompt }];
        if(inlineData) {
            parts.push({ inlineData: inlineData });
        }
        const payload = { contents: [{ parts: parts }] };

        // 5. Llamar a la API de Google usando el fetch nativo
        const googleResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        
        const googleResult = await googleResponse.json();

        // 6. Manejar errores de la API de Google
        if (!googleResponse.ok) {
            console.error('Error de la API de Google:', googleResult);
            return {
                statusCode: googleResponse.status,
                body: JSON.stringify({ error: googleResult.error?.message || 'Error al contactar la API de Google.' }),
            };
        }

        // 7. Enviar la respuesta exitosa de vuelta al frontend
        const textContent = googleResult.candidates?.[0]?.content?.parts?.[0]?.text;
        
        return {
            statusCode: 200,
            body: JSON.stringify({ text: textContent }),
        };

    } catch (error) {
        // 8. Capturar cualquier otro error inesperado
        console.error('Error en la función de Netlify:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Ocurrió un error interno en el servidor.' }),
        };
    }
};

