'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileIcon } from './FileIcon'
import { RootDirectoryView } from './RootDirectoryView'
import { FileListView } from './FileListView'
import { InnerCircleSubdirectoryView } from './InnerCircleSubdirectoryView'
import { CustomContextMenu } from './CustomContextMenu'
import { FileInfo, MediaPreview, AudioPlayer as AudioPlayerType } from '../types/fileExplorer'
import { formatFileSize, isAudioFile, groupDirectories } from '../utils/fileExplorer'
import { LANDING_PAGE_BG_IMAGE, SECTION_CONFIG } from '../constants/fileExplorer'
import { Folder, Download, ArrowUp, Home, ChevronRight, X, Moon, Sun, ChevronLeft, Loader2, VolumeX, Volume2 } from 'lucide-react'
import path from 'path';
import { v4 as uuidv4 } from 'uuid'
import { useToast } from "@/components/ui/use-toast"
import { ElegantProgressBar } from './ElegantProgressBar'
import '../styles/global.css'
import { AudioPlayer } from './AudioPlayer';
import { ThemeManager } from './ThemeManager';
import { ErrorBoundary } from 'react-error-boundary'
import { useThemeContext } from '@/context/ThemeContext'
import { Dialog, DialogContent } from '@/components/ui/dialog'

const MAX_SIMULTANEOUS_DOWNLOADS = 2;
const getTransitionDuration = () => {
const duration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--page-transition-duration').trim()) || 0.3;
return isNaN(duration) || duration <= 0 ? 0.3 : duration;};
const fadeInOut = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: getTransitionDuration() }};
const slideUp = { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: -20, opacity: 0 }, transition: { duration: getTransitionDuration() }};
const staggerChildren = { animate: { transition: { staggerChildren: getTransitionDuration() / 3 }}};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy: ', err);
    // Fallback method
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }
    document.body.removeChild(textArea);
  }
};
interface ThemeSettings {
  backgroundImage: string
  textColor: string
  hyperlinkColor: string
  tableColor: string
  tableOpacity: number
  contextMenuColor: string
  contextMenuOpacity: number
  backgroundAnimationDuration: number
  pageTransitionDuration: number
  backgroundOverlay: string
  backgroundAnimationStyle: 'zoom' | 'sideBySide' | 'dynamic'
  indexerAnimationStyle: 'fade' | 'scroll' | 'bounce'
  isDarkMode: boolean
}

