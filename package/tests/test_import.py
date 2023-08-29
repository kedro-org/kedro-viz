import pytest

import kedro_viz


def test_import_kedro_viz_with_no_official_support_emits_warning(mocker):
    """Test importing kedro Viz with python>=3.12 and controlled warnings should work"""
    mocker.patch("kedro_viz.sys.version_info", (3, 12))

    # We use the parent class to avoid issues with `exec_module`
    with pytest.warns(UserWarning) as record:
        kedro_viz.__loader__.exec_module(kedro_viz)

    assert len(record) == 1
    assert (
        """Please be advised that Kedro Viz is not yet fully
        compatible with the Python version you are currently using."""
        in record[0].message.args[0]
    )
