#pragma once

namespace eosio
{
   // Note: This (and flatbuf) rely on implicitly creating objects. This feature was added to C++17
   //       and C++20 via a DR resolution (P0593R6). However, P0593R6 doesn't circumvent
   //       strict-aliasing requirements. The proxy objects overlay (alias) with the actual data.
   //       e.g. an object_proxy followed by 3 member_proxy's may occupy the same space as a
   //       uint32_t. We're assuming that since the proxies have no non-static data members, calling
   //       their member functions won't cause issues. We could move the member functions outside of
   //       the proxies, but that will probably create an inconvenient API.

   /**
    * member_proxy is a member of a type (eosio_proxy) created by a macro. I is the member number in
    * the containing type. The containing type's first member is an ObjectProxy. proxyptr() does the
    * pointer math necessary to find the ObjectProxy.
    *
    * Alternatively the macro code would have to initialize every member_proxy with this, which
    * would bloat the size of the eosio_proxy object.
    *
    * flat_view<T> => eosio_proxy<T, ObjectProxy>
    *
    * struct eosio_proxy<T, ObjectProxy>  {
    *    ObjectProxy object_proxy;
    *    member_proxy<0, ptr, ObjectProxy> member_zero
    *    member_proxy<1, ptr, ObjectProxy> member_one
    *    member_proxy<2, ptr, ObjectProxy> member_two
    * }
    *
    * Let char* buf = point to a flat buffer;
    * reinterpret buf as eosio_proxy<T, ObjectProxy>, this makes the address of object_proxy
    * equal to the address of eosio_proxy because it is the first element.
    *
    * because member_proxy has no values it takes 1 byte in member_proxy and the value of that byte
    * is never read by member_proxy... member_proxy always gets the address of object_proxy and
    * then does offset math.
    */
   template <uint32_t I, auto mptr, typename ObjectProxy>
   struct member_proxy
   {
      constexpr auto proxyptr() const
      {
         return (reinterpret_cast<const ObjectProxy*>(reinterpret_cast<const char*>(this) -
                                                      sizeof(*this) * I - sizeof(ObjectProxy)));
      }
      constexpr auto proxyptr()
      {
         return (reinterpret_cast<ObjectProxy*>(reinterpret_cast<char*>(this) - sizeof(*this) * I -
                                                sizeof(ObjectProxy)));
      }
      constexpr const auto& get() const { return *(proxyptr()->template get<I, mptr>()); }
      constexpr auto& get() { return *(proxyptr()->template get<I, mptr>()); }

      template <typename... Ts>
      constexpr auto operator()(Ts&&... args)
      {
         return proxyptr()->template call<I, mptr>(std::forward<Ts>(args)...);
      }
      template <typename... Ts>
      constexpr auto operator()(Ts&&... args) const
      {
         return proxyptr()->template call<I, mptr>(std::forward<Ts>(args)...);
      }

      constexpr auto operator->() { return (proxyptr()->template get<I, mptr>()); }
      constexpr const auto operator->() const { return (proxyptr()->template get<I, mptr>()); }

      constexpr auto& operator*() { return get(); }
      constexpr const auto& operator*() const { return get(); }

      template <typename T>
      constexpr auto& operator[](T&& k)
      {
         return get()[std::forward<T>(k)];
      }

      template <typename T>
      constexpr const auto& operator[](T&& k) const
      {
         return get()[std::forward<T>(k)];
      }

      template <typename S>
      friend S& operator<<(S& stream, const member_proxy& member)
      {
         return stream << member.get();
      }

      template <typename R>
      auto operator=(R&& r)
      {
         get() = std::forward<R>(r);
         return *this;
      }

      // template <typename R>
      // operator R() const
      // {
      //    return get();
      // }

      /*
         operator decltype( ((ObjectProxy*)nullptr)->template get<I,mptr>())()
                 { return get(); }
         operator decltype( ((const ObjectProxy*)nullptr)->template get<I,mptr>()) ()const
                 { return get(); }
                 */
   };

}  // namespace eosio
