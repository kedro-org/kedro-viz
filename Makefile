package: install
	cd package && python setup.py clean --all
	cd package && python setup.py sdist bdist_wheel

install: build
	cd package && python setup.py install

build: clean
	npm run build
	cp -R build package/kedro_viz/html

clean:
	rm -rf build package/build package/dist package/kedro_viz/html pip-wheel-metadata package/kedro_viz.egg-info
	find . -regex ".*/__pycache__" -exec rm -rf {} +
	find . -regex ".*\.egg-info" -exec rm -rf {} +

PROJECT_PATH ?= demo-project

run:
	PYTHONPATH=$(shell pwd)/package python3 package/kedro_viz/server.py $(PROJECT_PATH)

pytest: build
	cd package && pytest --cov-fail-under=100

e2e-tests: build
	cd package && behave

lint: format-fix lint-check

format-fix:
	isort package/kedro_viz package/tests package/features
	black package/kedro_viz package/tests package/features

format-check:
	isort --check package/kedro_viz package/tests package/features
	black --check package/kedro_viz package/tests package/features

lint-check:
	pylint --rcfile=package/.pylintrc -j 0 package/kedro_viz
	pylint --rcfile=package/.pylintrc -j 0 --disable=protected-access,missing-docstring,redefined-outer-name,no-self-use,invalid-name,too-few-public-methods,no-member,unused-argument,duplicate-code package/tests
	pylint --rcfile=package/.pylintrc -j 0 --disable=missing-docstring,no-name-in-module,unused-argument package/features
	flake8 --config=package/.flake8 package
	mypy --config-file=package/mypy.ini package

secret-scan:
	trufflehog --max_depth 1 --exclude_path trufflehog-ignore.txt .

security-scan:
	bandit -ll -q -r kedro_viz

version:
	python3 tools/versioning.py $(VERSION)

install-pip-setuptools:
	python -m pip install -U "pip>=18.0, <19.0" "setuptools>=38.0, <39.0" wheel

sign-off:
	echo "git interpret-trailers --if-exists doNothing \c" > .git/hooks/commit-msg
	echo '--trailer "Signed-off-by: $$(git config user.name) <$$(git config user.email)>" \c' >> .git/hooks/commit-msg
	echo '--in-place "$$1"' >> .git/hooks/commit-msg
	chmod +x .git/hooks/commit-msg
