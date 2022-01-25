#pragma once

#include <b1/rodeos/callbacks/vm_types.hpp>
#include <compiler_builtins.hpp>
#include <fc/uint128.hpp>
#include <softfloat.hpp>

namespace b1::rodeos
{
   template <typename Derived>
   struct compiler_builtins_callbacks
   {
      Derived& derived() { return static_cast<Derived&>(*this); }

      void ashlti3(legacy_ptr<__int128> ret, uint64_t low, uint64_t high, uint32_t shift)
      {
         fc::uint128 i(high, low);
         i <<= shift;
         *ret = (unsigned __int128)i;
      }

      void ashrti3(legacy_ptr<__int128> ret, uint64_t low, uint64_t high, uint32_t shift)
      {
         // retain the signedness
         *ret = high;
         *ret <<= 64;
         *ret |= low;
         // TODO: UB. This is identical to the version in eosio 2.0,
         // so needs to be analyzed and fixed there also (potential
         // consensus break there)
         *ret >>= shift;
      }

      void lshlti3(legacy_ptr<__int128> ret, uint64_t low, uint64_t high, uint32_t shift)
      {
         fc::uint128 i(high, low);
         i <<= shift;
         *ret = (unsigned __int128)i;
      }

      void lshrti3(legacy_ptr<__int128> ret, uint64_t low, uint64_t high, uint32_t shift)
      {
         fc::uint128 i(high, low);
         i >>= shift;
         *ret = (unsigned __int128)i;
      }

      void divti3(legacy_ptr<__int128> ret, uint64_t la, uint64_t ha, uint64_t lb, uint64_t hb)
      {
         __int128 lhs = ha;
         __int128 rhs = hb;

         lhs <<= 64;
         lhs |= la;

         rhs <<= 64;
         rhs |= lb;

         if (rhs == 0)
            throw std::runtime_error("divide by zero");

         lhs /= rhs;

         *ret = lhs;
      }

      void udivti3(legacy_ptr<unsigned __int128> ret,
                   uint64_t la,
                   uint64_t ha,
                   uint64_t lb,
                   uint64_t hb)
      {
         unsigned __int128 lhs = ha;
         unsigned __int128 rhs = hb;

         lhs <<= 64;
         lhs |= la;

         rhs <<= 64;
         rhs |= lb;

         if (rhs == 0)
            throw std::runtime_error("divide by zero");

         lhs /= rhs;
         *ret = lhs;
      }

      void modti3(legacy_ptr<__int128> ret, uint64_t la, uint64_t ha, uint64_t lb, uint64_t hb)
      {
         __int128 lhs = ha;
         __int128 rhs = hb;

         lhs <<= 64;
         lhs |= la;

         rhs <<= 64;
         rhs |= lb;

         if (rhs == 0)
            throw std::runtime_error("divide by zero");

         lhs %= rhs;
         *ret = lhs;
      }

      void umodti3(legacy_ptr<unsigned __int128> ret,
                   uint64_t la,
                   uint64_t ha,
                   uint64_t lb,
                   uint64_t hb)
      {
         unsigned __int128 lhs = ha;
         unsigned __int128 rhs = hb;

         lhs <<= 64;
         lhs |= la;

         rhs <<= 64;
         rhs |= lb;

         if (rhs == 0)
            throw std::runtime_error("divide by zero");

         lhs %= rhs;
         *ret = lhs;
      }

      void multi3(legacy_ptr<__int128> ret, uint64_t la, uint64_t ha, uint64_t lb, uint64_t hb)
      {
         __int128 lhs = ha;
         __int128 rhs = hb;

         lhs <<= 64;
         lhs |= la;

         rhs <<= 64;
         rhs |= lb;

         lhs *= rhs;
         *ret = lhs;
      }

      void addtf3(legacy_ptr<float128_t> ret, uint64_t la, uint64_t ha, uint64_t lb, uint64_t hb)
      {
         float128_t a = {{la, ha}};
         float128_t b = {{lb, hb}};
         *ret = f128_add(a, b);
      }

      void subtf3(legacy_ptr<float128_t> ret, uint64_t la, uint64_t ha, uint64_t lb, uint64_t hb)
      {
         float128_t a = {{la, ha}};
         float128_t b = {{lb, hb}};
         *ret = f128_sub(a, b);
      }

      void multf3(legacy_ptr<float128_t> ret, uint64_t la, uint64_t ha, uint64_t lb, uint64_t hb)
      {
         float128_t a = {{la, ha}};
         float128_t b = {{lb, hb}};
         *ret = f128_mul(a, b);
      }

