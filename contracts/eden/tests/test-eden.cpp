#include <tester-base.hpp>

#define CATCH_CONFIG_RUNNER

bool write_expected = false;

const eosio::private_key alice_session_priv_key =
    private_key_from_string("5KdMjZ6vrbQWromznw5v7WLt4q92abv8sKgRKzagpj8SHacnozX");
const eosio::public_key alice_session_pub_key =
    public_key_from_string("EOS665ajq1JUMwWH3bHcRxxTqiZBZBc6CakwUfLkZJxRqp4vyzqsQ");

const eosio::private_key alice_session_2_priv_key =
    private_key_from_string("5KKnoRi3WfLL82sS4WdP8YXmezVR24Y8jxy5JXzwC2SouqoHgu2");
const eosio::public_key alice_session_2_pub_key =
    public_key_from_string("EOS8VWTR1mogYHEd9HJxgG2Tj3GbPghrnJqMfWfdHbTE11BJmyLRR");

const eosio::private_key pip_session_priv_key =
    private_key_from_string("5KZLNGfDrqPM1yVL5zPXMhbAHBSi6ZtU2seqeUdEfudPgv9n93h");
const eosio::public_key pip_session_pub_key =
    public_key_from_string("EOS8YQhKe3x1xTA1KHmkBPznWqa3UGQsaHTUMkJJtcds9giK4Erft");

const eosio::private_key egeon_session_priv_key =
    private_key_from_string("5Jk9RLHvhSgN8h7VjRGdY91GpeoXs5qP7JnizReg4DXBqtbGM8y");
const eosio::public_key egeon_session_pub_key =
    public_key_from_string("EOS8kBx4XYj3zZ3Z1Sb8vdq43ursVTebfcShKMDUymiA2ctcznX71");

const eosio::private_key bertie_session_priv_key =
    private_key_from_string("5Jr4bSzJWhtr3bxY83xRDhUTgir9Mhn6YwVt4Y9SRgu1GopZ5vA");
const eosio::public_key bertie_session_pub_key =
    public_key_from_string("EOS5iALbhfqEZvqkUifUGbfMQSFnd1ui8ZsXVHT23XWh1HLyyPrJE");

int main(int argc, char* argv[])
{
   Catch::Session session;
   auto cli = session.cli() | Catch::clara::Opt(write_expected)["--write"]("Write .expected files");
   session.cli(cli);
   auto ret = session.applyCommandLine(argc, argv);
   if (ret)
      return ret;
   return session.run();
}

struct CompareFile
{
   std::string expected_path;
   std::string actual_path;
   std::ofstream file;

   CompareFile(const std::string& name)
       : expected_path("eden-test-data/" + name + ".expected"),
         actual_path("eden-test-data/" + name + ".actual"),
         file{actual_path}
   {
      eosio::check(file.is_open(), "failed to open " + actual_path);
   }

   void compare()
   {
      file.close();
      if (write_expected)
         eosio::execute("cp " + actual_path + " " + expected_path);
      else
         eosio::check(!eosio::execute("diff " + expected_path + " " + actual_path),
                      "file mismatch between " + expected_path + ", " + actual_path);
   }

   auto& write_events(eosio::test_chain& chain)
   {
      uint32_t last_block = 1;
      while (auto history = chain.get_history(last_block + 1))
      {
         for (auto& ttrace : history->traces)
         {
            std::visit(
                [&](auto& ttrace) {
                   for (auto& atrace : ttrace.action_traces)
                   {
                      std::visit(
                          [&](auto& atrace) {
                             if (atrace.receiver == "eosio.null"_n &&
                                 atrace.act.name == "eden.events"_n)
                             {
                                std::vector<eden::event> events;
                                from_bin(events, atrace.act.data);
                                for (auto& event : events)
                                {
                                   std::string str;
                                   eosio::pretty_stream<
                                       eosio::time_point_include_z_stream<eosio::string_stream>>
                                       stream{str};
                                   to_json(event, stream);
                                   file << str << "\n";
                                }
                             }
                          },
                          atrace);
                   }
                },
                ttrace);
         }
         ++last_block;
      }
      return *this;
   }  // write_events
};    // CompareFile

TEST_CASE("genesis NFT pre-setup")
{
   eden_tester t;

   t.eden_gm.act<atomicassets::actions::createcol>(
       "eden.gm"_n, "eden.gm"_n, true, std::vector{"eden.gm"_n}, std::vector{"eden.gm"_n}, 0.05,
       atomicassets::attribute_map{});
   std::vector<atomicassets::format> schema{{"account", "string"}, {"name", "string"},
                                            {"img", "ipfs"},       {"bio", "string"},
                                            {"social", "string"},  {"video", "ipfs"}};
   t.eden_gm.act<atomicassets::actions::createschema>("eden.gm"_n, "eden.gm"_n, eden::schema_name,
                                                      schema);

   t.eden_gm.act<actions::genesis>(
       "Eden", eosio::symbol("EOS", 4), s2a("10.0000 EOS"),
       std::vector{"alice"_n, "pip"_n, "egeon"_n}, "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
       attribute_map{}, s2a("1.0000 EOS"), 7 * 24 * 60 * 60, "", 6, "15:30");
}

TEST_CASE("genesis NFT pre-setup with incorrect schema")
{
   eden_tester t;

   t.eden_gm.act<atomicassets::actions::createcol>(
       "eden.gm"_n, "eden.gm"_n, true, std::vector{"eden.gm"_n}, std::vector{"eden.gm"_n}, 0.05,
       atomicassets::attribute_map{});
   std::vector<atomicassets::format> schema{{"account", "uint64"}, {"name", "string"}};
   t.eden_gm.act<atomicassets::actions::createschema>("eden.gm"_n, "eden.gm"_n, eden::schema_name,
                                                      schema);

   auto trace = t.eden_gm.trace<actions::genesis>(
       "Eden", eosio::symbol("EOS", 4), s2a("10.0000 EOS"),
       std::vector{"alice"_n, "pip"_n, "egeon"_n}, "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
       attribute_map{}, s2a("1.0000 EOS"), 7 * 24 * 60 * 60, "", 6, "15:30");
   expect(trace, "there already is an attribute with the same name");
}

TEST_CASE("genesis NFT pre-setup with compatible schema")
{
   eden_tester t;

   t.eden_gm.act<atomicassets::actions::createcol>(
       "eden.gm"_n, "eden.gm"_n, true, std::vector{"eden.gm"_n}, std::vector{"eden.gm"_n}, 0.05,
       atomicassets::attribute_map{});
   std::vector<atomicassets::format> schema{{"social", "string"},
                                            {"pi", "float"},
                                            {"video", "ipfs"},
                                            {"account", "string"},
                                            {"name", "string"}};
   t.eden_gm.act<atomicassets::actions::createschema>("eden.gm"_n, "eden.gm"_n, eden::schema_name,
                                                      schema);

   t.eden_gm.act<actions::genesis>(
       "Eden", eosio::symbol("EOS", 4), s2a("10.0000 EOS"),
       std::vector{"alice"_n, "pip"_n, "egeon"_n}, "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
       attribute_map{}, s2a("1.0000 EOS"), 7 * 24 * 60 * 60, "", 6, "15:30");
}

