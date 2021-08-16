# Example using subchain queries

This needs `box` running with subchain configured. See [box's readme](../box/README.md).

See [.env](.env) for the set of environment variables that need to be configured. The 3 `*_URL` environment variables should normally point to the same box server to prevent state file corruption.

Set `NEXT_PUBLIC_SUBCHAIN_SLOW_MO` to `true` to see how the UI responds to a gradually-updating event stream.
