'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ExpenseData {
    category: string;
    total_amount: number;
    [key: string]: any;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ExpensePieChart({ data }: { data: ExpenseData[] }) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total_amount"
                    nameKey="category"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip formatter={(value: any, name: any, props: any) => [`$${Number(value).toFixed(2)}`, name]} />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}
