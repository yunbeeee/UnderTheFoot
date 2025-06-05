// src/components/RangeSlider.jsx
import React from 'react';
import ReactSlider from 'react-slider';
import './RangeSlider.css';

// const { Range } = RcSlider;
// const Range = Slider.Range;
const RangeSlider = ({ min, max, value, onChange, label }) => {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium mb-2">
        {label}: {value[0]} ~ {value[1]}
      </h3>
      <ReactSlider
        className="custom-slider"
        thumbClassName="custom-thumb"
        trackClassName="custom-track"
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        pearling
        minDistance={1}
        withTracks={true}
      />
    </div>
  );
};

export default RangeSlider;
