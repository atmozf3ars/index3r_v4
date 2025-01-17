import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

const PUBLIC_DIRECTORY_LINKS_FILE = path.join(process.cwd(), 'public-directory-links.json')
const BASE_PATH = process.env.FILE_DIRECTORY || 'O:/innercircle-indexer/innercircle/'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params

  try {
    // Read public directory links
    const data = await fs.readFile(PUBLIC_DIRECTORY_LINKS_FILE, 'utf-8')
    const publicDirectoryLinks = JSON.parse(data)

    // Find the link with the given ID
    const link = publicDirectoryLinks.find((link: any) => link.id === id)

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    const folderName = path.basename(link.directoryPath);

    const directoryPath = path.join(BASE_PATH, link.directoryPath)

    // Read directory contents
    const entries = await fs.readdir(directoryPath, { withFileTypes: true })

    // Filter and map files
    const files = await Promise.all(
      entries
        .filter(entry => !entry.isDirectory())
        .map(async entry => {
          const filePath = path.join(link.directoryPath, entry.name)
          const stats = await fs.stat(path.join(directoryPath, entry.name))
          const fileType = getFileType(entry.name)
          return {
            name: entry.name,
            path: filePath,
            size: stats.size,
            type: fileType,
            dateAdded: stats.birthtime.toISOString()
          }
        })
    )

    return NextResponse.json({ files, folderName })
  } catch (error) {
    console.error('Error fetching media gallery files:', error)
    return NextResponse.json({ error: 'Failed to fetch media gallery files' }, { status: 500 })
  }
}

function getFileType(fileName: string): string {
  const extension = path.extname(fileName).toLowerCase()
  if (['.mp3', '.wav', '.ogg', '.flac'].includes(extension)) {
    return 'audio'
  } else if (['.mp4', '.webm', '.avi', '.mov', '.mkv'].includes(extension)) {
    return 'video'
  } else {
    return 'other'
  }
}

