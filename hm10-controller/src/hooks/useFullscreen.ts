import { useEffect } from 'react';

export const useFullscreen = () => {
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile && document.documentElement.requestFullscreen) {
      const timer = setTimeout(() => {
        document.documentElement.requestFullscreen().catch(err => {
          console.log('Fullscreen request failed:', err);
        });
      }, 500);

      return () => clearTimeout(timer);
    }
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return { toggleFullscreen };
};