      void divtf3(legacy_ptr<float128_t> ret, uint64_t la, uint64_t ha, uint64_t lb, uint64_t hb)
      {
         float128_t a = {{la, ha}};
         float128_t b = {{lb, hb}};
         *ret = f128_div(a, b);
      }

      int unordtf2(uint64_t la, uint64_t ha, uint64_t lb, uint64_t hb)
      {
         float128_t a = {{la, ha}};
         float128_t b = {{lb, hb}};
         if (f128_is_nan(a) || f128_is_nan(b))
            return 1;
         return 0;
      }

      int cmptf2_impl(uint64_t la, uint64_t ha, uint64_t lb, uint64_t hb, int return_value_if_nan)
      {
         float128_t a = {{la, ha}};
         float128_t b = {{lb, hb}};
         if (unordtf2(la, ha, lb, hb))
            return return_value_if_nan;
         if (f128_lt(a, b))
            return -1;
         if (f128_eq(a, b))
            return 0;
         return 1;
      }

      int eqtf2(uint64_t la, uint64_t ha, uint64_t lb, uint64_t hb)
      {
         return cmptf2_impl(la, ha, lb, hb, 1);
      }

      int netf2(uint64_t la, uint64_t ha, uint64_t lb, uint64_t hb)
      {
         return cmptf2_impl(la, ha, lb, hb, 1);
      }

      int getf2(uint64_t la, uint64_t ha, uint64_t lb, uint64_t hb)
      {
         return cmptf2_impl(la, ha, lb, hb, -1);
      }

      int gttf2(uint64_t la, uint64_t ha, uint64_t lb, uint64_t hb)
      {
         return cmptf2_impl(la, ha, lb, hb, 0);
      }

      int letf2(uint64_t la, uint64_t ha, uint64_t lb, uint64_t hb)
      {
         return cmptf2_impl(la, ha, lb, hb, 1);
      }

      int lttf2(uint64_t la, uint64_t ha, uint64_t lb, uint64_t hb)
      {
         return cmptf2_impl(la, ha, lb, hb, 0);
      }

      int cmptf2(uint64_t la, uint64_t ha, uint64_t lb, uint64_t hb)
      {
         return cmptf2_impl(la, ha, lb, hb, 1);
      }

      void negtf2(legacy_ptr<float128_t> ret, uint64_t la, uint64_t ha)
      {
         *ret = {{la, (ha ^ (uint64_t)1 << 63)}};
      }

      void floatsitf(legacy_ptr<float128_t> ret, int32_t i) { *ret = i32_to_f128(i); }

      void floatditf(legacy_ptr<float128_t> ret, uint64_t a) { *ret = i64_to_f128(a); }

      void floatunsitf(legacy_ptr<float128_t> ret, uint32_t i) { *ret = ui32_to_f128(i); }

      void floatunditf(legacy_ptr<float128_t> ret, uint64_t a) { *ret = ui64_to_f128(a); }

      double floattidf(uint64_t l, uint64_t h)
      {
         fc::uint128 v(h, l);
         unsigned __int128 val = (unsigned __int128)v;
         return ___floattidf(*(__int128*)&val);
      }

      double floatuntidf(uint64_t l, uint64_t h)
      {
         fc::uint128 v(h, l);
         return ___floatuntidf((unsigned __int128)v);
      }

      double floatsidf(int32_t i) { return from_softfloat64(i32_to_f64(i)); }

      void extendsftf2(legacy_ptr<float128_t> ret, float f)
      {
         *ret = f32_to_f128(to_softfloat32(f));
      }

      void extenddftf2(legacy_ptr<float128_t> ret, double d)
      {
         *ret = f64_to_f128(to_softfloat64(d));
      }

      void fixtfti(legacy_ptr<__int128> ret, uint64_t l, uint64_t h)
      {
         float128_t f = {{l, h}};
         *ret = ___fixtfti(f);
      }

      int32_t fixtfsi(uint64_t l, uint64_t h)
      {
         float128_t f = {{l, h}};
         return f128_to_i32(f, 0, false);
      }

      int64_t fixtfdi(uint64_t l, uint64_t h)
      {
         float128_t f = {{l, h}};
         return f128_to_i64(f, 0, false);
      }

      void fixunstfti(legacy_ptr<unsigned __int128> ret, uint64_t l, uint64_t h)
      {
         float128_t f = {{l, h}};
         *ret = ___fixunstfti(f);
      }

      uint32_t fixunstfsi(uint64_t l, uint64_t h)
      {
         float128_t f = {{l, h}};
         return f128_to_ui32(f, 0, false);
      }

