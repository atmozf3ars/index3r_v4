import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const fileName = `background-${Date.now()}${path.extname(file.name)}`
    const backgroundsDir = path.join(process.cwd(), 'public', 'backgrounds')
    const filePath = path.join(backgroundsDir, fileName)

    // Ensure the backgrounds directory exists
    await fs.mkdir(backgroundsDir, { recursive: true })

    await fs.writeFile(filePath, Buffer.from(buffer))

    return NextResponse.json({ success: true, backgroundPath: `/backgrounds/${fileName}` })
  } catch (error) {
    console.error('Error uploading background:', error)
    return NextResponse.json({ error: 'Failed to upload background' }, { status: 500 })
  }
}

