# Remove artifacts created by python
clean-py:
	find . -type d -name  "__pycache__" -exec rm -r {} +

# Remove outputs created as part of the pipline
clean-data:
	find data -type f | grep -E '.+0[2-9]' | grep -v '.gitkeep' | xargs rm -fr
	find data -type d | grep -E '.+0[2-9]_[a-z]+/.+/' | grep -o 'data/.._.*/' | sort -u | xargs rm -rf

# Create environment
env:
	conda create -n mod-spaceflights python=3.8 -y --force

# Install pre-commit
install-pre-commit:
	pre-commit install --install-hooks

# Uninstall pre-commit
uninstall-pre-commit:
	pre-commit uninstall
	pre-commit uninstall --hook-type pre-push
