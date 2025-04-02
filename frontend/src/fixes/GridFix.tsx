import React from 'react';
import { Grid as MuiGrid } from '@mui/material';
import { ElementType } from 'react';
import { GridProps, GridTypeMap } from '@mui/material/Grid';

// Definizione dell'interfaccia estesa che include esplicitamente le proprietà necessarie
interface EnhancedGridProps extends GridProps {
  item?: boolean;
  container?: boolean;
  xs?: number | 'auto' | boolean;
  sm?: number | 'auto' | boolean;
  md?: number | 'auto' | boolean;
  lg?: number | 'auto' | boolean;
  xl?: number | 'auto' | boolean;
  component?: ElementType;
}

// Componente Grid personalizzato che risolve i problemi di tipizzazione
// con le proprietà item, xs, md, etc.
const Grid: React.FC<EnhancedGridProps> = (props) => {
  return <MuiGrid {...props} />;
};

export default Grid;