TEST_CASE("genesis")
{
   eden_tester t;
   t.eden_gm.act<actions::genesis>(
       "Eden", eosio::symbol("EOS", 4), s2a("10.0000 EOS"),
       std::vector{"alice"_n, "pip"_n, "egeon"_n}, "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
       attribute_map{}, s2a("1.0000 EOS"), 7 * 24 * 60 * 60, "", 6, "15:30");

   CHECK(get_eden_membership("alice"_n).status() == eden::member_status::pending_membership);
   CHECK(get_eden_membership("pip"_n).status() == eden::member_status::pending_membership);
   CHECK(get_eden_membership("egeon"_n).status() == eden::member_status::pending_membership);

   t.alice.act<actions::inductprofil>(1, alice_profile);
   t.pip.act<actions::inductprofil>(2, pip_profile);
   t.egeon.act<actions::inductprofil>(3, egeon_profile);

   CHECK(get_eden_account("alice"_n) == std::nullopt);
   CHECK(get_token_balance("alice"_n) == s2a("1000.0000 EOS"));

   t.alice.act<token::actions::transfer>("alice"_n, "eden.gm"_n, s2a("100.0000 EOS"), "memo");
   t.pip.act<token::actions::transfer>("pip"_n, "eden.gm"_n, s2a("10.0000 EOS"), "memo");
   t.egeon.act<token::actions::transfer>("egeon"_n, "eden.gm"_n, s2a("10.0000 EOS"), "memo");

   CHECK(get_eden_account("alice"_n) != std::nullopt);
   CHECK(get_eden_account("alice"_n)->balance() == s2a("100.0000 EOS"));
   CHECK(get_token_balance("alice"_n) == s2a("900.0000 EOS"));

   t.alice.act<actions::inductdonate>("alice"_n, 1, s2a("10.0000 EOS"));
   t.pip.act<actions::inductdonate>("pip"_n, 2, s2a("10.0000 EOS"));

   t.eden_gm.act<actions::addtogenesis>(
       "bertie"_n, t.chain.get_head_block_info().timestamp.to_time_point() + eosio::days(1));

   t.egeon.act<actions::inductdonate>("egeon"_n, 3, s2a("10.0000 EOS"));

   CHECK(get_globals().stage == eden::contract_stage::genesis);

   t.bertie.act<actions::inductprofil>(4, bertie_profile);
   t.bertie.act<token::actions::transfer>("bertie"_n, "eden.gm"_n, s2a("100.0000 EOS"), "memo");
   t.bertie.act<actions::inductdonate>("bertie"_n, 4, s2a("10.0000 EOS"));

   CHECK(get_eden_account("alice"_n) != std::nullopt);
   CHECK(get_eden_account("alice"_n)->balance() == s2a("90.0000 EOS"));
   CHECK(get_token_balance("alice"_n) == s2a("900.0000 EOS"));

   CHECK(get_eden_membership("alice"_n).status() == eden::member_status::active_member);
   CHECK(get_eden_membership("pip"_n).status() == eden::member_status::active_member);
   CHECK(get_eden_membership("egeon"_n).status() == eden::member_status::active_member);
   CHECK(get_eden_membership("bertie"_n).status() == eden::member_status::active_member);

   CHECK(get_globals().stage == eden::contract_stage::active);

   CHECK(get_table_size<eden::induction_table_type>() == 0);
   CHECK(get_table_size<eden::endorsement_table_type>() == 0);
   CHECK(get_table_size<eden::member_table_type>() == 4);

   {
      auto template_id = get_eden_membership("alice"_n).nft_template_id();
      expect(t.eden_gm.trace<atomicassets::actions::mintasset>(
                 "eden.gm"_n, "eden.gm"_n, eden::schema_name, template_id, "alice"_n,
                 eden::atomicassets::attribute_map(), eden::atomicassets::attribute_map{},
                 std::vector<eosio::asset>()),
             "maxsupply has already been reached");
   }

   // Verify that all members have the same set of NFTs
   std::vector<int32_t> expected_assets;
   for (auto member : {"alice"_n, "pip"_n, "egeon"_n, "bertie"_n})
   {
      expected_assets.push_back(get_eden_membership(member).nft_template_id());
   }
   std::sort(expected_assets.begin(), expected_assets.end());
   for (auto member : {"alice"_n, "pip"_n, "egeon"_n, "bertie"_n, "atomicmarket"_n})
   {
      INFO(member.to_string() << "'s assets");
      auto assets = eden::atomicassets::assets_by_owner(eden::atomic_assets_account, member);
      std::sort(assets.begin(), assets.end());
      CHECK(assets == expected_assets);
   }
}

TEST_CASE("genesis expiration")
{
   eden_tester t;
   t.eden_gm.act<actions::genesis>("Eden", eosio::symbol("EOS", 4), s2a("10.0000 EOS"),
                                   std::vector{"alice"_n, "pip"_n, "egeon"_n, "bertie"_n},
                                   "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
                                   attribute_map{}, s2a("1.0000 EOS"), 14 * 24 * 60 * 60, "", 6,
                                   "15:30");

   CHECK(get_eden_membership("alice"_n).status() == eden::member_status::pending_membership);
   CHECK(get_eden_membership("pip"_n).status() == eden::member_status::pending_membership);
   CHECK(get_eden_membership("egeon"_n).status() == eden::member_status::pending_membership);
   CHECK(get_eden_membership("bertie"_n).status() == eden::member_status::pending_membership);

   t.alice.act<actions::inductprofil>(1, alice_profile);
   t.pip.act<actions::inductprofil>(2, pip_profile);
   t.egeon.act<actions::inductprofil>(3, egeon_profile);

   t.alice.act<token::actions::transfer>("alice"_n, "eden.gm"_n, s2a("100.0000 EOS"), "memo");
   t.pip.act<token::actions::transfer>("pip"_n, "eden.gm"_n, s2a("10.0000 EOS"), "memo");
   t.egeon.act<token::actions::transfer>("egeon"_n, "eden.gm"_n, s2a("10.0000 EOS"), "memo");

   t.alice.act<actions::inductdonate>("alice"_n, 1, s2a("10.0000 EOS"));
   t.pip.act<actions::inductdonate>("pip"_n, 2, s2a("10.0000 EOS"));
   t.egeon.act<actions::inductdonate>("egeon"_n, 3, s2a("10.0000 EOS"));

   CHECK(get_eden_membership("alice"_n).status() == eden::member_status::active_member);
   CHECK(get_eden_membership("pip"_n).status() == eden::member_status::active_member);
   CHECK(get_eden_membership("egeon"_n).status() == eden::member_status::active_member);

   CHECK(get_globals().stage == eden::contract_stage::genesis);

   // Wait for Bertie's genesis invitation to expire
   t.chain.start_block(7 * 24 * 60 * 60 * 1000);
   expect(t.alice.trace<actions::gc>(42), "Nothing to do");
   // Extend Bertie's invitation
   expect(t.eden_gm.trace<actions::gensetexpire>(
              4, t.chain.get_head_block_info().timestamp.to_time_point() + eosio::days(8)),
          "too far in the future");
   expect(t.eden_gm.trace<actions::gensetexpire>(
              4, t.chain.get_head_block_info().timestamp.to_time_point() - eosio::days(8)),
          "in the past");
   t.chain.start_block(10 * 1000);
   expect(t.eden_gm.trace<actions::gensetexpire>(
              4, t.chain.get_head_block_info().timestamp.to_time_point()),
          "in the past");
   t.eden_gm.trace<actions::gensetexpire>(
       4, t.chain.get_head_block_info().timestamp.to_time_point() + eosio::milliseconds(10500));
   expect(t.alice.trace<actions::gc>(42), "Nothing to do");
   t.chain.start_block(10 * 1000);
   expect(t.alice.trace<actions::gc>(42), "Nothing to do");
   t.chain.start_block();
   t.alice.act<actions::gc>(42);

   CHECK(get_globals().stage == eden::contract_stage::active);

   CHECK(members("eden.gm"_n).stats().active_members == 3);
   CHECK(members("eden.gm"_n).stats().pending_members == 0);
   CHECK(get_table_size<eden::induction_table_type>() == 0);
   CHECK(get_table_size<eden::endorsement_table_type>() == 0);
   CHECK(get_table_size<eden::member_table_type>() == 3);
}

TEST_CASE("genesis replacement")
{
   eden_tester t;
   t.eden_gm.act<actions::genesis>(
       "Eden", eosio::symbol("EOS", 4), s2a("10.0000 EOS"),
       std::vector{"alice"_n, "pip"_n, "egeon"_n}, "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
       attribute_map{}, s2a("1.0000 EOS"), 7 * 24 * 60 * 60, "", 6, "15:30");

   CHECK(get_eden_membership("alice"_n).status() == eden::member_status::pending_membership);
   CHECK(get_eden_membership("pip"_n).status() == eden::member_status::pending_membership);
   CHECK(get_eden_membership("egeon"_n).status() == eden::member_status::pending_membership);

   t.alice.act<actions::inductprofil>(1, alice_profile);
   t.alice.act<token::actions::transfer>("alice"_n, "eden.gm"_n, s2a("100.0000 EOS"), "memo");
   t.alice.act<actions::inductdonate>("alice"_n, 1, s2a("10.0000 EOS"));

   t.eden_gm.act<actions::inductcancel>("eden.gm"_n, 2);
   t.eden_gm.act<actions::addtogenesis>(
       "bertie"_n, t.chain.get_head_block_info().timestamp.to_time_point() + eosio::days(1));

   CHECK(get_eden_membership("alice"_n).status() == eden::member_status::active_member);
   CHECK(get_eden_membership("egeon"_n).status() == eden::member_status::pending_membership);
   CHECK(get_eden_membership("bertie"_n).status() == eden::member_status::pending_membership);

   CHECK(members("eden.gm"_n).stats().active_members == 1);
   CHECK(members("eden.gm"_n).stats().pending_members == 2);
   CHECK(get_table_size<eden::induction_table_type>() == 2);
   CHECK(get_table_size<eden::endorsement_table_type>() == 4);

   t.egeon.act<actions::inductprofil>(3, egeon_profile);
   t.bertie.act<actions::inductprofil>(4, bertie_profile);

   t.egeon.act<token::actions::transfer>("egeon"_n, "eden.gm"_n, s2a("10.0000 EOS"), "memo");
   t.bertie.act<token::actions::transfer>("bertie"_n, "eden.gm"_n, s2a("10.0000 EOS"), "memo");

   t.egeon.act<actions::inductdonate>("egeon"_n, 3, s2a("10.0000 EOS"));
   t.bertie.act<actions::inductdonate>("bertie"_n, 4, s2a("10.0000 EOS"));

   CHECK(get_eden_membership("egeon"_n).status() == eden::member_status::active_member);
   CHECK(get_eden_membership("bertie"_n).status() == eden::member_status::active_member);

   CHECK(get_globals().stage == eden::contract_stage::active);

   CHECK(members("eden.gm"_n).stats().active_members == 3);
   CHECK(members("eden.gm"_n).stats().pending_members == 0);
   CHECK(get_table_size<eden::induction_table_type>() == 0);
   CHECK(get_table_size<eden::endorsement_table_type>() == 0);
   CHECK(get_table_size<eden::member_table_type>() == 3);

   // Verify that all members have the same set of NFTs
   std::vector<int32_t> expected_assets;
   for (auto member : {"alice"_n, "egeon"_n, "bertie"_n})
   {
      expected_assets.push_back(get_eden_membership(member).nft_template_id());
   }
   std::sort(expected_assets.begin(), expected_assets.end());
   for (auto member : {"alice"_n, "egeon"_n, "bertie"_n, "atomicmarket"_n})
   {
      INFO(member.to_string() << "'s assets");
      auto assets = eden::atomicassets::assets_by_owner(eden::atomic_assets_account, member);
      std::sort(assets.begin(), assets.end());
      CHECK(assets == expected_assets);
   }
   // The removed member should only have NFTs issued before his removal
   CHECK(eden::atomicassets::assets_by_owner(eden::atomic_assets_account, "pip"_n) ==
         std::vector<int32_t>{
             static_cast<int32_t>(get_eden_membership("alice"_n).nft_template_id())});
}

