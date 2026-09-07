import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WeatherDashboard } from '@/components/weather-dashboard';

const mockWeatherData = {
  current: {
    temperature: 28,
    feelsLike: 30,
    humidity: 65,
    windSpeed: 10,
    windDirection: 180,
    description: 'Partly cloudy',
    icon: 'partly-cloudy',
    uvIndex: 7,
    visibility: 10,
    pressure: 1013,
    dewPoint: 20,
    precipitationProbability: 20,
  },
  forecast: [
    {
      date: '2024-07-15',
      temperature: 28,
      temperatureMin: 22,
      temperatureMax: 34,
      humidity: 65,
      rainfall: 0,
      windSpeed: 10,
      description: 'Partly cloudy',
      icon: 'partly-cloudy',
      precipitationProbability: 20,
    },
    {
      date: '2024-07-16',
      temperature: 30,
      temperatureMin: 24,
      temperatureMax: 36,
      humidity: 60,
      rainfall: 0,
      windSpeed: 12,
      description: 'Sunny',
      icon: 'sun',
      precipitationProbability: 10,
    },
    {
      date: '2024-07-17',
      temperature: 26,
      temperatureMin: 20,
      temperatureMax: 32,
      humidity: 75,
      rainfall: 5,
      windSpeed: 8,
      description: 'Light rain',
      icon: 'rain',
      precipitationProbability: 70,
    },
  ],
  alerts: [
    {
      id: 'alert-1',
      type: 'HEAT_WAVE',
      severity: 'high',
      title: 'Heat Wave Warning',
      description: 'Temperatures expected to exceed 40°C',
      startDate: '2024-07-15',
      endDate: '2024-07-17',
      recommendations: ['Increase irrigation', 'Provide shade'],
    },
  ],
  agricultural: {
    evapotranspiration: 5.2,
    frostRisk: 'none',
    heatStress: 'moderate',
    irrigationNeed: 'high',
    growingDegreeDays: 1250,
  },
};

describe('WeatherDashboard', () => {
  const defaultProps = {
    farmId: 'farm-1',
    weatherData: mockWeatherData,
    loading: false,
    onRefresh: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render current weather information', () => {
    render(<WeatherDashboard {...defaultProps} />);

    expect(screen.getByText('28°C')).toBeInTheDocument();
    expect(screen.getByText('Partly cloudy')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(screen.getByText('10 km/h')).toBeInTheDocument();
  });

  it('should render weather forecast', () => {
    render(<WeatherDashboard {...defaultProps} />);

    expect(screen.getByText('3-Day Forecast')).toBeInTheDocument();
    expect(screen.getByText('28°')).toBeInTheDocument();
    expect(screen.getByText('30°')).toBeInTheDocument();
    expect(screen.getByText('26°')).toBeInTheDocument();
  });

  it('should render weather alerts', () => {
    render(<WeatherDashboard {...defaultProps} />);

    expect(screen.getByText('Heat Wave Warning')).toBeInTheDocument();
    expect(screen.getByText('Temperatures expected to exceed 40°C')).toBeInTheDocument();
  });

  it('should render agricultural metrics', () => {
    render(<WeatherDashboard {...defaultProps} />);

    expect(screen.getByText('Agricultural Metrics')).toBeInTheDocument();
    expect(screen.getByText('5.2 mm/day')).toBeInTheDocument();
    expect(screen.getByText('Moderate')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<WeatherDashboard {...defaultProps} loading={true} />);

    expect(screen.getByText('Loading weather data...')).toBeInTheDocument();
  });

  it('should show error state', () => {
    render(
      <WeatherDashboard
        {...defaultProps}
        error="Failed to fetch weather data"
      />
    );

    expect(screen.getByText('Failed to fetch weather data')).toBeInTheDocument();
  });

  it('should call onRefresh when refresh button clicked', () => {
    render(<WeatherDashboard {...defaultProps} />);

    fireEvent.click(screen.getByText('Refresh'));
    expect(defaultProps.onRefresh).toHaveBeenCalled();
  });

  it('should toggle temperature unit', () => {
    render(<WeatherDashboard {...defaultProps} />);

    expect(screen.getByText('28°C')).toBeInTheDocument();

    fireEvent.click(screen.getByText('°F'));
    expect(screen.getByText('82°F')).toBeInTheDocument();
  });

  it('should toggle wind speed unit', () => {
    render(<WeatherDashboard {...defaultProps} />);

    expect(screen.getByText('10 km/h')).toBeInTheDocument();

    fireEvent.click(screen.getByText('mph'));
    expect(screen.getByText('6.2 mph')).toBeInTheDocument();
  });

  it('should display UV index with color coding', () => {
    render(<WeatherDashboard {...defaultProps} />);

    expect(screen.getByText('UV Index: 7')).toBeInTheDocument();
  });

  it('should display humidity with icon', () => {
    render(<WeatherDashboard {...defaultProps} />);

    expect(screen.getByText('Humidity')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  it('should display wind information', () => {
    render(<WeatherDashboard {...defaultProps} />);

    expect(screen.getByText('Wind')).toBeInTheDocument();
    expect(screen.getByText('10 km/h')).toBeInTheDocument();
  });

  it('should display sunrise and sunset times', () => {
    const dataWithSunTimes = {
      ...mockWeatherData,
      current: {
        ...mockWeatherData.current,
        sunrise: '06:00',
        sunset: '20:00',
      },
    };

    render(<WeatherDashboard {...defaultProps} weatherData={dataWithSunTimes} />);

    expect(screen.getByText('06:00')).toBeInTheDocument();
    expect(screen.getByText('20:00')).toBeInTheDocument();
  });

  it('should display precipitation probability', () => {
    render(<WeatherDashboard {...defaultProps} />);

    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  it('should display feels like temperature', () => {
    render(<WeatherDashboard {...defaultProps} />);

    expect(screen.getByText('Feels like 30°C')).toBeInTheDocument();
  });

  it('should render hourly forecast section', () => {
    render(<WeatherDashboard {...defaultProps} showHourly={true} />);

    expect(screen.getByText('Hourly Forecast')).toBeInTheDocument();
  });

  it('should render weather map section', () => {
    render(<WeatherDashboard {...defaultProps} showMap={true} />);

    expect(screen.getByText('Weather Map')).toBeInTheDocument();
  });

  it('should display forecast details on click', async () => {
    render(<WeatherDashboard {...defaultProps} />);

    fireEvent.click(screen.getByText('28°'));

    await waitFor(() => {
      expect(screen.getByText('Details')).toBeInTheDocument();
    });
  });

  it('should display alert recommendations', () => {
    render(<WeatherDashboard {...defaultProps} />);

    expect(screen.getByText('Increase irrigation')).toBeInTheDocument();
    expect(screen.getByText('Provide shade')).toBeInTheDocument();
  });

  it('should show no alerts message when no alerts', () => {
    const dataWithoutAlerts = {
      ...mockWeatherData,
      alerts: [],
    };

    render(<WeatherDashboard {...defaultProps} weatherData={dataWithoutAlerts} />);

    expect(screen.getByText('No active alerts')).toBeInTheDocument();
  });
});
