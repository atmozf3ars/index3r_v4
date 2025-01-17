import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const filePath = formData.get('filePath') as string

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const fileName = `${path.basename(filePath)}.jpg`
    const thumbnailPath = path.join(process.cwd(), 'public', 'thumbnails', fileName)

    await writeFile(thumbnailPath, Buffer.from(buffer))

    return NextResponse.json({ success: true, thumbnailPath: `/thumbnails/${fileName}` })
  } catch (error) {
    console.error('Error uploading thumbnail:', error)
    return NextResponse.json({ error: 'Failed to upload thumbnail' }, { status: 500 })
  }
}

