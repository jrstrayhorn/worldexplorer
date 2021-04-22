import { Country, DataPoint } from 'src/domain';
import { PopulationService } from './population-service.intf';
import {
  WorldBankApiV2,
  WorldBankApiV2CountryResponse,
  worldBankApiV2CountryResponseValidator,
  WorldBankApiV2Formats,
  WorldBankApiV2Params,
  WorldBankApiV2Indicators,
  worldBankApiV2IndicatorResponseValidator,
  WorldBankApiV2IndicatorResponse,
} from './world-bank-api';

import { ThrowReporter } from 'io-ts/lib/ThrowReporter';
import { Utils } from 'src/common';

export class PopulationServiceImpl implements PopulationService {
  private readonly countriesApiBaseUrl: string;

  /**
   *
   */
  constructor(baseUrl: string) {
    if (Utils.isNullOrWhitespace(baseUrl)) {
      throw new Error('The base URL must be provided!');
    } else if (
      !baseUrl.toLocaleLowerCase().startsWith('https://') &&
      !baseUrl.toLocaleLowerCase().startsWith('http://')
    ) {
      throw new Error(
        "The URL looks invalid.  It should start with 'http://' or 'https://'"
      );
    }

    let cleanBaseUrl = baseUrl.trim();
    if (cleanBaseUrl.endsWith('/')) {
      cleanBaseUrl = cleanBaseUrl.substr(0, cleanBaseUrl.lastIndexOf('/'));
    }

    this.countriesApiBaseUrl = `${cleanBaseUrl}/${WorldBankApiV2.VERSION}/${WorldBankApiV2.COUNTRIES_API_PREFIX}`;
    console.log(
      `Population service init.\nCountries API URL: [${this.countriesApiBaseUrl}]`
    );
  }

  async getAllCountries(): Promise<Country[]> {
    const response: Response = await fetch(
      `${this.countriesApiBaseUrl}?${WorldBankApiV2Params.FORMAT}=${WorldBankApiV2Formats.JSON}&${WorldBankApiV2Params.PER_PAGE}=320`
    );

    const checkedResponse: Response = await this.checkResponseStatus(response);
    let jsonContent: unknown = await this.getJsonContent(checkedResponse);
    const validationResult = worldBankApiV2CountryResponseValidator.decode(
      jsonContent
    );
    // throw an error if validation fails
    ThrowReporter.report(validationResult);

    console.log('Response received and validated');
    // from here on, we know that the validation has passed
    const countries = (validationResult.value as WorldBankApiV2CountryResponse)[1];
    console.log(`Found ${countries.length} countries`);

    // don't need to use Promise.resolve since function is marked as async
    // returned value will be wrapped in Promise
    let retVal: Country[] = countries.map(
      (country) =>
        new Country(
          country.name,
          country.id,
          country.iso2Code,
          country.capitalCity,
          country.longitude,
          country.latitude
        )
    );
    return retVal;
  }
  async getCountry(countryCode: string): Promise<Country> {
    if (Utils.isNullOrWhitespace(countryCode)) {
      throw new Error('The country code must be provided!');
    }

    const response: Response = await fetch(
      `${this.countriesApiBaseUrl}/${countryCode}?${WorldBankApiV2Params.FORMAT}=${WorldBankApiV2Formats.JSON}`
    );

    const checkedResponse: Response = await this.checkResponseStatus(response);
    let jsonContent: unknown = await this.getJsonContent(checkedResponse);

    const validationResult = worldBankApiV2CountryResponseValidator.decode(
      jsonContent
    );
    ThrowReporter.report(validationResult);

    const countries = (validationResult.value as WorldBankApiV2CountryResponse)[1];

    if (countries.length > 1) {
      return Promise.reject(
        'More than one country was returned. This should not happen'
      );
    }

    const country = countries[0];

    return new Country(
      country.name,
      country.id,
      country.iso2Code,
      country.capitalCity,
      country.longitude,
      country.latitude
    );
  }

  getIndicatorDataPoints<T extends WorldBankApiV2Indicators>(
    indicator: T,
    country: Country,
    dateRange: string
  ): Promise<DataPoint[]> {
    return this.getIndicatorData(indicator, country, dateRange, 1000);
  }

