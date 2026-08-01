import crypto from 'node:crypto';
import { DjBlock } from './dj-blocks.types';

const BLOCK_TTL_MS = 30 * 60 * 1000; // 30 minutos

const blocks = new Map<string, DjBlock>();

function generateBlockId(): string {
  return crypto.randomBytes(8).toString('hex');
}

export function saveBlock(data: Omit<DjBlock, 'id' | 'createdAt'>): DjBlock {
  const id = generateBlockId();
  const block: DjBlock = { ...data, id, createdAt: Date.now() };
  blocks.set(id, block);
  return block;
}

export function getBlock(id: string): DjBlock | undefined {
  const block = blocks.get(id);
  if (block && Date.now() - block.createdAt > BLOCK_TTL_MS) {
    blocks.delete(id);
    return undefined;
  }
  return block;
}

// Limpieza periódica para no acumular audio en memoria indefinidamente
setInterval(() => {
  const now = Date.now();
  for (const [id, block] of blocks) {
    if (now - block.createdAt > BLOCK_TTL_MS) blocks.delete(id);
  }
}, 5 * 60 * 1000).unref();