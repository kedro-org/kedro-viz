package: install
	cd package && python setup.py clean --all
	cd package && python setup.py sdist bdist_wheel

install: build
	cd package && python setup.py install

build: clean
	npm run build
	cp -R build package/kedro_viz/html

clean:
	rm -rf build package/dist package/kedro_viz/html pip-wheel-metadata package/kedro_viz.egg-info
	find . -regex ".*/__pycache__" -exec rm -rf {} +
	find . -regex ".*\.egg-info" -exec rm -rf {} +

run:
	python package/kedro_viz/server.py --port 4343 --logdir logs/

pytest: build
	cd package && python3 setup.py test

e2e-tests: build
	cd package && behave

pylint:
	cd package && isort
	pylint -j 0 --disable=bad-continuation,unnecessary-pass package/kedro_viz
	pylint -j 0 --disable=bad-continuation,missing-docstring,redefined-outer-name,no-self-use,invalid-name,too-few-public-methods,no-member package/tests
	pylint -j 0 --disable=missing-docstring,no-name-in-module package/features
	flake8 package

secret-scan:
	trufflehog --max_depth 1 --exclude_path trufflehog-ignore.txt .

version:
	python3 tools/versioning.py $(VERSION)

legal:
	python tools/license_and_headers.py

install-pip-setuptools:
	python -m pip install -U "pip>=18.0, <19.0" "setuptools>=38.0, <39.0" wheel
