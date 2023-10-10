import pytest

from kedro_viz.models.utils import extract_data_source, get_dataset_type

try:
    # kedro 0.18.11 onwards
    from kedro.io import MemoryDataset
except ImportError:
    # older versions
    from kedro.io import MemoryDataSet as MemoryDataset


@pytest.mark.parametrize(
    "dataset,expected_type",
    [(None, ""), (MemoryDataset(), "io.memory_dataset.MemoryDataset")],
)
def test_get_dataset_type(dataset, expected_type):
    assert get_dataset_type(dataset) == expected_type


data_node_inputs = [
    (
        "pandas.sql_dataset.SQLQueryDataSet",
        {"sql": "SELECT * FROM test_data_node_metadata_with_sql_source"},
        "SELECT * FROM test_data_node_metadata_with_sql_source",
    ),
    (
        "pandas.gbq_dataset.GBQQueryDataSet",
        {"sql": "SELECT * FROM test_data_node_metadata_with_gbq_source"},
        "SELECT * FROM test_data_node_metadata_with_gbq_source",
    ),
    (
        "api.api_dataset.APIDataSet",
        {"url": "www.test.com", "method": "GET"},
        "Derived from www.test.com using GET method.",
    ),
    (
        "spark.spark_hive_dataset.SparkHiveDataSet",
        {"table": "test_spark_hive_table", "database": "test_spark_hive_db"},
        "Derived from test_spark_hive_table table, in test_spark_hive_db database.",
    ),
    (
        "snow.snowpark_dataset.SnowparkTableDataSet",
        {"table_name": "test_snowpark_table", "database": "test_snowpark_db"},
        "Derived from test_snowpark_table table, in test_snowpark_db database.",
    ),
    (
        "spark.spark_jdbc_dataset.SparkJDBCDataSet",
        {
            "table": "test_spark_hive_table",
            "url": "www.test_spark_jdbc_dataset_url.com",
        },
        "Derived from test_spark_hive_table table, from www.test_spark_jdbc_dataset_url.com url.",
    ),
    (
        "redis.pickle_dataset.PickleDataSet",
        {"url": "www.test_redis_pickle_dataset_url.com"},
        "Derived from www.test_redis_pickle_dataset_url.com url.",
    ),
    ("unrecognised_dataset_type", {}, None),
    (None, {}, None),
]


@pytest.mark.parametrize("node_type,data_desc,expected_source", data_node_inputs)
def test_source_data_extraction(node_type, data_desc, expected_source):
    extractedSource = extract_data_source(node_type, data_desc)
    assert extractedSource == expected_source
