.PHONY: package build run pytest e2e-tests lint format-fix format-check lint-check secret-scan security-scan strawberry-server version sign-off

# Paths and settings
PROJECT_PATH ?= demo-project
PYTHONWARNINGS ?= "ignore:Kedro is not yet fully compatible"

# Build and package
build:
	rm -rf dist package/dist package/kedro_viz/html pip-wheel-metadata package/kedro_viz.egg-info
	npm run build
	cp -R dist package/kedro_viz/html

package:
	find . -regex ".*/__pycache__" -exec rm -rf {} +
	find . -regex ".*\.egg-info" -exec rm -rf {} +
	test -f package/kedro_viz/html/index.html || (echo "Built npm package not found; packaging process cancelled."; exit 1)
	cd package && rm -rf build/ dist/
	cd package && python -m build

# Dev server
run:
	PYTHONWARNINGS=$(PYTHONWARNINGS) PYTHONPATH="$(shell pwd)/package" python3 package/kedro_viz/server.py $(PROJECT_PATH)

# Tests
pytest:
	cd package && PYTHONWARNINGS=$(PYTHONWARNINGS) pytest --cov-fail-under=100

e2e-tests:
	cd package && PYTHONWARNINGS=$(PYTHONWARNINGS) behave

# Linting and formatting
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

# Security and secrets
secret-scan:
	trufflehog --max_depth 1 --exclude_path trufflehog-ignore.txt .

security-scan:
	bandit -ll -q -r kedro_viz

# GraphQL server
strawberry-server:
	strawberry server --app-dir=package kedro_viz.api.graphql.schema --host 127.0.0.1

# Versioning
version:
	npm run build:esm
	python3 tools/versioning.py $(VERSION)

# Commit sign-off hook
sign-off:
	echo "git interpret-trailers --if-exists doNothing \c" > .git/hooks/commit-msg
	echo '--trailer "Signed-off-by: $$(git config user.name) <$$(git config user.email)>" \c' >> .git/hooks/commit-msg
	echo '--in-place "$$1"' >> .git/hooks/commit-msg
	chmod +x .git/hooks/commit-msg

serve-docs:
	cd package && uv pip install -e ".[docs]"
	mkdocs serve

build-docs:
	cd package && uv pip install -e ".[docs]"
	mkdocs build

fix-markdownlint:
	npm install -g markdownlint-cli2
	# markdownlint rules are defined in .markdownlint.yaml
	markdownlint-cli2 --config .markdownlint.yaml --fix "/docs/**/*.md"

check-docs:
	cd package && uv pip install --system -e ".[docs]"
	mkdocs build --strict
