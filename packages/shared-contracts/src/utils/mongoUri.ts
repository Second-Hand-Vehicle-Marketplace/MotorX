const MONGO_URI_PATTERN = /^(mongodb(?:\+srv)?):\/\/(?:[^@/]*@)?([^/?]+)(?:\/([^?]*))?(?:\?(.*))?$/i;
const LOCAL_HOST_PATTERN = /^(localhost|127\.\d+\.\d+\.\d+|\[?::1\]?|mongodb)(:\d+)?$/i;
const NON_PRODUCTION_DB_PATTERN = /(^|[_-])(dev|development|test|local)($|[_-])/i;

// Lists the reasons a MongoDB URI is unsafe for production, so a production
// deployment cannot silently run against a local, dev, or test database or
// over an unencrypted connection. Returns an empty array when the URI is acceptable.
export function findProductionMongoUriProblems(uri: string): string[] {
  const match = MONGO_URI_PATTERN.exec(uri.trim());
  if (!match) return ['MONGODB_URI is not a valid mongodb:// or mongodb+srv:// connection string.'];

  const [, scheme, hostList, rawDatabase = '', query = ''] = match;
  const problems: string[] = [];
  const params = new URLSearchParams(query);
  const tlsOption = (params.get('tls') ?? params.get('ssl'))?.toLowerCase();
  const usesTls = scheme.toLowerCase() === 'mongodb+srv' ? tlsOption !== 'false' : tlsOption === 'true';
  if (!usesTls) problems.push('MONGODB_URI must use TLS in production (mongodb+srv:// or tls=true).');

  if (hostList.split(',').some((host) => LOCAL_HOST_PATTERN.test(host))) {
    problems.push('MONGODB_URI points at a local database host in production.');
  }

  const database = decodeURIComponent(rawDatabase);
  if (!database) {
    problems.push('MONGODB_URI must name the production database explicitly (for example /motorx).');
  } else if (NON_PRODUCTION_DB_PATTERN.test(database)) {
    problems.push(`MONGODB_URI database "${database}" looks like a development or test database.`);
  }

  return problems;
}
