import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { SECTION_CONFIG, LANDING_PAGE_BG_IMAGE } from '../constants/fileExplorer'
import { FileInfo } from '../types/fileExplorer'
import { groupDirectories } from '../utils/fileExplorer'
import Image from 'next/image'

interface RootDirectoryViewProps {
  files: FileInfo[]
  navigateToSubdirectory: (folderName: string) => void
  onContextMenu: (e: React.MouseEvent, file: FileInfo, isDirectory: boolean) => void
}

export const RootDirectoryView: React.FC<RootDirectoryViewProps> = ({ files, navigateToSubdirectory, onContextMenu }) => {
    const [filesWithThumbnails, setFilesWithThumbnails] = useState<(FileInfo & { thumbnail?: string })[]>([]);
    const [cachedThumbnails, setCachedThumbnails] = useState<{ [key: string]: string | null }>({});
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const groups = useMemo(() => groupDirectories(filesWithThumbnails), [filesWithThumbnails]);

    const allowedSections = Object.keys(SECTION_CONFIG);

    const getThumbnailUrl = useCallback(async (file: FileInfo) => {
      if (cachedThumbnails.hasOwnProperty(file.name)) {
        return cachedThumbnails[file.name];
      }
      const customThumbnail = `/thumbnails/${file.name}.jpg`;
      try {
        const response = await fetch(customThumbnail, { method: 'HEAD' });
        return response.ok ? customThumbnail : null;
      } catch {
        return null;
      }
    }, [cachedThumbnails]);

    const fetchThumbnails = useCallback(async () => {
      const updatedFiles = await Promise.all(
        files.map(async (file) => {
          if (cachedThumbnails.hasOwnProperty(file.name)) {
            return { ...file, thumbnail: cachedThumbnails[file.name] };
          }
          const thumbnail = await getThumbnailUrl(file);
          return { ...file, thumbnail };
        })
      );
      setFilesWithThumbnails(updatedFiles);
      const newCachedThumbnails = updatedFiles.reduce((acc, file) => {
        if (file.thumbnail) {
          acc[file.name] = file.thumbnail;
        }
        return acc;
      }, {...cachedThumbnails});
      setCachedThumbnails(newCachedThumbnails);
    }, [files, cachedThumbnails, getThumbnailUrl]);

    useEffect(() => {
      const storedThumbnails = localStorage.getItem('cachedThumbnails');
      if (storedThumbnails) {
        setCachedThumbnails(JSON.parse(storedThumbnails));
      }
    }, []);

    useEffect(() => {
      if (isInitialLoad) {
        fetchThumbnails();
        setIsInitialLoad(false);
      } else {
        const updatedFiles = files.map(file => ({
          ...file,
          thumbnail: cachedThumbnails[file.name] || undefined
        }));
        setFilesWithThumbnails(updatedFiles);
      }
    }, [files, isInitialLoad, fetchThumbnails, cachedThumbnails]);

    useEffect(() => {
      localStorage.setItem('cachedThumbnails', JSON.stringify(cachedThumbnails));
    }, [cachedThumbnails]);

    const renderGroup = (groupName: string, groupFiles: FileInfo[]) => {
        const Icon = SECTION_CONFIG[groupName].icon;
        return (
            <motion.div
                key={groupName}
                className={`rounded-lg shadow-md p-6 ${SECTION_CONFIG[groupName].bgColor}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
            >
                <h2 className={`text-2xl font-bold mb-4 ${SECTION_CONFIG[groupName].color}`}>{groupName}</h2>
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
                    variants={{
                        animate: {
                            transition: {
                                staggerChildren: 0.1
                            }
                        }
                    }}
                >
                    {groupFiles.map((file) => (
                        <motion.div
                            key={file.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Button
                                onClick={() => navigateToSubdirectory(file.name)}
                                onContextMenu={(e) => onContextMenu(e, file, file.isDirectory)}
                                className={`w-full h-40 p-2 rounded-lg shadow-sm hover:shadow-md transition-shadow relative overflow-hidden folder-link ${SECTION_CONFIG[groupName].color}`}
                                variant="ghost"
                            >
                                <div
                                    className="absolute inset-0 bg-cover bg-center opacity-50"
                                    style={{ backgroundImage: `url(${LANDING_PAGE_BG_IMAGE})` }}
                                />
                                <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
                                    {file.thumbnail ? (
                                        <div className="absolute inset-0">
                                            <Image
                                                src={file.thumbnail || "/placeholder.svg"}
                                                alt={`Thumbnail for ${file.name}`}
                                                layout="fill"
                                                objectFit="cover"
                                                className="rounded-lg"
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-20 hover:bg-white/30 rounded-lg" />
                                        </div>
                                    ) : (
                                        <Icon className="h-20 w-20 mb-2" aria-hidden="true" />
                                    )}
                                    <span className="absolute bottom-2 left-2 right-2 text-lg font-bold text-center break-words text-white">
                                        {file.displayName || file.name}
                                    </span>
                                </div>
                            </Button>
                        </motion.div>
                    ))}
                </motion.div>
            </motion.div>
        );
    };

    return (
        <motion.div className="space-y-8" variants={{
            animate: {
                transition: {
                    staggerChildren: 0.1
                }
            }
        }}>
            {Object.entries(groups).map(([groupName, groupFiles]) => (
                allowedSections.includes(groupName) && groupFiles.length > 0 && renderGroup(groupName, groupFiles)
            ))}
        </motion.div>
    )
}

