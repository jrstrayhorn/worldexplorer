import { number } from 'io-ts';
import { PopulationService, WorldBankApiV2Indicators } from 'services';
import { UnreachableCaseError } from 'src/common';
import { Country, DataPoint } from 'src/domain';
import { ChartDetails, WorldExplorerView } from 'src/views';
import { WorldExplorerController } from './world-explorer-controller.intf';

export class WorldExplorerControllerImpl implements WorldExplorerController {
  private readonly _view: WorldExplorerView;
  private readonly _populationService: PopulationService;

  private readonly _countriesMap: Map<string, Country> = new Map<
    string,
    Country
  >();

  /**
   *
   */
  constructor(populationService: PopulationService, view: WorldExplorerView) {
    if (!populationService) {
      throw new Error('The population service is mandatory!');
    }
    if (!view) {
      throw new Error('The view is mandatory!');
    }
    this._populationService = populationService;
    this._view = view;

    this.loadYears();
    this.loadCountries()
      .then(() => console.log('WorldExplorer - Loaded', this))
      .catch((error) => {
        console.error(
          'WorldExplorer - Controller failed ot load. Error: ',
          error
        );
        this._view.displayErrorMessage(
          'WorldExplorer failed to load.  Please contact IT support! ;-)'
        );
      });
  }
  async loadCountries(): Promise<void> {
    console.log('Loading the countries');
    try {
      const countries = await this._populationService.getAllCountries();
      countries.forEach((country) => {
        this._countriesMap.set(country.id, country);
      });
      this._view.displayCountries(countries);
    } catch (error) {
      console.error('Could not load the list of countries! Error: ', error);
      this._view.displayErrorMessage(
        'Could not load the list of countries!  Are you connect to the Internet?'
      );
    }
  }
  loadYears(): void {
    console.log('Loading the years');
    const retVal: number[] = [];
    const yearGenerator = this.generateYears(2000, 20);

    let done: boolean = false;
    while (!done) {
      const res = yearGenerator.next();
      done = res.done as boolean;
      if (done) {
        break;
      } else {
        retVal.push(res.value);
      }
    }
    this._view.displayYears(retVal);
  }
  async renderChart(): Promise<void> {
    console.log('Rending the chart');
    const chartFormDetails = this._view.getChartFormDetails();

    if (chartFormDetails.error) {
      console.error(
        'Failed to retrieve the chart details',
        chartFormDetails.error
      );
      return;
    }

    if (
      !chartFormDetails.countryId ||
      !chartFormDetails.indicator ||
      !chartFormDetails.fromYear ||
      !chartFormDetails.toYear ||
      !chartFormDetails.chartType
    ) {
      throw new Error("The chart details couldn't be retrieved from the view!");
    }

    let country: Country;
    if (this._countriesMap.has(chartFormDetails.countryId)) {
      country = this._countriesMap.get(chartFormDetails.countryId) as Country;
    } else {
      console.error(
        'Tried to redner a chart for an unknown country. Identifier: ',
        chartFormDetails.countryId
      );
      this._view.displayErrorMessage('Failed to render the chart!');
      return;
    }

    const indicator: WorldBankApiV2Indicators =
      WorldBankApiV2Indicators[
        chartFormDetails.indicator as keyof typeof WorldBankApiV2Indicators
      ];

    if (!indicator) {
      console.error(
        'Tried to render a chart for an unknown indicator. Identifier: ',
        chartFormDetails.indicator
      );
      this._view.displayErrorMessage('Failed to render the chart!');
      return;
    }

    if (chartFormDetails.fromYear > chartFormDetails.toYear) {
      console.error(
        `Tried to render a chart for an invalid date range: from [${chartFormDetails.fromYear}] to [${chartFormDetails.toYear}]`
      );
      this._view.displayErrorMessage(
        'The start year cannot be after the end year'
      );
      return;
    }

    // should move this logic to its own specific data type
    let dateRange: string = `${chartFormDetails.fromYear}`;
    if (chartFormDetails.fromYear !== chartFormDetails.toYear) {
      dateRange = `${chartFormDetails.fromYear}:${chartFormDetails.toYear}`;
    }

    let chartType: string = chartFormDetails.chartType;
    // we could check that the chartType exists in typings of Chart.js

    try {
      let title = '';
      let xAxisLabel = '';
      let yAxisLabel = '';
      let data: DataPoint[] = [];

      data = await this._populationService.getIndicatorDataPoints<
        typeof indicator
      >(indicator, country, dateRange);
      title = this.getIndicatorTitle(indicator);

      const dataLabel = `${title} in ${country.name} for the ${chartFormDetails.fromYear}-${chartFormDetails.toYear} time period`;
      const chartDetails: ChartDetails = {
        chartType,
        data: data.reverse(), // put the oldest data first
        dataLabel,
        title,
        xAxisLabel,
        yAxisLabel,
      };

      this._view.displayChart(chartDetails);
    } catch (error) {
      console.error('Failed to render the chart. Error: ', error);
      this._view.displayErrorMessage('Failed to render the chart!');
      return;
    }
  }

  private getIndicatorTitle(indicator: WorldBankApiV2Indicators): string {
    let title = '';
    switch (indicator) {
      case WorldBankApiV2Indicators.TOTAL_POPULATION:
        title = 'Total population';
        break;
      case WorldBankApiV2Indicators.TOTAL_MALE_POPULATION:
        title = 'Total male population';
        break;
      case WorldBankApiV2Indicators.TOTAL_FEMALE_POPULATION:
        title = 'Total female population';
        break;
      case WorldBankApiV2Indicators.ADULT_MALE_LITERACY:
        title = 'Adult male literacy';
        break;
      case WorldBankApiV2Indicators.ADULT_FEMALE_LITERACY:
        title = 'Adult female literacy';
        break;
      case WorldBankApiV2Indicators.LIFE_EXPECTANCY:
        title = 'Life expectancy';
        break;
      case WorldBankApiV2Indicators.ADULT_MALE_SURVIVAL_TO_65:
        title = 'Adult male survival to 65';
        break;
      case WorldBankApiV2Indicators.ADULT_FEMALE_SURVIVAL_TO_65:
        title = 'Adult female survival to 65';
        break;

      default:
        throw new UnreachableCaseError(indicator); // should never get here if so something is wrong!
    }
    return title;
  }

  // * indicates that this is a generator function
  private *generateYears(
    startingYear: number,
    numberOfYears: number
  ): IterableIterator<number> {
    // Iterable element w/ .next() / .value, .done properties
    let currentYear = startingYear;
    while (currentYear < startingYear + numberOfYears) {
      yield currentYear;
      currentYear++;
    }
  }
}
