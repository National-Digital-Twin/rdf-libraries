export * from './schema';
export * from './types';

const DEVELOPMENT = false; // TODO! Read from config
const DEBUG = false;
/*
  * @module RdfService @remarks 
  * A fairly simple class that provides methods for creating, reading and deleting RDF triples @author Ian Bailey
  */
export const emptyUriErrorMessage = "Cannot have an empty URI"
export const emptyPredicateErrorMessage = "predicate must be provided"
export const noColonInPrefixException = "W3C/XML prefixes must end with a : (colon) character"
export const unknownPrefixException = "Unknown Prefix "
export const unrecognisedIdField = "ID field is not in the results"
const isEmptyString = (str: string) => !Boolean(str);

export type RDFBasetype = "URI" | "LITERAL" | "BNODE";

export interface SPARQLResultBinding {
  value: string;
  type: string;
}

export interface SPARQLQuerySolution {

}

export interface CountQuerySolution extends SPARQLQuerySolution{
  count: SPARQLResultBinding
}

export interface TypedNodeQuerySolution extends SPARQLQuerySolution {
  uri: SPARQLResultBinding,
  _type?: SPARQLResultBinding,
}

export interface RelatedNodeQuerySolution extends TypedNodeQuerySolution {
  predicate: SPARQLResultBinding
}

export interface LiteralPropertyQuerySolution {
  predicate: SPARQLResultBinding,
  literal: SPARQLResultBinding
}


export interface SPOQuerySolution extends SPARQLQuerySolution {
  s: SPARQLResultBinding,
  p: SPARQLResultBinding,
  o: SPARQLResultBinding
}

export interface RelatingQuerySolution extends SPARQLQuerySolution {
  relating: SPARQLResultBinding,
  pred: SPARQLResultBinding
}

export interface RelatedQuerySolution extends SPARQLQuerySolution {
  related: SPARQLResultBinding,
  pred: SPARQLResultBinding
}


export type QueryResponse<T = SPARQLQuerySolution> = {
  "head": {
    "vars": string[]
  },
  "results": {
    "bindings": T[]
  },
  boolean?:boolean
}

export type RelatedResources = {
  [key: string]: RDFSResource[];
}

export type RelatedLiterals = {
  [key: string]: string[];
}


/**
  * @typeParam XsdDataType
  */
export type XsdDataType = "xsd:string" | //	Character strings (but not all Unicode character strings)
  "xsd:boolean" |  // true / false
  "xsd:decimal" | // Arbitrary-precision decimal numbers
  "xsd:integer" | // Arbitrary-size integer numbers
  "xsd:double" | // 	64-bit floating point numbers incl. ±Inf, ±0, NaN
  "xsd:float" | // 	32-bit floating point numbers incl. ±Inf, ±0, NaN
  "xsd:date" | // 	Dates (yyyy-mm-dd) with or without timezone
  "xsd:time" | // 	Times (hh:mm:ss.sss…) with or without timezone
  "xsd:dateTime" | // 	Date and time with or without timezone
  "xsd:dateTimeStamp" | // Date and time with required timezone
  "xsd:gYear" | // 	Gregorian calendar year
  "xsd:gMonth" | // 	Gregorian calendar month
  "xsd:gDay" | // 	Gregorian calendar day of the month
  "xsd:gYearMonth" | // 	Gregorian calendar year and month
  "xsd:gMonthDay" | // 	Gregorian calendar month and day
  "xsd:duration" | // 	Duration of time
  "xsd:yearMonthDuration" | //	Duration of time (months and years only)
  "xsd:dayTimeDuration" | //Duration of time (days, hours, minutes, seconds only)
  "xsd:byte" | //-128…+127 (8 bit)
  "xsd:short" | //	-32768…+32767 (16 bit)
  "xsd:int" | //	-2147483648…+2147483647 (32 bit)
  "xsd:long" | //-9223372036854775808…+9223372036854775807 (64 bit)
  "xsd:unsignedByte" | //	0…255 (8 bit)
  "xsd:unsignedShort" | //	0…65535 (16 bit)
  "xsd:unsignedInt" | //	0…4294967295 (32 bit)
  "xsd:unsignedLong" | //	0…18446744073709551615 (64 bit)
  "xsd:positiveInteger" | //	Integer numbers >0
  "xsd:nonNegativeInteger" | //	Integer numbers ≥0
  "xsd:negativeInteger" | //	Integer numbers <0
  "xsd:nonPositiveInteger" | //	Integer numbers ≤0
  "xsd:hexBinary" | //	Hex-encoded binary data
  "xsd:base64Binary" | //	Base64-encoded binary data
  "xsd:anyURI" | //	Absolute or relative URIs and IRIs
  "xsd:language" | //	Language tags per [BCP47]
  "xsd:normalizedString" | //	Whitespace-normalized strings
  "xsd:token" | //	Tokenized strings
  "xsd:NMTOKEN" | //	XML NMTOKENs
  "xsd:Name" | //	XML Names
  "xsd:NCName";


