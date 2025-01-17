import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { Readable } from 'stream'

const PUBLIC_LINKS_FILE = path.join(process.cwd(), 'public-links.json')
const BASE_PATH = process.env.FILE_DIRECTORY || 'O:/innercircle-indexer/innercircle/'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const searchParams = request.nextUrl.searchParams
  const download = searchParams.get('download') === 'true'

  try {
    // Read public links
    const data = await fs.promises.readFile(PUBLIC_LINKS_FILE, 'utf-8')
    const publicLinks = JSON.parse(data)

    // Find the link with the given ID
    const link = publicLinks.find((link: any) => link.id === id)

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    const filePath = path.join(BASE_PATH, link.filePath)

    // Check if the file exists
    try {
      await fs.promises.access(filePath)
    } catch (error) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const stat = await fs.promises.stat(filePath)
    const fileSize = stat.size

    const range = request.headers.get('range')

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-")
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
      const chunksize = (end - start) + 1
      const file = fs.createReadStream(filePath, { start, end })
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': getContentType(link.fileName),
      }
      return new NextResponse(file as any, { status: 206, headers: head as any })
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': getContentType(link.fileName),
      }
      if (download) {
        head['Content-Disposition'] = `attachment; filename="${link.fileName}"`
      }
      const file = fs.createReadStream(filePath)
      return new NextResponse(file as any, { headers: head as any })
    }
  } catch (error) {
    console.error('Error handling public download:', error)
    return NextResponse.json({ error: 'Failed to process download' }, { status: 500 })
  }
}

function getContentType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase()
  switch (ext) {
    case '.mp4':
      return 'video/mp4'
    case '.mp3':
      return 'audio/mpeg'
    case '.wav':
      return 'audio/wav'
    case '.pdf':
      return 'application/pdf'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    default:
      return 'application/octet-stream'
  }
}

