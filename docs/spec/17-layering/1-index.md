# Layering

Whether this codebase has recognisable layers, and why parts of it read as
unfamiliar to someone expecting controller, service, repository.

The short answer: three of those layers are here under other names, two further
categories have no equivalent in that model, and Repository means two different
things depending on which class carries it.

- [2-what-maps.md](2-what-maps.md) - the three layers, plus the static factories that look like services
- [3-what-does-not.md](3-what-does-not.md) - scoped state and concurrency plumbing, and why they exist
- [4-actions.md](4-actions.md) - what to change, in the order that pays off first
