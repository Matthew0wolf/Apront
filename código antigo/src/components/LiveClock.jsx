import React, { useState, useEffect } from 'react';

const LiveClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-2xl font-mono font-bold text-foreground">
      {currentTime.toLocaleTimeString('pt-BR')}
    </div>
  );
};

export default LiveClock;