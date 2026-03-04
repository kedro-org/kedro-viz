## `kedro new --starter` fails on Python <3.11 with chardet 7.0.0

### Description

`kedro new --starter spaceflights-pandas` crashes with `NameError: name 'unicode' is not defined` when `chardet>=7.0.0` is installed on Python <3.11. This is caused by an incompatibility between `chardet 7.0.0` and `binaryornot 0.4.4`.

Kedro already pins `chardet<6` in its **test** dependencies (`pyproject.toml` test extras) to avoid `RequestsDependencyWarning`, but this pin does not apply to **runtime** dependencies. Since `binaryornot` is a runtime dependency (via `cookiecutter`), the bug affects any fresh environment that resolves `chardet>=7.0.0`.

### Root Cause

1. `chardet 7.0.0` returns `encoding: None` for certain files in the starter template
2. `binaryornot 0.4.4` calls `bytes.decode(encoding=None)`:
   - **Python 3.11+**: This silently defaults to utf-8 — no crash
   - **Python 3.10 and below**: Raises `TypeError: decode() argument 'encoding' must be str, not None`
3. The exception handler in `binaryornot` falls back to `unicode(...)` which doesn't exist in Python 3 → `NameError`

### Reproduction Steps

```bash
python3.10 -m venv /tmp/test-venv-310
source /tmp/test-venv-310/bin/activate
pip install kedro cookiecutter binaryornot chardet

cat > /tmp/test-config.yml << 'EOF'
project_name: test-project
repo_name: test-project
output_dir: /tmp
python_package: test_project
include_example: true
EOF

kedro new --starter spaceflights-pandas --config /tmp/test-config.yml --verbose
```

### Error Output

```
Traceback (most recent call last):
  File "binaryornot/helpers.py", line 103, in is_binary_string
    bytes_to_check.decode(encoding=detected_encoding['encoding'])
TypeError: decode() argument 'encoding' must be str, not None

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "kedro/framework/cli/starters.py", line 948, in _create_project
    result_path = cookiecutter(template=template_path, **cookiecutter_args)
  File "cookiecutter/main.py", line 185, in cookiecutter
    result = generate_files(
  File "cookiecutter/generate.py", line 448, in generate_files
    generate_file(
  File "cookiecutter/generate.py", line 221, in generate_file
    if is_binary(infile):
  File "binaryornot/check.py", line 33, in is_binary
    return is_binary_string(chunk)
  File "binaryornot/helpers.py", line 106, in is_binary_string
    unicode(bytes_to_check, encoding=detected_encoding['encoding'])
NameError: name 'unicode' is not defined
```

### Dependency Chain

```
kedro → cookiecutter → binaryornot → chardet
```

- `cookiecutter>=2.1.1,<3.0` (kedro runtime dependency)
- `binaryornot>=0.4.4` (cookiecutter dependency)
- `chardet>=3.0.2` (binaryornot dependency) → resolves to 7.0.0

### Existing Pin

Kedro already has in `pyproject.toml`:
```toml
test = [
    "chardet<6",  # Temporary: remove once requests supports chardet 6
    ...
]
```

This pin is only in the **test** extras and does not protect runtime installations.

### Suggested Fix

Add `chardet<7` (or `chardet<6` for consistency) as a **runtime** dependency constraint, either:

1. In kedro's `pyproject.toml` dependencies directly
2. Or as a constraint on cookiecutter: `cookiecutter<3.0,>=2.1.1` with an additional `chardet<7`

Alternatively, the upstream fix should be in `binaryornot` which has a broken Python 2 fallback (`unicode()`) in `helpers.py:106`.

### Affected Versions

- **Fails**: Python 3.10 + chardet 7.0.0 + binaryornot 0.4.4
- **Works**: Python 3.11+ (any chardet version — `bytes.decode(encoding=None)` silently defaults to utf-8)
- **Works**: Any Python + chardet <7.0.0 (returns valid encoding string, never None)

### Environment

- **kedro**: 1.2.0 (also reproducible with main branch)
- **cookiecutter**: 2.7.1
- **binaryornot**: 0.4.4
- **chardet**: 7.0.0
- **Python**: 3.10 (fails), 3.11+ (works)
- **OS**: macOS (reproduced locally), Ubuntu (GitHub Actions CI)
