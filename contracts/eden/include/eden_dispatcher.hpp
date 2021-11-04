#pragma once

#include <eosio/dispatcher.hpp>

#define EOSIO_MATCH_ACTIONeden_auth_action EOSIO_MATCH_YES
#define EOSIO_EXTRACT_ACTION_NAMEeden_auth_action(name, index, ...) name
#define EOSIO_EXTRACT_ACTION_ARGSeden_auth_action(name, index, ...) __VA_ARGS__
