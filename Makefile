clean:
	rm -rf build
	rm -rf package/kernelviz/html
	rm -rf package/build
	rm -rf package/dist
	rm -rf package/kernelviz.egg-info

package-all:
	cd package && python setup.py bdist_wheel

run:
	python package/kernelviz/server.py --port 4343 --logdir logs/

build: clean
	npm run build
	cp -R build package/kernelviz/html

make pytest: build
	cd package && python setup.py install
	cd package && pytest --verbose
