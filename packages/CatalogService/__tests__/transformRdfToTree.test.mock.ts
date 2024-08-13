export default [
  {
    o: {
      type: "uri",
      value: "http://www.w3.org/ns/dcat#Catalog",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/data/catalog1",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://telicent.io/data/dataservice1",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/dcat#Service", // cat -> service
    },
    s: {
      type: "uri",
      value: "http://telicent.io/data/catalog1",
    },
  },
  {
    o: {
      type: "literal",
      value: "Catalog One",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/title",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/data/catalog1",
    },
  },
  {
    o: {
      type: "literal",
      value: "######## makeStatic() ########",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/published",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/data/catalog1",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://telicent.io/data/dataset1",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/ns/dcat#Dataset", // catalog1 -> dataset1
    },
    s: {
      type: "uri",
      value: "http://telicent.io/data/catalog1",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://www.w3.org/ns/dcat#DataService",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/data/dataservice1",
    },
  },
  {
    o: {
      type: "literal",
      value: "Data Service One",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/title",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/data/dataservice1",
    },
  },
  {
    o: {
      type: "literal",
      value: "######## makeStatic() ########",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/published",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/data/dataservice1",
    },
  },
  {
    o: {
      type: "uri",
      value: "http://www.w3.org/ns/dcat#Dataset",
    },
    p: {
      type: "uri",
      value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/data/dataset1",
    },
  },
  {
    o: {
      type: "literal",
      value: "Dataset One",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/title",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/data/dataset1",
    },
  },
  {
    o: {
      type: "literal",
      value: "######## makeStatic() ########",
    },
    p: {
      type: "uri",
      value: "http://purl.org/dc/terms/published",
    },
    s: {
      type: "uri",
      value: "http://telicent.io/data/dataset1",
    },
  },
];
