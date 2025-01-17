import React, { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipBack, SkipForward, X, Volume2, VolumeX, Maximize2, Minimize2, Download } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface AudioPlayerProps {
  src: string
  fileName: string
  onClose: () => void
  currentIndex: number
  setCurrentIndex: (index: number) => void
  totalFiles: number
  getAdjacentAudio: (direction: 'next' | 'previous') => { src: string; fileName: string } | null
  handleDownload: (filePath: string, fileName: string) => Promise<void>;
}

export function AudioPlayer({ 
  src, 
  fileName, 
  onClose, 
  currentIndex, 
  setCurrentIndex,
  totalFiles,
  getAdjacentAudio,
  handleDownload
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [currentFileName, setCurrentFileName] = useState(fileName)
  const [nextFileName, setNextFileName] = useState<string | null>(null)
  const [previousFileName, setPreviousFileName] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);

  const goToAdjacentAudio = useCallback((direction: 'next' | 'previous') => {
    const adjacentAudio = getAdjacentAudio(direction)
    if (adjacentAudio) {
      if (audioRef.current) {
        audioRef.current.src = adjacentAudio.src
        audioRef.current.load()
        audioRef.current.play().catch(error => {
          console.error('Autoplay failed:', error);
          setIsPlaying(false);
          toast({
            title: "Playback Error",
            description: `Failed to play ${adjacentAudio.fileName}. Please try again.`,
            variant: "destructive",
          });
        });
      }
      setCurrentFileName(adjacentAudio.fileName)
      setCurrentTime(0)
      setDuration(0)
  
      const nextAudio = getAdjacentAudio('next')
      const previousAudio = getAdjacentAudio('previous')
      setNextFileName(nextAudio ? nextAudio.fileName : null)
      setPreviousFileName(previousAudio ? previousAudio.fileName : null)

      setCurrentIndex(direction === 'next' ? (currentIndex + 1) % totalFiles : (currentIndex - 1 + totalFiles) % totalFiles)
    }
  }, [getAdjacentAudio, currentIndex, totalFiles, setCurrentIndex])

  const goToNextAudio = useCallback(() => goToAdjacentAudio('next'), [goToAdjacentAudio])
  const goToPreviousAudio = useCallback(() => goToAdjacentAudio('previous'), [goToAdjacentAudio])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => {
      setIsPlaying(false)
      goToAdjacentAudio('next')
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [goToAdjacentAudio])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(error => {
        console.error('Autoplay failed:', error);
        setIsPlaying(false);
        toast({
          title: "Playback Error",
          description: `Failed to play ${fileName}. Please try again.`,
          variant: "destructive",
        });
      });
    }
  }, [src, fileName]);

  useEffect(() => {
    const nextAudio = getAdjacentAudio('next')
    const previousAudio = getAdjacentAudio('previous')
    setNextFileName(nextAudio ? nextAudio.fileName : null)
    setPreviousFileName(previousAudio ? previousAudio.fileName : null)
  }, [getAdjacentAudio, currentFileName])

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => {
          console.error('Play failed:', error);
          setIsPlaying(false);
          toast({
            title: "Playback Error",
            description: `Failed to play ${currentFileName}. Please try again.`,
            variant: "destructive",
          });
        });
      }
      setIsPlaying(!isPlaying);
    }
  }

  const handleSeek = (value: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value
      setCurrentTime(value)
    }
  }

  const handleVolumeChange = (value: number) => {
    if (audioRef.current) {
      audioRef.current.volume = value
      setVolume(value)
      setIsMuted(value === 0)
    }
  }

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.target === dragRef.current) {
      setIsDragging(true);
    }
  };

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        setPosition(prevPosition => ({
          x: prevPosition.x + e.movementX,
          y: prevPosition.y + e.movementY
        }));
      }
    },
    [isDragging]
  );

  const onMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove]);

  const handleDownloadClick = async () => {
    try {
      const filePath = new URL(src).searchParams.get('file');
      if (filePath) {
        await handleDownload(filePath, currentFileName);
        toast({
          title: "Download Initiated",
          description: `${currentFileName} download has started.`,
        });
      } else {
        console.error('Unable to extract file path from src URL');
        toast({
          title: "Download Error",
          description: "Unable to extract file path. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download Failed",
        description: `Failed to download ${currentFileName}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      className="fixed bg-white/80 text-black dark:text-white dark:bg-black/80 rounded-lg shadow-lg z-50 backdrop-blur-sm transition-all duration-300 ease-in-out hover:bg-white/90 dark:hover:bg-black/90"
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        x: position.x,
        y: position.y
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      style={{
        width: isExpanded ? '400px' : '400px',
        height: isExpanded ? '400px' : '200px',
        right: '10%',
        bottom: '20%',
      }}
    >
      <div className="w-full h-full flex flex-col p-4">
        <div 
          ref={dragRef}
          onMouseDown={onMouseDown}
          className="drag-handle flex justify-between items-center mb-2 cursor-move bg-gray-200 dark:bg-gray-700 p-2 rounded-lg"
        >
          <span className="font-medium text-sm truncate">{currentFileName}</span>
          <div className="flex items-center space-x-2">
            <Button onClick={toggleExpand} variant="ghost" size="sm">
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button onClick={onClose} variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-grow flex flex-col justify-center items-center space-y-4">
          <div className="flex items-center space-x-4">
            <Button onClick={goToPreviousAudio} variant="ghost" size="sm">
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button onClick={togglePlayPause} variant="ghost" size="sm">
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
            <Button onClick={goToNextAudio} variant="ghost" size="sm">
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
          <div className="w-full space-y-2">
            <Slider
              value={[currentTime]}
              min={0}
              max={duration}
              step={1}
              onValueChange={(value) => handleSeek(value[0])}
              className="w-full"
            />
            <div className="flex justify-between w-full text-xs">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="center text-center mt-4 text-base/30 text-xs space-y-1"
          >
            <div>Previous: {previousFileName || 'None'}</div>
            <div>Next: {nextFileName || 'None'}</div>

          </motion.div>
        )}
      </div>
      <audio ref={audioRef} src={src} />
    </motion.div>
  )
}