//A wrapper class for an RDFS Resource - i.e. typed node in the graph  
export class RDFSResource {
  uri: string;
  types: string[];
  statement?: TypedNodeQuerySolution;
  protected service: RdfService;
  // TODO makes args and option object
  public constructor(service: RdfService, uri? : string, type:string = "http://www.w3.org/2000/01/rdf-schema#Resource", statement? : TypedNodeQuerySolution) {
    this.uri = ''
    this.types = []
    this.service = service
    this.statement = statement
    if (statement) {
      if (statement.uri.value in this.service.nodes) { // we've already created an object for this item
        const existingItem = this.service.nodes[statement.uri.value]
        if ((statement._type) && !(existingItem.types.includes(statement._type.value)) ){
          existingItem.types.push(statement._type.value)
        }
        return existingItem
      } else {
        // TODO handle object not created
      }
      this.uri = statement.uri.value
      if ((statement._type) && !(this.types.includes(statement._type.value))){
        this.types.push(statement._type.value)
      }      
      //no need to instantiate this data in the triplestore as it's already come from a query
    } else {
      if (uri) {
        this.uri = uri
        if (uri in this.service.nodes) { //we've already created an object for this item
          const existingItem:RDFSResource = this.service.nodes[uri]
          // Comparing constructor names like so:
          //      if (existingItem.constructor.name != this.constructor.name) {
          // didn't work when code was minified - as the name of hte class was minified. 
          // In JS, function are first class citizens. Classes are lipstick on a pig.
          if (existingItem.constructor != this.constructor) {
            throw Error(`Attempt to create a different type of object with uri ${uri}, existing: ${existingItem.constructor}, new: ${this.constructor}`)
          }
          if ((type) && !(existingItem.types.includes(type)) ){
            existingItem.types.push(type)
          }
          //console.warn(`Existing item: ${uri}`)
          return existingItem
        } 
      }
      else {
        this.uri = this.service.mintUri()
      }
      if ((type)&& !(this.types.includes(type))) {
        this.types.push(type)
        
        this.service.instantiate(type, this.uri)
      }
      else {
        throw new Error("An RDFResource requires a type, or a statement PropertyQuery object")
      }
    }
    this.service.nodes[this.uri] = this
    
  }
  /**
   * @method addLiteral
   * @remarks 
   * Adds a literal property 
   *
   * @param predicate - The second position in the triple (the PREDICATE)
   * @param text - the literal to be assigned to the triple
   * @param {boolean} deletePrevious - remove any existing properties with that predicate type - defaults to false 
  */
  async addLiteral(predicate: string, text: string, securityLabel?:string, xsdDatatype?: XsdDataType, deleteAllPrevious:boolean=false) {
    if (isEmptyString(predicate)) throw new Error("Cannot have an empty predicate")
    if (isEmptyString(text)) throw new Error("Cannot have empty text in a triple")
    return await this.service.insertTriple(this.uri, predicate, text, "LITERAL",securityLabel,xsdDatatype,deleteAllPrevious)
  }

  /**
   * @method addLabel 
   * @remarks
   * simple convenience function to add an rdfs:label 
   *
   * @param {string} label - the literal text of the rdfs:label
   * @param {boolean} deletePrevious - remove any existing labels - defaults to false 
  */
    async addLabel(label: string, securityLabel?:string, xsdDatatype:XsdDataType="xsd:string", deleteAllPrevious:boolean = false) {
      if (isEmptyString(label)) throw new Error("invalid label string")
      return this.addLiteral(this.service.rdfsLabel,label,securityLabel,xsdDatatype,deleteAllPrevious)
    }
  
  /**
   * @method addComment 
   * @remarks
   * simple convenience function to add an rdfs:comment 
   *
   * @param {string} comment - the literal text of the rdfs:comment
   * @param {boolean} deletePrevious - remove any existing comments - defaults to false 
  */
  async addComment(comment: string, securityLabel?:string, xsdDatatype:XsdDataType="xsd:string", deleteAllPrevious:boolean = false) {
    if (isEmptyString(comment)) throw new Error("invalid comment string")
    return this.addLiteral(this.service.rdfsComment,comment,securityLabel,xsdDatatype,deleteAllPrevious)
  }


  /**
   * @method setTitle 
   * @remarks
   * Adds a dublin core title to a node
   * @param {string} title - the title to be applied (simple text)
   * @param {boolean} deletePrevious - remove any existing comments - defaults to true 
  */   
  async setTitle(title:string, securityLabel?:string, xsdDatatype:XsdDataType="xsd:string", deleteAllPrevious:boolean = true) {
    if (isEmptyString(title)) throw new Error("invalid title string")
    return this.addLiteral(this.service.dcTitle,title,securityLabel,xsdDatatype,deleteAllPrevious)
  }
  /**
   * @method setDescription 
   * @remarks
   * Adds a dublin core description to a node
   * {@link https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/description}
   * @param {string} description - the description to be applied (simple text)
   * @param {boolean} deletePrevious - remove any existing comments - defaults to true 
  */   
  async setDescription(description:string, securityLabel?:string, xsdDatatype:XsdDataType="xsd:string", deleteAllPrevious:boolean = true) {
    if (isEmptyString(description)) throw new Error("invalid description string")
    return this.addLiteral(this.service.dcDescription,description,securityLabel,xsdDatatype,deleteAllPrevious)
  }

