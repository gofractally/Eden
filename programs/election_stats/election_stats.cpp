#include <algorithm>
#include <iostream>
#include <vector>

double choose(int n, int k)
{
   double result = 1;
   k = std::min(k, n - k);
   for (int i = 1; i <= k; ++i)
   {
      result *= (n - i + 1);
      result /= i;
   }
   return result;
}

struct election_calculator
{
   election_calculator(int group_size, int threshold, int max_groups)
       : group_size(group_size),
         threshold(threshold),
         max_groups(max_groups),
         data((max_groups * group_size + 1) * (max_groups + 1) * (max_groups + 1))
   {
   }
   int group_size;
   int threshold;
   int max_groups;
   double& get(int num_groups, int win_count, int puppet_count)
   {
      int max_puppets = group_size * max_groups;
      return data[puppet_count + (max_puppets + 1) * (win_count + (max_groups + 1) * num_groups)];
   }
   double calc(int num_groups, int win_count, int puppet_count)
   {
      if (puppet_count > 0)
      {
         double sum = 0;
         // We could save memory because the results for num_groups only directly depend on num_groups - 1
         for (int i = std::max(0, puppet_count - group_size * (num_groups - 1)),
                  end = (win_count == 0) ? threshold - 1 : std::min(group_size, puppet_count);
              i <= end; ++i)
         {
            // I wonder if this can restructured into a convolution to reduce the complexity.
            sum += choose(group_size, i) *
                   get(num_groups - 1, i < threshold ? win_count : win_count - 1, puppet_count - i);
         }
         return sum;
      }
      else if (win_count == 0)
      {
         return 1;
      }
      else
      {
         return 0;
      }
   }
   std::vector<double> data;
};

auto setup(int group_size, int threshold, int num_groups)
{
   election_calculator calc(group_size, threshold, num_groups);
   for (int i = 0; i <= num_groups; ++i)
   {
      for (int j = 0; j <= i; ++j)
      {
         for (int k = 0; k <= i * group_size; ++k)
         {
            calc.get(i, j, k) = calc.calc(i, j, k);
            // std::cerr << "num_groups: " << i << ",  win_count: " << j << ", puppet_count: " << k << " -> " << calc.get(i, j, k) << std::endl;
         }
      }
   }
   return calc;
}

#if 0
// Now we need to calculate the likelyhood of successfully choosing the lead representative
struct multilevel_election_calculator
{
   multilevel_election_calculator(int group_size, int threshold, int num_groups) : calc(group_size, threshold, num_groups) {}
   election_calculator calc;
};

multilevel_election_calculator setup_multi(int group_size, int threshold, int num_groups)
{
   // chain puppet_count with num_wins
   std::vector<double> puppet_count_win_rates{1.0};
   //
   std::vector<double> next;
   for(int i = 0; i < group_size; ++i)
   {
      
   }
}
#endif

int main(int argc, char** argv)
{
   if (argc < 4)
   {
      std::cerr << "Usage: " << argv[0] << " group_size threshold num_groups" << std::endl;
      return 1;
   }
   int group_size = atoi(argv[1]);
   int threshold = atoi(argv[2]);
   int num_groups = atoi(argv[3]);
   auto tab = setup(group_size, threshold, num_groups);

   std::cout << "puppets/wins";
   for (int i = 0; i <= num_groups; ++i)
   {
      std::cout << ',' << i;
   }
   std::cout << std::endl;
   for (int i = 0; i <= num_groups * group_size; ++i)
   {
      std::cout << i;
      auto total = choose(group_size * num_groups, i);
      for (int j = 0; j <= num_groups; ++j)
      {
         std::cout << ',' << tab.get(num_groups, j, i) / total;
      }
      std::cout << '\n';
   }
}
