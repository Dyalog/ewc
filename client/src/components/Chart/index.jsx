import { useAppData } from '../../hooks';
import { parseFlexStyles, setStyle } from '../../utils';
import { useRef } from 'react';

let apexAvailable = false;
let ReactApexChart;

try {
  ({ default: ReactApexChart } = await import('react-apexcharts'));
  apexAvailable = true;
} catch {
  // ApexCharts not installed
}

const Chart = ({ data }) => {
  if (!apexAvailable) {
    throw new Error("Chart requires react-apexcharts package to be installed");
  }

  const { Options, Posn, Series, Size, ChartType, Event, CSS } = data?.Properties;

  const { socket } = useAppData();
  const customStyles = parseFlexStyles(CSS)
  const styles = setStyle(data?.Properties);

  const stringifyCircularJSON = (obj) => {
    const seen = new WeakSet();
    return JSON.stringify(obj, (k, v) => {
      if (v !== null && typeof v === 'object') {
        if (seen.has(v)) return;
        seen.add(v);
      }
      return v;
    });
  };

  const chartRef = useRef(null);

  // ⎕WG of the Dynamic property SVG serialises the rendered chart straight
  // from the DOM (see the ApexChart branch of the WG handler in App.jsx), so
  // it is always current. chart.paper() no longer exists in apexcharts 5,
  // which is what the previous publish-after-mount here relied on.


  const sendEvent = (event, chartContext, config, chartConfig) => {
    // ApexCharts reports indices as strings for some click targets; APL
    // arithmetic wants numbers. -1 is ApexCharts' own "no datapoint".
    const num = (v) => (v == null || v === '' || isNaN(v) ? -1 : Number(v));
    const obj = {
      dataPointIndex: num(chartConfig?.dataPointIndex),
      seriesIndex: num(chartConfig?.seriesIndex),
      series: chartConfig?.config?.series,
      xaxis: chartConfig?.config?.xaxis,
      yaxis: chartConfig?.config?.yaxis,
    };

    const Event = JSON.stringify({
      Event: {
        ID: data?.ID,
        EventName: event,
        // Info: [stringifyCircularJSON(chartContext), stringifyCircularJSON(config)],
        Info: [JSON.stringify(obj)],
      },
    });
//     console.log(Event);
    socket.send(Event);
  };

  // const options = {
  //   chart: {
  //     parentHeightOffset: 0,
  //     toolbar: { show: false },
  //   },
  //   plotOptions: {
  //     bar: {
  //       borderRadius: 6,
  //       borderRadiusApplication: 'end',
  //       distributed: true,
  //       columnWidth: '35%',
  //       startingShape: 'rounded',
  //       dataLabels: { position: 'top' },
  //     },
  //   },
  //   legend: { show: false },
  //   tooltip: { enabled: false },
  //   dataLabels: {
  //     offsetY: -15,
  //     // formatter: (val) => `${val}k`,
  //     style: {
  //       fontWeight: 600,
  //       fontSize: '1rem',
  //       colors: ['#4b465c'],
  //     },
  //   },
  //   grid: {
  //     show: false,
  //   },
  //   xaxis: {
  //     axisTicks: { show: false },
  //     axisBorder: {
  //       color: 'gray',
  //     },
  //     categories: Options?.xaxis.categories,
  //     labels: {
  //       style: {
  //         fontSize: '13px',
  //         colors: [1, 2].map(() => 'red'),
  //         fontWeight: 400,
  //         fontFamily: 'Poppins',
  //       },
  //     },
  //   },
  //   yaxis: {
  //     min: Options?.yMin,
  //     max: Options?.yMax,
  //     tickAmount: Options?.Intervals,
  //     labels: {
  //       offsetX: -15,
  //       style: {
  //         fontSize: '13px',
  //         fontWeight: 400,
  //         colors: ['#22292f80'],
  //         fontFamily: 'Poppins',
  //       },
  //     },
  //   },
  //   responsive: [
  //     {
  //       options: {
  //         plotOptions: {
  //           bar: { columnWidth: '60%' },
  //         },
  //         grid: {
  //           padding: { right: 20 },
  //         },
  //       },
  //     },
  //   ],
  // };

//   console.log("chart",chartSvg)
  // console.log("chart", data)


  // const getCurve = {
  //   bar: "straight",
  //   MOVAVG:"straight",
  // }



  const options = {
    ...Options,
    chart: {
      // ...Options?.chart so an application's chart options (animations,
      // type) survive the event wiring
      ...Options?.chart,
      events: {
        ...(Event?.some((item) => item[0] === 'click') && {
          click: (chartContext, config, chartConfig) =>
            sendEvent('click', chartContext, config, chartConfig),
        }),
        ...(Event?.some((item) => item[0] === 'legendclick') && {
          legendClick: (chartContext, config, chartConfig) =>
            sendEvent('legendclick', chartContext, config, chartConfig),
        }),
      },
    },
    // stroke: { curve: 'smooth'}
  };

  return (
    <div
      id={data.ID}
      style={{
        position: "absolute",
        top: Posn && Posn[0],
        left: Posn && Posn[1],
        ...styles,
        ...customStyles,
      }}
    >
      <ReactApexChart
        // Changing type on a live ApexCharts instance crashes inside its
        // update path; keying by type remounts instead.
        key={ChartType || 'line'}
        ref={chartRef}
        options={options}
        width={Size && Size[1]}
        height={Size && Size[0]}
        type={ChartType}
        series={Series}
      />
    </div>
  );
};

export default Chart;