  /**
   * @method setCreator 
   * @remarks
   * Adds a dublin core creator to a node
   * {@link https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/creator}
   * @param {string} creator - the creator to be applied (simple text)
   * @param {boolean} deletePrevious - remove any existing comments - defaults to true 
  */   
  async setCreator(creator:string, securityLabel?:string, xsdDatatype:XsdDataType="xsd:string", deleteAllPrevious:boolean = true) {
    if (isEmptyString(creator)) throw new Error("invalid creator string")
    return this.addLiteral(this.service.dcCreator,creator,securityLabel,xsdDatatype,deleteAllPrevious)
  }
  /**
   * @method setRights 
   * @remarks
   * Adds a dublin core rights to a node
   * {@link https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/rights}
   * @param {string} rights - the rights to be applied (simple text)
   * @param {boolean} deletePrevious - remove any existing comments - defaults to true 
  */   
  async setRights(rights:string, securityLabel?:string, xsdDatatype:XsdDataType="xsd:string", deleteAllPrevious:boolean = true) {
    if (isEmptyString(rights)) throw new Error("invalid rights string")
    return this.addLiteral(this.service.dcRights,rights,securityLabel,xsdDatatype,deleteAllPrevious)
  }

  /**
   * @method setPublished
   * @remarks
   * Adds a dublin core published to a node
   * @param {string} publishedDate - the title to be applied (simple text)
   * @param {boolean} deletePrevious - remove any existing published dates - defaults to true 
  */   
  async setPublished(publishedDate:string, securityLabel?:string, xsdDatatype:XsdDataType="xsd:string", deleteAllPrevious:boolean = true) {
    if (isEmptyString(publishedDate)) throw new Error("invalid published date")
    return this.addLiteral(this.service.dcPublished,publishedDate,securityLabel,xsdDatatype,deleteAllPrevious)
  }

  /**
   * @method setPrefLabel
   * @remarks
   * Adds a SKOS preferred label to a node - will overwrite all previous prefLabels by default
   * @param {string} label - the label to be applied (simple text)
   * @param {boolean} deletePrevious - remove any existing labels - defaults to true 
  */   
  async setPrefLabel(label:string, securityLabel?:string, xsdDatatype:XsdDataType="xsd:string", deleteAllPrevious:boolean = true) {
    if (isEmptyString(label)) throw new Error("invalid skos:prefLabel")
    return this.addLiteral(`${this.service.skos}prefLabel`,label,securityLabel,xsdDatatype,deleteAllPrevious)
  }

  /**
   * @method setAltLabel
   * @remarks
   * Adds a SKOS alternative label to a node 
   * @param {string} label - the title to be applied (simple text)
   * @param {boolean} deletePrevious - remove any existing labels - defaults to false 
  */   
  async setAltLabel(label:string, securityLabel?:string, xsdDatatype:XsdDataType="xsd:string", deleteAllPrevious:boolean = false) {
    if (isEmptyString(label)) throw new Error("invalid skos:altLabel")
    return this.addLiteral(`${this.service.skos}altLabel`,label,securityLabel,xsdDatatype,deleteAllPrevious)
  }

  async countRelated(rel:string):Promise<number> {
    const query = `SELECT (count(DISTINCT ?item) as ?count) WHERE {<${this.uri}> ${rel} ?item}`
    const queryReturn = await this.service.runQuery<CountQuerySolution>(query)
    if (queryReturn.results.bindings.length < 1) {
        return 0
    }
    else {
        if (queryReturn.results.bindings.length > 1) {
            throw new Error('Count query should never return more than one binding')
        }
        else {
          if (queryReturn.results.bindings[0].count) {
            return Number( queryReturn.results.bindings[0].count.value)
          } else {
            return 0
          }
        }
    }
  }

    /**
   * @method getRelated
   * @remarks
   * Simple function to get all objects related to this node by a predicate
   * @param predicate - the predicate relating to the objects that are returned
   * @returns -  a RelatedResources object
  */
    async getRelated(predicate?: string):Promise<RelatedResources> {
     let predString = ''
     if (predicate) {
        predString = ` BIND (<${predicate}> AS ?predicate) .`
      }
      const query = `SELECT ?uri ?_type ?predicate WHERE {${predString} <${this.uri}> ?predicate ?uri . OPTIONAL {?uri a ?_type} FILTER isIRI(?uri) }`
      const spOut = await this.service.runQuery<RelatedNodeQuerySolution>(query)
      if (!spOut?.results?.bindings) return {}
      const output:RelatedResources = {}
      spOut.results.bindings.forEach((statement:RelatedNodeQuerySolution) => {
        const related = new RDFSResource(this.service,undefined,undefined,statement)
        if (!(statement.predicate.value in output)) {
          output[statement.predicate.value] = []
        }
        if (output[statement.predicate.value].indexOf(related) < 0) {
          output[statement.predicate.value].push(related)
        } 
        
      })
      return output
    }

