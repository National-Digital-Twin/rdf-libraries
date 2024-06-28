import {
  CatalogService,
} from "../../index";
import { transformRdfToTree } from "./transformRdfToTree";
import { enrichRdfTree } from "./enrichRdfTree";
import {
  DATASET_URI,
  SERVICE_URI,
  CATALOG_URI,
  TreeViewBaseItemType,
  SearchParamsType,
  transformDataResourceFilters,
  getAllRDFTriples,
  RESOURCE_URI,
} from "./common";
import { RDFTripleSchema } from "@telicent-oss/rdfservice/index";

export const catalogFactory = (service: CatalogService) => {
  // TODO why must UriToClass be defined within searchFactory?
  // const UriToClass = {
  //   [DATASET_URI]: DCATDataset,
  //   [SERVICE_URI]: DCATDataService,
  //   [CATALOG_URI]: DCATCatalog,
  // };
  // TODO!!! should really handle arrays of trees!!!
  return async function catalog(
    params: SearchParamsType
  ): Promise<TreeViewBaseItemType[]> {
    const { hasAccess } = transformDataResourceFilters(
      params.dataResourceFilters
    );

    const rdfTriples = await getAllRDFTriples({ service, 
      // TODO! hasAccess // bugged
    });
    const triples = rdfTriples.results.bindings.map((el) =>
      RDFTripleSchema.parse(el)
    );

    const CONNECTIONS = [DATASET_URI, SERVICE_URI, CATALOG_URI];    
    const CONNECTIONS_REVERSE = [RESOURCE_URI];
    const tree = transformRdfToTree({
      triples,
      edgePredicate: (triple) => CONNECTIONS.includes(triple.p.value),
      reverseEdgePredicate: (triple) =>
        CONNECTIONS_REVERSE.includes(triple.p.value),
    });
    return [await enrichRdfTree({ tree, service, triples })];
  };
};
