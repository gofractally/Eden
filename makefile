SHELL := /bin/bash
BLUE   := $(shell tput -Txterm setaf 6)
RESET  := $(shell tput -Txterm sgr0)
WEBAPP_BUILD_DIR := ./build-env-webapp
BOX_BUILD_DIR := ./build-env-box

build-env-files-webapp: ##@devops Generate proper dev files webapp based on the templates
build-env-files-webapp: ./env-templates
	@echo "Build dev webapp files..."
	@rm -Rf $(WEBAPP_BUILD_DIR) && mkdir -p $(WEBAPP_BUILD_DIR)
	@cp ./env-templates/.env-webapp-$(ENVIRONMENT) $(WEBAPP_BUILD_DIR)/.env-webapp-$(ENVIRONMENT)
	@echo $(WEBAPP_BUILD_DIR)/.env-webapp-$(ENVIRONMENT)
	@envsubst <$(WEBAPP_BUILD_DIR)/.env-webapp-$(ENVIRONMENT) >./packages/webapp/.env
	@echo ./packages/webapp/.env
	
build-env-files-box: ##@devops Generate proper dev files box based on the templates
build-env-files-box: ./env-templates
	@echo "Build dev box files..."
	@rm -Rf $(BOX_BUILD_DIR) && mkdir -p $(BOX_BUILD_DIR)
	@cp ./env-templates/.env-box-$(ENVIRONMENT) $(BOX_BUILD_DIR)/.env-box-$(ENVIRONMENT)
	@envsubst <$(BOX_BUILD_DIR)/.env-box-$(ENVIRONMENT) >./packages/box/.env