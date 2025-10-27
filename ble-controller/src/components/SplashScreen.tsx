import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setFadeOut(true);
    }, 2000); // Показываем 2 секунды

    const timer2 = setTimeout(() => {
      onComplete();
    }, 2500); // Анимация исчезновения 0.5 секунды

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center z-50 transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-4 landscape:gap-0.5 sm:gap-8 sm:landscape:gap-8">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl landscape:rounded-sm sm:rounded-3xl sm:landscape:rounded-3xl p-3 landscape:p-1 sm:p-8 sm:landscape:p-8 shadow-2xl">
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="Logo"
            className="w-14 max-w-[56px] landscape:w-12 landscape:max-w-[48px] sm:w-64 sm:max-w-none sm:landscape:w-64 h-auto object-contain"
          />
        </div>
        <div className="flex gap-2 landscape:gap-0.5 sm:gap-2 sm:landscape:gap-2">
          <div className="w-3 h-3 landscape:w-1 landscape:h-1 sm:w-3 sm:h-3 sm:landscape:w-3 sm:landscape:h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 landscape:w-1 landscape:h-1 sm:w-3 sm:h-3 sm:landscape:w-3 sm:landscape:h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 landscape:w-1 landscape:h-1 sm:w-3 sm:h-3 sm:landscape:w-3 sm:landscape:h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};
