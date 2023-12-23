import * as t from "https://deno.land/std/testing/asserts.ts";

export const assert = t;

export const describe = (name, func) => func();
export const it = (name, func) => Deno.test(name, func);
