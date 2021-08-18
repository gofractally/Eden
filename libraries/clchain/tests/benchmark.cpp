#include <boost/core/demangle.hpp>
#include <catch2/catch.hpp>
#include <chrono>
#include <clchain/flatbuf.hpp>
#include <eosio/from_bin.hpp>
#include <eosio/from_json.hpp>
#include <eosio/to_bin.hpp>
#include <eosio/to_json.hpp>
#include <iostream>

namespace benchmark
{
   struct no_sub
   {
      double myd = 3.14;
      uint16_t my16 = 22;
   };
   EOSIO_REFLECT2(no_sub, myd, my16);

   struct sub_obj
   {
      int a;
      int b;
      std::string substr;
      no_sub ns;
   };
   EOSIO_REFLECT2(sub_obj, a, b, ns, substr);

   struct flat_object
   {
      uint32_t x;
      double y;
      std::string z;
      std::vector<int> veci;
      std::vector<std::string> vecstr = {"aaaaaaaaa", "bbbbbbbbbbb", "ccccccccccccc"};
      std::vector<no_sub> vecns;
      std::vector<flat_object> nested;
      sub_obj sub;
   };
   EOSIO_REFLECT2(flat_object, x, y, z, veci, vecstr, vecns, nested, sub);
}  // namespace benchmark

