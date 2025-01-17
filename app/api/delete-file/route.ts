import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const BASE_PATH = process.env.FILE_DIRECTORY || 'O:/innercircle-indexer/innercircle/'
const USER_DIRECTORIES_FILE = path.join(process.cwd(), 'user-directories.json')
const USER_FILES_JSON = path.join(process.cwd(), 'user-files.json')

const isUserGeneratedOrContainsUserGenerated = (targetPath: string, userDirectories: any[]) => {
  const normalizedTargetPath = targetPath.replace(/\\/g, '/');
  return userDirectories.some(dir => {
    const normalizedDirPath = dir.path.replace(/\\/g, '/');
    return normalizedDirPath === normalizedTargetPath || normalizedDirPath.startsWith(normalizedTargetPath + '/');
  });
};

const isUserAddedFile = (targetPath: string, userFiles: any[]) => {
  const normalizedTargetPath = targetPath.replace(/\\/g, '/');
  return userFiles.some(file => file.path === normalizedTargetPath);
};

export async function POST(request: NextRequest) {
  try {
    const { filePath, currentDirectory } = await request.json()

    if (!filePath || !currentDirectory) {
      return NextResponse.json({ error: 'Missing file path or current directory' }, { status: 400 })
    }

    console.log('Received file path for deletion:', filePath);
    console.log('Current directory:', currentDirectory);

    const normalizedBasePath = path.normalize(BASE_PATH).replace(/\\/g, '/')
    const normalizedFilePath = path.normalize(filePath).replace(/\\/g, '/')
    const normalizedCurrentDirectory = path.normalize(currentDirectory).replace(/\\/g, '/')
    const fullPath = path.join(normalizedBasePath, normalizedFilePath).replace(/\\/g, '/')

    console.log('Normalized paths:');
    console.log('Base path:', normalizedBasePath);
    console.log('Full path for deletion:', fullPath);
    console.log('Current directory:', normalizedCurrentDirectory);

    // Security check to prevent directory traversal
    if (!fullPath.startsWith(normalizedBasePath)) {
      console.error('Attempted to delete content outside of base path:', fullPath);
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 })
    }

    // Check if trying to delete current directory
    if (fullPath === path.join(normalizedBasePath, normalizedCurrentDirectory).replace(/\\/g, '/')) {
      console.error('Attempted to delete current directory:', fullPath);
      return NextResponse.json({ error: 'Cannot delete current directory.' }, { status: 403 })
    }

    const fileExists = await fs.stat(fullPath).then(() => true).catch(() => false)
    if (!fileExists) {
      console.error('File or directory not found:', fullPath);
      return NextResponse.json({ error: 'File or directory not found' }, { status: 404 })
    }

    // Check if it's a directory and if it's user-generated or contains user-generated content
    const isDirectory = (await fs.stat(fullPath)).isDirectory()
    if (isDirectory) {
      // Read user directories
      let userDirectories = []
      try {
        const data = await fs.readFile(USER_DIRECTORIES_FILE, 'utf-8')
        userDirectories = JSON.parse(data)
      } catch (error) {
        console.error('Error reading user-directories.json:', error);
        return NextResponse.json({ error: 'Error verifying user-generated content' }, { status: 500 })
      }

      const relativePath = path.relative(normalizedBasePath, fullPath).replace(/\\/g, '/')
      console.log('Checking relative path:', relativePath);

      if (!isUserGeneratedOrContainsUserGenerated(relativePath, userDirectories)) {
        console.error('Attempted to delete non-user-generated directory:', fullPath);
        return NextResponse.json({ error: 'Access denied. Can only delete user-generated content.' }, { status: 403 })
      }

      // Remove the directory and its children from user-directories.json
      const updatedDirectories = userDirectories.filter(dir => {
        const normalizedDirPath = dir.path.replace(/\\/g, '/');
        return normalizedDirPath !== relativePath && !normalizedDirPath.startsWith(relativePath + '/');
      });
      await fs.writeFile(USER_DIRECTORIES_FILE, JSON.stringify(updatedDirectories, null, 2))
    } else {
      // Check if it's a user-added file
      let userFiles = []
      try {
        const data = await fs.readFile(USER_FILES_JSON, 'utf-8')
        userFiles = JSON.parse(data)
      } catch (error) {
        console.error('Error reading user-files.json:', error);
        return NextResponse.json({ error: 'Error verifying user-added file' }, { status: 500 })
      }

      const relativePath = path.relative(normalizedBasePath, fullPath).replace(/\\/g, '/')
      if (!isUserAddedFile(relativePath, userFiles)) {
        console.error('Attempted to delete non-user-added file:', fullPath);
        return NextResponse.json({ error: 'Access denied. Can only delete user-added files.' }, { status: 403 })
      }

      // Remove the file from user-files.json
      const updatedFiles = userFiles.filter(file => file.path !== relativePath);
      await fs.writeFile(USER_FILES_JSON, JSON.stringify(updatedFiles, null, 2))
    }

    await fs.rm(fullPath, { recursive: true, force: true })

    console.log('Successfully deleted:', fullPath)
    return NextResponse.json({ message: 'File or directory deleted successfully' })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json({ error: 'Failed to delete file or directory' }, { status: 500 })
  }
}