TEST_CASE("induction")
{
   eden_tester t;
   t.genesis();

   for (auto member : {"alice"_n, "pip"_n, "egeon"_n})
   {
      t.chain.as(member).act<actions::setencpubkey>(member, eosio::public_key{});
   }
   t.alice.act<actions::inductinit>(4, "alice"_n, "bertie"_n, std::vector{"pip"_n, "egeon"_n});
   t.bertie.act<actions::setencpubkey>("bertie"_n, eosio::public_key{});
   t.alice.act<actions::inductmeetin>("alice"_n, 4, std::vector<eden::encrypted_key>(4),
                                      eosio::bytes{}, std::nullopt);
   CHECK(get_table_size<eden::encrypted_data_table_type>("induction"_n) == 1);
   t.bertie.act<token::actions::transfer>("bertie"_n, "eden.gm"_n, s2a("10.0000 EOS"), "memo");
   CHECK(get_eden_membership("bertie"_n).status() == eden::member_status::pending_membership);

   // cannot endorse before video and profile are set
   auto blank_hash_data =
       eosio::convert_to_bin(std::tuple(std::string{}, eden::new_member_profile{}));
   expect(t.alice.trace<actions::inductendors>(
              "alice"_n, 4, eosio::sha256(blank_hash_data.data(), blank_hash_data.size())),
          "not set");

   expect(t.bertie.trace<actions::inductinit>(5, "bertie"_n, "ahab"_n,
                                              std::vector{"pip"_n, "egeon"_n}),
          "inactive member bertie");

   expect(t.alice.trace<actions::inductinit>(6, "alice"_n, "bertie"_n,
                                             std::vector{"pip"_n, "egeon"_n}),
          "already in progress");
   expect(t.alice.trace<actions::inductinit>(7, "alice"_n, "ahab"_n,
                                             std::vector{"alice"_n, "egeon"_n}),
          "inviter cannot be in the witnesses list");
   expect(t.alice.trace<actions::inductinit>(8, "alice"_n, "ahab"_n, std::vector{"pip"_n, "pip"_n}),
          "duplicated entry");
   expect(
       t.alice.trace<actions::inductinit>(9, "alice"_n, "ahab"_n, std::vector{"pip"_n, "bertie"_n}),
       "inactive member bertie");
   expect(
       t.alice.trace<actions::inductinit>(10, "alice"_n, "void"_n, std::vector{"pip"_n, "egeon"_n}),
       "Account void does not exist");

   std::string bertie_video = "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS";
   t.bertie.act<actions::inductprofil>(4, bertie_profile);
   t.alice.act<actions::inductvideo>("alice"_n, 4, bertie_video);  // Can be inviter or witness

   expect(t.bertie.trace<actions::inductdonate>("bertie"_n, 4, s2a("10.0000 EOS")),
          "induction is not fully endorsed");

   auto hash_data = eosio::convert_to_bin(std::tuple(bertie_video, bertie_profile));
   auto induction_hash = eosio::sha256(hash_data.data(), hash_data.size());
   expect(t.bertie.trace<actions::inductendors>("alice"_n, 4, induction_hash),
          "missing authority of alice");
   expect(t.bertie.trace<actions::inductendors>("bertie"_n, 4, induction_hash),
          "Induction can only be endorsed by inviter or a witness");
   expect(t.alice.trace<actions::inductendors>(
              "alice"_n, 4, eosio::sha256(hash_data.data(), hash_data.size() - 1)),
          "Outdated endorsement");

   auto endorse_all = [&] {
      t.alice.act<actions::inductendors>("alice"_n, 4, induction_hash);
      t.pip.act<actions::inductendors>("pip"_n, 4, induction_hash);
      t.egeon.act<actions::inductendors>("egeon"_n, 4, induction_hash);
   };
   endorse_all();
   t.chain.start_block();
   expect(t.alice.trace<actions::inductendors>("alice"_n, 4, induction_hash), "Already endorsed");

   // changing the profile resets endorsements
   t.bertie.act<actions::inductprofil>(4, bertie_profile);
   expect(t.bertie.trace<actions::inductdonate>("bertie"_n, 4, s2a("10.0000 EOS")),
          "induction is not fully endorsed");
   t.chain.start_block();
   endorse_all();

   // changing the video resets endorsements
   t.pip.act<actions::inductvideo>("pip"_n, 4, bertie_video);
   expect(t.bertie.trace<actions::inductdonate>("bertie"_n, 4, s2a("10.0000 EOS")),
          "induction is not fully endorsed");
   t.chain.start_block();
   endorse_all();

   t.bertie.act<actions::inductdonate>("bertie"_n, 4, s2a("10.0000 EOS"));
   CHECK(get_eden_membership("bertie"_n).status() == eden::member_status::active_member);
   CHECK(get_table_size<eden::encrypted_data_table_type>("induction"_n) == 0);
}

TEST_CASE("resignation")
{
   eden_tester t;
   t.genesis();
   t.alice.act<actions::resign>("alice"_n);
   CHECK(members{"eden.gm"_n}.is_new_member("alice"_n));
}

TEST_CASE("board resignation")
{
   eden_tester t;
   t.genesis();
   t.run_election();
   t.induct_n(4);
   t.alice.act<actions::resign>("alice"_n);
   t.egeon.act<actions::resign>("egeon"_n);
   t.pip.act<actions::resign>("pip"_n);
}

TEST_CASE("renaming")
{
   eden_tester t;
   t.genesis();
   auto distribution_time = t.next_election_time();
   t.run_election();
   t.alice.act<actions::distribute>(100);
   t.alice.act<actions::fundtransfer>("alice"_n, distribution_time, 1, "alice"_n, s2a("0.0001 EOS"),
                                      "");
   test_chain::user_context{t.chain, {{"eden.gm"_n, "board.major"_n}, {"ahab"_n, "active"_n}}}
       .act<actions::rename>("alice"_n, "ahab"_n);

   expect(t.alice.trace<actions::withdraw>("alice"_n, s2a("0.0001 EOS")), "insufficient balance");
   t.ahab.act<actions::withdraw>("ahab"_n, s2a("0.0001 EOS"));

   t.chain.start_block();
   expect(t.alice.trace<actions::fundtransfer>("alice"_n, distribution_time, 1, "alice"_n,
                                               s2a("0.0001 EOS"), ""),
          "member alice not found");
   t.ahab.act<actions::fundtransfer>("ahab"_n, distribution_time, 1, "ahab"_n, s2a("0.0001 EOS"),
                                     "");

   CHECK(get_eden_membership("pip"_n).representative() == "ahab"_n);
   CHECK(get_eden_membership("ahab"_n).representative() == "ahab"_n);
}

TEST_CASE("auction")
{
   eden_tester t;
   t.genesis();
   t.ahab.act<token::actions::transfer>("ahab"_n, eden::atomic_market_account, s2a("10.0000 EOS"),
                                        "deposit");
   t.ahab.act<atomicmarket::actions::auctionbid>("ahab"_n, 1, s2a("10.0000 EOS"), eosio::name{});
   t.chain.start_block(7 * 24 * 60 * 60 * 1000);
   t.chain.start_block();
   t.ahab.act<atomicmarket::actions::auctclaimbuy>(1);
   t.eden_gm.act<atomicmarket::actions::auctclaimsel>(1);
}

