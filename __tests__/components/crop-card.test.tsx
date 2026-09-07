import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CropCard } from '@/components/crop-card';
import { CropStatus, GrowthStage } from '@prisma/client';

const mockCrop = {
  id: 'crop-1',
  name: 'Tomato Plot A',
  cropTypeId: 'type-1',
  farmId: 'farm-1',
  plantedDate: new Date('2024-03-01'),
  expectedHarvestDate: new Date('2024-05-20'),
  actualHarvestDate: null,
  status: CropStatus.ACTIVE,
  growthStage: GrowthStage.FRUITING,
  area: 2.5,
  areaUnit: 'hectares',
  yieldEstimate: 15000,
  yieldUnit: 'kg',
  costPerUnit: 0.5,
  revenuePerUnit: 2.5,
  createdAt: new Date('2024-03-01'),
  updatedAt: new Date('2024-04-15'),
  cropType: {
    id: 'type-1',
    name: 'Tomato',
    scientificName: 'Solanum lycopersicum',
    growthCycleDays: 80,
    optimalTempMin: 18,
    optimalTempMax: 29,
    optimalRainfall: 600,
    spacingCm: 60,
    waterNeed: 'medium',
    category: 'vegetable',
  },
};

describe('CropCard', () => {
  it('should render crop information correctly', () => {
    render(<CropCard crop={mockCrop} />);

    expect(screen.getByText('Tomato Plot A')).toBeInTheDocument();
    expect(screen.getByText('Tomato')).toBeInTheDocument();
    expect(screen.getByText('2.5 hectares')).toBeInTheDocument();
  });

  it('should display growth stage badge', () => {
    render(<CropCard crop={mockCrop} />);

    expect(screen.getByText('Fruiting')).toBeInTheDocument();
  });

  it('should display status badge', () => {
    render(<CropCard crop={mockCrop} />);

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should show planted date', () => {
    render(<CropCard crop={mockCrop} />);

    expect(screen.getByText(/Planted/)).toBeInTheDocument();
    expect(screen.getByText(/Mar 1, 2024/)).toBeInTheDocument();
  });

  it('should show expected harvest date', () => {
    render(<CropCard crop={mockCrop} />);

    expect(screen.getByText(/Expected Harvest/)).toBeInTheDocument();
    expect(screen.getByText(/May 20, 2024/)).toBeInTheDocument();
  });

  it('should show yield estimate', () => {
    render(<CropCard crop={mockCrop} />);

    expect(screen.getByText(/15,000 kg/)).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<CropCard crop={mockCrop} onClick={handleClick} />);

    fireEvent.click(screen.getByTestId('crop-card'));
    expect(handleClick).toHaveBeenCalledWith('crop-1');
  });

  it('should render with different statuses', () => {
    const harvestedCrop = {
      ...mockCrop,
      status: CropStatus.HARVESTED,
      growthStage: GrowthStage.HARVESTED,
    };

    render(<CropCard crop={harvestedCrop} />);

    expect(screen.getByText('Harvested')).toBeInTheDocument();
  });

  it('should render with different growth stages', () => {
    const seedlingCrop = {
      ...mockCrop,
      growthStage: GrowthStage.SEEDLING,
    };

    render(<CropCard crop={seedlingCrop} />);

    expect(screen.getByText('Seedling')).toBeInTheDocument();
  });

  it('should show health indicator', () => {
    render(<CropCard crop={mockCrop} showHealth={true} healthScore={85} />);

    expect(screen.getByText(/85%/)).toBeInTheDocument();
  });

  it('should handle missing crop type gracefully', () => {
    const cropWithoutType = {
      ...mockCrop,
      cropType: null,
    };

    render(<CropCard crop={cropWithoutType} />);

    expect(screen.getByText('Tomato Plot A')).toBeInTheDocument();
    expect(screen.getByText('Unknown Type')).toBeInTheDocument();
  });

  it('should show action buttons when provided', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();

    render(
      <CropCard
        crop={mockCrop}
        onEdit={onEdit}
        onDelete={onDelete}
        showActions={true}
      />
    );

    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should call onEdit when edit button clicked', () => {
    const onEdit = jest.fn();

    render(
      <CropCard
        crop={mockCrop}
        onEdit={onEdit}
        showActions={true}
      />
    );

    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith('crop-1');
  });

  it('should call onDelete when delete button clicked', () => {
    const onDelete = jest.fn();

    render(
      <CropCard
        crop={mockCrop}
        onDelete={onDelete}
        showActions={true}
      />
    );

    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledWith('crop-1');
  });

  it('should render in compact mode', () => {
    render(<CropCard crop={mockCrop} compact={true} />);

    expect(screen.getByText('Tomato Plot A')).toBeInTheDocument();
    expect(screen.queryByText(/Planted/)).not.toBeInTheDocument();
  });

  it('should show progress bar for growth', () => {
    render(<CropCard crop={mockCrop} showProgress={true} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should calculate days since planted', () => {
    render(<CropCard crop={mockCrop} showDaysPlanted={true} />);

    expect(screen.getByText(/days since planted/)).toBeInTheDocument();
  });

  it('should calculate days until harvest', () => {
    render(<CropCard crop={mockCrop} showDaysToHarvest={true} />);

    expect(screen.getByText(/days until harvest/)).toBeInTheDocument();
  });

  it('should render with different area units', () => {
    const acreCrop = {
      ...mockCrop,
      area: 100,
      areaUnit: 'acres',
    };

    render(<CropCard crop={acreCrop} />);
    expect(screen.getByText('100 acres')).toBeInTheDocument();
  });

  it('should display scientific name', () => {
    render(<CropCard crop={mockCrop} showScientificName={true} />);

    expect(screen.getByText('Solanum lycopersicum')).toBeInTheDocument();
  });
});
