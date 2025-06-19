import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, ChartTooltip, Legend);

const UserVerificationChart = ({ data, totalUsers }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false, // Allow chart to resize within container
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'hsl(var(--foreground))', // Use CSS variable for text color
          padding: 15,
          font: {
             size: 12,
          }
        },
      },
      tooltip: {
        enabled: true, // Use Chart.js tooltip
        backgroundColor: 'hsla(var(--popover), 0.9)',
        titleColor: 'hsl(var(--popover-foreground))',
        bodyColor: 'hsl(var(--popover-foreground))',
        borderColor: 'hsl(var(--border))',
        borderWidth: 1,
        padding: 10,
        usePointStyle: true,
        callbacks: {
           label: function(context) {
                let label = context.label || '';
                if (label) {
                    label += ': ';
                }
                if (context.parsed !== null) {
                    const value = context.parsed;
                    const percentage = totalUsers > 0 ? ((value / totalUsers) * 100).toFixed(1) : 0;
                    label += `${value} (${percentage}%)`;
                }
                return label;
            }
        }
      },
    },
    cutout: '60%', // Make it a doughnut chart
  };

  return <Doughnut data={data} options={options} />;
};

export default UserVerificationChart;