import React, { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FileIcon } from './FileIcon'
import { FileInfo } from '../types/fileExplorer'
import { formatFileSize } from '../utils/fileExplorer'
import { formatBytes } from '../utils/formatBytes'
import { Download, Play, Pause, ChevronUp, ChevronDown, Folder, Loader2, X } from 'lucide-react'
import { InnerCircleSubdirectoryView } from './InnerCircleSubdirectoryView'

interface FileListViewProps {
  files: FileInfo[]
  currentPath: string[]
  handleDownload: (filePath: string, fileName: string) => void
  openVideoPreview: (filePath: string, fileName: string) => void
  toggleAudioPlayback: (filePath: string, fileName: string) => void
  audioPlayer: { isPlaying: boolean; filePath: string; fileName: string }
  navigateToSubdirectory: (folderName: string) => void
  isSearching: boolean
  cancelDownload: (fileName: string) => void
  downloadProgress: {
    [fileName: string]: {
      progress: number;
      speed: number;
    };
  }
  handleZipDownload: () => void
  isZipping: boolean
  isVideoDirectory: boolean
  onContextMenu: (e: React.MouseEvent, file: FileInfo) => void;
}

type SortColumn = 'name' | 'size' | 'dateAdded' | 'action'
type SortDirection = 'asc' | 'desc'