    /**
     * @method getRelating 
     * @remarks
     * simple function to get all subjects relating to this node by a predicate - i.e. reverse relationships
     *
     * @param predicate - the predicate relating to the objects that are returned
     * @returns a RelatedResources object
    */
    async getRelating(predicate: string):Promise<RelatedResources> {
      let predString = ''
      if (predicate) {
        predString = ` BIND (<${predicate}> AS ?predicate) .`
      }
      const query = `SELECT ?uri ?_type ?predicate WHERE {${predString} ?uri ?predicate <${this.uri}> . OPTIONAL {?uri a ?_type} }`
      const spOut = await this.service.runQuery<RelatedNodeQuerySolution>(query)
      if (!spOut?.results?.bindings) return {}
      const output:RelatedResources = {}
      spOut.results.bindings.forEach((statement:RelatedNodeQuerySolution) => {
        const related = new RDFSResource(this.service,undefined,undefined,statement)
        if (!(statement.predicate.value in output)) {
          output[statement.predicate.value] = []
        }
        if (output[statement.predicate.value].indexOf(related) < 0) {
          output[statement.predicate.value].push(related)
        } 
      })
      return output
    }

  /**
   * @method getLiteralProperties
   * @remarks
   * Simple function to get all literals related to this node
   *
   * @param predicate - the predicate relating to the literal properties that are returned
   * @returns - a RelatedLiterals object
  */
  async getLiterals(predicate?: string):Promise<RelatedLiterals> {
    let predString = ''
    if (predicate) {
      predString = ` BIND (<${predicate}> AS ?predicate) .`
     }
 
     const query = `SELECT ?literal ?predicate WHERE {${predString} <${this.uri}> ?predicate ?literal . FILTER isLiteral(?literal) }`
     const spOut = await this.service.runQuery<LiteralPropertyQuerySolution>(query)
     if (!spOut?.results?.bindings) return {}
     const output:RelatedLiterals = {}
     spOut.results.bindings.forEach((statement:LiteralPropertyQuerySolution) => {
       const lit:string = statement.literal.value
       if (!(statement.predicate.value in output)) {
         output[statement.predicate.value] = []
       }
       if (output[statement.predicate.value].indexOf(lit) < 0) {
         output[statement.predicate.value].push(lit)
       } 
     })
     return output
   }

  /**
   * @method getLabels
   * @remarks
   * Simple function to get all rdfs labels
   *
   * @returns - an array of strings
  */ 
   async getLabels():Promise<string[]> {
    const lits:RelatedLiterals = await this.getLiterals(this.service.rdfsLabel)
    let labels:string[] = []
    if (this.service.rdfsLabel in lits) {
      labels = lits[this.service.rdfsLabel]
    }
    return labels
   }


  /**
   * @method getPrefLabels
   * @remarks
   * Simple function to get all skos preferred labels
   *
   * @returns - an array of strings
  */ 
  async getPrefLabel():Promise<string[]> {
    const lits:RelatedLiterals = await this.getLiterals(`${this.service.skos}prefLabel`)
    let labels:string[] = []
    if (`${this.service.skos}prefLabel` in lits) {
      labels = lits[`${this.service.skos}prefLabel`]
    }
    if (labels.length > 1) {
      console.warn(`More than one SKOS preferred label on ${this.uri}`)
    } 
    return labels
   }

  /**
   * @method getAltLabels
   * @remarks
   * Simple function to get all skos alternative labels
   *
   * @returns - an array of strings
  */ 
  async getAltLabels():Promise<string[]> {
    const lits:RelatedLiterals = await this.getLiterals(`${this.service.skos}altLabel`)
    let labels:string[] = []
    if (`${this.service.skos}altLabel` in lits) {
      labels = lits[`${this.service.skos}altLabel`]
    }
    return labels
   }


  /**
   * @method getComments
   * @remarks
   * Simple function to get all rdfs comments
   *
   * @returns - an array of strings
  */ 
  async getComments():Promise<string[]> {
    const lits:RelatedLiterals = await this.getLiterals(this.service.rdfsComment)
    let comments:string[] = []
    if (this.service.rdfsComment in lits) {
      comments = lits[this.service.rdfsComment]
    }
    return comments
   }

  /**
   * @method getTitle
   * @remarks
   * Simple function to get all dublin core title - there should only be one, but sometimes you get multiple with different lang strings
   *
   * @returns - an array of strings
  */ 
  async getDcTitle():Promise<string[]> {
    const lits:RelatedLiterals = await this.getLiterals(this.service.dcTitle)
    let titles:string[] = []
    if (this.service.dcTitle in lits) {
      titles = lits[this.service.dcTitle]
    }
    if (titles.length > 1) {
      console.warn(`More than one Dublin Core title tag on ${this.uri}`)
    } 
    return titles
   }

