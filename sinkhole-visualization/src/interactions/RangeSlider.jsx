// src/components/RangeSlider.jsx
import React from 'react';
import ReactSlider from 'react-slider';
import './RangeSlider.css';

// const { Range } = RcSlider;
// const Range = Slider.Range;
const RangeSlider = ({ min, max, value, onChange, label, orientation = 'horizontal' }) => {
  return (
    <div className={`mb-6 ${orientation === 'vertical' ? 'vertical-slider-wrapper' : ''}`}>
      <h3 className="text-sm font-medium mb-2">
        {label} {/* : {value[0]} ~ {value[1]} */}
      </h3>
      <ReactSlider
        className={`custom-slider ${orientation === 'vertical' ? 'vertical-slider' : ''}`}
        thumbClassName="custom-thumb"
        trackClassName="custom-track"
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        pearling
        minDistance={1}
        withTracks={true}
        orientation={orientation}
      />
    </div>
  );
};

export default RangeSlider;
