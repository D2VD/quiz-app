
import React from 'react';

interface CountdownTimerProps {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const DateTimeDisplay = ({ value, type, isDanger }: { value: number, type: string, isDanger: boolean }) => {
  return (
    <div className={`flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg p-4 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 transition-colors duration-300 ${isDanger ? 'text-red-500' : 'text-gray-800 dark:text-white'}`}>
      <span className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter">{value.toString().padStart(2, '0')}</span>
      <span className="text-sm sm:text-base uppercase tracking-wider text-gray-500 dark:text-gray-400">{type}</span>
    </div>
  );
};

const CountdownTimer: React.FC<CountdownTimerProps> = ({ days, hours, minutes, seconds }) => {
  const isDanger = days === 0 && hours === 0 && minutes < 1;

  return (
    <div className="flex items-center justify-center space-x-2 sm:space-x-4">
      {days > 0 && <DateTimeDisplay value={days} type={'Ngày'} isDanger={false} />}
      {(days > 0 || hours > 0) && <DateTimeDisplay value={hours} type={'Giờ'} isDanger={false} />}
      <DateTimeDisplay value={minutes} type={'Phút'} isDanger={isDanger} />
      <DateTimeDisplay value={seconds} type={'Giây'} isDanger={isDanger} />
    </div>
  );
};

export default CountdownTimer;
