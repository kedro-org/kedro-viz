import pytest


def identity_func(x):
    return x


@pytest.fixture
def identity():
    yield identity_func
