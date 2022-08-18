-include .env

VERSION ?= $(shell git rev-parse --short HEAD)


MAKE_ENV += VERSION

SHELL_EXPORT := $(foreach v,$(MAKE_ENV),$(v)='$($(v))')

ifneq ("$(wildcard .env)", "")
	export $(shell sed 's/=.*//' .env)
endif