TEST_CASE("auction batch claim")
{
   eden_tester t;
   t.genesis();
   t.ahab.act<token::actions::transfer>("ahab"_n, eden::atomic_market_account, s2a("10.0000 EOS"),
                                        "deposit");
   t.ahab.act<atomicmarket::actions::auctionbid>("ahab"_n, 1, s2a("10.0000 EOS"), eosio::name{});
   t.chain.start_block(7 * 24 * 60 * 60 * 1000);
   t.chain.start_block();
   t.ahab.act<atomicmarket::actions::auctclaimbuy>(1);
   auto old_balance = get_token_balance("eden.gm"_n);
   t.eden_gm.act<actions::gc>(42);
   auto new_balance = get_token_balance("eden.gm"_n);
   // 0.5 EOS left deposited in atomicmarket
   // 0.1 EOS to each of the maker and taker marketplaces
   CHECK(new_balance - old_balance == s2a("9.3000 EOS"));
}

TEST_CASE("auction migration")
{
   eden_tester t;
   t.genesis();
   t.eden_gm.act<actions::unmigrate>();
   t.ahab.act<token::actions::transfer>("ahab"_n, eden::atomic_market_account, s2a("10.0000 EOS"),
                                        "deposit");
   t.ahab.act<atomicmarket::actions::auctionbid>("ahab"_n, 1, s2a("10.0000 EOS"), eosio::name{});
   t.chain.start_block(7 * 24 * 60 * 60 * 1000);
   t.chain.start_block();
   t.ahab.act<atomicmarket::actions::auctclaimbuy>(1);
   auto old_balance = get_token_balance("eden.gm"_n);
   expect(t.eden_gm.trace<actions::gc>(42), "Nothing to do");
   while (true)
   {
      t.chain.start_block();
      auto trace = t.eden_gm.trace<actions::migrate>(1);
      if (trace.except)
      {
         expect(trace, "Nothing to do");
         break;
      }
   }
   t.eden_gm.act<actions::gc>(42);
   auto new_balance = get_token_balance("eden.gm"_n);
   // 0.5 EOS left deposited in atomicmarket
   // 0.1 EOS to each of the maker and taker marketplaces
   CHECK(new_balance - old_balance == s2a("9.3000 EOS"));
}

TEST_CASE("induction gc")
{
   eden_tester t;
   t.genesis();

   auto test_accounts = make_names(38);
   t.create_accounts(test_accounts);

   // induct some members
   for (std::size_t i = 0; i < 34; ++i)
   {
      t.chain.start_block();  // don't run out of cpu
      auto account = test_accounts.at(i);
      auto induction_id = i + 4;
      t.alice.act<actions::inductinit>(induction_id, "alice"_n, account,
                                       std::vector{"pip"_n, "egeon"_n});
      t.finish_induction(induction_id, "alice"_n, account, {"pip"_n, "egeon"_n});
   }
   CHECK(members("eden.gm"_n).stats().active_members == 37);
   CHECK(members("eden.gm"_n).stats().pending_members == 0);

   // clear the auctions
   t.chain.start_block(8 * 24 * 60 * 60 * 1000);
   t.alice.act<actions::gc>(64);

   for (std::size_t i = 0; i <= 2; ++i)
   {
      // many inductions for the same invitee
      t.chain.start_block();
      auto member_idx = i + 34;
      auto invitee = test_accounts.at(34 + i);
      uint64_t base_induction_id = 34 + 4 + i * 64;
      for (std::size_t j = 0; j < 32 + i; ++j)
      {
         auto inviter = test_accounts.at(j);
         auto induction_id = base_induction_id + j;
         t.chain.as(inviter).act<actions::inductinit>(induction_id, inviter, invitee,
                                                      std::vector{"pip"_n, "egeon"_n});
      }
   }

   expect(t.alice.trace<actions::gc>(32),
          "Nothing to do");  // lots of invites; none are available for gc

   // Complete some invites
   for (std::size_t i = 0; i <= 2; ++i)
   {
      t.chain.start_block();
      auto member_idx = i + 34;
      auto invitee = test_accounts.at(34 + i);
      uint64_t base_induction_id = 34 + 4 + i * 64;
      t.finish_induction(base_induction_id, test_accounts.at(0), invitee, {"pip"_n, "egeon"_n});
      CHECK(members("eden.gm"_n).stats().active_members == 37 + i + 1);
      CHECK(members("eden.gm"_n).stats().pending_members == 2 - i);
   }

   CHECK(get_table_size<eden::induction_table_type>() == 1);
   CHECK(get_table_size<eden::endorsement_table_type>() == 3);
   CHECK(get_table_size<eden::endorsed_induction_table_type>() == 0);
   CHECK(get_table_size<eden::induction_gc_table_type>() > 0);

   t.ahab.act<actions::gc>(32);  // ahab is not a member, but gc needs no permissions

   // clear the auctions
   t.chain.start_block(8 * 24 * 60 * 60 * 1000);
   t.alice.act<actions::gc>(64);

   CHECK(get_table_size<eden::induction_table_type>() == 0);
   CHECK(get_table_size<eden::endorsement_table_type>() == 0);
   CHECK(get_table_size<eden::endorsed_induction_table_type>() == 0);
   CHECK(get_table_size<eden::induction_gc_table_type>() == 0);

   // An expired invitation
   t.alice.act<actions::inductinit>(42, "alice"_n, test_accounts.at(37),
                                    std::vector{"pip"_n, "egeon"_n});
   t.chain.start_block(1000 * 60 * 60 * 24 * 7);
   expect(t.alice.trace<actions::gc>(32), "Nothing to do");
   t.chain.start_block();
   t.alice.act<actions::gc>(32);

   CHECK(get_table_size<eden::induction_table_type>() == 0);
   CHECK(get_table_size<eden::endorsement_table_type>() == 0);
   CHECK(get_table_size<eden::endorsed_induction_table_type>() == 0);
   CHECK(get_table_size<eden::induction_gc_table_type>() == 0);

   CHECK(members("eden.gm"_n).stats().active_members == 40);
   CHECK(members("eden.gm"_n).stats().pending_members == 0);
}

TEST_CASE("induction cancelling")
{
   eden_tester t;
   t.genesis();

   // inviter can cancel
   t.alice.act<actions::inductinit>(101, "alice"_n, "bertie"_n, std::vector{"pip"_n, "egeon"_n});
   t.alice.act<actions::inductcancel>("alice"_n, 101);
   CHECK(get_table_size<eden::induction_table_type>() == 0);

   // invitee can cancel
   t.alice.act<actions::inductinit>(102, "alice"_n, "bertie"_n, std::vector{"pip"_n, "egeon"_n});
   t.bertie.act<actions::inductcancel>("bertie"_n, 102);
   CHECK(get_table_size<eden::induction_table_type>() == 0);

   // endorser can cancel
   t.alice.act<actions::inductinit>(103, "alice"_n, "bertie"_n, std::vector{"pip"_n, "egeon"_n});
   t.pip.act<actions::inductcancel>("pip"_n, 103);
   CHECK(get_table_size<eden::induction_table_type>() == 0);

   t.alice.act<actions::inductinit>(104, "alice"_n, "bertie"_n, std::vector{"pip"_n, "egeon"_n});
   expect(t.ahab.trace<actions::inductcancel>("ahab"_n, 104),
          "Induction can only be canceled by an endorser or the invitee itself");
   CHECK(get_table_size<eden::induction_table_type>() == 1);
   CHECK(get_eden_membership("bertie"_n).status() == eden::member_status::pending_membership);
}

TEST_CASE("deposit and spend")
{
   eden_tester t;
   t.eden_gm.act<actions::genesis>(
       "Eden", eosio::symbol("EOS", 4), s2a("10.0000 EOS"),
       std::vector{"alice"_n, "pip"_n, "egeon"_n}, "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
       attribute_map{}, s2a("1.0000 EOS"), 7 * 24 * 60 * 60, "", 6, "15:30");
   expect(t.alice.trace<token::actions::transfer>("alice"_n, "eden.gm"_n, s2a("10.0000 OTHER"),
                                                  "memo"),
          "token must be a valid 4,EOS");
   expect(
       t.alice.trace<token::actions::transfer>("alice"_n, "eden.gm"_n, s2a("9.9999 EOS"), "memo"),
       "insufficient deposit to open an account");
   CHECK(get_eden_account("alice"_n) == std::nullopt);
   t.alice.act<token::actions::transfer>("alice"_n, "eden.gm"_n, s2a("10.0000 EOS"), "memo");
   CHECK(get_eden_account("alice"_n) != std::nullopt);
   CHECK(get_eden_account("alice"_n)->balance() == s2a("10.0000 EOS"));
   CHECK(get_token_balance("alice"_n) == s2a("990.0000 EOS"));

   expect(t.pip.trace<actions::withdraw>("pip"_n, s2a("10.0000 EOS")), "insufficient balance");
   expect(t.pip.trace<actions::withdraw>("alice"_n, s2a("10.0000 EOS")),
          "missing authority of alice");
   expect(t.alice.trace<actions::withdraw>("alice"_n, s2a("10.0001 EOS")), "insufficient balance");
   CHECK(get_eden_account("alice"_n)->balance() == s2a("10.0000 EOS"));
   CHECK(get_token_balance("alice"_n) == s2a("990.0000 EOS"));
   t.alice.act<actions::withdraw>("alice"_n, s2a("4.0000 EOS"));
   CHECK(get_eden_account("alice"_n)->balance() == s2a("6.0000 EOS"));
   CHECK(get_token_balance("alice"_n) == s2a("994.0000 EOS"));
   t.alice.act<actions::withdraw>("alice"_n, s2a("6.0000 EOS"));
   CHECK(get_eden_account("alice"_n) == std::nullopt);
   CHECK(get_token_balance("alice"_n) == s2a("1000.0000 EOS"));
   t.alice.act<token::actions::transfer>("alice"_n, "eden.gm"_n, s2a("100.0000 EOS"), "donate");
   CHECK(get_eden_account("alice"_n) == std::nullopt);
   CHECK(get_token_balance("alice"_n) == s2a("900.0000 EOS"));
}

