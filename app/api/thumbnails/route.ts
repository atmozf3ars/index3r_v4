import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import sharp from 'sharp'
import { FileIcon, ImageIcon, VideoIcon, FileAudioIcon, FileTextIcon, FileSpreadsheetIcon, FileIcon as FilePresentationIcon, FolderIcon, FileArchiveIcon, FileCodeIcon, FileEditIcon } from 'lucide-react'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

const THUMBNAIL_CACHE: { [key: string]: Buffer } = {}

async function getThumbnail(filePath: string, thumbnailPath: string): Promise<Buffer | null> {
  console.log(`Checking thumbnail for: ${filePath}`)

  // Check in-memory cache first
  if (THUMBNAIL_CACHE[thumbnailPath]) {
    console.log('Thumbnail found in memory cache')
    return THUMBNAIL_CACHE[thumbnailPath]
  }

  // Check if thumbnail file exists
  try {
    await fs.access(thumbnailPath)
    console.log('Existing thumbnail file found')
    const thumbnailBuffer = await fs.readFile(thumbnailPath)
    THUMBNAIL_CACHE[thumbnailPath] = thumbnailBuffer
    return thumbnailBuffer
  } catch (error) {
    console.log('Thumbnail file not found')
    return null
  }
}

async function saveThumbnail(thumbnailPath: string, thumbnailBuffer: Buffer) {
  await fs.writeFile(thumbnailPath, thumbnailBuffer)
  THUMBNAIL_CACHE[thumbnailPath] = thumbnailBuffer
  console.log('Thumbnail saved to file and memory cache')
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const file = searchParams.get('file')

    if (!file) {
      return NextResponse.json({ error: 'File parameter is required' }, { status: 400 })
    }

    console.log('Requested file:', file)

    const fileDirectory = process.env.FILE_DIRECTORY || 'O:/innercircle-indexer/innercircle'
    const filePath = path.join(fileDirectory, decodeURIComponent(file).replace(/\\/g, '/'))
    const thumbnailPath = path.join(process.cwd(), 'public', 'thumbnails', `${Buffer.from(file).toString('base64')}.jpg`)

    console.log('File path:', filePath)
    console.log('Thumbnail path:', thumbnailPath)

    let thumbnailBuffer = await getThumbnail(filePath, thumbnailPath)

    if (!thumbnailBuffer) {
      console.log('Generating new thumbnail')
      // Create thumbnails directory if it doesn't exist
      const thumbnailDir = path.dirname(thumbnailPath)
      await fs.mkdir(thumbnailDir, { recursive: true })

      const stats = await fs.stat(filePath)

      if (stats.isDirectory()) {
        await generateIconThumbnail(thumbnailPath, FolderIcon)
      } else {
        await generateThumbnail(filePath, thumbnailPath, stats.size)
      }

      thumbnailBuffer = await fs.readFile(thumbnailPath)
      await saveThumbnail(thumbnailPath, thumbnailBuffer)
    }

    console.log('Thumbnail size:', thumbnailBuffer.length, 'bytes')

    if (thumbnailBuffer.length === 0) {
      throw new Error('Generated thumbnail is empty')
    }

    return new NextResponse(thumbnailBuffer, {
      headers: { 'Content-Type': 'image/jpeg' }
    })
  } catch (error) {
    console.error('Error in thumbnail generation:', error)
    return NextResponse.json({ error: 'Failed to generate thumbnail' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { filePath } = await request.json()

    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }

    console.log('Generating thumbnail for:', filePath)

    const fileDirectory = process.env.FILE_DIRECTORY || 'O:/innercircle-indexer/innercircle'
    const fullPath = path.join(fileDirectory, decodeURIComponent(filePath).replace(/\\/g, '/'))
    const thumbnailPath = path.join(process.cwd(), 'public', 'thumbnails', `${Buffer.from(filePath).toString('base64')}.jpg`)

    console.log('Full path:', fullPath)
    console.log('Thumbnail path:', thumbnailPath)

    let thumbnailBuffer = await getThumbnail(fullPath, thumbnailPath)

    if (!thumbnailBuffer) {
      console.log('Generating new thumbnail')
      // Create thumbnails directory if it doesn't exist
      const thumbnailDir = path.dirname(thumbnailPath)
      await fs.mkdir(thumbnailDir, { recursive: true })

      const stats = await fs.stat(fullPath)

      if (stats.isDirectory()) {
        await generateIconThumbnail(thumbnailPath, FolderIcon)
      } else {
        await generateThumbnail(fullPath, thumbnailPath, stats.size)
      }

      thumbnailBuffer = await fs.readFile(thumbnailPath)
      await saveThumbnail(thumbnailPath, thumbnailBuffer)
    }

    console.log('Thumbnail generated successfully')

    return NextResponse.json({ success: true, thumbnailPath: `/thumbnails/${Buffer.from(filePath).toString('base64')}.jpg` })
  } catch (error) {
    console.error('Error in thumbnail generation:', error)
    return NextResponse.json({ error: 'Failed to generate thumbnail' }, { status: 500 })
  }
}

