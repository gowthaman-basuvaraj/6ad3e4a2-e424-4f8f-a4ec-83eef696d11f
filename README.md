Prerequisites
===

* node 20+
* sqlite3 installed

PREPARE
===

we will use sqlite3 as database, reading the CSV and maintaining the data in memory is not a simple task, and especially for large files, so we will use sqlite3.

using a database also helps us run adhoc queries.

*Steps*

* `npm install` to install dependencies
* `npm run prepare` to prepare database
* copy .env.example to .env and edit required values

EXECUTION
===

* `npm run start` start server
