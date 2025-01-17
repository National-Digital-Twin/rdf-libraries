import { HumanError } from "../../../utils/HumanError";
import { CatalogService } from "../../../../index";
import { ResourceType, ResourceSchema, DCATResourceSchema } from "./common";
import { printJSON } from "./printJSON";
import { tryInstantiate } from "./tryInstantiate/tryInstantiate";



/**
 *
 * @param options
 * @returns
 */
export const instanceFromResourceFactory =
  (options: { service: CatalogService; triples?: ResourceType[] }) =>
  /**
   *
   * @param el
   * @returns
   */
  (el: ResourceType) => {
    const { service } = options;
    const { s, p, o } = ResourceSchema.parse(el);
    try {
      const uri = DCATResourceSchema.parse(el.o.value);
      return tryInstantiate({
        type: uri,
        service,
        id: s.value,
        triples: options.triples,
      });
    } catch (err) {
      throw err instanceof Error
        ? new HumanError(
            `expected DCATResource in ${printJSON(el)}, ${err}`,
            err
          )
        : err;
    }
  };