  /**
   * @method getDescription
   * @remarks
   * Simple function to get all dublin core descriptions
   * There should only be one, but sometimes you get multiple with different lang strings
   * {@link https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/description}
   *
   * @returns - an array of strings
  */ 
  async getDcDescription():Promise<string[]> {
    const lits:RelatedLiterals = await this.getLiterals(this.service.dcDescription)
    let descriptions:string[] = []
    if (this.service.dcDescription in lits) {
      descriptions = lits[this.service.dcDescription]
    }
    if (descriptions.length > 1) {
      console.warn(`More than one Dublin Core description tag on ${this.uri}`)
    } 
    return descriptions
   }

  /**
   * @method getRights
   * @remarks
   * Simple function to get all dublin core rights
   * There should only be one, but sometimes you get multiple with different lang strings
   * {@link https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/description}
   *
   * @returns - an array of strings
  */ 
  async getDcRights():Promise<string[]> {
    const lits:RelatedLiterals = await this.getLiterals(this.service.dcRights)
    let rights:string[] = []
    if (this.service.dcRights in lits) {
      rights = lits[this.service.dcRights]
    }
    return rights
   }

  /**
   * @method getCreator
   * @remarks
   * Simple function to get all dublin core creators
   * There should only be one, but sometimes you get multiple with different lang strings
   * {@link https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/description}
   *
   * @returns - an array of strings
  */ 
  async getDcCreator():Promise<string[]> {
    const lits:RelatedLiterals = await this.getLiterals(this.service.dcCreator)
    let creators:string[] = []
    if (this.service.dcCreator in lits) {
      creators = lits[this.service.dcCreator]
    }
    if (creators.length > 1) {
      console.warn(`More than one Dublin Core creator tag on ${this.uri}`)
    } 
    return creators
   }

  /**
   * @method getDcPublished
   * @remarks
   * Simple function to get all dublin core published tags. There should only be one though
   *
   * @returns - an array of strings
  */ 
  async getDcPublished():Promise<string[]> {
    const lits:RelatedLiterals = await this.getLiterals(this.service.dcPublished)
    let pubs:string[] = []
    if (this.service.dcPublished in lits) {
      pubs = lits[this.service.dcPublished]
    }
    if (pubs.length > 1) {
      console.warn(`More than one Dublin Core published tag on ${this.uri}`)
    } 
    return pubs
   }

  /**
   * @method getDcCreated
   * @remarks
   * Simple function to get all dublin core published tags. There should only be one though
   *
   * @returns - an array of strings
  */ 
  async getDcCreated():Promise<string[]> {
    const lits:RelatedLiterals = await this.getLiterals(this.service.dcCreated)
    let pubs:string[] = []
    if (this.service.dcCreated in lits) {
      pubs = lits[this.service.dcCreated]
    }
    if (pubs.length > 1) {
      console.warn(`More than one Dublin Core created tag on ${this.uri}`)
    } 
    return pubs
   }

}

  
export class RdfService {
  public workAsync:Promise<unknown>[] = [];
  /**
    * A fallback security label if none is specified
    */
  defaultSecurityLabel: string;
  #writeEnabled: boolean;
  dataset: string;
  triplestoreUri: string;
  queryEndpoint: string; // should these be made a private method?
  updateEndpoint: string;
  dc: string;
  xsd: string;
  rdf: string;
  rdfs: string;
  skos: string;
  owl: string;
  telicent: string;
  prefixDict: {
    [key: string]: string;
  };
  rdfType: string;

  rdfsResource: string;


  rdfsLabel: string;
  rdfsComment: string;

  nodes: {
    [key: string]: RDFSResource;
  };

  dct : string;
  dcTitle : string;
  dcDescription : string; // https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/description
  // TODO QUESTION: Should these be dctCreator?. Feel like we need a value object { prefix: DublineCoreUri, id:  DublineCoreTerms} | { prefix, id }
  dcCreator : string; // https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/creator
  // TODO! Perhaps misusing "rights" temporarily for demo
  dcRights : string; // https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/rights
  dcCreated : string;
  dcPublished : string;
  classLookup: {
    [key: string]: unknown;
  };
  updateCount: number;


