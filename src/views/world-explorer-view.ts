import { Country } from 'src/domain';
import { ChartDetails } from './chart-details.intf';
import { WorldExplorerView } from './world-explorer-view.intf';

export class WorldExplorerHTMLView implements WorldExplorerView {
  private readonly _countrySelect: HTMLSelectElement;
  private readonly _indicatorSelect: HTMLSelectElement;
  private readonly _fromYearSelect: HTMLSelectElement;
  private readonly _toYearSelect: HTMLSelectElement;
  private readonly _chartTypeSelect: HTMLSelectElement;
  private readonly _chartConfigurationForm: HTMLFormElement;

  constructor() {
    this._countrySelect = this.getHTMLElementById<HTMLSelectElement>(
      'countrySelect'
    );
    this._indicatorSelect = this.getHTMLElementById<HTMLSelectElement>(
      'indicatorSelect'
    );
    this._fromYearSelect = this.getHTMLElementById<HTMLSelectElement>(
      'fromYearSelect'
    );
    this._toYearSelect = this.getHTMLElementById<HTMLSelectElement>(
      'toYearSelect'
    );
    this._chartTypeSelect = this.getHTMLElementById<HTMLSelectElement>(
      'chartTypeSelect'
    );
    this._chartConfigurationForm = this.getHTMLElementById<HTMLFormElement>(
      'chartConfigurationForm'
    );
  }
  displayErrorMessage(message: string): void {
    throw new Error('Method not implemented.');
  }
  displayCountries(countries: Country[]): void {
    throw new Error('Method not implemented.');
  }
  displayYears(years: number[]): void {
    throw new Error('Method not implemented.');
  }
  getChartFormDetails(): {
    error?: string | undefined;
    countryId?: string | undefined;
    indicator?: string | undefined;
    fromYear?: number | undefined;
    toYear?: number | undefined;
    chartType?: string | undefined;
  } {
    throw new Error('Method not implemented.');
  }
  displayChart(chartDetails: ChartDetails): void {
    throw new Error('Method not implemented.');
  }

  private getHTMLElementById<T extends HTMLElement>(id: string): T {
    if (!id) {
      throw new Error(
        `Could not initialize the view. The '${id}' element id was not found. Was the template changed?`
      );
    }

    return document.getElementById(id) as T;
  }
}