TEST_CASE("election config")
{
   auto verify_cfg = [](const auto& config, uint16_t num_participants) {
      INFO("participants: " << num_participants)
      if (num_participants < 1)
      {
         CHECK(config.empty());
      }
      else
      {
         CHECK(config.back().num_groups == 1);
         CHECK(config.front().num_participants == num_participants);
         for (std::size_t i = 0; i < config.size() - 1; ++i)
         {
            CHECK(config[i].num_groups == config[i + 1].num_participants);
         }
         // There are at most two group sizes, except for the last round
         std::set<uint16_t> group_sizes;
         auto early_rounds = config;
         early_rounds.pop_back();
         for (const auto& round_config : early_rounds)
         {
            group_sizes.insert(round_config.group_max_size());
            if (round_config.num_short_groups())
            {
               group_sizes.insert(round_config.group_max_size() - 1);
            }
         }
         CHECK(group_sizes.size() <= 2);
         if (group_sizes.size() == 2)
         {
            CHECK(*group_sizes.begin() + 1 == *(--group_sizes.end()));
         }
      }
   };
   for (uint16_t i = 0; i <= 10000; ++i)
   {
      verify_cfg(eden::make_election_config(i), i);
   }
}

TEST_CASE("election")
{
   eden_tester t;
   t.genesis();
   t.electdonate_all();
   {
      eden::current_election_state_singleton state("eden.gm"_n, eden::default_scope);
      auto current = std::get<eden::current_election_state_registration_v1>(state.get());
      CHECK(eosio::convert_to_json(current.start_time) == "\"2020-07-04T15:30:00.000\"");
   }
   t.skip_to("2020-07-03T15:29:59.500");
   t.electseed(eosio::time_point_sec(0x5f009260u), "Cannot start seeding yet");
   t.chain.start_block();
   t.electseed(eosio::time_point_sec(0x5f009260u));
   t.skip_to("2020-07-04T15:29:59.500");
   expect(t.alice.trace<actions::electprocess>(1), "Seeding window is still open");
   t.chain.start_block();
   t.setup_election();
   CHECK(get_table_size<eden::vote_table_type>() == 0);
   eden::election_state_singleton results("eden.gm"_n, eden::default_scope);
   auto result = std::get<eden::election_state_v0>(results.get());
   // This is likely to change as it depends on the exact random number algorithm and seed
   CHECK(result.lead_representative == "egeon"_n);
   std::sort(result.board.begin(), result.board.end());
   CHECK(result.board == std::vector{"alice"_n, "egeon"_n, "pip"_n});
}

TEST_CASE("election reschedule")
{
   eden_tester t;
   t.genesis();
   t.electdonate_all();
   t.eden_gm.act<actions::electsettime>(s2t("2020-03-02T15:30:01.000"));
   t.skip_to(t.next_election_time().to_time_point() - eosio::days(1));
   t.electseed(t.next_election_time().to_time_point() - eosio::days(1));
   t.skip_to(t.next_election_time().to_time_point());
   expect(t.alice.trace<actions::electprocess>(100), "No voters");
}

TEST_CASE("mid-election induction")
{
   eden_tester t;
   bool has_bertie = false;
   t.genesis();
   t.electdonate_all();
   SECTION("pre-registration")
   {
      t.skip_to("2020-06-04T15:29:59.500");
      has_bertie = true;
      t.induct("bertie"_n);
   }
   SECTION("registration")
   {
      t.skip_to("2020-06-04T15:30:00.000");
      has_bertie = true;
      t.induct("bertie"_n);
   }
   t.skip_to("2020-07-03T15:30:00.000");
   SECTION("pre-seed")
   {
      has_bertie = true;
      t.induct("bertie"_n);
   }
   t.electseed(s2t("2020-07-03T15:30:00.000"));
   SECTION("post-seed")
   {
      has_bertie = true;
      t.induct("bertie"_n);
   }
   t.skip_to("2020-07-04T15:30:00.000");
   for (int i = 0;; ++i)
   {
      DYNAMIC_SECTION("electprocess" << i)
      {
         has_bertie = true;
         t.induct("bertie"_n);
      }
      auto trace = t.eden_gm.trace<actions::electprocess>(1);
      if (trace.except)
      {
         expect(trace, "Nothing to do");
         break;
      }
      t.chain.start_block();
   }
   eden::election_state_singleton results("eden.gm"_n, eden::default_scope);
   auto result = std::get<eden::election_state_v0>(results.get());
   std::sort(result.board.begin(), result.board.end());
   CHECK(result.board == std::vector{"alice"_n, "egeon"_n, "pip"_n});

   if (has_bertie)
   {
      CHECK(get_table_size<eden::member_table_type>() == 4);
      CHECK(get_eden_membership("bertie"_n).election_participation_status() ==
            eden::not_in_election);
   }
   else
   {
      CHECK(get_table_size<eden::member_table_type>() == 3);
   }
   CHECK(eden::members{"eden.gm"_n}.stats().ranks == std::vector<uint16_t>{2, 1});
}

TEST_CASE("election with multiple rounds")
{
   constexpr std::size_t num_accounts = 200;  // 10000 takes too long
   eden_tester t;
   t.genesis();
   t.eden_gm.act<actions::electsettime>(s2t("2020-07-04T15:30:00.000"));
   auto test_accounts = make_names(num_accounts - 3);
   t.create_accounts(test_accounts);

   for (auto account : test_accounts)
   {
      t.chain.start_block();
      t.alice.act<actions::inductinit>(42, "alice"_n, account, std::vector{"pip"_n, "egeon"_n});
      t.finish_induction(42, "alice"_n, account, {"pip"_n, "egeon"_n});
   }
   t.electdonate_all();
   t.alice.act<actions::setencpubkey>("alice"_n, eosio::public_key{});
   t.pip.act<actions::setencpubkey>("pip"_n, eosio::public_key{});
   t.egeon.act<actions::setencpubkey>("egeon"_n, eosio::public_key{});
   for (auto account : test_accounts)
   {
      t.chain.start_block();
      t.chain.as(account).act<actions::setencpubkey>(account, eosio::public_key{});
   }

   t.skip_to("2020-07-03T15:30:00.000");
   t.electseed(eosio::time_point_sec(0x5f009260));
   t.skip_to("2020-07-04T15:30:00.000");
   t.setup_election();

   uint8_t round = 0;

   // With 200 members, there should be three rounds
   CHECK(get_table_size<eden::vote_table_type>() == 200);
   t.alice.act<actions::electmeeting>("alice"_n, 0,
                                      std::vector<eden::encrypted_key>{{}, {}, {}, {}},
                                      eosio::bytes{}, std::nullopt);
   t.generic_group_vote(t.get_current_groups(), round++);
   CHECK(get_table_size<eden::vote_table_type>() == 48);
   t.alice.act<actions::electvideo>(0, "alice"_n, "Qmb7WmZiSDXss5HfuKfoSf6jxTDrHzr8AoAUDeDMLNDuws");
   t.alice.act<actions::electmeeting>("alice"_n, 1,
                                      std::vector<eden::encrypted_key>{{}, {}, {}, {}},
                                      eosio::bytes{}, std::nullopt);
   t.generic_group_vote(t.get_current_groups(), round++);
   CHECK(get_table_size<eden::vote_table_type>() == 12);
   t.alice.act<actions::electmeeting>("alice"_n, 2,
                                      std::vector<eden::encrypted_key>{{}, {}, {}, {}},
                                      eosio::bytes{}, std::nullopt);
   t.generic_group_vote(t.get_current_groups(), round++);
   CHECK(get_table_size<eden::vote_table_type>() == 3);
   t.electseed(s2t("2020-07-04T19:30:00.000"));
   t.chain.start_block((15 * 60 + 30) * 60 * 1000);
   t.chain.start_block(2 * 60 * 60 * 1000);
   t.alice.act<actions::electprocess>(256);
   CHECK(get_table_size<eden::vote_table_type>() == 0);
   CHECK(get_table_size<eden::encrypted_data_table_type>("election"_n) == 0);

   eden::election_state_singleton results("eden.gm"_n, eden::default_scope);
   auto result = std::get<eden::election_state_v0>(results.get());
   // alice wins at every level but the last, because everyone votes for the member with the lowest name
   CHECK(std::find(result.board.begin(), result.board.end(), "alice"_n) != result.board.end());

   t.alice.act<actions::electvideo>(1, "alice"_n, "Qmb7WmZiSDXss5HfuKfoSf6jxTDrHzr8AoAUDeDMLNDuws");
   t.alice.act<actions::electvideo>(2, "alice"_n, "Qmb7WmZiSDXss5HfuKfoSf6jxTDrHzr8AoAUDeDMLNDuws");

   CHECK(members("eden.gm"_n).stats().ranks ==
         std::vector<uint16_t>{200 - 48, 48 - 12, 12 - 3, 3 - 1, 1});
}

