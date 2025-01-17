import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface FileInfo {
  name: string;
  path?: string;
  size: number;
  dateAdded: string;
  lastModified: string;
  isDirectory: boolean;
  type: 'file' | 'directory';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subdir = searchParams.get('subdir') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const itemsPerPage = 1000;

    const basePath = path.join(process.cwd(), 'innercircle');
    const fullPath = path.join(basePath, subdir);

    // Security check to prevent directory traversal
    if (!fullPath.startsWith(basePath)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Read directory contents
    const entries = await fs.readdir(fullPath, { withFileTypes: true });

    // Convert entries to FileInfo objects
    let files: FileInfo[] = await Promise.all(
      entries.map(async (entry) => {
        const filePath = path.join(subdir, entry.name);
        const fullFilePath = path.join(fullPath, entry.name);
        const stats = await fs.stat(fullFilePath);

        return {
          name: entry.name,
          path: filePath,
          size: stats.size,
          dateAdded: stats.birthtime.toISOString(),
          lastModified: stats.mtime.toISOString(),
          isDirectory: entry.isDirectory(),
          type: entry.isDirectory() ? 'directory' : 'file'
        };
      })
    );

    let filteredFiles = files;

    // Apply search filter if search term is provided
    if (search) {
      filteredFiles = files.filter(file =>
        file.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Calculate pagination
    const totalCount = filteredFiles.length;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedFiles = filteredFiles.slice(startIndex, endIndex);

    return NextResponse.json({
      files: paginatedFiles,
      currentPage: page,
      totalCount,
      itemsPerPage
    });

  } catch (error) {
    console.error('Error reading directory:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to read directory' },
      { status: 500 }
    );
  }
}

