import path from 'path'
import fs from 'fs/promises'

const PUBLIC_LINKS_FILE = path.join(process.cwd(), 'public-links.json')

export async function getFileInfo(id: string) {
  try {
    const data = await fs.readFile(PUBLIC_LINKS_FILE, 'utf-8')
    const publicLinks = JSON.parse(data)
    const link = publicLinks.find((link: any) => link.id === id)

    if (!link) {
      return null
    }

    const isMP4 = link.fileName.toLowerCase().endsWith('.mp4')
    const thumbnailUrl = isMP4 ? `/api/thumbnails?file=${encodeURIComponent(link.filePath)}` : ''

    return {
      filePath: link.filePath,
      fileName: link.fileName,
      isMP4,
      thumbnailUrl
    }
  } catch (error) {
    console.error('Error fetching file info:', error)
    return null
  }
}

