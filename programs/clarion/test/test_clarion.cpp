#include <clarion/clarion.hpp>
#include <clarion/memdb.hpp>
#include <clarion/object.hpp>
#include <clarion/sync/sync.hpp>

#define CATCH_CONFIG_MAIN
#include <catch2/catch.hpp>

template <typename Merkle, typename Storage, typename Range, typename F>
void for_each(const Merkle& merkle, const Storage& data, Range range, F&& f)
{
   auto hash = merkle.get(range);
   if (hash == decltype(hash)())
   {
      return;
   }
   if (is_leaf(range))
   {
      if (auto* value = data.get(hash))
      {
         f(*value);
      }
   }
   else
   {
      auto [l, r] = split(range);
      for_each(merkle, data, l, f);
      for_each(merkle, data, r, f);
   }
}

template <typename Hash>
void dump(const clarion::channel_object<Hash>& channel)
{
   for_each(channel.index, channel.data, channel.index.root(), [](const auto& msg) {
      std::cout << "\t" << msg.data.sequence << ": " << msg.data.body << std::endl;
   });
}

template <typename Hash>
void dump(const clarion::subscription_set<Hash>& subscriptions)
{
   for_each(subscriptions.index, subscriptions.data, subscriptions.index.root(), [](const auto& s) {
      std::cout << "\t" << to_string(s.key) << ' ' << s.is_subscribed << ' '
                << to_string(clarion::object_id{s.current_value, "sha256"}) << std::endl;
   });
}

void dump(const clarion::identity_object& obj)
{
   std::cout << "\t" << to_string(clarion::object_id{obj.get(), "identity"}) << std::endl;
}

void dump(std::monostate) {}

void dump(const clarion::object_handle& obj)
{
   std::visit([](const auto& arg) { dump(arg); }, obj);
}

void dump(clarion::memdb& db)
{
   auto& index = db.create<clarion::index>("index");
   for (auto& [id, entry] : index.objects)
   {
      std::cout << to_string(id) << std::endl;
      dump(entry.handle);
   }
}

struct queue_entry
{
   template <typename T>
   queue_entry(uint64_t stream, clarion::sync_message_kind type, const T& data)
       : stream(stream), type(type), data(std::make_shared<T>(data)), size(sizeof(T))
   {
   }
   uint64_t stream;
   clarion::sync_message_kind type;
   std::shared_ptr<void> data;
   std::size_t size;
};

using sync_queue = std::queue<queue_entry>;

auto make_sync_fn(sync_queue& queue)
{
   return [&](uint64_t stream, clarion::sync_message_kind type, const auto& data) {
      queue.push(queue_entry(stream, type, data));
   };
}

const char* to_string(clarion::sync_message_kind type)
{
   switch (type)
   {
      case clarion::sync_message_kind::root:
         return "root";
      case clarion::sync_message_kind::node:
         return "node";
      case clarion::sync_message_kind::bind:
         return "bind";
      case clarion::sync_message_kind::ack:
         return "ack";
      case clarion::sync_message_kind::leaf:
         return "leaf";
      case clarion::sync_message_kind::null:
         return "null";
   }
   return nullptr;
}

std::ostream& operator<<(std::ostream& os, const queue_entry& e)
{
   os << e.stream << ": " << to_string(e.type);
   if (e.type == clarion::sync_message_kind::bind)
   {
      auto [id, type] = *static_cast<const clarion::bind_message*>(e.data.get());
      os << " " << to_string(id);
   }
   return os;
}

TEST_CASE()
{
   clarion::node alice;
   auto alice_identity = alice.create_identity(clarion::signature_kind::ecdsa_secp256r1_sha256,
                                               clarion::hash_kind::sha256, 0);
   auto alice_news = clarion::object_id{alice_identity, "news"};
   alice.subscribe(alice_identity, alice_news);

   clarion::node bob;
   auto bob_identity = bob.create_identity(clarion::signature_kind::ecdsa_secp256r1_sha256,
                                           clarion::hash_kind::sha256, 0);

   bob.subscribe(bob_identity, {alice_identity, "news"});

   alice.post(
       alice_news,
       "four score and seven years ago, our fathers brought forth on this continent a new nation "
       "conceived in liberty and dedicated to the proposition that all men are created equal.");
   alice.post(alice_news,
              "Oh, there once was a puffin / just the shape of a muffin / and he lived on an "
              "island / in the bright blue sea.");
   alice.post(alice_news,
              "Little Bo Peep has lost her sheep and can't tell where to find them.  Leave them "
              "alone, and they'll come home, wagging their tails behind them.");

   auto run = [&] {
      sync_queue bob2alice;
      sync_queue alice2bob;
      clarion::sync bob_sync(bob.db, make_sync_fn(bob2alice), true);
      clarion::sync alice_sync(alice.db, make_sync_fn(alice2bob), false);

      bob_sync.push({bob_identity, "clarion.subscriptions"});
      alice_sync.push({alice_identity, "clarion.subscriptions"});
      alice_sync.push({alice_identity, "clarion.identity"});

      int steps = 0;
      while (!bob2alice.empty() || !alice2bob.empty() || alice_sync.has_pending() ||
             bob_sync.has_pending())
      {
         if (!bob2alice.empty())
         {
            ++steps;
            auto [stream, type, data, size] = bob2alice.front();
            std::cout << "alice:" << bob2alice.front() << std::endl;
            alice_sync.recv(stream, type, data.get(), size);
            bob2alice.pop();
         }
         if (!alice2bob.empty())
         {
            ++steps;
            auto [stream, type, data, size] = alice2bob.front();
            std::cout << "bob:" << alice2bob.front() << std::endl;
            bob_sync.recv(stream, type, data.get(), size);
            alice2bob.pop();
         }
         if (alice_sync.has_pending())
         {
            alice_sync.send();
         }
         if (bob_sync.has_pending())
         {
            bob_sync.send();
         }
      }
      std::cout << "alice:\n";
      dump(alice.db);
      std::cout << std::endl;
      std::cout << "bob:\n";
      dump(bob.db);
      std::cout << std::endl;
      std::cout << "steps: " << steps << std::endl;
   };
   run();
   run();

   alice.post(alice_news,
              "I never saw a purple cow / I never hope to see one / but I can tell you anyhow / "
              "I'd rather see than be one.");
   run();
}
