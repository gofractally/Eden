#pragma once
#include <appbase/application.hpp>
#include <eosio/chain_plugin/chain_plugin.hpp>

namespace eosio
{
   struct debug_plugin_impl;

   class debug_plugin : public appbase::plugin<debug_plugin>
   {
     public:
      APPBASE_PLUGIN_REQUIRES((chain_plugin))

      debug_plugin();
      virtual ~debug_plugin();

      void set_program_options(appbase::options_description& cli,
                               appbase::options_description& cfg) override;
      void plugin_initialize(const appbase::variables_map& options);
      void plugin_startup();
      void plugin_shutdown();

     private:
      std::shared_ptr<debug_plugin_impl> my;
   };
}  // namespace eosio
