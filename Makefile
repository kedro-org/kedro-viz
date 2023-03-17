.PHONY: package build

package:
	find . -regex ".*/__pycache__" -exec rm -rf {} +
	find . -regex ".*\.egg-info" -exec rm -rf {} +
	test -f package/kedro_viz/html/index.html || (echo "Built npm package not found; packaging process cancelled."; exit 1)
	cd package && python setup.py clean --all
	cd package && python setup.py sdist bdist_wheel

build:
	rm -rf build package/build package/dist package/kedro_viz/html pip-wheel-metadata package/kedro_viz.egg-info
	npm run build
	cp -R build package/kedro_viz/html

PROJECT_PATH ?= demo-project

run:
	PYTHONPATH="$(shell pwd)/package" python3 package/kedro_viz/server.py $(PROJECT_PATH)

pytest:
	cd package && pytest --cov-fail-under=100

e2e-tests:
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
	pylint --rcfile=package/.pylintrc -j 0 --disable=protected-access,missing-docstring,redefined-outer-name,invalid-name,too-few-public-methods,no-member,unused-argument,duplicate-code package/tests
	pylint --rcfile=package/.pylintrc -j 0 --disable=missing-docstring,no-name-in-module,unused-argument package/features
	flake8 --config=package/.flake8 package
	mypy --config-file=package/mypy.ini package

schema-fix:
	strawberry export-schema --app-dir=package kedro_viz.api.graphql.schema > src/apollo/schema.graphql
	graphqlviz src/apollo/schema.graphql | dot -Tpng -o .github/img/schema.graphql.png

schema-check:
	strawberry export-schema --app-dir=package kedro_viz.api.graphql.schema | diff src/apollo/schema.graphql -

secret-scan:
	trufflehog --max_depth 1 --exclude_path trufflehog-ignore.txt .

security-scan:
	bandit -ll -q -r kedro_viz

strawberry-server:
	strawberry server --app-dir=package kedro_viz.api.graphql.schema --host 127.0.0.1

version:
	python3 tools/versioning.py $(VERSION)

sign-off:
	echo "git interpret-trailers --if-exists doNothing \c" > .git/hooks/commit-msg
	echo '--trailer "Signed-off-by: $$(git config user.name) <$$(git config user.email)>" \c' >> .git/hooks/commit-msg
	echo '--in-place "$$1"' >> .git/hooks/commit-msg
	chmod +x .git/hooks/commit-msg
