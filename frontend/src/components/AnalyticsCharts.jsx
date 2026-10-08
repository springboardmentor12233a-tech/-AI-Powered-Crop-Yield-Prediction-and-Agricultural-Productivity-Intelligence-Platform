function ChartCard({ title, children }) {
  return (
    <section className="card analytics-chart-card">
      <p className="eyebrow">From filtered prediction records</p>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function EmptyChart({ children = "Insufficient data for this chart." }) {
  return <p className="analytics-chart-empty">{children}</p>;
}

export function AnalyticsBarChart({ title, items, valueKey = "average_yield" }) {
  if (!items?.length) {
    return <ChartCard title={title}><EmptyChart>No data available for the selected filters.</EmptyChart></ChartCard>;
  }
  if (items.length < 2) {
    return <ChartCard title={title}><EmptyChart /></ChartCard>;
  }

  const values = items.map((item) => Number(item[valueKey]) || 0);
  const max = Math.max(...values, 0);
  const chartWidth = Math.max(items.length * 92, 420);

  return (
    <ChartCard title={title}>
      <div className="analytics-chart-scroll">
        <svg
          className="analytics-chart"
          viewBox={`0 0 ${chartWidth} 240`}
          role="img"
          aria-label={title}
        >
          <line x1="38" y1="18" x2="38" y2="194" className="chart-axis" />
          <line x1="38" y1="194" x2={chartWidth - 12} y2="194" className="chart-axis" />
          {items.map((item, index) => {
            const barHeight = max ? (values[index] / max) * 150 : 0;
            const x = 54 + index * ((chartWidth - 82) / items.length);
            const width = Math.min(48, (chartWidth - 82) / items.length - 12);
            return (
              <g key={`${item.name || item.period}-${index}`}>
                <rect
                  className="chart-bar"
                  x={x}
                  y={194 - barHeight}
                  width={width}
                  height={barHeight}
                  rx="4"
                />
                <text className="chart-value" x={x + width / 2} y={Math.max(12, 188 - barHeight)}>
                  {values[index].toFixed(valueKey === "count" ? 0 : 1)}
                </text>
                <text className="chart-label" x={x + width / 2} y="214">
                  {(item.name || item.period || "").slice(0, 13)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="chart-unit">{valueKey === "count" ? "Prediction records" : "Average predicted yield (t/ha)"}</p>
    </ChartCard>
  );
}

export function AnalyticsTrendChart({ title, items }) {
  if (!items?.length) {
    return <ChartCard title={title}><EmptyChart>No data available for the selected filters.</EmptyChart></ChartCard>;
  }
  if (items.length < 2) {
    return <ChartCard title={title}><EmptyChart /></ChartCard>;
  }

  const values = items.map((item) => Number(item.average_yield) || 0);
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const chartWidth = Math.max(items.length * 76, 420);
  const plotWidth = chartWidth - 72;
  const plotHeight = 150;
  const points = values.map((value, index) => {
    const x = 48 + (index * plotWidth) / Math.max(values.length - 1, 1);
    const y = 184 - ((value - min) / (max - min || 1)) * plotHeight;
    return `${x},${y}`;
  });

  return (
    <ChartCard title={title}>
      <div className="analytics-chart-scroll">
        <svg
          className="analytics-chart"
          viewBox={`0 0 ${chartWidth} 240`}
          role="img"
          aria-label={title}
        >
          <line x1="38" y1="18" x2="38" y2="194" className="chart-axis" />
          <line x1="38" y1="194" x2={chartWidth - 12} y2="194" className="chart-axis" />
          <polyline className="chart-line" points={points.join(" ")} />
          {items.map((item, index) => {
            const [x, y] = points[index].split(",").map(Number);
            return (
              <g key={`${item.period}-${index}`}>
                <circle className="chart-point" cx={x} cy={y} r="4" />
                <text className="chart-value" x={x} y={y - 9}>{values[index].toFixed(1)}</text>
                <text className="chart-label" x={x} y="214">{item.period}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="chart-unit">Average predicted yield (t/ha)</p>
    </ChartCard>
  );
}

export function AnalyticsFilters({ filters, options, onChange }) {
  const groups = [
    ["crop", "Crop", options?.crops],
    ["state", "State", options?.states],
    ["season", "Season", options?.seasons],
    ["year", "Year", options?.years],
  ];

  return (
    <section className="card filters analytics-filters">
      {groups.map(([name, label, values]) => (
        <label className="field" key={name}>
          <span>{label}</span>
          <select name={name} value={filters[name]} onChange={onChange}>
            <option value="">All available</option>
            {(values || []).map((value) => (
              <option value={value} key={value}>{value}</option>
            ))}
          </select>
        </label>
      ))}
    </section>
  );
}
