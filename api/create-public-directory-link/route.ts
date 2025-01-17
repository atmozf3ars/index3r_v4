import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs/promises'

const PUBLIC_DIRECTORY_LINKS_FILE = path.join(process.cwd(), 'public-directory-links.json')
const BASE_PATH = process.env.FILE_DIRECTORY || 'O:/innercircle-indexer/innercircle/'

export async function POST(request: NextRequest) {
  try {
    const { directoryPath } = await request.json()

    // Ensure the directory exists
    const fullPath = path.join(BASE_PATH, directoryPath)
    await fs.access(fullPath)

    // Generate a unique ID for the public link
    const linkId = uuidv4()

    // Create a public directory link object
    const publicDirectoryLink = {
      id: linkId,
      directoryPath,
      createdAt: new Date().toISOString(),
    }

    // Read existing public directory links
    let publicDirectoryLinks = []
    try {
      const data = await fs.readFile(PUBLIC_DIRECTORY_LINKS_FILE, 'utf-8')
      publicDirectoryLinks = JSON.parse(data)
    } catch (error) {
      // If the file doesn't exist, we'll create it
      console.error('Error reading public directory links file:', error)
    }

    // Add the new public directory link
    publicDirectoryLinks.push(publicDirectoryLink)

    // Save the updated public directory links
    await fs.writeFile(PUBLIC_DIRECTORY_LINKS_FILE, JSON.stringify(publicDirectoryLinks, null, 2))

    // Generate the public directory URL
    const publicDirectoryUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/media-gallery/${linkId}`

    return NextResponse.json({ publicDirectoryLink: publicDirectoryUrl })
  } catch (error) {
    console.error('Error creating public directory link:', error)
    return NextResponse.json({ error: 'Failed to create public directory link' }, { status: 500 })
  }
}

