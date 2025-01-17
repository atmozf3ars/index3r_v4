import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const BASE_PATH = 'O:/innercircle-indexer/innercircle/'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const filePath = searchParams.get('file')

  if (!filePath) {
    return NextResponse.json({ error: 'No file specified' }, { status: 400 })
  }

  const fullPath = path.join(BASE_PATH, filePath)

  // Check if the file exists
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`)
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  const stat = fs.statSync(fullPath)

  const fileSize = stat.size
  const range = request.headers.get('range')

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-")
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
    const chunksize = (end - start) + 1
    const file = fs.createReadStream(fullPath, { start, end })
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'application/octet-stream',
    }
    return new NextResponse(file as any, { status: 206, headers: head as any })
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'application/octet-stream',
    }
    const file = fs.createReadStream(fullPath)
    return new NextResponse(file as any, { headers: head as any })
  }
}

export async function calculateHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => {
      hash.update(data);
    });

    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });

    stream.on('error', (error) => {
      reject(error);
    });
  });
}