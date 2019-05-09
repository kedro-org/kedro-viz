clean:
	rm -rf build
	rm -rf package/kedroviz/html
	rm -rf package/build
	rm -rf package/dist
	rm -rf package/kedroviz.egg-info
	find package/ | grep -E "(__pycache__|\.pytest_cache|\.eggs|\.pyc|\.pyo$\)"\
		| xargs rm -rf

package-all:
	cd package && python setup.py bdist_wheel

publish:
	cd package && python3 setup.py bdist_wheel upload -r pypi-qb

run:
	python package/kedroviz/server.py --port 4343 --logdir logs/

build: clean
	npm run build
	cp -R build package/kedroviz/html

make pytest: build
	cd package && python3 setup.py test
