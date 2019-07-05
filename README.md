# PreQL

* Author: Jonathan M. Wilbur <[jonathan@wilbur.space](mailto:jonathan@wilbur.space)>
* Copyright Year: 2019
* License: [MIT License](https://mit-license.org/)

## What is PreQL?

A Pre-SQL language that can transpile to any SQL dialect. It takes a declarative
Kubernetes-like YAML schema and generates the necessary commands or statements
in the correct order to generate schema and other database objects in the
database dialect of your choice.

## What is this Library

This library converts PreQL into MariaDB SQL.

## To Do

- [x] Create database before deleting all triggers in it
- [x] Make the Server kind set the time zone
- [x] UPSERT on duplicate primary keys
- [x] Transpile `CharacterSet`
- [x] Transpile `Collation`
- [x] Support multi-valued attributes
- [ ] Add explanatory comments
- [ ] Warn on unrecognized types.
- [ ] Resize columns?