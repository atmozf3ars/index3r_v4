import { Folder, Terminal, Archive, FileAudio, FileImage, FileVideo, FileCode, FileText, File } from 'lucide-react'
import React from 'react';

// Assume these components are defined elsewhere in your project.  Replace with your actual imports if different.
interface FileIconProps {
    fileName: string;
}

const isArchiveFile = (fileName: string): boolean => {
    // Add your logic to determine if a file is an archive
    return false;
};

const isAudioFile = (fileName: string): boolean => {
    // Add your logic to determine if a file is an audio file
    return false;
};

const FileArchive: React.FC<{ className?: string; ariaLabel?: string }> = ({ className, ariaLabel }) => (
    <svg className={className} aria-label={ariaLabel} viewBox="0 0 20 20" fill="currentColor">
        {/* Replace with your actual archive icon SVG */}
        <path d="M10 20a10 10 0 100-20 10 10 0 000 20zm0-2a8 8 0 110-16 8 8 0 010 16z" />
    </svg>
);

//const FileAudio: React.FC<{ className?: string; ariaLabel?: string }> = ({ className, ariaLabel }) => (
//    <svg className={className} aria-label={ariaLabel} viewBox="0 0 20 20" fill="currentColor">
 //       {/* Replace with your actual audio icon SVG */}
 //       <path d="M10 20a10 10 0 100-20 10 10 0 000 20zm0-2a8 8 0 110-16 8 8 0 010 16z" />
 //   </svg>
//);

const FileImage: React.FC<{ className?: string; ariaLabel?: string }> = ({ className, ariaLabel }) => (
    <svg className={className} aria-label={ariaLabel} viewBox="0 0 20 20" fill="currentColor">
        {/* Replace with your actual image icon SVG */}
        <path d="M10 20a10 10 0 100-20 10 10 0 000 20zm0-2a8 8 0 110-16 8 8 0 010 16z" />
    </svg>
);

const FileVideo: React.FC<{ className?: string; ariaLabel?: string }> = ({ className, ariaLabel }) => (
    <svg className={className} aria-label={ariaLabel} viewBox="0 0 20 20" fill="currentColor">
        {/* Replace with your actual video icon SVG */}
        <path d="M10 20a10 10 0 100-20 10 10 0 000 20zm0-2a8 8 0 110-16 8 8 0 010 16z" />
    </svg>
);

const FileCode: React.FC<{ className?: string; ariaLabel?: string }> = ({ className, ariaLabel }) => (
    <svg className={className} aria-label={ariaLabel} viewBox="0 0 20 20" fill="currentColor">
        {/* Replace with your actual code icon SVG */}
        <path d="M10 20a10 10 0 100-20 10 10 0 000 20zm0-2a8 8 0 110-16 8 8 0 010 16z" />
    </svg>
);

const FileText: React.FC<{ className?: string; ariaLabel?: string }> = ({ className, ariaLabel }) => (
    <svg className={className} aria-label={ariaLabel} viewBox="0 0 20 20" fill="currentColor">
        {/* Replace with your actual text icon SVG */}
        <path d="M10 20a10 10 0 100-20 10 10 0 000 20zm0-2a8 8 0 110-16 8 8 0 010 16z" />
    </svg>
);

const File: React.FC<{ className?: string; ariaLabel?: string }> = ({ className, ariaLabel }) => (
    <svg className={className} aria-label={ariaLabel} viewBox="0 0 20 20" fill="currentColor">
        {/* Replace with your actual file icon SVG */}
        <path d="M10 20a10 10 0 100-20 10 10 0 000 20zm0-2a8 8 0 110-16 8 8 0 010 16z" />
    </svg>
);


export const FileIcon: React.FC<FileIconProps> = ({ fileName }) => {
    if (fileName.endsWith('.exe')) {
        return <Terminal className="h-5 w-5 text-blue-500" aria-label="Executable file" />
    } else if (fileName.endsWith('.rar') || fileName.endsWith('.zip')) {
        return <Archive  className="h-5 w-5 text-yellow-500 dark:text-gray-400" aria-label="Archive file" />
    } else if (isArchiveFile(fileName)) {
        return <Archive className="h-5 w-5 text-yellow-500" aria-label="Archive file" />
  //  } else if (isAudioFile(fileName)) {
   //     return <FileAudio className="h-5 w-5 text-purple-500 dark:text-cyan-400" aria-label="Audio file" />
    } else if (fileName.endsWith('.jpg') || fileName.endsWith('.png') || fileName.endsWith('.gif')) {
        return <FileImage className="h-5 w-5 text-green-500" aria-label="Image file" />
    } else if (fileName.endsWith('.mp4') || fileName.endsWith('.avi') || fileName.endsWith('.mov')) {
        return <FileVideo className="h-5 w-5 text-red-500" aria-label="Video file" />
    } else if (fileName.endsWith('.js') || fileName.endsWith('.py') || fileName.endsWith('.cpp')) {
        return <FileCode className="h-5 w-5 text-blue-500" aria-label="Code file" />
    } else if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.doc')) {
        return <FileText className="h-5 w-5 text-gray-500" aria-label="Text file" />
    } else {
        return <File className="h-5 w-5 text-gray-400" aria-label="File" />
    }
}
// export const FileIcon: React.FC<FileIconProps> = ({ fileName }) => {
//    if (isArchiveFile(fileName)) {
//
 //   } else if (isAudioFile(fileName)) {
 //       return <FileAudio className="h-5 w-5 text-purple-500 dark:text-gray-400" aria-label="Audio file" />
//    } else if (fileName.endsWith('.jpg') || fileName.endsWith('.png') || fileName.endsWith('.gif')) {
 //       return <FileImage className="h-5 w-5 text-green-500 dark:text-gray-400" aria-label="Image file" />
  //  } else if (fileName.endsWith('.mp4') || fileName.endsWith('.avi') || fileName.endsWith('.mov')) {
 //       return <FileVideo className="h-5 w-5 text-red-500 dark:text-gray-400" aria-label="Video file" />
 //   } else if (fileName.endsWith('.js') || fileName.endsWith('.py') || fileName.endsWith('.cpp')) {
 //       return <FileCode className="h-5 w-5 text-blue-500 dark:text-gray-400" aria-label="Code file" />
//    } else if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.doc')) {
//        return <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" aria-label="Text file" />
 //   } else {
//        return <File className="h-5 w-5 text-gray-400 dark:text-gray-400" aria-label="File" />
