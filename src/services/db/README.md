# Database Service

This directory contains functions that interact with the database. These functions are responsible for querying and manipulating data in the database.

## Types

The functions in this directory accept types defined in the `src/app/types` folder. This ensures that the data being passed to and from the database is strongly typed and consistent throughout the application and decoupled from the database.

## Queries

The queries in this directory are tightly coupled to the database schema. They are designed to work directly with the structure of the database as defined in the Prisma schema. This allows for efficient and accurate data retrieval and manipulation while allowing the application to be decoupled from the database.

## Reminder:
Only the queries in this directory should be tightly coupled to the database schema. Other parts of the application should use types defined in the types directory and interact with the database through these functions to ensure consistency and maintainability.
