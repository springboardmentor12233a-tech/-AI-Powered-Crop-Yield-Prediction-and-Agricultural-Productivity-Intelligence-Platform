from collections import defaultdict


def _yield_summary(values):
    values = [float(value) for value in values]
    return {
        "count": len(values),
        "average_yield": sum(values) / len(values) if values else None,
        "highest_yield": max(values) if values else None,
        "lowest_yield": min(values) if values else None,
    }


def summarize(rows):
    return _yield_summary(row["predicted_yield"] for row in rows)


def grouped_average(rows, key):
    grouped = defaultdict(list)
    for row in rows:
        grouped[row[key]].append(float(row["predicted_yield"]))
    return [{"name": name, "average_yield": sum(values) / len(values), "count": len(values)} for name, values in sorted(grouped.items())]


def prediction_year_trend(rows):
    grouped = defaultdict(list)
    for row in rows:
        grouped[int(row["year"])].append(float(row["predicted_yield"]))
    return [
        {"period": str(year), **_yield_summary(values)}
        for year, values in sorted(grouped.items())
    ]


def prediction_date_trend(rows):
    grouped = defaultdict(list)
    for row in rows:
        created_at = row.get("created_at")
        if created_at:
            period = created_at.strftime("%Y-%m")
            grouped[period].append(float(row["predicted_yield"]))
    return [
        {"period": period, **_yield_summary(values)}
        for period, values in sorted(grouped.items())
    ]


def serialize_rows(rows):
    return [
        {
            **row,
            "prediction_id": str(row["prediction_id"]),
            "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
        }
        for row in rows
    ]
