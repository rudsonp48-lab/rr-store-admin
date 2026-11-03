import React from 'react';

export default function Loading() {
  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center select-none"
      style={{ backgroundColor: '#000000' }}
    >
      <div id="loadingWave" aria-label="Carregando...">
        <div className="shape square" />
        <div className="shape triangle" />
        <div className="shape diamond" />
        <div className="shape circle" />
        <div className="shape square" />
        <div className="shape triangle" />
        <div className="shape diamond" />
        <div className="shape circle" />
      </div>
    </div>
  );
}
