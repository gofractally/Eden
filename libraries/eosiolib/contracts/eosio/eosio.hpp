/**
 *  @file
 *  @copyright defined in eos/LICENSE
 */
#pragma once
#include <eosio/contract.hpp>
#include <eosio/dispatcher.hpp>
#include <eosio/multi_index.hpp>
#include <eosio/print.hpp>

#ifdef COMPILING_ABIGEN
#include <eosio/abi_generator.hpp>
#else
#define EOSIO_ABIGEN(...)
#endif

#ifndef EOSIO_NATIVE
static_assert(sizeof(long) == sizeof(int), "unexpected size difference");
#endif

/**
 * @defgroup core Core API
 * @brief C++ Core API for chain-agnostic smart-contract functionality
 */

/**
 * @defgroup contracts Contracts API
 * @brief C++ Contracts API for chain-dependent smart-contract functionality
 */

/**
 * @defgroup types Types
 * @brief C++ Types API for data layout of data-structures available for the EOSIO platform
 */
