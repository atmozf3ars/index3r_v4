import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { writeFile } from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

const BASE_PATH = process.env.FILE_DIRECTORY || 'O:/innercircle-indexer/innercircle/'
const USER_FILES_JSON = path.join(process.cwd(), 'user-files.json')

export const config = {
  api: {
    bodyParser: false
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const relativePath = formData.get('path') as string

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })
    }

    const uploadPath = path.join(BASE_PATH, relativePath).replace(/\\/g, '/')

    // Security check to prevent directory traversal
    if (!uploadPath.startsWith(BASE_PATH.replace(/\\/g, '/'))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Ensure the upload directory exists
    await fs.mkdir(uploadPath, { recursive: true })

    const uploadedFiles = []
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const filePath = path.join(uploadPath, file.name).replace(/\\/g, '/')
      await writeFile(filePath, buffer)
      uploadedFiles.push(file.name)

      // Log the uploaded file
      await logUserFile(relativePath, file.name)
    }

    return NextResponse.json({
      success: true,
      message: `${files.length} file(s) uploaded successfully`,
      files: uploadedFiles
    })
  } catch (error) {
    console.error('Error uploading files:', error)
    return NextResponse.json({
      error: 'Failed to upload files',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function logUserFile(relativePath: string, fileName: string) {
  try {
    let userFiles = []
    try {
      const data = await fs.readFile(USER_FILES_JSON, 'utf-8')
      userFiles = JSON.parse(data)
    } catch (error) {
      // If the file doesn't exist or can't be parsed, we'll start with an empty array
      console.log('No existing user-files.json found or error parsing it. Starting with empty array.')
    }

    userFiles.push({
      id: uuidv4(),
      path: path.join(relativePath, fileName).replace(/\\/g, '/'),
      createdAt: new Date().toISOString()
    })

    await fs.writeFile(USER_FILES_JSON, JSON.stringify(userFiles, null, 2))
  } catch (error) {
    console.error('Error logging user file:', error)
  }
}

