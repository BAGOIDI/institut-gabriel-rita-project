import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import 'echarts/extension/bmap/bmap';

interface MapChartProps {
  style?: React.CSSProperties;
}

export const MapChart: React.FC<MapChartProps> = ({ style }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      // Initialize the chart
      chartInstance.current = echarts.init(chartRef.current);

      // Register the Cameroon geojson data
      fetch('/geojson/cameroon.json')
        .then(response => response.json())
        .then(geoJson => {
          echarts.registerMap('Cameroon', geoJson);

          // Define coordinates for Douala city center and surrounding areas
          const doualaData = [
            { name: 'Douala Centre', value: [9.7406, 4.0292, 100] },
            { name: 'Bonanjo', value: [9.6667, 4.0833, 80] },
            { name: 'Akwa', value: [9.7000, 4.0667, 70] },
            { name: 'Makepe', value: [9.7333, 4.0333, 60] },
            { name: 'Ndogpassi', value: [9.7500, 4.0167, 50] },
            { name: 'Melen', value: [9.7833, 4.0000, 40] },
            { name: 'Oyomabesseng', value: [9.7167, 4.0833, 30] },
            { name: 'Cité Verte', value: [9.7667, 4.0333, 20] },
            { name: 'Deido', value: [9.7000, 4.0500, 35] },
            { name: 'Bepanda', value: [9.7500, 4.0500, 25] },
          ];

          // Prepare option for the map chart
          const option: echarts.EChartsOption = {
            title: {
              text: 'Carte de Douala, Cameroun',
              left: 'center',
              textStyle: {
                fontSize: 16,
                fontWeight: 'bold'
              }
            },
            tooltip: {
              trigger: 'item',
              formatter: function(params: any) {
                if (params.data) {
                  return `${params.data.name}<br/>Valeur: ${params.data.value[2]}`;
                }
                return '';
              }
            },
            geo: {
              map: 'Cameroon',
              roam: true,
              zoom: 2.5,
              center: [9.7406, 4.0292], // Center on Douala
              scaleLimit: {
                min: 1,
                max: 10
              },
              itemStyle: {
                borderColor: '#aaa',
                borderWidth: 0.5
              },
              emphasis: {
                itemStyle: {
                  areaColor: '#e3f2fd'
                }
              }
            },
            series: [
              {
                name: 'Douala Locations',
                type: 'effectScatter',
                coordinateSystem: 'geo',
                data: doualaData,
                symbolSize: function(val: any) {
                  return val[2] / 10; // Adjust size based on value
                },
                showEffectOn: 'render',
                rippleEffect: {
                  brushType: 'stroke'
                },
                label: {
                  formatter: '{b}',
                  position: 'right',
                  show: true
                },
                itemStyle: {
                  color: '#1976d2',
                  borderColor: '#fff',
                  borderWidth: 1
                },
                emphasis: {
                  label: {
                    show: true
                  }
                },
                zlevel: 1
              }
            ]
          };

          // Set the option to the chart
          chartInstance.current.setOption(option);
        })
        .catch(error => {
          console.error('Error loading Cameroon geojson:', error);

          // Fallback: Define coordinates for Douala city center and surrounding areas
          const doualaData = [
            { name: 'Douala Centre', value: [9.7406, 4.0292, 100] },
            { name: 'Bonanjo', value: [9.6667, 4.0833, 80] },
            { name: 'Akwa', value: [9.7000, 4.0667, 70] },
            { name: 'Makepe', value: [9.7333, 4.0333, 60] },
            { name: 'Ndogpassi', value: [9.7500, 4.0167, 50] },
            { name: 'Melen', value: [9.7833, 4.0000, 40] },
            { name: 'Oyomabesseng', value: [9.7167, 4.0833, 30] },
            { name: 'Cité Verte', value: [9.7667, 4.0333, 20] },
            { name: 'Deido', value: [9.7000, 4.0500, 35] },
            { name: 'Bepanda', value: [9.7500, 4.0500, 25] },
          ];

          // Prepare option for the map chart without geojson
          const option: echarts.EChartsOption = {
            title: {
              text: 'Carte de Douala, Cameroun',
              left: 'center',
              textStyle: {
                fontSize: 16,
                fontWeight: 'bold'
              }
            },
            tooltip: {
              trigger: 'item',
              formatter: function(params: any) {
                if (params.data) {
                  return `${params.data.name}<br/>Valeur: ${params.data.value[2]}`;
                }
                return '';
              }
            },
            geo: {
              map: '',
              roam: true,
              zoom: 2.5,
              center: [9.7406, 4.0292], // Center on Douala
              scaleLimit: {
                min: 1,
                max: 10
              },
              silent: true,
              itemStyle: {
                borderColor: '#aaa',
                borderWidth: 0.5
              },
              emphasis: {
                itemStyle: {
                  areaColor: '#e3f2fd'
                }
              }
            },
            series: [
              {
                name: 'Douala Locations',
                type: 'effectScatter',
                coordinateSystem: 'geo',
                data: doualaData,
                symbolSize: function(val: any) {
                  return val[2] / 10; // Adjust size based on value
                },
                showEffectOn: 'render',
                rippleEffect: {
                  brushType: 'stroke'
                },
                label: {
                  formatter: '{b}',
                  position: 'right',
                  show: true
                },
                itemStyle: {
                  color: '#1976d2',
                  borderColor: '#fff',
                  borderWidth: 1
                },
                emphasis: {
                  label: {
                    show: true
                  }
                },
                zlevel: 1
              }
            ]
          };

          // Set the option to the chart
          chartInstance.current.setOption(option);
        });

      // Handle window resize
      const handleResize = () => {
        if (chartInstance.current) {
          chartInstance.current.resize();
        }
      };

      window.addEventListener('resize', handleResize);

      // Cleanup function
      return () => {
        if (chartInstance.current) {
          chartInstance.current.dispose();
        }
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  return <div ref={chartRef} style={{ width: '100%', height: '400px', ...style }} />;
};