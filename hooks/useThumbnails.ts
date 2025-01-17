import { useState, useCallback, useEffect } from 'react';
import { FileInfo } from '../types/fileExplorer';

export function useThumbnails(initialFiles: FileInfo[]) {
  const [filesWithThumbnails, setFilesWithThumbnails] = useState<(FileInfo & { thumbnail?: string })[]>(initialFiles);
  const [cachedThumbnails, setCachedThumbnails] = useState<{ [key: string]: string | null }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getThumbnailUrl = useCallback(async (file: FileInfo) => {
    if (cachedThumbnails.hasOwnProperty(file.name)) {
      return cachedThumbnails[file.name];
    }
    const customThumbnail = `/thumbnails/${file.name}.jpg`;
    
    try {
      const response = await fetch(customThumbnail, { method: 'HEAD' });
      const thumbnailUrl = response.ok ? customThumbnail : null;
      setCachedThumbnails(prev => ({ ...prev, [file.name]: thumbnailUrl }));
      return thumbnailUrl;
    } catch {
      setCachedThumbnails(prev => ({ ...prev, [file.name]: null }));
      return null;
    }
  }, [cachedThumbnails]);

  const fetchThumbnails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedFiles = await Promise.all(
        initialFiles.map(async (file) => {
          const thumbnail = await getThumbnailUrl(file);
          return { ...file, thumbnail };
        })
      );
      setFilesWithThumbnails(updatedFiles);
    } catch (err) {
      console.error('Error fetching thumbnails:', err);
      setError('Failed to load thumbnails. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  }, [initialFiles, getThumbnailUrl]);

  useEffect(() => {
    const storedThumbnails = localStorage.getItem('cachedThumbnails');
    if (storedThumbnails) {
      setCachedThumbnails(JSON.parse(storedThumbnails));
    }
    fetchThumbnails();
  }, [fetchThumbnails]);

  useEffect(() => {
    localStorage.setItem('cachedThumbnails', JSON.stringify(cachedThumbnails));
  }, [cachedThumbnails]);

  return { filesWithThumbnails, isLoading, error, fetchThumbnails };
}

