import { Request, Response } from 'express';
import fs from 'node:fs';
import { Readable } from 'node:stream';
import { env } from '../../config/env';
import { cachePathFor, isCached } from '../cache/transcode-cache';
import { acquireTranscodeSlot } from './transcode-limiter';

const BITRATE = 128000;

const inFlight = new Map<string, Promise<void>>();

export async function streamController(req: Request, res: Response) {
  const { itemId } = req.params as { itemId: string };
  const session = req.session!;
  const cacheKey = `${itemId}-${BITRATE}`;

  if (isCached(itemId, BITRATE)) {
    return serveFromCache(itemId, req.headers.range, res);
  }

  try {
    if (inFlight.has(cacheKey)) {
      await inFlight.get(cacheKey);
      return serveFromCache(itemId, req.headers.range, res);
    }

    const job = transcodeAndCache(itemId, session.jellyfinToken);
    inFlight.set(cacheKey, job);
    await job;
    inFlight.delete(cacheKey);

    return serveFromCache(itemId, req.headers.range, res);
  } catch (err) {
    inFlight.delete(cacheKey);
    console.error('Error transcodificando', itemId, err);
    if (!res.headersSent) {
      res.status(502).json({ error: 'No se pudo transcodificar el audio' });
    }
  }
}

function transcodeAndCache(itemId: string, jellyfinToken: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const release = await acquireTranscodeSlot();
    const cachePath = cachePathFor(itemId, BITRATE);
    const tmpPath = `${cachePath}.${process.pid}.${Date.now()}.tmp`;

    try {
      const url = `${env.jellyfinServerUrl}/Audio/${itemId}/stream.aac?audioCodec=aac&audioBitRate=${BITRATE}&api_key=${jellyfinToken}`;
      const jellyfinRes = await fetch(url);

      if (!jellyfinRes.ok || !jellyfinRes.body) {
        throw new Error(`Jellyfin respondió ${jellyfinRes.status}`);
      }

      const fileStream = fs.createWriteStream(tmpPath);
      const nodeStream = Readable.fromWeb(jellyfinRes.body as any);

      nodeStream.pipe(fileStream);

      fileStream.on('finish', () => {
        try {
          if (!fs.existsSync(cachePath)) {
            fs.renameSync(tmpPath, cachePath);
          } else {
            fs.unlink(tmpPath, () => {});
          }
        } catch {
          fs.unlink(tmpPath, () => {});
        }
        release();
        resolve();
      });

      nodeStream.on('error', (err) => {
        fileStream.destroy();
        fs.unlink(tmpPath, () => {});
        release();
        reject(err);
      });
    } catch (err) {
      fs.unlink(tmpPath, () => {});
      release();
      reject(err);
    }
  });
}

function serveFromCache(itemId: string, range: string | undefined, res: Response) {
  const filePath = cachePathFor(itemId, BITRATE);
  const stat = fs.statSync(filePath);

  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Type', 'audio/mp4');

  if (!range) {
    res.setHeader('Content-Length', stat.size);
    return fs.createReadStream(filePath).pipe(res);
  }

  const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
  const start = parseInt(startStr, 10);
  const end = endStr ? parseInt(endStr, 10) : stat.size - 1;

  res.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${stat.size}`,
    'Content-Length': end - start + 1,
  });

  fs.createReadStream(filePath, { start, end }).pipe(res);
}