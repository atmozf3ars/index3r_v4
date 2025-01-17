'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { X, VolumeX, Volume2, Play, Pause } from 'lucide-react'

interface FileInfo {
  filePath: string
  fileName: string
  isMP4: boolean
  thumbnailUrl: string
}

interface DownloadPageContentProps {
  id: string
  initialFileInfo: FileInfo | null
}

export default function DownloadPageContent({ id, initialFileInfo }: DownloadPageContentProps) {
  const [isLoading, setIsLoading] = useState(!initialFileInfo)
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(initialFileInfo)
  const [error, setError] = useState('')
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showNotification, setShowNotification] = useState(false)
  const [isVideoLoading, setIsVideoLoading] = useState(false)
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!initialFileInfo) {
      const eventSource = new EventSource(`/api/public-download/${id}`)
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.fileName) {
            const isMP4 = data.fileName.toLowerCase().endsWith('.mp4')
            const thumbnailUrl = isMP4 ? `/api/thumbnails?file=${encodeURIComponent(data.filePath)}` : ''
            setFileInfo({
              filePath: data.filePath,
              fileName: data.fileName,
              isMP4,
              thumbnailUrl
            })
          }
          if (data.progress !== undefined) {
            setProgress(data.progress)
          }
          if (data.done) {
            eventSource.close()
            setIsLoading(false)
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error)
          setError('An error occurred while processing the file information.')
          setIsLoading(false)
          eventSource.close()
        }
      }

      eventSource.onerror = (error) => {
        console.error('EventSource failed:', error)
        setError('An error occurred while fetching the file information. Please try again.')
        setIsLoading(false)
        eventSource.close()
      }

      return () => {
        eventSource.close()
      }
    }
  }, [id, initialFileInfo])

  useEffect(() => {
    if (fileInfo && !showNotification) {
      setShowNotification(true)
    }
  }, [fileInfo])

  const handleDownload = () => {
    if (fileInfo && fileInfo.filePath) {
      window.location.href = `/api/public-download/${id}?download=true`
    }
  }

  const openInFLStudio = () => {
    if (fileInfo && fileInfo.filePath) {
      const encodedPath = encodeURIComponent(fileInfo.filePath);
      window.location.href = `flstudio://${encodedPath}`;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        setIsVideoLoading(true);
        videoRef.current.src = `/api/public-download/${id}`;
        videoRef.current.load();
        videoRef.current.play().then(() => {
          setIsPlaying(true);
          setIsVideoLoading(false);
        }).catch(error => {
          console.error('Error playing video:', error);
          setError('Failed to play video. Please try downloading the file.');
          setIsVideoLoading(false);
        });
      }
    }
  };

  const NotificationBubble = ({ fileName }: { fileName: string }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 text-black dark:text-white px-4 py-2 rounded-full shadow-lg"
    >
      {fileName}
    </motion.div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-400 to-red-100 relative">
      <AnimatePresence>
        {showNotification && fileInfo && (
          <NotificationBubble fileName={fileInfo.fileName} />
        )}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg p-10 backdrop-blur-lg bg-white bg-opacity-20 rounded-xl shadow-2xl"
      >
        <p className="text-xs text-center text-pink-300 mb-2">
          the people of inner circle shared
        </p>
        <h1 className="text-3xl font-bold text-center text-white mb-2 break-words">
          {fileInfo?.fileName || 'Preparing download...'}
        </h1>
        {isLoading ? (
          <div className="mb-6">
            <Progress value={progress} className="w-full h-4" />
            <p className="text-center text-white mt-2">{`${progress.toFixed(0)}%`}</p>
          </div>
        ) : fileInfo?.isMP4 ? (
          <div className="relative aspect-video mb-6 rounded-lg overflow-hidden">
            <img
              src={fileInfo.thumbnailUrl}
              alt={`Thumbnail for ${fileInfo.fileName}`}
              className={`w-full h-full object-cover ${isPlaying ? 'hidden' : 'block'}`}
            />
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${isPlaying ? 'block' : 'hidden'}`}
              muted={isMuted}
              playsInline
              controls
              onEnded={() => setIsPlaying(false)}
              onError={(e) => {
                console.error('Video error:', e)
                setError('Error loading video. Please try downloading the file.')
                setIsPlaying(false)
                setIsVideoLoading(false)
              }}
              onCanPlay={() => {
                setIsVideoLoading(false)
              }}
            />
            {isVideoLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                onClick={togglePlayPause}
                variant="ghost"
                size="lg"
                className="text-white bg-black/50 hover:bg-black/70"
                disabled={isVideoLoading}
              >
                {isVideoLoading ? (
                  <span className="animate-spin">⌛</span>
                ) : isPlaying ? (
                  <Pause className="h-12 w-12" />
                ) : (
                  <Play className="h-12 w-12" />
                )}
              </Button>
            </div>
            <div className="absolute bottom-4 right-4 flex space-x-2">
              <Button
                onClick={toggleMute}
                variant="ghost"
                size="sm"
                className="text-white bg-black/50 hover:bg-black/70"
              >
                {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
              </Button>
              <Button
                onClick={handleDownload}
                variant="ghost"
                size="sm"
                className="text-white bg-black/50 hover:bg-black/70"
              >
                Download
              </Button>
              {fileInfo && fileInfo.fileName.toLowerCase().endsWith('.flp') && (
                <Button
                  onClick={openInFLStudio}
                  variant="ghost"
                  size="sm"
                  className="text-white bg-purple-600 hover:bg-purple-700"
                >
                  Open in FL Studio
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div 
            className="relative h-20 mb-6 rounded-full overflow-hidden cursor-pointer"
            onClick={handleDownload}
            role="button"
            tabIndex={0}
            aria-label={`Download ${fileInfo?.fileName}`}
            onKeyPress={(e) => e.key === 'Enter' && handleDownload()}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500" />
            <div className="absolute inset-0 bg-black bg-opacity-30" />
            <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold text-2xl z-10">
              SAVE FILE
            </span>
            {fileInfo && fileInfo.fileName.toLowerCase().endsWith('.flp') && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  openInFLStudio();
                }}
                variant="ghost"
                size="sm"
                className="absolute bottom-4 right-4 text-white bg-purple-600 hover:bg-purple-700"
              >
                Open in FL Studio
              </Button>
            )}
          </div>
        )}
        {error && (
          <div className="text-center text-red-300 mb-4">
            <p>{error}</p>
            <Button 
              onClick={() => router.refresh()} 
              className="mt-2 bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-all duration-300"
            >
              Retry
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  )
}

