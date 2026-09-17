import React, { useEffect, useRef } from 'react';
import { SensorSample } from '../../api/types';

interface WaveformCanvasProps {
  samples: SensorSample[];
  mode: 'accel' | 'gyro';
  height?: number;
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  samples,
  mode,
  height = 180,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high DPI canvas resolution
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;

    // Background - Technical dark slate monitor surface
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Precision Grid lines (engineering scope style)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const gridRows = 6;
    for (let i = 0; i <= gridRows; i++) {
      const y = (height / gridRows) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const gridCols = 10;
    for (let j = 0; j <= gridCols; j++) {
      const x = (width / gridCols) * j;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Zero / baseline line
    const zeroY = height / 2;
    ctx.strokeStyle = '#334155';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(width, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

    if (samples.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Awaiting sensor signal...', width / 2, zeroY + 4);
      return;
    }

    // Scale Y values
    const maxVal = mode === 'accel' ? 22.0 : 5.0;
    const scaleY = (val: number) => {
      const normalized = val / maxVal;
      return zeroY - normalized * (height / 2 - 12);
    };

    const drawTrace = (values: number[], color: string, lineWidth: number = 1.6) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();

      const step = width / Math.max(1, samples.length - 1);
      values.forEach((val, idx) => {
        const x = idx * step;
        const y = Math.max(4, Math.min(height - 4, scaleY(val)));
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };

    if (mode === 'accel') {
      const xs = samples.map((s) => s.accel_x);
      const ys = samples.map((s) => s.accel_y);
      const zs = samples.map((s) => s.accel_z);

      drawTrace(xs, '#38bdf8', 1.6); // Ax Cyan-Blue
      drawTrace(ys, '#34d399', 1.6); // Ay Emerald
      drawTrace(zs, '#f43f5e', 1.6); // Az Rose
    } else {
      const gx = samples.map((s) => s.gyro_x);
      const gy = samples.map((s) => s.gyro_y);
      const gz = samples.map((s) => s.gyro_z);

      drawTrace(gx, '#fbbf24', 1.6); // Gx Amber
      drawTrace(gy, '#a78bfa', 1.6); // Gy Violet
      drawTrace(gz, '#60a5fa', 1.6); // Gz Blue
    }
  }, [samples, mode, height]);

  const latest = samples.length > 0 ? samples[samples.length - 1] : null;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '6px',
          fontSize: '12px',
        }}
      >
        <span style={{ fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          {mode === 'accel' ? '3-Axis Linear Accelerometer (m/s²)' : '3-Axis Angular Gyroscope (rad/s)'}
        </span>
        <div style={{ display: 'flex', gap: '14px', fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}>
          {mode === 'accel' ? (
            <>
              <span style={{ color: '#0284c7', fontWeight: 600 }}>Ax: {latest ? latest.accel_x.toFixed(2) : '--'}</span>
              <span style={{ color: '#16a34a', fontWeight: 600 }}>Ay: {latest ? latest.accel_y.toFixed(2) : '--'}</span>
              <span style={{ color: '#dc2626', fontWeight: 600 }}>Az: {latest ? latest.accel_z.toFixed(2) : '--'}</span>
            </>
          ) : (
            <>
              <span style={{ color: '#d97706', fontWeight: 600 }}>Gx: {latest ? latest.gyro_x.toFixed(2) : '--'}</span>
              <span style={{ color: '#7c3aed', fontWeight: 600 }}>Gy: {latest ? latest.gyro_y.toFixed(2) : '--'}</span>
              <span style={{ color: '#2563eb', fontWeight: 600 }}>Gz: {latest ? latest.gyro_z.toFixed(2) : '--'}</span>
            </>
          )}
        </div>
      </div>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: `${height}px`,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-medium)',
          display: 'block',
        }}
      />
    </div>
  );
};
