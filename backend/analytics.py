from collections import defaultdict


def summarize(rows):
    yields = [float(row["predicted_yield"]) for row in rows]
    return {
        "count": len(rows),
        "average_yield": sum(yields) / len(yields) if yields else None,
        "highest_yield": max(yields) if yields else None,
        "lowest_yield": min(yields) if yields else None,
    }


def grouped_average(rows, key):
    grouped = defaultdict(list)
    for row in rows:
        grouped[row[key]].append(float(row["predicted_yield"]))
    return [{"name": name, "average_yield": sum(values) / len(values), "count": len(values)} for name, values in sorted(grouped.items())]


def serialize_rows(rows):
    return [
        {
            **row,
            "prediction_id": str(row["prediction_id"]),
            "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
        }
        for row in rows
    ]
