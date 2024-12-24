# RdfService

RdfService is a helper library that abstracts away the complexity of interacting with RDF triplestores, providing basic CRUD abilities.

For futher information on how to use the library see the [API documentation](README.md#API)

## Install

```bash
yarn add @national-digital-twin/rdfservice
```

## Usage
```tsx
import RdfService from "@national-digital-twin/rdfservice";

const rdfService = new RdfService("http://localhost:3030/", "ontology");

const diagrams = await rdfService.runQuery(query);
```

## API

* [RDF Service API docs]()
