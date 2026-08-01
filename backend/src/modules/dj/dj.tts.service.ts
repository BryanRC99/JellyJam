import { env } from '../../config/env';

const DEFAULT_VOICE_NAME = 'es-MX-Valeria:MAI-Voice-2';

let cachedToken: {
  value: string;
  expiresAt: number;
} | null = null;

/**
 * Obtiene y almacena temporalmente el token de Azure Speech.
 */

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`Azure Speech no respondió en ${timeoutMs / 1000}s (posible problema de red o región mal configurada)`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

async function getAccessToken(): Promise<string> {
  const now = Date.now();

  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.value;
  }

  const res = await fetchWithTimeout(
    `https://${env.azureSpeechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': env.azureSpeechKey,
        'Content-Length': '0',
      },
    }
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => '');

    throw new Error(
      `No se pudo obtener token de Azure Speech (${res.status}): ${detail}`
    );
  }

  const token = await res.text();

  cachedToken = {
    value: token,
    // Azure Speech entrega tokens con una duración aproximada
    // de 10 minutos. Renovamos un poco antes.
    expiresAt: now + 9 * 60 * 1000,
  };

  return token;
}

/**
 * Escapa caracteres especiales para evitar
 * que el texto rompa el SSML.
 */
function escapeSsml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Limpieza mínima del texto.
 *
 * No modifica:
 * - tildes
 * - signos de puntuación
 * - palabras
 * - mayúsculas/minúsculas
 *
 * Solamente normaliza espacios innecesarios.
 */
function normalizeText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?;:])/g, '$1');
}

/**
 * Corrige la pronunciación de la marca JellyJam.
 *
 * Azure recibe:
 *
 * JellyJam -> Yeli Yam
 *
 * El resto del texto se mantiene exactamente
 * como fue escrito.
 */
function prepareDjScript(text: string): string {
  const normalizedText = normalizeText(text);
  const escapedText = escapeSsml(normalizedText);

  return escapedText.replace(
    /JellyJam/gi,
    '<sub alias="Yeli Yam">JellyJam</sub>'
  );
}

/**
 * Construye el SSML mínimo posible.
 *
 * No utilizamos:
 * - mstts:express-as
 * - prosody
 * - break
 * - rate
 * - pitch
 * - volume
 * - style
 * - styleDegree
 *
 * Dejamos que MAI-Voice-2 controle naturalmente:
 * - ritmo
 * - entonación
 * - pausas
 * - energía
 * - expresividad
 */
function buildSsml(
  text: string,
  voiceName: string = DEFAULT_VOICE_NAME
): string {
  const formattedScript = prepareDjScript(text);

  if (!formattedScript) {
    throw new Error(
      'El texto no contiene contenido válido para sintetizar'
    );
  }

  return `<speak version="1.0"
    xmlns="http://www.w3.org/2001/10/synthesis"
    xml:lang="es-MX">
    <voice name="${voiceName}">
      ${formattedScript}
    </voice>
  </speak>`;
}

/**
 * Sintetiza texto utilizando Azure MAI-Voice-2.
 */
export async function synthesizeSpeech(
  text: string,
  voiceName: string = DEFAULT_VOICE_NAME
): Promise<Buffer> {
  if (!env.azureSpeechKey || !env.azureSpeechRegion) {
    throw new Error(
      'Azure Speech no está configurado (faltan AZURE_SPEECH_KEY / AZURE_SPEECH_REGION)'
    );
  }

  if (!text.trim()) {
    throw new Error(
      'El texto para sintetizar está vacío'
    );
  }

  const token = await getAccessToken();

  const userAgent =
    env.clientName?.trim() ||
    'JellyJam-DJ-Backend';

  const res = await fetchWithTimeout(
    `https://${env.azureSpeechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-160kbitrate-mono-mp3',
        'User-Agent': userAgent,
      },
      body: buildSsml(text, voiceName),
    },
    20000
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => '');

    throw new Error(
      `Azure Speech respondió ${res.status}: ${detail}`
    );
  }

  const arrayBuffer = await res.arrayBuffer();

  return Buffer.from(arrayBuffer);
}
