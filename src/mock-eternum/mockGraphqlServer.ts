import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { addMocksToSchema } from "@graphql-tools/mock";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Get current file directory with Bun
const __dirname = dirname(fileURLToPath(import.meta.url));

// Read the schema file
const typeDefs = readFileSync(join(__dirname, "./schema.graphql"), {
  encoding: "utf-8",
});

// Define types for our realm data
interface RealmData {
  entity_id: number;
  realm_id: number;
  level: number;
  order: number;
  settler_address: string;
  has_wonder: boolean;
  produced_resources: string;
}

// Define type for our data store
type RealmDataStore = {
  [key: number]: RealmData;
};

// Define type for GraphQL connection
interface Connection<T> {
  edges: Array<{
    node: T;
  }>;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
  totalCount: number;
}

// Define type for where input
interface WhereInput {
  realm_id?: number;
  [key: string]: any;
}

const ResourceType = {
  WOOD: 1,
  STONE: 2,
  COAL: 3,
  COPPER: 4,
  OBSIDIAN: 5,
  SILVER: 6,
  IRONWOOD: 7,
  COLD_IRON: 8,
  GOLD: 9,
  HARTWOOD: 10,
  DIAMONDS: 11,
  SAPPHIRE: 12,
  RUBY: 13,
  DEEP_CRYSTAL: 14,
  IGNIUM: 15,
  ETHEREAL_SILICA: 16,
  TRUE_ICE: 17,
  TWILIGHT_QUARTZ: 18,
  ALCHEMICAL_SILVER: 19,
  ADAMANTINE: 20,
  MITHRAL: 21,
  DRAGONHIDE: 22,
} as const;

interface ResourceData {
  resource_type: number;
  balance: string; // Using string for u128
}

interface Order {
  order_id: number;
  hyperstructure_count: number;
}

const ORDERS_DATA = [
  {
    order_id: 1,
    hyperstructure_count: 3, // These are the actual fields in s0_eternum_Orders
  },
  {
    order_id: 2,
    hyperstructure_count: 5,
  },
];

const REALM_RESOURCES: { [key: number]: ResourceData[] } = {
  101: [
    { resource_type: ResourceType.WOOD, balance: "1000" },
    { resource_type: ResourceType.STONE, balance: "800" },
    { resource_type: ResourceType.COAL, balance: "500" },
    { resource_type: ResourceType.COPPER, balance: "300" },
    { resource_type: ResourceType.GOLD, balance: "100" },
  ],
  202: [
    { resource_type: ResourceType.WOOD, balance: "2000" },
    { resource_type: ResourceType.STONE, balance: "1500" },
    { resource_type: ResourceType.SILVER, balance: "750" },
    { resource_type: ResourceType.IRONWOOD, balance: "400" },
  ],
};

// Mock data store for specific realms
const REALM_DATA: RealmDataStore = {
  1: {
    entity_id: 101,
    realm_id: 1,
    level: 3,
    order: 1,
    settler_address: "0x123...abc",
    has_wonder: true,
    produced_resources: "1000",
  },
  2: {
    entity_id: 202,
    realm_id: 2,
    level: 5,
    order: 2,
    settler_address: "0x456...def",
    has_wonder: false,
    produced_resources: "2000",
  },
};

const resolvers = {
  World__Query: {
    s0EternumRealmModels: (
      _: any,
      { where }: { where?: { realm_id?: number } },
    ) => {
      if (where?.realm_id && REALM_DATA[where.realm_id]) {
        const realmData = REALM_DATA[where.realm_id];
        return {
          edges: [{ node: { __typename: "s0_eternum_Realm", ...realmData } }],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          totalCount: 1,
        };
      }
      return {
        edges: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      };
    },
    s0EternumResourceModels: (
      _: any,
      { where }: { where?: { entity_id?: number }; limit?: number },
    ) => {
      if (where?.entity_id && REALM_RESOURCES[where.entity_id]) {
        const resources = REALM_RESOURCES[where.entity_id];
        return {
          edges: resources.map((resource) => ({
            node: { __typename: "s0_eternum_Resource", ...resource },
          })),
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          totalCount: resources.length,
        };
      }
      return {
        edges: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      };
    },
    s0EternumOrdersModels: () => {
      return {
        edges: ORDERS_DATA.map((order) => ({
          node: {
            __typename: "s0_eternum_Orders",
            ...order,
          },
        })),
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: ORDERS_DATA.length,
      };
    },
  },
};

const mocks = {
  bool: () => false,
  u8: () => 0,
  u16: () => 0,
  u32: () => 0,
  u64: () => 0,
  u128: () => "0",
  u256: () => "0",
  felt252: () => "0",
  ContractAddress: () => "0x0",
  ByteArray: () => "",
  DateTime: () => new Date().toISOString(),
};

// Create and start the server
const schema = makeExecutableSchema({ typeDefs, resolvers });
const server = new ApolloServer({
  schema: addMocksToSchema({
    schema,
    mocks,
    preserveResolvers: true,
  }),
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀 Mock server ready at: ${url}`);