TEST_CASE("budget distribution")
{
   eden_tester t;
   t.genesis();
   t.set_balance(s2a("36.0000 EOS"));
   t.run_election();

   t.alice.act<actions::distribute>(250);
   CHECK(t.get_total_budget() == s2a("1.8000 EOS"));
   // Skip forward to the next distribution
   t.skip_to("2020-08-03T15:29:59.500");
   expect(t.alice.trace<actions::distribute>(250), "Nothing to do");
   t.chain.start_block();
   t.alice.act<actions::distribute>(250);
   CHECK(t.get_total_budget() == s2a("3.5100 EOS"));
   // Skip into the next election
   t.skip_to("2021-01-02T15:30:00.000");
   t.alice.act<actions::distribute>(1);
   t.alice.act<actions::distribute>(5000);
   CHECK(t.get_total_budget() == s2a("10.9435 EOS"));

   expect(t.alice.trace<actions::fundtransfer>("alice"_n, s2t("2020-07-04T15:30:00.000"), 1,
                                               "egeon"_n, s2a("1.8001 EOS"), "memo"),
          "insufficient balance");
   expect(t.alice.trace<actions::fundtransfer>("alice"_n, s2t("2020-07-04T15:30:00.000"), 1,
                                               "egeon"_n, s2a("-1.0000 EOS"), "memo"),
          "amount must be positive");
   expect(t.alice.trace<actions::fundtransfer>("alice"_n, s2t("2020-07-04T15:30:00.000"), 1,
                                               "ahab"_n, s2a("1.0000 EOS"), "memo"),
          "member ahab not found");

   t.alice.act<actions::fundtransfer>("alice"_n, s2t("2020-07-04T15:30:00.000"), 1, "egeon"_n,
                                      s2a("1.8000 EOS"), "memo");
   CHECK(get_eden_account("egeon"_n)->balance() == s2a("1.8000 EOS"));

   expect(t.alice.trace<actions::usertransfer>("alice"_n, "ahab"_n, s2a("10.0000 EOS"), "memo"),
          "member ahab not found");
   t.ahab.act<token::actions::transfer>("ahab"_n, "eden.gm"_n, s2a("10.0000 EOS"), "memo");
   expect(t.ahab.trace<actions::usertransfer>("ahab"_n, "egeon"_n, s2a("10.0000 EOS"), "memo"),
          "member ahab not found");
   expect(t.alice.trace<actions::usertransfer>("alice"_n, "egeon"_n, s2a("-1.0000 EOS"), "memo"),
          "amount must be positive");
   t.alice.act<actions::usertransfer>("alice"_n, "egeon"_n, s2a("10.0000 EOS"), "memo");
   CHECK(get_eden_account("egeon"_n)->balance() == s2a("11.8000 EOS"));
   CHECK(get_eden_account("alice"_n)->balance() == s2a("80.0000 EOS"));
   CHECK(get_eden_account("ahab"_n)->balance() == s2a("10.0000 EOS"));
}

TEST_CASE("budget distribution triggered by donation")
{
   eden_tester t;
   t.genesis();
   t.electdonate_all();
   t.set_balance(s2a("100.0000 EOS"));
   t.run_election();
   t.distribute(1);
   CHECK(t.get_total_budget() == s2a("5.0000 EOS"));
   t.skip_to("2020-08-03T15:29:59.500");
   t.set_balance(s2a("100.0000 EOS"));
   t.chain.start_block();
   CHECK(t.get_total_budget() == s2a("5.0000 EOS"));
   t.eosio_token.act<token::actions::transfer>("eosio.token"_n, "eden.gm"_n, s2a("5.0000 EOS"),
                                               "memo");
   CHECK(t.get_total_budget() == s2a("10.0000 EOS"));
   t.skip_to("2020-09-02T15:30:00.0000");
   t.eosio_token.act<token::actions::transfer>("eosio.token"_n, "eden.gm"_n, s2a("5.0000 EOS"),
                                               "memo");
   CHECK(t.get_total_budget() == s2a("15.0000 EOS"));
   t.skip_to("2020-10-02T15:30:00.0000");
   t.eosio_token.act<token::actions::transfer>("eosio.token"_n, "eden.gm"_n, s2a("5.0000 EOS"),
                                               "memo");
   CHECK(t.get_total_budget() == s2a("20.0000 EOS"));
}

TEST_CASE("budget distribution minimum period")
{
   eden_tester t;
   t.genesis();
   t.set_balance(s2a("36.0000 EOS"));
   t.run_election();
   t.set_balance(s2a("100000.0000 EOS"));
   t.eden_gm.act<actions::electsettime>(s2t("2020-09-02T15:30:01.000"));
   t.electdonate_all();
   t.run_election();
   std::map<eosio::block_timestamp, eosio::asset> expected{
       {s2t("2020-07-04T15:30:00.000"), s2a("1.8000 EOS")},
       {s2t("2020-08-03T15:30:00.000"), s2a("5000.0000 EOS")},
       {s2t("2020-09-02T15:30:00.000"), s2a("0.0018 EOS")},
       {s2t("2020-09-02T15:30:01.000"), s2a("4749.9999 EOS")}};
   CHECK(t.get_budgets_by_period() == expected);
}

TEST_CASE("budget distribution exact")
{
   eden_tester t;
   t.genesis();
   t.set_balance(s2a("36.0000 EOS"));
   t.run_election();
   t.set_balance(s2a("1000.0000 EOS"));
   t.eden_gm.act<actions::electsettime>(s2t("2020-09-02T15:30:00.000"));
   t.run_election();
   std::map<eosio::block_timestamp, eosio::asset> expected{
       {s2t("2020-07-04T15:30:00.000"), s2a("1.8000 EOS")},
       {s2t("2020-08-03T15:30:00.000"), s2a("50.0000 EOS")},
       {s2t("2020-09-02T15:30:00.000"), s2a("47.5000 EOS")}};
   CHECK(t.get_budgets_by_period() == expected);
}

TEST_CASE("budget distribution underflow")
{
   eden_tester t;
   t.genesis();
   t.set_balance(s2a("36.0000 EOS"));
   t.run_election();
   t.set_balance(s2a("1000.0000 EOS"));
   t.eden_gm.act<actions::electsettime>(s2t("2020-09-02T15:30:01.000"));
   t.run_election();
   std::map<eosio::block_timestamp, eosio::asset> expected{
       {s2t("2020-07-04T15:30:00.000"), s2a("1.8000 EOS")},
       {s2t("2020-08-03T15:30:00.000"), s2a("50.0000 EOS")},
       {s2t("2020-09-02T15:30:01.000"), s2a("47.5000 EOS")}};
   CHECK(t.get_budgets_by_period() == expected);
}

#ifdef ENABLE_SET_TABLE_ROWS

TEST_CASE("budget distribution min")
{
   eden_tester t;
   t.genesis();
   auto members = make_names(100);
   t.create_accounts(members);
   for (auto a : members)
   {
      t.chain.start_block();
      t.induct(a);
   }
   t.set_balance(s2a("1236.0000 EOS"));
   t.run_election();
   t.set_balance(s2a("0.0020 EOS"));
   t.skip_to("2020-08-03T15:30:00.000");
   t.distribute();
   std::map<eosio::block_timestamp, eosio::asset> expected{
       {s2t("2020-07-04T15:30:00.000"), s2a("61.8000 EOS")},
       {s2t("2020-08-03T15:30:00.000"), s2a("0.0001 EOS")}};
   CHECK(t.get_budgets_by_period() == expected);
}

#endif

TEST_CASE("budget adjustment on resignation")
{
   eden_tester t;
   t.genesis();
   t.set_balance(s2a("36.0000 EOS"));
   t.run_election();
   t.set_balance(s2a("1000.0000 EOS"));
   t.skip_to("2020-09-02T15:30:00.000");
   // alice is satoshi, and receives the whole budget
   t.alice.act<actions::resign>("alice"_n);
   std::map<eosio::block_timestamp, eosio::asset> expected{};
   CHECK(t.get_budgets_by_period() == expected);
   t.skip_to("2020-10-02T15:30:00.000");
   t.distribute();
   CHECK(t.get_budgets_by_period() == expected);
   CHECK(accounts{"eden.gm"_n, "owned"_n}.get_account("master"_n)->balance() ==
         s2a("1001.8000 EOS"));
}

