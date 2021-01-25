.PHONY: init dev


init:
	yarn

clean:
	rm -rf dist
# 开发
dev: init clean 
	yarn run dev

build: init clean
	yarn run build

