import pandas as pd

from .config import DATASET_PATH


class DatasetService:

    def __init__(self):
        self.df = pd.read_csv(DATASET_PATH)

        # Remove accidental whitespace from column names
        self.df.columns = self.df.columns.str.strip()

    # ========================================================
    # STATES
    # ========================================================

    def get_states(self):
        return sorted(
            self.df["State Name"]
            .dropna()
            .astype(str)
            .unique()
            .tolist()
        )

    # ========================================================
    # DISTRICTS
    # ========================================================

    def get_districts(self, state):
        filtered = self.df[
            self.df["State Name"].astype(str).str.upper()
            == state.upper()
        ]

        return sorted(
            filtered["Dist Name"]
            .dropna()
            .astype(str)
            .unique()
            .tolist()
        )

    # ========================================================
    # CROPS
    # ========================================================

    def get_crops(self):
        crops = []

        for column in self.df.columns:

            if column.endswith(" AREA (1000 ha)"):

                crop = column.replace(
                    " AREA (1000 ha)", ""
                ).strip()

                crops.append(crop)

        return sorted(crops)

    # ========================================================
    # YEARS
    # ========================================================

    def get_years(self):
        return sorted(
            self.df["Year"]
            .dropna()
            .astype(int)
            .unique()
            .tolist()
        )