export default function FileExplorer() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [files, setFiles] = useState<FileInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [downloads, setDownloads] = useState<{ 
    [fileName: string]: { id: string; progress: number; speed: number; sizes: number[]; lastUpdate: number; }; }>({});
  const [mediaPreview, setMediaPreview] = useState<MediaPreview>({ 
    isOpen: false, filePath: '', fileName: '', src: '', type: '', isPersistent: false, currentIndex: 0, totalFiles: 0 })
  const [audioPlayer, setAudioPlayer] = useState<AudioPlayerType>({ 
    isPlaying: false, filePath: '', fileName: '', currentIndex: 0, totalFiles: 0 })
  const [currentPage, setCurrentPage] = useState(1)
  const abortControllersRef = useRef<{ [fileName: string]: AbortController }>({})
  const { theme: nextTheme, setTheme: setNextTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isVideoDirectory, setIsVideoDirectory] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [notification, setNotification] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean; isFile: boolean; isDirectory: boolean; filePath: string; fileName: string; showFileOptions: boolean; }>({
    x: 0, y: 0, visible: false, isFile: false, isDirectory: false, filePath: '', fileName: '', showFileOptions: false, });
  const [uploadProgress, setUploadProgress] = useState<{ inProgress: boolean; progress: number; completed: boolean; fileName?: string; } | null>(null);
  const { toast } = useToast()
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)
  const [currentDownloadIndex, setCurrentDownloadIndex] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadXhr, setUploadXhr] = useState<XMLHttpRequest | null>(null)
  const [isThemeManagerOpen, setIsThemeManagerOpen] = useState(false);
  const { theme, setTheme } = useThemeContext();

  const hexToRgb = useCallback((hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0';
  }, []);


  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    fetchFiles(currentPath.join('/'), searchTerm, 1)
  }, [currentPath, searchTerm])


  const updateCurrentPath = useCallback((newPath: string) => {
    const decodedPath = decodeURIComponent(newPath)
    setCurrentPath(decodedPath ? decodedPath.split('/') : [])
  }, [])

  useEffect(() => {
    const savedSettings = localStorage.getItem('themeSettings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      document.documentElement.style.setProperty('--background-image', `url(${settings.backgroundImage})`)
      document.documentElement.style.setProperty('--text-color', settings.textColor)
      document.documentElement.style.setProperty('--hyperlink-color', settings.hyperlinkColor)
      document.documentElement.style.setProperty('--table-color', `rgba(${hexToRgb(settings.tableColor)}, ${settings.tableOpacity})`)
      document.documentElement.style.setProperty('--context-menu-color', `rgba(${hexToRgb(settings.contextMenuColor)}, ${settings.contextMenuOpacity})`)
      document.documentElement.style.setProperty('--background-animation-duration', `${settings.backgroundAnimationDuration}s`)
      document.documentElement.style.setProperty('--page-transition-duration', `${settings.pageTransitionDuration}s`)
      document.documentElement.style.setProperty('--background-overlay', settings.backgroundOverlay)
      document.documentElement.style.setProperty('--background-animation-style', settings.backgroundAnimationStyle)
      document.documentElement.style.setProperty('--indexer-animation-style', settings.indexerAnimationStyle)
      if (settings.isDarkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [])


  useEffect(() => {
    const path = searchParams.get('path') || ''
    updateCurrentPath(path)
  }, [searchParams, updateCurrentPath])

  useEffect(() => {
    const handleRouteChange = () => {
      const path = searchParams.get('path') || ''
      updateCurrentPath(path)
    }

    window.addEventListener('popstate', handleRouteChange)

    return () => {
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [searchParams, updateCurrentPath])

  useEffect(() => {
    return () => {
      Object.values(abortControllersRef.current).forEach(controller => controller.abort())
      setDownloads({})
    }
  }, [])

  const fetchFiles = async (subdir: string, search: string, page: number) => {
    setIsLoading(true)
    setIsSearching(!!search)
    try {
      const url = `/api/files?subdir=${encodeURIComponent(subdir)}&search=${encodeURIComponent(search)}&page=${page}` 
      const response = await fetch(url)
      const data = await response.json()
      const onlyVideoFiles = data.files.every((file: FileInfo) =>
        file.type === 'file' && ['.mkv', '.mov', '.mp4'].some(ext => file.name.toLowerCase().endsWith(ext))
      )
      setIsVideoDirectory(onlyVideoFiles && data.files.length > 0)

      if (response.ok) {
        if (Array.isArray(data.files)) {
          setFiles(data.files)
          setCurrentPage(data.currentPage)
        } else {
          setFiles([])
        }
      } else {
        throw new Error(data.error || `Failed to fetch files: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error fetching files:', error)
      setFiles([])
    } finally {
      setIsLoading(false)
    }
  }

  const navigateToSubdirectory = (folderName: string) => {
    const newPath = [...currentPath, folderName]
    setCurrentPath(newPath)
    setSearchTerm('')
    setCurrentPage(1)
    router.push(`${pathname}?path=${encodeURIComponent(newPath.join('/'))}`)
  }

  const navigateUp = () => {
    if (currentPath.length > 0) {
      const newPath = currentPath.slice(0, -1)
      setCurrentPath(newPath)
      setSearchTerm('')
      setCurrentPage(1)
      router.push(`${pathname}?path=${encodeURIComponent(newPath.join('/'))}`)
    }
  }

  const returnToHome = () => {
    setCurrentPath([])
    setSearchTerm('')
    setIsSearching(false)
    setCurrentPage(1)
    router.push(pathname)
  }


  const handleDownload = async (filePath: string, fileName: string) => {
    if (Object.keys(downloads).length >= MAX_SIMULTANEOUS_DOWNLOADS) {
      showNotification(`Maximum of ${MAX_SIMULTANEOUS_DOWNLOADS} simultaneous downloads allowed. Please wait for a download to finish.`);
      return;
    }
    try {
      abortControllersRef.current[fileName] = new AbortController();
      const signal = abortControllersRef.current[fileName].signal;

      console.log('Download started:', fileName);

      const response = await fetch(`/api/files/download?file=${encodeURIComponent(filePath)}`, { signal });
      if (response.ok) {
        const contentLength = response.headers.get('Content-Length');
        const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
        let receivedSize = 0;
        let startTime = Date.now();

        setDownloads(prev => ({
          ...prev,
          [fileName]: { id: uuidv4(), progress: 0, speed: 0, sizes: [], lastUpdate: Date.now() }
        }));

        const reader = response.body?.getReader();
        const chunks: Uint8Array[] = [];

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            chunks.push(value);
            receivedSize += value.length;

            const now = Date.now();
            const elapsedSeconds = (now - startTime) / 1000;
            const speed = receivedSize / elapsedSeconds;

            const progress = totalSize > 0 ? Math.min(100, (receivedSize / totalSize) * 100) : 0;

            setDownloads(prev => ({
              ...prev,
              [fileName]: {
                ...prev[fileName],
                progress,
                speed,
                lastUpdate: now
              }
            }));
          }
        }

        const blob = new Blob(chunks);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        console.log('Download completed:', fileName);
      } else {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Download cancelled:', fileName);
      } else {
        console.error('Error downloading file:', fileName, error);
        showNotification(`Failed to download file ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setDownloads(prev => {
        const newDownloads = { ...prev };
        delete newDownloads[fileName];
        return newDownloads;
      });
      delete abortControllersRef.current[fileName];
    }
  };

  const cancelDownload = (id: string) => {
    const fileName = Object.keys(downloads).find(key => downloads[key].id === id);
    if (fileName && abortControllersRef.current[fileName]) {
      abortControllersRef.current[fileName].abort();
    }
    setDownloads(prev => {
      const newDownloads = { ...prev };
      delete newDownloads[fileName];
      return newDownloads;
    });
  };

  const toggleTheme = () => {
    setIsThemeManagerOpen(true);
  }

  const openMediaPreview = (filePath: string, fileName: string) => {
    console.log('Opening media preview:', { filePath, fileName })
    const encodedFilePath = encodeURIComponent(filePath.replace(/\\/g, '/'))
    const src = `/api/files/stream?file=${encodedFilePath}`
    if (isVideoFile(fileName)) {
      setAudioPlayer({ isPlaying: false, filePath: '', fileName: '', currentIndex: 0, totalFiles: 0 })

      const videoFiles = files.filter(file => isVideoFile(file.name))
      const index = videoFiles.findIndex(file => file.name === fileName)
      setMediaPreview({
        isOpen: true,
        filePath: encodedFilePath,
        fileName,
        src,
        type: 'video',
        isPersistent: false,
        currentIndex: index,
        totalFiles: videoFiles.length
      })
    } else if (isAudioFile(fileName)) {
      setMediaPreview({ isOpen: false, filePath: '', fileName: '', src: '', type: '', isPersistent: false, currentIndex: 0, totalFiles: 0 })

      const audioFiles = files.filter(file => isAudioFile(file.name))
      const index = audioFiles.findIndex(file => file.name === fileName)
      setAudioPlayer({
        isPlaying: true,
        filePath: encodedFilePath,
        fileName,
        currentIndex: index,
        totalFiles: audioFiles.length
      })
    }
  }

  const closeMediaPreview = () => {
    setMediaPreview({ isOpen: false, filePath: '', fileName: '', src: '', type: '', isPersistent: false, currentIndex: 0, totalFiles: 0 })
    if (videoRef.current) {
      videoRef.current.pause()
    }
    setAudioPlayer({ isPlaying: false, filePath: '', fileName: '', currentIndex: 0, totalFiles: 0 })
  }

  const closeAudioPlayer = () => {
    setAudioPlayer({ isPlaying: false, filePath: '', fileName: '', currentIndex: 0, totalFiles: 0 })
  }

  const toggleAudioPlayback = (filePath: string, fileName: string) => {
    const encodedFilePath = encodeURIComponent(filePath.replace(/\\/g, '/'))
    if (audioPlayer.isPlaying && audioPlayer.filePath === encodedFilePath) {
      setAudioPlayer({ isPlaying: false, filePath: '', fileName: '', currentIndex: 0, totalFiles: 0 })
    } else {
      setAudioPlayer({ isPlaying: true, filePath: encodedFilePath, fileName })
    }
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    fetchFiles(currentPath.join('/'), searchTerm, newPage)
  }


  const backgroundImage = theme === 'dark' ? 'url(https://theinnercircle.gg/ic2dark.jpg)' : 'url(https://theinnercircle.gg/ic2.jpg)'

  const goToNextMedia = () => {
    const videoFiles = files.filter(file => isVideoFile(file.name))
    if (videoFiles.length === 0) {
      console.warn('No video files available')
      return
    }
    const nextIndex = (mediaPreview.currentIndex + 1) % videoFiles.length
    const nextFile = videoFiles[nextIndex]
    if (nextFile) {
      openMediaPreview(nextFile.path || [...currentPath, nextFile.name].join('/'), nextFile.name)
    } else {
      console.warn('Unable to find next video file')
    }
  }

  const goToPreviousMedia = () => {
    const videoFiles = files.filter(file => isVideoFile(file.name))
    if (videoFiles.length === 0) {
      console.warn('No video files available')
      return
    }
    const previousIndex = (mediaPreview.currentIndex - 1 + videoFiles.length) % videoFiles.length
    const previousFile = videoFiles[previousIndex]
    if (previousFile) {
      openMediaPreview(previousFile.path || [...currentPath, previousFile.name].join('/'), previousFile.name)
    } else {
      console.warn('Unable to find previous video file')
    }
  }

  const isVideoFile = (fileName: string) => {
    return fileName.toLowerCase().endsWith('.mp4') ||
           fileName.toLowerCase().endsWith('.mkv') ||
           fileName.toLowerCase().endsWith('.mov')
  }

  const isAudioFile = (fileName: string) => {
    return fileName.toLowerCase().endsWith('.mp3') ||
           fileName.toLowerCase().endsWith('.wav') ||
           fileName.toLowerCase().endsWith('.ogg')
  }

  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeMediaPreview();
    }
  };

  const goToNextAudio = () => {
    const audioFiles = files.filter(file => isAudioFile(file.name))
    if (audioFiles.length === 0) return
    const nextIndex = (audioPlayer.currentIndex + 1) % audioFiles.length
    const nextFile = audioFiles[nextIndex]
    if (nextFile) {
      openMediaPreview(nextFile.path || [...currentPath, nextFile.name].join('/'), nextFile.name)
    }
  }

  const goToPreviousAudio = () => {
    const audioFiles = files.filter(file => isAudioFile(file.name))
    if (audioFiles.length === 0) return
    const previousIndex = (audioPlayer.currentIndex - 1 + audioFiles.length) % audioFiles.length
    const previousFile = audioFiles[previousIndex]
    if (previousFile) {
      openMediaPreview(previousFile.path || [...currentPath, previousFile.name].join('/'), previousFile.name)
    }
  }

  const getAdjacentAudio = (direction: 'next' | 'previous') => {
    const audioFiles = files
      .filter(file => isAudioFile(file.name))
      .sort((a, b) => a.name.localeCompare(b.name));
    if (audioFiles.length === 0) return null;
    const newIndex = direction === 'next'
      ? (audioPlayer.currentIndex + 1) % audioFiles.length
      : (audioPlayer.currentIndex - 1 + audioFiles.length) % audioFiles.length;
    const adjacentFile = audioFiles[newIndex];
    if (adjacentFile) {
      const filePath = adjacentFile.path || [...currentPath, adjacentFile.name].join('/');
      const encodedFilePath = encodeURIComponent(filePath.replace(/\\/g, '/'));
      return {
        src: `/api/files/stream?file=${encodedFilePath}`,
        fileName: adjacentFile.name
      };
    }
    return null;
  };

  const handleContextMenu = (e: React.MouseEvent, file?: FileInfo) => {
    e.preventDefault();
    e.stopPropagation();
    const showFileOptions = !!file;
    const filePath = file ? file.path || path.join(...currentPath, file.name) : currentPath.join('/');
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      visible: true,
      isFile: file ? !file.isDirectory : false,
      isDirectory: file ? file.isDirectory : true,
      filePath: filePath,
      fileName: file ? file.name : '',
      showFileOptions,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

   const createPublicDownloadLink = async () => {
    try {
      const endpoint = contextMenu.isFile ? '/api/create-public-link' : '/api/create-public-directory-link';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath: contextMenu.filePath,
          fileName: contextMenu.fileName,
          directoryPath: contextMenu.filePath, // for directory links
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create public link');
      }

      const data = await response.json();
      const linkUrl = contextMenu.isFile
        ? `http://innercircle.store/download/${data.publicLink.split('/').pop()}`
        : `http://innercircle.store/media-gallery/${data.publicDirectoryLink.split('/').pop()}`;
      await copyToClipboard(linkUrl);
      window.scrollTo({ top: 100, behavior: 'smooth' });
      setNotification('PUBLIC LINK COPIED TO CLIPBOARD');
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error creating public link:', error);
      setNotification('Failed to create link. Please try again.');
      setTimeout(() => setNotification(null), 3000);
    }
    closeContextMenu();
  };
const NotificationBubble = ({ message }: { message: string }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="fixed top-4 right-4 bg-green-500 text-white px-4 py-5 rounded-full shadow-lg z-50 notification-bubble"
  >
    {message}
  </motion.div>
);


  const handleSetCustomThumbnail = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('filePath', contextMenu.filePath);

        try {
          const response = await fetch('/api/upload-thumbnail', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const data = await response.json();
            showNotification('Custom thumbnail uploaded successfully');
            fetchFiles(currentPath.join('/'), searchTerm, currentPage);
          } else {
            throw new Error('Failed to upload thumbnail');
          }
        } catch (error) {
          console.error('Error uploading thumbnail:', error);
          showNotification('Failed to upload thumbnail. Please try again.');
        }
      }
    };
    input.click();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenu.visible && !(event.target as HTMLElement).closest('.custom-context-menu')) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu.visible]);

  const handleCreateFolder = async (folderName: string) => {
    try {
      const response = await fetch('/api/create-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: currentPath.join('/'),
          folderName: folderName
        })
      });

      if (response.ok) {
        showNotification('Folder created successfully');
        fetchFiles(currentPath.join('/'), searchTerm, currentPage);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create folder');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      showNotification('Failed to create folder. Please try again.');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setUploadProgress({ inProgress: true, progress: 0, completed: false, fileName: files[0].name })
    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i])
    }
    formData.append('path', currentPath.join('/'))

    try {
      const xhr = new XMLHttpRequest();
      setUploadXhr(xhr)
      xhr.open('POST', '/api/upload', true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(prev => ({...prev, progress: percentComplete, fileName: files[0].name}))
        }
      };

      xhr.onload = function() {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText);
          showNotification(`${files[0].name}${files.length > 1 ? ` and ${files.length - 1} other file(s)` : ''} uploaded successfully`);
          toast({
            title: 'Files uploaded!',
            description: `File(s) ${result.files.join(', ')} uploaded successfully`,
          });
          onRefresh(); 
          closeContextMenu(); 
          setUploadProgress({ inProgress: false, progress: 100, completed: true, fileName: files[0].name })
        } else {
          throw new Error('Upload failed');
        }
      };

      xhr.onerror = function() {
        throw new Error('Upload failed');
      };

      xhr.send(formData);
    } catch (error) {
      console.error('Error uploading files:', error);
      showNotification('Failed to upload file(s). Please try again.');
      toast({
        title: 'Error uploading files',
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      setUploadProgress({ inProgress: false, progress: 0, completed: false })
    } finally {
      setIsUploading(false)
      setUploadXhr(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCancelUpload = () => {
    if (uploadXhr) {
      uploadXhr.abort()
      setUploadXhr(null)
      setIsUploading(false)
      setUploadProgress(null)
      showNotification('Upload cancelled')
    }
  }

  const onRefresh = () => {
    fetchFiles(currentPath.join('/'), searchTerm, currentPage)
  }

  const handleDownloadAllFiles = async () => {
    if (currentPath.length === 0) return; 
    setIsDownloadingAll(true)
    setCurrentDownloadIndex(0)
    const filesToDownload = files.filter(file => !file.isDirectory)
    for (let i = 0; i < filesToDownload.length; i++) {
      const file = filesToDownload[i]
      const filePath = file.path || [...currentPath, file.name].join('/')
      setCurrentDownloadIndex(i)
      await handleDownload(filePath, file.name)
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    setIsDownloadingAll(false)
    setCurrentDownloadIndex(0)
  }
  const handleDelete = async (filePath: string, currentDirectory: string) => {
    try {
      const response = await fetch('/api/delete-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath, currentDirectory }),
      });
      if (response.ok) {
        showNotification('File or directory deleted successfully');
        onRefresh(); 
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete file or directory');
      }
    } catch (error) {
      console.error('Error deleting file or directory:', error);
      showNotification('NOT AN USER GENERATED FILE/FOLDER.');
    }
    closeContextMenu();
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), getTransitionDuration() * 1000 + 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (message: string) => {
    setNotification(message);
  };

  return (
    <>
      <div className="relative min-h-screen overflow-hidden" onContextMenu={(e) => handleContextMenu(e)}>
        <div
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat bg-scroll ${
            theme.backgroundAnimationStyle === 'zoom'
              ? 'animate-background-zoom'
              : theme.backgroundAnimationStyle === 'sideBySide'
              ? 'animate-background-side-to-side'
              : 'animate-background-dynamic'
          }`}
          style={{
            backgroundImage: `url(${theme.backgroundImage})`,
            filter: 'blur(10px)',
          }}
        />
        <div className="fixed inset-0 bg-gradient-radial from-transparent via-white/10 to-white dark:via-gray-800/20 dark:to-black" />
        <motion.div
          className="container mx-auto p-4 relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{
            duration: theme.pageTransitionDuration,
            type: theme.indexerAnimationStyle === 'bounce' ? 'spring' : 'tween',
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-300 flex items-center">
              <Folder className="mr-2 h-8 w-8 text-blue-500" aria-hidden="true" />
              INNER-CIRCLE.STORE
            </h1>
          </div>

          {/* Main Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPath.join('/')}
              className="bg-white/70 dark:bg-opacity-90 dark:bg-black/70 shadow-md rounded-lg overflow-hidden mb-16 backdrop-blur-sm p-2"
              style={{ 
                backgroundColor: `color-mix(in srgb, var(--table-color), transparent)`,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: getTransitionDuration() }}
            >
              {/* Navigation and Search */}
              <div className="bg-white/10 dark:bg-black flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {currentPath.length > 0 && (
                    <Button
                      onClick={navigateUp}
                      disabled={isSearching}
                      variant="outline"
                      size="m"
                      className="flex items-center"
                      arialabel="Go up one directory"
                    >
                      <ArrowUp className="h-4 w-4 mr-2" aria-hidden="true" />
                      Go up
                    </Button>
                  )}
                  {isSearching && (
                    <Button
                      onClick={returnToHome}
                      variant="outline"
                      size="sm"
                      className="flex items-center"
                      aria-label="Return to home directory"
                    >
                      <Home className="h-4 w-4 mr-1" aria-hidden="true" />
                      Return to Home
                    </Button>
                  )}
                  <span className="font-bold text-gray-500 dark:text-gray-400 flex items-center ">
                    <ChevronRight className="h-6 w-6 mr-1"                    />
                    {isSearching ? 'Search Results' : (currentPath.length === 0 ? 'HOME' : currentPath.join(' / '))}
                  </span>
                </div>

                {currentPath.length > 0 && (                  <div className="flex items-center space-x-2">
                    <Input
                      type="text"
                      placeholder="Search files..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="sm"
                      aria-label="Search files"
                    />
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
                          <Moon className="mr-2 text-gray600"                          aria-hidden="true" />
                          DARK
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* File Explorer Content */}
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    className="p-4 text-center"
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: getTransitionDuration() }}
                  >
                    Loading...
                  </motion.div>
                ) : files.length > 0 ? (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: getTransitionDuration() }}
                  >
                    {currentPath.length === 0 ? (
                      <RootDirectoryView
                        files={files}
                        navigateToSubdirectory={navigateToSubdirectory}
                        onContextMenu={(e, file) => handleContextMenu(e, file)}
                      />
                    ) : (
                      <>
                        {(currentPath[0].startsWith('INNERCIRCLE.') || currentPath[0].startsWith('MUSIC.')) ? (
                          <InnerCircleSubdirectoryView
                            files={files}
                            currentPath={currentPath}
                            handleDownload={handleDownload}
                            openMediaPreview={openMediaPreview}
                            audioPlayer={audioPlayer}
                            navigateToSubdirectory={navigateToSubdirectory}
                            downloadProgress={downloads}
                            goToNextMedia={goToNextMedia}
                            goToPreviousMedia={goToPreviousMedia}
                            onContextMenu={(e, file) => handleContextMenu(e, file)}
                            onCreateFolder={handleCreateFolder}
                            uploadProgress={uploadProgress}
                            handleUpload={handleUpload}
                            isUploading={isUploading}
                            isDownloadingAll={isDownloadingAll}
                            cancelDownload={cancelDownload}
                            handleCancelUpload={handleCancelUpload}
                          />
                        ) : (
                          <FileListView
                            files={files}
                            currentPath={currentPath}
                            handleDownload={handleDownload}
                            openVideoPreview={openMediaPreview}
                            toggleAudioPlayback={toggleAudioPlayback}
                            audioPlayer={audioPlayer}
                            navigateToSubdirectory={navigateToSubdirectory}
                            isSearching={isSearching}
                            cancelDownload={cancelDownload}
                            downloadProgress={downloads}
                            handleZipDownload={() => {}}
                            isZipping={false}
                            isVideoDirectory={isVideoDirectory}
                            onContextMenu={(e, file) => handleContextMenu(e, file)}
                          />
                        )}
                      </>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    className="p-4 text-center text-gray-700 dark:text-gray-400"
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: getTransitionDuration() }}
                  >
                    No files found. Current path: {currentPath.join('/')}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>

          {/* Custom Context Menu */}
          <AnimatePresence>
            {contextMenu.visible && (
              <CustomContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                onClose={closeContextMenu}
                onCreatePublicLink={createPublicDownloadLink}
                isFile={contextMenu.isFile}
                isDirectory={contextMenu.isDirectory}
                setCustomThumbnail={handleSetCustomThumbnail}
                currentPath={currentPath}
                showFileOptions={contextMenu.showFileOptions}
                onCreateFolder={handleCreateFolder}
                onRefresh={onRefresh}
                handleUpload={handleUpload}
                handleDownloadAllFiles={handleDownloadAllFiles}
                isRootFolder={currentPath.length === 0}
                onDelete={(filePath) => handleDelete(filePath, currentPath.join('/'))}
                filePath={contextMenu.filePath}
                onOpenThemeManager={() => setIsThemeManagerOpen(true)}
              />
            )}
          </AnimatePresence>

          {/* Notifications */}
          <AnimatePresence>
            {notification && <NotificationBubble message={notification} />}
          </AnimatePresence>

          {/* Download Progress Bars */}
          <ElegantProgressBar
            items={[
              ...Object.entries(downloads).map(([fileName, { id, progress }]) => ({
                id,
                progress,
                label: `Downloading ${fileName}...`,
                fileName,
                filePath: currentPath.join('/')
              })),
              ...(isDownloadingAll ? [{
                id: 'downloadAll',
                progress: (currentDownloadIndex + 1) / files.filter(f => !f.isDirectory).length * 100,
                label: `Downloading all files (${currentDownloadIndex + 1}/${files.filter(f => !f.isDirectory).length})`,
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
            ]}
            onCancel={(id) => {
              if (id === 'downloadAll') {
                setIsDownloadingAll(false);
                setCurrentDownloadIndex(0);
              } else if (id === 'upload') {
                handleCancelUpload();
              } else {
                cancelDownload(id);
              }
            }}
          />

          {/* Audio Player */}
          <AnimatePresence>
            {audioPlayer.isPlaying && (
              <AudioPlayer
                key={audioPlayer.filePath}
                src={`/api/files/stream?file=${audioPlayer.filePath}`}
                fileName={audioPlayer.fileName}
                onClose={closeAudioPlayer}
                currentIndex={audioPlayer.currentIndex}
                setCurrentIndex={(index) => setAudioPlayer(prev => ({ ...prev, currentIndex: index }))}
                totalFiles={audioPlayer.totalFiles}
                getAdjacentAudio={getAdjacentAudio}
                handleDownload={handleDownload}
              />
            )}
          </AnimatePresence>

          {/* Media Preview */}
          {mediaPreview.isOpen && mediaPreview.type === 'video' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: getTransitionDuration() }}
              className={`fixed inset-0 bg-black/80 flex items-center justify-center z-50`}
              onClick={handleOutsideClick}
            >
              <div className={`relative w-full h-full max-w-7xl max-h-[90vh] flex flex-col`} onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4">
                  <h2 className="text-xl font-bold text-white">{mediaPreview.fileName}</h2>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => setIsMuted(!isMuted)}
                      variant="ghost"
                      size="sm"
                      className="text-white"
                      aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                    </Button>
                    <Button onClick={() => closeMediaPreview()} variant="ghost" size="sm" className="text-white" aria-label="Close media preview">
                      <X className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
                <div className="relative flex-grow flex items-center justify-center">
                  <video
                    ref={videoRef}
                    key={mediaPreview.src}
                    controls
                    autoPlay
                    muted={isMuted}
                    className="max-w-full max-h-full"
                    aria-label={`Video preview of ${mediaPreview.fileName}`}
                    onError={(e) => {
                      console.error('Video playback error:', e.currentTarget.error)
                      showNotification(`Failed to load video: ${e.currentTarget.error?.message || 'Unknown error'}. Please try downloading the file instead.`);
                    }}
                  >
                    <source
                      src={mediaPreview.src}
                      type="video/mp4"
                      onError={(e) => {
                        console.error('Source error:', e)
                      }}
                    />
                    Your browser does not support the video tag.
                  </video>
                  <Button
                    onClick={goToPreviousMedia}
                    variant="ghost"
                    size="sm"
                    className={`absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70`}
                    aria-label="Previous video"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    onClick={goToNextMedia}
                    variant="ghost"
                    size="sm"
                    className={`absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70`}
                    aria-label="Next video"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
        {/* Theme Manager Dialog */}
        <Dialog open={isThemeManagerOpen} fullheight={ false } maxheight={"md"} fullWidth={ true } maxWidth={"md"} onOpenChange={setIsThemeManagerOpen}>
          <DialogContent className="w-full h-full max-h-6xl max-w-6xl ">
            <ThemeManager
              onClose={() => setIsThemeManagerOpen(false)}
              className="theme-manager-dialog"
              isDarkMode={theme.isDarkMode}
            />
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}

