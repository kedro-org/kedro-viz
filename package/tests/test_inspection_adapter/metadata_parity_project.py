"""Build the same isolated demo inputs for legacy capture and metadata parity.

Never copy generated data or discover the latest reporting version in the developer's
checkout. Small fixed tables exercise real CSV/Parquet previews without running the
pipeline (whose feature-importance output includes random values).
"""

from pathlib import Path
from shutil import copy2, copytree, ignore_patterns

import pandas as pd

_COMMITTED_DATA = (
    "01_raw/companies.csv",
    "01_raw/reviews.csv",
    "01_raw/shuttles.xlsx",
    "08_reporting/cancellation_breakdown.json",
    "08_reporting/cancellation_policy_grid.png",
    "08_reporting/top_shuttle_data.json",
    "08_reporting/confusion_matrix.png/2023-01-16T15.55.27.850Z/confusion_matrix.png",
    "08_reporting/feature_importance_plot.json/2023-01-16T15.55.27.850Z/feature_importance_plot.json",
    "08_reporting/price_histogram.json/2023-11-08T11.44.01.051Z/price_histogram.json",
)
GENERATED_TABLES = (
    "02_intermediate/typed_companies.pq",
    "02_intermediate/typed_reviews.pq",
    "03_primary/prm_shuttle_company_reviews.pq",
    "03_primary/prm_spine_table.pq",
    "04_feature/feature_importance_output.csv",
    "05_model_input/model_input_table.pq",
)


def prepare_metadata_parity_project(source: Path, destination: Path) -> Path:
    """Copy project definitions and selected assets, then supply fixed preview tables."""
    destination.mkdir(parents=True)
    copy2(source / "pyproject.toml", destination / "pyproject.toml")
    copytree(
        source / "src",
        destination / "src",
        ignore=ignore_patterns("__pycache__", "*.pyc"),
    )
    copytree(source / "conf/base", destination / "conf/base")
    (destination / "conf/local").mkdir()
    for relative_path in (".viz/stats.json", ".viz/styles.json"):
        target = destination / relative_path
        target.parent.mkdir(exist_ok=True)
        copy2(source / relative_path, target)
    for relative_path in _COMMITTED_DATA:
        target = destination / "data" / relative_path
        target.parent.mkdir(parents=True, exist_ok=True)
        copy2(source / "data" / relative_path, target)

    for relative_path in GENERATED_TABLES:
        target = destination / "data" / relative_path
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.suffix == ".csv":
            pd.DataFrame(
                {"Feature": ["capacity", "price"], "Score": [0.75, 0.25]}
            ).to_csv(target, index=False)
        else:
            table = pd.DataFrame(
                {
                    "dataset": [target.stem] * 3,
                    "id": [1, 2, 3],
                    "value": [0.25, 0.5, 0.75],
                }
            )
            table.to_parquet(target, index=False)
    return destination
