
import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { getLocalData, localStorageKeys } from '@/lib/localStorage';

export const usePowerBuying = () => {
  const { toast } = useToast();
  const [powerAmount, setPowerAmount] = useState([6000]);
  const [maxAmount, setMaxAmount] = useState(12000);
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [currentBuyingPower, setCurrentBuyingPower] = useState(0);
  const [loading, setLoading] = useState(true);

  const deposit = useMemo(() => {
    const amount = powerAmount[0];
    return amount * 0.10; // 10% sin máximo
  }, [powerAmount]);

  const powerPackages = [
    {
      amount: 6000,
      deposit: 600,
      title: "Básico",
      description: "Ideal para principiantes",
      popular: true
    },
    {
      amount: 12000,
      deposit: 1200,
      title: "Estándar",
      description: "Más opciones de compra",
      popular: false
    },
    {
      amount: 'custom',
      deposit: 'variable',
      title: "Premium",
      description: "Para compras de lujo",
      popular: false
    }
  ];

  useEffect(() => {
    const userData = getLocalData(localStorageKeys.USER_DATA);
    setCurrentBuyingPower(userData?.buying_power || 15000);
    setLoading(false);
  }, []);

  const handleSliderChange = (value) => {
    setPowerAmount(value);
    if (value[0] < maxAmount) {
      setIsCustomAmount(false);
    }
  };

  const handleCustomAmountChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 12000) {
      setPowerAmount([value]);
      setMaxAmount(Math.max(value, 12000));
    } else if (e.target.value === '') {
      setPowerAmount([12000]);
      setMaxAmount(12000);
    }
  };

  const handlePackageSelect = (packageAmount) => {
    if (packageAmount === 'custom') {
      setPowerAmount([12000]);
      setMaxAmount(25000);
      setIsCustomAmount(true);
    } else {
      setPowerAmount([packageAmount]);
      setMaxAmount(Math.max(packageAmount, 12000));
      setIsCustomAmount(packageAmount > 12000);
    }
  };

  const generateStripeLink = (amount, deposit) => {
    const baseUrl = "https://checkout.stripe.com/pay/";
    const sessionId = `cs_test_${Math.random().toString(36).substr(2, 9)}`;
    
    const params = new URLSearchParams({
      amount: (deposit * 100).toString(),
      currency: 'usd',
      power_amount: amount.toString(),
      success_url: `${window.location.origin}/dashboard/deposits?success=true`,
      cancel_url: `${window.location.origin}/dashboard/power-buying?canceled=true`
    });

    return `${baseUrl}${sessionId}?${params.toString()}`;
  };

  const handleRequestPower = async (e) => {
    e.preventDefault();
    
    toast({
      title: "Modo Demo",
      description: "🚧 Esta función no está implementada aún—¡pero no te preocupes! ¡Puedes solicitarla en tu próximo prompt! 🚀",
      variant: "destructive"
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return {
    powerAmount,
    maxAmount,
    isCustomAmount,
    currentBuyingPower,
    loading,
    deposit,
    powerPackages,
    handleSliderChange,
    handleCustomAmountChange,
    handlePackageSelect,
    handleRequestPower,
    formatCurrency,
    setIsCustomAmount,
    isDemoMode: true
  };
};