  /**
   * @method constructor 
   * @remarks
   * A fairly simple class that provides methods for creating, reading and deleting RDF triples
   * @param {string} [triplestoreUri="http://localhost:3030/"] - The host address of the triplestore
   * @param {string} [dataset="ds"] - the dataset name in the triplestore
   * @param {string} [defaultUriStub="http://telicent.io/data/"] - the default stub to use when building GUID URIs
   * @param {string} [defaultSecurityLabel=""] - the security label to apply to data being created in the triplestore (only works in Telicent CORE stack)
   * @param {boolean} [write=false] - set to true if you want to update the data, default is false (read only)
  */
  constructor(triplestoreUri = "http://localhost:3030/", dataset = "ds", defaultNamespace = "http://telicent.io/data/", defaultSecurityLabel = "", write=false) {
    this.defaultSecurityLabel = defaultSecurityLabel
    this.dataset = dataset
    this.triplestoreUri = triplestoreUri
    this.queryEndpoint = this.triplestoreUri + dataset + "/query?query="
    this.updateEndpoint = this.triplestoreUri + dataset + "/update"
    this.#writeEnabled = write
    this.updateCount = 0

    // why is this in the constructor if it is static?
    this.dc = "http://purl.org/dc/elements/1.1/"
    this.xsd = "http://www.w3.org/2001/XMLSchema#"
    this.rdf = "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    this.rdfs = "http://www.w3.org/2000/01/rdf-schema#"
    this.owl = "http://www.w3.org/2002/07/owl#"
    this.skos = "http://www.w3.org/2004/02/skos/core#"
    this.telicent = "http://telicent.io/ontology/"
    this.rdfType = `${this.rdf}type`
    this.rdfsResource = `${this.rdfs}Resource`
    this.rdfsLabel = `${this.rdfs}label`
    this.rdfsComment = `${this.rdfs}comment`


    this.dct = "http://purl.org/dc/terms/"   //@Dave -  DC items  to move up to the RdfService class. Didn't want to go messing with your code though
    this.dcTitle = `${this.dct}title`
    this.dcDescription = `${this.dct}description`
    this.dcCreator = `${this.dct}creator`
    this.dcRights = `${this.dct}rights`
    this.dcCreated = `${this.dct}created`
    this.dcPublished = `${this.dct}published`
    this.prefixDict = {}
    this.addPrefix(":", defaultNamespace)
    this.addPrefix("xsd:", this.xsd)
    this.addPrefix("dc:", this.dc)
    this.addPrefix("rdf:", this.rdf)
    this.addPrefix("rdfs:", this.rdfs)
    this.addPrefix("rdfs:", this.rdfs)
    this.addPrefix("skos:", this.skos)
    this.addPrefix("telicent:", this.telicent)
    this.addPrefix("foaf:", "http://xmlns.com/foaf/0.1/")
    this.addPrefix("dct:", "http://purl.org/dc/terms/")
    this.classLookup = {}
    this.classLookup[this.rdfsResource] = RDFSResource
    this.nodes = {}
  }

  inCache(uri:string) {
    if (uri in this.nodes) {
      return true
    }
    else
    {
      return false
    }
  } 

  lookupClass(clsUri:string,defaultCls: unknown) {
    if (this.classLookup[clsUri])
      return this.classLookup[clsUri]
    else {
      return defaultCls
    }
  }

  getAllElements() {
    console.warn("This has been deprecated - who wants to get everything at once ?")

  }

  /**
   * @method addPrefix
   * @remarks
   * Adds an XML/W3C prefix to the RdfService so it can be used in query production, URI shortening, etc.
   *
   * @param prefix - a valid W3C prefix, with the : (colon) character at the end
   * @param uri - the URI represented by the prefix
  */
  addPrefix(prefix: string, uri: string) {
    if (prefix.slice(-1) != ":") {
      throw noColonInPrefixException
    }
    this.prefixDict[prefix] = uri
  }

  public set defaultNamespace(uri: string) {
    this.addPrefix(":", uri)
  }

  public get defaultNamespace(): string {
    return this.prefixDict[":"]
  }

  /**
   * @method getPrefix
   * @remarks
   * returns the prefix for a given URI - if no prefix is known, the URI is returned instead of a prefix
   *
   * @param uri - the URI represented by the prefix
   * @returns the prefix that matches the URI, if not found, the URI is returned 
  */
  getPrefix(uri: string) {
    const keys = Object.keys(this.prefixDict)
    const values = Object.values(this.prefixDict)

    return keys.find((_, index) => values[index] === uri) || uri;
  }

  /**
   * @method shorten
   * @remarks
   * Shortens a URI to its prefixed equivalent. If no prefix is found, the full URI is returned
   *
   * @param uri - the URI represented by the prefix
   * @returns the prefix that matches the URI, if not found, the URI is returned 
  */
  shorten(uri: string) {
    const keys = Object.keys(this.prefixDict)

    const result = keys.find(key => uri.includes(this.prefixDict[key]));
    return result ? uri.replace(this.prefixDict[result], result) : uri;
  }

  /**
   * @method getSparqlPrefix
   * @remarks
   * Returns a formatted SPARQL prefix statement for the provided prefix
   *
   * @param prefix - the prefix for which you need the statement
   * @returns a formatted SPARQL prefix statement
  */
  getSparqlPrefix(prefix: string) {
    if (prefix in this.prefixDict) {
      return `PREFIX ${prefix} <${this.prefixDict[prefix]}> `
    }
    else {
      throw unknownPrefixException + prefix
    }
  }

  /**
   * @returns a formatted set of SPARQL prefix statements
  */
  get sparqlPrefixes() {
    let prefixStr = ""
    for (const prefix in this.prefixDict) {
      prefixStr = prefixStr + `PREFIX ${prefix} <${this.prefixDict[prefix]}> `
    }
    return prefixStr
  }

