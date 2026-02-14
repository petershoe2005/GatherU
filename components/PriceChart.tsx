
import React, { useMemo, useState, useRef } from 'react';

interface PricePoint {
    price: number;
    time: string;
}

interface PriceChartProps {
    data: PricePoint[];
    color?: string;
    height?: number;
}

const PriceChart: React.FC<PriceChartProps> = ({ data, color = '#FF6B00', height = 200 }) => {
    const [hoverData, setHoverData] = useState<PricePoint | null>(null);
    const [hoverX, setHoverX] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const { points, areaPath, linePath, minPrice, maxPrice } = useMemo(() => {
        if (data.length === 0) return { points: [], areaPath: '', linePath: '', minPrice: 0, maxPrice: 0 };

        const prices = data.map(d => d.price);
        const min = Math.min(...prices) * 0.99; // slightly lower bottom buffer
        const max = Math.max(...prices) * 1.01; // slightly higher top buffer
        const range = max - min || 1;

        const pts = data.map((d, i) => {
            const x = (i / (data.length - 1 || 1)) * 100;
            const y = 100 - ((d.price - min) / range) * 100;
            return { x, y, ...d };
        });

        const lineCmd = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        const areaCmd = `${lineCmd} L 100 100 L 0 100 Z`;

        return { points: pts, areaPath: areaCmd, linePath: lineCmd, minPrice: min, maxPrice: max };
    }, [data]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current || data.length < 2) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const percentage = Math.max(0, Math.min(1, x / width));

        // Find closest index
        const index = Math.round(percentage * (data.length - 1));
        const point = data[index];

        setHoverData(point);
        setHoverX((index / (data.length - 1)) * 100);
    };

    const handleMouseLeave = () => {
        setHoverData(null);
        setHoverX(null);
    };

    if (data.length === 0) return null;

    const activePoint = hoverData || data[data.length - 1];

    return (
        <div className="w-full relative select-none group" ref={containerRef}>
            {/* Header Info - Changes on Hover */}
            <div className="absolute top-2 left-4 z-10 pointer-events-none">
                <div className="text-3xl font-black text-white tracking-tight">
                    ${activePoint.price.toFixed(2)}
                </div>
                <div className={`text-xs font-bold uppercase tracking-wider ${hoverData ? 'text-slate-300' : 'text-primary'}`}>
                    {hoverData ? activePoint.time : 'Current Price'}
                </div>
            </div>

            <div
                className="relative w-full overflow-hidden pt-12"
                style={{ height }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onTouchMove={(e) => {
                    if (!containerRef.current || data.length < 2) return;
                    const rect = containerRef.current.getBoundingClientRect();
                    const x = e.touches[0].clientX - rect.left;
                    const width = rect.width;
                    const percentage = Math.max(0, Math.min(1, x / width));
                    const index = Math.round(percentage * (data.length - 1));
                    setHoverData(data[index]);
                    setHoverX((index / (data.length - 1)) * 100);
                }}
                onTouchEnd={handleMouseLeave}
            >
                <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="w-full h-full overflow-visible"
                >
                    <defs>
                        <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="0.5" />
                            <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Area Fill */}
                    <path d={areaPath} fill="url(#chartGradient)" />

                    {/* Line Stroke */}
                    <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Hover Line */}
                    {hoverX !== null && (
                        <line
                            x1={hoverX} y1="0"
                            x2={hoverX} y2="100"
                            stroke="white"
                            strokeWidth="0.5"
                            strokeDasharray="2 2"
                            className="opacity-50"
                        />
                    )}

                    {/* Active Dot (Pulsing end dot or Hover dot) */}
                    {(!hoverData && data.length > 0) && (
                        <circle
                            cx={points[points.length - 1].x}
                            cy={points[points.length - 1].y}
                            r="1.5"
                            fill="white"
                            className="animate-pulse"
                        />
                    )}

                    {/* Hover Dot */}
                    {hoverData && hoverX !== null && (
                        <circle
                            cx={hoverX}
                            cy={100 - ((hoverData.price - minPrice) / (maxPrice - minPrice || 1)) * 100}
                            r="2"
                            fill="white"
                            stroke={color}
                            strokeWidth="1"
                        />
                    )}
                </svg>
            </div>
        </div>
    );
};

export default PriceChart;
