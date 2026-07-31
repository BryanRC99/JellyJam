import { Request, Response } from 'express';
import { getOrCreateVoiceAudio } from './dj.service';

export async function testVoiceController(
  req: Request,
  res: Response
) {
  const { text } = req.body ?? {};

  if (
    typeof text !== 'string' ||
    !text.trim()
  ) {
    return res.status(400).json({
      error: 'El campo "text" es requerido',
    });
  }

  try {
    const audio = await getOrCreateVoiceAudio(
      text.trim()
    );

    res.setHeader(
      'Content-Type',
      'audio/mpeg'
    );

    res.setHeader(
      'Content-Length',
      audio.length
    );

    return res.send(audio);
  } catch (err: unknown) {
    console.error(
      'Error generando voz del DJ',
      err
    );

    const message =
      err instanceof Error
        ? err.message
        : 'No se pudo generar el audio';

    return res.status(502).json({
      error: message,
    });
  }
}