  async getTotalPopulation(
    country: Country,
    dateRange: string
  ): Promise<DataPoint[]> {
    const response: Response = await fetch(
      `${this.getBaseIndicatorApiUrlFor(
        WorldBankApiV2Indicators.TOTAL_POPULATION,
        country
      )}?${WorldBankApiV2Params.FORMAT}=${WorldBankApiV2Formats.JSON}&${
        WorldBankApiV2Params.PER_PAGE
      }=1000&${WorldBankApiV2Params.DATE}=${dateRange}`
    );

    const checkedResponse: Response = await this.checkResponseStatus(response);
    let jsonContent: unknown = await this.getJsonContent(checkedResponse);

    const validationResult = worldBankApiV2IndicatorResponseValidator.decode(
      jsonContent
    );
    ThrowReporter.report(validationResult);

    const dataPoints = (validationResult.value as WorldBankApiV2IndicatorResponse)[1];

    const retVal = dataPoints
      ? dataPoints
          .filter((dataPoint) => dataPoint.value)
          .map(
            (dataPoint) =>
              new DataPoint(dataPoint.date, dataPoint.value as number)
          )
      : [];
    return retVal;
  }
  async getMalePopulation(
    country: Country,
    dateRange: string
  ): Promise<DataPoint[]> {
    return this.getIndicatorData(
      WorldBankApiV2Indicators.TOTAL_MALE_POPULATION,
      country,
      dateRange,
      1000
    );
  }
  async getFemalePopulation(
    country: Country,
    dateRange: string
  ): Promise<DataPoint[]> {
    return this.getIndicatorData(
      WorldBankApiV2Indicators.TOTAL_FEMALE_POPULATION,
      country,
      dateRange,
      1000
    );
  }
  async getLifeExpectancy(
    country: Country,
    dateRange: string
  ): Promise<DataPoint[]> {
    return this.getIndicatorData(
      WorldBankApiV2Indicators.LIFE_EXPECTANCY,
      country,
      dateRange,
      1000
    );
  }
  async getAdultMaleLiteracy(
    country: Country,
    dateRange: string
  ): Promise<DataPoint[]> {
    return this.getIndicatorData(
      WorldBankApiV2Indicators.ADULT_MALE_LITERACY,
      country,
      dateRange,
      1000
    );
  }
  async getAdultFemaleLiteracy(
    country: Country,
    dateRange: string
  ): Promise<DataPoint[]> {
    return this.getIndicatorData(
      WorldBankApiV2Indicators.ADULT_FEMALE_LITERACY,
      country,
      dateRange,
      1000
    );
  }
  async getMaleSurvivalToAge65(
    country: Country,
    dateRange: string
  ): Promise<DataPoint[]> {
    return this.getIndicatorData(
      WorldBankApiV2Indicators.ADULT_MALE_SURVIVAL_TO_65,
      country,
      dateRange,
      1000
    );
  }
  async getFemaleSurvivalToAge65(
    country: Country,
    dateRange: string
  ): Promise<DataPoint[]> {
    return this.getIndicatorData(
      WorldBankApiV2Indicators.ADULT_FEMALE_SURVIVAL_TO_65,
      country,
      dateRange,
      1000
    );
  }

  private async checkResponseStatus(response: Response): Promise<Response> {
    if (!response) {
      throw new Error('A response must be provided!');
    }

    if (response.status >= 200 && response.status < 300) {
      return Promise.resolve(response);
    } else {
      return Promise.reject(new Error(response.statusText));
    }
  }

  private async getJsonContent(response: Response): Promise<unknown> {
    if (!response) {
      throw new Error('A response must be provided!');
    }

    let jsonContent: unknown = undefined;
    try {
      jsonContent = await response.json();
    } catch (error) {
      console.error('Failed to parse the response as JSON: ', error);
      // can also use Promise.reject(...) to return custom error message back
      throw new Error(
        `Could not parse the response body as JSON. Error: ${error.message}`
      );
    }
    return jsonContent;
  }

  private getBaseIndicatorApiUrlFor(
    indicator: WorldBankApiV2Indicators,
    country?: Country
  ) {
    const countryCode = country?.id ?? 'all';
    return `${this.countriesApiBaseUrl}/${countryCode}${WorldBankApiV2.INDICATORS_API_PREFIX}/${indicator}`;
  }

  private async getIndicatorData(
    indicator: WorldBankApiV2Indicators,
    country: Country,
    dateRange: string,
    perPage: number
  ): Promise<DataPoint[]> {
    const response: Response = await fetch(
      `${this.getBaseIndicatorApiUrlFor(indicator, country)}?${
        WorldBankApiV2Params.FORMAT
      }=${WorldBankApiV2Formats.JSON}&${
        WorldBankApiV2Params.PER_PAGE
      }=${perPage}&${WorldBankApiV2Params.DATE}=${dateRange}`
    );
    const checkedResponse: Response = await this.checkResponseStatus(response);
    let jsonContent: unknown = await this.getJsonContent(checkedResponse);
    const validationResult = worldBankApiV2IndicatorResponseValidator.decode(
      jsonContent
    );
    ThrowReporter.report(validationResult);

    const dataPoints = (validationResult.value as WorldBankApiV2IndicatorResponse)[1];

    const retVal = dataPoints
      ? dataPoints
          .filter((dataPoint) => dataPoint.value)
          .map(
            (dataPoint) =>
              new DataPoint(dataPoint.date, dataPoint.value as number)
          )
      : [];
    return retVal;
  }
}