async function generateThumbnail(inputPath: string, outputPath: string, fileSize: number): Promise<void> {
  const ext = path.extname(inputPath).toLowerCase()

  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
    // For image files, create a resized thumbnail
    await sharp(inputPath)
      .resize(320, 240, { fit: 'inside' })
      .jpeg()  // Convert all images to JPEG
      .toFile(outputPath)
  } else if (['.mp4', '.avi', '.mov', '.mkv'].includes(ext)) {
    // For video files, use ffmpeg to generate thumbnail
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .screenshots({
          count: 1,
          folder: path.dirname(outputPath),
          filename: path.basename(outputPath),
          size: '320x240'
        })
        .on('end', resolve)
        .on('error', reject)
    })
  } else if (['.mp3', '.wav', '.ogg', '.flac', '.aac'].includes(ext)) {
    // For audio files, generate a thumbnail with file size
    await generateAudioThumbnail(outputPath, fileSize)
  } else {
    // For all other file types, generate an icon thumbnail
    const icon = getIconForFileType(ext)
    await generateIconThumbnail(outputPath, icon)
  }
}

async function generateAudioThumbnail(outputPath: string, fileSize: number) {
  const formattedSize = formatFileSize(fileSize)
  const svg = await satori({
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
      },
      children: [
        {
          type: FileAudioIcon,
          props: { size: 100 },
        },
        {
          type: 'div',
          props: {
            style: {
              marginTop: '20px',
              fontSize: '24px',
              fontWeight: 'bold',
            },
            children: formattedSize,
          },
        },
      ],
    },
  }, {
    width: 320,
    height: 240,
  })

  const resvg = new Resvg(svg)
  const pngBuffer = resvg.render().asPng()

  await sharp(pngBuffer)
    .jpeg()
    .toFile(outputPath)
}

async function generateIconThumbnail(outputPath: string, Icon: any) {
  const svg = await satori({
    type: 'div',
    props: {
      style: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        background: 'white',
      },
      children: [{
        type: Icon,
        props: { size: 200 },
      }],
    },
  }, {
    width: 320,
    height: 240,
  })

  const resvg = new Resvg(svg)
  const pngBuffer = resvg.render().asPng()

  await sharp(pngBuffer)
    .jpeg()
    .toFile(outputPath)
}

function getIconForFileType(ext: string) {
  switch (ext) {
    case '.jpg':
    case '.jpeg':
    case '.png':
    case '.gif':
    case '.webp':
    case '.bmp':
    case '.tiff':
      return ImageIcon
    case '.mp4':
    case '.avi':
    case '.mov':
    case '.mkv':
    case '.flv':
    case '.wmv':
      return VideoIcon
    case '.mp3':
    case '.wav':
    case '.ogg':
    case '.flac':
    case '.aac':
      return FileAudioIcon
    case '.txt':
    case '.md':
    case '.rtf':
    case '.log':
      return FileTextIcon
    case '.xls':
    case '.xlsx':
    case '.csv':
    case '.ods':
      return FileSpreadsheetIcon
    case '.ppt':
    case '.pptx':
    case '.odp':
      return FilePresentationIcon
    case '.pdf':
      return FileIcon
    case '.zip':
    case '.rar':
    case '.7z':
    case '.tar':
    case '.gz':
      return FileArchiveIcon
    case '.exe':
    case '.msi':
    case '.app':
      return FileCodeIcon
    case '.doc':
    case '.docx':
    case '.odt':
      return FileEditIcon
    default:
      return FileIcon
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB'
  else return (bytes / 1073741824).toFixed(1) + ' GB'
}

