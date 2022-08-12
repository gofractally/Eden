SHELL := /bin/bash
BLUE   := $(shell tput -Txterm setaf 6)
RESET  := $(shell tput -Txterm sgr0)
WEBAPP_BUILD_DIR := ./build-env-webapp
BOX_BUILD_DIR := ./build-env-box
VERSION ?= $(shell git rev-parse --short HEAD)
K8S_BUILD_DIR ?= ./build_k8s
K8S_FILES := $(shell find ./kubernetes-$(ENVIRONMENT) -name '*.yaml' | sed 's:./kubernetes-$(ENVIRONMENT)/::g')

build-env-files-webapp: ##@devops Generate proper dev files webapp based on the templates
build-env-files-webapp: ./env-templates
	@echo "Build dev webapp files..."
	@rm -Rf $(WEBAPP_BUILD_DIR) && mkdir -p $(WEBAPP_BUILD_DIR)
	@cp ./env-templates/.env-webapp-$(ENVIRONMENT) $(WEBAPP_BUILD_DIR)/.env-webapp-$(ENVIRONMENT)
	@cat $(WEBAPP_BUILD_DIR)/.env-webapp-$(ENVIRONMENT)
	@envsubst <$(WEBAPP_BUILD_DIR)/.env-webapp-$(ENVIRONMENT) >./packages/webapp/.env
	@cat ./packages/webapp/.env
	
build-env-files-box: ##@devops Generate proper dev files box based on the templates
build-env-files-box: ./env-templates
	@echo "Build dev box files..."
	@rm -Rf $(BOX_BUILD_DIR) && mkdir -p $(BOX_BUILD_DIR)
	@cp ./env-templates/.env-box-$(ENVIRONMENT) $(BOX_BUILD_DIR)/.env-box-$(ENVIRONMENT)
	@cat $(BOX_BUILD_DIR)/.env-box-$(ENVIRONMENT)
	@envsubst <$(BOX_BUILD_DIR)/.env-box-$(ENVIRONMENT) >./packages/box/.env
	@cat ./packages/box/.env

build-kubernetes: ##@devops Generate proper k8s files based on the templates
build-kubernetes: ./kubernetes-$(ENVIRONMENT)
	@echo "Build kubernetes files..."
	@rm -Rf $(K8S_BUILD_DIR) && mkdir -p $(K8S_BUILD_DIR)
	@for file in $(K8S_FILES); do \
		mkdir -p `dirname "$(K8S_BUILD_DIR)/$$file"`; \
		envsubst <./kubernetes-$(ENVIRONMENT)/$$file >$(K8S_BUILD_DIR)/$$file; \
	done

deploy-kubernetes: ##@devops Publish the build k8s files
deploy-kubernetes: $(K8S_BUILD_DIR)
	@kubectl create ns $(NAMESPACE) || echo "Namespace '$(NAMESPACE)' already exists.";
	@echo "Applying kubernetes files..."
	@for file in $(shell find $(K8S_BUILD_DIR) -name '*.yaml' | sed 's:$(K8S_BUILD_DIR)/::g'); do \
		kubectl apply -f $(K8S_BUILD_DIR)/$$file -n $(NAMESPACE) || echo "${file} Cannot be updated."; \
	done