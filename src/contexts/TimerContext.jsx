import React, { createContext, useState, useEffect, useRef, useContext } from 'react';

const TimerContext = createContext();

export const useTimer = () => useContext(TimerContext);

export const TimerProvider = ({ children }) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef(null);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
  };

  useEffect(() => {
    if (isTimerRunning) {
      startTimer();
    } else {
      stopTimer();
    }
    return stopTimer;
  }, [isTimerRunning]);

  const value = {
    timeElapsed,
    setTimeElapsed,
    isTimerRunning,
    setIsTimerRunning,
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};