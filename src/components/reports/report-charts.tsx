'use client';

import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function VolumeTrendChart({ data }: { data: any[] }) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis
                    dataKey="date"
                    tickFormatter={(str) => {
                        const date = new Date(str);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Volume']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Area
                    type="monotone"
                    dataKey="volume_usd"
                    stroke="#8884d8"
                    fillOpacity={1}
                    fill="url(#colorVolume)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

export function ContactVolumeChart({ data }: { data: any[] }) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                    dataKey="contact_name"
                    type="category"
                    width={100}
                    tick={{ fontSize: 12 }}
                />
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Volume']} />
                <Bar dataKey="total_usd" fill="#82ca9d" radius={[0, 4, 4, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}

export function StatusPieChart({ data }: { data: any[] }) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="status"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}
export function ReportCharts({ data, type }: { data: any, type: 'trend' | 'volume' | 'status' }) {
    if (type === 'trend') {
        return <VolumeTrendChart data={data.daily_trend} />;
    }
    if (type === 'volume') {
        return <ContactVolumeChart data={data.contact_volume} />;
    }
    if (type === 'status') {
        return <StatusPieChart data={data.status_breakdown} />;
    }
    return null;
}
