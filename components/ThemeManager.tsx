import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Upload, Moon, Sun } from 'lucide-react'
import { toast } from "@/components/ui/use-toast"
import { useThemeContext } from '@/context/ThemeContext'

interface ThemeManagerProps {
  onClose: () => void
  className?: string
  isDarkMode: boolean
}

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
  backgroundOverlayColor: string
  backgroundOverlayOpacity: number
  backgroundAnimationStyle: 'zoom' | 'sideBySide' | 'dynamic'
  indexerAnimationStyle: 'fade' | 'scroll' | 'bounce'
  isDarkMode: boolean
}

export function ThemeManager({ onClose, className, isDarkMode: initialIsDarkMode }: ThemeManagerProps) {
  const { theme, setTheme } = useThemeContext();
  const [settings, setSettings] = useState<ThemeSettings>({
    ...theme,
    backgroundOverlayColor: theme.backgroundOverlay.split(',')[0].slice(5) || '#ffffff',
    backgroundOverlayOpacity: parseFloat(theme.backgroundOverlay.split(',')[3]) || 0.5,
    backgroundAnimationStyle: theme.backgroundAnimationStyle || 'zoom',
    indexerAnimationStyle: theme.indexerAnimationStyle || 'fade',
    isDarkMode: initialIsDarkMode,
  });
  const [displaySettings, setDisplaySettings] = useState<ThemeSettings>(settings);

  const themeManagerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const hexToRgb = useCallback((hex: string) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => {
      return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : null;
  }, []);

  const handleChange = useCallback(
    debounce((key: keyof ThemeSettings, value: string | number | boolean) => {
      const newSettings = { ...settings, [key]: value };
      if (key === 'backgroundOverlayColor' || key === 'backgroundOverlayOpacity') {
        const color = key === 'backgroundOverlayColor' ? value : settings.backgroundOverlayColor;
        const opacity = key === 'backgroundOverlayOpacity' ? value : settings.backgroundOverlayOpacity;
        newSettings.backgroundOverlay = `rgba(${hexToRgb(color as string)}, ${opacity})`;
      }
      if (key === 'isDarkMode') {
        newSettings.textColor = value ? '#ffffff' : '#000000';
        newSettings.backgroundOverlayColor = value ? '#000000' : '#ffffff';
        newSettings.backgroundOverlayOpacity = value ? 0.7 : 0.5;
        newSettings.backgroundOverlay = `rgba(${hexToRgb(newSettings.backgroundOverlayColor)}, ${newSettings.backgroundOverlayOpacity})`;
      }
      setSettings(newSettings);
      setTheme(newSettings);
    }, 30),
    [settings, setTheme, hexToRgb]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeManagerRef.current && !themeManagerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleInputChange = (key: keyof ThemeSettings, value: string | number | boolean) => {
    setDisplaySettings(prev => ({ ...prev, [key]: value }));
    handleChange(key, value);
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await fetch('/api/upload-background', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          handleInputChange('backgroundImage', data.backgroundPath)
        } else {
          console.error('Failed to upload background')
        }
      } catch (error) {
        console.error('Error uploading background:', error)
      }
    }
  }

  const getContrastColor = (hexColor: string) => {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return '#000000';
    const [r, g, b] = rgb.split(',').map(Number);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
  }

  const textColor = settings.isDarkMode ? '#ffffff' : '#000000';
  const bgColor = settings.isDarkMode ? '#1a1a1a' : '#ffffff';
  const inputBgColor = settings.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const inputTextColor = settings.isDarkMode ? '#ffffff' : '#000000';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`fixed inset-0 items-center justify-center z-50 p-4 overflow-auto theme-manager-dialog ${className}`}
      style={{
        backgroundColor: settings.backgroundOverlay,
      }}
    >
      <div
        ref={themeManagerRef}
        className={`p-8 rounded-lg shadow-xlw-full max-w-full  ${settings.isDarkMode ? 'dark' : ''}`}
        style={{
          backgroundColor: bgColor,
          color: textColor,
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold" style={{ color: textColor }}>Theme Manager</h2>
          <Button variant="ghost" size="sm" onClick={onClose} style={{ color: textColor }}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="backgroundImage" style={{ color: textColor }}>Background Image</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="backgroundImage"
                type="text"
                value={displaySettings.backgroundImage}
                onChange={(e) => handleInputChange('backgroundImage', e.target.value)}
                placeholder="URL or path to image"
                style={{ backgroundColor: inputBgColor, color: inputTextColor }}
              />
              <Button onClick={() => fileInputRef.current?.click()} style={{ backgroundColor: inputBgColor, color: inputTextColor }}>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleBackgroundUpload}
            />
          </div>

          <div>
            <Label htmlFor="textColor" style={{ color: textColor }}>Text Color</Label>
            <Input
              id="textColor"
              type="color"
              value={displaySettings.textColor}
              onChange={(e) => handleInputChange('textColor', e.target.value)}
              style={{ backgroundColor: inputBgColor, color: inputTextColor }}
            />
          </div>

          <div>
            <Label htmlFor="hyperlinkColor" style={{ color: textColor }}>Hyperlink Color</Label>
            <Input
              id="hyperlinkColor"
              type="color"
              value={displaySettings.hyperlinkColor}
              onChange={(e) => handleInputChange('hyperlinkColor', e.target.value)}
              style={{ backgroundColor: inputBgColor, color: inputTextColor }}
            />
          </div>

          <div>
            <Label htmlFor="tableColor" style={{ color: textColor }}>Table & Context Menu Color</Label>
            <Input
              id="tableColor"
              type="color"
              value={displaySettings.tableColor}
              onChange={(e) => handleInputChange('tableColor', e.target.value)}
              style={{ backgroundColor: inputBgColor, color: inputTextColor }}
            />
          </div>

          <div>
            <Label htmlFor="tableOpacity" style={{ color: textColor }}>Table Opacity</Label>
            <Slider
              id="tableOpacity"
              min={0}
              max={1}
              step={0.1}
              value={[displaySettings.tableOpacity]}
              onValueChange={(value) => handleInputChange('tableOpacity', value[0])}
            />
            <span className="text-sm" style={{ color: textColor }}>{displaySettings.tableOpacity.toFixed(1)}</span>
          </div>

          <div>
            <Label htmlFor="contextMenuColor" style={{ color: textColor }}>Context Menu Color</Label>
            <Input
              id="contextMenuColor"
              type="color"
              value={displaySettings.contextMenuColor}
              onChange={(e) => handleInputChange('contextMenuColor', e.target.value)}
              style={{ backgroundColor: inputBgColor, color: inputTextColor }}
            />
          </div>

          <div>
            <Label htmlFor="contextMenuOpacity" style={{ color: textColor }}>Context Menu Opacity</Label>
            <Slider
              id="contextMenuOpacity"
              min={0}
              max={1}
              step={0.1}
              value={[displaySettings.contextMenuOpacity]}
              onValueChange={(value) => handleInputChange('contextMenuOpacity', value[0])}
            />
            <span className="text-sm" style={{ color: textColor }}>{displaySettings.contextMenuOpacity.toFixed(1)}</span>
          </div>

          <div>
            <Label htmlFor="backgroundAnimationDuration" style={{ color: textColor }}>Background Animation Duration (seconds)</Label>
            <Slider
              id="backgroundAnimationDuration"
              min={1}
              max={30}
              step={1}
              value={[displaySettings.backgroundAnimationDuration]}
              onValueChange={(value) => handleInputChange('backgroundAnimationDuration', value[0])}
            />
            <span className="text-sm" style={{ color: textColor }}>{displaySettings.backgroundAnimationDuration.toFixed(1)}s</span>
          </div>

          <div>
            <Label htmlFor="pageTransitionDuration" style={{ color: textColor }}>Page Transition Duration (seconds)</Label>
            <Slider
              id="pageTransitionDuration"
              min={0.1}
              max={2}
              step={0.1}
              value={[displaySettings.pageTransitionDuration]}
              onValueChange={(value) => handleInputChange('pageTransitionDuration', value[0])}
            />
            <span className="text-sm" style={{ color: textColor }}>{displaySettings.pageTransitionDuration.toFixed(1)}s</span>
          </div>

          <div>
            <Label htmlFor="backgroundOverlayColor" style={{ color: textColor }}>Background Overlay Color</Label>
            <Input
              id="backgroundOverlayColor"
              type="color"
              value={displaySettings.backgroundOverlayColor}
              onChange={(e) => handleInputChange('backgroundOverlayColor', e.target.value)}
              style={{ backgroundColor: inputBgColor, color: inputTextColor }}
            />
          </div>

          <div>
            <Label htmlFor="backgroundOverlayOpacity" style={{ color: textColor }}>Background Overlay Opacity</Label>
            <Slider
              id="backgroundOverlayOpacity"
              min={0}
              max={1}
              step={0.01}
              value={[displaySettings.backgroundOverlayOpacity]}
              onValueChange={(value) => handleInputChange('backgroundOverlayOpacity', value[0])}
            />
            <span className="text-sm" style={{ color: textColor }}>{displaySettings.backgroundOverlayOpacity.toFixed(2)}</span>
          </div>

          <div>
            <Label htmlFor="backgroundAnimationStyle" style={{ color: textColor }}>Background Animation Style</Label>
            <Select
              value={displaySettings.backgroundAnimationStyle}
              onValueChange={(value: 'zoom' | 'sideBySide' | 'dynamic') => handleInputChange('backgroundAnimationStyle', value)}
            >
              <SelectTrigger style={{ backgroundColor: inputBgColor, color: inputTextColor }}>
                <SelectValue placeholder="Select animation style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zoom">Zooming In and Out</SelectItem>
                <SelectItem value="sideBySide">Moving Side to Side</SelectItem>
                <SelectItem value="dynamic">Dynamic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="indexerAnimationStyle" style={{ color: textColor }}>Indexer Animation Style</Label>
            <Select
              value={displaySettings.indexerAnimationStyle}
              onValueChange={(value: 'fade' | 'scroll' | 'bounce') => handleInputChange('indexerAnimationStyle', value)}
            >
              <SelectTrigger style={{ backgroundColor: inputBgColor, color: inputTextColor }}>
                <SelectValue placeholder="Select animation style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fade">Fade In/Out</SelectItem>
                <SelectItem value="scroll">Scrolling</SelectItem>
                <SelectItem value="bounce">Bounce</SelectItem>
              </SelectContent>
            </Select>
          </div>

              <div>
            <Label htmlFor="darkMode" style={{ color: textColor }}>Dark Mode</Label>
            <Button
              onClick={() => handleInputChange('isDarkMode', !displaySettings.isDarkMode)}
              variant="outline"
              size="sm"
              className="ml-2"
              style={{ backgroundColor: inputBgColor, color: inputTextColor }}
            >
              {displaySettings.isDarkMode ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
              {displaySettings.isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </Button>
          </div>


        </div>
      </div>
    </motion.div>
  )
}

