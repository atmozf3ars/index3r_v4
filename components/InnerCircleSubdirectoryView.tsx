import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { SECTION_CONFIG, LANDING_PAGE_BG_IMAGE } from '../constants/fileExplorer'
import { FileInfo } from '../types/fileExplorer'
import { Folder, Download, Play, Pause, ImageIcon, Music, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { ElegantProgressBar } from './ElegantProgressBar'
import { formatFileSize } from '../utils/fileExplorer'

interface InnerCircleSubdirectoryViewProps {
  files: FileInfo[]
  currentPath: string[]
  handleDownload: (filePath: string, fileName: string) => void
  openMediaPreview: (filePath: string, fileName: string) => void
  audioPlayer: {
    isPlaying: boolean;
    filePath: string;
    fileName: string;
    currentIndex: number;
    totalFiles: number;
  }
  navigateToSubdirectory: (folderName: string) => void
  downloadProgress: {
    [fileName: string]: {
      id: string;
      progress: number;
      speed: number;
    };
  }
  goToNextMedia: () => void
  goToPreviousMedia: () => void
  onContextMenu: (e: React.MouseEvent, file: FileInfo) => void;
  onCreateFolder: (folderName: string) => Promise<void>;
  uploadProgress: { inProgress: boolean; progress: number; completed: boolean; fileName?: string } | null;
  handleUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  isUploading: boolean;
  isDownloadingAll: boolean;
  currentDownloadIndex?: number;
  totalDownloadFiles?: number;
  cancelDownload: (id: string) => void;
  cancelUpload: () => void;
}

export const InnerCircleSubdirectoryView: React.FC<InnerCircleSubdirectoryViewProps> = ({
  files,
  currentPath,
  handleDownload,
  openMediaPreview,
  audioPlayer,
  navigateToSubdirectory,
  downloadProgress,
  goToNextMedia,
  goToPreviousMedia,
  onContextMenu,
  onCreateFolder,
  uploadProgress,
  handleUpload,
  isUploading,
  isDownloadingAll,
  currentDownloadIndex,
  totalDownloadFiles,
  cancelDownload,
  cancelUpload
}) => {
  const [filesWithThumbnails, setFiles] = useState<FileInfo[]>(files);

  useEffect(() => {
    const updatedFiles = files.map(file => {
      const extension = file.name.split('.').pop() || '';
      return {
        ...file,
        displayName: file.name,
        details: `${formatFileSize(file.size)} • ${extension}`
      };
    });
    setFiles(updatedFiles);
  }, [files]);

  const generateThumbnail = async (file: FileInfo) => {
    const filePath = file.path || [...currentPath, file.name].join('/');
    try {
      const response = await fetch('/api/thumbnails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath }),
      });
      if (response.ok) {
        const data = await response.json();
        return data.thumbnailPath;
      }
    } catch (error) {
      console.error('Error generating thumbnail:', error);
    }
    return null;
  };

  useEffect(() => {
    const fetchThumbnails = async () => {
      const updatedFiles = await Promise.all(
        files.map(async (file) => {
          const thumbnail = await getThumbnailUrl(file);
          return { ...file, thumbnail };
        })
      );
      setFiles(updatedFiles);
    };

    fetchThumbnails();
  }, [files, currentPath]);

  const getThumbnailUrl = async (file: FileInfo) => {
    const customThumbnail = `/thumbnails/${file.name}.jpg`;

    // Check if the custom thumbnail exists
    try {
      const response = await fetch(customThumbnail, { method: 'HEAD' });
      if (response.ok) {
        return customThumbnail;
      }
    } catch (error) {
      console.error('Error checking thumbnail:', error);
    }

    // If thumbnail doesn't exist, generate it
    if (!file.isDirectory && (isVideoFile(file.name) || file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/))) {
      const generatedThumbnail = await generateThumbnail(file);
      if (generatedThumbnail) {
        return generatedThumbnail;
      }
    }

    return null;
  };

  const isVideoFile = (fileName: string) => {
    return fileName.toLowerCase().endsWith('.mp4') ||
           fileName.toLowerCase().endsWith('.mkv') ||
           fileName.toLowerCase().endsWith('.mov');
  }

  const isAudioFile = (fileName: string) => {
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.wma', '.aiff']
    return audioExtensions.some(ext => fileName.toLowerCase().endsWith(ext))
  }

  const progressItems = [
    ...Object.entries(downloadProgress).map(([fileName, { id, progress }]) => ({
      id,
      progress,
      label: `Downloading ${fileName}...`,
      fileName,
      filePath: currentPath.join('/')
    })),
    ...(isDownloadingAll && currentDownloadIndex !== undefined && totalDownloadFiles !== undefined ? [{
      id: 'downloadAll',
      progress: (currentDownloadIndex + 1) / totalDownloadFiles * 100,
      label: `Downloading all files (${currentDownloadIndex + 1}/${totalDownloadFiles})`,
      fileName: 'Multiple files',
      filePath: currentPath.join('/')
    }] : []),
    ...(uploadProgress && uploadProgress.inProgress && !uploadProgress.completed ? [{
      id: 'upload',
      progress: uploadProgress.progress,
      label: "Uploading files...",
      fileName: uploadProgress.fileName || 'Unknown',
      filePath: currentPath.join('/')
    }] : [])
  ];

  return (
    <>
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        variants={{
          animate: {
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
      >
        {filesWithThumbnails.map((file) => {
          const filePath = file.path || [...currentPath, file.name].join('/')
          const Icon = file.isDirectory ? Folder : SECTION_CONFIG['INNERCIRCLE'].icon

          return (
            <motion.div
              key={file.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <Button
                onClick={() => file.isDirectory ? navigateToSubdirectory(file.name) : handleDownload(filePath, file.name)}
                onContextMenu={(e) => onContextMenu(e, file)}
                className={`w-full h-48 p-2 rounded-lg shadow-sm hover:shadow-md transition-shadow relative overflow-hidden ${file.isDirectory ? 'folder-link' : 'file-link'} ${SECTION_CONFIG['INNERCIRCLE'].color}`}
                variant="ghost"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-50"
                  style={{ backgroundImage: `url(${LANDING_PAGE_BG_IMAGE})` }}
                />

                {file.thumbnail ? (
                  <Image
                    src={file.thumbnail || "/placeholder.svg"}
                    alt={file.name}
                    layout="fill"
                    objectFit="cover"
                    className=""
                  />
                ) : (
                  <div className=" items-center justify-center">
                    <Icon className="h-20 w-20 text-white" />
                  </div>
                )}
                <div className="absolute inset-0 x top-0 p-2 bg-black flex flex-col items-center justify-center bg-opacity-20 hover:bg-gradient-to-r from-black/30 to-black/50 hover:scale-130 text-white">
                  <div className="text-white text-lg font-bold text-center w-full px-2">
                  {file.name}
                  </div>
                  {file.details && (
                    <div className="absolute top p-2 text-xs opacity-75">

                    </div>
                  )}
                </div>
              </Button>
              {!file.isDirectory && (
                <div className="absolute bottom-2 left-2 right-2 flex justify-center space-x-2 z-20">
                  {isAudioFile(file.name) && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        openMediaPreview(filePath, file.name);
                      }}
                      variant="ghost"
                      size="sm"
                      className="bg-black bg-opacity-30 hover:bg-opacity-40 text-white flex-1"
                    >
                      <Play className="h-4 w-4" />
                      <span className="ml-2">PLAY</span>
                    </Button>
                  )}
                  {isVideoFile(file.name) && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        openMediaPreview(filePath, file.name);
                      }}
                      variant="ghost"
                      size="lg"
                      className="rounded-full bg-white bg-opacity-0 hover:bg-white/40 hover:bg-opacity-90 text-white flex-1"
                    >
                      <Play className="h-4 w-4" />
                      <span className="ml-2">PLAY</span>
                    </Button>
                  )}
                  {!isVideoFile(file.name) && !isAudioFile(file.name) && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(filePath, file.name);
                      }}
                      variant="ghost"
                      size="sm"
                      className="bg-opacity-20 hover:bg-opacity-90 text-white flex-1"
                    >
                      <Download className="h-4 w-4" />
                      <span className="ml-2">Download</span>
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          )
        })}
      </motion.div>
      <AnimatePresence>
        {(isUploading || isDownloadingAll) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black z-40"
            onClick={(e) => e.preventDefault()}
          />
        )}
      </AnimatePresence>
      <ElegantProgressBar
        items={progressItems}
        onCancel={(id) => {
          if (id === 'downloadAll') {
            cancelDownload('downloadAll');
          } else if (id === 'upload') {
            cancelUpload();
          } else {
            cancelDownload(id);
          }
        }}
      />
    </>
  )
}

