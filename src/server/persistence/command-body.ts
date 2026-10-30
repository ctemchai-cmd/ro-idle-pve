// Valid bulk commands contain up to500 identifiers of120 Unicode characters.
// 256KiB covers their UTF-8 JSON envelope while retaining a finite HTTP limit.
export const COMMAND_BODY_LIMIT_BYTES = 256 * 1024;