  /**
   * @method mintUri
   * @remarks
   * Generates a random (UUID) URI based on the namespace passed to it. If not namespace is passed, it will use the RDF Service default namespace
   *
   * @param namespace - a valid uri namespace - if none, the default will be used
   * @returns a random URI
  */
  mintUri(namespace: string = this.defaultNamespace):string {
    return namespace + crypto.randomUUID()
  }

  /**
   * @method runQuery
   * @remarks
   * Issues a query to the triplestore specified when the RdfService was initiated and returns results in standard SPARQL JSON format
   *
   * @param string - A valid SPARQL query
   * @returns the results of the query in standard SPARQL JSON results format
  */
  async runQuery<T>(query: string): Promise<QueryResponse<T>> {

    if (isEmptyString(query))
      throw Error("runQuery: A valid query is required");

    const responseAsync = fetch(
      this.queryEndpoint + encodeURIComponent(this.sparqlPrefixes + query),
      { headers: { Expects: "application/sparql-results+json" } }
    );
    this.workAsync.push(responseAsync);
    const response = await responseAsync;
    if (!response.ok) {
      throw response.statusText;
    }
    const jsonAsync = response.json();
    this.workAsync.push(jsonAsync);
    const results: QueryResponse<T> = await jsonAsync;
    
    console.log('SPARQL');
    console.log(this.sparqlPrefixes + query);
    
    return results;
  }

  async checkTripleStore():Promise<boolean> {
    const result = await this.runQuery<SPOQuerySolution>('ASK WHERE {}')
    if ("boolean" in result) {
      return true
    }
    return false
  }


  /**
   * @method runUpdate 
   * @remarks 
   * Sends a SPARQL update to the triplestore specified when the RdfService was initiated.
   * SPARQL endpoints don't tend to provide much feedback on success. The full response text is returned from this function however. 
   *
   * @param updateQuery - A valid SPARQL update query
   * @param securityLabel - the security label to apply to new data. If none provided, the default will be used. 
   * @returns the response text from the triplestore after running the update
   * @throws if the triplestore does not accept the update
  */
  async runUpdate(
    updateQueries: string[],
    securityLabel?: string
  ): Promise<string> {
    let updateQuery = this.sparqlPrefixes;
    
    updateQueries.map((query: string) => {
      updateQuery = `${updateQuery}
      ${query} ;
      `;
      this.updateCount = this.updateCount + 1;
    });

    if (this.#writeEnabled) {
      const sl = securityLabel ?? this.defaultSecurityLabel;

      if (isEmptyString(sl)) {
        if (!DEVELOPMENT) {
          // console.warn("Security label is being set to an empty string. Please check your security policy as this may make the data inaccessible")
        }
      }

      const postObject = {
        method: "POST",
        headers: {
          //
          Accept: "*/*",
          // 'Security-Label': sl, Temporarily removed because if this label is applied
          //  it omits CORS headers from the pre-flight response
          "Content-Type": "application/sparql-update",
        },
        body: this.sparqlPrefixes + updateQuery,
      };

      const response = await fetch(this.updateEndpoint, postObject);
      if (!response.ok) {
        throw response.statusText;
      }
      const textAsync = response.text()
      this.workAsync.push(textAsync);
      return await textAsync;
    } else {
      console.warn("service is in read only node, updates are not permitted");
      return "service is in read only node, updates are not permitted";
    }
  }


