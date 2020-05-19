NPM_PACKAGE := $(shell node -e 'console.log(require("./package.json").name)')
NPM_VERSION := $(shell node -e 'console.log(require("./package.json").version)')

TMP_PATH    := /tmp/${NPM_PACKAGE}-$(shell date +%s)

REMOTE_NAME ?= origin
REMOTE_REPO ?= $(shell git config --get remote.${REMOTE_NAME}.url)

CURR_HEAD   := $(firstword $(shell git show-ref --hash HEAD | cut --bytes=-6) master)
GITHUB_PROJ := nodeca/${NPM_PACKAGE}


lint:
	npm run lint

test:
	npm test

coverage:
	npm run coverage

doc:
	rm -rf ./doc
	./node_modules/.bin/ndoc --link-format "{package.homepage}/blob/${CURR_HEAD}/{file}#L{line}"

gh-pages:
	npm run gh-pages

parser:
	npm run parser


browserify:
	rm -rf ./dist
	mkdir dist
	# Browserify
	( echo -n "/* ${NPM_PACKAGE} ${NPM_VERSION} ${GITHUB_PROJ} */" ; \
		./node_modules/.bin/browserify -r ./ -s Babelfish \
		) > dist/babelfish.js
	# Minify
	./node_modules/.bin/terser dist/babelfish.js -c -m \
		-b beautify=false,preamble="'/* ${NPM_PACKAGE} ${NPM_VERSION} ${GITHUB_PROJ} */'" \
		> dist/babelfish.min.js


publish:
	@if test 0 -ne `git status --porcelain | wc -l` ; then \
		echo "Unclean working tree. Commit or stash changes first." >&2 ; \
		exit 128 ; \
		fi
	@if test 0 -ne `git fetch ; git status | grep '^# Your branch' | wc -l` ; then \
		echo "Local/Remote history differs. Please push/pull changes." >&2 ; \
		exit 128 ; \
		fi
	@if test 0 -ne `git tag -l ${NPM_VERSION} | wc -l` ; then \
		echo "Tag ${NPM_VERSION} exists. Update package.json" >&2 ; \
		exit 128 ; \
		fi
	git tag ${NPM_VERSION} && git push origin ${NPM_VERSION}
	npm publish https://github.com/${GITHUB_PROJ}/tarball/${NPM_VERSION}

todo:
	grep 'TODO' -n -r ./lib 2>/dev/null || test true


.PHONY: lint test doc dev-deps gh-pages todo coverage
.SILENT: lint test doc todo
