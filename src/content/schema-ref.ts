import { isObject } from './value.ts';

/** Registered local schemas and named $defs only. Never a URL or filesystem ref. */
export function localSchemaReference(ref:unknown,schemas:Readonly<Record<string,unknown>>,current:string):{schema:string;fragment:string}{
 const match=typeof ref==='string'?/^(?:([a-z-]+)\.json)?(?:#(\/\$defs\/[a-z][a-z0-9_-]*))?$/.exec(ref):null;
 if(!match||!match[1]&&!match[2])throw new TypeError(`Remote/unregistered schema ref: ${String(ref)}`);
 const name=match[1]??current,fragment=match[2]??'';
 if(!Object.hasOwn(schemas,name))throw new TypeError(`Remote/unregistered schema ref: ${String(ref)}`);
 if(fragment){const schema=schemas[name],key=fragment.slice('/$defs/'.length);if(!isObject(schema)||!isObject(schema.$defs)||!Object.hasOwn(schema.$defs,key))throw new TypeError(`Remote/unregistered schema ref: ${String(ref)}`);}
 return{schema:name,fragment};
}