TEST_CASE("benchmark")
{
   using namespace benchmark;

   flat_object tester;
   tester.z = "my oh my";
   tester.x = 99;
   tester.y = 99.99;
   tester.veci = {1, 2, 3, 4, 6};
   tester.vecns = {{.myd = 33.33}, {}};
   tester.nested = {{.x = 11, .y = 3.21, .nested = {{.x = 88}}}, {.x = 33, .y = .123}};
   tester.sub.substr = "sub str";
   tester.sub.a = 3;
   tester.sub.b = 4;

   SECTION("unpacking from flat")
   {
      eosio::size_stream ss;
      clio::flatpack(tester, ss);

      std::vector<char> buf(ss.size);
      eosio::fixed_buf_stream ps(buf.data(), buf.size());
      clio::flatpack(tester, ps);
      /*
      auto start = std::chrono::steady_clock::now();
      for (uint32_t i = 0; i < 10000; ++i)
      {
         flat_object temp;
         eosio::input_stream in(buf.data(), buf.size());
         clio::flatunpack(temp, in);
      }
      auto end = std::chrono::steady_clock::now();
      auto delta = end - start;

      std::cout << "unpack flat:    " << std::chrono::duration<double, std::milli>(delta).count()
                << " ms  size: " << ss.size << "  ";

      auto compressed = clio::capn_compress(buf);
      auto uncompressed = clio::capn_uncompress(compressed);

      eosio::size_stream capsize;
      eosio::input_stream capin(buf.data(), buf.size());
      clio::capp_pack(capin, capsize);

      // std::cout << "compressed.size: " << compressed.size() << "\n";
      std::cout << "capsize: " << capsize.size << "\n";
      // std::cout << "uncompressed.size: " << uncompressed.size() << "\n";
      */
   }
   SECTION("validating flat without unpacking")
   {
      eosio::size_stream ss;
      clio::flatpack(tester, ss);

      std::vector<char> buf(ss.size);
      eosio::fixed_buf_stream ps(buf.data(), buf.size());
      clio::flatpack(tester, ps);

      /*
      auto start = std::chrono::steady_clock::now();
      for (uint32_t i = 0; i < 10000; ++i)
      {
         eosio::input_stream in(buf.data(), buf.size());
         clio::flatcheck<flat_object>(in);
      }
      auto end = std::chrono::steady_clock::now();
      auto delta = end - start;

      std::cout << "check flat:    " << std::chrono::duration<double, std::milli>(delta).count()
                << " ms  size: " << ss.size << "  ";

      auto compressed = clio::capn_compress(buf);
      auto uncompressed = clio::capn_uncompress(compressed);

      eosio::size_stream capsize;
      eosio::input_stream capin(buf.data(), buf.size());
      clio::capp_pack(capin, capsize);

      // std::cout << "compressed.size: " << compressed.size() << "\n";
      std::cout << "capsize: " << capsize.size << "\n";
      // std::cout << "uncompressed.size: " << uncompressed.size() << "\n";
      */
   }

   SECTION("flat unpack and uncompress")
   {
      eosio::size_stream ss;
      clio::flatpack(tester, ss);

      std::vector<char> buf(ss.size);
      eosio::fixed_buf_stream ps(buf.data(), buf.size());
      clio::flatpack(tester, ps);

      /*
      auto compressed = clio::capn_compress(buf);

      auto start = std::chrono::steady_clock::now();
      for (uint32_t i = 0; i < 10000; ++i)
      {
         flat_object temp;
         auto uncompressed = clio::capn_uncompress(compressed);
         eosio::input_stream in(uncompressed.data(), uncompressed.size());
         clio::flatunpack(temp, in);
      }
      auto end = std::chrono::steady_clock::now();
      auto delta = end - start;

      std::cout << "unpack flat&cap: " << std::chrono::duration<double, std::milli>(delta).count()
                << " ms  size: " << ss.size << "  ";
      eosio::size_stream capsize;
      eosio::input_stream capin(buf.data(), buf.size());
      clio::capp_pack(capin, capsize);

      std::cout << "capsize: " << capsize.size << "\n";
      */
   }

   /*
   SECTION("protbuf unpack")
   {
      eosio::size_stream ss;
      clio::to_protobuf(tester, ss);

      std::vector<char> buf(ss.size);
      eosio::fixed_buf_stream ps(buf.data(), buf.size());
      clio::to_protobuf(tester, ps);

      auto start = std::chrono::steady_clock::now();
      for (uint32_t i = 0; i < 10000; ++i)
      {
         flat_object temp;

         eosio::input_stream in(buf.data(), buf.size());
         clio::from_protobuf_object(temp, in);
      }
      auto end = std::chrono::steady_clock::now();
      auto delta = end - start;
      std::cout << "unpack pb:      " << std::chrono::duration<double, std::milli>(delta).count()
                << " ms  size: " << ss.size << "   ";
      eosio::size_stream capsize;
      eosio::input_stream capin(buf.data(), buf.size());
      clio::capp_pack(capin, capsize);

      std::cout << "capsize: " << capsize.size << "\n";
   }

   SECTION("protbuf unpack and uncompress")
   {
      eosio::size_stream ss;
      clio::to_protobuf(tester, ss);

      std::vector<char> buf(ss.size);
      eosio::fixed_buf_stream ps(buf.data(), buf.size());
      clio::to_protobuf(tester, ps);

      auto compressed = clio::capn_compress(buf);

      auto start = std::chrono::steady_clock::now();
      for (uint32_t i = 0; i < 10000; ++i)
      {
         flat_object temp;
         auto uncompressed = clio::capn_uncompress(compressed);

         eosio::input_stream in(uncompressed.data(), uncompressed.size());
         clio::from_protobuf_object(temp, in);
      }
      auto end = std::chrono::steady_clock::now();
      auto delta = end - start;
      std::cout << "unpack pb&cap:   " << std::chrono::duration<double, std::milli>(delta).count()
                << " ms  size: " << ss.size << "   ";
      eosio::size_stream capsize;
      eosio::input_stream capin(buf.data(), buf.size());
      clio::capp_pack(capin, capsize);

      std::cout << "capsize: " << capsize.size << "\n";
   }
   */

   SECTION("bin unpack")
   {
      eosio::size_stream ss;
      eosio::to_bin(tester, ss);

      std::vector<char> buf(ss.size);
      eosio::fixed_buf_stream ps(buf.data(), buf.size());
      eosio::to_bin(tester, ps);
      auto start = std::chrono::steady_clock::now();
      for (uint32_t i = 0; i < 10000; ++i)
      {
         flat_object temp;
         eosio::input_stream in(buf.data(), buf.size());
         eosio::from_bin(temp, in);
      }
      auto end = std::chrono::steady_clock::now();
      auto delta = end - start;
      std::cout << "unpack bin:     " << std::chrono::duration<double, std::milli>(delta).count()
                << " ms  size: " << ss.size << "   ";

      /*
      eosio::size_stream capsize;
      eosio::input_stream capin(buf.data(), buf.size());
      clio::capp_pack(capin, capsize);
      std::cout << "capsize: " << capsize.size << "\n";
      */
   }
   /*
   SECTION("bin unpack and uncompress")
   {
      eosio::size_stream ss;
      eosio::to_bin(tester, ss);

      std::vector<char> buf(ss.size);
      eosio::fixed_buf_stream ps(buf.data(), buf.size());
      eosio::to_bin(tester, ps);

      auto compressed = clio::capn_compress(buf);

      auto start = std::chrono::steady_clock::now();
      for (uint32_t i = 0; i < 10000; ++i)
      {
         flat_object temp;
         auto uncompressed = clio::capn_uncompress(compressed);

         eosio::input_stream in(uncompressed.data(), uncompressed.size());
         eosio::from_bin(temp, in);
      }
      auto end = std::chrono::steady_clock::now();
      auto delta = end - start;
      std::cout << "unpack bin&cap: " << std::chrono::duration<double, std::milli>(delta).count()
                << " ms  size: " << ss.size << "   ";
      eosio::size_stream capsize;
      eosio::input_stream capin(buf.data(), buf.size());
      clio::capp_pack(capin, capsize);

      std::cout << "capsize: " << capsize.size << "\n";
   }
   */

   SECTION("json unpack")
   {
      eosio::size_stream ss;
      eosio::to_json(tester, ss);

      std::vector<char> buf(ss.size + 1);
      std::vector<char> buf2(ss.size + 1);
      buf.back() = 0;
      eosio::fixed_buf_stream ps(buf.data(), buf.size());
      eosio::to_json(tester, ps);
      buf2 = buf;
      auto start = std::chrono::steady_clock::now();
      for (uint32_t i = 0; i < 10000; ++i)
      {
         flat_object temp;
         eosio::json_token_stream in(buf.data());
         eosio::from_json(temp, in);
         buf = buf2;
      }
      auto end = std::chrono::steady_clock::now();
      auto delta = end - start;
      std::cout << "unpack json:    " << std::chrono::duration<double, std::milli>(delta).count()
                << " ms  size: " << ss.size << " capsize: ";

      /*
      eosio::size_stream capsize;
      eosio::input_stream capin(buf.data(), buf.size());
      clio::capp_pack(capin, capsize);
      std::cout << "capsize: " << capsize.size << "\n";
      */
   }

   SECTION("packing")
   {
      size_t s = 0;
      auto start = std::chrono::steady_clock::now();
      for (uint32_t i = 0; i < 10000; ++i)
      {
         eosio::size_stream ss;
         clio::flatpack(tester, ss);
         s = ss.size;

         std::vector<char> buf(ss.size);
         eosio::fixed_buf_stream ps(buf.data(), buf.size());
         clio::flatpack(tester, ps);
         // std::cout <<"capsize: " << capsize.size <<"\n";
      }
      auto end = std::chrono::steady_clock::now();
      auto delta = end - start;
      std::cout << "pack   flat:    " << std::chrono::duration<double, std::milli>(delta).count()
                << " ms  size: " << s << "\n";

      s = 0;
      start = std::chrono::steady_clock::now();
      for (uint32_t i = 0; i < 10000; ++i)
      {
         eosio::size_stream ss;
         clio::flatpack(tester, ss);
         s = ss.size;

         std::vector<char> buf(ss.size);
         eosio::fixed_buf_stream ps(buf.data(), buf.size());
         clio::flatpack(tester, ps);

         /*
         std::vector<char> buf2(ss.size);
         eosio::fixed_buf_stream capout(buf2.data(), buf2.size());
         eosio::input_stream capin(buf.data(), buf.size());
         clio::capp_pack(capin, capout);
         s = buf2.size() - capout.remaining();  // capsize.size;
         */
      }
      end = std::chrono::steady_clock::now();
      delta = end - start;
      std::cout << "pack   flat&cap: " << std::chrono::duration<double, std::milli>(delta).count()
                << " ms  size: " << s << "\n";

      /*
      start = std::chrono::steady_clock::now();
      for (uint32_t i = 0; i < 10000; ++i)
      {
         eosio::size_stream ss;
         clio::to_protobuf(tester, ss);
         s = ss.size;

         std::vector<char> buf(ss.size);
         eosio::fixed_buf_stream ps(buf.data(), buf.size());
         clio::to_protobuf(tester, ps);
      }
      end = std::chrono::steady_clock::now();
      delta = end - start;
      std::cout << "pack   pb:      " << std::chrono::duration<double, std::milli>(delta).count()
                << " ms  size: " << s << "\n";
      */

      start = std::chrono::steady_clock::now();
      for (uint32_t i = 0; i < 10000; ++i)
      {
         eosio::size_stream ss;
         eosio::to_bin(tester, ss);
         s = ss.size;

         std::vector<char> buf(ss.size);
         eosio::fixed_buf_stream ps(buf.data(), buf.size());
         eosio::to_bin(tester, ps);
      }
      end = std::chrono::steady_clock::now();
      delta = end - start;
      std::cout << "pack   bin: " << std::chrono::duration<double, std::milli>(delta).count()
                << " ms  size: " << s << "\n";

      start = std::chrono::steady_clock::now();
      for (uint32_t i = 0; i < 10000; ++i)
      {
         eosio::size_stream ss;
         eosio::to_json(tester, ss);
         s = ss.size;

         std::vector<char> buf(ss.size);
         eosio::fixed_buf_stream ps(buf.data(), buf.size());
         eosio::to_json(tester, ps);
      }
      end = std::chrono::steady_clock::now();
      delta = end - start;
      std::cout << "pack json: " << std::chrono::duration<double, std::milli>(delta).count()
                << " ms  size: " << s << "\n";
   }
}
