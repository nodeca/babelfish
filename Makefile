PATH        := ./node_modules/.bin:${PATH}

PROJECT     :=  $(notdir ${PWD})
TMP_PATH    := /tmp/${PROJECT}-$(shell date +%s)

REMOTE_NAME ?= origin
REMOTE_REPO ?= $(shell git config --get remote.${REMOTE_NAME}.url)


test:
	@if test ! `which vows` ; then \
		echo "You need vows installed in order to run tests." >&2 ; \
		echo "  $ npm install vows" >&2 ; \
		exit 128 ; \
		fi
	NODE_ENV=test vows --spec

lint:
	@if test ! `which jslint` ; then \
		echo "You need jslint installed in order to run tests." >&2 ; \
		echo "  $ npm install jslint" >&2 ; \
		exit 128 ; \
		fi
	# (node)    -> Node.JS compatibility mode
	# (indent)  -> indentation level (2 spaces)
	# (nomen)   -> tolerate underscores in identifiers (e.g. `var _val = 1`)
	jslint --node --nomen --indent=2 ./lib/*.js ./lib/**/*.js

doc:
	@if test ! `which ndoc` ; then \
		echo "You need 'ndoc' installed in order to generate docs." >&2 ; \
		echo "  $ npm install ndoc" >&2 ; \
		exit 128 ; \
		fi
	ndoc -o ./doc ./lib

dev-deps:
	@if test ! `which npm` ; then \
		echo "You need 'npm' installed." >&2 ; \
		echo "  See: http://npmjs.org/" >&2 ; \
		exit 128 ; \
		fi
	npm install --dev

gh-pages:
	@if test -z ${REMOTE_REPO} ; then \
		echo 'Remote repo URL not found' >&2 ; \
		exit 128 ; \
		fi
	$(MAKE) doc && \
		cp -r ./doc ${TMP_PATH} && \
		touch ${TMP_PATH}/.nojekyll
	cd ${TMP_PATH} && \
		git init && \
		git add . && \
		git commit -q -m 'Recreated docs'
	cd ${TMP_PATH} && \
		git remote add remote ${REMOTE_REPO} && \
		git push --force remote +master:gh-pages 
	rm -rf ${TMP_PATH}

todo:
	grep 'TODO' -n -r ./lib 2>/dev/null || test true


.PHONY: test dev-deps gh-pages todo
.SILENT: test doc todo
