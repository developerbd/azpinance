import React, { useMemo } from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line, Text as SvgText } from 'react-native-svg';

interface DataPoint {
    day: number;
    value: number; // BDT Liability
    label: string;
}

interface LiquidityChartProps {
    data: DataPoint[];
    height?: number;
    color?: string;
    isCurrency?: boolean;
}

export function LiquidityChart({ data, height = 220, color = '#f43f5e', isCurrency = true }: LiquidityChartProps) {
    const screenWidth = Dimensions.get('window').width;
    const CHART_WIDTH = screenWidth - 60; // Padding
    const CHART_HEIGHT = height - 40;     // Padding for labels

    const processedData = useMemo(() => {
        if (!data || data.length === 0) return [];
        const maxVal = Math.max(...data.map(d => d.value)) * 1.1; // 10% headroom
        const minVal = Math.min(...data.map(d => d.value)) * 0.9;

        return data.map((point, index) => ({
            x: (index / (data.length - 1)) * CHART_WIDTH,
            y: CHART_HEIGHT - ((point.value - minVal) / (maxVal - minVal || 1)) * CHART_HEIGHT,
            value: point.value,
            label: point.label,
            originalDay: point.day
        }));
    }, [data, CHART_WIDTH, CHART_HEIGHT]);

    if (processedData.length === 0) return null;

    // Create Path Commands
    const linePath = processedData.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
    const areaPath = `${linePath} L ${CHART_WIDTH} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`;

    return (
        <View className="items-center justify-center py-4">
            <Svg width={CHART_WIDTH + 40} height={height}>
                <Defs>
                    <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={color} stopOpacity="0.3" />
                        <Stop offset="1" stopColor={color} stopOpacity="0.0" />
                    </LinearGradient>
                </Defs>

                {/* Grid Lines (Horizontal) */}
                <Line x1="0" y1={0} x2={CHART_WIDTH} y2={0} stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
                <Line x1="0" y1={CHART_HEIGHT / 2} x2={CHART_WIDTH} y2={CHART_HEIGHT / 2} stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
                <Line x1="0" y1={CHART_HEIGHT} x2={CHART_WIDTH} y2={CHART_HEIGHT} stroke="#e2e8f0" strokeWidth="1" />

                {/* Area Fill */}
                <Path d={areaPath} fill="url(#grad)" />

                {/* Line Stroke */}
                <Path d={linePath} stroke={color} strokeWidth="3" fill="none" />

                {/* Data Points & Labels */}
                {processedData.map((point, i) => (
                    <React.Fragment key={i}>
                        {/* Dot */}
                        <Circle cx={point.x} cy={point.y} r="4" fill="#fff" stroke={color} strokeWidth="2" />

                        {/* Value Label (Top) - Only show start, middle, end to avoid overlapping */}
                        {(i === 0 || i === processedData.length - 1 || i === Math.floor(processedData.length / 2)) && (
                            <SvgText
                                x={point.x}
                                y={point.y - 10}
                                fontSize="10"
                                fill="#888"
                                textAnchor="middle"
                                fontWeight="bold"
                            >
                                {isCurrency
                                    ? `৳${(point.value / 1000000).toFixed(1)}M`
                                    : `$${(point.value / 1000).toFixed(0)}k`
                                }
                            </SvgText>
                        )}

                        {/* X-Axis Label */}
                        <SvgText
                            x={point.x}
                            y={CHART_HEIGHT + 20}
                            fontSize="10"
                            fill="#94a3b8"
                            textAnchor="middle"
                        >
                            {point.label}
                        </SvgText>
                    </React.Fragment>
                ))}
            </Svg>
        </View>
    );
}
