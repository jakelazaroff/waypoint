.DEFAULT_GOAL = help

##@ Development
.PHONY: dev dev-client dev-serve

dev: ## Run the app in development
	@make -j 2 dev-client dev-server

dev-client:
	@pnpm dev

dev-server:
	@pnpm ysweet

##@ Deploying
.PHONY: build deploy

build: ## Build the web client
	@pnpm build

deploy: ## Deploy the y-sweet worker
	@cd lib/y-sweet/crates/y-sweet-worker && ./build.sh
	@pnpm wrangler deploy

##@ Help
.PHONY: help

help:  ## Display this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[.a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)