  /**
   * @method checkObject
   * @remarks
   * private function to sort out type of object in a subject-predicate-object triple. 
   * returns a formatted string suitable for insertion into a SPARQL query
   * if the object is a literal, a valid xsd datatype can also be provided
   *
   * @param object - the triple object (third position in a triple) to be prepared
   * @param objectType - the type of the provided object - either URI or LITERAL. Blank nodes are not supported because they're a really stupid idea.
   * @param xsdDatatype - if set, this will apply a ^^ datatype to a literal object. (optional)
   * @returns - a SPARQL component for a triple that is either formatted as a literal or a URI
   * @throws 
   * Thrown if the object type is unknown
  */
  #checkObject(object: string, objectType: RDFBasetype = "URI", xsdDatatype?: XsdDataType):string {
    let o:string = ''
    if (objectType === "URI") {
      o = `<${object}>`
    }
    else if (objectType == "LITERAL") {
      o = `"${object}"`
      if (xsdDatatype) {
        //      if ((xsdDatatype) && (xsdDatatype !== "")) {
        o = `${o}^^${xsdDatatype}`
      }
    }
    else {
      throw new Error('unknown objectType')
    }
    return o
  }


  /**
   * @method insertTriple
   * @remarks 
   * Performs a SPARQL update to insert the provided subject,predicate, object triple. 
   * Default is to assume object is a URI. Otherwise pass "URI" or "LITERAL" in the objectType parameter. 
   * Blank nodes are unsupported in this function - use runUpdate to send a more sophisticated update...or, ya know, just don't use blank nodes
   * 
   * @param subject - The first position in the triple (the SUBJECT)
   * @param predicate - The second position in the triple (the PREDICATE)
   * @param object - The third position in the triple (the OBJECT) - this may be a literal or a URI
   * @param objectType - set URI for a URI or LITERAL for a literal object. Blank Nodes are not supported because we want the world to be a better place
   * @param securityLabel - the security label to apply to new data. If none provided, the default will be used. (optional)
   * @param xsdDatatype - if set, this will apply a ^^ datatype to a literal object. Valid datatypes can be looked up in this.xsdDatatypes (optional)
   * @returns the results of the query in standard SPARQL JSON results format
   * @throws 
   * Thrown if the object type is unknown
  */
  async insertTriple(subject: string, predicate: string, object: string, objectType?: RDFBasetype, securityLabel?: string, xsdDatatype?: XsdDataType,deleteAllPrevious:boolean=false):Promise<string> {
    const updates:string[] = []
    if (deleteAllPrevious) {
      updates.push(`DELETE WHERE {<${subject}> <${predicate}> ?o}`)
    }
    const o = this.#checkObject(object, objectType, xsdDatatype)
    updates.push(`INSERT DATA {<${subject}> <${predicate}> ${o} . }`)
    const result = await this.runUpdate(updates, securityLabel)
    console.log('INSERTED');
    console.log(updates.join('\n'));
    return result
  }

  /**
   * @method deleteTriple 
   * @remarks
   * Performs a SPARQL update to delete the triples corresponding to the provided subject,predicate, object. 
   * Default is to assume object is a URI. Otherwise pass "URI" or "LITERAL" in the objectType parameter. 
   * Blank nodes are unsupported in this function - use runUpdate to send a more sophisticated update...or, ya know, just don't use blank nodes
   *
   * @param subject - The first position in the triple (the SUBJECT)
   * @param predicate - The second position in the triple (the PREDICATE)
   * @param object - The third position in the triple (the OBJECT) - this may be a literal or a URI
   * @param objectType - set URI for a URI or LITERAL for a literal object. Blank Nodes are not support because, why would you.
   * @param xsdDatatype - if set, this will apply a ^^ datatype to a literal object. Valid datatypes can be looked up in this.xsdDatatypes
   * @returns the http response text from the server
   * @throws
   * Thrown if the object type is unknown
  */
  async deleteTriple(subject: string, predicate: string, object: string, objectType: RDFBasetype, xsdDatatype?: XsdDataType) {
    const o = this.#checkObject(object, objectType, xsdDatatype)
    return await this.runUpdate(["DELETE DATA {<" + subject + "> <" + predicate + "> " + o + " . }"])
  }

  /**
   * @method deleteNode 
   * @remarks
   * Careful with this one!  It removes all references to a URI - effectively deleting all trace of an node from the triplestore. 
   * If you only want to remove the outgoing references (i.e. not the triples where this is the object) from the node then set ignoreInboundReferences to true
   *
   * @param uri - The uri of the Node you want to get rid of
   * @param - if set to true, this will not delete any triples that refer to the node 
   * @throws 
   * Thrown if the object type is unknown
  */
  async deleteNode(uri: string, ignoreInboundReferences = false) {
    if (isEmptyString(uri)) throw Error(emptyUriErrorMessage)


    if (!ignoreInboundReferences) {
      return await this.runUpdate(["DELETE WHERE {?s ?p <" + uri + ">}"])
    }
    return await this.runUpdate(["DELETE WHERE {<" + uri + "> ?p ?o . }"])
  }

  /**
   * @method deleteRelationships 
   * @remarks
   * deletes all triples that match the pattern <uri> <predicate> <ALL>
   *
   * @param uri - The uri of the subject of the triples you want remove
   * @param predicate - the predicate to match for all triples being removed 
   * @throws 
   * Thrown if the object type is unknown
  */
  async deleteRelationships(uri: string, predicate: string):Promise<string> {
    if (isEmptyString(uri)) throw Error(emptyUriErrorMessage)
    if (isEmptyString(predicate)) throw Error("Cannot have an empty predicate")

    return await this.runUpdate([`DELETE WHERE {<${uri}> <${predicate}> ?o . }`])
  }

  /**
   * @method instantiate
   * @remarks
   * Instantiates the provided class (cls parameter). You can also specify a URI (uri parameter), otherwise it'll set the URI for you based on the defaultUriStub and a GUID
   *
   * @param cls - The class (uri of an rdfs:Class or owl:Class) that is to be instantiated
   * @param uri - The uri of the instantiated item - if unset, one will be constructed using the defaultUriStub
   * @param securityLabel - the security label to apply to new data. If none provided, the default will be used. 
   * @returns  the resulting instance's URI as a string
  */
  instantiate(cls: string, uri?: string, securityLabel?: string):string {
    if (isEmptyString(cls)) throw Error("Cannot have an empty cls");

    if (!uri) {
      uri = this.mintUri()
    }
    this.workAsync.push(this.insertTriple(uri, this.rdfType, cls, undefined, securityLabel));
    return uri
  }
}