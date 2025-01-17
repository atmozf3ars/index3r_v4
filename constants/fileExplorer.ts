import { Headphones, Image, Music, Folder, Users, Unlock } from 'lucide-react'
import { SectionConfig } from '../types/fileExplorer'

export const SECTION_CONFIG: { [key: string]: SectionConfig } = {
  'AUDIO SOFTWARE SECTION': {
      icon: Headphones,
      color: 'text-gray-600 dark:text-pink-400',
      bgColor: 'bg-white-100 dark:bg-black dark:bg-opacity-50',
  },
  'INNERCIRCLE': {
      icon: Users,
      color: 'text-gray-500 dark:text-cyan-400',
      bgColor: 'bg-white-100 dark:bg-black dark:bg-opacity-50',
  },
  'MUSIC SECTION': {
      icon: Music,
      color: 'text-gray-500 dark:text-green-400',
      bgColor: 'bg-white-100 dark:bg-black',
  },
  'OUTER ORBIT': {
      icon: Image,
      color: 'text-gray-500 dark:text-purple-400',
      bgColor: 'bg-white-100 dark:bg-black dark:bg-opacity-50',
  },
  'OTHER': {
      icon: Folder,
      color: 'text-gray-500 dark:text-cyan-400',
      bgColor: 'bg-white-100 dark:bg-black',
  },
  'OPEN SECTION': {
      icon: Unlock,
      color: 'text-gray-500 dark:text-yellow-400',
      bgColor: 'bg-white-100 dark:bg-black',
  },
}


export const VIDEO_EXTENSIONS = ['.mkv', '.mov', '.mp4']
export const MAX_SIMULTANEOUS_DOWNLOADS = 3
export const MAX_RETRIES = 3
export const CHUNK_SIZE = 1024 * 1024 * 5 // 5MB chunks

