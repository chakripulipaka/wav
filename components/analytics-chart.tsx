"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import type { HistoricalDataPoint } from "@/lib/types"

interface AnalyticsChartProps {
  data: HistoricalDataPoint[]
  timeScale: "day" | "week" | "month"
}

// Format date for x-axis display - shows actual dates like "Dec 28"
function formatXAxisDate(date: string, index: number, dataLength: number): string {
  const d = new Date(date + 'T00:00:00')

  // For month view (30 days), show fewer labels to avoid crowding
  if (dataLength > 10) {
    if (index === 0 || index === dataLength - 1 || index % 7 === 0) {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }
    return ""
  }

  // For week view, show all dates
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

// Format large numbers (e.g., 1000 -> 1K)
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M"
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K"
  }
  return num.toLocaleString()
}

export function AnalyticsChart({ data, timeScale }: AnalyticsChartProps) {
  // If no data or day view (summary only), don't render chart
  if (!data || data.length === 0 || timeScale === "day") {
    return null
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
          <XAxis
            dataKey="date"
            tickFormatter={(value, index) => formatXAxisDate(value, index, data.length)}
            stroke="#a0a0a0"
          />
          <YAxis
            tickFormatter={formatNumber}
            stroke="#a0a0a0"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: "4px"
            }}
            labelStyle={{ color: "#fff" }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="energy"
            name="Energy"
            stroke="#00ff9d"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="momentum"
            name="Momentum"
            stroke="#ff006e"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