TEST_CASE("multi budget adjustment on resignation")
{
   eden_tester t;
   t.genesis();
   auto members = make_names(100);
   t.create_accounts(members);
   for (auto a : members)
   {
      t.chain.start_block();
      t.induct(a);
   }
   t.set_balance(s2a("1236.0000 EOS"));
   t.run_election();
   t.set_balance(s2a("10000.0000 EOS"));
   t.skip_to("2020-09-02T15:30:00.000");
   auto lead_representative =
       std::get<eden::election_state_v0>(
           eden::election_state_singleton{"eden.gm"_n, eden::default_scope}.get())
           .lead_representative;
   t.chain.as(lead_representative).act<actions::resign>(lead_representative);
   std::map<eosio::block_timestamp, eosio::asset> expected{
       {s2t("2020-07-04T15:30:00.000"), s2a("36.2560 EOS")},
       {s2t("2020-08-03T15:30:00.000"), s2a("293.3316 EOS")},
       {s2t("2020-09-02T15:30:00.000"), s2a("278.6656 EOS")}};
   CHECK(t.get_budgets_by_period() == expected);
   t.skip_to("2020-10-02T15:30:00.000");
   t.distribute();
   expected.insert({s2t("2020-10-02T15:30:00.000"), s2a("10.5028 EOS")});
   CHECK(t.get_budgets_by_period() == expected);
}

TEST_CASE("bylaws")
{
   eden_tester t;
   t.genesis();
   t.induct_n(3);
   t.run_election();
   auto state = std::get<eden::election_state_v0>(
       eden::election_state_singleton{"eden.gm"_n, eden::default_scope}.get());
   std::string bylaws = "xxx";
   auto bylaws_hash = eosio::sha256(bylaws.data(), bylaws.size());
   t.chain.as(state.lead_representative)
       .act<actions::bylawspropose>(state.lead_representative, bylaws);

   int i = 0;
   SECTION("basic")
   {
      for (auto board_member : state.board)
      {
         if (i++ == 5)
            break;
         t.chain.as(board_member).act<actions::bylawsapprove>(board_member, bylaws_hash);
      }
   }

   // Make sure that resigned members are not counted towards the limit
   SECTION("resign")
   {
      for (auto board_member : state.board)
      {
         if (board_member != state.lead_representative)
         {
            if (i++ >= 2)
            {
               t.chain.as(board_member).act<actions::bylawsapprove>(board_member, bylaws_hash);
            }
            else
            {
               t.chain.as(board_member).act<actions::bylawsapprove>(board_member, bylaws_hash);
               t.chain.as(board_member).act<actions::resign>(board_member);
            }
         }
      }
   }
}

TEST_CASE("accounting")
{
   eden_tester t;
   t.genesis();
   // should now have 30.0000 EOS, with a 90.0000 EOS deposit from alice
   CHECK(get_token_balance("eden.gm"_n) == s2a("120.0000 EOS"));
}

TEST_CASE("pre-genesis balance")
{
   eden_tester t{[&] {
      t.eosio_token.act<token::actions::transfer>("eosio.token"_n, "eden.gm"_n, s2a("3.1415 EOS"),
                                                  "");
   }};
   t.genesis();
   CHECK(get_token_balance("eden.gm"_n) == t.get_total_balance());
}

TEST_CASE("clearall")
{
   eden_tester t;
   t.genesis();
   t.eden_gm.act<actions::clearall>();
   t.chain.transact({{{"eden.gm"_n, "active"_n},
                      "eosio"_n,
                      "unlinkauth"_n,
                      std::tuple("eden.gm"_n, "eden.gm"_n, "rename"_n)}});
   t.chain.start_block();
   t.genesis();
}

TEST_CASE("account migration")
{
   eden_tester t;
   t.genesis();
   auto sum_accounts = [](eden::account_table_type& table) {
      auto total = s2a("0.0000 EOS");
      for (auto iter = table.begin(), end = table.end(); iter != end; ++iter)
      {
         CHECK(iter->balance().amount > 0);
         total += iter->balance();
      }
      return total;
   };

   {
      eden::account_table_type user_table{"eden.gm"_n, eden::default_scope};
      eden::account_table_type system_table{"eden.gm"_n, "owned"_n.value};
      CHECK(sum_accounts(user_table) + sum_accounts(system_table) ==
            get_token_balance("eden.gm"_n));
   }
   t.eden_gm.act<actions::unmigrate>();
   {
      eden::account_table_type user_table{"eden.gm"_n, eden::default_scope};
      eden::account_table_type system_table{"eden.gm"_n, "owned"_n.value};
      CHECK(sum_accounts(system_table) == s2a("0.0000 EOS"));
   }
   expect(t.alice.trace<actions::donate>("alice"_n, s2a("0.4200 EOS")), "must be migrated");

   while (true)
   {
      t.chain.start_block();
      t.alice.act<token::actions::transfer>("alice"_n, "eden.gm"_n, s2a("15.0000 EOS"), "");
      t.alice.act<actions::withdraw>("alice"_n, s2a("14.0000 EOS"));
      auto trace = t.eden_gm.trace<actions::migrate>(1);
      if (trace.except)
      {
         expect(trace, "Nothing to do");
         break;
      }
   }
   {
      eden::account_table_type user_table{"eden.gm"_n, eden::default_scope};
      eden::account_table_type system_table{"eden.gm"_n, "owned"_n.value};
      CHECK(sum_accounts(user_table) + sum_accounts(system_table) ==
            get_token_balance("eden.gm"_n));
   }

#ifdef ENABLE_SET_TABLE_ROWS
   t.set_balance(s2a("0.0000 EOS"));
   t.alice.act<actions::withdraw>("alice"_n, get_eden_account("alice"_n)->balance());
   t.eden_gm.act<token::actions::close>("eden.gm"_n, eosio::symbol("EOS", 4));
   t.eden_gm.act<actions::unmigrate>();
   t.eden_gm.act<actions::migrate>(100);
#endif
}

#ifdef ENABLE_SET_TABLE_ROWS

TEST_CASE("settablerows")
{
   eden_tester t;
   t.genesis();
   t.eden_gm.act<actions::settablerows>(
       eosio::name(eden::default_scope),
       std::vector<eden::table_variant>{
           eden::current_election_state_registration_v1{s2t("2020-01-02T00:00:00.0000")}});
   eden::current_election_state_singleton state{"eden.gm"_n, eden::default_scope};
   auto value = std::get<eden::current_election_state_registration_v1>(state.get());
   CHECK(value.start_time.to_time_point() == s2t("2020-01-02T00:00:00.0000"));
}

#endif

TEST_CASE("election-events")
{
   eden_tester t;
   t.genesis();
   t.run_election(true, 10000, true);
   t.induct_n(100);
   t.run_election(true, 10000, true);
   t.skip_to("2021-02-01T15:30:00.000");
   t.alice.act<actions::distribute>(250);
   test_chain::user_context{t.chain, {{"eden.gm"_n, "board.major"_n}, {"ahab"_n, "active"_n}}}
       .act<actions::rename>("alice"_n, "ahab"_n);
   t.write_dfuse_history("dfuse-test-election.json");
   CompareFile{"test-election"}.write_events(t.chain).compare();
}

