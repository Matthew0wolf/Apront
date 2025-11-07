import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const defaultColors = [
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#78716c', '#a1a1aa'
];

const isValidHex = (color) => /^#[0-9A-F]{6}$/i.test(color);

const ColorPicker = ({ color, onChange }) => {
  const [customColor, setCustomColor] = useState(color);

  const handleCustomColorChange = (e) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    if (isValidHex(newColor)) {
      onChange(newColor);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-8 gap-2">
        {defaultColors.map((c) => (
          <button
            key={c}
            type="button"
            className={cn(
              'w-8 h-8 rounded-full transition-transform transform hover:scale-110 focus:outline-none',
              color === c ? 'ring-2 ring-offset-2 ring-ring ring-offset-background' : ''
            )}
            style={{ backgroundColor: c }}
            onClick={() => {
              onChange(c);
              setCustomColor(c);
            }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-md border"
          style={{ backgroundColor: isValidHex(customColor) ? customColor : 'transparent' }}
        />
        <Input
          value={customColor}
          onChange={handleCustomColorChange}
          placeholder="#RRGGBB"
          className="w-32"
        />
      </div>
    </div>
  );
};

export default ColorPicker;