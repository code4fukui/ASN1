import { DERDecoder } from "./der.js";
import { PEMDecoder } from "./pem.js";

export const createDecoder = (name, entity) => {
  if (name == "der") {
    return new DERDecoder(entity);
  } else if (name == "pem") {
    return new PEMDecoder(entity);
  } else {
    throw new Error("not supported decoder: " + name);
  }
};
