import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs/promises'

const PUBLIC_LINKS_FILE = path.join(process.cwd(), 'public-links.json')
const BASE_PATH = process.env.FILE_DIRECTORY || 'O:/innercircle-indexer/innercircle/'

export async function POST(request: NextRequest) {
  try {
    const { filePath, fileName, isDirectory } = await request.json()

    // Ensure the file or directory exists
    const fullPath = path.join(BASE_PATH, filePath)
    await fs.access(fullPath)

    // Generate a unique ID for the public link
    const linkId = uuidv4()

    // Create a public link object
    const publicLink = {
      id: linkId,
      filePath,
      fileName,
      isDirectory,
      createdAt: new Date().toISOString(),
    }

    // Read existing public links
    let publicLinks = []
    try {
      const data = await fs.readFile(PUBLIC_LINKS_FILE, 'utf-8')
      publicLinks = JSON.parse(data)
    } catch (error) {
      // If the file doesn't exist, we'll create it
    }

    // Add the new public link
    publicLinks.push(publicLink)

    // Save the updated public links
    await fs.writeFile(PUBLIC_LINKS_FILE, JSON.stringify(publicLinks, null, 2))

    // Generate the public download URL
    const publicDownloadUrl = isDirectory
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/media-gallery/${linkId}`
      : `${process.env.NEXT_PUBLIC_BASE_URL}/download/${linkId}`

    return NextResponse.json({ publicLink: publicDownloadUrl })
  } catch (error) {
    console.error('Error creating public link:', error)
    return NextResponse.json({ error: 'Failed to create public link' }, { status: 500 })
  }
}

