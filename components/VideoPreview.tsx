import React, { useRef } from 'react'
import { Button } from "@/components/ui/button"
import { X } from 'lucide-react'

interface VideoPreviewProps {
  filePath: string
  fileName: string
  onClose: () => void
  onError: (error: string) => void
}

export function VideoPreview({ filePath, fileName, onClose, onError }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-4xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{fileName}</h2>
          <Button onClick={onClose} variant="ghost" size="sm" aria-label="Close video preview">
            <X className="h-6 w-6" />
          </Button>
        </div>
        <video
          ref={videoRef}
          controls
          className="w-full"
          aria-label={`Video preview of ${fileName}`}
          onError={(e) => {
            console.error('Video playback error:', e.currentTarget.error)
            onError(`Failed to load video: ${e.currentTarget.error?.message || 'Unknown error'}. Please try downloading the file instead.`)
          }}
        >
          <source
            src={`/api/files/stream?file=${filePath}`}
            type="video/mp4"
            onError={(e) => {
              console.error('Source error:', e)
            }}
          />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  )
}

