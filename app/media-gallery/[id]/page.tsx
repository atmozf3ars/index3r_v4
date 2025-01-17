'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AudioPlayer } from '@/components/AudioPlayer'
import { VideoPreview } from '@/components/VideoPreview'
import { AnimatedTitle } from '@/components/AnimatedTitle'
import { InnerCircleSubdirectoryView } from '@/components/InnerCircleSubdirectoryView'
import { formatFileSize } from '@/utils/fileExplorer'
import { FileIcon } from '@/components/FileIcon'
import { ChevronLeft, ChevronRight, Download, Play, Pause, X, Moon, Sun } from 'lucide-react'
import { ElegantProgressBar } from '@/components/ElegantProgressBar'
import { v4 as uuidv4 } from 'uuid'

interface FileInfo {
  name: string;
  path: string;
  size: number;
  type: string;
  dateAdded: string;
  thumbnailUrl?: string;
  isDirectory?: boolean;
}

const shortenFileName = (fileName: string, maxLength: number = 25) => {
  const nameWithoutExtension = fileName.split('.').slice(0, -1).join('.')
  return nameWithoutExtension.length > maxLength 
    ? nameWithoutExtension.substring(0, maxLength - 3) + '...' 
    : nameWithoutExtension
}

export default function MediaGalleryPage({ params }: { params: { id: string } }) {
  const [isLoading, setIsLoading] = useState(true)
  const [files, setFiles] = useState<FileInfo[]>([])
  const [folderName, setFolderName] = useState('')
  const [error, setError] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [audioPlayer, setAudioPlayer] = useState({ 
    isPlaying: false, 
    filePath: '', 
    fileName: '',
    currentIndex: 0,
    totalFiles: 0
  })
  const [videoPreview, setVideoPreview] = useState({ isOpen: false, filePath: '', fileName: '' })
  const [isMediaDirectory, setIsMediaDirectory] = useState(false)
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<{
    [fileName: string]: {
      id: string;
      progress: number;
      speed: number;
    };
  }>({})
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)
  const [currentDownloadIndex, setCurrentDownloadIndex] = useState(0)
  const [totalDownloadFiles, setTotalDownloadFiles] = useState(0)

  const id = params.id

  useEffect(() => {
    setMounted(true)
    const fetchFiles = async () => {
      try {
        const response = await fetch(`/api/media-gallery/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch files')
        }
        const data = await response.json()
        setFiles(data.files)
        setFolderName(data.folderName)

        const hasMediaFiles = data.files.some((file: FileInfo) => file.type === 'video' || file.type === 'audio')
        setIsMediaDirectory(hasMediaFiles)

        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching files:', error)
        setError('An error occurred while fetching the files. Please try again.')
        setIsLoading(false)
      }
    }

    fetchFiles()
  }, [id])

  const handleFileAction = (index: number) => {
    const file = files[index]
    if (file.type === 'audio') {
      const audioFiles = files.filter(f => f.type === 'audio')
      const audioIndex = audioFiles.findIndex(f => f.path === file.path)
      setAudioPlayer({
        isPlaying: true,
        filePath: file.path,
        fileName: file.name,
        currentIndex: audioIndex,
        totalFiles: audioFiles.length
      })
      setVideoPreview({ isOpen: false, filePath: '', fileName: '' })
    } else if (file.type === 'video') {
      setVideoPreview({ isOpen: true, filePath: file.path, fileName: file.name })
      setAudioPlayer({
        isPlaying: false,
        filePath: '',
        fileName: '',
        currentIndex: 0,
        totalFiles: 0
      })
    }
    setCurrentIndex(index)
  }

  const closeAudioPlayer = () => {
    setAudioPlayer({
      isPlaying: false,
      filePath: '',
      fileName: '',
      currentIndex: 0,
      totalFiles: 0
    })
  }

  const closeVideoPreview = () => {
    setVideoPreview({ isOpen: false, filePath: '', fileName: '' })
    if (videoRef.current) {
      videoRef.current.pause()
    }
  }

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const downloadId = uuidv4()
      setDownloadProgress(prev => ({
        ...prev,
        [fileName]: { id: downloadId, progress: 0, speed: 0 }
      }))

      const response = await fetch(`/api/files/download?file=${encodeURIComponent(filePath)}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)

        setDownloadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[fileName]
          return newProgress
        })
      } else {
        throw new Error('Failed to download file')
      }
    } catch (error) {
      console.error('Error downloading file:', error)
      setError('Failed to download file. Please try again.')
    }
  }

  const openMediaPreview = (filePath: string, fileName: string) => {
    const file = files.find(f => f.path === filePath)
    if (file) {
      if (file.type === 'video') {
        setVideoPreview({ isOpen: true, filePath, fileName })
      } else if (file.type === 'audio') {
        const audioFiles = files.filter(f => f.type === 'audio')
        const audioIndex = audioFiles.findIndex(f => f.path === filePath)
        setAudioPlayer({ 
          isPlaying: true, 
          filePath, 
          fileName,
          currentIndex: audioIndex,
          totalFiles: audioFiles.length
        })
      }
    }
  }

  const getAdjacentAudio = (direction: 'next' | 'previous') => {
    const audioFiles = files.filter(file => file.type === 'audio')
    if (audioFiles.length === 0) return null
    const newIndex = direction === 'next' 
      ? (audioPlayer.currentIndex + 1) % audioFiles.length 
      : (audioPlayer.currentIndex - 1 + audioFiles.length) % audioFiles.length
    const adjacentFile = audioFiles[newIndex]
    if (adjacentFile) {
      const filePath = adjacentFile.path
      const encodedFilePath = encodeURIComponent(filePath.replace(/\\/g, '/'))
      return {
        src: `/api/files/stream?file=${encodedFilePath}`,
        fileName: adjacentFile.name
      }
    }
    return null
  }

  const goToNextMedia = () => {
    const mediaFiles = files.filter(file => file.type === 'audio' || file.type === 'video')
    if (mediaFiles.length === 0) return
    const nextIndex = (currentIndex + 1) % mediaFiles.length
    handleFileAction(nextIndex)
  }

  const goToPreviousMedia = () => {
    const mediaFiles = files.filter(file => file.type === 'audio' || file.type === 'video')
    if (mediaFiles.length === 0) return
    const previousIndex = (currentIndex - 1 + mediaFiles.length) % mediaFiles.length
    handleFileAction(previousIndex)
  }

  const navigateToSubdirectory = (folderName: string) => {
    const newPath = [...currentPath, folderName]
    setCurrentPath(newPath)
    // Implement fetching files for the new subdirectory
    // This would typically involve making a new API call with the updated path
  }

  const navigateUp = () => {
    if (currentPath.length > 0) {
      const newPath = currentPath.slice(0, -1)
      setCurrentPath(newPath)
      // Implement fetching files for the parent directory
      // This would typically involve making a new API call with the updated path
    }
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const handleDownloadAll = async () => {
    setIsDownloadingAll(true)
    setCurrentDownloadIndex(0)
    const filesToDownload = files.filter(file => file.type !== 'directory')
    setTotalDownloadFiles(filesToDownload.length)

    for (let i = 0; i < filesToDownload.length; i++) {
      const file = filesToDownload[i]
      setCurrentDownloadIndex(i)
      await handleDownload(file.path, file.name)
      // Add a small delay between downloads to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setIsDownloadingAll(false)
    setCurrentDownloadIndex(0)
    setTotalDownloadFiles(0)
  }

  const cancelDownload = (id: string) => {
    setDownloadProgress(prev => {
      const newProgress = { ...prev }
      const fileToRemove = Object.keys(newProgress).find(key => newProgress[key].id === id)
      if (fileToRemove) {
        delete newProgress[fileToRemove]
      }
      return newProgress
    })

    if (id === 'downloadAll') {
      setIsDownloadingAll(false)
      setCurrentDownloadIndex(0)
      setTotalDownloadFiles(0)
    }
  }

  if (!mounted) return null

  const backgroundImage = theme === 'dark' ? 'url(https://theinnercircle.gg/ic2dark.jpg)' : 'url(https://theinnercircle.gg/ic2.jpg)'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl font-bold text-white">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl font-bold text-white">{error}</div>
      </div>
    )
  }

  const isVideoFile = (fileName: string) => fileName.endsWith('.mp4') || fileName.endsWith('.mov') || fileName.endsWith('.avi') || fileName.endsWith('.mkv') || fileName.endsWith('.webm');


  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-background-move bg-scroll"
        style={{
          backgroundImage: backgroundImage,
          filter: 'blur(5px)',
        }}
      />
      <div className="fixed inset-0 bg-gradient-radial from-transparent via-white/10 to-white dark:via-gray-900/50 dark:to-black" />
      <motion.div
        className="container mx-auto p-4 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <AnimatedTitle />
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-center dark:text-white text-black">{folderName || 'INNER CIRCLE MEDIA HUB'}</h1>
            <Button
              onClick={toggleTheme}
              variant="outline"
              size="sm"
              className="flex items-center"
              aria-label={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="mr-2" aria-hidden="true" />
                  LIGHT
                </>
              ) : (
                <>
                  <Moon className="mr-2 text-gray-600" aria-hidden="true" />
                  DARK
                </>
              )}
            </Button>
          </div>
        </div>

        {currentPath.length > 0 && (
          <Button onClick={navigateUp} className="mb-4">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        )}

        <div className="bg-white/50 dark:bg-black/50 shadow-md rounded-lg overflow-hidden mb-16 backdrop-blur-sm p-2">
          {isMediaDirectory ? (
            <InnerCircleSubdirectoryView
              files={files.map(file => ({
                ...file,
                displayName: file.type === 'video' ? shortenFileName(file.name) : file.name,
                details: file.type === 'video' ? `${formatFileSize(file.size)} • ${file.name.split('.').pop()}` : undefined
              }))}
              currentPath={currentPath}
              handleDownload={handleDownload}
              openMediaPreview={openMediaPreview}
              audioPlayer={audioPlayer}
              navigateToSubdirectory={navigateToSubdirectory}
              downloadProgress={downloadProgress}
              goToNextMedia={goToNextMedia}
              goToPreviousMedia={goToPreviousMedia}
              onContextMenu={() => {}}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file, index) => (
                  <TableRow key={file.path}>
                    <TableCell>
                      <FileIcon fileName={file.name} />
                    </TableCell>
                    <TableCell className="font-medium">
                      {file.name.length > 30 ? file.name.substring(0, 27) + '...' : file.name}
                      <br />
                      <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                    </TableCell>
                    <TableCell>{file.type}</TableCell>
                    <TableCell>{new Date(file.dateAdded).toLocaleString()}</TableCell>
                    <TableCell>{formatFileSize(file.size)}</TableCell>
                    <TableCell>
                      {file.type === 'audio' && (
                        <Button onClick={() => handleFileAction(index)} variant="ghost" size="sm">
                          {audioPlayer.isPlaying && audioPlayer.filePath === file.path ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                          {audioPlayer.isPlaying && audioPlayer.filePath === file.path ? 'Pause' : 'Play'}
                        </Button>
                      )}
                      {file.type === 'video' && (
                        <Button onClick={() => handleFileAction(index)} variant="ghost" size="sm">
                          <Play className="h-4 w-4 mr-2" />
                          Play
                        </Button>
                      )}
                      <Button onClick={() => handleDownload(file.path, file.name)} variant="ghost" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <Button
          onClick={handleDownloadAll}
          disabled={isDownloadingAll}
          className="w-full mb-4"
        >
          {isDownloadingAll ? 'Downloading...' : 'Download All Files'}
        </Button>

        <AnimatePresence>
          {audioPlayer.isPlaying && (
            <AudioPlayer
              src={`/api/files/stream?file=${encodeURIComponent(audioPlayer.filePath)}`}
              fileName={audioPlayer.fileName}
              onClose={closeAudioPlayer}
              currentIndex={audioPlayer.currentIndex}
              setCurrentIndex={(index) => setAudioPlayer(prev => ({ ...prev, currentIndex: index }))}
              totalFiles={audioPlayer.totalFiles}
              getAdjacentAudio={getAdjacentAudio}
              handleDownload={handleDownload}
              currentAudioFolder={currentPath}
            />
          )}
          {videoPreview.isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
              onClick={closeVideoPreview}
            >
              <div className="relative w-[90%] h-[90%] max-w-7xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4">
                  <h2 className="text-xl font-bold text-white">{videoPreview.fileName}</h2>
                  <Button onClick={closeVideoPreview} variant="ghost" size="sm" className="text-white">
                    <X className="h-6 w-6" />
                  </Button>
                </div>
                <div className="relative flex-grow flex items-center justify-center">
                  <video
                    ref={videoRef}
                    src={`/api/files/stream?file=${videoPreview.filePath}`}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                  <Button
                    onClick={goToPreviousMedia}
                    variant="ghost"
                    size="sm"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    onClick={goToNextMedia}
                    variant="ghost"
                    size="sm"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <ElegantProgressBar
          items={[
            ...Object.entries(downloadProgress).map(([fileName, { id, progress }]) => ({
              id,
              progress,
              label: `Downloading ${fileName}...`,
              fileName,
              filePath: currentPath.join('/')
            })),
            ...(isDownloadingAll ? [{
              id: 'downloadAll',
              progress: (currentDownloadIndex + 1) / totalDownloadFiles * 100,
              label: `Downloading all files (${currentDownloadIndex + 1}/${totalDownloadFiles})`,
              fileName: 'Multiple files',
              filePath: currentPath.join('/')
            }] : [])
          ]}
          onCancel={cancelDownload}
        />
      </motion.div>
    </div>
  )
}

