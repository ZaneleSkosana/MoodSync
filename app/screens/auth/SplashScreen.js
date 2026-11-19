import React, { useEffect } from 'react';
import { BrandedLoading } from '../../components/common/BrandedLoading';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return <BrandedLoading message="" footer="v1.0.0" />;
};

export default SplashScreen;
