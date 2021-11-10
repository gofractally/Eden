#pragma once

#define EOSIO_ABIGEN_ITEMauth_actions(ns, variant_name, missing_struct_name)           \
   ([&] {                                                                              \
      gen.def.structs.push_back(eosio::struct_def{missing_struct_name});               \
      eosio::variant_def vdef{variant_name};                                           \
      ns::for_each_session_action([&](uint32_t index, const char* name, const auto&) { \
         if (index >= vdef.types.size())                                               \
            vdef.types.resize(index + 1, missing_struct_name);                         \
         vdef.types[index] = name;                                                     \
      });                                                                              \
      auto& variants = gen.def.variants.value;                                         \
      auto it = std::find_if(variants.begin(), variants.end(),                         \
                             [&](auto& d) { return d.name == variant_name; });         \
      if (it != variants.end())                                                        \
         *it = std::move(vdef);                                                        \
      else                                                                             \
         variants.push_back(std::move(vdef));                                          \
   })();                                                                               \
   , 1