/*
TEST_CASE("contract-auth")
{
   eden_tester t;
   t.genesis();

   t.newsession("pip"_n, "alice"_n, alice_session_pub_key,
                t.chain.get_head_block_info().timestamp.to_time_point() + eosio::days(90),
                "no, pip, no", "missing authority of alice");
   t.newsession("alice"_n, "alice"_n, alice_session_pub_key,
                t.chain.get_head_block_info().timestamp.to_time_point(), "my first session",
                "session is expired");
   t.newsession("alice"_n, "alice"_n, alice_session_pub_key,
                t.chain.get_head_block_info().timestamp.to_time_point() + eosio::days(91),
                "my first session", "expiration is too far in the future");
   t.newsession("alice"_n, "alice"_n, alice_session_pub_key,
                t.chain.get_head_block_info().timestamp.to_time_point() + eosio::days(90),
                "four score and twenty", "description is too long");

   t.newsession("alice"_n, "alice"_n, alice_session_pub_key,
                t.chain.get_head_block_info().timestamp.to_time_point() + eosio::days(90),
                "four score and seven");
   t.newsession("alice"_n, "alice"_n, alice_session_2_pub_key,
                t.chain.get_head_block_info().timestamp.to_time_point() + eosio::days(90),
                "another session");
   t.newsession("alice"_n, "alice"_n, alice_session_2_pub_key,
                t.chain.get_head_block_info().timestamp.to_time_point() + eosio::days(60),
                "another session", "session key already exists");

   t.delsession("pip"_n, "alice"_n, alice_session_pub_key, "missing authority of alice");
   t.delsession("alice"_n, "alice"_n, alice_session_pub_key);
   t.chain.start_block();
   t.delsession("alice"_n, "alice"_n, alice_session_pub_key,
                "Session key is either expired or not found");

   t.run(alice_session_priv_key, "alice"_n, 1,
         "Recovered session key PUB_K1_665ajq1JUMwWH3bHcRxxTqiZBZBc6CakwUfLkZJxRqp4vAtJaV "
         "is either expired or not found",
         sact<actions::delsession>("alice"_n, pip_session_pub_key));
   t.run(alice_session_2_priv_key, "alice"_n, 1, "Session key is either expired or not found",
         sact<actions::delsession>("alice"_n, alice_session_pub_key));
   t.run(alice_session_2_priv_key, "alice"_n, 1, nullptr,
         sact<actions::delsession>("alice"_n, alice_session_2_pub_key));
   t.chain.start_block();
   t.run(alice_session_2_priv_key, "alice"_n, 1,
         "Recovered session key PUB_K1_8VWTR1mogYHEd9HJxgG2Tj3GbPghrnJqMfWfdHbTE11BLxqvo3 "
         "is either expired or not found",
         sact<actions::delsession>("alice"_n, alice_session_2_pub_key));

   t.write_dfuse_history("dfuse-contract-auth.json");
   CompareFile{"contract-auth"}.write_events(t.chain).compare();
}  // TEST_CASE("contract-auth")

TEST_CASE("contract-auth-induct")
{
   eden_tester t;
   t.genesis();

   t.newsession("alice"_n, "alice"_n, alice_session_pub_key,
                t.chain.get_head_block_info().timestamp.to_time_point() + eosio::days(90), "");
   t.newsession("pip"_n, "pip"_n, pip_session_pub_key,
                t.chain.get_head_block_info().timestamp.to_time_point() + eosio::days(90), "");
   t.newsession("egeon"_n, "egeon"_n, egeon_session_pub_key,
                t.chain.get_head_block_info().timestamp.to_time_point() + eosio::days(90), "");

   t.newsession("bertie"_n, "bertie"_n, bertie_session_pub_key,
                t.chain.get_head_block_info().timestamp.to_time_point() + eosio::days(90), "",
                "member bertie not found");

   t.run(pip_session_priv_key, "pip"_n, 1,
         "need authorization of alice but have authorization of pip",
         sact<actions::inductinit>(1234, "alice"_n, "bertie"_n, std::vector{"pip"_n, "egeon"_n}));
   t.run(alice_session_priv_key, "alice"_n, 1, nullptr,
         sact<actions::inductinit>(1234, "alice"_n, "bertie"_n, std::vector{"pip"_n, "egeon"_n}));
   t.newsession("bertie"_n, "bertie"_n, bertie_session_pub_key,
                t.chain.get_head_block_info().timestamp.to_time_point() + eosio::days(90), "");
   t.run(alice_session_priv_key, "alice"_n, 2,
         "need authorization of bertie but have authorization of alice",
         sact<actions::inductprofil>(1234, bertie_profile));
   t.run(bertie_session_priv_key, "bertie"_n, 1, "Video can only be set by inviter or a witness",
         sact<actions::inductprofil>(1234, bertie_profile),
         sact<actions::inductvideo>("bertie"_n, 1234, "vid"s));
   t.run(bertie_session_priv_key, "bertie"_n, 1,
         "need authorization of pip but have authorization of bertie",
         sact<actions::inductprofil>(1234, bertie_profile),
         sact<actions::inductvideo>("pip"_n, 1234, "vid"s));
   t.run(bertie_session_priv_key, "bertie"_n, 1,
         "Induction can only be endorsed by inviter or a witness",
         sact<actions::inductprofil>(1234, bertie_profile),
         sact<actions::inductendors>("bertie"_n, 1234, t.hash_induction("vid"s, bertie_profile)));
   t.run(bertie_session_priv_key, "bertie"_n, 1,
         "need authorization of pip but have authorization of bertie",
         sact<actions::inductprofil>(1234, bertie_profile),
         sact<actions::inductendors>("pip"_n, 1234, t.hash_induction("vid"s, bertie_profile)));
   t.run(bertie_session_priv_key, "bertie"_n, 1, nullptr,
         sact<actions::inductprofil>(1234, bertie_profile));

   t.run(pip_session_priv_key, "pip"_n, 2,
         "need authorization of alice but have authorization of pip",
         sact<actions::inductmeetin>("alice"_n, 1234, std::vector<eden::encrypted_key>(4),
                                     eosio::bytes{}, std::nullopt));
   t.run(pip_session_priv_key, "pip"_n, 2, nullptr,
         sact<actions::inductmeetin>("pip"_n, 1234, std::vector<eden::encrypted_key>(0),
                                     eosio::bytes{}, std::nullopt));

   t.run(pip_session_priv_key, "pip"_n, 3, nullptr,
         sact<actions::inductvideo>("pip"_n, 1234, "vid"s),
         sact<actions::inductendors>("pip"_n, 1234, t.hash_induction("vid"s, bertie_profile)));
   t.run(alice_session_priv_key, "alice"_n, 3, nullptr,
         sact<actions::inductendors>("alice"_n, 1234, t.hash_induction("vid"s, bertie_profile)));

   t.run(pip_session_priv_key, "pip"_n, 4,
         "need authorization of alice but have authorization of pip",
         sact<actions::inductcancel>("alice"_n, 1234));
   t.run(pip_session_priv_key, "pip"_n, 4, nullptr, sact<actions::inductcancel>("pip"_n, 1234));

   t.write_dfuse_history("dfuse-contract-auth-induct.json");
   CompareFile{"contract-auth-induct"}.write_events(t.chain).compare();
}  // TEST_CASE("contract-auth-induct")

TEST_CASE("contract-auth-elect")
{
   eden_tester t;
   t.genesis();
   t.induct_n(100);

   auto create_sessions = [&] {
      t.alice.trace<actions::gc>(1000);
      t.newsession("alice"_n, "alice"_n, alice_session_pub_key,
                   t.chain.get_head_block_info().timestamp.to_time_point() + eosio::days(90), "");
      t.newsession("pip"_n, "pip"_n, pip_session_pub_key,
                   t.chain.get_head_block_info().timestamp.to_time_point() + eosio::days(90), "");
      t.newsession("egeon"_n, "egeon"_n, egeon_session_pub_key,
                   t.chain.get_head_block_info().timestamp.to_time_point() + eosio::days(90), "");
   };

   create_sessions();
   t.run(pip_session_priv_key, "pip"_n, 1,
         "need authorization of alice but have authorization of pip",
         sact<actions::electopt>("alice"_n, true));
   t.run(alice_session_priv_key, "alice"_n, 1, nullptr, sact<actions::electopt>("alice"_n, true));
   t.chain.finish_block();
   t.run(alice_session_priv_key, "alice"_n, 2, "Not currently opted out",
         sact<actions::electopt>("alice"_n, true));

   t.electdonate_all();
   t.skip_to(t.next_election_time().to_time_point() - eosio::days(1));
   t.electseed(t.next_election_time().to_time_point() - eosio::days(1));
   t.skip_to(t.next_election_time().to_time_point() + eosio::minutes(10));
   t.setup_election();

   t.run(pip_session_priv_key, "pip"_n, 2,
         "Recovered session key PUB_K1_8YQhKe3x1xTA1KHmkBPznWqa3UGQsaHTUMkJJtcds9giKNsHGv "
         "is either expired or not found",
         sact<actions::electmeeting>("pip"_n, 0, std::vector<eden::encrypted_key>(0),
                                     eosio::bytes{}, std::nullopt));
   create_sessions();
   t.run(pip_session_priv_key, "pip"_n, 2,
         "need authorization of alice but have authorization of pip",
         sact<actions::electmeeting>("alice"_n, 0, std::vector<eden::encrypted_key>(0),
                                     eosio::bytes{}, std::nullopt));
   t.run(pip_session_priv_key, "pip"_n, 2, nullptr,
         sact<actions::electmeeting>("pip"_n, 0, std::vector<eden::encrypted_key>(0),
                                     eosio::bytes{}, std::nullopt));

   t.run(pip_session_priv_key, "pip"_n, 3,
         "need authorization of alice but have authorization of pip",
         sact<actions::electvote>(0, "alice"_n, "pip"_n));
   t.run(alice_session_priv_key, "alice"_n, 0, "alice and pip are not in the same group",
         sact<actions::electvote>(0, "alice"_n, "pip"_n));

   t.run(pip_session_priv_key, "pip"_n, 3,
         "need authorization of alice but have authorization of pip",
         sact<actions::electvideo>(0, "alice"_n, "Qmb7WmZiSDXss5HfuKfoSf6jxTDrHzr8AoAUDeDMLNDuws"));
   t.run(alice_session_priv_key, "alice"_n, 1, nullptr,
         sact<actions::electvideo>(0, "alice"_n, "Qmb7WmZiSDXss5HfuKfoSf6jxTDrHzr8AoAUDeDMLNDuws"));

   t.write_dfuse_history("dfuse-contract-auth-elect.json");
   CompareFile{"contract-auth-elect"}.write_events(t.chain).compare();
}  // TEST_CASE("contract-auth-elect")
*/