      uint64_t fixunstfdi(uint64_t l, uint64_t h)
      {
         float128_t f = {{l, h}};
         return f128_to_ui64(f, 0, false);
      }

      void fixsfti(legacy_ptr<__int128> ret, float a) { *ret = ___fixsfti(to_softfloat32(a).v); }

      void fixdfti(legacy_ptr<__int128> ret, double a) { *ret = ___fixdfti(to_softfloat64(a).v); }

      void fixunssfti(legacy_ptr<unsigned __int128> ret, float a)
      {
         *ret = ___fixunssfti(to_softfloat32(a).v);
      }

      void fixunsdfti(legacy_ptr<unsigned __int128> ret, double a)
      {
         *ret = ___fixunsdfti(to_softfloat64(a).v);
      }

      double trunctfdf2(uint64_t l, uint64_t h)
      {
         float128_t f = {{l, h}};
         return from_softfloat64(f128_to_f64(f));
      }

      float trunctfsf2(uint64_t l, uint64_t h)
      {
         float128_t f = {{l, h}};
         return from_softfloat32(f128_to_f32(f));
      }

      template <typename Rft>
      static void register_callbacks()
      {
         Rft::template add<&Derived::ashlti3>("env", "__ashlti3");
         Rft::template add<&Derived::ashrti3>("env", "__ashrti3");
         Rft::template add<&Derived::lshlti3>("env", "__lshlti3");
         Rft::template add<&Derived::lshrti3>("env", "__lshrti3");
         Rft::template add<&Derived::divti3>("env", "__divti3");
         Rft::template add<&Derived::udivti3>("env", "__udivti3");
         Rft::template add<&Derived::modti3>("env", "__modti3");
         Rft::template add<&Derived::umodti3>("env", "__umodti3");
         Rft::template add<&Derived::multi3>("env", "__multi3");
         Rft::template add<&Derived::addtf3>("env", "__addtf3");
         Rft::template add<&Derived::subtf3>("env", "__subtf3");
         Rft::template add<&Derived::multf3>("env", "__multf3");
         Rft::template add<&Derived::divtf3>("env", "__divtf3");
         Rft::template add<&Derived::eqtf2>("env", "__eqtf2");
         Rft::template add<&Derived::netf2>("env", "__netf2");
         Rft::template add<&Derived::getf2>("env", "__getf2");
         Rft::template add<&Derived::gttf2>("env", "__gttf2");
         Rft::template add<&Derived::lttf2>("env", "__lttf2");
         Rft::template add<&Derived::letf2>("env", "__letf2");
         Rft::template add<&Derived::cmptf2>("env", "__cmptf2");
         Rft::template add<&Derived::unordtf2>("env", "__unordtf2");
         Rft::template add<&Derived::negtf2>("env", "__negtf2");
         Rft::template add<&Derived::floatsitf>("env", "__floatsitf");
         Rft::template add<&Derived::floatunsitf>("env", "__floatunsitf");
         Rft::template add<&Derived::floatditf>("env", "__floatditf");
         Rft::template add<&Derived::floatunditf>("env", "__floatunditf");
         Rft::template add<&Derived::floattidf>("env", "__floattidf");
         Rft::template add<&Derived::floatuntidf>("env", "__floatuntidf");
         Rft::template add<&Derived::floatsidf>("env", "__floatsidf");
         Rft::template add<&Derived::extendsftf2>("env", "__extendsftf2");
         Rft::template add<&Derived::extenddftf2>("env", "__extenddftf2");
         Rft::template add<&Derived::fixtfti>("env", "__fixtfti");
         Rft::template add<&Derived::fixtfdi>("env", "__fixtfdi");
         Rft::template add<&Derived::fixtfsi>("env", "__fixtfsi");
         Rft::template add<&Derived::fixunstfti>("env", "__fixunstfti");
         Rft::template add<&Derived::fixunstfdi>("env", "__fixunstfdi");
         Rft::template add<&Derived::fixunstfsi>("env", "__fixunstfsi");
         Rft::template add<&Derived::fixsfti>("env", "__fixsfti");
         Rft::template add<&Derived::fixdfti>("env", "__fixdfti");
         Rft::template add<&Derived::fixunssfti>("env", "__fixunssfti");
         Rft::template add<&Derived::fixunsdfti>("env", "__fixunsdfti");
         Rft::template add<&Derived::trunctfdf2>("env", "__trunctfdf2");
         Rft::template add<&Derived::trunctfsf2>("env", "__trunctfsf2");
      }
   };

}  // namespace b1::rodeos
