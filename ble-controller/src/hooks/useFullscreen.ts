import { useEffect } from 'react';

export const useFullscreen = () => {
  useEffect(() => {
    try {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (isMobile && document?.documentElement?.requestFullscreen) {
        const timer = setTimeout(() => {
          document.documentElement.requestFullscreen().catch(err => {
            console.log('Fullscreen request failed:', err);
          });
        }, 500);

        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.error('useFullscreen error:', error);
    }
  }, []);

  const toggleFullscreen = () => {
    try {
      if (!document?.fullscreenElement && document?.documentElement?.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(err => {
          console.log('Fullscreen request failed:', err);
        });
      } else if (document?.exitFullscreen) {
        document.exitFullscreen();
      }
    } catch (error) {
      console.error('toggleFullscreen error:', error);
    }
  };

  return { toggleFullscreen };
};
