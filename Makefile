.PHONY: package build

package:
	find . -regex ".*/__pycache__" -exec rm -rf {} +
	find . -regex ".*\.egg-info" -exec rm -rf {} +
	test -f package/kedro_viz/html/index.html || (echo "Built npm package not found; packaging process cancelled."; exit 1)
	cd package && rm -rf build/ dist/
	cd package && python -m build

build:
	rm -rf build package/build package/dist package/kedro_viz/html pip-wheel-metadata package/kedro_viz.egg-info
	npm run build
	cp -R build package/kedro_viz/html

PROJECT_PATH ?= demo-project
PYTHONWARNINGS ?= "ignore:Kedro is not yet fully compatible"

run:
	PYTHONWARNINGS=$(PYTHONWARNINGS) PYTHONPATH="$(shell pwd)/package" python3 package/kedro_viz/server.py $(PROJECT_PATH)

pytest:
	cd package && PYTHONWARNINGS=$(PYTHONWARNINGS) pytest --cov-fail-under=100

e2e-tests:
	cd package && PYTHONWARNINGS=$(PYTHONWARNINGS) behave

lint: format-fix lint-check

format-fix:
	ruff check --fix
	ruff format

format-check:
	ruff check
	ruff format --check

lint-check:
	ruff check
	mypy --config-file=package/mypy.ini package/kedro_viz package/features
	mypy --disable-error-code abstract --config-file=package/mypy.ini package/tests

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
