import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

interface FileInfo {
  name: string;
  isDirectory: boolean;
  size: number;
  lastModified: string;
  path: string;
  hash?: string;
}

const hashCache = new Map<string, { hash: string, lastModified: string }>();

export async function calculateFileHash(filePath: string): Promise<string> {
  const fileBuffer = await fs.readFile(filePath);
  const hashSum = createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

export async function getCachedFileHash(filePath: string, stats: fs.Stats): Promise<string> {
  const cachedInfo = hashCache.get(filePath);
  
  if (cachedInfo && cachedInfo.lastModified === stats.mtime.toISOString()) {
    return cachedInfo.hash;
  }

  const hash = await calculateFileHash(filePath);
  hashCache.set(filePath, { hash, lastModified: stats.mtime.toISOString() });
  return hash;
}

export async function getFileInfo(filePath: string, rootDir: string): Promise<FileInfo> {
  const stats = await fs.stat(filePath);
  const relativePath = path.relative(rootDir, filePath);
  
  const fileInfo: FileInfo = {
    name: path.basename(filePath),
    isDirectory: stats.isDirectory(),
    size: stats.size,
    lastModified: stats.mtime.toISOString(),
    path: relativePath,
  };

  if (!fileInfo.isDirectory) {
    fileInfo.hash = await getCachedFileHash(filePath, stats);
  }

  return fileInfo;
}

export async function listFiles(dir: string, rootDir: string): Promise<FileInfo[]> {
  console.log('Listing files in directory:', dir);
  const files = await fs.readdir(dir);
  console.log('Files found:', files);
  const fileInfoPromises = files.map(async (file) => {
    const filePath = path.join(dir, file);
    return getFileInfo(filePath, rootDir);
  });
  return Promise.all(fileInfoPromises);
}