import React from 'react';

const DemoWatermark = () => {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
      style={{
        fontSize: 'clamp(2rem, 10vw, 6rem)', // Responsive font size
        color: 'hsla(var(--foreground), 0.08)', // Very subtle foreground color
        transform: 'rotate(-25deg)',
        opacity: 0.8,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
    >
      Modo Demo - Datos no reales
    </div>
  );
};

export default DemoWatermark;