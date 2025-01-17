import { FileInfo } from '../types/fileExplorer'

export const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB'
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB'
    else return (bytes / 1073741824).toFixed(2) + ' GB'
}

export const isArchiveFile = (fileName: string): boolean => {
    const archiveExtensions = ['.zip', '.rar', '.7z', '.tar', '.gz']
    return archiveExtensions.some(ext => fileName.toLowerCase().endsWith(ext))
}

export const isAudioFile = (fileName: string): boolean => {
    return fileName.toLowerCase().endsWith('.mp3') || fileName.toLowerCase().endsWith('.wav')
}

export const groupDirectories = (files: FileInfo[]) => {
    const groups: { [key: string]: FileInfo[] } = {
        'AUDIO SOFTWARE SECTION': [],
        'INNERCIRCLE': [],
        'MUSIC SECTION': [],
        'OUTER ORBIT': [],
        'OTHER': []
    }

    files.forEach(file => {
        if (file.isDirectory && !file.name.startsWith('NO.')) {
            let category = 'OTHER'
            let displayName = file.name

            if (file.name.startsWith('AUDIO.')) {
                category = 'AUDIO SOFTWARE SECTION'
                displayName = file.name.replace(/^AUDIO\./, '')

            } else if (file.name.startsWith('INNERCIRCLE.')) {
                category = 'INNERCIRCLE'
                displayName = file.name.replace(/^INNERCIRCLE\./, '')
            } else if (file.name.startsWith('MUSIC.')) {
                category = 'MUSIC SECTION'
                displayName = file.name.replace(/^MUSIC\./, '')
            } else if (file.name.startsWith('GFX.')) {
                category = 'OUTER ORBIT'
                displayName = file.name.replace(/^GFX\./, '')
            } else if (file.name.startsWith('OTHER.')) {
                category = 'OTHER'
                displayName = file.name.replace(/^OTHER\./, '')
            }

            groups[category].push({ ...file, displayName })
        }
    })

    return groups
}
