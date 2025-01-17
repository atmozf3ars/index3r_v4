import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const BASE_PATH = process.env.FILE_DIRECTORY || 'O:/innercircle-indexer/innercircle/'
const USER_DIRECTORIES_FILE = path.join(process.cwd(), 'user-directories.json')

export async function POST(request: NextRequest) {
  try {
    const { path: relativePath, folderName } = await request.json()

    if (!relativePath || !folderName) {
      return NextResponse.json({ error: 'Missing path or folder name' }, { status: 400 })
    }

    console.log('Received request to create folder:', { relativePath, folderName });

    const normalizedBasePath = path.normalize(BASE_PATH)
    const fullPath = path.join(normalizedBasePath, relativePath, folderName)

    console.log('Normalized BASE_PATH:', normalizedBasePath);
    console.log('Full path for new folder:', fullPath);

    // Security check to prevent directory traversal
    if (!fullPath.startsWith(normalizedBasePath)) {
      console.log('Security check failed. Access denied.');
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    await fs.mkdir(fullPath, { recursive: true })

    // Generate a unique ID for the user-generated folder
    const folderId = uuidv4()

    // Read existing user directories or create an empty array if the file doesn't exist
    let userDirectories = []
    try {
      const data = await fs.readFile(USER_DIRECTORIES_FILE, 'utf-8')
      userDirectories = JSON.parse(data)
    } catch (error) {
      // If the file doesn't exist or can't be parsed, we'll start with an empty array
      console.log('No existing user-directories.json found or error parsing it. Starting with empty array.')
    }

    // Add the new folder to the user directories
    userDirectories.push({
      id: folderId,
      path: path.relative(normalizedBasePath, fullPath),
      createdAt: new Date().toISOString()
    })

    // Save the updated user directories
    await fs.writeFile(USER_DIRECTORIES_FILE, JSON.stringify(userDirectories, null, 2))

    console.log('Folder created successfully:', fullPath);
    return NextResponse.json({ message: 'Folder created successfully', folderId })
  } catch (error) {
    console.error('Error details:', error);
    console.error('Error creating folder:', error)
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })
  }
}

