import { DataPoint } from 'src/domain';

export interface ChartDetails {
  chartType: string;
  data: DataPoint[];
  dataLabel: string;
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
}
