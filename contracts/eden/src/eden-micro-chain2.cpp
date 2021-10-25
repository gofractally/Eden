#include <micro-chain/_tables.hpp>
#include <micro-chain/_types.hpp>
#include <micro-chain/status.hpp>

using namespace micro_chain;

// TODO: switch to uint64_t (js BigInt) after we upgrade to nodejs >= 15
extern "C" void __wasm_call_ctors();
[[clang::export_name("initialize")]] void initialize(uint32_t eden_account_low,
                                                     uint32_t eden_account_high,
                                                     uint32_t token_account_low,
                                                     uint32_t token_account_high,
                                                     uint32_t atomic_account_low,
                                                     uint32_t atomic_account_high,
                                                     uint32_t atomicmarket_account_low,
                                                     uint32_t atomicmarket_account_high)
{
   __wasm_call_ctors();
   eden_account.value = (uint64_t(eden_account_high) << 32) | eden_account_low;
   token_account.value = (uint64_t(token_account_high) << 32) | token_account_low;
   atomic_account.value = (uint64_t(atomic_account_high) << 32) | atomic_account_low;
   atomicmarket_account.value =
       (uint64_t(atomicmarket_account_high) << 32) | atomicmarket_account_low;

   distribution_fund.value = eden_account.value + 1;
}

[[clang::export_name("allocateMemory")]] void* allocateMemory(uint32_t size)
{
   return malloc(size);
}

[[clang::export_name("freeMemory")]] void freeMemory(void* p)
{
   free(p);
}

std::variant<std::string, std::vector<char>> result;
[[clang::export_name("getResultSize")]] uint32_t getResultSize()
{
   return std::visit([](auto& data) { return data.size(); }, result);
}

[[clang::export_name("getResult")]] const char* getResult()
{
   return std::visit([](auto& data) { return data.data(); }, result);
}
