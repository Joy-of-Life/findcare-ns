# Server data sync

MongoDB is the live source of truth for daycare listings. To refresh the local
seed snapshot from the database configured by `MONGO_URI`, run:

```sh
npm run seed:export
```

This updates `data/daycares.json` and does not modify MongoDB. The export omits
MongoDB IDs, real owner IDs, timestamps, and compliance attestations. Listings
that hide their address are exported with the same address and coordinate
redaction used for public API responses.

New and updated daycare listings must use a city or community from
`constants/novaScotiaCities.js`. The owner form loads this list from the API,
and the API and Mongoose model enforce it on writes.

To seed a database from the local snapshot, run:

```sh
npm run seed
```

Seeding replaces all daycare documents in the configured database with the
snapshot. Do not run it against a database whose current listings must be kept.
