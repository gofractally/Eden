#include <clarion/flat_merkle.hpp>
#include <clarion/kv_merkle.hpp>
#include <clarion/linked_merkle.hpp>
#include <clarion/octet_string.hpp>
#include <random>

#define CATCH_CONFIG_MAIN
#include <catch2/catch.hpp>

using namespace clarion;

TEST_CASE("page index")
{
   // Hard-coded basic sanity checks
   CHECK(flat_merkle<clarion::sha256, 4096>::get_page({0, 0}) == 0);
   CHECK(flat_merkle<clarion::sha256, 4096>::get_page({0, 1}) == 0);
   CHECK(flat_merkle<clarion::sha256, 4096>::get_page({0, 2}) == 0);
   CHECK(flat_merkle<clarion::sha256, 4096>::get_page({0, 3}) == 0);
   CHECK(flat_merkle<clarion::sha256, 4096>::get_page({0, 4}) == 0);
   CHECK(flat_merkle<clarion::sha256, 4096>::get_page({0, 5}) == 0);
   CHECK(flat_merkle<clarion::sha256, 4096>::get_page({0, 6}) == 1);
   CHECK(flat_merkle<clarion::sha256, 4096>::get_page({32, 0}) == 2);

   for (flat_merkle<clarion::sha256, 4096>::size_type page = 0; page < 1000; ++page)
   {
      // The root of every page should round-trip
      auto [sequence, depth] = flat_merkle<clarion::sha256, 4096>::get_sequence(page);
      INFO("sequence: " << sequence);
      INFO("depth: " << (int)depth);
      CHECK(flat_merkle<clarion::sha256, 4096>::get_page(
                {sequence, static_cast<uint8_t>(depth * 6 + 5)}) == page);
   }

   // Every valid range should map to a unique sequence/offset pair
   std::vector ranges{sequence_range{0, 17}};
   using sequence_address = std::pair<flat_merkle<clarion::sha256, 4096>::size_type, std::size_t>;
   std::set<sequence_address> unique_addresses;
   while (!ranges.empty())
   {
      auto range = ranges.back();
      ranges.pop_back();
      if (!is_leaf(range))
      {
         auto [l, r] = split(range);
         ranges.push_back(r);
         ranges.push_back(l);
      }
      auto page = flat_merkle<clarion::sha256, 4096>::get_page(range);
      auto offset = flat_merkle<clarion::sha256, 4096>::get_offset(range);
      INFO("page: " << page);
      INFO("offset: " << offset);
      INFO("sequence: " << range.start);
      INFO("depth: " << (int)range.depth);
      CHECK(0 < offset);
      CHECK(offset < 64);
      CHECK(unique_addresses.insert({page, offset}).second);
   }
   // The pages are densely packed for a complete tree
   CHECK((--unique_addresses.end())->first == 0x1040);
}

TEST_CASE("page navigation")
{
   for (flat_merkle<clarion::sha256, 4096>::size_type page = 0; page < 1000; ++page)
   {
      auto [start, depth] = flat_merkle<clarion::sha256, 4096>::get_sequence(page);
      sequence_range root_range{start, static_cast<uint8_t>(depth * 6 + 5)};
      INFO("page: " << page);
      INFO("sequence: " << start);
      INFO("depth: " << (int)root_range.depth);
      CHECK(flat_merkle<clarion::sha256, 4096>::get_parent_page(page, start, depth) ==
            flat_merkle<clarion::sha256, 4096>::get_page(parent(root_range)));
      if (depth != 0)
      {
         sequence_range left_range{start, static_cast<uint8_t>(depth * 6 - 1)};
         CHECK(flat_merkle<clarion::sha256, 4096>::get_left_child_page(page, start, depth) ==
               flat_merkle<clarion::sha256, 4096>::get_page(left_range));
      }
   }
}

TEST_CASE("set/get")
{
   clarion::linked_merkle<clarion::sha256> merkle;
   flat_merkle<clarion::sha256, 4096>::hash_type test_hash0{'A'};
   flat_merkle<clarion::sha256, 4096>::hash_type test_hash1{'B'};
   flat_merkle<clarion::sha256, 4096>::hash_type test_hash2 =
       clarion::sha256()(test_hash0, test_hash1);
   merkle.set(0, test_hash0);
   merkle.set(1, test_hash1);
   CHECK(merkle.get({0, 0}) == test_hash0);
   CHECK(merkle.get({1, 0}) == test_hash1);
   CHECK(merkle.get({0, 1}) == test_hash2);
}

struct sequence_octet_string_adaptor
{
   auto get(const sequence_range& range) { return impl.get(convert(range)); }
   template <typename H>
   void set(const sequence_number& key, const H& hash)
   {
      impl.set(convert(key), hash);
   }
   static octet_string_range convert(sequence_range range)
   {
      if (range.depth == 0)
      {
         return {convert(range.start), octet_string_range::end_string};
      }
      else
      {
         octet_string_range result{convert(range.start)};
         result.prefix.erase(result.prefix.end() - range.depth / 8, result.prefix.end());
         result.bits = 8 - range.depth % 8;
         return result;
      }
   }
   static octet_string convert(sequence_number in)
   {
      octet_string result;
      result.reserve(8);
      for (int i = 0; i < 8; ++i)
      {
         result.push_back(static_cast<unsigned char>(in >> 8 * (8 - i - 1)));
      }
      return result;
   }
   clarion::kv_merkle<octet_string, octet_string_range, sha256> impl;
};

TEST_CASE("flat/linked")
{
   clarion::linked_merkle<clarion::sha256> linked;
   clarion::flat_merkle<clarion::sha256, 4096> flat;
   clarion::kv_merkle<sequence_number, sequence_range, clarion::sha256> kv;
   sequence_octet_string_adaptor octets;

   constexpr int bits = 16;
   std::default_random_engine eng;
   std::uniform_int_distribution<sequence_number> seq_dist(0, (1 << bits) - 1);
   auto hash_dist = [](auto& eng) {
      std::uniform_int_distribution<std::uint64_t> dist;
      auto val = dist(eng);
      return clarion::sha256()(&val, sizeof(val));
   };
   for (int i = 0; i < 10000; ++i)
   {
      auto sequence = seq_dist(eng);
      auto hash = hash_dist(eng);
      linked.set(sequence, hash);
      flat.set(sequence, hash);
      kv.set(sequence, hash);
      octets.set(sequence, hash);
   }

   std::vector ranges{sequence_range{0, bits + 2}};
   while (!ranges.empty())
   {
      auto range = ranges.back();
      ranges.pop_back();
      if (!is_leaf(range))
      {
         auto [l, r] = split(range);
         ranges.push_back(r);
         ranges.push_back(l);
      }
      INFO("sequence: " << range.start);
      INFO("depth: " << (int)range.depth);
      CHECK(linked.get(range) == flat.get(range));
      CHECK(linked.get(range) == kv.get(range));
      CHECK(linked.get(range) == octets.get(range));
   }
}
