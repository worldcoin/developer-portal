import { fromContainerMetadata } from "@aws-sdk/credential-providers";
import { Client, type API } from "@opensearch-project/opensearch";
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws-v3";
import { logger } from "./logger";

/**
 * Client for the OpenSearch operations.
 */
export class OpenSearchClient {
  private client: Client;
  private indexName: string;

  /**
   * Constructor for the OpenSearch client.
   * @param url The URL of the OpenSearch endpoint.
   * @param indexName The name of the OpenSearch index.
   */
  constructor(params: { url: string; indexName: string }) {
    this.indexName = params.indexName;
    const isLocalHost = params.url.includes("localhost");

    if (isLocalHost) {
      this.client = new Client({
        node: params.url,
      });
    } else {
      this.client = new Client({
        ...AwsSigv4Signer({
          region: process.env.AWS_REGION_NAME || "eu-west-1",
          service: "es",
          getCredentials: () => {
            const credentialsProvider = fromContainerMetadata();
            return credentialsProvider();
          },
        }),
        node: params.url,
      });
    }
  }

  /**
   * Get the index template for the OpenSearch index.
   * @param indexName The name of the index.
   * @returns The index template.
   */
  private getIndexTemplate(indexName: string) {
    return {
      index_patterns: [indexName],
      template: {
        settings: {
          index: {
            number_of_replicas: 1,
          },
        },
      },
      mappings: {
        properties: {
          id: {
            type: "keyword",
          },
          name: {
            type: "text",
          },
          app_id: {
            type: "keyword",
          },
          verification_status: {
            type: "keyword",
          },
          is_reviewer_world_app_approved: {
            type: "boolean",
          },
        },
      },
    };
  }

  /**
   * Create the OpenSearch index if it doesn't exist.
   */
  public async createIndexIfNotExists() {
    try {
      const indexExists = await this.client.indices.exists({
        index: this.indexName,
      });

      if (!indexExists.body) {
        logger.info(`Creating index template for ${this.indexName}`);
        const indexTemplateResponse =
          await this.client.indices.putIndexTemplate({
            name: `${this.indexName}_template`,
            body: this.getIndexTemplate(this.indexName),
          });
        if (!indexTemplateResponse.body.acknowledged) {
          logger.error(`Failed to create index template for ${this.indexName}`);
          throw new Error(
            `Failed to create index template for ${this.indexName}`,
          );
        }
        logger.info(`Index template created for ${this.indexName}`);

        logger.info(`Creating index ${this.indexName}`);
        const indexResponse = await this.client.indices.create({
          index: this.indexName,
        });
        if (!indexResponse.body.acknowledged) {
          logger.error(`Failed to create index ${this.indexName}`);
          throw new Error(`Failed to create index ${this.indexName}`);
        }
        logger.info(`Index created for ${this.indexName}`);
      } else {
        logger.info(`Index ${this.indexName} already exists`);
      }
    } catch (error) {
      logger.error(`Error creating index ${this.indexName}: ${error}`);
    }
  }

  /**
   * Search for apps in the OpenSearch index.
   * @param searchTerm The search term to search for.
   * @param verificationStatus The verification status to filter by.
   * @param isReviewerWorldAppApproved Whether the app is approved by the reviewer.
   * @returns The app IDs of the apps that match the search criteria.
   */
  public async searchApps(
    searchTerm: string,
    verificationStatus?: string,
    isReviewerWorldAppApproved?: boolean,
  ): Promise<string[]> {
    const must = [];

    // Add filters to the query if they are provided
    if (verificationStatus) {
      must.push({
        match: {
          verification_status: verificationStatus,
        },
      });
    }

    if (isReviewerWorldAppApproved) {
      must.push({
        match: {
          is_reviewer_world_app_approved: isReviewerWorldAppApproved,
        },
      });
    }

    // Search for apps in the OpenSearch index using
    // the fuzzy search and prefix search
    const query: API.Search_RequestBody = {
      query: {
        bool: {
          should: [
            {
              match: {
                name: {
                  query: searchTerm,
                  fuzziness: "AUTO",
                  prefix_length: 1,
                },
              },
            },
            {
              prefix: {
                name: {
                  value: searchTerm,
                  boost: 2,
                },
              },
            },
          ],
          must,
        },
      },
      sort: ["_score"],
    };

    try {
      const response = await this.client.search({
        index: this.indexName,
        body: query,
      });

      return response.body.hits.hits.map((hit) => hit._source?.app_id);
    } catch (error) {
      logger.error(`Error searching for apps in ${this.indexName}: ${error}`);
      return [];
    }
  }
}
