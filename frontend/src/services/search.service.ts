import Typesense from 'typesense';

const client = new Typesense.Client({
  nodes: [{
    host: import.meta.env.VITE_TYPESENSE_HOST || 'localhost',
    port: 8108,
    protocol: 'http'
  }],
  apiKey: import.meta.env.VITE_TYPESENSE_SEARCH_KEY || 'xyz',
  connectionTimeoutSeconds: 2
});

export const SearchService = {
  search: async (
    collection: string,
    query: string,
    queryBy: string,
    extraParams: Record<string, any> = {}
  ) => {
    const searchParameters = {
      q: query,
      query_by: queryBy,
      ...extraParams,
    };
    return await client.collections(collection).documents().search(searchParameters);
  },
};
