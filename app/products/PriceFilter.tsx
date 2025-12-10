'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RotateCcw } from 'lucide-react';

interface PriceFilterProps {
  minPrice: number;
  maxPrice: number;
}

const PriceFilter = ({ minPrice, maxPrice }: PriceFilterProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [priceRange, setPriceRange] = useState({
    min: Number(searchParams.get('minPrice')) || minPrice,
    max: Number(searchParams.get('maxPrice')) || maxPrice,
  });

  const [localRange, setLocalRange] = useState([priceRange.min, priceRange.max]);

  useEffect(() => {
    const min = Number(searchParams.get('minPrice')) || minPrice;
    const max = Number(searchParams.get('maxPrice')) || maxPrice;
    setPriceRange({ min, max });
    setLocalRange([min, max]);
  }, [searchParams, minPrice, maxPrice]);

  const handleApplyFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (localRange[0] > minPrice) {
      params.set('minPrice', localRange[0].toString());
    } else {
      params.delete('minPrice');
    }

    if (localRange[1] < maxPrice) {
      params.set('maxPrice', localRange[1].toString());
    } else {
      params.delete('maxPrice');
    }
    
    params.set('page', '1');
    router.push(`/products?${params.toString()}`);
  };

  const handleReset = () => {
    setLocalRange([minPrice, maxPrice]);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('minPrice');
    params.delete('maxPrice');
    params.set('page', '1');
    router.push(`/products?${params.toString()}`);
  };

  const isFiltered = priceRange.min > minPrice || priceRange.max < maxPrice;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Price Range</CardTitle>
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8 px-2 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Slider
            min={minPrice}
            max={maxPrice}
            step={1}
            value={localRange}
            onValueChange={setLocalRange}
            className="w-full"
          />
          <div className="flex items-center justify-between text-sm font-medium">
            <span className="text-muted-foreground">${localRange[0]}</span>
            <span className="text-muted-foreground">—</span>
            <span className="text-muted-foreground">${localRange[1]}</span>
          </div>
        </div>
        <Button
          onClick={handleApplyFilter}
          className="w-full"
          size="sm"
        >
          Apply Filter
        </Button>
      </CardContent>
    </Card>
  );
};

export default PriceFilter;