import { DEREncoder } from "./der.js";
import { PEMEncoder } from "./pem.js";

export const createEncoder = (name, entity) => {
  if (name == "der") {
    return new DEREncoder(entity);
  } else if (name == "pem") {
    return new PEMEncoder(entity);
  } else {
    throw new Error("not supported encoder: " + name);
  }
};
