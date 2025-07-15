import React, { useEffect } from 'react';
import { useMotionValue, useSpring, animate } from 'framer-motion';

// Formateador de moneda para consistencia
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const AnimatedNumber = ({ value }) => {
  const motionValue = useMotionValue(0);
  // Usamos useSpring para una animación más natural
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 200,
  });

  useEffect(() => {
    // Anima el motionValue al nuevo valor cuando el prop 'value' cambie
    const animation = animate(motionValue, value, {
      duration: 0.6,
      ease: "easeOut",
    });
    return animation.stop;
  }, [value, motionValue]);

  useEffect(() => {
    // Actualiza el contenido del span con el valor animado
    const unsubscribe = springValue.on("change", (latest) => {
      const element = document.getElementById(`animated-number-${value}`);
      if (element) {
        element.textContent = currencyFormatter.format(latest);
      }
    });
    return unsubscribe;
  }, [springValue, value]);
  
  // Usamos el ID para que el useEffect pueda encontrar el elemento correcto
  return <span id={`animated-number-${value}`}>{currencyFormatter.format(value)}</span>;
};

export default AnimatedNumber;