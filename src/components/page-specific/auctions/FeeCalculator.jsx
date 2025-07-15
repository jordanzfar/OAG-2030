import React from 'react';
import { motion } from 'framer-motion';
import AnimatedNumber from './AnimatedNumber';
import { Table, TableBody, TableCell, TableRow, TableFooter, TableHead } from "@/components/ui/table";

const FeeCalculator = ({ fees }) => {
  // Ya no necesitamos la comprobación 'if (!fees)' porque siempre recibirá un objeto.

  return (
    <motion.div 
      key="fees-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-lg bg-muted/50 p-4 border self-start"
    >
      <h4 className="font-semibold mb-3 text-center text-muted-foreground">Desglose de Tarifas Estimadas</h4>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="text-muted-foreground">Puja Máxima</TableCell>
            <TableCell className="text-right font-medium text-lg">
              <AnimatedNumber value={fees.bid} />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-muted-foreground">Buyer's Fee</TableCell>
            <TableCell className="text-right">
              <AnimatedNumber value={fees.buyer_fee} />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-muted-foreground">Internet Fee</TableCell>
            <TableCell className="text-right">
              <AnimatedNumber value={fees.internet_fee} />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-muted-foreground">Tarifa Opulent</TableCell>
            <TableCell className="text-right">
              <AnimatedNumber value={fees.opulent_fee} />
            </TableCell>
          </TableRow>
           <TableRow>
            <TableCell className="text-muted-foreground">Tarifas de Proceso</TableCell>
            <TableCell className="text-right">
              <AnimatedNumber value={fees.processing_fees} />
            </TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow className="text-xl font-bold hover:bg-transparent">
            <TableHead>Total Estimado</TableHead>
            <TableHead className="text-right text-primary">
              <AnimatedNumber value={fees.total} />
            </TableHead>
          </TableRow>
        </TableFooter>
      </Table>
    </motion.div>
  );
};

export default FeeCalculator;