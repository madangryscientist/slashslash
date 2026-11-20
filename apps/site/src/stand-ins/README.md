# Stand-ins

Each file here stands in for one part the UISlash kit does not ship yet: a component or a token. Its
first comment names the package it stands in for (`@hackcove/ui-react` or `@hackcove/themes`) and the
part, and `stand-ins.test.ts` fails on a file without one.

When the kit ships that part, the page imports the kit's version and the stand-in is deleted.
