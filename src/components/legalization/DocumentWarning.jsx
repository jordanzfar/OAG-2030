import React from 'react';
import { AlertTriangle } from 'lucide-react';

const DocumentWarning = ({ missingDocs }) => {
  if (missingDocs.length === 0) return null;
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Documentos Faltantes</h4>
          <p className="text-sm text-yellow-700 mb-2">
            Los siguientes documentos son requeridos. El proceso no se completará hasta que subas todos los documentos:
          </p>
          <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
            {missingDocs.map((doc, index) => (
              <li key={index}>{doc}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DocumentWarning;