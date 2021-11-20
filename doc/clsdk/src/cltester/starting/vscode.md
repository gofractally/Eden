# Debugging using vscode

You should have the following project tree:

```
<project root>/   <==== open this directory in vscode
   .vscode/
      c_cpp_properties.json
      launch.json
      settings.json
   CMakeLists.txt
   testable.hpp
   testable.cpp
   tests.cpp
   build/         (Created by build step)
      clsdk -> ....
      testable-debug.wasm
      testable.abi
      testable.wasm
      tests.wasm
      wasi-sdk -> ....
```

`launch.json` is configured to run the tests using cltester instead of starting nodeos. It sets the following cltester options:

```
--subst testable.wasm testable-debug.wasm
-v
tests.wasm
```

Open `testable.cpp` and set some break points. You may also add break points to `tests`.

Start the debugger. cltester will start running. To see its log, switch to the "cppdbg: cltester" terminal. vscode should stop at one of your breakpoints.
