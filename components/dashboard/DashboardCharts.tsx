"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { Interactive3DCard } from "./Interactive3DCard";

// Custom 3D cylinder Bar renderer
const CustomCylinderBar = (props: any) => {
  const { fill, x, y, width, height } = props;
  if (!height || height <= 0) return null;

  const rx = width / 2;
  const ry = Math.min(rx * 0.28, 6); // squish factor for top/bottom caps

  // SVG path for cylinder body (curved bottom, straight sides, curved top)
  const path = `
    M ${x},${y + ry}
    L ${x},${y + height - ry}
    A ${rx},${ry} 0 0,0 ${x + width},${y + height - ry}
    L ${x + width},${y + ry}
    A ${rx},${ry} 0 0,0 ${x},${y + ry}
    Z
  `;

  return (
    <g>
      {/* Background shadow glow */}
      <path d={path} fill={fill} opacity={0.12} filter="url(#barGlow)" />

      {/* Main cylinder body */}
      <path d={path} fill={fill} />

      {/* Shading/gradient overlay on the left half */}
      <path
        d={`
          M ${x},${y + ry}
          L ${x},${y + height - ry}
          A ${rx},${ry} 0 0,0 ${x + rx},${y + height}
          L ${x + rx},${y}
          A ${rx},${ry} 0 0,1 ${x},${y + ry}
          Z
        `}
        fill="black"
        opacity={0.06}
      />

      {/* Lighting overlay on the right half */}
      <path
        d={`
          M ${x + rx},${y}
          L ${x + rx},${y + height}
          A ${rx},${ry} 0 0,0 ${x + width},${y + height - ry}
          L ${x + width},${y + ry}
          A ${rx},${ry} 0 0,1 ${x + rx},${y}
          Z
        `}
        fill="white"
        opacity={0.08}
      />

      {/* Top lid of the cylinder */}
      <ellipse cx={x + rx} cy={y + ry} rx={rx} ry={ry} fill={fill} filter="brightness(1.12)" />
    </g>
  );
};

// Custom Tooltip component
const CustomChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-text-primary">
        <p className="text-text-secondary mb-0.5">{payload[0].name || payload[0].payload.name}</p>
        <p className="text-text-darkest text-sm font-bold">
          {payload[0].value} {payload[0].unit || ""}
        </p>
      </div>
    );
  }
  return null;
};

type ChartDataPoint = {
  name: string;
  value: number;
};

// 1. Company Research Activity Chart (info-blue cylinders)
export function CompanyResearchChart({ data }: { data: ChartDataPoint[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isEmpty = !data || data.length === 0 || data.every((d) => d.value === 0);

  return (
    <Interactive3DCard className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="border-b border-border px-6 py-5 text-[16px] font-semibold text-text-primary">
        Company Research Activity
      </div>
      <div className="h-[292px] px-6 pb-6 pt-8 flex flex-col justify-center">
        {/* Glow Filters Definition */}
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <defs>
            <filter id="barGlow" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
        </svg>

        {mounted ? (
          isEmpty ? (
            <div className="flex h-full flex-col items-center justify-center text-center pb-4">
              <p className="text-sm font-semibold text-text-primary">No research activity yet</p>
              <p className="mt-1 text-xs text-text-muted">
                Run research on a company from the job details page to see stats here.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barSize={24} margin={{ left: -24, right: 8, bottom: -4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#9CA3AF", fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#9CA3AF", fontSize: 12, fontWeight: 500 }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomChartTooltip />} cursor={{ fill: "var(--color-surface-secondary)", opacity: 0.5 }} />
                <Bar dataKey="value" fill="#61A8FF" shape={<CustomCylinderBar />} />
              </BarChart>
            </ResponsiveContainer>
          )
        ) : (
          <div className="h-full w-full bg-transparent" />
        )}
      </div>
    </Interactive3DCard>
  );
}

// 2. Jobs Found Over Time Chart (accent-purple line + gradient)
export function JobsFoundChart({ data }: { data: ChartDataPoint[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isEmpty = !data || data.length === 0 || data.every((d) => d.value === 0);

  return (
    <Interactive3DCard className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="border-b border-border px-6 py-5 text-[16px] font-semibold text-text-primary">
        Jobs Found Over Time
      </div>
      <div className="h-[292px] px-6 pb-6 pt-8 flex flex-col justify-center">
        {mounted ? (
          isEmpty ? (
            <div className="flex h-full flex-col items-center justify-center text-center pb-4">
              <p className="text-sm font-semibold text-text-primary">No job searches yet</p>
              <p className="mt-1 text-xs text-text-muted">
                Search for jobs on the Find Jobs page to see historical stats.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ left: -24, right: 8, bottom: -4 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C5CFC" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="#7C5CFC" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#7C5CFC" />
                    <stop offset="50%" stopColor="#A88BFF" />
                    <stop offset="100%" stopColor="#7C5CFC" />
                  </linearGradient>
                  <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#7C5CFC" floodOpacity="0.3" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#9CA3AF", fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#9CA3AF", fontSize: 12, fontWeight: 500 }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="url(#lineGradient)"
                  strokeWidth={3.5}
                  fill="url(#areaGradient)"
                  filter="url(#lineGlow)"
                  activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 2, fill: "#7C5CFC" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )
        ) : (
          <div className="h-full w-full bg-transparent" />
        )}
      </div>
    </Interactive3DCard>
  );
}

// 3. Match Score Distribution Chart (success-green cylinders)
export function MatchScoreChart({ data }: { data: ChartDataPoint[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isEmpty = !data || data.length === 0 || data.every((d) => d.value === 0);

  return (
    <Interactive3DCard className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="border-b border-border px-6 py-5 text-[16px] font-semibold text-text-primary">
        Match Score Distribution
      </div>
      <div className="h-[292px] px-6 pb-6 pt-8 flex flex-col justify-center">
        {mounted ? (
          isEmpty ? (
            <div className="flex h-full flex-col items-center justify-center text-center pb-4">
              <p className="text-sm font-semibold text-text-primary">No match scores yet</p>
              <p className="mt-1 text-xs text-text-muted">
                Matched jobs will show their compatibility scores here.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barSize={28} margin={{ left: -24, right: 8, bottom: -4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#9CA3AF", fontSize: 11, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#9CA3AF", fontSize: 12, fontWeight: 500 }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomChartTooltip />} cursor={{ fill: "var(--color-surface-secondary)", opacity: 0.5 }} />
                <Bar dataKey="value" fill="#10B981" shape={<CustomCylinderBar />} />
              </BarChart>
            </ResponsiveContainer>
          )
        ) : (
          <div className="h-full w-full bg-transparent" />
        )}
      </div>
    </Interactive3DCard>
  );
}
