import { useState, useEffect } from 'react'

const TITLE = 'INNER CIRCLE MEDIA HUB'

export function AnimatedTitle() {
  const [displayText, setDisplayText] = useState('')
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (index < TITLE.length) {
      const timer = setTimeout(() => {
        const newText = displayText + TITLE[index];
        setDisplayText(newText);
        setIndex((prev) => prev + 1);
        document.title = newText;
      }, 100);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setDisplayText('');
        setIndex(0);
        document.title = 'INNER CIRCLE HUB';
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [index, displayText]);

  return null; // This component doesn't render anything visible
}