export const FileListView: React.FC<FileListViewProps> = ({
  files,
  currentPath,
  handleDownload,
  openVideoPreview,
  toggleAudioPlayback,
  audioPlayer,
  navigateToSubdirectory,
  isSearching,
  cancelDownload,
  downloadProgress,
  handleZipDownload,
  isZipping,
  isVideoDirectory,
  onContextMenu,
}) => {
  const [sortColumn, setSortColumn] = useState<SortColumn>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)
  const [currentDownloadIndex, setCurrentDownloadIndex] = useState(0)

  const handleSort = (column: SortColumn) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const sortedFiles = [...files].sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1
    if (!a.isDirectory && b.isDirectory) return 1

    switch (sortColumn) {
      case 'name':
        return sortDirection === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      case 'size':
        return sortDirection === 'asc'
          ? a.size - b.size
          : b.size - a.size
      case 'dateAdded':
        return sortDirection === 'asc'
          ? new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime()
          : new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
      default:
        return 0
    }
  })

  const handleDownloadAllFiles = async () => {
    setIsDownloadingAll(true)
    setCurrentDownloadIndex(0)

    const filesToDownload = files.filter(file => !file.isDirectory)

    for (let i = 0; i < filesToDownload.length; i++) {
      const file = filesToDownload[i]
      const filePath = file.path || [...currentPath, file.name].join('/')

      setCurrentDownloadIndex(i)
      await handleDownload(filePath, file.name)

      // Wait for a short delay before starting the next download
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    setIsDownloadingAll(false)
    setCurrentDownloadIndex(0)
  }

  const isInnerCircleSubdirectory = currentPath.length > 0 && currentPath[0].startsWith('INNERCIRCLE.')

  if (isVideoDirectory) {
    return (
      <InnerCircleSubdirectoryView
        files={sortedFiles}
        currentPath={currentPath}
        handleDownload={handleDownload}
        openVideoPreview={openVideoPreview}
        toggleAudioPlayback={toggleAudioPlayback}
        audioPlayer={audioPlayer}
        navigateToSubdirectory={navigateToSubdirectory}
        downloadProgress={downloadProgress}
      />
    )
  }

  if (isInnerCircleSubdirectory) {
    return (
      <InnerCircleSubdirectoryView
        files={sortedFiles}
        currentPath={currentPath}
        handleDownload={handleDownload}
        openVideoPreview={openVideoPreview}
        toggleAudioPlayback={toggleAudioPlayback}
        audioPlayer={audioPlayer}
        navigateToSubdirectory={navigateToSubdirectory}
        downloadProgress={downloadProgress}
      />
    )
  }

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return null
    return sortDirection === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => handleSort('name')} className="cursor-pointer">
              <div className="flex items-center">
                Name
                <SortIcon column="name" />
              </div>
            </TableHead>
            <TableHead onClick={() => handleSort('size')} className="cursor-pointer">
              <div className="flex items-center">
                Size
                <SortIcon column="size" />
              </div>
            </TableHead>
            <TableHead onClick={() => handleSort('dateAdded')} className="cursor-pointer">
              <div className="flex items-center">
                Date Added
                <SortIcon column="dateAdded" />
              </div>
            </TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedFiles.map((file) => {
            const filePath = file.path || [...currentPath, file.name].join('/')
            const fileDownloadProgress = downloadProgress[file.name]
            return (
              <TableRow key={filePath} className={file.isDirectory ? 'bg-black/5 dark:bg-white/10' : ''} onContextMenu={(e) => onContextMenu(e, file)}>
                <TableCell className="py-1 px-3">
                  <div className="flex items-center">
                    {file.isDirectory ? (
                      <Folder className="h-5 w-5 mr-2 text-blue-500" aria-label="Folder" />
                    ) : (
                      <FileIcon fileName={file.name} />
                    )}
                    <span
                      className={`text-base font-medium ml-2 cursor-pointer ${
                        file.isDirectory
                          ? 'text-black dark:text-white font-bold hover:text-pink-600 dark:hover:text-pink-400'
                          : 'text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-yellow-500 dark:tracking-widest tracking-widest'
                      }`}
                      onClick={() => file.isDirectory ? navigateToSubdirectory(file.name) : handleDownload(filePath, file.name)}
                    >
                      {file.name}
                    </span>
                  </div>
                  {isSearching && file.path && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 ml-6">{file.path}</div>
                  )}
                </TableCell>
                <TableCell className="py-1 px-3">{file.isDirectory ? '-' : formatFileSize(file.size)}</TableCell>
                <TableCell className="py-1 px-3">
                  {file.dateAdded
                    ? new Date(file.dateAdded).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'N/A'}
                </TableCell>
                <TableCell className="py-1 px-3">
                  <div className="flex items-center space-x-2">
                    {!file.isDirectory && (
                      fileDownloadProgress ? (
                        <div className="flex items-center space-x-2">
                          <Progress value={fileDownloadProgress.progress} className="w-24" />
                          <Button onClick={() => cancelDownload(file.name)} variant="ghost" size="sm" className="text-red-500">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleDownload(filePath, file.name)}
                          variant="ghost"
                          size="default"
                          className="flex items-center text-gray-600 hover:text-blue-800 dark:text-blue-100 dark:hover:text-pink-500"
                          aria-label={`Download ${file.name}`}
                        >
                          <Download className="h-5 w-5 mr-1" aria-hidden="true" />
                          Download
                        </Button>
                      )
                    )}
                    {file.name.toLowerCase().endsWith('.mp4') && (
                      <Button
                        onClick={() => openVideoPreview(filePath, file.name)}
                        variant="ghost"
                        size="default"
                        className="flex items-center text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-gray-100"
                        aria-label={`Preview ${file.name}`}
                      >
                        <Play className="h-5 w-5 mr-1" />
                        Preview
                      </Button>
                    )}
                    {(file.name.toLowerCase().endsWith('.mp3') || file.name.toLowerCase().endsWith('.wav')) && (
                      <Button
                        onClick={() => toggleAudioPlayback(filePath, file.name)}
                        variant="ghost"
                        size="default"
                        className="flex items-center text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-gray-100"
                        aria-label={`${audioPlayer.isPlaying && audioPlayer.filePath === filePath ? 'Pause' : 'Play'} ${file.name}`}
                      >
                        {audioPlayer.isPlaying && audioPlayer.filePath === filePath ? (
                          <Pause className="h-5 w-5 mr-1" />
                        ) : (
                          <Play className="h-5 w-5 mr-1" />
                        )}
                        {audioPlayer.isPlaying && audioPlayer.filePath === filePath ? 'Pause' : 'Play'}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <div className="mt-4 space-y-2">
        <Button
          onClick={handleDownloadAllFiles}
          variant="outline"
          size="sm"
          className="flex items-center w-full justify-center"
          disabled={isDownloadingAll}
        >
          {isDownloadingAll ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {isDownloadingAll
            ? `Downloading (${currentDownloadIndex + 1}/${files.filter(f => !f.isDirectory).length})`
            : 'Download All Files'}
        </Button>
      </div>
    </>
  )
}

