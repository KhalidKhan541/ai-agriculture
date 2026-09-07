import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FarmCard } from '@/components/farm-card';

const mockFarm = {
  id: 'farm-1',
  name: 'Green Valley Farm',
  location: 'California, USA',
  latitude: 36.7783,
  longitude: -119.4179,
  area: 500,
  areaUnit: 'acres',
  soilType: 'loamy',
  ownerId: 'user-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-07-15'),
  crops: [
    {
      id: 'crop-1',
      name: 'Tomato Plot A',
      status: 'ACTIVE',
      growthStage: 'FRUITING',
    },
    {
      id: 'crop-2',
      name: 'Corn Field',
      status: 'ACTIVE',
      growthStage: 'VEGETATIVE',
    },
  ],
  sensors: [
    {
      id: 'sensor-1',
      name: 'Field Sensor A',
      status: 'active',
    },
  ],
  irrigationSystems: [
    {
      id: 'irr-1',
      name: 'Drip System - Zone A',
      status: 'ACTIVE',
    },
  ],
};

describe('FarmCard', () => {
  const defaultProps = {
    farm: mockFarm,
    onClick: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render farm name', () => {
    render(<FarmCard {...defaultProps} />);
    expect(screen.getByText('Green Valley Farm')).toBeInTheDocument();
  });

  it('should render farm location', () => {
    render(<FarmCard {...defaultProps} />);
    expect(screen.getByText('California, USA')).toBeInTheDocument();
  });

  it('should render farm area', () => {
    render(<FarmCard {...defaultProps} />);
    expect(screen.getByText('500 acres')).toBeInTheDocument();
  });

  it('should render soil type', () => {
    render(<FarmCard {...defaultProps} />);
    expect(screen.getByText('Loamy')).toBeInTheDocument();
  });

  it('should display crop count', () => {
    render(<FarmCard {...defaultProps} />);
    expect(screen.getByText('2 Crops')).toBeInTheDocument();
  });

  it('should display sensor count', () => {
    render(<FarmCard {...defaultProps} />);
    expect(screen.getByText('1 Sensor')).toBeInTheDocument();
  });

  it('should display irrigation system count', () => {
    render(<FarmCard {...defaultProps} />);
    expect(screen.getByText('1 Irrigation System')).toBeInTheDocument();
  });

  it('should call onClick when card clicked', () => {
    render(<FarmCard {...defaultProps} />);

    fireEvent.click(screen.getByTestId('farm-card'));
    expect(defaultProps.onClick).toHaveBeenCalledWith('farm-1');
  });

  it('should display crop status badges', () => {
    render(<FarmCard {...defaultProps} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should display growth stage badges', () => {
    render(<FarmCard {...defaultProps} />);
    expect(screen.getByText('Fruiting')).toBeInTheDocument();
    expect(screen.getByText('Vegetative')).toBeInTheDocument();
  });

  it('should render action buttons', () => {
    render(<FarmCard {...defaultProps} showActions={true} />);

    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should call onEdit when edit button clicked', () => {
    render(<FarmCard {...defaultProps} showActions={true} />);

    fireEvent.click(screen.getByText('Edit'));
    expect(defaultProps.onEdit).toHaveBeenCalledWith('farm-1');
  });

  it('should call onDelete when delete button clicked', () => {
    render(<FarmCard {...defaultProps} showActions={true} />);

    fireEvent.click(screen.getByText('Delete'));
    expect(defaultProps.onDelete).toHaveBeenCalledWith('farm-1');
  });

  it('should show map preview', () => {
    render(<FarmCard {...defaultProps} showMap={true} />);

    expect(screen.getByText('View Map')).toBeInTheDocument();
  });

  it('should show farm image', () => {
    const farmWithImage = {
      ...mockFarm,
      images: ['farm-image.jpg'],
    };

    render(<FarmCard {...defaultProps} farm={farmWithImage} />);
    expect(screen.getByAltText('Green Valley Farm')).toBeInTheDocument();
  });

  it('should show created date', () => {
    render(<FarmCard {...defaultProps} showCreatedDate={true} />);
    expect(screen.getByText(/Created/)).toBeInTheDocument();
  });

  it('should show last updated date', () => {
    render(<FarmCard {...defaultProps} showLastUpdated={true} />);
    expect(screen.getByText(/Last Updated/)).toBeInTheDocument();
  });

  it('should render in compact mode', () => {
    render(<FarmCard {...defaultProps} compact={true} />);

    expect(screen.getByText('Green Valley Farm')).toBeInTheDocument();
    expect(screen.queryByText('Loamy')).not.toBeInTheDocument();
  });

  it('should render in list mode', () => {
    render(<FarmCard {...defaultProps} mode="list" />);

    expect(screen.getByText('Green Valley Farm')).toBeInTheDocument();
  });

  it('should render in grid mode', () => {
    render(<FarmCard {...defaultProps} mode="grid" />);

    expect(screen.getByText('Green Valley Farm')).toBeInTheDocument();
  });

  it('should show crop summary when expanded', () => {
    render(<FarmCard {...defaultProps} expanded={true} />);

    expect(screen.getByText('Tomato Plot A')).toBeInTheDocument();
    expect(screen.getByText('Corn Field')).toBeInTheDocument();
  });

  it('should show quick stats', () => {
    render(<FarmCard {...defaultProps} showStats={true} />);

    expect(screen.getByText('Quick Stats')).toBeInTheDocument();
  });

  it('should display coordinates', () => {
    render(<FarmCard {...defaultProps} showCoordinates={true} />);

    expect(screen.getByText(/36.7783/)).toBeInTheDocument();
    expect(screen.getByText(/-119.4179/)).toBeInTheDocument();
  });

  it('should show health status', () => {
    render(<FarmCard {...defaultProps} healthScore={85} />);
    expect(screen.getByText(/85%/)).toBeInTheDocument();
  });

  it('should handle empty crops array', () => {
    const farmWithoutCrops = {
      ...mockFarm,
      crops: [],
    };

    render(<FarmCard {...defaultProps} farm={farmWithoutCrops} />);
    expect(screen.getByText('0 Crops')).toBeInTheDocument();
  });

  it('should handle multiple sensors', () => {
    const farmWithMultipleSensors = {
      ...mockFarm,
      sensors: [
        { id: 'sensor-1', name: 'Sensor 1', status: 'active' },
        { id: 'sensor-2', name: 'Sensor 2', status: 'active' },
        { id: 'sensor-3', name: 'Sensor 3', status: 'inactive' },
      ],
    };

    render(<FarmCard {...defaultProps} farm={farmWithMultipleSensors} />);
    expect(screen.getByText('3 Sensors')).toBeInTheDocument();
  });

  it('should show alert indicators', () => {
    const farmWithAlerts = {
      ...mockFarm,
      alerts: [
        {
          id: 'alert-1',
          type: 'weather',
          message: 'Heat wave warning',
          severity: 'high',
        },
      ],
    };

    render(<FarmCard {...defaultProps} farm={farmWithAlerts} />);
    expect(screen.getByText('1 Alert')).toBeInTheDocument();
  });

  it('should show warning indicators', () => {
    const farmWithWarnings = {
      ...mockFarm,
      warnings: [
        {
          id: 'warn-1',
          type: 'irrigation',
          message: 'Low water pressure',
        },
      ],
    };

    render(<FarmCard {...defaultProps} farm={farmWithWarnings} />);
    expect(screen.getByText('1 Warning')).toBeInTheDocument();
  });
});
