import { z } from "zod";
import {
  CatalogService,
  DCATCatalog,
  DCATDataService,
  DCATDataset,
} from "../../index";

import {
  DATASET_URI,
  SERVICE_URI,
  CATALOG_URI,
  DataResourceSchema,
  instanceFromResourceFactory,
  getAllResourceTriples,
  uiDataResourceFromInstance,
  typeStatementMatcherWithId,
  DCATResourceSchema,
  SearchParamsType,
  transformDataResourceFilters,
} from "./common";
import { printJSON } from "./utils/printJSON";
import { tryCatch } from "./utils/tryCatch";

export const searchFactory = (service: CatalogService) => {
  // TODO why must UriToClass be defined within searchFactory?
  const UriToClass = {
    [DATASET_URI]: DCATDataset,
    [SERVICE_URI]: DCATDataService,
    [CATALOG_URI]: DCATCatalog,
  };
  return async function search(
    params: SearchParamsType
  ): Promise<Array<z.infer<typeof DataResourceSchema>>> {
    const { isOwned, dataResourceFilter } = transformDataResourceFilters(params.dataResourceFilters);
    if (dataResourceFilter === "all") {
      return Promise.all(
        (await getAllResourceTriples(service))
          .map(instanceFromResourceFactory({ service, UriToClass }))
          .map(uiDataResourceFromInstance)
      );
    }
    const id = dataResourceFilter;
    const resourceTriples = await getAllResourceTriples(service);
    const triple = resourceTriples.find(typeStatementMatcherWithId(id));
    const type = tryCatch(
      () => DCATResourceSchema.parse(triple?.o.value),
      ` id:${id} & type:(DCATResource) in ${printJSON(resourceTriples)}`
    );
    if (type === undefined) {
      throw new Error(
        `Expected to find id:${id} in ${printJSON(resourceTriples)}`
      );
    }

    if (type === CATALOG_URI) {
      const instance = new DCATCatalog(service, id);
      if (params.searchText) {
        // REQUIREMENT 7.2 Search by input text
        const found = await service.find(
          params.searchText,
          undefined,
          instance
        );
        const foundForUI = found
          .map((el) => el.item)
          .map(uiDataResourceFromInstance);
          console.info(foundForUI.length);
        return Promise.all(foundForUI);
      }

      // REQUIREMENT 6.5 Search by dataResourceFilter: selected data-resources
      const ownedInstances = await instance.getOwnedResources();
      const results = [instance, ...ownedInstances];
      console.info(ownedInstances.length, id, ownedInstances, resourceTriples);
      return Promise.all(results.map(uiDataResourceFromInstance));
    }

    // REQUIREMENTS 8.1 Search by user-owned data-resources
    /**
     * Hm. doesn't exist.
     * Fine.
     * 1. add creator into each RDFService
     * 2. In selectFactory & catalogFactory, update WHERE clauses to include creator (if it exists)
     * ... That should be it, as the rest of my logic iterates off the output
     *
     * {@link https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/creator/}
     * CONCLUSION: ~2hrs
     *
     */
    throw Error(
      `Only dataResourceFilter: "all" and type "Catalog" supported for now, instead got: "${dataResourceFilter}" `
    );
  };
};
