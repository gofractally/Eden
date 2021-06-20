#include <stdio.h>
#include <cltestlib/cltestlib.hpp>
#include <fc/exception/exception.hpp>

int main()
{
   try
   {
      fc::logger::get(DEFAULT_LOGGER).set_log_level(fc::log_level::debug);
      fc::temp_directory dir;
      std::unique_ptr<eosio::chain::controller::config> cfg;
      eosio::chain::genesis_state genesis;
      genesis.initial_timestamp = fc::time_point::from_iso_string("2020-01-01T00:00:00.000");
      cfg = std::make_unique<eosio::chain::controller::config>();
      cfg->blocks_dir = dir.path() / "blocks";
      cfg->state_dir = dir.path() / "state";
      cfg->contracts_console = true;
      cfg->state_size = 200 * 1024 * 1024;
      cfg->state_guard_size = 0;
      cltestlib::test_chain t;
      t.control = std::make_unique<eosio::chain::controller>(
          *cfg, cltestlib::make_protocol_feature_set(), genesis.compute_chain_id());
      t.control->add_indices();
      t.control->startup([] { return false; }, genesis);
      t.control->start_block(t.control->head_block_time() + fc::microseconds(t.block_interval_us),
                             0,
                             {*t.control->get_protocol_feature_manager().get_builtin_digest(
                                 eosio::chain::builtin_protocol_feature_t::preactivate_feature)});
      t.start_block(0);
      t.start_block(0);
      t.start_block(0);
      t.start_block(0);
      return 0;
   }
   catch (fc::exception& e)
   {
      std::cerr << "fc::exception: " << e.to_string() << "\n";
   }
   catch (std::exception& e)
   {
      std::cerr << "std::exception: " << e.what() << "\n";
   }
   catch (...)
   {
      std::cerr << "unknown exception\n";
   }
   return 1;
}
